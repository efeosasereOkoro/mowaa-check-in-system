import { requireRole } from '@/lib/require-role';
import { getEventDaysList } from '@/lib/dashboard';
import { getAttendanceReport, resolveDayRange } from '@/lib/reports';
import { EVENT_NAME } from '@/lib/event';
import PrintButton from '@/components/print-button';

export const dynamic = 'force-dynamic';

const dayShort = (n: number, l: string | null) => (n === 0 ? l ?? 'Pre-event test day' : l ?? `Day ${n}`);

// Standalone printable attendance report (outside the app shell) → the "PDF" export: the
// admin prints / saves-as-PDF from the browser (B-055). Honours the from/to range (B-056).
export default async function ReportPrintPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const staff = await requireRole(['admin']);
  const { from, to } = await searchParams;
  const days = await getEventDaysList(staff.id);
  const { ids, fromDay, toDay } = resolveDayRange(days, from, to);
  const rows = await getAttendanceReport(staff.id, ids);
  const multiDay = ids.length > 1;

  const rangeLabel =
    fromDay && toDay
      ? fromDay.id === toDay.id
        ? dayShort(fromDay.dayNumber, fromDay.label)
        : ids.length === days.length
          ? 'Whole event'
          : `${dayShort(fromDay.dayNumber, fromDay.label)} – ${dayShort(toDay.dayNumber, toDay.label)}`
      : 'No days';

  const generated = new Date().toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#525252', borderBottom: '1.5px solid #161616', padding: '6px 8px' };
  const td: React.CSSProperties = { fontSize: 12, color: '#161616', borderBottom: '1px solid #E0E0E0', padding: '5px 8px', verticalAlign: 'top' };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', color: '#161616', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 12mm; }
          body { background: #fff; }
          thead { display: table-header-group; } /* repeat header on each printed page */
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <PrintButton label="Print / Save as PDF" />
        <a href="/reports" style={{ color: '#0F62FE', fontSize: 14 }}>
          ← Back to reports
        </a>
      </div>

      <header style={{ borderBottom: '2px solid #161616', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0F62FE', fontWeight: 700 }}>{EVENT_NAME}</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 0' }}>Attendance report</h1>
        <div style={{ fontSize: 13, color: '#525252', marginTop: 4 }}>
          {rangeLabel} · {rows.length} {rows.length === 1 ? 'event' : 'events'} · generated {generated}
        </div>
      </header>

      {rows.length === 0 ? (
        <p style={{ fontSize: 14, color: '#525252' }}>No check-in / check-out activity for this selection.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {multiDay && <th style={th}>Day</th>}
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>Child</th>
              <th style={th}>Action</th>
              <th style={th}>Staff</th>
              <th style={th}>Collector</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {multiDay && <td style={td}>{r.dayLabel}</td>}
                <td style={td}>{r.date}</td>
                <td style={{ ...td, fontFamily: 'ui-monospace, monospace' }}>{r.time}</td>
                <td style={td}>{r.child}</td>
                <td style={td}>
                  {r.action}
                  {r.isOverride ? ` · override${r.overrideReason ? ` (${r.overrideReason})` : ''}` : ''}
                </td>
                <td style={{ ...td, color: '#525252' }}>{r.staff}</td>
                <td style={{ ...td, color: '#525252' }}>{r.collector || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
