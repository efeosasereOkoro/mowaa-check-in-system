import { requireRole } from '@/lib/require-role';
import SectionPlaceholder from '@/components/section-placeholder';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await requireRole(['receptionist', 'admin']);
  return (
    <SectionPlaceholder
      eyebrow="Attendance console"
      title="Dashboard"
      note="Live counts, tag rack, search + tap, and the activity feed land here (epic E7). Check-in / check-out flow is E6."
    />
  );
}
