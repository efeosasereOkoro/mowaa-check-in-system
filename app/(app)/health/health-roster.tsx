'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { HealthRosterRow } from '@/lib/medical';
import type { ChildStatus } from '@/lib/attendance';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';

const statusLabel: Record<ChildStatus, string> = {
  checked_in: 'On-site',
  checked_out: 'Checked out',
  not_arrived: 'Not arrived',
};
const statusDot: Record<ChildStatus, { dot: string; text: string; word: string; border?: string }> = {
  checked_in: { dot: '#0E6027', text: '#0E6027', word: 'On-site' },
  checked_out: { dot: '#A8A8A8', text: '#525252', word: 'Out' },
  not_arrived: { dot: '#E0E0E0', text: '#525252', word: 'Not in', border: '1px solid #A8A8A8' },
};
const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };

type Filter = 'all' | 'alerts' | 'onsite' | 'out';

function EmergencyDot() {
  return <span title="Emergency note today" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', marginRight: 8 }} />;
}
const Magnifier = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);

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

  const displayed = useMemo(
    () =>
      searched.filter((r) =>
        filter === 'alerts' ? r.emergencyToday : filter === 'onsite' ? r.status === 'checked_in' : filter === 'out' ? r.status === 'checked_out' : true,
      ),
    [searched, filter],
  );

  const desktop = (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
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
          {searched.length === 0 && (
            <tr><td style={{ ...td, color: '#8D8D8D' }} colSpan={5}>No children match.</td></tr>
          )}
          {searched.map((r) => (
            <tr key={r.id}>
              <td style={td}>
                {r.emergencyToday && <EmergencyDot />}
                <Link href={`/health/${r.id}`} style={{ color: '#0F62FE' }}>
                  {r.firstName} {r.lastName}
                </Link>
              </td>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{r.tagCode ?? '—'}</td>
              <td style={td}>{statusLabel[r.status]}</td>
              <td style={{ ...td, color: '#525252', maxWidth: 260 }}>{r.healthDetails || '—'}</td>
              <td style={{ ...td, fontSize: 12, color: '#525252' }}>{r.lastNote ? `${r.lastNote.severity} · ${r.lastNote.when}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const mobileRows: CollapsibleRow[] = displayed.map((r) => {
    const s = statusDot[r.status];
    return {
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
      status: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: s.text }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, border: s.border, boxSizing: 'border-box', flex: 'none' }} />
          {s.word}
        </span>
      ),
      detail: (
        <>
          <DetailGrid
            items={[
              { label: 'Last note', value: r.lastNote ? `${r.lastNote.severity} · ${r.lastNote.when}` : '—' },
            ]}
          />
          <div style={{ marginTop: 12 }}>
            <Link href={`/health/${r.id}`} style={{ color: '#0F62FE', fontSize: 13 }}>
              View health record →
            </Link>
          </div>
        </>
      ),
    };
  });

  const cells: { key: Filter; label: string; count: number; countColor?: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all },
    { key: 'alerts', label: 'ALERTS', count: counts.alerts, countColor: '#DA1E28' },
    { key: 'onsite', label: 'ON-SITE', count: counts.onsite, countColor: '#0E6027' },
    { key: 'out', label: 'OUT', count: counts.out },
  ];

  return (
    <div>
      {narrow ? (
        <div style={{ height: 44, background: '#fff', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', marginBottom: 12 }}>
          <Magnifier />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or tag"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}
          />
        </div>
      ) : (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or tag"
          style={{ width: '100%', maxWidth: 360, height: 40, border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', fontSize: 14, marginBottom: 12 }}
        />
      )}

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

      <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Status" statusWidth={112} empty="No children match." />
    </div>
  );
}
