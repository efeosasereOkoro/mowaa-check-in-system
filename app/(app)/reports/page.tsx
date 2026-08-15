import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEventDaysList } from '@/lib/dashboard';
import { getAttendanceReport, getEndOfDayFlags, resolveDayRange } from '@/lib/reports';
import { PageBand, Card, CardHeader } from '@/components/console';
import ReportRangeSelect, { type DayOption } from './report-range-select';
import AttendanceTable from './attendance-table';

export const dynamic = 'force-dynamic';

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
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageBand
        title="Reports"
        context={`${rangeLabel} · ${rows.length} events`}
        actions={[
          { key: 'register', label: 'Register (CSV)', href: '/api/reports/register' },
          { key: 'pdf', label: 'Attendance (PDF)', href: `/reports/print?${range}`, target: '_blank' },
          { key: 'csv', label: 'Attendance (CSV)', href: `/api/reports/attendance?${range}`, primary: true },
        ]}
      />

      {flags && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Card style={{ flex: '1 1 320px' }}>
            <CardHeader title="Still checked in" meta={flags.stillCheckedIn.length} />
            <div style={{ padding: 16 }}>
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
          </Card>
          <Card style={{ flex: '1 1 220px' }}>
            <CardHeader title="Emergency notes today" />
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#525252', marginBottom: 8 }}>
                <Dot color={flags.emergencyCount ? '#DA1E28' : '#A8A8A8'} />
                {flags.emergencyCount ? 'Needs review' : 'None today'}
              </div>
              <div style={{ fontSize: 32, fontWeight: 300, color: '#DA1E28' }}>{flags.emergencyCount}</div>
              <Link href="/health" style={{ fontSize: 13, color: '#0F62FE' }}>
                View →
              </Link>
            </div>
          </Card>
        </div>
      )}

      <AttendanceTable
        rows={rows}
        allDays={multiDay}
        toolbar={fromDay && toDay ? <ReportRangeSelect options={options} from={fromDay.id} to={toDay.id} /> : undefined}
      />
    </div>
  );
}
