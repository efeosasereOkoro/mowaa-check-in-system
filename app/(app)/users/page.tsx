import { requireRole } from '@/lib/require-role';
import { listStaff } from '@/lib/staff-admin';
import AddUserForm from './add-user-form';
import UsersTable from './users-table';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const staff = await requireRole(['admin']);
  const users = await listStaff(staff.id);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Staff access</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 24px' }}>Users</h1>

      <AddUserForm />

      <UsersTable users={users} currentUserId={staff.id} />

      <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>
        {users.length} user{users.length === 1 ? '' : 's'}. Suspend blocks a user&rsquo;s access while keeping their
        history attributed; reactivate to restore it. Emailed invites and password reset come later (B-026).
      </p>
    </div>
  );
}
