'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';
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
const catLabel = (i: Pick<IncidentListItem, 'category' | 'categoryOther'>) =>
  i.category === 'other' && i.categoryOther ? `Other — ${i.categoryOther}` : CATEGORY_LABEL[i.category] ?? i.category;

// Desktop status chip meta (unchanged from the old console).
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#343A3F', bg: '#DDE1E6' },
  escalated: { label: 'Escalated to CPO', color: '#8D6E00', bg: '#FCF4D6' },
  investigating: { label: 'Under investigation', color: '#0043CE', bg: '#D0E2FF' },
  resolved: { label: 'Resolved', color: '#0E6027', bg: '#A7F0BA' },
};
// Mobile status: 8px dot + always a word (Resolved reads "Closed").
const STATUS_MOBILE: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: '#525252' },
  escalated: { label: 'Escalated', color: '#DA1E28' },
  investigating: { label: 'Investigating', color: '#8D6E00' },
  resolved: { label: 'Closed', color: '#0E6027' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };
const sel: React.CSSProperties = { height: 40, border: '1px solid #E0E0E0', background: '#fff', padding: '0 10px', fontSize: 14, appearance: 'auto' };

const Magnifier = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);

function DesktopStatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.submitted;
  return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>;
}

// Mobile-only teaching card shown when the tenant has zero reports (§4). Not a table row.
function EmptyState() {
  const steps = [
    <>Make the child or person safe first.</>,
    <>Put it in writing within <strong>24 hours</strong>.</>,
    <>Tell the guardian, and record that you did.</>,
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0E6027', flex: 'none' }} />
        <span style={{ fontSize: 14, color: '#0E6027' }}>Nothing to report</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, margin: '10px 0 6px' }}>Safeguarding and incident reports appear here</div>
      <div style={{ fontSize: 13, color: '#525252', lineHeight: 1.5 }}>
        Anyone on duty can file one. Reports go to the Protection Officer and cannot be edited afterwards — corrections
        are added as updates.
      </div>

      <div style={{ borderTop: '1px solid #E0E0E0', margin: '16px 0' }} />

      <div style={{ fontSize: 12, color: '#525252', marginBottom: 10 }}>Before you file</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ width: 20, height: 20, flex: 'none', background: '#161616', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.4 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #E0E0E0', margin: '16px 0' }} />

      <div style={{ fontSize: 13, color: '#525252', lineHeight: 1.5 }}>
        Recording an allergy or condition against a child? Use{' '}
        <Link href="/health" style={{ color: '#0F62FE' }}>
          Health
        </Link>{' '}
        instead.
      </div>
    </div>
  );
}

type Seg = 'all' | 'escalated' | 'open' | 'closed';

