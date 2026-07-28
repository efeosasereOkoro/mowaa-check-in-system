import { auth } from '@/lib/auth/server';
import LogoutButton from '@/components/logout-button';

// Uses server-side session, so render dynamically.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F4F4F4',
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Attendance console</div>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>SmartTag Check-In</h1>
        <p style={{ fontSize: 14, color: '#525252', margin: '12px 0 24px' }}>
          Signed in as <strong>{user?.email ?? 'unknown user'}</strong>
          {user?.name ? ` (${user.name})` : ''}.
        </p>
        <LogoutButton />
        <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 32 }}>
          Authentication foundation (E2-S1). Roles, dashboards and the full console come next.
        </p>
      </div>
    </main>
  );
}
