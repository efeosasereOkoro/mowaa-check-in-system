import { requireStaff } from '@/lib/require-role';
import { navFor } from '@/lib/rbac';
import { ROLE_LABELS } from '@/lib/staff';
import AppShell from '@/components/app-shell';

// Reads the session/role on every request.
export const dynamic = 'force-dynamic';

export default async function AppAreaLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <AppShell
      nav={navFor(staff.role)}
      userName={staff.name ?? staff.email}
      roleLabel={ROLE_LABELS[staff.role]}
    >
      {children}
    </AppShell>
  );
}
