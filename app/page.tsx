import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/staff';
import { defaultHome } from '@/lib/rbac';
import LogoutButton from '@/components/logout-button';
import MarketingLanding from './marketing-landing';

// Reads session + staff role, so render dynamically.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SmartTag Check-In — child check-in & check-out',
  description:
    'QR-based child check-in and check-out for camps, kids’ events, schools and churches. Role-based, safeguarding-first, works on any phone.',
};

const shell: React.CSSProperties = { minHeight: '100vh', background: '#F4F4F4', padding: 32 };
const inner: React.CSSProperties = { maxWidth: 720, margin: '0 auto' };

export default async function Home() {
  const current = await getCurrentUser();
  // Unauthenticated visitors get the public marketing landing (the SaaS front door).
  if (!current) return <MarketingLanding />;

  // Provisioned staff → land on their role's default home.
  if (current.staff) redirect(defaultHome(current.staff.role));

  // Authenticated but suspended, or no staff role → no access (invite model).
  return (
    <main style={shell}>
      <div style={inner}>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>
          {current.suspended ? 'Account suspended' : 'Account not set up'}
        </h1>
        <p style={{ fontSize: 14, color: '#525252', margin: '12px 0 24px' }}>
          {current.suspended ? (
            <>
              Your access as <strong>{current.email}</strong> has been suspended. Contact an admin if
              you think this is a mistake.
            </>
          ) : (
            <>
              You&rsquo;re signed in as <strong>{current.email}</strong>, but this account isn&rsquo;t
              linked to a staff role yet. Ask an admin to set up your access.
            </>
          )}
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
