import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getChildMedical } from '@/lib/medical';
import SeverityBadge from '@/components/severity-badge';
import { PageBand, Card, CardHeader } from '@/components/console';
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
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageBand
        breadcrumb={
          <>
            <Link href="/health" style={{ color: '#0F62FE' }}>
              Health
            </Link>{' '}
            / {child.firstName} {child.lastName}
          </>
        }
        title={`${child.firstName} ${child.lastName}`}
        context={
          <span>
            {child.tagCode && <span style={{ ...mono, background: '#E0E0E0', padding: '2px 8px', marginRight: 8 }}>{child.tagCode}</span>}
            Age {child.age ?? '—'} · Guardian {child.guardianName} · <span style={mono}>{child.guardianPhone}</span>
          </span>
        }
      />

      {child.healthDetails && (
        <div style={{ background: '#FCF4D6', border: '1px solid #EAD97C', borderLeft: '3px solid #F1C21B', padding: '12px 16px', fontSize: 13 }}>
          <strong>Health note.</strong> {child.healthDetails}
        </div>
      )}

      <Card>
        <CardHeader title="Add a note" />
        <div style={{ padding: 16 }}>
          <AddNoteForm childId={child.id} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Medical notes" meta={notes.length} />
        {notes.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#8D8D8D' }}>No medical notes on file.</div>}
        {notes.map((n) => (
          <div key={n.id} style={{ padding: '12px 16px', borderTop: '1px solid #F4F4F4' }}>
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
        <div style={{ padding: '10px 16px', fontSize: 12, color: '#8D8D8D', borderTop: '1px solid #F4F4F4' }}>
          Medical notes are permanent records and cannot be edited or deleted.
        </div>
      </Card>
    </div>
  );
}
