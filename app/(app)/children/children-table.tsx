'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';

export type ChildRow = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  homeAddress: string | null;
  healthDetails: string | null;
  emergency: boolean;
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

function EmergencyDot() {
  return <span title="Emergency medical note today" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', marginRight: 8 }} />;
}
const Magnifier = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);

type Filter = 'all' | 'alerts';

export default function ChildrenTable({ children }: { children: ChildRow[] }) {
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
    if (!ql) return children;
    return children.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(ql) ||
        c.guardianName.toLowerCase().includes(ql) ||
        c.guardianPhone.toLowerCase().includes(ql),
    );
  }, [children, q]);

  const alertsCount = useMemo(() => searched.filter((c) => c.emergency).length, [searched]);
  const displayed = filter === 'alerts' ? searched.filter((c) => c.emergency) : searched;

  const desktop = (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
        <thead>
          <tr style={{ background: '#E0E0E0' }}>
            <th style={th}>Name</th>
            <th style={th}>Age</th>
            <th style={th}>Guardian</th>
            <th style={th}>Phone</th>
            <th style={th}>Address</th>
            <th style={th}>Health</th>
          </tr>
        </thead>
        <tbody>
          {searched.length === 0 && (
            <tr>
              <td style={{ ...td, color: '#8D8D8D' }} colSpan={6}>No children match.</td>
            </tr>
          )}
          {searched.map((c) => (
            <tr key={c.id}>
              <td style={td}>
                {c.emergency && <EmergencyDot />}
                <Link href={`/children/${c.id}`} style={{ color: '#0F62FE' }}>
                  {c.firstName} {c.lastName}
                </Link>
              </td>
              <td style={td}>{c.age ?? '—'}</td>
              <td style={td}>{c.guardianName}</td>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{c.guardianPhone}</td>
              <td style={{ ...td, color: '#525252' }}>{c.homeAddress ?? '—'}</td>
              <td style={{ ...td, color: '#525252' }}>{c.healthDetails ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const mobileRows: CollapsibleRow[] = displayed.map((c) => ({
    key: c.id,
    primary: (
      <Link href={`/children/${c.id}`} onClick={(e) => e.stopPropagation()} style={{ color: '#0F62FE', fontSize: 15, textDecoration: 'none' }}>
        {c.firstName} {c.lastName}
      </Link>
    ),
    secondary: (
      <div style={{ fontSize: 12, color: '#525252' }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Age {c.age ?? '—'} · {c.guardianName}
        </div>
        <div style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.guardianPhone}</div>
      </div>
    ),
    status: c.emergency ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#DA1E28' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', flex: 'none' }} />
        Emergency
      </span>
    ) : null,
    detail: (
      <>
        <DetailGrid
          items={[
            { label: 'Address', value: c.homeAddress ?? '—' },
            { label: 'Health', value: c.healthDetails ?? '—' },
          ]}
        />
        <div style={{ marginTop: 12 }}>
          <Link href={`/children/${c.id}`} style={{ color: '#0F62FE', fontSize: 13 }}>
            Open child →
          </Link>
        </div>
      </>
    ),
  }));

  const cells: { key: Filter; label: string; count: number; countColor?: string }[] = [
    { key: 'all', label: 'ALL', count: searched.length },
    { key: 'alerts', label: 'ALERTS TODAY', count: alertsCount, countColor: '#DA1E28' },
  ];

  return (
    <div>
      <div style={{ height: 44, background: '#fff', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', marginBottom: narrow ? 14 : 12 }}>
        <Magnifier />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, guardian or phone"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}
        />
      </div>

      {narrow && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff', border: '1px solid #E0E0E0', marginBottom: 14 }}>
          {cells.map((c, i) => {
            const selected = filter === c.key;
            const disabled = c.count === 0;
            const countColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : c.countColor ?? '#161616';
            const labelColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : '#525252';
            return (
              <button
                key={c.key}
                type="button"
                disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onClick={disabled ? undefined : () => setFilter(c.key)}
                style={{
                  height: 52,
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
                <span style={{ fontSize: 18, fontWeight: 600, color: countColor }}>{c.count}</span>
                <span style={{ fontSize: 10, letterSpacing: '.04em', color: labelColor }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Alert" statusWidth={112} empty="No children match." />
    </div>
  );
}
