'use client';

import type { AttendanceRow } from '@/lib/reports';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', whiteSpace: 'nowrap' };

function OverrideBadge({ reason }: { reason: string | null }) {
  return (
    <span title={reason ?? 'Admin override'} style={{ marginLeft: 6, fontSize: 11, background: '#FFF1D6', color: '#8A6A00', padding: '1px 6px', borderRadius: 2 }}>
      override
    </span>
  );
}

export default function AttendanceTable({ rows, allDays }: { rows: AttendanceRow[]; allDays: boolean }) {
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
                {r.isOverride && <OverrideBadge reason={r.overrideReason} />}
              </td>
              <td style={{ ...td, color: '#525252' }}>{r.staff}</td>
              <td style={{ ...td, whiteSpace: 'normal', color: '#525252' }}>{r.collector || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const mobileRows: CollapsibleRow[] = rows.map((r, i) => ({
    key: String(i),
    primary: <>{r.child}</>,
    status: (
      <span style={{ fontSize: 13 }}>
        {r.action}
        {r.isOverride && <OverrideBadge reason={r.overrideReason} />}
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
  }));

  return (
    <CollapsibleTable
      desktop={desktop}
      rows={mobileRows}
      statusHeader="Action"
      statusWidth={128}
      empty={`No check-in / check-out activity${allDays ? ' yet' : ' for this day'}.`}
    />
  );
}
