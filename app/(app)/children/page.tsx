import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { listChildren } from '@/lib/children';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEmergencyChildIdsToday } from '@/lib/medical';
import AddChildForm from './add-child-form';
import ChildrenTable, { type ChildRow } from './children-table';

export const dynamic = 'force-dynamic';

export default async function ChildrenPage() {
  const staff = await requireRole(['admin']);
  const kids = await listChildren(staff.id);
  const day = await getCurrentEventDay(staff.id);
  const emergencyIds = await getEmergencyChildIdsToday(staff.id, day?.id ?? null);

  const childRows: ChildRow[] = kids.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    age: c.age,
    guardianName: c.guardianName,
    guardianPhone: c.guardianPhone,
    homeAddress: c.homeAddress,
    healthDetails: c.healthDetails,
    emergency: emergencyIds.has(c.id),
  }));

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Register</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', margin: '0 0 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Children</h1>
        <Link href="/cards" target="_blank" style={{ color: '#0F62FE', fontSize: 14 }}>
          Print QR ID cards →
        </Link>
      </div>

      <AddChildForm />

      <ChildrenTable children={childRows} />

      <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>
        {kids.length} registered. Edit/delete, pickup persons, tags and photo come next (E4-S2…S6).
      </p>
    </div>
  );
}
