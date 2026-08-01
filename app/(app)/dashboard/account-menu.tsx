'use client';

import { useEffect, useRef, useState } from 'react';
import LogoutButton from '@/components/logout-button';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
}

// Narrow header account control: a circular avatar (initials) that opens a popover
// with the name, role, and Sign out. Sign-out is rare, so it's tucked here rather than
// being the loudest thing on the screen.
export default function AccountMenu({ userName, roleLabel }: { userName: string; roleLabel: string }) {
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
          <div style={{ fontSize: 12, color: '#525252', marginBottom: 14 }}>{roleLabel}</div>
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
