'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/require-role';
import { parseChildrenCsv, importChildren, type RowError } from '@/lib/children-import';

const MAX_BYTES = 2_000_000; // 2 MB

function getFile(formData: FormData): File | { error: string } {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV file to import.' };
  if (file.size > MAX_BYTES) return { error: 'That file is too large (max 2 MB).' };
  return file;
}

export type ImportPreviewState = {
  fatal?: string;
  validCount?: number;
  total?: number;
  errors?: RowError[];
  sample?: string[];
};

export async function previewImportAction(_prev: ImportPreviewState, formData: FormData): Promise<ImportPreviewState> {
  await requireRole(['admin']);
  const f = getFile(formData);
  if ('error' in f) return { fatal: f.error };
  const p = parseChildrenCsv(await f.text());
  if (p.fatal) return { fatal: p.fatal };
  return { validCount: p.valid.length, total: p.totalRows, errors: p.errors.slice(0, 100), sample: p.sample };
}

export type ImportResultState = { error?: string; imported?: number; emailed?: number; skipped?: number };

export async function importChildrenAction(_prev: ImportResultState, formData: FormData): Promise<ImportResultState> {
  const staff = await requireRole(['admin']);
  const f = getFile(formData);
  if ('error' in f) return { error: f.error };

  const p = parseChildrenCsv(await f.text());
  if (p.fatal) return { error: p.fatal };
  if (p.valid.length === 0) return { error: 'No valid rows to import.' };

  const sendEmails = formData.get('sendEmails') === 'on';
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const appUrl = process.env.APP_URL || (host ? `${proto}://${host}` : '');

  const { imported, emailed } = await importChildren(staff.id, p.valid, { sendEmails, appUrl });
  revalidatePath('/children');
  revalidatePath('/dashboard');
  return { imported, emailed, skipped: p.errors.length };
}
