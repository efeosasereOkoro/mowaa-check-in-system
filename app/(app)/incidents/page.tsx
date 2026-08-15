import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { listIncidents } from '@/lib/incidents';
import { PageBand } from '@/components/console';
import IncidentsTable from './incidents-table';

export const dynamic = 'force-dynamic';

// Plain SVG node (no handlers) — safe to pass from this server component into the client band.
const Plus = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

export default async function IncidentsPage() {
  const staff = await requireRole(['admin', 'receptionist', 'health']);
  // Reception / health don't have a triage view — send them straight to the file form.
  if (staff.role !== 'admin') redirect('/incidents/new');

  const incidents = await listIncidents(staff.id);
  const total = incidents.length;
  // "Open" matches the Open chip/segment (submitted or under investigation); Escalated and
  // Resolved are their own buckets, so the band count and the chip never disagree.
  const openCount = incidents.filter((i) => i.status === 'submitted' || i.status === 'investigating').length;

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageBand
        title="Incidents"
        context={total === 0 ? 'No reports filed' : `${total} reports · ${openCount} open`}
        actions={[
          // Export is page-level (the full log); the toolbar chips are a view filter.
          { key: 'export', label: 'Export CSV', href: '/api/reports/incidents' },
          { key: 'file', label: 'File an incident', href: '/incidents/new', primary: true, icon: Plus },
        ]}
      />
      <IncidentsTable incidents={incidents} />
    </div>
  );
}
