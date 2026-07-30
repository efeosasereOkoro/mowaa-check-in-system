import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getChild } from '@/lib/children';
import { listPickupPersons } from '@/lib/pickup-persons';
import EditChildForm from './edit-child-form';
import PickupPersonsSection from './pickup-persons';
import DeleteChildButton from './delete-child-button';

export const dynamic = 'force-dynamic';

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(['admin']);
  const child = await getChild(staff.id, id);
  if (!child) notFound();
  const pickups = await listPickupPersons(staff.id, id);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>
        <Link href="/children" style={{ color: '#0F62FE' }}>
          Children
        </Link>{' '}
        / Edit
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 24px' }}>
        {child.firstName} {child.lastName}
      </h1>

      <EditChildForm
        child={{
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          guardianName: child.guardianName,
          guardianPhone: child.guardianPhone,
          homeAddress: child.homeAddress,
          healthDetails: child.healthDetails,
        }}
      />

      <PickupPersonsSection
        childId={child.id}
        persons={pickups.map((p) => ({
          id: p.id,
          name: p.name,
          relationship: p.relationship,
          phone: p.phone,
        }))}
      />

      <div style={{ marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 }}>
        <div style={{ fontSize: 12, color: '#525252', marginBottom: 8 }}>Danger zone</div>
        <DeleteChildButton id={child.id} />
      </div>
    </div>
  );
}
