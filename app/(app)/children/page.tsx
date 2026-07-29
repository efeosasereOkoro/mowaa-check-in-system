import { requireRole } from '@/lib/require-role';
import SectionPlaceholder from '@/components/section-placeholder';

export const dynamic = 'force-dynamic';

export default async function ChildrenPage() {
  await requireRole(['admin']);
  return (
    <SectionPlaceholder
      eyebrow="Register"
      title="Children"
      note="Admin register: add/edit children, manage pickup persons, assign tags (epic E4)."
    />
  );
}
