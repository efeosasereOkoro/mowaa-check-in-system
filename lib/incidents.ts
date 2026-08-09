import { desc, eq, sql } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { formatEventDateTime } from '@/lib/datetime';
import { incidentReports, incidentUpdates, children, staff } from '@/db/schema';

// Incident reporting (E13, B-048). The category list is the single source for the form select,
// server validation, and (later) the console filter. Keep in sync with the incident_category
// enum in db/schema.ts / migration 0013.
export const INCIDENT_CATEGORIES = [
  { value: 'safeguarding', label: 'Safeguarding concern' },
  { value: 'medical_emergency', label: 'Medical emergency' },
  { value: 'injury', label: 'Injury' },
  { value: 'abuse_suspicion', label: 'Suspicion of abuse' },
  { value: 'security_breach', label: 'Security / safety breach' },
  { value: 'theft_damage', label: 'Theft / damage' },
  { value: 'other', label: 'Other' },
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number]['value'];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  INCIDENT_CATEGORIES.map((c) => [c.value, c.label]),
);

// Workflow states. The current status of an incident is derived from the latest update
// (S5 writes these); a freshly-filed report with no updates is 'submitted'.
export const INCIDENT_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'escalated', label: 'Escalated to CPO' },
  { value: 'investigating', label: 'Under investigation' },
  { value: 'resolved', label: 'Resolved' },
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]['value'];
export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  INCIDENT_STATUSES.map((s) => [s.value, s.label]),
);

const fmt = (v: unknown): string | null => formatEventDateTime(v as Date | string | number | null | undefined);

/**
 * Display label for an incident's category, expanding the free-text 'other'. Shared by the
 * console detail page, the printable report and the CSV export so the three never diverge.
 */
export function incidentCategoryLabel(c: { category: string; categoryOther: string | null }): string {
  return c.category === 'other' && c.categoryOther ? `Other — ${c.categoryOther}` : CATEGORY_LABEL[c.category] ?? c.category;
}

export type NewIncidentInput = {
  childId: string | null;
  category: IncidentCategory;
  categoryOther: string | null;
  reporterName: string | null;
  reporterPhone: string | null;
  reporterEmail: string | null;
  incidentAt: Date | null;
  location: string | null;
  personsInvolved: string | null;
  howInvolved: string | null;
  narrative: string;
  keyNotes: string | null;
  guardianNotified: boolean;
  guardianNotifiedAt: Date | null;
};

/**
 * File an incident report. RLS (`incident_reports_insert`) permits any on-duty staff
 * (admin / receptionist / health) filing as themselves — so reporter_staff_id is forced to the
 * acting staff id here, never taken from the client. tenant_id is auto-stamped by the column
 * default. The report is immutable once filed (append-only).
 */
export async function fileIncident(staffId: string, input: NewIncidentInput) {
  return withStaffContext(staffId, (tx) =>
    tx
      .insert(incidentReports)
      .values({
        reporterStaffId: staffId,
        childId: input.childId,
        category: input.category,
        categoryOther: input.categoryOther,
        reporterName: input.reporterName,
        reporterPhone: input.reporterPhone,
        reporterEmail: input.reporterEmail,
        incidentAt: input.incidentAt,
        location: input.location,
        personsInvolved: input.personsInvolved,
        howInvolved: input.howInvolved,
        narrative: input.narrative,
        keyNotes: input.keyNotes,
        guardianNotified: input.guardianNotified,
        guardianNotifiedAt: input.guardianNotifiedAt,
      })
      .returning({ id: incidentReports.id }),
  );
}

/**
 * Active admin (Protection Officer) emails for the caller's own tenant, for incident
 * notifications (E13-S7). Backed by the SECURITY DEFINER `tenant_admin_emails()` (migration
 * 0014) so any on-duty staff can look them up without read access to `staff`. Server-only —
 * the result is used as email recipients, never returned to the client.
 */
export async function getTenantAdminEmails(staffId: string): Promise<string[]> {
  return withStaffContext(staffId, async (tx) => {
    const res = await tx.execute(sql`select email from tenant_admin_emails()`);
    return (res.rows as { email: string }[]).map((r) => r.email).filter(Boolean);
  });
}

