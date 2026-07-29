import { getCurrentUser, ROLE_LABELS } from '@/lib/staff';
import LogoutButton from '@/components/logout-button';

// Reads session + staff role, so render dynamically.
export const dynamic = 'force-dynamic';

const shell: React.CSSProperties = { minHeight: '100vh', background: '#F4F4F4', padding: 32 };
const inner: React.CSSProperties = { maxWidth: 720, margin: '0 auto' };

export default async function Home() {
  const current = await getCurrentUser();
  const staff = current?.staff ?? null;

  // Authenticated (middleware guarantees a session) but no staff role → no access.
  if (!staff) {
    return (
      <main style={shell}>
        <div style={inner}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Account not set up</h1>
          <p style={{ fontSize: 14, color: '#525252', margin: '12px 0 24px' }}>
            You&rsquo;re signed in as <strong>{current?.email ?? 'unknown'}</strong>, but this
            account isn&rsquo;t linked to a staff role yet. Ask an admin to set up your access.
          </p>
          <LogoutButton />
        </div>
      </main>
    );
  }

  return (
    <main style={shell}>
      <div style={inner}>
        <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Attendance console</div>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>SmartTag Check-In</h1>
        <p style={{ fontSize: 14, color: '#525252', margin: '12px 0 8px' }}>
          Signed in as <strong>{staff.name}</strong> ({staff.email}).
        </p>
        <p style={{ margin: '0 0 24px' }}>
          <span
            style={{
              display: 'inline-block',
              background: '#0F62FE',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
            }}
          >
            {ROLE_LABELS[staff.role]}
          </span>
        </p>
        <LogoutButton />
        <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 32 }}>
          Role mapping (E2-S2) is live. Role-based views, dashboards and RLS come next.
        </p>
      </div>
    </main>
  );
}
