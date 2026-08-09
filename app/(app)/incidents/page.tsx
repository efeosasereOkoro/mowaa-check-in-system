import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { listIncidents } from '@/lib/incidents';
import { MobileOnly, DesktopOnly } from '@/components/viewport';
import IncidentsTable from './incidents-table';
import FileIncidentBar from './file-incident-bar';

export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const staff = await requireRole(['admin', 'receptionist', 'health']);
  // Reception / health don't have a triage view — send them straight to the file form.
  if (staff.role !== 'admin') redirect('/incidents/new');

  const incidents = await listIncidents(staff.id);
  const total = incidents.length;
  const openCount = incidents.filter((i) => i.status !== 'resolved').length;

  return (
    <div style={{ maxWidth: 1000 }}>
      <MobileOnly>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>Incidents</div>
        <div style={{ fontSize: 13, color: '#525252', margin: '2px 0 12px' }}>
          {total === 0 ? 'No reports filed' : `${total} reports · ${openCount} open`}
        </div>
      </MobileOnly>

      <DesktopOnly>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '0 0 8px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Incidents</h1>
          {/* Filing is constructive, not an emergency — primary blue, not #DA1E28. */}
          <Link
            href="/incidents/new"
            style={{ marginLeft: 'auto', height: 40, padding: '0 16px', background: '#0F62FE', color: '#fff', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            + File an incident
          </Link>
        </div>
        <p style={{ fontSize: 14, color: '#525252', margin: '0 0 20px' }}>
          Safeguarding &amp; incident reports for your organisation. Open one to read the full report.
        </p>
      </DesktopOnly>

      <IncidentsTable incidents={incidents} />

      <FileIncidentBar />
    </div>
  );
}
