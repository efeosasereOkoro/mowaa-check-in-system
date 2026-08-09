'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/logout-button';

type MenuNav = { key: string; label: string; href: string };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
}

// Narrow header account control: a circular avatar (initials) that opens a popover
// with the name, role, and Sign out. Sign-out is rare, so it's tucked here rather than
// being the loudest thing on the screen.
export default function AccountMenu({ userName, roleLabel, extraNav = [] }: { userName: string; roleLabel: string; extraNav?: MenuNav[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        style={{ width: 44, height: 44, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #6F6F6F', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {initials(userName)}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60, minWidth: 200, background: '#fff', border: '1px solid #E0E0E0', boxShadow: '0 4px 14px rgba(0,0,0,0.16)', padding: 16 }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#161616', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
          <div style={{ fontSize: 12, color: '#525252', marginBottom: extraNav.length ? 10 : 14 }}>{roleLabel}</div>
          {extraNav.length > 0 && (
            <div style={{ borderTop: '1px solid #E0E0E0', margin: '0 -16px 10px', paddingTop: 6 }}>
              {extraNav.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 16px', fontSize: 14, color: '#161616', textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
