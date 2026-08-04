'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type DayOption = { value: string; label: string };

// Report duration: a From and To day (B-056). Single day = From === To; "Whole event"
// spans the first to the last day. Native selects — accessible + reliable on both widths.
export default function ReportRangeSelect({ options, from, to }: { options: DayOption[]; from: string; to: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (f: string, t: string) => startTransition(() => router.push(`/reports?from=${f}&to=${t}`));

  const sel: React.CSSProperties = {
    height: 40,
    background: '#fff',
    border: '1px solid #E0E0E0',
    padding: '0 10px',
    fontSize: 14,
    color: '#161616',
    cursor: pending ? 'wait' : 'pointer',
    maxWidth: 200,
  };
  const lbl: React.CSSProperties = { fontSize: 13, color: '#525252' };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={lbl}>
        From{' '}
        <select value={from} onChange={(e) => go(e.target.value, to)} disabled={pending} style={sel} aria-label="Report from day">
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label style={lbl}>
        to{' '}
        <select value={to} onChange={(e) => go(from, e.target.value)} disabled={pending} style={sel} aria-label="Report to day">
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {options.length > 1 && (
        <button
          type="button"
          onClick={() => go(options[0].value, options[options.length - 1].value)}
          disabled={pending}
          style={{ height: 40, padding: '0 12px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 13, cursor: pending ? 'wait' : 'pointer' }}
        >
          Whole event
        </button>
      )}
    </div>
  );
}
