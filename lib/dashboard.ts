import { and, asc, eq } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { attendanceLog, children, eventDays, tags } from '@/db/schema';
import type { ChildStatus } from '@/lib/attendance';

export type EventDayListItem = { id: string; dayNumber: number; label: string | null; startsAt: Date };
export type RosterRow = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  tagCode: string | null;
  status: ChildStatus;
  inAt: string | null;
  outAt: string | null;
};
export type Counters = { total: number; checkedIn: number; checkedOut: number; notArrived: number };

function hhmm(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' });
}

export async function getEventDaysList(staffId: string): Promise<EventDayListItem[]> {
  return withStaffContext(staffId, (tx) =>
    tx
      .select({ id: eventDays.id, dayNumber: eventDays.dayNumber, label: eventDays.label, startsAt: eventDays.startsAt })
      .from(eventDays)
      .orderBy(asc(eventDays.dayNumber)),
  );
}

/** Roster (all children with their status for the given day) + summary counters. */
export async function getDayRoster(
  staffId: string,
  eventDayId: string,
): Promise<{ counters: Counters; roster: RosterRow[] }> {
  return withStaffContext(staffId, async (tx) => {
    const kids = await tx
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        age: children.age,
        tagCode: tags.code,
      })
      .from(children)
      .leftJoin(tags, and(eq(tags.childId, children.id), eq(tags.active, true)))
      .orderBy(asc(children.firstName), asc(children.lastName));

    const att = await tx
      .select({
        childId: attendanceLog.childId,
        action: attendanceLog.action,
        occurredAt: attendanceLog.occurredAt,
      })
      .from(attendanceLog)
      .where(eq(attendanceLog.eventDayId, eventDayId))
      .orderBy(asc(attendanceLog.occurredAt));

    const byChild = new Map<string, { status: ChildStatus; inAt: string | null; outAt: string | null }>();
    for (const a of att) {
      const s = byChild.get(a.childId) ?? { status: 'not_arrived' as ChildStatus, inAt: null, outAt: null };
      if (a.action === 'check_in') {
        s.status = 'checked_in';
        s.inAt = hhmm(a.occurredAt);
      } else {
        s.status = 'checked_out';
        s.outAt = hhmm(a.occurredAt);
      }
      byChild.set(a.childId, s);
    }

    const roster: RosterRow[] = kids.map((k) => {
      const s = byChild.get(k.id) ?? { status: 'not_arrived' as ChildStatus, inAt: null, outAt: null };
      return { ...k, status: s.status, inAt: s.inAt, outAt: s.outAt };
    });

    const counters: Counters = {
      total: roster.length,
      checkedIn: roster.filter((r) => r.status === 'checked_in').length,
      checkedOut: roster.filter((r) => r.status === 'checked_out').length,
      notArrived: roster.filter((r) => r.status === 'not_arrived').length,
    };
    return { counters, roster };
  });
}
