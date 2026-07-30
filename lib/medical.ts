import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { attendanceLog, children, medicalNotes, staff, tags } from '@/db/schema';
import type { ChildStatus } from '@/lib/attendance';

export type Severity = 'routine' | 'incident' | 'emergency';

export type HealthRosterRow = {
  id: string;
  firstName: string;
  lastName: string;
  tagCode: string | null;
  status: ChildStatus;
  healthDetails: string | null;
  lastNote: { severity: Severity; when: string } | null;
  emergencyToday: boolean;
};

export type MedicalNote = {
  id: string;
  severity: Severity;
  noteText: string;
  guardianNotified: boolean;
  author: string | null;
  when: string;
};

function fmt(v: unknown, withDate = false): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    ...(withDate ? { day: '2-digit', month: 'short' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Health roster: all children with status (for the day), health details, last note, emergency-today flag. */
export async function getHealthRoster(staffId: string, eventDayId: string | null): Promise<HealthRosterRow[]> {
  return withStaffContext(staffId, async (tx) => {
    const kids = await tx
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        healthDetails: children.healthDetails,
        tagCode: tags.code,
      })
      .from(children)
      .leftJoin(tags, and(eq(tags.childId, children.id), eq(tags.active, true)))
      .orderBy(asc(children.firstName), asc(children.lastName));

    const ids = kids.map((k) => k.id);
    const statusByChild = new Map<string, ChildStatus>();
    if (eventDayId && ids.length) {
      const att = await tx
        .select({ childId: attendanceLog.childId, action: attendanceLog.action })
        .from(attendanceLog)
        .where(and(eq(attendanceLog.eventDayId, eventDayId), inArray(attendanceLog.childId, ids)))
        .orderBy(asc(attendanceLog.occurredAt));
      for (const a of att) statusByChild.set(a.childId, a.action === 'check_in' ? 'checked_in' : 'checked_out');
    }

    const lastNote = new Map<string, { severity: Severity; when: string }>();
    const emergencyToday = new Set<string>();
    if (ids.length) {
      const notes = await tx
        .select({
          childId: medicalNotes.childId,
          severity: medicalNotes.severity,
          createdAt: medicalNotes.createdAt,
          eventDayId: medicalNotes.eventDayId,
        })
        .from(medicalNotes)
        .where(inArray(medicalNotes.childId, ids))
        .orderBy(desc(medicalNotes.createdAt));
      for (const n of notes) {
        if (!lastNote.has(n.childId)) lastNote.set(n.childId, { severity: n.severity, when: fmt(n.createdAt, true) });
        if (n.severity === 'emergency' && eventDayId && n.eventDayId === eventDayId) emergencyToday.add(n.childId);
      }
    }

    return kids.map((k) => ({
      id: k.id,
      firstName: k.firstName,
      lastName: k.lastName,
      tagCode: k.tagCode,
      status: statusByChild.get(k.id) ?? 'not_arrived',
      healthDetails: k.healthDetails,
      lastNote: lastNote.get(k.id) ?? null,
      emergencyToday: emergencyToday.has(k.id),
    }));
  });
}

/** A child's health card fields + all medical notes (newest first). */
export async function getChildMedical(staffId: string, childId: string) {
  return withStaffContext(staffId, async (tx) => {
    const [child] = await tx
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        age: children.age,
        guardianName: children.guardianName,
        guardianPhone: children.guardianPhone,
        healthDetails: children.healthDetails,
        tagCode: tags.code,
      })
      .from(children)
      .leftJoin(tags, and(eq(tags.childId, children.id), eq(tags.active, true)))
      .where(eq(children.id, childId))
      .limit(1);
    if (!child) return null;

    const rows = await tx
      .select({
        id: medicalNotes.id,
        severity: medicalNotes.severity,
        noteText: medicalNotes.noteText,
        guardianNotified: medicalNotes.guardianNotified,
        createdAt: medicalNotes.createdAt,
        author: staff.name,
      })
      .from(medicalNotes)
      .leftJoin(staff, eq(staff.id, medicalNotes.authorStaffId))
      .where(eq(medicalNotes.childId, childId))
      .orderBy(desc(medicalNotes.createdAt));

    const notes: MedicalNote[] = rows.map((r) => ({
      id: r.id,
      severity: r.severity,
      noteText: r.noteText,
      guardianNotified: r.guardianNotified,
      author: r.author,
      when: fmt(r.createdAt, true),
    }));
    return { child, notes };
  });
}

/** Insert an append-only medical note (RLS: health + admin). */
export async function addMedicalNote(
  staffId: string,
  childId: string,
  input: { severity: Severity; noteText: string; guardianNotified: boolean; eventDayId: string | null },
) {
  return withStaffContext(staffId, (tx) =>
    tx.insert(medicalNotes).values({
      childId,
      eventDayId: input.eventDayId,
      severity: input.severity,
      noteText: input.noteText,
      guardianNotified: input.guardianNotified,
      authorStaffId: staffId,
    }),
  );
}

/** Child ids with an Emergency note on the given day (for the red indicator). */
export async function getEmergencyChildIdsToday(staffId: string, eventDayId: string | null): Promise<Set<string>> {
  if (!eventDayId) return new Set();
  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({ childId: medicalNotes.childId })
      .from(medicalNotes)
      .where(and(eq(medicalNotes.severity, 'emergency'), eq(medicalNotes.eventDayId, eventDayId)));
    return new Set(rows.map((r) => r.childId));
  });
}

/** Recent medical notes across children (activity feed, health + admin only). */
export async function getRecentNotes(staffId: string, limit = 10) {
  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({
        id: medicalNotes.id,
        childFirst: children.firstName,
        childLast: children.lastName,
        severity: medicalNotes.severity,
        noteText: medicalNotes.noteText,
        createdAt: medicalNotes.createdAt,
        author: staff.name,
      })
      .from(medicalNotes)
      .innerJoin(children, eq(children.id, medicalNotes.childId))
      .leftJoin(staff, eq(staff.id, medicalNotes.authorStaffId))
      .orderBy(desc(medicalNotes.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      child: `${r.childFirst} ${r.childLast}`,
      severity: r.severity,
      noteText: r.noteText,
      author: r.author,
      when: fmt(r.createdAt, true),
    }));
  });
}
