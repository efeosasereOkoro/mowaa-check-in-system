'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { HealthRosterRow } from '@/lib/medical';
import type { ChildStatus } from '@/lib/attendance';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';
import { Card, Toolbar, SearchRow, FilterChips, SegmentStrip, StatusTag, type Chip, type StatusTone } from '@/components/console';

const STATUS_TAG: Record<ChildStatus, { tone: StatusTone; label: string }> = {
  checked_in: { tone: 'success', label: 'On-site' },
  checked_out: { tone: 'neutral', label: 'Checked out' },
  not_arrived: { tone: 'neutral', label: 'Not arrived' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };

function EmergencyDot() {
  return <span title="Emergency note today" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', marginRight: 8 }} />;
}

type Filter = 'all' | 'alerts' | 'onsite' | 'out';

export default function HealthRoster({ roster }: { roster: HealthRosterRow[] }) {
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
    if (!ql) return roster;
    return roster.filter(
      (r) => `${r.firstName} ${r.lastName}`.toLowerCase().includes(ql) || (r.tagCode?.toLowerCase().includes(ql) ?? false),
    );
  }, [roster, q]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      alerts: searched.filter((r) => r.emergencyToday).length,
      onsite: searched.filter((r) => r.status === 'checked_in').length,
      out: searched.filter((r) => r.status === 'checked_out').length,
    }),
    [searched],
  );

  const displayed = searched.filter((r) =>
    filter === 'alerts' ? r.emergencyToday : filter === 'onsite' ? r.status === 'checked_in' : filter === 'out' ? r.status === 'checked_out' : true,
  );

  const chips: (Chip & { key: Filter })[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'alerts', label: 'Alerts', count: counts.alerts },
    { key: 'onsite', label: 'On-site', count: counts.onsite },
    { key: 'out', label: 'Out', count: counts.out },
  ];

  const desktop = (
    <Card>
      <Toolbar q={q} onQ={setQ} placeholder="Search name or tag" chips={<FilterChips chips={chips} value={filter} onChange={setFilter} />} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              <th style={th}>Name</th>
              <th style={th}>Tag</th>
              <th style={th}>Status</th>
              <th style={th}>Allergies / conditions</th>
              <th style={th}>Last note</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={5}>
                  No children match.
                </td>
              </tr>
            )}
            {displayed.map((r) => (
              <tr key={r.id}>
                <td style={td}>
                  {r.emergencyToday && <EmergencyDot />}
                  <Link href={`/health/${r.id}`} style={{ color: '#0F62FE' }}>
                    {r.firstName} {r.lastName}
                  </Link>
                </td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{r.tagCode ?? '—'}</td>
                <td style={td}>
                  <StatusTag tone={STATUS_TAG[r.status].tone}>{STATUS_TAG[r.status].label}</StatusTag>
                </td>
                <td style={{ ...td, color: '#525252', maxWidth: 260 }}>{r.healthDetails || '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#525252' }}>{r.lastNote ? `${r.lastNote.severity} · ${r.lastNote.when}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const segments: { key: Filter; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all, color: '#161616' },
    { key: 'alerts', label: 'ALERTS', count: counts.alerts, color: '#DA1E28' },
    { key: 'onsite', label: 'ON-SITE', count: counts.onsite, color: '#0E6027' },
    { key: 'out', label: 'OUT', count: counts.out, color: '#525252' },
  ];

  const mobileRows: CollapsibleRow[] = displayed.map((r) => ({
    key: r.id,
    rowStyle: r.status === 'checked_out' ? { background: '#FAFAFA' } : undefined,
    primary: (
      <Link href={`/health/${r.id}`} onClick={(e) => e.stopPropagation()} style={{ color: '#0F62FE', fontSize: 15, textDecoration: 'none' }}>
        {r.firstName} {r.lastName}
      </Link>
    ),
    secondary: (
      <div style={{ fontSize: 12, color: '#525252' }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.emergencyToday ? (
            <>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#DA1E28', marginRight: 5, verticalAlign: 'middle' }} />
              <span style={{ color: '#DA1E28' }}>Emergency today</span>
              {' · '}
              <span style={{ fontFamily: 'monospace' }}>{r.tagCode ?? 'no tag'}</span>
            </>
          ) : (
            <span style={{ fontFamily: 'monospace' }}>{r.tagCode ?? 'no tag'}</span>
          )}
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: r.healthDetails ? '#525252' : '#8D8D8D' }}>
          {r.healthDetails || 'No conditions recorded'}
        </div>
      </div>
    ),
    status: <StatusTag tone={STATUS_TAG[r.status].tone}>{STATUS_TAG[r.status].label}</StatusTag>,
    detail: (
      <>
        <DetailGrid items={[{ label: 'Last note', value: r.lastNote ? `${r.lastNote.severity} · ${r.lastNote.when}` : '—' }]} />
        <div style={{ marginTop: 12 }}>
          <Link href={`/health/${r.id}`} style={{ color: '#0F62FE', fontSize: 13 }}>
            View health record →
          </Link>
        </div>
      </>
    ),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {narrow && (
        <>
          <SearchRow q={q} onQ={setQ} placeholder="Search name or tag" />
          <SegmentStrip segments={segments} value={filter} onChange={setFilter} />
        </>
      )}
      <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Status" statusWidth={112} empty="No children match." />
    </div>
  );
}
