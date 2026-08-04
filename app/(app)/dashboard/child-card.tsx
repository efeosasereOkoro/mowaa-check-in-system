'use client';

import { useState, useTransition } from 'react';
import type { ChildCard as CardData } from '@/lib/lookup';
import {
  checkInAction,
  checkOutAction,
  getCheckoutInfoAction,
  addVerifiedPickupAction,
} from './actions';

type Pickup = { id: string; name: string; relationship: string };
type Result = { ok?: true; error?: string };

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 13 };
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '130px 1fr', padding: '8px 0', borderBottom: '1px solid #F4F4F4', fontSize: 14 };
const rowLabel: React.CSSProperties = { fontSize: 12, color: '#525252' };
const primaryBtn = (busy: boolean): React.CSSProperties => ({
  height: 44, padding: '0 24px', background: busy ? '#C6C6C6' : '#0F62FE', color: '#fff', border: 'none', fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer',
});
const collectorBtn: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', background: '#fff', border: '1px solid #E0E0E0', fontSize: 14, cursor: 'pointer', marginBottom: 8,
};

function StatusBadge({ card }: { card: CardData }) {
  const s = card.status ?? 'not_arrived';
  const style: React.CSSProperties = { fontSize: 12, fontWeight: 600, padding: '3px 10px' };
  if (s === 'checked_in') return <span style={{ ...style, background: '#A7F0BA', color: '#0E6027' }}>Checked in · {card.inAt}</span>;
  if (s === 'checked_out') return <span style={{ ...style, background: '#E0E0E0', color: '#393939' }}>Checked out · {card.outAt}</span>;
  return <span style={{ ...style, background: '#DDE1E6', color: '#343A3F' }}>Not arrived</span>;
}

