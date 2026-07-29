'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: 48,
          background: '#161616',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          flex: 'none',
        }}
      >
        <div style={{ color: '#fff', fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>SmartTag</span>{' '}
          <span style={{ fontWeight: 300 }}>Check-In</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ color: '#fff', fontSize: 13 }}>{userName}</div>
            <div style={{ color: '#A8A8A8', fontSize: 11 }}>{roleLabel}</div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        <nav
          style={{
            width: 240,
            flex: 'none',
            background: '#fff',
            borderRight: '1px solid #E0E0E0',
            paddingTop: 8,
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
                  background: active ? '#E8E8E8' : 'transparent',
                  borderLeft: active ? '3px solid #0F62FE' : '3px solid transparent',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main style={{ flex: 1, background: '#F4F4F4', padding: 32 }}>{children}</main>
      </div>
    </div>
  );
}
