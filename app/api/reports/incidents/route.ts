import { getCurrentUser } from '@/lib/staff';
import {
  listIncidents,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  STATUS_LABEL,
  incidentCategoryLabel,
} from '@/lib/incidents';
import { buildCsv } from '@/lib/reports';

export const dynamic = 'force-dynamic';

const CATEGORIES = new Set<string>(INCIDENT_CATEGORIES.map((c) => c.value));
const STATUSES = new Set<string>(INCIDENT_STATUSES.map((s) => s.value));

/**
 * Incident log CSV export (E13-S8) — Admin / CPO only, mirroring the attendance export.
 * Optional `?category=` and `?status=` narrow the export to match the console's active filters.
 * RLS (admin sees all in-tenant) backs listIncidents; the role check here is the API-route guard
 * (requireRole redirects, which is wrong for a fetch/download endpoint).
 */
export async function GET(req: Request) {
  const current = await getCurrentUser();
  if (!current?.staff) return new Response('Unauthorized', { status: 401 });
  if (current.staff.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const sp = new URL(req.url).searchParams;
  const category = sp.get('category');
  const status = sp.get('status');
  // Reject a malformed filter rather than silently exporting the whole log.
  if (category && category !== 'all' && !CATEGORIES.has(category)) return new Response('Bad Request', { status: 400 });
  if (status && status !== 'all' && !STATUSES.has(status)) return new Response('Bad Request', { status: 400 });

  let rows = await listIncidents(current.staff.id);
  if (category && category !== 'all') rows = rows.filter((r) => r.category === category);
  if (status && status !== 'all') rows = rows.filter((r) => r.status === status);

  const csv = buildCsv(
    ['Filed', 'Type', 'Status', 'Child', 'Reported by', 'When it happened', 'Guardian notified'],
    rows.map((r) => [
      r.filedAt ?? '',
      incidentCategoryLabel(r),
      STATUS_LABEL[r.status] ?? r.status,
      r.childName ?? '',
      r.reportedBy ?? '',
      r.incidentAt ?? '',
      r.guardianNotified ? 'Yes' : '',
    ]),
  );

  const suffix = [category && category !== 'all' ? category : null, status && status !== 'all' ? status : null]
    .filter(Boolean)
    .join('_');
  const fname = suffix ? `incidents_${suffix}` : 'incidents';

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
