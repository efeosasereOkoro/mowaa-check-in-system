'use client';

import { useState, useTransition } from 'react';
import { setUserSuspendedAction, deleteUserAction } from './actions';

export default function UserRowActions({
  userId,
  name,
  suspended,
  isSelf,
  full,
}: {
  userId: string;
  name: string;
  suspended: boolean;
  isSelf: boolean;
  full?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'idle' | 'suspend' | 'delete'>('idle');
  const [err, setErr] = useState<string | null>(null);

  if (isSelf) return <span style={{ color: '#8D8D8D', fontSize: 12 }}>—</span>;

  const runSuspend = () => {
    setErr(null);
    setMode('idle');
    startTransition(async () => {
      const r = await setUserSuspendedAction(userId, !suspended);
      if (r?.error) setErr(r.error);
    });
  };
  const runDelete = () => {
    setErr(null);
    startTransition(async () => {
      const r = await deleteUserAction(userId);
      if (r?.error) {
        setErr(r.error);
        setMode('idle');
      }
    });
  };

  const btn = (bg: string, color: string, border: string, label: string, onClick: () => void): React.ReactNode => (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{ height: full ? 44 : 28, padding: '0 12px', background: bg, border, color, fontSize: full ? 13 : 12, cursor: pending ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
    >
      {label}
    </button>
  );

  let content: React.ReactNode;
  if (mode === 'suspend') {
    // Suspending is destructive-ish → inline confirm (native confirm() is unreliable in
    // some webviews, B-020). Reactivating is one click.
    content = (
      <>
        {btn('#DA1E28', '#fff', 'none', pending ? '…' : 'Confirm suspend', runSuspend)}
        {btn('#fff', '#525252', '1px solid #8D8D8D', 'Cancel', () => setMode('idle'))}
      </>
    );
  } else if (mode === 'delete') {
    content = (
      <>
        <span style={{ fontSize: full ? 13 : 12, color: '#161616', alignSelf: 'center', whiteSpace: 'normal' }}>Delete {name}?</span>
        {btn('#DA1E28', '#fff', 'none', pending ? '…' : 'Yes, delete', runDelete)}
        {btn('#fff', '#525252', '1px solid #8D8D8D', 'No', () => setMode('idle'))}
      </>
    );
  } else {
    content = (
      <>
        {btn(
          full ? '#fff' : 'transparent',
          suspended ? '#0F62FE' : '#DA1E28',
          `1px solid ${suspended ? '#0F62FE' : '#DA1E28'}`,
          pending ? '…' : suspended ? 'Reactivate' : 'Suspend',
          suspended ? runSuspend : () => setMode('suspend'),
        )}
        {btn(full ? '#fff' : 'transparent', '#525252', '1px solid #8D8D8D', 'Delete', () => setMode('delete'))}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>{content}</div>
      {err && <span style={{ color: '#DA1E28', fontSize: 11, maxWidth: 240 }}>{err}</span>}
    </div>
  );
}
