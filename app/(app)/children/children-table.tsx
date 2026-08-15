'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';
import { Card, Toolbar, SearchRow, FilterChips, SegmentStrip, StatusTag, type Chip } from '@/components/console';

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

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };

function EmergencyDot() {
  return <span title="Emergency medical note today" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', marginRight: 8 }} />;
}

type Filter = 'all' | 'alerts';

export default function ChildrenTable({ rows }: { rows: ChildRow[] }) {
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
    if (!ql) return rows;
    return rows.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(ql) ||
        c.guardianName.toLowerCase().includes(ql) ||
        c.guardianPhone.toLowerCase().includes(ql),
    );
  }, [rows, q]);

  const counts = useMemo(() => ({ all: searched.length, alerts: searched.filter((c) => c.emergency).length }), [searched]);
  const displayed = filter === 'alerts' ? searched.filter((c) => c.emergency) : searched;

  const chips: (Chip & { key: Filter })[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'alerts', label: 'Alerts today', count: counts.alerts },
  ];

  const desktop = (
    <Card>
      <Toolbar q={q} onQ={setQ} placeholder="Search name, guardian or phone" chips={<FilterChips chips={chips} value={filter} onChange={setFilter} />} />
      <div style={{ overflowX: 'auto' }}>
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
            {displayed.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={6}>
                  No children match.
                </td>
              </tr>
            )}
            {displayed.map((c) => (
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
    </Card>
  );

  const segments: { key: Filter; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all, color: '#161616' },
    { key: 'alerts', label: 'ALERTS TODAY', count: counts.alerts, color: '#DA1E28' },
  ];

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
    status: c.emergency ? <StatusTag tone="danger">Emergency</StatusTag> : null,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {narrow && (
        <>
          <SearchRow q={q} onQ={setQ} placeholder="Search name, guardian or phone" />
          <SegmentStrip segments={segments} value={filter} onChange={setFilter} />
        </>
      )}
      <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Alert" statusWidth={112} empty="No children match." />
    </div>
  );
}
