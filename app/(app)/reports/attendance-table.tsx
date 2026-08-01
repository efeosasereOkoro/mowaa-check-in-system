'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AttendanceRow } from '@/lib/reports';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', whiteSpace: 'nowrap' };

// Override: a dot + word + reason, no background — same on both widths.
function Override({ reason }: { reason: string | null }) {
  return (
    <span style={{ color: '#8D6E00', whiteSpace: 'normal' }}>
      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#8D6E00', marginRight: 5, verticalAlign: 'middle' }} />
      Override · {reason ?? 'Admin override'}
    </span>
  );
}

const actionDot: Record<'Check in' | 'Check out', { dot: string; text: string }> = {
  'Check in': { dot: '#0E6027', text: '#0E6027' },
  'Check out': { dot: '#A8A8A8', text: '#525252' },
};

type Filter = 'all' | 'in' | 'out' | 'override';

export default function AttendanceTable({ rows, allDays }: { rows: AttendanceRow[]; allDays: boolean }) {
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
  const displayed = useMemo(
    () =>
      rows.filter((r) => (filter === 'in' ? r.action === 'Check in' : filter === 'out' ? r.action === 'Check out' : filter === 'override' ? r.isOverride : true)),
    [rows, filter],
  );

  const desktop = (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
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
          {rows.length === 0 && (
            <tr>
              <td style={{ ...td, color: '#8D8D8D' }} colSpan={allDays ? 6 : 5}>
                No check-in / check-out activity{allDays ? ' yet' : ' for this day'}.
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i}>
              {allDays && <td style={td}>{r.dayLabel}</td>}
              <td style={{ ...td, fontFamily: 'monospace' }}>{r.time}</td>
              <td style={{ ...td, whiteSpace: 'normal' }}>{r.child}</td>
              <td style={td}>
                {r.action}
                {r.isOverride && <> · <Override reason={r.overrideReason} /></>}
              </td>
              <td style={{ ...td, color: '#525252' }}>{r.staff}</td>
              <td style={{ ...td, whiteSpace: 'normal', color: '#525252' }}>{r.collector || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const mobileRows: CollapsibleRow[] = displayed.map((r, i) => {
    const a = actionDot[r.action];
    return {
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
      status: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: a.text }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot, flex: 'none' }} />
          {r.action}
        </span>
      ),
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
    };
  });

  const cells: { key: Filter; label: string; count: number; countColor?: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all },
    { key: 'in', label: 'IN', count: counts.in, countColor: '#0E6027' },
    { key: 'out', label: 'OUT', count: counts.out },
    { key: 'override', label: 'OVERRIDE', count: counts.override, countColor: '#8D6E00' },
  ];

  return (
    <div>
      {narrow && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #E0E0E0', marginBottom: 12 }}>
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
