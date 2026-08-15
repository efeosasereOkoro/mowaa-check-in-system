'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StaffListItem } from '@/lib/staff-admin';
import type { StaffRole } from '@/lib/staff';
import CollapsibleTable, { type CollapsibleRow } from '@/components/collapsible-table';
import { Card, Toolbar, SearchRow, FilterChips, SegmentStrip, StatusTag, type Chip, type StatusTone } from '@/components/console';
import UserRowActions from './user-row-actions';

// Local labels — client component must not import a *value* from lib/staff. D-027.
const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  receptionist: 'Receptionist',
  health: 'Health Officer',
};

const STATUS_TAG: Record<StaffListItem['status'], { tone: StatusTone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  invited: { tone: 'warning', label: 'Invited' },
  suspended: { tone: 'danger', label: 'Suspended' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

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

  const chips: (Chip & { key: Filter })[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'admin', label: 'Admin', count: counts.admin },
    { key: 'receptionist', label: 'Reception', count: counts.receptionist },
    { key: 'health', label: 'Health', count: counts.health },
  ];

  const desktop = (
    <Card>
      <Toolbar q={q} onQ={setQ} placeholder="Search name or email" chips={<FilterChips chips={chips} value={filter} onChange={setFilter} />} />
      <div style={{ overflowX: 'auto' }}>
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
            {displayed.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={5}>
                  No users match.
                </td>
              </tr>
            )}
            {displayed.map((u) => (
              <tr key={u.id} style={u.status === 'suspended' ? { background: '#FAFAFA' } : undefined}>
                <td style={{ ...td, color: u.status === 'suspended' ? '#8D8D8D' : undefined }}>
                  {u.name}
                  {u.id === currentUserId && <span style={{ color: '#8D8D8D', fontSize: 12 }}> (you)</span>}
                </td>
                <td style={{ ...td, color: '#525252' }}>{u.email}</td>
                <td style={{ ...td, fontSize: 13 }}>{ROLE_LABELS[u.role]}</td>
                <td style={td}>
                  <StatusTag tone={STATUS_TAG[u.status].tone}>{STATUS_TAG[u.status].label}</StatusTag>
                </td>
                <td style={td}>
                  <UserRowActions userId={u.id} name={u.name} suspended={u.status === 'suspended'} isSelf={u.id === currentUserId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const segments: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'ALL', count: counts.all },
    { key: 'admin', label: 'ADMIN', count: counts.admin },
    { key: 'receptionist', label: 'RECEPTION', count: counts.receptionist },
    { key: 'health', label: 'HEALTH', count: counts.health },
  ];

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
          {ROLE_LABELS[u.role]} · {u.email}
        </div>
      ),
      status: <StatusTag tone={STATUS_TAG[u.status].tone}>{STATUS_TAG[u.status].label}</StatusTag>,
      detail: isSelf ? (
        <span style={{ fontSize: 12, color: '#8D8D8D' }}>You cannot change your own access</span>
      ) : (
        <UserRowActions userId={u.id} name={u.name} suspended={suspended} isSelf={false} full />
      ),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {narrow && (
        <>
          <SearchRow q={q} onQ={setQ} placeholder="Search name or email" />
          <SegmentStrip segments={segments} value={filter} onChange={setFilter} />
        </>
      )}
      <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Status" statusWidth={112} empty="No users match." />
    </div>
  );
}
