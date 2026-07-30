'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { NavItem } from '@/lib/rbac';
import LogoutButton from '@/components/logout-button';

export default function AppShell({
  nav,
  userName,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  // Server + first client render = desktop; adjust on mount (avoids hydration mismatch).
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          minHeight: 48,
          background: '#161616',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flex: 'none',
        }}
      >
        <div style={{ color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 600 }}>SmartTag</span>{' '}
          <span style={{ fontWeight: 300 }}>Check-In</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.2, minWidth: 0 }}>
            <div
              style={{
                color: '#fff',
                fontSize: 13,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: narrow ? 120 : 220,
              }}
            >
              {userName}
            </div>
            {!narrow && <div style={{ color: '#A8A8A8', fontSize: 11 }}>{roleLabel}</div>}
          </div>
          <LogoutButton />
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: narrow ? 'column' : 'row', alignItems: 'stretch' }}>
        <nav
          style={{
            flex: 'none',
            background: '#fff',
            ...(narrow
              ? {
                  width: '100%',
                  borderBottom: '1px solid #E0E0E0',
                  display: 'flex',
                  overflowX: 'auto',
                }
              : {
                  width: 240,
                  borderRight: '1px solid #E0E0E0',
                  paddingTop: 8,
                }),
          }}
        >
          {nav.map((item) => {
            const active = path === item.href || path.startsWith(item.href + '/');
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  fontSize: 14,
                  color: '#161616',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  background: active ? '#E8E8E8' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  ...(narrow
                    ? { borderBottom: active ? '3px solid #0F62FE' : '3px solid transparent' }
                    : { borderLeft: active ? '3px solid #0F62FE' : '3px solid transparent' }),
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main style={{ flex: 1, minWidth: 0, background: '#F4F4F4', padding: narrow ? 16 : 32 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
