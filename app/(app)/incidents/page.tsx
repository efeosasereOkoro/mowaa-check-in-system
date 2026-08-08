import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { listIncidents } from '@/lib/incidents';
import IncidentsConsole from './incidents-console';

export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const staff = await requireRole(['admin', 'receptionist', 'health']);
  // Reception / health don't have a triage view — send them straight to the file form.
  if (staff.role !== 'admin') redirect('/incidents/new');

  const incidents = await listIncidents(staff.id);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '0 0 8px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Incidents</h1>
        <Link
          href="/incidents/new"
          style={{ marginLeft: 'auto', height: 40, padding: '0 16px', background: '#DA1E28', color: '#fff', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
        >
          + File an incident
        </Link>
      </div>
      <p style={{ fontSize: 14, color: '#525252', margin: '0 0 20px' }}>
        Safeguarding &amp; incident reports for your organisation. Open one to read the full report.
      </p>
      <IncidentsConsole incidents={incidents} />
    </div>
  );
}
