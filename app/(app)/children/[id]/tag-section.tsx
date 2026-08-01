'use client';

import { useActionState } from 'react';
import { generateTagAction, unassignTagAction, type TagActionState } from '../actions';

type Tag = { id: string; code: string; nfcUid: string | null; active: boolean };

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 14 };

export default function TagSection({ childId, tags }: { childId: string; tags: Tag[] }) {
  const active = tags.find((t) => t.active) ?? null;
  const past = tags.filter((t) => !t.active);
  const [state, action, busy] = useActionState<TagActionState, FormData>(generateTagAction, {});

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tag number</div>
      <p style={{ fontSize: 12, color: '#8D8D8D', margin: '0 0 12px', maxWidth: 560 }}>
        A unique number generated for the child — printed on their ID card and used for manual search. The QR code
        (used for scanning) is generated automatically. New children get one on registration.
      </p>

      {active ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 560, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14 }}>
            Current: <span style={mono}>{active.code}</span>
          </div>
          <form action={unassignTagAction} style={{ margin: 0 }}>
            <input type="hidden" name="childId" value={childId} />
            <button type="submit" style={{ height: 28, padding: '0 10px', background: 'transparent', border: 'none', color: '#DA1E28', fontSize: 12, cursor: 'pointer' }}>
              Unassign
            </button>
          </form>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#8D8D8D', margin: '0 0 12px' }}>No tag assigned.</p>
      )}

      <form action={action} style={{ marginTop: 6 }}>
        <input type="hidden" name="childId" value={childId} />
        <button
          type="submit"
          disabled={busy}
          style={{
            height: 36,
            padding: '0 16px',
            background: busy ? '#C6C6C6' : active ? '#fff' : '#0F62FE',
            color: active ? '#0F62FE' : '#fff',
            border: active ? '1px solid #0F62FE' : 'none',
            fontSize: 13,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Generating…' : active ? 'Generate new number' : 'Generate tag number'}
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
