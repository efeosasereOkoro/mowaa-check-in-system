'use client';

import { useState, useTransition } from 'react';
import { setUserSuspendedAction } from './actions';

export default function UserRowActions({
  userId,
  suspended,
  isSelf,
}: {
  userId: string;
  suspended: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (isSelf) return <span style={{ color: '#8D8D8D', fontSize: 12 }}>—</span>;

  const onClick = () => {
    setErr(null);
    if (!suspended && !window.confirm('Suspend this user? They will be blocked from the app until reactivated. Their history stays attributed to them.')) {
      return;
    }
    startTransition(async () => {
      const res = await setUserSuspendedAction(userId, !suspended);
      if (res?.error) setErr(res.error);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        style={{
          height: 28,
          padding: '0 12px',
          background: 'transparent',
          border: `1px solid ${suspended ? '#0F62FE' : '#DA1E28'}`,
          color: suspended ? '#0F62FE' : '#DA1E28',
          fontSize: 12,
          cursor: pending ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {pending ? '…' : suspended ? 'Reactivate' : 'Suspend'}
      </button>
      {err && <span style={{ color: '#DA1E28', fontSize: 11, maxWidth: 200 }}>{err}</span>}
    </div>
  );
}
