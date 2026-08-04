import { withStaffContext } from '@/lib/db-authenticated';
import { children, tags } from '@/db/schema';
import type { NewChildInput } from '@/lib/children';
import { sendChildRegistrationEmail } from '@/lib/emails/child-registration';

// Bulk children import from a CSV (admin, B-052). Parse + validate client-agnostically here,
// then insert all valid rows in ONE transaction (auto-assigning each a tag), so a large file
// doesn't fan out into hundreds of round-trips. Optional per-import guardian emails.

export const MAX_IMPORT_ROWS = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Header (lower-cased) → field. Required headers must be present; others are optional columns.
const HEADER_FIELD: Record<string, keyof NewChildInput> = {
  'first name': 'firstName',
  'last name': 'lastName',
  age: 'age',
  'guardian name': 'guardianName',
  'guardian phone': 'guardianPhone',
  'guardian email': 'guardianEmail',
  'home address': 'homeAddress',
  'health details': 'healthDetails',
};
const REQUIRED = ['first name', 'last name', 'guardian name', 'guardian phone'];
const LABEL: Record<string, string> = {
  'first name': 'First name',
  'last name': 'Last name',
  'guardian name': 'Guardian name',
  'guardian phone': 'Guardian phone',
};

export type RowError = { row: number; reason: string };
export type ParseResult = {
  fatal?: string; // whole-file problem (empty / missing columns / too big)
  valid: NewChildInput[];
  errors: RowError[];
  totalRows: number; // non-empty data rows seen
  sample: string[]; // first few child names, for the preview
};

// Minimal RFC-4180-ish CSV parser: handles quoted fields, "" escapes, and commas/newlines
// inside quotes. Returns a grid of string cells.
function parseCsv(input: string): string[][] {
  const s = input.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseChildrenCsv(text: string): ParseResult {
  const empty: ParseResult = { valid: [], errors: [], totalRows: 0, sample: [] };
  const grid = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (grid.length === 0) return { ...empty, fatal: 'The file is empty.' };
  if (grid.length < 2) return { ...empty, fatal: 'The file has a header row but no data rows.' };

  const header = grid[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED.filter((h) => !header.includes(h));
  if (missing.length) {
    return { ...empty, fatal: `Missing required column(s): ${missing.map((m) => LABEL[m]).join(', ')}. Use the template.` };
  }
  const idx = (h: string) => header.indexOf(h);

  const dataRows = grid.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return { ...empty, fatal: `Too many rows (${dataRows.length}). The limit is ${MAX_IMPORT_ROWS} per import.` };
  }

  const valid: NewChildInput[] = [];
  const errors: RowError[] = [];
  const cell = (r: string[], h: string) => {
    const i = idx(h);
    return i >= 0 ? (r[i] ?? '').trim() : '';
  };

  dataRows.forEach((r, i) => {
    const rowNo = i + 2; // header is row 1
    const firstName = cell(r, 'first name');
    const lastName = cell(r, 'last name');
    const guardianName = cell(r, 'guardian name');
    const guardianPhone = cell(r, 'guardian phone');
    if (!firstName || !lastName || !guardianName || !guardianPhone) {
      const miss = [
        !firstName && 'First name',
        !lastName && 'Last name',
        !guardianName && 'Guardian name',
        !guardianPhone && 'Guardian phone',
      ].filter(Boolean);
      errors.push({ row: rowNo, reason: `Missing ${miss.join(', ')}` });
      return;
    }

    const ageRaw = cell(r, 'age');
    let age: number | null = null;
    if (ageRaw) {
      const n = Number(ageRaw);
      if (!Number.isInteger(n) || n < 0 || n > 120) {
        errors.push({ row: rowNo, reason: `Age "${ageRaw}" must be a whole number 0–120` });
        return;
      }
      age = n;
    }

    const guardianEmail = cell(r, 'guardian email') || null;
    if (guardianEmail && !EMAIL_RE.test(guardianEmail)) {
      errors.push({ row: rowNo, reason: `Guardian email "${guardianEmail}" is not valid` });
      return;
    }

    valid.push({
      firstName,
      lastName,
      age,
      guardianName,
      guardianPhone,
      guardianEmail,
      homeAddress: cell(r, 'home address') || null,
      healthDetails: cell(r, 'health details') || null,
    });
  });

  return { valid, errors, totalRows: dataRows.length, sample: valid.slice(0, 5).map((v) => `${v.firstName} ${v.lastName}`) };
}

// A readable, unique tag code from the child's name, avoiding codes already used (existing +
// this batch). Pure/in-memory so the whole import stays a single transaction.
function generateCode(firstName: string, lastName: string, used: Set<string>): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = clean(firstName).slice(0, 2) + clean(lastName).slice(0, 2) || 'CH';
  for (let i = 0; i < 50; i++) {
    const candidate = `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;
    if (!used.has(candidate)) return candidate;
  }
  let n = 1;
  let fallback = `${prefix}-X${n}`;
  while (used.has(fallback)) fallback = `${prefix}-X${++n}`;
  return fallback;
}

export type ImportOutcome = { imported: number; emailed: number };

/** Insert all rows + auto-assign a tag each, in one transaction (admin RLS). Emails (if
 * requested) are sent best-effort AFTER commit so the DB transaction isn't held open on I/O. */
export async function importChildren(
  staffId: string,
  rows: NewChildInput[],
  opts: { sendEmails: boolean; appUrl: string },
): Promise<ImportOutcome> {
  const toEmail: { to: string; guardianName: string; childName: string; tagCode: string; qrToken: string }[] = [];

  const imported = await withStaffContext(staffId, async (tx) => {
    // Preload existing tag codes (RLS-scoped to this tenant) so tag generation is in-memory.
    const used = new Set((await tx.select({ code: tags.code }).from(tags)).map((r) => r.code));
    let count = 0;
    for (const row of rows) {
      const [child] = await tx.insert(children).values(row).returning({ id: children.id, qrToken: children.qrToken });
      if (!child) continue;
      const code = generateCode(row.firstName, row.lastName, used);
      used.add(code);
      await tx.insert(tags).values({ childId: child.id, code, active: true });
      count++;
      if (opts.sendEmails && row.guardianEmail) {
        toEmail.push({
          to: row.guardianEmail,
          guardianName: row.guardianName,
          childName: `${row.firstName} ${row.lastName}`,
          tagCode: code,
          qrToken: child.qrToken,
        });
      }
    }
    return count;
  });

  let emailed = 0;
  for (const e of toEmail) {
    try {
      const res = await sendChildRegistrationEmail({
        to: e.to,
        guardianName: e.guardianName,
        childName: e.childName,
        tagCode: e.tagCode,
        qrToken: e.qrToken,
        appUrl: opts.appUrl,
      });
      if (res.ok && !res.skipped) emailed++;
    } catch {
      /* best-effort */
    }
  }

  return { imported, emailed };
}
