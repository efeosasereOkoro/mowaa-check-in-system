'use client';

import { useEffect, useState } from 'react';
import RegisterForm from './register-form';

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

// Narrow-only: sticky "Register" bar + a full-height sheet wrapping the register form.
export default function AddChildSheet() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [open, setOpen] = useState(false);
  if (!narrow) return null;

  return (
    <>
      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />

      <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 15, bottom: 'calc(56px + env(safe-area-inset-bottom))', padding: '6px 16px', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ width: '100%', height: 44, background: '#0F62FE', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Plus />
          Register
        </button>
      </div>

      {open && (
        <div role="dialog" aria-label="Register" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 'none', height: 56, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Register</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ width: 44, height: 44, background: 'transparent', border: 'none', fontSize: 22, color: '#525252', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <RegisterForm sheet onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
