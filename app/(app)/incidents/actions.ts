'use server';

import { requireRole } from '@/lib/require-role';
import { getChild } from '@/lib/children';
import { fileIncident, INCIDENT_CATEGORIES, type IncidentCategory } from '@/lib/incidents';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = new Set<string>(INCIDENT_CATEGORIES.map((c) => c.value));

export type IncidentActionState = { error?: string; ok?: boolean };

export async function fileIncidentAction(
  _prev: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  // Any on-duty staff can file (RLS enforces file-as-self + tenant).
  const staff = await requireRole(['admin', 'receptionist', 'health']);
  const get = (k: string) => ((formData.get(k) as string) ?? '').trim();

  const category = get('category');
  if (!CATEGORIES.has(category)) return { error: 'Choose a category for the incident.' };
  const categoryOther = category === 'other' ? get('categoryOther') : '';
  if (category === 'other' && !categoryOther) return { error: 'Briefly describe the “Other” category.' };

  const narrative = get('narrative');
  if (!narrative) return { error: 'Describe what happened (the statement is required).' };

  // Optional child link — must be a child the reporter can see (own tenant), else reject the
  // forged id rather than store a cross-tenant reference.
  const childId = get('childId') || null;
  if (childId) {
    const child = await getChild(staff.id, childId);
    if (!child) return { error: 'The selected child could not be found.' };
  }

  const parseWhen = (raw: string): Date | null | 'invalid' => {
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? 'invalid' : d;
  };
  const incidentAt = parseWhen(get('incidentAt'));
  if (incidentAt === 'invalid') return { error: 'Enter a valid incident date & time, or leave it blank.' };

  const reporterEmail = get('reporterEmail');
  if (reporterEmail && !EMAIL_RE.test(reporterEmail)) {
    return { error: 'Enter a valid reporter email, or leave it blank.' };
  }

  const guardianNotified = formData.get('guardianNotified') != null;
  let guardianNotifiedAt: Date | null = null;
  if (guardianNotified) {
    const g = parseWhen(get('guardianNotifiedAt'));
    if (g === 'invalid') return { error: 'Enter a valid “guardian notified” date & time, or leave it blank.' };
    guardianNotifiedAt = g;
  }

  try {
    await fileIncident(staff.id, {
      childId,
      category: category as IncidentCategory,
      categoryOther: categoryOther || null,
      reporterName: get('reporterName') || null,
      reporterPhone: get('reporterPhone') || null,
      reporterEmail: reporterEmail || null,
      incidentAt: incidentAt as Date | null,
      location: get('location') || null,
      personsInvolved: get('personsInvolved') || null,
      howInvolved: get('howInvolved') || null,
      narrative,
      keyNotes: get('keyNotes') || null,
      guardianNotified,
      guardianNotifiedAt,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('file incident failed', e);
    return { error: 'Could not file the report. Please try again.' };
  }

  return { ok: true };
}
