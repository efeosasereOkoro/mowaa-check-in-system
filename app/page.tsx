import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/staff';
import { defaultHome } from '@/lib/rbac';
import LogoutButton from '@/components/logout-button';

// Reads session + staff role, so render dynamically.
export const dynamic = 'force-dynamic';

const shell: React.CSSProperties = { minHeight: '100vh', background: '#F4F4F4', padding: 32 };
const inner: React.CSSProperties = { maxWidth: 720, margin: '0 auto' };

export default async function Home() {
  const current = await getCurrentUser();
  if (!current) redirect('/sign-in');

  // Provisioned staff → land on their role's default home.
  if (current.staff) redirect(defaultHome(current.staff.role));

  // Authenticated but no staff role → no access (invite model).
  return (
    <main style={shell}>
      <div style={inner}>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Account not set up</h1>
        <p style={{ fontSize: 14, color: '#525252', margin: '12px 0 24px' }}>
          You&rsquo;re signed in as <strong>{current.email}</strong>, but this account isn&rsquo;t
          linked to a staff role yet. Ask an admin to set up your access.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
