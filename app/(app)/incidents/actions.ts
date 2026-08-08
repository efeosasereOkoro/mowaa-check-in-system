'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { requireRole } from '@/lib/require-role';
import { getChild } from '@/lib/children';
import {
  fileIncident,
  addIncidentUpdate,
  getIncident,
  getTenantAdminEmails,
  CATEGORY_LABEL,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  type IncidentCategory,
  type IncidentStatus,
} from '@/lib/incidents';
import { sendIncidentNotification } from '@/lib/emails/incident-notification';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = new Set<string>(INCIDENT_CATEGORIES.map((c) => c.value));
const STATUSES = new Set<string>(INCIDENT_STATUSES.map((s) => s.value));

export type IncidentActionState = { error?: string; ok?: boolean };

const fmtWhen = (d: Date) =>
  d.toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Best-effort: notify the tenant's Protection Officers (active admins) that an incident was
 * filed or escalated (E13-S7). Recipients are resolved RLS-safely via tenant_admin_emails()
 * (migration 0014), so a receptionist/health filer can trigger it without read access to staff.
 * A summary + secure link only — the narrative and child identity stay behind login. Never
 * throws: notification must not fail the filing/escalation if email is down or unconfigured.
 */
async function notifyProtectionOfficers(args: {
  staffId: string;
  event: 'filed' | 'escalated';
  category: string;
  reportedBy: string | null;
  when: string | null;
  incidentId: string | null;
}): Promise<void> {
  try {
    const emails = await getTenantAdminEmails(args.staffId);
    if (emails.length === 0) return;

    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const appUrl = process.env.APP_URL || (host ? `${proto}://${host}` : undefined);
    const incidentUrl = appUrl && args.incidentId ? `${appUrl}/incidents/${args.incidentId}` : null;

    await Promise.all(
      emails.map((to) =>
        sendIncidentNotification({
          to,
          event: args.event,
          category: args.category,
          reportedBy: args.reportedBy,
          when: args.when,
          incidentUrl,
        }),
      ),
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('incident notification failed', e);
  }
}

const categoryLabelFor = (category: string, categoryOther: string | null) =>
  category === 'other' && categoryOther ? categoryOther : CATEGORY_LABEL[category] ?? category;

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

  let incidentId: string | null = null;
  try {
    const [created] = await fileIncident(staff.id, {
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
    incidentId = created?.id ?? null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('file incident failed', e);
    return { error: 'Could not file the report. Please try again.' };
  }

  await notifyProtectionOfficers({
    staffId: staff.id,
    event: 'filed',
    category: categoryLabelFor(category, categoryOther || null),
    reportedBy: staff.name,
    when: fmtWhen(new Date()),
    incidentId,
  });

  return { ok: true };
}

/**
 * Advance an incident's status (S5) or add a note — admin only. Resolving requires a resolution
 * note (the CPO sign-off, S6). Every action is an append-only incident_updates row; the filed
 * report is never edited.
 */
export async function updateIncidentAction(
  _prev: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const staff = await requireRole(['admin']);
  const get = (k: string) => ((formData.get(k) as string) ?? '').trim();

  const incidentId = get('incidentId');
  if (!incidentId) return { error: 'Missing incident.' };
  // Confirm the incident is visible to this admin (own tenant) before writing an update.
  const inc = await getIncident(staff.id, incidentId);
  if (!inc) return { error: 'Incident not found.' };

  const kind = get('kind');
  const note = get('note');

  if (kind === 'status_change') {
    const newStatus = get('newStatus');
    if (!STATUSES.has(newStatus)) return { error: 'Choose a status.' };
    if (newStatus === inc.status && !note) return { error: 'That is already the current status — add a note if you meant to comment.' };
    if (newStatus === 'resolved' && !note) return { error: 'A resolution note is required to resolve and sign off.' };
    await addIncidentUpdate(staff.id, incidentId, { kind: 'status_change', newStatus: newStatus as IncidentStatus, note: note || null });

    // Escalating to the CPO re-alerts the Protection Officers by email (E13-S7). Only on the
    // transition into 'escalated', not on repeat submissions of the same status.
    if (newStatus === 'escalated' && inc.status !== 'escalated') {
      await notifyProtectionOfficers({
        staffId: staff.id,
        event: 'escalated',
        category: categoryLabelFor(inc.category, inc.categoryOther),
        reportedBy: inc.filedByStaff,
        when: inc.filedAt,
        incidentId,
      });
    }
  } else if (kind === 'note') {
    if (!note) return { error: 'Write a note to add.' };
    await addIncidentUpdate(staff.id, incidentId, { kind: 'note', newStatus: null, note });
  } else {
    return { error: 'Unknown action.' };
  }

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath('/incidents');
  return { ok: true };
}
