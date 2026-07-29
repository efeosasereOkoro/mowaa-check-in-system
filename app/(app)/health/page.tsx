import { requireRole } from '@/lib/require-role';
import SectionPlaceholder from '@/components/section-placeholder';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  await requireRole(['health', 'admin']);
  return (
    <SectionPlaceholder
      eyebrow="Health desk"
      title="Health"
      note="Health dashboard and append-only medical notes land here (epic E8)."
    />
  );
}
