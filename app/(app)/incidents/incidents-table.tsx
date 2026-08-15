'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';
import { Card, Toolbar, SearchRow, FilterChips, SegmentStrip, StatusTag, type Chip, type StatusTone } from '@/components/console';
import type { IncidentListItem } from '@/lib/incidents';

// Local label map — a client component must not import a *value* from a server lib (D-027).
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

// One status treatment (filled tag) across desktop + mobile.
const STATUS_TAG: Record<string, { tone: StatusTone; label: string }> = {
  submitted: { tone: 'neutral', label: 'Submitted' },
  escalated: { tone: 'warning', label: 'Escalated' },
  investigating: { tone: 'info', label: 'Investigating' },
  resolved: { tone: 'success', label: 'Resolved' },
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };

// Mobile-only teaching card when the tenant has zero reports (§4). Not a table row.
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
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  // Mobile with zero reports → the teaching card (never the search/counts/table).
  if (narrow && incidents.length === 0) return <EmptyState />;

  const displayed = searched.filter((i) => {
    if (seg === 'escalated') return i.status === 'escalated';
    if (seg === 'open') return i.status === 'submitted' || i.status === 'investigating';
    if (seg === 'closed') return i.status === 'resolved';
    return true;
  });

  const chips: (Chip & { key: Seg })[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'escalated', label: 'Escalated', count: counts.escalated },
    { key: 'open', label: 'Open', count: counts.open },
    { key: 'closed', label: 'Closed', count: counts.closed },
  ];

  const desktop = (
    <Card>
      <Toolbar q={q} onQ={setQ} placeholder="Search ref, child or category" chips={<FilterChips chips={chips} value={seg} onChange={setSeg} />} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              <th style={th}>Type</th>
              <th style={th}>Status</th>
              <th style={th}>Child</th>
              <th style={th}>Reported by</th>
              <th style={th}>Filed</th>
              <th style={th}>Guardian</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={6}>
                  {incidents.length === 0 ? 'No incidents reported yet.' : 'No incidents match.'}
                </td>
              </tr>
            )}
            {displayed.map((i) => {
              const st = STATUS_TAG[i.status] ?? STATUS_TAG.submitted;
              return (
                <tr key={i.id}>
                  <td style={td}>
                    <Link href={`/incidents/${i.id}`} style={{ color: '#0F62FE' }}>
                      {catLabel(i)}
                    </Link>
                  </td>
                  <td style={td}>
                    <StatusTag tone={st.tone}>{st.label}</StatusTag>
                  </td>
                  <td style={{ ...td, color: i.childName ? undefined : '#8D8D8D' }}>{i.childName ?? '—'}</td>
                  <td style={{ ...td, color: '#525252' }}>{i.reportedBy ?? '—'}</td>
                  <td style={{ ...td, color: '#525252', whiteSpace: 'nowrap' }}>{i.filedAt ?? '—'}</td>
                  <td style={td}>{i.guardianNotified ? '✓' : <span style={{ color: '#8D8D8D' }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const segments: { key: Seg; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'ALL', count: counts.all, color: '#161616' },
    { key: 'escalated', label: 'ESCALATED', count: counts.escalated, color: '#DA1E28' },
    { key: 'open', label: 'OPEN', count: counts.open, color: '#8D6E00' },
    { key: 'closed', label: 'CLOSED', count: counts.closed, color: '#0E6027' },
  ];

  const mobileRows: CollapsibleRow[] = displayed.map((i) => {
    const st = STATUS_TAG[i.status] ?? STATUS_TAG.submitted;
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
      status: <StatusTag tone={st.tone}>{st.label}</StatusTag>,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {narrow && (
        <>
          <SearchRow q={q} onQ={setQ} placeholder="Search ref, child or category" />
          <SegmentStrip segments={segments} value={seg} onChange={setSeg} />
        </>
      )}
      <CollapsibleTable desktop={desktop} rows={mobileRows} primaryHeader="Category · ref" statusHeader="Status" statusWidth={112} empty="No incidents match." />
    </div>
  );
}
