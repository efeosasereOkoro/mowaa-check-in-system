'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { AuthShell } from '@/components/auth-shell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Neon Auth (Better Auth) emails a link to <origin>/reset-password?token=…
      const res = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Don't reveal whether the account exists — always show the same confirmation.
      if (res && 'error' in res && res.error) {
        // eslint-disable-next-line no-console
        console.error('requestPasswordReset error', res.error);
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="Password reset requested.">
        <div
          style={{
            background: '#EDF5FF',
            border: '1px solid #A6C8FF',
            borderLeft: '3px solid #0F62FE',
            padding: '12px 16px',
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          If an account exists for <strong>{email}</strong>, we’ve sent a link to reset your password.
          Check your inbox — the link expires after a short while.
        </div>
        <Link href="/sign-in" style={{ fontSize: 14, color: '#0F62FE' }}>
          ← Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we’ll send you a reset link.">
      <form onSubmit={onSubmit}>
        <label htmlFor="email" style={{ fontSize: 12, color: '#525252' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{
            width: '100%',
            height: 48,
            background: '#fff',
            color: '#161616',
            border: 'none',
            borderBottom: '1px solid #8D8D8D',
            padding: '0 16px',
            fontSize: 14,
            marginBottom: 20,
          }}
        />

        {error && (
          <div
            style={{
              background: '#FFF1F1',
              border: '1px solid #FFB3B8',
              borderLeft: '3px solid #DA1E28',
              padding: '12px 16px',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%',
            height: 48,
            background: busy ? '#C6C6C6' : '#0F62FE',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            cursor: busy ? 'not-allowed' : 'pointer',
            marginBottom: 20,
          }}
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>

        <Link href="/sign-in" style={{ fontSize: 14, color: '#0F62FE' }}>
          ← Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
