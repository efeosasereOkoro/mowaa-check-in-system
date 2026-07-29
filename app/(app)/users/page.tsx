import { requireRole } from '@/lib/require-role';
import SectionPlaceholder from '@/components/section-placeholder';

export const dynamic = 'force-dynamic';

// Admin-only (E2-S4): staff account management.
export default async function UsersPage() {
  await requireRole(['admin']);
  return (
    <SectionPlaceholder
      eyebrow="Staff access"
      title="Users"
      note="Admin-only: add/invite staff and assign roles (invite model, B-011). Backed by RLS on the staff table."
    />
  );
}
