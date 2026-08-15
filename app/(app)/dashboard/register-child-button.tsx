'use client';

import { useEffect, useState } from 'react';
import RegisterForm from '../children/register-form';

// "Register" for the dashboard (receptionist + admin). Opens the shared register form (child
// or family) in a modal — full-screen on mobile, a centred card on desktop — so receptionists
// can register without the admin-only Children page.
export default function RegisterChildButton() {
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', width: narrow ? '100%' : 'auto', justifyContent: 'center', alignItems: 'center', gap: 6, height: narrow ? 44 : 40, padding: '0 16px', background: '#0F62FE', color: '#fff', border: 'none', fontSize: narrow ? 15 : 14, fontWeight: 600, cursor: 'pointer' }}
      >
        + Register
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: narrow ? '#fff' : 'rgba(22,22,22,0.45)',
            display: 'flex',
            alignItems: narrow ? 'stretch' : 'flex-start',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: narrow ? 0 : '40px 16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: narrow ? undefined : 560,
              display: 'flex',
              flexDirection: 'column',
              ...(narrow ? { minHeight: '100%' } : { border: '1px solid #E0E0E0' }),
            }}
          >
            <div style={{ flex: 'none', height: 56, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Register</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ width: 44, height: 44, background: 'transparent', border: 'none', fontSize: 22, color: '#525252', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <RegisterForm sheet onSuccess={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
