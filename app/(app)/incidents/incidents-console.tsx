'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { IncidentListItem } from '@/lib/incidents';

// Local label maps — a client component must not import a *value* from a server lib (D-027).
const CATEGORY_LABEL: Record<string, string> = {
  safeguarding: 'Safeguarding concern',
  medical_emergency: 'Medical emergency',
  injury: 'Injury',
  abuse_suspicion: 'Suspicion of abuse',
  security_breach: 'Security / safety breach',
  theft_damage: 'Theft / damage',
  other: 'Other',
};
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#343A3F', bg: '#DDE1E6' },
  escalated: { label: 'Escalated to CPO', color: '#8D6E00', bg: '#FCF4D6' },
  investigating: { label: 'Under investigation', color: '#0043CE', bg: '#D0E2FF' },
  resolved: { label: 'Resolved', color: '#0E6027', bg: '#A7F0BA' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };
const sel: React.CSSProperties = { height: 40, border: '1px solid #E0E0E0', background: '#fff', padding: '0 10px', fontSize: 14, appearance: 'auto' };

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.submitted;
  return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>;
}

export default function IncidentsConsole({ incidents }: { incidents: IncidentListItem[] }) {
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      incidents.filter(
        (i) => (category === 'all' || i.category === category) && (status === 'all' || i.status === status),
      ),
    [incidents, category, status],
  );

  // Export the current view — the CSV route applies the same category/status filters server-side.
  const exportUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (category !== 'all') p.set('category', category);
    if (status !== 'all') p.set('status', status);
    const q = p.toString();
    return `/api/reports/incidents${q ? `?${q}` : ''}`;
  }, [category, status]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={sel} aria-label="Filter by type">
          <option value="all">All types</option>
          {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={sel} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <option key={v} value={v}>
              {m.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: '#525252' }}>
          {filtered.length} of {incidents.length}
        </span>
        <a
          href={exportUrl}
          style={{ marginLeft: 'auto', height: 40, padding: '0 14px', border: '1px solid #161616', color: '#161616', background: '#fff', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
        >
          Export CSV
        </a>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              <th style={th}>Type</th>
              <th style={th}>Status</th>
              <th style={th}>Child</th>
              <th style={th}>Reported by</th>
              <th style={th}>Filed</th>
              <th style={th}>Guardian</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={7}>
                  {incidents.length === 0 ? 'No incidents reported yet.' : 'No incidents match these filters.'}
                </td>
              </tr>
            )}
            {filtered.map((i) => (
              <tr key={i.id}>
                <td style={td}>
                  {CATEGORY_LABEL[i.category] ?? i.category}
                  {i.category === 'other' && i.categoryOther ? <span style={{ color: '#525252' }}> — {i.categoryOther}</span> : null}
                </td>
                <td style={td}>
                  <StatusBadge status={i.status} />
                </td>
                <td style={{ ...td, color: i.childName ? undefined : '#8D8D8D' }}>{i.childName ?? '—'}</td>
                <td style={{ ...td, color: '#525252' }}>{i.reportedBy ?? '—'}</td>
                <td style={{ ...td, color: '#525252', whiteSpace: 'nowrap' }}>{i.filedAt ?? '—'}</td>
                <td style={td}>{i.guardianNotified ? '✓' : <span style={{ color: '#8D8D8D' }}>—</span>}</td>
                <td style={td}>
                  <Link href={`/incidents/${i.id}`} style={{ color: '#0F62FE', whiteSpace: 'nowrap' }}>
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
