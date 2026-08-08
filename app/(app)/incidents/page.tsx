import { requireRole } from '@/lib/require-role';
import { listChildren } from '@/lib/children';
import FileIncidentForm from './file-incident-form';

export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  // Any on-duty staff can file an incident. (The Protection Officer console to triage them
  // is a later story, E13-S4 — admin only.)
  const staff = await requireRole(['admin', 'receptionist', 'health']);
  const kids = await listChildren(staff.id);
  // Project to id + name only — never send health/address to the client.
  const childOptions = kids.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }));

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 6px' }}>Report an incident</h1>
      <p style={{ fontSize: 14, color: '#525252', margin: '0 0 20px', lineHeight: 1.5 }}>
        File a safeguarding or incident report as soon as you can (within 24 hours). Give as much
        detail as you can — the report can’t be edited once filed, so a follow-up is added as an
        update. An incident doesn’t have to involve a specific child.
      </p>
      <FileIncidentForm childOptions={childOptions} />
    </div>
  );
}
