import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { listChildren } from '@/lib/children';
import { PageBand } from '@/components/console';
import FileIncidentForm from '../file-incident-form';

export const dynamic = 'force-dynamic';

export default async function NewIncidentPage() {
  // Any on-duty staff can file an incident.
  const staff = await requireRole(['admin', 'receptionist', 'health']);
  const kids = await listChildren(staff.id);
  // Project to id + name only — never send health/address to the client.
  const childOptions = kids.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }));
  const isAdmin = staff.role === 'admin';

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageBand
        breadcrumb={
          isAdmin ? (
            <>
              <Link href="/incidents" style={{ color: '#0F62FE' }}>
                Incidents
              </Link>{' '}
              / New
            </>
          ) : undefined
        }
        title="Report an incident"
        context="File within 24 hours · cannot be edited once filed"
        actions={isAdmin ? [{ key: 'cancel', label: 'Cancel', href: '/incidents' }] : []}
      />
      <FileIncidentForm childOptions={childOptions} />
    </div>
  );
}
