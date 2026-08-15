import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getIncident, STATUS_LABEL, incidentCategoryLabel, incidentOfficialRecord } from '@/lib/incidents';
import { PageBand, Card, CardHeader, StatusTag, type StatusTone } from '@/components/console';
import IncidentActions from './incident-actions';

export const dynamic = 'force-dynamic';

const STATUS_TAG: Record<string, { tone: StatusTone; label: string }> = {
  submitted: { tone: 'neutral', label: 'Submitted' },
  escalated: { tone: 'warning', label: 'Escalated to CPO' },
  investigating: { tone: 'info', label: 'Under investigation' },
  resolved: { tone: 'success', label: 'Resolved' },
};

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: '10px 0', borderTop: '1px solid #F4F4F4', fontSize: 14 };
const rowLabel: React.CSSProperties = { fontSize: 12, color: '#525252' };

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

  const st = STATUS_TAG[inc.status] ?? STATUS_TAG.submitted;
  const category = incidentCategoryLabel(inc);
  const rec = incidentOfficialRecord(inc.updates);

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageBand
        breadcrumb={
          <>
            <Link href="/incidents" style={{ color: '#0F62FE' }}>
              Incidents
            </Link>{' '}
            / Report
          </>
        }
        title={category}
        context={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <StatusTag tone={st.tone}>{st.label}</StatusTag>
            {inc.filedAt ? <span>· Filed {inc.filedAt}</span> : null}
          </span>
        }
        actions={[{ key: 'print', label: 'Print / PDF', href: `/incident-report?incident=${inc.id}`, target: '_blank' }]}
      />

      <Card>
        <CardHeader title="Report" />
        <div style={{ padding: '4px 16px 12px' }}>
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
            <Field label="External reporter" value={[inc.reporterName, inc.reporterPhone, inc.reporterEmail].filter(Boolean).join(' · ')} />
          )}
        </div>
      </Card>

      {inc.status === 'resolved' && (
        <section style={{ background: '#F4FBF6', border: '1px solid #A7F0BA', borderLeft: '3px solid #0E6027', padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: '#0E6027' }}>Official record</h2>
          <div style={{ fontSize: 12, color: '#525252', marginBottom: 8 }}>For official MOWAA reporting.</div>
          <Field label="Escalated to CPO" value={rec.escalatedAt} />
          <Field label="Investigation started" value={rec.investigationStartedAt} />
          <Field label="Resolved & signed off" value={rec.signOff} />
          <Field label="Resolution" value={rec.resolution} block />
        </section>
      )}

      <Card>
        <CardHeader title="Case history" />
        {inc.updates.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: '#8D8D8D' }}>No updates yet.</div>
        ) : (
          inc.updates.map((u) => (
            <div key={u.id} style={{ padding: '12px 16px', borderTop: '1px solid #F4F4F4' }}>
              <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>
                {u.at ?? ''} {u.author ? `· ${u.author}` : ''}
                {u.newStatus ? ` · → ${STATUS_LABEL[u.newStatus] ?? u.newStatus}` : ''}
              </div>
              {u.note && <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{u.note}</div>}
            </div>
          ))
        )}
      </Card>

      <IncidentActions incidentId={inc.id} currentStatus={inc.status} />
    </div>
  );
}
