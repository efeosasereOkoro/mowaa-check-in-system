import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { getChildAttendance } from '@/lib/attendance';
import { getChildMedical } from '@/lib/medical';
import { EVENT_NAME } from '@/lib/event';
import { formatEventDateTime } from '@/lib/datetime';
import { AttendanceTable, MedicalNotesList } from '@/components/child-record';
import PrintButton from '@/components/print-button';

export const dynamic = 'force-dynamic';

// Standalone (outside the app shell) so it prints clean — no sidebar/nav. Individual
// child report: name + attendance + health notes. Admin-only here; health content is
// additionally gated on role (and RLS), so it's omitted for anyone who can't see it.
export default async function ChildReportPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  // Read-only report; admin + health may view (RLS backs both attendance and notes).
  const staff = await requireRole(['admin', 'health']);
  const { child: childId } = await searchParams;
  if (!childId) notFound();

  const medical = await getChildMedical(staff.id, childId);
  if (!medical) notFound();
  const { child, notes } = medical;
  const attendance = await getChildAttendance(staff.id, childId);
  const canSeeHealth = staff.role === 'admin' || staff.role === 'health';

  const generated = formatEventDateTime(new Date()) ?? '';

  const detail = (label: string, value: string | number | null) => (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', color: '#6F6F6F' }}>{label}</div>
      <div style={{ fontSize: 14, color: '#161616', marginTop: 2 }}>{value ?? '—'}</div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', color: '#161616', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; }
          body { background: #fff; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <PrintButton label="Print report" />
        <Link href={`/children/${childId}`} style={{ color: '#0F62FE', fontSize: 14 }}>
          ← Back to child
        </Link>
      </div>

      <header style={{ borderBottom: '2px solid #161616', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0F62FE', fontWeight: 700 }}>
          {EVENT_NAME}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: '4px 0 0' }}>
          {child.firstName} {child.lastName}
        </h1>
        <div style={{ fontSize: 13, color: '#525252', marginTop: 4 }}>Individual report · generated {generated}</div>
      </header>

      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {detail('Tag number', child.tagCode)}
          {detail('Age', child.age)}
          {detail('Guardian', child.guardianName)}
          {detail('Guardian phone', child.guardianPhone)}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Attendance</h2>
        <AttendanceTable days={attendance} />
      </section>

      {canSeeHealth && (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Health record</h2>
          <MedicalNotesList notes={notes} />
        </section>
      )}
    </div>
  );
}
