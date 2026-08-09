import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getIncident, STATUS_LABEL, incidentCategoryLabel, incidentOfficialRecord } from '@/lib/incidents';
import { formatEventDateTime } from '@/lib/datetime';
import { EVENT_NAME } from '@/lib/event';
import PrintButton from '@/components/print-button';

export const dynamic = 'force-dynamic';

// Standalone (outside the app shell) so it prints clean — no sidebar/nav. Printable single
// incident report mirroring the paper safeguarding form: report block + the "For official MOWAA
// reporting only" sign-off block + case history (E13-S8, B-048 decision 3). Admin/CPO only; RLS
// backs getIncident. Print → "Save as PDF" (same no-dependency pattern as the child report).
export default async function IncidentReportPage({ searchParams }: { searchParams: Promise<{ incident?: string }> }) {
  const staff = await requireRole(['admin']);
  const { incident: id } = await searchParams;
  if (!id) notFound();
  const inc = await getIncident(staff.id, id);
  if (!inc) notFound();

  const category = incidentCategoryLabel(inc);
  const guardian = inc.guardianNotified ? `Yes${inc.guardianNotifiedAt ? ` — ${inc.guardianNotifiedAt}` : ''}` : 'No';
  const externalReporter = [inc.reporterName, inc.reporterPhone, inc.reporterEmail].filter(Boolean).join(' · ') || null;

  const rec = incidentOfficialRecord(inc.updates);
  const generated = formatEventDateTime(new Date()) ?? '';

  const field = (label: string, value: string | null, block?: boolean) => (
    <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 12, padding: '9px 0', borderTop: '1px solid #F0F0F0', fontSize: 14 }}>
      <div style={{ fontSize: 12, color: '#6F6F6F' }}>{label}</div>
      <div style={{ whiteSpace: block ? 'pre-wrap' : undefined, color: value ? '#161616' : '#8D8D8D' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', color: '#161616', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; }
          body { background: #fff; }
          section { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <PrintButton label="Print / save as PDF" />
        <Link href={`/incidents/${inc.id}`} style={{ color: '#0F62FE', fontSize: 14 }}>
          ← Back to incident
        </Link>
      </div>

      <header style={{ borderBottom: '2px solid #161616', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#DA1E28', fontWeight: 700 }}>
          {EVENT_NAME} · Safeguarding / Incident Report
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: '6px 0 0' }}>{category}</h1>
        <div style={{ fontSize: 13, color: '#525252', marginTop: 4 }}>
          Status: {STATUS_LABEL[inc.status] ?? inc.status} · generated {generated}
        </div>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Report</h2>
        {field('Filed', inc.filedAt)}
        {field('Filed by', inc.filedByStaff)}
        {field('When it happened', inc.incidentAt)}
        {field('Where', inc.location)}
        {field('Child involved', inc.childName)}
        {field('Who was involved', inc.personsInvolved, true)}
        {field('How involved', inc.howInvolved, true)}
        {field('What happened', inc.narrative, true)}
        {field('Key notes', inc.keyNotes, true)}
        {field('Guardian notified', guardian)}
        {field('External reporter', externalReporter)}
      </section>

      <section style={{ border: '1px solid #C6C6C6', borderLeft: '3px solid #161616', padding: '12px 16px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>For official MOWAA reporting only</h2>
        <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Completed by the Child Protection Officer.</div>
        {field('Escalated to CPO', rec.escalatedAt)}
        {field('Investigation started', rec.investigationStartedAt)}
        {field('Resolved & signed off', rec.signOff)}
        {field('Resolution', rec.resolution, true)}
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Case history</h2>
        {inc.updates.length === 0 ? (
          <div style={{ fontSize: 13, color: '#8D8D8D' }}>No updates recorded.</div>
        ) : (
          <div style={{ border: '1px solid #E0E0E0' }}>
            {inc.updates.map((u) => (
              <div key={u.id} style={{ padding: '10px 14px', borderTop: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 12, color: '#525252', marginBottom: u.note ? 4 : 0 }}>
                  {u.at ?? ''} {u.author ? `· ${u.author}` : ''}
                  {u.newStatus ? ` · → ${STATUS_LABEL[u.newStatus] ?? u.newStatus}` : ''}
                </div>
                {u.note && <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{u.note}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
