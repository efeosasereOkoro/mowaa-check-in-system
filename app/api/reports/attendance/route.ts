import { getCurrentUser } from '@/lib/staff';
import { getEventDaysList } from '@/lib/dashboard';
import { getAttendanceReport, buildCsv } from '@/lib/reports';

export const dynamic = 'force-dynamic';

/** Attendance log CSV export (Admin only). FR-16 / FR-17. `?day=<id|all>`. */
export async function GET(req: Request) {
  const current = await getCurrentUser();
  if (!current?.staff) return new Response('Unauthorized', { status: 401 });
  if (current.staff.role !== 'admin') return new Response('Forbidden', { status: 403 });
  const staffId = current.staff.id;

  const param = new URL(req.url).searchParams.get('day');
  const days = await getEventDaysList(staffId);
  const day = param && param !== 'all' ? days.find((d) => d.id === param) ?? null : null;

  const rows = await getAttendanceReport(staffId, day?.id ?? null);
  const csv = buildCsv(
    ['Day', 'Date', 'Time', 'Child', 'Action', 'Staff', 'Collector', 'Override', 'Override reason'],
    rows.map((r) => [
      r.dayLabel,
      r.date,
      r.time,
      r.child,
      r.action,
      r.staff,
      r.collector,
      r.isOverride ? 'Yes' : '',
      r.overrideReason ?? '',
    ]),
  );

  const fname = day ? `attendance_day${day.dayNumber}` : 'attendance_all_days';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
