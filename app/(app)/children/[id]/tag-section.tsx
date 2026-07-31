'use client';

import { useActionState, useEffect, useRef } from 'react';
import { assignTagAction, unassignTagAction, type TagActionState } from '../actions';

type Tag = { id: string; code: string; nfcUid: string | null; active: boolean };

const input: React.CSSProperties = {
  height: 36,
  background: '#fff',
  border: 'none',
  borderBottom: '1px solid #8D8D8D',
  padding: '0 12px',
  fontSize: 13,
};
const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 13 };

export default function TagSection({ childId, tags }: { childId: string; tags: Tag[] }) {
  const active = tags.find((t) => t.active) ?? null;
  const past = tags.filter((t) => !t.active);
  const [state, action, busy] = useActionState<TagActionState, FormData>(assignTagAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tag number</div>
      <p style={{ fontSize: 12, color: '#8D8D8D', margin: '0 0 12px', maxWidth: 560 }}>
        The human-readable number printed on the child&apos;s ID card and used for manual search. The QR code
        (used for scanning) is generated automatically.
      </p>

      {active ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            maxWidth: 560,
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 14 }}>
            Current: <span style={mono}>{active.code}</span>
          </div>
          <form action={unassignTagAction}>
            <input type="hidden" name="childId" value={childId} />
            <button
              type="submit"
              style={{
                height: 28,
                padding: '0 10px',
                background: 'transparent',
                border: 'none',
                color: '#DA1E28',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Unassign
            </button>
          </form>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#8D8D8D', margin: '0 0 12px' }}>No tag assigned.</p>
      )}

      <form ref={formRef} action={action} style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <input type="hidden" name="childId" value={childId} />
        <input name="code" placeholder="Tag number (e.g. TAG-001)" style={{ ...input, flex: 1, minWidth: 180 }} />
        <button
          type="submit"
          disabled={busy}
          style={{
            height: 36,
            padding: '0 16px',
            background: busy ? '#C6C6C6' : '#0F62FE',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Saving…' : active ? 'Replace tag' : 'Assign tag'}
        </button>
      </form>

      {state.error && <div style={{ marginTop: 10, color: '#DA1E28', fontSize: 13 }}>{state.error}</div>}

      {past.length > 0 && (
        <div style={{ marginTop: 14, fontSize: 12, color: '#8D8D8D' }}>
          Previous tags: {past.map((t) => t.code).join(', ')}
        </div>
      )}
    </div>
  );
}
