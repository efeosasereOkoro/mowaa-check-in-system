'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StaffListItem } from '@/lib/staff-admin';
import type { StaffRole } from '@/lib/staff';
import CollapsibleTable, { type CollapsibleRow } from '@/components/collapsible-table';
import UserRowActions from './user-row-actions';

// Local labels — client component must not import a *value* from lib/staff. D-027.
const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  receptionist: 'Receptionist',
  health: 'Health Officer',
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

const statusMeta: Record<StaffListItem['status'], { color: string; word: string }> = {
  active: { color: '#0E6027', word: 'Active' },
  invited: { color: '#8D6E00', word: 'Invited' },
  suspended: { color: '#A2191F', word: 'Suspended' },
};

function StatusDot({ status }: { status: StaffListItem['status'] }) {
  const m = statusMeta[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: m.color }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flex: 'none' }} />
      {m.word}
    </span>
  );
}

const Magnifier = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);

type Filter = 'all' | StaffRole;

export default function UsersTable({ users, currentUserId }: { users: StaffListItem[]; currentUserId: string }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const searched = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return users;
    return users.filter((u) => u.name.toLowerCase().includes(ql) || u.email.toLowerCase().includes(ql));
  }, [users, q]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      admin: searched.filter((u) => u.role === 'admin').length,
      receptionist: searched.filter((u) => u.role === 'receptionist').length,
      health: searched.filter((u) => u.role === 'health').length,
    }),
    [searched],
  );

  const displayed = filter === 'all' ? searched : searched.filter((u) => u.role === filter);

  const desktop = (
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
          {searched.length === 0 && (
            <tr>
              <td style={{ ...td, color: '#8D8D8D' }} colSpan={5}>No users match.</td>
            </tr>
          )}
          {searched.map((u) => (
            <tr key={u.id} style={u.status === 'suspended' ? { background: '#FAFAFA' } : undefined}>
              <td style={{ ...td, color: u.status === 'suspended' ? '#8D8D8D' : undefined }}>
                {u.name}
                {u.id === currentUserId && <span style={{ color: '#8D8D8D', fontSize: 12 }}> (you)</span>}
              </td>
              <td style={{ ...td, color: '#525252' }}>{u.email}</td>
              <td style={{ ...td, fontSize: 13 }}>{ROLE_LABELS[u.role]}</td>
              <td style={{ ...td, fontSize: 13 }}>
                <StatusDot status={u.status} />
              </td>
              <td style={td}>
                <UserRowActions userId={u.id} name={u.name} suspended={u.status === 'suspended'} isSelf={u.id === currentUserId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const mobileRows: CollapsibleRow[] = displayed.map((u) => {
    const isSelf = u.id === currentUserId;
    const suspended = u.status === 'suspended';
    return {
      key: u.id,
      rowStyle: suspended ? { background: '#FAFAFA' } : undefined,
      primaryStyle: suspended ? { color: '#8D8D8D' } : undefined,
      primary: (
        <span style={{ fontSize: 15 }}>
          {u.name}
          {isSelf && <span style={{ color: '#8D8D8D', fontSize: 12 }}> (you)</span>}
        </span>
      ),
      secondary: (
        <div style={{ fontSize: 12, color: '#525252', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <StatusDot status={u.status} /> · {u.email}
        </div>
      ),
      status: <span style={{ fontSize: 13 }}>{ROLE_LABELS[u.role]}</span>,
      detail: isSelf ? (
        <span style={{ fontSize: 12, color: '#8D8D8D' }}>You cannot change your own access</span>
      ) : (
        <UserRowActions userId={u.id} name={u.name} suspended={suspended} isSelf={false} full />
      ),
    };
  });

  const cells: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'ALL', count: counts.all },
    { key: 'admin', label: 'ADMIN', count: counts.admin },
    { key: 'receptionist', label: 'RECEPTION', count: counts.receptionist },
    { key: 'health', label: 'HEALTH', count: counts.health },
  ];

  return (
    <div>
      <div style={{ height: 44, background: '#fff', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', marginBottom: narrow ? 14 : 12 }}>
        <Magnifier />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}
        />
      </div>

      {narrow && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #E0E0E0', marginBottom: 14 }}>
          {cells.map((c, i) => {
            const selected = filter === c.key;
            const disabled = c.count === 0;
            const countColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : '#161616';
            const labelColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : '#525252';
            return (
              <button
                key={c.key}
                type="button"
                disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onClick={disabled ? undefined : () => setFilter(c.key)}
                style={{
                  height: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: i === 0 ? 'none' : '1px solid #E0E0E0',
                  borderBottom: selected ? '3px solid #0F62FE' : '3px solid transparent',
                  background: disabled ? '#FAFAFA' : selected ? '#EDF5FF' : '#fff',
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'default' : 'pointer',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1, color: countColor }}>{c.count}</span>
                <span style={{ fontSize: 10, letterSpacing: '.04em', color: labelColor }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Role" statusWidth={112} empty="No users match." />
    </div>
  );
}
