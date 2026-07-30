import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getChildMedical } from '@/lib/medical';
import SeverityBadge from '@/components/severity-badge';
import AddNoteForm from './add-note-form';

export const dynamic = 'force-dynamic';

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 13 };

export default async function ChildHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireRole(['health', 'admin']);
  const data = await getChildMedical(staff.id, id);
  if (!data) notFound();
  const { child, notes } = data;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>
        <Link href="/health" style={{ color: '#0F62FE' }}>
          Health
        </Link>{' '}
        / {child.firstName} {child.lastName}
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 4px' }}>
        {child.firstName} {child.lastName}{' '}
        {child.tagCode && <span style={{ ...mono, background: '#E0E0E0', padding: '2px 8px' }}>{child.tagCode}</span>}
      </h1>
      <div style={{ fontSize: 14, color: '#525252', margin: '8px 0 20px' }}>
        Age {child.age ?? '—'} · Guardian {child.guardianName} · <span style={mono}>{child.guardianPhone}</span>
      </div>

      {child.healthDetails && (
        <div style={{ background: '#FCF4D6', border: '1px solid #EAD97C', borderLeft: '3px solid #F1C21B', padding: '12px 16px', fontSize: 13, marginBottom: 24 }}>
          <strong>Health note.</strong> {child.healthDetails}
        </div>
      )}

      <AddNoteForm childId={child.id} />

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Medical notes</div>
      <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
        {notes.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#8D8D8D' }}>No medical notes on file.</div>}
        {notes.map((n) => (
          <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F4F4F4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <SeverityBadge severity={n.severity} />
              <span style={{ fontSize: 12, color: '#525252' }}>{n.when} · {n.author ?? 'Unknown'}</span>
            </div>
            <div style={{ fontSize: 13, color: '#393939', marginTop: 6, lineHeight: 1.5 }}>{n.noteText}</div>
            <div style={{ fontSize: 12, color: n.guardianNotified ? '#0E6027' : '#8D8D8D', marginTop: 4 }}>
              {n.guardianNotified ? '✓ Guardian notified' : 'Guardian not notified'}
            </div>
          </div>
        ))}
        <div style={{ padding: '10px 16px', fontSize: 12, color: '#8D8D8D' }}>
          Medical notes are permanent records and cannot be edited or deleted.
        </div>
      </div>
    </div>
  );
}
