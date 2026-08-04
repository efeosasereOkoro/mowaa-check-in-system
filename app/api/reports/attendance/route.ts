import { getCurrentUser } from '@/lib/staff';
import { getEventDaysList } from '@/lib/dashboard';
import { getAttendanceReport, resolveDayRange, buildCsv } from '@/lib/reports';

export const dynamic = 'force-dynamic';

/** Attendance log CSV export (Admin only). FR-16 / FR-17 / B-056. `?from=<dayId>&to=<dayId>`
 *  (single day = from===to; omit both = whole event). Legacy `?day=<id|all>` still works. */
export async function GET(req: Request) {
  const current = await getCurrentUser();
  if (!current?.staff) return new Response('Unauthorized', { status: 401 });
  if (current.staff.role !== 'admin') return new Response('Forbidden', { status: 403 });
  const staffId = current.staff.id;

  const sp = new URL(req.url).searchParams;
  let from = sp.get('from') ?? undefined;
  let to = sp.get('to') ?? undefined;
  const legacyDay = sp.get('day');
  if (!from && !to && legacyDay && legacyDay !== 'all') {
    from = to = legacyDay; // back-compat with the old single-day link
  }

  const days = await getEventDaysList(staffId);
  const { ids, fromDay, toDay } = resolveDayRange(days, from, to);

  const rows = await getAttendanceReport(staffId, ids);
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

  const fname =
    fromDay && toDay
      ? fromDay.id === toDay.id
        ? `attendance_day${fromDay.dayNumber}`
        : ids.length === days.length
          ? 'attendance_all_days'
          : `attendance_day${fromDay.dayNumber}-${toDay.dayNumber}`
      : 'attendance';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
