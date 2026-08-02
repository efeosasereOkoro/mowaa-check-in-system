'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { PasswordInput } from '@/components/password-input';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  background: '#fff',
  border: 'none',
  borderBottom: '1px solid #8D8D8D',
  padding: '0 16px',
  fontSize: 14,
  marginBottom: 20,
};

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.signIn.email({ email, password });
      // Better Auth returns { data, error } rather than throwing.
      if (res && 'error' in res && res.error) {
        setError(res.error.message || 'Sign in failed. Check your email and password.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F4F4',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{ width: 400, maxWidth: '92vw', background: '#fff', border: '1px solid #E0E0E0', padding: 32 }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: '#0F62FE',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          ST
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>SmartTag Check-In</h1>
        <p style={{ fontSize: 14, color: '#525252', margin: '6px 0 28px' }}>
          Sign in to the attendance console.
        </p>

        <label style={{ fontSize: 12, color: '#525252' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label htmlFor="password" style={{ fontSize: 12, color: '#525252' }}>
            Password
          </label>
          <Link href="/forgot-password" style={{ fontSize: 12, color: '#0F62FE' }}>
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
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
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
