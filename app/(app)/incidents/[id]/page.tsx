import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getIncident, CATEGORY_LABEL, STATUS_LABEL } from '@/lib/incidents';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { color: string; bg: string }> = {
  submitted: { color: '#343A3F', bg: '#DDE1E6' },
  escalated: { color: '#8D6E00', bg: '#FCF4D6' },
  investigating: { color: '#0043CE', bg: '#D0E2FF' },
  resolved: { color: '#0E6027', bg: '#A7F0BA' },
};

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: '10px 0', borderTop: '1px solid #F4F4F4', fontSize: 14 };
const rowLabel: React.CSSProperties = { fontSize: 12, color: '#525252' };
const sectionH2: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: '24px 0 8px' };

function Field({ label, value, block }: { label: string; value: string | null; block?: boolean }) {
  return (
    <div style={row}>
      <div style={rowLabel}>{label}</div>
      <div style={{ whiteSpace: block ? 'pre-wrap' : undefined, color: value ? undefined : '#8D8D8D' }}>{value || '—'}</div>
    </div>
  );
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(['admin']);
  const inc = await getIncident(staff.id, id);
  if (!inc) notFound();

  const sm = STATUS_META[inc.status] ?? STATUS_META.submitted;
  const category = inc.category === 'other' && inc.categoryOther ? `Other — ${inc.categoryOther}` : CATEGORY_LABEL[inc.category] ?? inc.category;

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>
        <Link href="/incidents" style={{ color: '#0F62FE' }}>
          Incidents
        </Link>{' '}
        / Report
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', margin: '0 0 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 400, margin: 0 }}>{category}</h1>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', background: sm.bg, color: sm.color }}>{STATUS_LABEL[inc.status] ?? inc.status}</span>
      </div>

      <section style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20 }}>
        <Field label="Filed" value={inc.filedAt} />
        <Field label="Filed by" value={inc.filedByStaff} />
        <Field label="When it happened" value={inc.incidentAt} />
        <Field label="Where" value={inc.location} />
        <Field label="Child involved" value={inc.childName} />
        <Field label="Who was involved" value={inc.personsInvolved} block />
        <Field label="How involved" value={inc.howInvolved} block />
        <Field label="What happened" value={inc.narrative} block />
        <Field label="Key notes" value={inc.keyNotes} block />
        <Field label="Guardian notified" value={inc.guardianNotified ? `Yes${inc.guardianNotifiedAt ? ` — ${inc.guardianNotifiedAt}` : ''}` : 'No'} />
        {(inc.reporterName || inc.reporterPhone || inc.reporterEmail) && (
          <Field
            label="External reporter"
            value={[inc.reporterName, inc.reporterPhone, inc.reporterEmail].filter(Boolean).join(' · ')}
          />
        )}
      </section>

      <h2 style={sectionH2}>Case history</h2>
      {inc.updates.length === 0 ? (
        <div style={{ fontSize: 13, color: '#8D8D8D' }}>
          No updates yet. Recording escalation, investigation and sign-off is coming in the next
          update to the console.
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          {inc.updates.map((u) => (
            <div key={u.id} style={{ padding: '12px 16px', borderTop: '1px solid #F4F4F4' }}>
              <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>
                {u.at ?? ''} {u.author ? `· ${u.author}` : ''}
                {u.newStatus ? ` · → ${STATUS_LABEL[u.newStatus] ?? u.newStatus}` : ''}
              </div>
              {u.note && <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{u.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
