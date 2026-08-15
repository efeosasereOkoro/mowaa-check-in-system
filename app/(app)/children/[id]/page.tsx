import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getChild } from '@/lib/children';
import { getChildAttendance } from '@/lib/attendance';
import { getChildMedical } from '@/lib/medical';
import { listPickupPersons } from '@/lib/pickup-persons';
import { listGuardians } from '@/lib/guardians';
import { listTagsForChild } from '@/lib/tags';
import { AttendanceTable, MedicalNotesList } from '@/components/child-record';
import { PageBand, Card, CardHeader } from '@/components/console';
import EditChildForm from './edit-child-form';
import TagSection from './tag-section';
import PickupPersonsSection from './pickup-persons';
import DeleteChildButton from './delete-child-button';

export const dynamic = 'force-dynamic';

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(['admin']);
  const child = await getChild(staff.id, id);
  if (!child) notFound();
  const pickups = await listPickupPersons(staff.id, id);
  const guardians = await listGuardians(staff.id, id);
  const childTags = await listTagsForChild(staff.id, id);
  const attendance = await getChildAttendance(staff.id, id);
  const medical = await getChildMedical(staff.id, id);
  // Medical notes are admin+health only (RLS also enforces this); gate the UI to match.
  const canSeeHealth = staff.role === 'admin' || staff.role === 'health';

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageBand
        breadcrumb={
          <>
            <Link href="/children" style={{ color: '#0F62FE' }}>
              Children
            </Link>{' '}
            / {child.firstName} {child.lastName}
          </>
        }
        title={`${child.firstName} ${child.lastName}`}
        context={`Age ${child.age ?? '—'}`}
        actions={[
          { key: 'card', label: 'Print QR card', href: `/cards?child=${child.id}`, target: '_blank' },
          { key: 'report', label: 'Generate report', href: `/child-report?child=${child.id}`, target: '_blank' },
        ]}
      />

      <EditChildForm
        child={{
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          guardianName: child.guardianName,
          guardianPhone: child.guardianPhone,
          guardianEmail: child.guardianEmail,
          homeAddress: child.homeAddress,
          healthDetails: child.healthDetails,
        }}
      />

      {guardians.length > 0 && (
        <Card>
          <CardHeader title="Guardians" />
          {guardians.map((g, i) => (
            <div
              key={g.id}
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 12px', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #F4F4F4' }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</span>
              {g.isPrimary && <span style={{ fontSize: 11, color: '#0F62FE', border: '1px solid #0F62FE', padding: '1px 6px' }}>Primary</span>}
              {g.relationship && <span style={{ fontSize: 13, color: '#525252' }}>{g.relationship}</span>}
              {g.phone && <span style={{ fontSize: 13, color: '#525252', fontFamily: 'monospace' }}>{g.phone}</span>}
              {g.email && <span style={{ fontSize: 13, color: '#525252' }}>{g.email}</span>}
            </div>
          ))}
          <div style={{ padding: '10px 16px', fontSize: 12, color: '#8D8D8D', borderTop: '1px solid #F4F4F4' }}>
            The primary guardian’s contact is edited in the form above. Additional guardians are captured at registration.
          </div>
        </Card>
      )}

      <TagSection
        childId={child.id}
        tags={childTags.map((t) => ({ id: t.id, code: t.code, nfcUid: t.nfcUid, active: t.active }))}
      />

      <PickupPersonsSection
        childId={child.id}
        persons={pickups.map((p) => ({ id: p.id, name: p.name, relationship: p.relationship, phone: p.phone }))}
      />

      <Card>
        <CardHeader title="Attendance" />
        <div style={{ padding: 16 }}>
          <AttendanceTable days={attendance} />
        </div>
      </Card>

      {canSeeHealth && (
        <Card>
          <CardHeader title="Health record" />
          <div style={{ padding: 16 }}>
            <MedicalNotesList notes={medical?.notes ?? []} />
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Danger zone" />
        <div style={{ padding: 16 }}>
          <DeleteChildButton id={child.id} />
        </div>
      </Card>
    </div>
  );
}
