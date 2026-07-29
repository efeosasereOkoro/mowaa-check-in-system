'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';

// Client sign-out then a HARD navigation to /sign-in, so the server re-reads
// cookies from scratch (no client cache). Paired with a short sessionDataTtl
// (lib/auth/server.ts) so any cached session clears fast. See B-017.
export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await authClient.signOut();
    } finally {
      window.location.href = '/sign-in';
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      style={{
        height: 40,
        padding: '0 16px',
        background: 'transparent',
        border: '1px solid #0F62FE',
        color: '#0F62FE',
        fontSize: 14,
        cursor: busy ? 'not-allowed' : 'pointer',
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
