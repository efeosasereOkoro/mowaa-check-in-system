import type { ReactNode } from 'react';

// Shared card chrome for the auth console pages (forgot / reset password). Matches the
// sign-in page: centred on #F4F4F4, a 400px white Carbon-square card with the ST tile.
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F4F4',
      }}
    >
      <div
        style={{ width: 400, maxWidth: '92vw', background: '#fff', border: '1px solid #E0E0E0', padding: 32 }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: '#0F62FE',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          ST
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#525252', margin: '6px 0 28px' }}>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
