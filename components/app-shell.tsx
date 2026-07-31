'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { NavItem } from '@/lib/rbac';
import LogoutButton from '@/components/logout-button';

// Tiny local icon set for the mobile bottom bar, keyed by NavItem.key. Each is a
// 20x20 inline SVG using stroke="currentColor" so the colour follows the tab's
// active/inactive text colour. Unknown keys fall back to no icon (label only).
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  ),
  health: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </svg>
  ),
  children: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <line x1="5" y1="16" x2="5" y2="12" />
      <line x1="10" y1="16" x2="10" y2="8" />
      <line x1="15" y1="16" x2="15" y2="4" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <circle cx="7.5" cy="8" r="2.5" />
      <path d="M3 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
      <path d="M13 6.5a2.5 2.5 0 0 1 0 5" />
      <path d="M13.5 12c2.2.2 3.5 1.8 3.5 4" />
    </svg>
  ),
};

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

  const isActive = (item: NavItem) => path === item.href || path.startsWith(item.href + '/');

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

      {narrow ? (
        <>
          {/* Content starts directly under the header; nav lives in the fixed bottom bar. */}
          <main
            style={{
              flex: 1,
              minWidth: 0,
              background: '#F4F4F4',
              padding: 16,
              paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
            }}
          >
            {children}
          </main>
          <nav
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 20,
              background: '#fff',
              borderTop: '1px solid #E0E0E0',
              display: 'grid',
              gridTemplateColumns: `repeat(${nav.length}, 1fr)`,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {nav.map((item) => {
              const active = isActive(item);
              const icon = ICONS[item.key];
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 2px 6px',
                    minHeight: 56,
                    textDecoration: 'none',
                    color: active ? '#0F62FE' : '#525252',
                    borderTop: active ? '3px solid #0F62FE' : '3px solid transparent',
                    marginTop: -1,
                  }}
                >
                  {icon && <span style={{ display: 'flex', width: 20, height: 20 }}>{icon}</span>}
                  <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, textAlign: 'center', lineHeight: 1.1 }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
          <nav
            style={{
              flex: 'none',
              background: '#fff',
              width: 240,
              borderRight: '1px solid #E0E0E0',
              paddingTop: 8,
            }}
          >
            {nav.map((item) => {
              const active = isActive(item);
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
                    borderLeft: active ? '3px solid #0F62FE' : '3px solid transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <main style={{ flex: 1, minWidth: 0, background: '#F4F4F4', padding: 32 }}>{children}</main>
        </div>
      )}
    </div>
  );
}
