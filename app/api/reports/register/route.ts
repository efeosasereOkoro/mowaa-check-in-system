import { getCurrentUser } from '@/lib/staff';
import { getRegisterExport, buildCsv } from '@/lib/reports';

export const dynamic = 'force-dynamic';

/** Full children register CSV export (Admin only). FR-17. */
export async function GET() {
  const current = await getCurrentUser();
  if (!current?.staff) return new Response('Unauthorized', { status: 401 });
  if (current.staff.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const rows = await getRegisterExport(current.staff.id);
  const csv = buildCsv(
    ['First name', 'Last name', 'Age', 'Guardian', 'Guardian phone', 'Address', 'Health details', 'Tag', 'Pickup persons'],
    rows.map((r) => [
      r.firstName,
      r.lastName,
      r.age ?? '',
      r.guardianName,
      r.guardianPhone,
      r.homeAddress ?? '',
      r.healthDetails ?? '',
      r.tag ?? '',
      r.pickups,
    ]),
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="children_register.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
