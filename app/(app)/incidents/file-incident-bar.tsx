'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

// Narrow-only sticky primary above the bottom tab bar. Filing is a routine, constructive act, so
// the button is #0F62FE — never #DA1E28 (which on this page means emergency / escalated only).
export default function FileIncidentBar() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!narrow) return null;

  return (
    <>
      {/* Spacer so the last row clears the fixed bar (same pattern as the Register sheet). */}
      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 15, bottom: 'calc(56px + env(safe-area-inset-bottom))', padding: '6px 16px', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
        <Link
          href="/incidents/new"
          style={{ width: '100%', height: 44, background: '#0F62FE', color: '#fff', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Plus />
          File an incident
        </Link>
      </div>
    </>
  );
}
