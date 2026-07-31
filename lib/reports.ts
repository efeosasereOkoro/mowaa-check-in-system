import { and, asc, eq } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { attendanceLog, children, eventDays, medicalNotes, pickupPersons, staff, tags } from '@/db/schema';

/**
 * Reports & CSV export (Admin only) — E9.
 * FR-16 per-day attendance report, FR-17 CSV export of register + attendance log,
 * FR-18 end-of-day flags (still checked in + Emergency-note count).
 * CSV (not native .xlsx) per D-006 — opens in Excel; see BACKLOG B-006.
 */

export type AttendanceRow = {
  dayNumber: number;
  dayLabel: string; // "Day 3" / the day's label
  date: string; // "6 Aug 2026" (GMT+1)
  time: string; // "14:22"
  child: string; // "Amara Okeke"
  action: 'Check in' | 'Check out';
  staff: string; // staff name or "—"
  collector: string; // collector snapshot (check-out only) or ""
  isOverride: boolean;
  overrideReason: string | null;
};

export type StillInRow = { child: string; tag: string | null; inAt: string };
export type EndOfDayFlags = { stillCheckedIn: StillInRow[]; emergencyCount: number };

function timeOf(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' });
}
function dateOf(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' });
}
const actionLabel = (a: 'check_in' | 'check_out'): 'Check in' | 'Check out' =>
  a === 'check_in' ? 'Check in' : 'Check out';

/**
 * Attendance report rows. `dayId = null` → all days (ordered day then time);
 * a specific `dayId` → just that day. FR-16.
 */
export async function getAttendanceReport(staffId: string, dayId: string | null): Promise<AttendanceRow[]> {
  return withStaffContext(staffId, async (tx) => {
    const base = tx
      .select({
        dayNumber: eventDays.dayNumber,
        dayLabel: eventDays.label,
        occurredAt: attendanceLog.occurredAt,
        childFirst: children.firstName,
        childLast: children.lastName,
        action: attendanceLog.action,
        staffName: staff.name,
        collectorLabel: attendanceLog.collectorLabel,
        isOverride: attendanceLog.isOverride,
        overrideReason: attendanceLog.overrideReason,
      })
      .from(attendanceLog)
      .innerJoin(children, eq(children.id, attendanceLog.childId))
      .innerJoin(eventDays, eq(eventDays.id, attendanceLog.eventDayId))
      .leftJoin(staff, eq(staff.id, attendanceLog.staffId));

    const rows = await (dayId ? base.where(eq(attendanceLog.eventDayId, dayId)) : base).orderBy(
      asc(eventDays.dayNumber),
      asc(attendanceLog.occurredAt),
    );

    return rows.map((r) => ({
      dayNumber: r.dayNumber,
      dayLabel: r.dayLabel ?? `Day ${r.dayNumber}`,
      date: dateOf(r.occurredAt),
      time: timeOf(r.occurredAt),
      child: `${r.childFirst} ${r.childLast}`,
      action: actionLabel(r.action),
      staff: r.staffName ?? '—',
      collector: r.collectorLabel ?? '',
      isOverride: r.isOverride,
      overrideReason: r.overrideReason,
    }));
  });
}

/** End-of-day flags for one day: children still checked in + Emergency-note count. FR-18. */
export async function getEndOfDayFlags(staffId: string, eventDayId: string): Promise<EndOfDayFlags> {
  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({
        childId: attendanceLog.childId,
        action: attendanceLog.action,
        occurredAt: attendanceLog.occurredAt,
        first: children.firstName,
        last: children.lastName,
        tag: tags.code,
      })
      .from(attendanceLog)
      .innerJoin(children, eq(children.id, attendanceLog.childId))
      .leftJoin(tags, and(eq(tags.childId, children.id), eq(tags.active, true)))
      .where(eq(attendanceLog.eventDayId, eventDayId))
      .orderBy(asc(attendanceLog.occurredAt));

    const state = new Map<string, { in: boolean; inAt: string; child: string; tag: string | null }>();
    for (const r of rows) {
      const child = `${r.first} ${r.last}`;
      const cur = state.get(r.childId) ?? { in: false, inAt: '', child, tag: r.tag };
      if (r.action === 'check_in') {
        cur.in = true;
        cur.inAt = timeOf(r.occurredAt);
      } else {
        cur.in = false;
      }
      cur.child = child;
      cur.tag = r.tag;
      state.set(r.childId, cur);
    }

    const stillCheckedIn: StillInRow[] = [...state.values()]
      .filter((s) => s.in)
      .map((s) => ({ child: s.child, tag: s.tag, inAt: s.inAt }))
      .sort((a, b) => a.child.localeCompare(b.child));

    const emg = await tx
      .select({ id: medicalNotes.id })
      .from(medicalNotes)
      .where(and(eq(medicalNotes.severity, 'emergency'), eq(medicalNotes.eventDayId, eventDayId)));

    return { stillCheckedIn, emergencyCount: emg.length };
  });
}

export type RegisterRow = {
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  homeAddress: string | null;
  healthDetails: string | null;
  tag: string | null;
  pickups: string; // "Name (Relationship); …"
};

/** Full children register for CSV export (admin RLS sees all columns). FR-17. */
export async function getRegisterExport(staffId: string): Promise<RegisterRow[]> {
  return withStaffContext(staffId, async (tx) => {
    const kids = await tx
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        age: children.age,
        guardianName: children.guardianName,
        guardianPhone: children.guardianPhone,
        homeAddress: children.homeAddress,
        healthDetails: children.healthDetails,
        tag: tags.code,
      })
      .from(children)
      .leftJoin(tags, and(eq(tags.childId, children.id), eq(tags.active, true)))
      .orderBy(asc(children.firstName), asc(children.lastName));

    const persons = await tx
      .select({ childId: pickupPersons.childId, name: pickupPersons.name, relationship: pickupPersons.relationship })
      .from(pickupPersons)
      .orderBy(asc(pickupPersons.createdAt));

    const byChild = new Map<string, string[]>();
    for (const p of persons) {
      const list = byChild.get(p.childId) ?? [];
      list.push(`${p.name} (${p.relationship})`);
      byChild.set(p.childId, list);
    }

    return kids.map((k) => ({
      firstName: k.firstName,
      lastName: k.lastName,
      age: k.age,
      guardianName: k.guardianName,
      guardianPhone: k.guardianPhone,
      homeAddress: k.homeAddress,
      healthDetails: k.healthDetails,
      tag: k.tag,
      pickups: (byChild.get(k.id) ?? []).join('; '),
    }));
  });
}

// ---------- CSV helpers ----------

const csvEscape = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Build a CSV string (with a UTF-8 BOM so Excel renders accented names correctly). */
export function buildCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(r.map(csvEscape).join(','));
  return '﻿' + lines.join('\r\n');
}
