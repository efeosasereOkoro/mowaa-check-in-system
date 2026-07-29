import { requireRole } from '@/lib/require-role';
import SectionPlaceholder from '@/components/section-placeholder';

export const dynamic = 'force-dynamic';

// Admin-only (E2-S4): reports & CSV export.
export default async function ReportsPage() {
  await requireRole(['admin']);
  return (
    <SectionPlaceholder
      eyebrow="Attendance"
      title="Reports"
      note="Per-day attendance report, end-of-day flags, and CSV export — admin only (epic E9)."
    />
  );
}
