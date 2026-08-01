'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { RosterRow } from '@/lib/dashboard';
import type { ChildStatus } from '@/lib/attendance';

const meta: Record<ChildStatus, { label: string; bg: string; fg: string }> = {
  checked_in: { label: 'Checked in', bg: '#A7F0BA', fg: '#0E6027' },
  checked_out: { label: 'Checked out', bg: '#E0E0E0', fg: '#393939' },
  not_arrived: { label: 'Not arrived', bg: '#DDE1E6', fg: '#343A3F' },
};

// Narrow row status: a dot + word, not a filled pill.
const statusNarrow: Record<ChildStatus, { dot: string; text: string; word: string; dotBorder?: string }> = {
  checked_in: { dot: '#0E6027', text: '#0E6027', word: 'On site' },
  checked_out: { dot: '#A8A8A8', text: '#525252', word: 'Out' },
  not_arrived: { dot: '#E0E0E0', text: '#525252', word: 'Not in', dotBorder: '1px solid #A8A8A8' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

type Filter = 'all' | ChildStatus;

export default function Roster({ roster, actionBar = false }: { roster: RosterRow[]; actionBar?: boolean }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => setOpenId(null), [q, filter]);

  // Counts + displayed rows in one pass: apply the text query FIRST, count by status on
  // that searched set, THEN apply the status filter — so the strip can never disagree
  // with the rows on screen.
  const { counts, rows } = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const searched = roster.filter(
      (r) => !ql || `${r.firstName} ${r.lastName}`.toLowerCase().includes(ql) || (r.tagCode?.toLowerCase().includes(ql) ?? false),
    );
    const counts = {
      all: searched.length,
      checked_in: searched.filter((r) => r.status === 'checked_in').length,
      checked_out: searched.filter((r) => r.status === 'checked_out').length,
      not_arrived: searched.filter((r) => r.status === 'not_arrived').length,
    };
    const rows = filter === 'all' ? searched : searched.filter((r) => r.status === filter);
    return { counts, rows };
  }, [roster, q, filter]);

  // ---------- NARROW: filter strip + rows + sticky-bar clearance ----------
  if (narrow) {
    const cells: { key: Filter; label: string; count: number }[] = [
      { key: 'all', label: 'ALL', count: counts.all },
      { key: 'checked_in', label: 'ON-SITE', count: counts.checked_in },
      { key: 'checked_out', label: 'OUT', count: counts.checked_out },
      { key: 'not_arrived', label: 'NOT IN', count: counts.not_arrived },
    ];

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #E0E0E0', marginBottom: 12 }}>
          {cells.map((c, i) => {
            const selected = filter === c.key;
            const disabled = c.count === 0;
            const countColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : c.key === 'checked_in' ? '#0E6027' : '#161616';
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

        <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          {rows.length === 0 && (
            <div style={{ padding: '11px 12px', fontSize: 14, color: '#8D8D8D' }}>No children match.</div>
          )}
          {rows.map((r, idx) => {
            const s = statusNarrow[r.status];
            const open = openId === r.id;
            const detailId = `roster-detail-${r.id}`;
            const toggle = () => setOpenId(open ? null : r.id);
            const segs: React.ReactNode[] = [];
            if (r.age != null) segs.push(<span key="age">Age {r.age}</span>);
            segs.push(<span key="tag" style={{ fontFamily: 'monospace' }}>{r.tagCode ?? 'no tag'}</span>);
            if (r.inAt) segs.push(<span key="in">in <span style={{ fontFamily: 'monospace' }}>{r.inAt}</span></span>);
            if (r.outAt) segs.push(<span key="out">out <span style={{ fontFamily: 'monospace' }}>{r.outAt}</span></span>);

            return (
              <Fragment key={r.id}>
                <div
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
                  style={{ padding: '11px 12px', minHeight: 56, display: 'flex', alignItems: 'center', gap: 10, borderTop: idx === 0 ? 'none' : '1px solid #E0E0E0', cursor: 'pointer', background: '#fff', boxSizing: 'border-box' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.firstName} {r.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: '#525252', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {segs.map((seg, i) => (
                        <Fragment key={i}>
                          {i > 0 ? ' · ' : ''}
                          {seg}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: s.text }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, border: s.dotBorder, boxSizing: 'border-box', flex: 'none' }} />
                    {s.word}
                  </div>
                  <span style={{ flex: 'none', fontSize: 10, color: '#8D8D8D' }}>{open ? '▲' : '▼'}</span>
                </div>
                {open && (
                  <div id={detailId} style={{ background: '#F4F4F4', borderTop: '1px solid #E0E0E0', padding: '4px 12px 12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: 13 }}>
                      <span style={{ color: '#525252' }}>Age</span>
                      <span>{r.age ?? '—'}</span>
                      <span style={{ color: '#525252' }}>Tag</span>
                      <span style={{ fontFamily: 'monospace' }}>{r.tagCode ?? '—'}</span>
                      <span style={{ color: '#525252' }}>In</span>
                      <span style={{ fontFamily: 'monospace' }}>{r.inAt ?? '—'}</span>
                      <span style={{ color: '#525252' }}>Out</span>
                      <span style={{ fontFamily: 'monospace' }}>{r.outAt ?? '—'}</span>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        {actionBar && <div style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />}
      </div>
    );
  }

  // ---------- DESKTOP (unchanged) ----------
  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${roster.length})` },
    { key: 'checked_in', label: `On-site (${roster.filter((r) => r.status === 'checked_in').length})` },
    { key: 'checked_out', label: `Checked out (${roster.filter((r) => r.status === 'checked_out').length})` },
    { key: 'not_arrived', label: `Not arrived (${roster.filter((r) => r.status === 'not_arrived').length})` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              cursor: 'pointer',
              border: '1px solid ' + (filter === c.key ? '#0F62FE' : '#8D8D8D'),
              background: filter === c.key ? '#EDF5FF' : '#fff',
              color: filter === c.key ? '#0F62FE' : '#161616',
            }}
          >
            {c.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or tag"
          style={{ flex: 1, minWidth: 180, height: 32, border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', fontSize: 13 }}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              <th style={th}>Name</th>
              <th style={th}>Age</th>
              <th style={th}>Tag</th>
              <th style={th}>Status</th>
              <th style={th}>In</th>
              <th style={th}>Out</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={6}>
                  No children match.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const m = meta[r.status];
              return (
                <tr key={r.id}>
                  <td style={td}>{r.firstName} {r.lastName}</td>
                  <td style={td}>{r.age ?? '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{r.tagCode ?? '—'}</td>
                  <td style={td}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', background: m.bg, color: m.fg }}>{m.label}</span>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{r.inAt ?? '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{r.outAt ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
