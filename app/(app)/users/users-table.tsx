'use client';

import { Fragment, useEffect, useState } from 'react';
import type { StaffListItem } from '@/lib/staff-admin';
import type { StaffRole } from '@/lib/staff';
import UserRowActions from './user-row-actions';

// Local labels — client component must NOT import a *value* from lib/staff (it pulls
// server-only auth/db into the client bundle and crashes the page). See D-027.
const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  receptionist: 'Receptionist',
  health: 'Health Officer',
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

const roleChip: Record<string, React.CSSProperties> = {
  admin: { background: '#D0E2FF', color: '#0043CE' },
  receptionist: { background: '#E0E0E0', color: '#393939' },
  health: { background: '#D9FBFB', color: '#005D5D' },
};

function StatusLabel({ status, short }: { status: StaffListItem['status']; short: boolean }) {
  if (status === 'active') return <span style={{ color: '#0E6027', fontSize: 13 }}>● Active</span>;
  if (status === 'suspended') return <span style={{ color: '#A2191F', fontSize: 13 }}>● Suspended</span>;
  return <span style={{ color: '#8D6E00', fontSize: 13 }}>{short ? '● Invited' : '● Invited — awaiting first login'}</span>;
}

function RoleChip({ role }: { role: StaffRole }) {
  return (
    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 2, ...(roleChip[role] ?? {}) }}>{ROLE_LABELS[role]}</span>
  );
}

export default function UsersTable({ users, currentUserId }: { users: StaffListItem[]; currentUserId: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Same narrow detection as the app shell: SSR/first render = desktop, adjust on mount.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (narrow) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', display: 'block' }}>
          <thead style={{ display: 'block' }}>
            <tr style={{ display: 'flex', alignItems: 'center', background: '#E0E0E0' }}>
              <th style={{ ...th, flex: 1, minWidth: 0 }}>Name</th>
              <th style={{ ...th, width: 104, boxSizing: 'border-box', flex: 'none' }}>Status</th>
              <th style={{ ...th, width: 34, flex: 'none' }} aria-hidden="true" />
            </tr>
          </thead>
          <tbody style={{ display: 'block' }}>
            {users.length === 0 && (
              <tr style={{ display: 'block' }}>
                <td style={{ ...td, color: '#8D8D8D', display: 'block' }} colSpan={3}>
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const suspended = u.status === 'suspended';
              const open = openId === u.id;
              const detailId = `user-detail-${u.id}`;
              const toggle = () => setOpenId(open ? null : u.id);
              return (
                <Fragment key={u.id}>
                  <tr
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    aria-controls={detailId}
                    onClick={toggle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle();
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', minHeight: 44, borderTop: '1px solid #E0E0E0', cursor: 'pointer', background: suspended ? '#FAFAFA' : '#fff' }}
                  >
                    <td style={{ fontSize: 14, padding: '10px 12px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: suspended ? '#8D8D8D' : undefined }}>
                      {u.name}
                      {isSelf && <span style={{ color: '#8D8D8D', fontSize: 12 }}> (you)</span>}
                    </td>
                    <td style={{ padding: '10px 8px', width: 104, boxSizing: 'border-box', flex: 'none', whiteSpace: 'nowrap' }}>
                      <StatusLabel status={u.status} short />
                    </td>
                    <td style={{ width: 34, flex: 'none', textAlign: 'center', fontSize: 10, color: '#525252' }}>{open ? '▲' : '▼'}</td>
                  </tr>
                  {open && (
                    <tr id={detailId} style={{ display: 'block', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
                      <td style={{ display: 'block', padding: '4px 12px 12px' }} colSpan={3}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: 13 }}>
                          <span style={{ color: '#525252' }}>Email</span>
                          <span style={{ color: '#161616', overflowWrap: 'anywhere' }}>{u.email}</span>
                          <span style={{ color: '#525252' }}>Role</span>
                          <span>
                            <RoleChip role={u.role} />
                          </span>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          {isSelf ? (
                            <span style={{ fontSize: 12, color: '#8D8D8D' }}>You cannot change your own access</span>
                          ) : (
                            <UserRowActions userId={u.id} suspended={suspended} isSelf={false} full />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
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
                {u.id === currentUserId && <span style={{ color: '#8D8D8D', fontSize: 12 }}> (you)</span>}
              </td>
              <td style={{ ...td, color: '#525252' }}>{u.email}</td>
              <td style={td}>
                <RoleChip role={u.role} />
              </td>
              <td style={td}>
                <StatusLabel status={u.status} short={false} />
              </td>
              <td style={td}>
                <UserRowActions userId={u.id} suspended={u.status === 'suspended'} isSelf={u.id === currentUserId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