export type IncidentUpdateInput = {
  kind: 'status_change' | 'note';
  newStatus: IncidentStatus | null;
  note: string | null;
};

/**
 * Append a workflow update to an incident (RLS `incident_updates_insert`: admin only).
 * author_staff_id is forced to the acting admin; tenant is auto-stamped. The filed report is
 * never edited — status transitions, notes and the sign-off are all rows in this append-only log.
 */
export async function addIncidentUpdate(staffId: string, incidentId: string, input: IncidentUpdateInput) {
  return withStaffContext(staffId, (tx) =>
    tx
      .insert(incidentUpdates)
      .values({
        incidentId,
        authorStaffId: staffId,
        kind: input.kind,
        newStatus: input.newStatus,
        note: input.note,
      })
      .returning({ id: incidentUpdates.id }),
  );
}

// Derived current status: the newest update carrying a new_status, else 'submitted'.
const statusExpr = sql<string>`coalesce((
  select iu.new_status from incident_updates iu
  where iu.incident_id = ${incidentReports.id} and iu.new_status is not null
  order by iu.created_at desc limit 1
), 'submitted')`;

export type IncidentListItem = {
  id: string;
  category: IncidentCategory;
  categoryOther: string | null;
  childName: string | null;
  reportedBy: string | null;
  location: string | null;
  personsInvolved: string | null;
  incidentAt: string | null;
  filedAt: string | null;
  guardianNotified: boolean;
  status: IncidentStatus;
};

/** All incidents in the tenant, newest first (RLS: admin sees all). For the console. */
export async function listIncidents(staffId: string): Promise<IncidentListItem[]> {
  return withStaffContext(staffId, async (tx) => {
    const rows = await tx
      .select({
        id: incidentReports.id,
        category: incidentReports.category,
        categoryOther: incidentReports.categoryOther,
        childFirst: children.firstName,
        childLast: children.lastName,
        staffName: staff.name,
        externalReporter: incidentReports.reporterName,
        location: incidentReports.location,
        personsInvolved: incidentReports.personsInvolved,
        incidentAt: incidentReports.incidentAt,
        filedAt: incidentReports.filedAt,
        guardianNotified: incidentReports.guardianNotified,
        status: statusExpr,
      })
      .from(incidentReports)
      .leftJoin(children, eq(children.id, incidentReports.childId))
      .leftJoin(staff, eq(staff.id, incidentReports.reporterStaffId))
      .orderBy(desc(incidentReports.filedAt));

    return rows.map((r) => ({
      id: r.id,
      category: r.category as IncidentCategory,
      categoryOther: r.categoryOther,
      childName: r.childFirst ? `${r.childFirst} ${r.childLast}` : null,
      reportedBy: r.staffName ?? r.externalReporter ?? null,
      location: r.location,
      personsInvolved: r.personsInvolved,
      incidentAt: fmt(r.incidentAt),
      filedAt: fmt(r.filedAt),
      guardianNotified: r.guardianNotified,
      status: r.status as IncidentStatus,
    }));
  });
}

export type IncidentUpdateItem = { id: string; kind: string; newStatus: string | null; note: string | null; author: string | null; at: string | null };

export type IncidentOfficialRecord = {
  escalatedAt: string | null;
  investigationStartedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: string | null;
  /** "<time> · <author>" sign-off convenience, or null until resolved. */
  signOff: string | null;
};

/**
 * The official-reporting milestones derived from an incident's update timeline (E13-S6/S8):
 * escalation, investigation start, and resolution + CPO sign-off. Shared by the console detail
 * page and the printable report so the printed official record can never drift from the console.
 */
