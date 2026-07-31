'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { RosterRow } from '@/lib/dashboard';
import type { ChildStatus } from '@/lib/attendance';

const meta: Record<ChildStatus, { label: string; bg: string; fg: string }> = {
  checked_in: { label: 'Checked in', bg: '#A7F0BA', fg: '#0E6027' },
  checked_out: { label: 'Checked out', bg: '#E0E0E0', fg: '#393939' },
  not_arrived: { label: 'Not arrived', bg: '#DDE1E6', fg: '#343A3F' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

type Filter = 'all' | ChildStatus;

export default function Roster({ roster }: { roster: RosterRow[] }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  // Same narrow detection as the app shell: SSR/first render = desktop, adjust on mount.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Never leave a now-hidden row expanded.
  useEffect(() => setOpenId(null), [q, filter]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return roster.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!ql) return true;
      return `${r.firstName} ${r.lastName}`.toLowerCase().includes(ql) || (r.tagCode?.toLowerCase().includes(ql) ?? false);
    });
  }, [roster, q, filter]);

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
          style={{ flex: 1, ...(narrow ? { flexBasis: '100%' } : { minWidth: 180 }), height: 32, border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', fontSize: 13 }}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E0E0E0', ...(narrow ? {} : { overflowX: 'auto' }) }}>
        {narrow ? (
          <table style={{ borderCollapse: 'collapse', width: '100%', display: 'block' }}>
            <thead style={{ display: 'block' }}>
              <tr style={{ display: 'flex', alignItems: 'center', background: '#E0E0E0' }}>
                <th style={{ ...th, flex: 1, minWidth: 0 }}>Name</th>
                <th style={{ ...th, width: 118, boxSizing: 'border-box', flex: 'none' }}>Status</th>
                <th style={{ ...th, width: 34, flex: 'none' }} aria-hidden="true" />
              </tr>
            </thead>
            <tbody style={{ display: 'block' }}>
              {rows.length === 0 && (
                <tr style={{ display: 'block' }}>
                  <td style={{ ...td, color: '#8D8D8D', display: 'block' }} colSpan={3}>
                    No children match.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const m = meta[r.status];
                const open = openId === r.id;
                const detailId = `roster-detail-${r.id}`;
                const toggle = () => setOpenId(open ? null : r.id);
                return (
                  <Fragment key={r.id}>
                    <tr
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
                      style={{ display: 'flex', alignItems: 'center', minHeight: 44, borderTop: '1px solid #E0E0E0', cursor: 'pointer', background: '#fff' }}
                    >
                      <td style={{ fontSize: 14, padding: '10px 12px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.firstName} {r.lastName}
                      </td>
                      <td style={{ padding: '10px 12px', width: 118, boxSizing: 'border-box', flex: 'none' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', background: m.bg, color: m.fg }}>{m.label}</span>
                      </td>
                      <td style={{ width: 34, flex: 'none', textAlign: 'center', fontSize: 10, color: '#525252' }}>{open ? '▲' : '▼'}</td>
                    </tr>
                    {open && (
                      <tr id={detailId} style={{ display: 'block', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
                        <td style={{ display: 'block', padding: '4px 12px 12px' }} colSpan={3}>
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
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
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
        )}
      </div>
    </div>
  );
}
