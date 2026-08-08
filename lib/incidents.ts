import { withStaffContext } from '@/lib/db-authenticated';
import { incidentReports } from '@/db/schema';

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
