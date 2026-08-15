'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AttendanceRow } from '@/lib/reports';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';
import { Card, FilterChips, SegmentStrip, StatusTag, type Chip, type StatusTone } from '@/components/console';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', whiteSpace: 'nowrap' };

const ACTION_TAG: Record<'Check in' | 'Check out', { tone: StatusTone; label: string }> = {
  'Check in': { tone: 'success', label: 'Check in' },
  'Check out': { tone: 'neutral', label: 'Check out' },
};

// Override: a dot + word + reason after the status tag — same on both widths.
function Override({ reason }: { reason: string | null }) {
  return (
    <span style={{ color: '#8D6E00', whiteSpace: 'normal', fontSize: 12 }}>
      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#8D6E00', marginRight: 5, verticalAlign: 'middle' }} />
      Override · {reason ?? 'Admin override'}
    </span>
  );
}

type Filter = 'all' | 'in' | 'out' | 'override';

export default function AttendanceTable({ rows, allDays, toolbar }: { rows: AttendanceRow[]; allDays: boolean; toolbar?: ReactNode }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const counts = useMemo(
    () => ({
      all: rows.length,
      in: rows.filter((r) => r.action === 'Check in').length,
      out: rows.filter((r) => r.action === 'Check out').length,
      override: rows.filter((r) => r.isOverride).length,
    }),
    [rows],
  );
  const displayed = rows.filter((r) =>
    filter === 'in' ? r.action === 'Check in' : filter === 'out' ? r.action === 'Check out' : filter === 'override' ? r.isOverride : true,
  );

  const chips: (Chip & { key: Filter })[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'in', label: 'In', count: counts.in },
    { key: 'out', label: 'Out', count: counts.out },
    { key: 'override', label: 'Override', count: counts.override },
  ];

  const desktop = (
    <Card>
      <div style={{ minHeight: 48, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', flexWrap: 'wrap' }}>
        {toolbar}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <FilterChips chips={chips} value={filter} onChange={setFilter} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: allDays ? 760 : 640 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              {allDays && <th style={th}>Day</th>}
              <th style={th}>Time</th>
              <th style={th}>Child</th>
              <th style={th}>Action</th>
              <th style={th}>Staff</th>
              <th style={th}>Collector</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={allDays ? 6 : 5}>
                  No check-in / check-out activity{allDays ? ' yet' : ' for this day'}.
                </td>
              </tr>
            )}
            {displayed.map((r, i) => (
              <tr key={i}>
                {allDays && <td style={td}>{r.dayLabel}</td>}
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.time}</td>
                <td style={{ ...td, whiteSpace: 'normal' }}>{r.child}</td>
                <td style={{ ...td, whiteSpace: 'normal' }}>
                  <StatusTag tone={ACTION_TAG[r.action].tone}>{ACTION_TAG[r.action].label}</StatusTag>
                  {r.isOverride && (
                    <>
                      {' '}
                      <Override reason={r.overrideReason} />
                    </>
                  )}
                </td>
                <td style={{ ...td, color: '#525252' }}>{r.staff}</td>
                <td style={{ ...td, whiteSpace: 'normal', color: '#525252' }}>{r.collector || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const segments: { key: Filter; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all, color: '#161616' },
    { key: 'in', label: 'IN', count: counts.in, color: '#0E6027' },
    { key: 'out', label: 'OUT', count: counts.out, color: '#525252' },
    { key: 'override', label: 'OVERRIDE', count: counts.override, color: '#8D6E00' },
  ];

  const mobileRows: CollapsibleRow[] = displayed.map((r, i) => ({
    key: String(i),
    primary: <span style={{ fontSize: 15 }}>{r.child}</span>,
    secondary: (
      <div style={{ fontSize: 12, color: '#525252' }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {allDays ? `${r.dayLabel} · ` : ''}
          <span style={{ fontFamily: 'monospace' }}>{r.time}</span>
          {` · ${r.staff}`}
          {r.collector ? ` · ${r.collector}` : ''}
        </div>
        {r.isOverride && (
          <div style={{ marginTop: 2 }}>
            <Override reason={r.overrideReason} />
          </div>
        )}
      </div>
    ),
    status: <StatusTag tone={ACTION_TAG[r.action].tone}>{ACTION_TAG[r.action].label}</StatusTag>,
    detail: (
      <DetailGrid
        items={[
          ...(allDays ? [{ label: 'Day', value: r.dayLabel }] : []),
          { label: 'Time', value: <span style={{ fontFamily: 'monospace' }}>{r.time}</span> },
          { label: 'Staff', value: r.staff },
          { label: 'Collector', value: r.collector || '—' },
        ]}
      />
    ),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {narrow && (
        <>
          {toolbar && <div>{toolbar}</div>}
          <SegmentStrip segments={segments} value={filter} onChange={setFilter} />
        </>
      )}
      <CollapsibleTable
        desktop={desktop}
        rows={mobileRows}
        primaryHeader="Child · time"
        statusHeader="Action"
        statusWidth={112}
        empty={`No check-in / check-out activity${allDays ? ' yet' : ' for this day'}.`}
      />
    </div>
  );
}