export function incidentOfficialRecord(updates: IncidentUpdateItem[]): IncidentOfficialRecord {
  const resolved = updates.find((u) => u.newStatus === 'resolved');
  const escalated = updates.find((u) => u.newStatus === 'escalated');
  const investigating = updates.find((u) => u.newStatus === 'investigating');
  return {
    escalatedAt: escalated?.at ?? null,
    investigationStartedAt: investigating?.at ?? null,
    resolvedAt: resolved?.at ?? null,
    resolvedBy: resolved?.author ?? null,
    resolution: resolved?.note ?? null,
    signOff: resolved ? `${resolved.at ?? ''}${resolved.author ? ` · ${resolved.author}` : ''}` : null,
  };
}

export type IncidentDetail = {
  id: string;
  category: IncidentCategory;
  categoryOther: string | null;
  status: IncidentStatus;
  childName: string | null;
  filedByStaff: string | null;
  reporterName: string | null;
  reporterPhone: string | null;
  reporterEmail: string | null;
  incidentAt: string | null;
  filedAt: string | null;
  location: string | null;
  personsInvolved: string | null;
  howInvolved: string | null;
  narrative: string;
  keyNotes: string | null;
  guardianNotified: boolean;
  guardianNotifiedAt: string | null;
  updates: IncidentUpdateItem[];
};

/** One incident with its updates timeline (RLS: admin, or the filer for their own). */
export async function getIncident(staffId: string, id: string): Promise<IncidentDetail | null> {
  return withStaffContext(staffId, async (tx) => {
    const [r] = await tx
      .select({
        id: incidentReports.id,
        category: incidentReports.category,
        categoryOther: incidentReports.categoryOther,
        childFirst: children.firstName,
        childLast: children.lastName,
        staffName: staff.name,
        reporterName: incidentReports.reporterName,
        reporterPhone: incidentReports.reporterPhone,
        reporterEmail: incidentReports.reporterEmail,
        incidentAt: incidentReports.incidentAt,
        filedAt: incidentReports.filedAt,
        location: incidentReports.location,
        personsInvolved: incidentReports.personsInvolved,
        howInvolved: incidentReports.howInvolved,
        narrative: incidentReports.narrative,
        keyNotes: incidentReports.keyNotes,
        guardianNotified: incidentReports.guardianNotified,
        guardianNotifiedAt: incidentReports.guardianNotifiedAt,
        status: statusExpr,
      })
      .from(incidentReports)
      .leftJoin(children, eq(children.id, incidentReports.childId))
      .leftJoin(staff, eq(staff.id, incidentReports.reporterStaffId))
      .where(eq(incidentReports.id, id))
      .limit(1);
    if (!r) return null;

    // Updates timeline (RLS incident_updates_select: admin only). Non-admin filers viewing
    // their own report simply get an empty timeline.
    const uRows = await tx
      .select({
        id: incidentUpdates.id,
        kind: incidentUpdates.kind,
        newStatus: incidentUpdates.newStatus,
        note: incidentUpdates.note,
        author: staff.name,
        at: incidentUpdates.createdAt,
      })
      .from(incidentUpdates)
      .leftJoin(staff, eq(staff.id, incidentUpdates.authorStaffId))
      .where(eq(incidentUpdates.incidentId, id))
      .orderBy(desc(incidentUpdates.createdAt));

    return {
      id: r.id,
      category: r.category as IncidentCategory,
      categoryOther: r.categoryOther,
      status: r.status as IncidentStatus,
      childName: r.childFirst ? `${r.childFirst} ${r.childLast}` : null,
      filedByStaff: r.staffName ?? null,
      reporterName: r.reporterName,
      reporterPhone: r.reporterPhone,
      reporterEmail: r.reporterEmail,
      incidentAt: fmt(r.incidentAt),
      filedAt: fmt(r.filedAt),
      location: r.location,
      personsInvolved: r.personsInvolved,
      howInvolved: r.howInvolved,
      narrative: r.narrative,
      keyNotes: r.keyNotes,
      guardianNotified: r.guardianNotified,
      guardianNotifiedAt: fmt(r.guardianNotifiedAt),
      updates: uRows.map((u) => ({
        id: u.id,
        kind: u.kind,
        newStatus: u.newStatus,
        note: u.note,
        author: u.author ?? null,
        at: fmt(u.at),
      })),
    };
  });
}