export default function ChildCard({
  card,
  eventOpen,
  onRefresh,
}: {
  card: CardData;
  eventOpen: boolean;
  onRefresh: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'checkout' | 'escalate'>('idle');
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [escName, setEscName] = useState('');
  const [escRel, setEscRel] = useState('');

  const status = card.status ?? 'not_arrived';

  function run(fn: () => Promise<Result>, after?: () => void) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (r.error) setErr(r.error);
      else {
        after?.();
        onRefresh();
      }
    });
  }

  function startCheckout() {
    setErr(null);
    start(async () => {
      const info = await getCheckoutInfoAction(card.id);
      setPickups(info.pickups);
      setMode('checkout');
    });
  }
  function reloadPickups() {
    start(async () => {
      const info = await getCheckoutInfoAction(card.id);
      setPickups(info.pickups);
    });
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>
          {card.firstName} {card.lastName}
        </span>
        {card.tagCode ? <span style={{ ...mono, background: '#E0E0E0', padding: '2px 8px' }}>{card.tagCode}</span> : <span style={{ fontSize: 12, color: '#8D8D8D' }}>no tag</span>}
        <StatusBadge card={card} />
        <span style={{ fontSize: 11, color: '#525252', marginLeft: 'auto' }}>matched by {card.matchedBy}</span>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid #E0E0E0' }}>
        <div style={row}><div style={rowLabel}>Age</div><div>{card.age ?? '—'}</div></div>
        <div style={row}><div style={rowLabel}>Guardian</div><div>{card.guardianName}</div></div>
        <div style={row}><div style={rowLabel}>Guardian phone</div><div style={mono}>{card.guardianPhone}</div></div>
        {status === 'checked_out' && card.collectorLabel && (
          <div style={row}><div style={rowLabel}>Collected by</div><div>{card.collectorLabel}</div></div>
        )}
        {card.healthDetails !== undefined && (
          <div style={row}><div style={rowLabel}>Health</div><div>{card.healthDetails || '—'}</div></div>
        )}
        {card.homeAddress !== undefined && (
          <div style={row}><div style={rowLabel}>Home address</div><div>{card.homeAddress || '—'}</div></div>
        )}
      </div>

      {err && <div style={{ marginTop: 12, color: '#DA1E28', fontSize: 13 }}>{err}</div>}

      {/* ----- Actions ----- */}
      <div style={{ marginTop: 16 }}>
        {!eventOpen && (
          <div style={{ fontSize: 13, color: '#8D8D8D' }}>
            Check-in / check-out is only available during event hours.
          </div>
        )}

        {eventOpen && status === 'not_arrived' && (
          <button onClick={() => run(() => checkInAction(card.id))} disabled={pending} style={primaryBtn(pending)}>
            {pending ? 'Working…' : 'Check In'}
          </button>
        )}

        {eventOpen && status === 'checked_in' && mode !== 'checkout' && (
          <button onClick={startCheckout} disabled={pending} style={primaryBtn(pending)}>
            {pending ? 'Working…' : 'Check Out'}
          </button>
        )}

        {eventOpen && status === 'checked_in' && mode === 'checkout' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Who is collecting {card.firstName}?</div>
            <div style={{ fontSize: 12, color: '#525252', marginBottom: 12 }}>Verify the person is authorised before releasing the child.</div>

            <button style={collectorBtn} disabled={pending} onClick={() => run(() => checkOutAction(card.id, null, `${card.guardianName} (Guardian)`), () => setMode('idle'))}>
              <strong>{card.guardianName}</strong> <span style={{ color: '#525252' }}>· Guardian</span>
            </button>
            {pickups.map((p) => (
              <button key={p.id} style={collectorBtn} disabled={pending} onClick={() => run(() => checkOutAction(card.id, p.id, `${p.name} (${p.relationship})`), () => setMode('idle'))}>
                <strong>{p.name}</strong> <span style={{ color: '#525252' }}>· {p.relationship}</span>
              </button>
            ))}
            <button style={{ ...collectorBtn, borderLeft: '3px solid #DA1E28' }} onClick={() => setMode('escalate')}>
              <strong style={{ color: '#DA1E28' }}>Person not on the list</strong>
              <span style={{ color: '#525252' }}> · escalate to admin</span>
            </button>
            <button onClick={() => setMode('idle')} style={{ height: 36, padding: '0 14px', background: 'transparent', border: '1px solid #8D8D8D', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {eventOpen && status === 'checked_in' && mode === 'escalate' && (
          <div>
            <div style={{ background: '#FFF1F1', border: '1px solid #FFB3B8', borderLeft: '3px solid #DA1E28', padding: '12px 16px', fontSize: 13 }}>
              <strong>Do not release {card.firstName}.</strong> Keep them at the desk, verify the person&rsquo;s identity, contact the guardian, and notify an admin. Only after verification, add the person below and check out.
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={escName} onChange={(e) => setEscName(e.target.value)} placeholder="Full name" style={{ flex: 1.4, minWidth: 140, height: 36, border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', fontSize: 13 }} />
              <input value={escRel} onChange={(e) => setEscRel(e.target.value)} placeholder="Relationship" style={{ flex: 1, minWidth: 120, height: 36, border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', fontSize: 13 }} />
              <button
                disabled={pending || !escName.trim() || !escRel.trim()}
                onClick={() => {
                  setErr(null);
                  start(async () => {
                    const r = await addVerifiedPickupAction(card.id, escName, escRel);
                    if (r.error) setErr(r.error);
                    else {
                      setEscName('');
                      setEscRel('');
                      reloadPickups();
                      setMode('checkout');
                    }
                  });
                }}
                style={{ height: 36, padding: '0 16px', background: '#0F62FE', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
              >
                Add to pickup list
              </button>
            </div>
            <button onClick={() => setMode('checkout')} style={{ marginTop: 10, height: 32, padding: '0 12px', background: 'transparent', border: 'none', color: '#0F62FE', fontSize: 13, cursor: 'pointer' }}>
              ← Back to collector list
            </button>
          </div>
        )}

        {eventOpen && status === 'checked_out' && (
          <div>
            <div style={{ fontSize: 13, color: '#525252', marginBottom: 10 }}>
              Checked out at {card.outAt}
              {card.collectorLabel ? ` — collected by ${card.collectorLabel}.` : '.'}
            </div>
            {/* A child can return the same day — check them back in with no override (B-045). */}
            <button onClick={() => run(() => checkInAction(card.id))} disabled={pending} style={primaryBtn(pending)}>
              {pending ? 'Working…' : 'Check in again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
