import { requireRole } from '@/lib/require-role';
import { listStaff } from '@/lib/staff-admin';
import { ROLE_LABELS } from '@/lib/staff';
import AddUserForm from './add-user-form';
import UserRowActions from './user-row-actions';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

const roleChip: Record<string, React.CSSProperties> = {
  admin: { background: '#D0E2FF', color: '#0043CE' },
  receptionist: { background: '#E0E0E0', color: '#393939' },
  health: { background: '#D9FBFB', color: '#005D5D' },
};

export default async function UsersPage() {
  const staff = await requireRole(['admin']);
  const users = await listStaff(staff.id);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Staff access</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 24px' }}>Users</h1>

      <AddUserForm />

      <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={5}>
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} style={u.status === 'suspended' ? { background: '#FAFAFA' } : undefined}>
                <td style={{ ...td, color: u.status === 'suspended' ? '#8D8D8D' : undefined }}>
                  {u.name}
                  {u.id === staff.id && <span style={{ color: '#8D8D8D', fontSize: 12 }}> (you)</span>}
                </td>
                <td style={{ ...td, color: '#525252' }}>{u.email}</td>
                <td style={td}>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 2, ...(roleChip[u.role] ?? {}) }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td style={td}>
                  {u.status === 'active' && <span style={{ color: '#0E6027', fontSize: 13 }}>● Active</span>}
                  {u.status === 'invited' && <span style={{ color: '#8D6E00', fontSize: 13 }}>● Invited — awaiting first login</span>}
                  {u.status === 'suspended' && <span style={{ color: '#A2191F', fontSize: 13 }}>● Suspended</span>}
                </td>
                <td style={td}>
                  <UserRowActions userId={u.id} suspended={u.status === 'suspended'} isSelf={u.id === staff.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>
        {users.length} user{users.length === 1 ? '' : 's'}. Suspend blocks a user&rsquo;s access while keeping their
        history attributed; reactivate to restore it. Emailed invites and password reset come later (B-026).
      </p>
    </div>
  );
}
