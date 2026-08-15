import { requireRole } from '@/lib/require-role';
import { listChildren } from '@/lib/children';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEmergencyChildIdsToday } from '@/lib/medical';
import ChildrenHeader from './children-header';
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
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ChildrenHeader context={`${kids.length} registered`} />
      <ChildrenTable rows={childRows} />
    </div>
  );
}
