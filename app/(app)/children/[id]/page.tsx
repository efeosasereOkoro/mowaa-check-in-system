import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getChild } from '@/lib/children';
import { getChildAttendance } from '@/lib/attendance';
import { getChildMedical } from '@/lib/medical';
import { listPickupPersons } from '@/lib/pickup-persons';
import { listTagsForChild } from '@/lib/tags';
import { AttendanceTable, MedicalNotesList } from '@/components/child-record';
import EditChildForm from './edit-child-form';
import TagSection from './tag-section';
import PickupPersonsSection from './pickup-persons';
import DeleteChildButton from './delete-child-button';

const sectionStyle: React.CSSProperties = { marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 };
const sectionH2: React.CSSProperties = { fontSize: 18, fontWeight: 600, margin: '0 0 12px', color: '#161616' };

export const dynamic = 'force-dynamic';

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(['admin']);
  const child = await getChild(staff.id, id);
  if (!child) notFound();
  const pickups = await listPickupPersons(staff.id, id);
  const childTags = await listTagsForChild(staff.id, id);
  const attendance = await getChildAttendance(staff.id, id);
  const medical = await getChildMedical(staff.id, id);
  // Medical notes are admin+health only (RLS also enforces this); gate the UI to match.
  const canSeeHealth = staff.role === 'admin' || staff.role === 'health';

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>
        <Link href="/children" style={{ color: '#0F62FE' }}>
          Children
        </Link>{' '}
        / Edit
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', margin: '0 0 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>
          {child.firstName} {child.lastName}
        </h1>
        <Link href={`/cards?child=${child.id}`} target="_blank" style={{ color: '#0F62FE', fontSize: 14 }}>
          Print QR card →
        </Link>
        <Link href={`/child-report?child=${child.id}`} target="_blank" style={{ color: '#0F62FE', fontSize: 14 }}>
          Generate report →
        </Link>
      </div>

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

      <TagSection
        childId={child.id}
        tags={childTags.map((t) => ({
          id: t.id,
          code: t.code,
          nfcUid: t.nfcUid,
          active: t.active,
        }))}
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

      <section style={sectionStyle}>
        <h2 style={sectionH2}>Attendance</h2>
        <AttendanceTable days={attendance} />
      </section>

      {canSeeHealth && (
        <section style={sectionStyle}>
          <h2 style={sectionH2}>Health record</h2>
          <MedicalNotesList notes={medical?.notes ?? []} />
        </section>
      )}

      <div style={{ marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 }}>
        <div style={{ fontSize: 12, color: '#525252', marginBottom: 8 }}>Danger zone</div>
        <DeleteChildButton id={child.id} />
      </div>
    </div>
  );
}