export default function IncidentsTable({ incidents }: { incidents: IncidentListItem[] }) {
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState<Seg>('all');
  const [category, setCategory] = useState('all'); // desktop select
  const [status, setStatus] = useState('all'); // desktop select
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ---- Desktop (>= 672px): the original console, unchanged (native selects + wide table). ----
  const desktopFiltered = useMemo(
    () => incidents.filter((i) => (category === 'all' || i.category === category) && (status === 'all' || i.status === status)),
    [incidents, category, status],
  );
  const exportUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (category !== 'all') p.set('category', category);
    if (status !== 'all') p.set('status', status);
    const query = p.toString();
    return `/api/reports/incidents${query ? `?${query}` : ''}`;
  }, [category, status]);

  const searched = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return incidents;
    return incidents.filter(
      (i) =>
        i.id.slice(0, 8).toLowerCase().includes(ql) ||
        catLabel(i).toLowerCase().includes(ql) ||
        (i.childName ?? '').toLowerCase().includes(ql) ||
        (i.reportedBy ?? '').toLowerCase().includes(ql),
    );
  }, [incidents, q]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      escalated: searched.filter((i) => i.status === 'escalated').length,
      open: searched.filter((i) => i.status === 'submitted' || i.status === 'investigating').length,
      closed: searched.filter((i) => i.status === 'resolved').length,
    }),
    [searched],
  );

  const desktop = (
    <>
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
          {desktopFiltered.length} of {incidents.length}
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
            {desktopFiltered.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={7}>
                  {incidents.length === 0 ? 'No incidents reported yet.' : 'No incidents match these filters.'}
                </td>
              </tr>
            )}
            {desktopFiltered.map((i) => (
              <tr key={i.id}>
                <td style={td}>
                  {CATEGORY_LABEL[i.category] ?? i.category}
                  {i.category === 'other' && i.categoryOther ? <span style={{ color: '#525252' }}> — {i.categoryOther}</span> : null}
                </td>
                <td style={td}>
                  <DesktopStatusBadge status={i.status} />
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
    </>
  );

  // Mobile with zero reports → the teaching card (never the search/counts/table).
  if (narrow && incidents.length === 0) return <EmptyState />;

  // ---- Mobile (< 672px): search + counts segments + collapsible rows. ----
  const displayed = searched.filter((i) => {
    if (seg === 'escalated') return i.status === 'escalated';
    if (seg === 'open') return i.status === 'submitted' || i.status === 'investigating';
    if (seg === 'closed') return i.status === 'resolved';
    return true;
  });

  const mobileRows: CollapsibleRow[] = displayed.map((i) => {
    const sm = STATUS_MOBILE[i.status] ?? STATUS_MOBILE.submitted;
    const ref = i.id.slice(0, 8);
    const showGuardianFlag = i.status !== 'resolved' && !i.guardianNotified && !!i.childName;
    return {
      key: i.id,
      rowStyle: i.status === 'resolved' ? { background: '#FAFAFA' } : undefined,
      primary: (
        <Link href={`/incidents/${i.id}`} onClick={(e) => e.stopPropagation()} style={{ color: '#0F62FE', fontSize: 15, textDecoration: 'none' }}>
          {catLabel(i)}
        </Link>
      ),
      secondary: (
        <>
          <div style={{ fontSize: 12, color: '#525252', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: 'monospace' }}>{ref}</span> · {i.filedAt ?? '—'} · {i.childName ?? 'no child'}
          </div>
          {showGuardianFlag && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, fontSize: 12, color: '#8D6E00' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8D6E00', flex: 'none' }} />
              Guardian not notified
            </div>
          )}
        </>
      ),
      status: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: sm.color }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: sm.color, flex: 'none' }} />
          {sm.label}
        </span>
      ),
      detail: (
        <>
          <DetailGrid
            items={[
              { label: 'Reported by', value: i.reportedBy ?? '—' },
              { label: 'Location', value: i.location ?? '—' },
              { label: 'Who involved', value: i.personsInvolved ?? '—' },
              { label: 'Guardian', value: i.guardianNotified ? 'Notified' : 'Not notified' },
            ]}
          />
          <div style={{ marginTop: 12 }}>
            <Link href={`/incidents/${i.id}`} style={{ color: '#0F62FE', fontSize: 13 }}>
              Open case →
            </Link>
          </div>
        </>
      ),
    };
  });

  const segs: { key: Seg; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all, color: '#161616' },
    { key: 'escalated', label: 'ESCALATED', count: counts.escalated, color: '#DA1E28' },
    { key: 'open', label: 'OPEN', count: counts.open, color: '#8D6E00' },
    { key: 'closed', label: 'CLOSED', count: counts.closed, color: '#0E6027' },
  ];

  return (
    <div>
      {narrow && (
        <>
          <div style={{ height: 44, background: '#fff', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', marginBottom: 14 }}>
            <Magnifier />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ref, child or category"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #E0E0E0', marginBottom: 14 }}>
            {segs.map((s, i) => {
              const selected = seg === s.key;
              const disabled = s.count === 0;
              const countColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : s.color;
              const labelColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : '#525252';
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  onClick={disabled ? undefined : () => setSeg(s.key)}
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
                  <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1, color: countColor }}>{s.count}</span>
                  <span style={{ fontSize: 10, letterSpacing: '.04em', color: labelColor }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <CollapsibleTable
        desktop={desktop}
        rows={mobileRows}
        primaryHeader="Category · ref"
        statusHeader="Status"
        statusWidth={112}
        empty="No incidents match."
      />
    </div>
  );
}
