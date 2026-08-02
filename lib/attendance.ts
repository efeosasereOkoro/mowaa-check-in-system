import { and, eq, gt, inArray, lte, sql, asc } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { attendanceLog, eventDays, pickupPersons } from '@/db/schema';

export type ChildStatus = 'not_arrived' | 'checked_in' | 'checked_out';
export type EventDay = { id: string; dayNumber: number; label: string | null };
export type ChildDayStatus = {
  status: ChildStatus;
  inAt: string | null;
  outAt: string | null;
  collectorLabel: string | null;
};
export type ActionResult = { ok?: true; error?: string };

function hhmm(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' });
}

function dmy(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' });
}

export type ChildAttendanceDay = {
  dayNumber: number;
  dayLabel: string;
  date: string | null;
  inAt: string | null;
  outAt: string | null;
  collector: string | null;
  override: boolean;
};

/**
 * One child's full attendance history, one row per event day the child has records on
 * (ordered by day). Folds the append-only log into a per-day summary: first check-in,
 * last check-out + its collector snapshot, and whether any override happened that day.
 * Runs under the caller's RLS (attendance_select: admin/receptionist/health, tenant-scoped).
 */
export async function getChildAttendance(staffId: string, childId: string): Promise<ChildAttendanceDay[]> {
  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({
        dayNumber: eventDays.dayNumber,
        dayLabel: eventDays.label,
        action: attendanceLog.action,
        occurredAt: attendanceLog.occurredAt,
        collectorLabel: attendanceLog.collectorLabel,
        isOverride: attendanceLog.isOverride,
      })
      .from(attendanceLog)
      .innerJoin(eventDays, eq(eventDays.id, attendanceLog.eventDayId))
      .where(eq(attendanceLog.childId, childId))
      .orderBy(asc(eventDays.dayNumber), asc(attendanceLog.occurredAt));

    const byDay = new Map<number, ChildAttendanceDay>();
    for (const r of rows) {
      const d =
        byDay.get(r.dayNumber) ??
        {
          dayNumber: r.dayNumber,
          dayLabel: r.dayLabel ?? `Day ${r.dayNumber}`,
          date: null,
          inAt: null,
          outAt: null,
          collector: null,
          override: false,
        };
      if (!d.date) d.date = dmy(r.occurredAt);
      if (r.action === 'check_in') {
        if (!d.inAt) d.inAt = hhmm(r.occurredAt); // first check-in of the day
      } else {
        d.outAt = hhmm(r.occurredAt); // last check-out of the day
        d.collector = r.collectorLabel;
      }
      if (r.isOverride) d.override = true;
      byDay.set(r.dayNumber, d);
    }
    return [...byDay.values()];
  });
}

// The event day whose GMT+1 window contains now(), or null (outside event hours).
export async function getCurrentEventDay(staffId: string): Promise<EventDay | null> {
  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({ id: eventDays.id, dayNumber: eventDays.dayNumber, label: eventDays.label })
      .from(eventDays)
      .where(and(lte(eventDays.startsAt, sql`now()`), gt(eventDays.endsAt, sql`now()`)))
      .orderBy(asc(eventDays.dayNumber))
      .limit(1);
    return rows[0] ?? null;
  });
}

/** Today's status per child (given the current event day). */
export async function getDayStatuses(
  staffId: string,
  eventDayId: string,
  childIds: string[],
): Promise<Record<string, ChildDayStatus>> {
  const out: Record<string, ChildDayStatus> = {};
  for (const id of childIds) out[id] = { status: 'not_arrived', inAt: null, outAt: null, collectorLabel: null };
  if (childIds.length === 0) return out;

  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({
        childId: attendanceLog.childId,
        action: attendanceLog.action,
        occurredAt: attendanceLog.occurredAt,
        collectorLabel: attendanceLog.collectorLabel,
      })
      .from(attendanceLog)
      .where(and(eq(attendanceLog.eventDayId, eventDayId), inArray(attendanceLog.childId, childIds)))
      .orderBy(asc(attendanceLog.occurredAt));

    for (const r of rows) {
      const s = out[r.childId];
      if (!s) continue;
      if (r.action === 'check_in') {
        s.status = 'checked_in';
        s.inAt = hhmm(r.occurredAt);
      } else {
        s.status = 'checked_out';
        s.outAt = hhmm(r.occurredAt);
        s.collectorLabel = r.collectorLabel;
      }
    }
    return out;
  });
}

