'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';

const MIN_LENGTH = 8;

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token');
  const linkError = params.get('error'); // Neon Auth redirects invalid/expired links here

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // No usable token → the link is invalid or expired.
  if (!token || linkError) {
    return (
      <AuthShell title="Reset link invalid" subtitle="This password reset link is invalid or has expired.">
        <div
          style={{
            background: '#FFF1F1',
            border: '1px solid #FFB3B8',
            borderLeft: '3px solid #DA1E28',
            padding: '12px 16px',
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          Request a new link and try again — reset links expire after a short while.
        </div>
        <Link href="/forgot-password" style={{ fontSize: 14, color: '#0F62FE' }}>
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Your password has been changed.">
        <div
          style={{
            background: '#DEFBE6',
            border: '1px solid #A7F0BA',
            borderLeft: '3px solid #0E6027',
            padding: '12px 16px',
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          You can now sign in with your new password.
        </div>
        <Link href="/sign-in" style={{ fontSize: 14, color: '#0F62FE' }}>
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.resetPassword({ newPassword: password, token: token! });
      if (res && 'error' in res && res.error) {
        setError(res.error.message || 'Could not reset your password. The link may have expired.');
        return;
      }
      setDone(true);
    } catch (err) {
      // Neon Auth throws on a 4xx (e.g. an expired/invalid token) rather than returning { error }.
      setError(err instanceof Error && err.message ? err.message : 'Could not reset your password. The link may have expired.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle={`At least ${MIN_LENGTH} characters.`}>
      <form onSubmit={onSubmit}>
        <label htmlFor="new-password" style={{ fontSize: 12, color: '#525252' }}>
          New password
        </label>
        <PasswordInput id="new-password" value={password} onChange={setPassword} required autoComplete="new-password" />

        <label htmlFor="confirm-password" style={{ fontSize: 12, color: '#525252' }}>
          Confirm new password
        </label>
        <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} required autoComplete="new-password" />

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
          }}
        >
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Reset your password" subtitle="Loading…" children={null} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
