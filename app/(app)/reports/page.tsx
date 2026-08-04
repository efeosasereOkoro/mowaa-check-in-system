import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEventDaysList } from '@/lib/dashboard';
import { getAttendanceReport, getEndOfDayFlags, resolveDayRange } from '@/lib/reports';
import { MobileOnly, DesktopOnly } from '@/components/viewport';
import ReportRangeSelect, { type DayOption } from './report-range-select';
import AttendanceTable from './attendance-table';
import ExportSheet from './export-sheet';

export const dynamic = 'force-dynamic';

const exportBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', background: '#0F62FE', color: '#fff', fontSize: 14, textDecoration: 'none' };
const exportBtnSecondary: React.CSSProperties = { ...exportBtn, background: '#fff', color: '#161616', border: '1px solid #161616' };

function dayShort(dayNumber: number, label: string | null): string {
  if (dayNumber === 0) return label ?? 'Pre-event test day';
  return label ?? `Day ${dayNumber}`;
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: 'none' }} />;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; day?: string }> }) {
  const staff = await requireRole(['admin']);
  const { from, to, day } = await searchParams;

  const days = await getEventDaysList(staff.id);
  const current = await getCurrentEventDay(staff.id);

  // Default view: the current event day (single); outside event hours, the whole event.
  // Legacy `?day=<id|all>` links still resolve.
  let fromParam = from;
  let toParam = to;
  if (!fromParam && !toParam) {
    if (day && day !== 'all') fromParam = toParam = day;
    else if (day !== 'all' && current) fromParam = toParam = current.id;
  }

  const { ids, fromDay, toDay } = resolveDayRange(days, fromParam, toParam);
  const singleDay = !!fromDay && !!toDay && fromDay.id === toDay.id;
  const multiDay = ids.length > 1;

  const rangeLabel = !fromDay || !toDay
    ? 'No event days'
    : singleDay
      ? dayShort(fromDay.dayNumber, fromDay.label)
      : ids.length === days.length
        ? 'Whole event'
        : `${dayShort(fromDay.dayNumber, fromDay.label)} – ${dayShort(toDay.dayNumber, toDay.label)}`;

  const options: DayOption[] = days.map((d) => ({ value: d.id, label: dayShort(d.dayNumber, d.label) }));

  const rows = await getAttendanceReport(staff.id, ids);
  const flags = singleDay ? await getEndOfDayFlags(staff.id, fromDay!.id) : null;

  const range = fromDay && toDay ? `from=${fromDay.id}&to=${toDay.id}` : '';

  return (
    <div style={{ maxWidth: 1000 }}>
      <MobileOnly>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>Reports</div>
          <div style={{ fontSize: 13, color: '#525252', marginTop: 2 }}>
            {rangeLabel} · {rows.length} events
          </div>
        </div>
      </MobileOnly>
      <DesktopOnly>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>
          Reports <span style={{ color: '#525252' }}>· {rangeLabel}</span>
        </h1>
      </DesktopOnly>

      <div style={{ marginBottom: 14 }}>
        {fromDay && toDay && <ReportRangeSelect options={options} from={fromDay.id} to={toDay.id} />}
      </div>

      <DesktopOnly>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <a href={`/api/reports/attendance?${range}`} style={exportBtn}>Attendance (CSV)</a>
          <a href={`/reports/print?${range}`} target="_blank" style={exportBtnSecondary}>Attendance (PDF)</a>
          <a href="/api/reports/register" style={exportBtnSecondary}>Register (CSV)</a>
        </div>
      </DesktopOnly>

      {flags && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ flex: '1 1 320px', background: '#fff', border: '1px solid #E0E0E0', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Still checked in</span>
              <span style={{ fontSize: 13, color: '#525252' }}>{flags.stillCheckedIn.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#525252', marginBottom: flags.stillCheckedIn.length ? 10 : 0 }}>
              <Dot color={flags.stillCheckedIn.length ? '#8D6E00' : '#0E6027'} />
              {flags.stillCheckedIn.length ? 'Not everyone has been checked out' : 'Everyone who arrived has been checked out'}
            </div>
            {flags.stillCheckedIn.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {flags.stillCheckedIn.map((s) => (
                  <li key={s.child} style={{ marginBottom: 2 }}>
                    <span style={{ color: '#0F62FE' }}>{s.child}</span>
                    {s.tag ? <span style={{ color: '#8D8D8D', fontFamily: 'monospace' }}> · {s.tag}</span> : null}
                    <span style={{ color: '#8D8D8D' }}> · in {s.inAt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ flex: '1 1 220px', background: '#fff', border: '1px solid #E0E0E0', padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Emergency notes today</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#525252', marginBottom: 8 }}>
              <Dot color={flags.emergencyCount ? '#DA1E28' : '#A8A8A8'} />
              {flags.emergencyCount ? 'Needs review' : 'None today'}
            </div>
            <div style={{ fontSize: 32, fontWeight: 300, color: '#DA1E28' }}>{flags.emergencyCount}</div>
            <Link href="/health" style={{ fontSize: 13, color: '#0F62FE' }}>
              View →
            </Link>
          </div>
        </div>
      )}

      <DesktopOnly>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Attendance — {rangeLabel}
          <span style={{ color: '#8D8D8D', fontWeight: 400 }}> ({rows.length})</span>
        </div>
      </DesktopOnly>

      <AttendanceTable rows={rows} allDays={multiDay} />

      <ExportSheet range={range} />
    </div>
  );
}
