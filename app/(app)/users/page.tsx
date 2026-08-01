import { requireRole } from '@/lib/require-role';
import { listStaff } from '@/lib/staff-admin';
import { MobileOnly, DesktopOnly } from '@/components/viewport';
import AddUserForm from './add-user-form';
import AddUserSheet from './add-user-sheet';
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
    <div style={{ maxWidth: 1000 }}>
      <MobileOnly>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>Users</div>
          <div style={{ fontSize: 13, color: '#525252', marginTop: 2 }}>{subtitle}</div>
        </div>
      </MobileOnly>
      <DesktopOnly>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', margin: '0 0 24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Users</h1>
          <span style={{ fontSize: 16, color: '#525252' }}>{subtitle}</span>
        </div>
      </DesktopOnly>

      <DesktopOnly>
        <AddUserForm />
      </DesktopOnly>

      <UsersTable users={users} currentUserId={staff.id} />

      <p style={{ fontSize: 13, color: '#525252', marginTop: 12 }}>
        Suspending blocks a user&rsquo;s access while keeping their history attributed. Reactivate restores it.
      </p>

      <AddUserSheet />
    </div>
  );
}
