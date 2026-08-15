import { requireRole } from '@/lib/require-role';
import { listStaff } from '@/lib/staff-admin';
import UsersHeader from './users-header';
import UsersTable from './users-table';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const staff = await requireRole(['admin']);
  const users = await listStaff(staff.id);

  const suspendedN = users.filter((u) => u.status === 'suspended').length;
  const invitedN = users.filter((u) => u.status === 'invited').length;
  const statusTail = suspendedN ? `${suspendedN} suspended` : invitedN ? `${invitedN} invited` : 'all active';
  const subtitle = `${users.length} staff · ${statusTail}`;

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <UsersHeader context={subtitle} />

      <UsersTable users={users} currentUserId={staff.id} />

      <p style={{ fontSize: 13, color: '#525252', margin: 0 }}>
        Suspending blocks a user&rsquo;s access while keeping their history attributed. Reactivate restores it.
      </p>
    </div>
  );
}
