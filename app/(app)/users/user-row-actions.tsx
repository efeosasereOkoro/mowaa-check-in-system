'use client';

import { useState, useTransition } from 'react';
import { setUserSuspendedAction } from './actions';

export default function UserRowActions({
  userId,
  suspended,
  isSelf,
  full,
}: {
  userId: string;
  suspended: boolean;
  isSelf: boolean;
  full?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (isSelf) return <span style={{ color: '#8D8D8D', fontSize: 12 }}>—</span>;

  const run = () => {
    setErr(null);
    setConfirming(false);
    startTransition(async () => {
      const res = await setUserSuspendedAction(userId, !suspended);
      if (res?.error) setErr(res.error);
    });
  };

  const onPrimary = () => {
    // Suspending is the destructive-ish path → inline confirm (native confirm() is
    // unreliable in some webviews, B-020). Reactivating is one click.
    if (!suspended && !confirming) {
      setConfirming(true);
      return;
    }
    run();
  };

  const btn = (bg: string, color: string, border: string, label: string, onClick: () => void, key?: string): React.ReactNode => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{
        height: full ? 44 : 28,
        width: full && !confirming ? '100%' : undefined,
        padding: '0 12px',
        background: bg,
        border,
        color,
        fontSize: full ? 13 : 12,
        cursor: pending ? 'wait' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {confirming && !suspended ? (
          <>
            {btn('#DA1E28', '#fff', 'none', pending ? '…' : 'Confirm suspend', run)}
            {btn('#fff', '#525252', '1px solid #8D8D8D', 'Cancel', () => setConfirming(false))}
          </>
        ) : (
          btn(
            full ? '#fff' : 'transparent',
            suspended ? '#0F62FE' : '#DA1E28',
            `1px solid ${suspended ? '#0F62FE' : '#DA1E28'}`,
            pending ? '…' : suspended ? 'Reactivate' : 'Suspend',
            onPrimary,
          )
        )}
      </div>
      {err && <span style={{ color: '#DA1E28', fontSize: 11, maxWidth: 220 }}>{err}</span>}
    </div>
  );
}