async function statusInTx(tx: Parameters<Parameters<typeof withStaffContext>[1]>[0], eventDayId: string, childId: string): Promise<ChildStatus> {
  const rows = await tx
    .select({ action: attendanceLog.action })
    .from(attendanceLog)
    .where(and(eq(attendanceLog.eventDayId, eventDayId), eq(attendanceLog.childId, childId)))
    .orderBy(asc(attendanceLog.occurredAt));
  let status: ChildStatus = 'not_arrived';
  for (const r of rows) status = r.action === 'check_in' ? 'checked_in' : 'checked_out';
  return status;
}

async function currentDayInTx(tx: Parameters<Parameters<typeof withStaffContext>[1]>[0]): Promise<EventDay | null> {
  const rows = await tx
    .select({ id: eventDays.id, dayNumber: eventDays.dayNumber, label: eventDays.label })
    .from(eventDays)
    .where(and(lte(eventDays.startsAt, sql`now()`), gt(eventDays.endsAt, sql`now()`)))
    .orderBy(asc(eventDays.dayNumber))
    .limit(1);
  return rows[0] ?? null;
}

/** Check a child in. Enforces one check-in/out per day unless `override` (admin). */
export async function checkIn(
  staffId: string,
  childId: string,
  opts: { override?: boolean; reason?: string } = {},
): Promise<ActionResult> {
  return withStaffContext(staffId, async (tx) => {
    const day = await currentDayInTx(tx);
    if (!day) return { error: 'Check-in is only available during event hours.' };
    const status = await statusInTx(tx, day.id, childId);
    if (!opts.override) {
      if (status === 'checked_in') return { error: 'Already checked in today.' };
      if (status === 'checked_out')
        return { error: 'Already checked out today — an admin override is required to check in again.' };
    } else if (!opts.reason?.trim()) {
      return { error: 'A reason is required for an override.' };
    }
    await tx.insert(attendanceLog).values({
      childId,
      eventDayId: day.id,
      action: 'check_in',
      staffId,
      isOverride: !!opts.override,
      overrideReason: opts.override ? opts.reason?.trim() ?? null : null,
    });
    return { ok: true };
  });
}

/** Check a child out, recording the collector. Requires the child to be checked in. */
export async function checkOut(
  staffId: string,
  childId: string,
  collector: { pickupPersonId: string | null; label: string },
): Promise<ActionResult> {
  return withStaffContext(staffId, async (tx) => {
    const day = await currentDayInTx(tx);
    if (!day) return { error: 'Check-out is only available during event hours.' };
    if (!collector.label?.trim()) return { error: 'Select who is collecting the child.' };
    const status = await statusInTx(tx, day.id, childId);
    if (status !== 'checked_in') return { error: 'This child is not currently checked in.' };
    await tx.insert(attendanceLog).values({
      childId,
      eventDayId: day.id,
      action: 'check_out',
      staffId,
      collectorPickupPersonId: collector.pickupPersonId,
      collectorLabel: collector.label.trim(),
    });
    return { ok: true };
  });
}

/** Guardian + pickup persons for the check-out collector selection. */
export async function getCheckoutInfo(staffId: string, childId: string) {
  return withStaffContext(staffId, async (tx) => {
    const persons = await tx
      .select({ id: pickupPersons.id, name: pickupPersons.name, relationship: pickupPersons.relationship })
      .from(pickupPersons)
      .where(eq(pickupPersons.childId, childId))
      .orderBy(asc(pickupPersons.createdAt));
    return { pickups: persons };
  });
}
