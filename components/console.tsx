'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';

// Shared console page kit (design handoff "1a"): one header band, one data card + toolbar,
// one status-tag treatment across every list/detail page. Carbon visual language unchanged —
// only structure and consistency. Keep all values in sync with README design tokens.

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow;
}

// ---------- Status tag — one filled-Carbon-tag treatment everywhere ----------
export type StatusTone = 'success' | 'neutral' | 'warning' | 'info' | 'danger';
const TONE: Record<StatusTone, { bg: string; color: string }> = {
  success: { bg: '#A7F0BA', color: '#0E6027' }, // checked in / on-site / active / resolved
  neutral: { bg: '#DDE1E6', color: '#343A3F' }, // not arrived / checked out / submitted
  warning: { bg: '#FCF4D6', color: '#8D6E00' }, // escalated / moderate
  info: { bg: '#D0E2FF', color: '#0043CE' }, // under investigation
  danger: { bg: '#FFB3B8', color: '#DA1E28' }, // emergency
};

export function StatusTag({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 10px', whiteSpace: 'nowrap', background: t.bg, color: t.color }}>
      {children}
    </span>
  );
}

// ---------- Action descriptors (band + toolbar) ----------
export type BandAction = {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  target?: string;
  icon?: ReactNode;
  primary?: boolean;
};

const secondaryStyle: CSSProperties = { height: 40, padding: '0 14px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 14, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', cursor: 'pointer' };
const primaryStyle: CSSProperties = { height: 40, padding: '0 16px', background: '#0F62FE', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', cursor: 'pointer' };

function ActionEl({ action, style }: { action: BandAction; style: CSSProperties }) {
  if (action.href) {
    return (
      <Link href={action.href} target={action.target} style={style}>
        {action.icon}
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} style={style}>
      {action.icon}
      {action.label}
    </button>
  );
}

// ---------- Page header band ----------
export function PageBand({ breadcrumb, title, context, actions = [] }: { breadcrumb?: ReactNode; title: string; context?: ReactNode; actions?: BandAction[] }) {
  const narrow = useNarrow();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menu]);

  const primary = actions.find((a) => a.primary);
  const secondary = actions.filter((a) => !a.primary);

  if (narrow) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 16 }}>
        {breadcrumb && <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>{breadcrumb}</div>}
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
        {context && <div style={{ fontSize: 13, color: '#525252', marginTop: 2 }}>{context}</div>}
        {(primary || secondary.length > 0) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'stretch' }}>
            {primary && <ActionEl action={primary} style={{ ...primaryStyle, flex: 1, height: 44, justifyContent: 'center' }} />}
            {secondary.length > 0 && (
              <div ref={ref} style={{ position: 'relative', flex: 'none' }}>
                <button type="button" aria-haspopup="menu" aria-expanded={menu} aria-label="More actions" onClick={() => setMenu((o) => !o)} style={{ width: 44, height: 44, background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 20, cursor: 'pointer' }}>
                  ⋯
                </button>
                {menu && (
                  <div role="menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60, minWidth: 200, background: '#fff', border: '1px solid #E0E0E0', boxShadow: '0 4px 14px rgba(0,0,0,0.16)' }}>
                    {secondary.map((a) => (
                      <ActionEl key={a.key} action={{ ...a, onClick: a.onClick ? () => { setMenu(false); a.onClick?.(); } : undefined }} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 16px', background: '#fff', border: 'none', color: '#161616', fontSize: 14, textDecoration: 'none', cursor: 'pointer', width: '100%' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: '20px 24px', display: 'flex', alignItems: breadcrumb ? 'flex-end' : 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        {breadcrumb && <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>{breadcrumb}</div>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>{title}</h1>
          {context && <span style={{ fontSize: 15, color: '#525252' }}>{context}</span>}
        </div>
      </div>
      {actions.length > 0 && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {secondary.map((a) => (
            <ActionEl key={a.key} action={a} style={secondaryStyle} />
          ))}
          {primary && <ActionEl action={primary} style={primaryStyle} />}
        </div>
      )}
    </div>
  );
}

// ---------- Data / section card + 48px header ----------
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: '#fff', border: '1px solid #E0E0E0', ...style }}>{children}</div>;
}

export function CardHeader({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div style={{ height: 48, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
      {meta != null && <span style={{ fontSize: 12, color: '#8D8D8D' }}>{meta}</span>}
    </div>
  );
}

const Magnifier = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);

// The 48px data-card toolbar: search on the left, filter chips on the right.
export function Toolbar({ q, onQ, placeholder, chips }: { q: string; onQ: (v: string) => void; placeholder: string; chips?: ReactNode }) {
  return (
    <div style={{ minHeight: 48, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Magnifier />
        <input value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, height: 46 }} />
      </div>
      {chips && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 'none' }}>{chips}</div>}
    </div>
  );
}

// Standalone 44px search row for the mobile layout (desktop puts search inside the Toolbar).
export function SearchRow({ q, onQ, placeholder }: { q: string; onQ: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ height: 44, background: '#fff', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
      <Magnifier />
      <input value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }} />
    </div>
  );
}

export type Chip = { key: string; label: string; count: number };

export function FilterChips<K extends string>({ chips, value, onChange }: { chips: (Chip & { key: K })[]; value: K; onChange: (k: K) => void }) {
  return (
    <>
      {chips.map((c) => {
        const selected = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            aria-pressed={selected}
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: selected ? '1px solid #0F62FE' : '1px solid #8D8D8D',
              background: selected ? '#EDF5FF' : '#fff',
              color: selected ? '#0F62FE' : '#161616',
            }}
          >
            {c.label} ({c.count})
          </button>
        );
      })}
    </>
  );
}

// Mobile four-up segment strip (replaces desktop chips on narrow). Counts derive from the
// search-filtered set; a zero segment is dimmed and not focusable.
export function SegmentStrip<K extends string>({ segments, value, onChange }: { segments: { key: K; label: string; count: number; color?: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${segments.length}, 1fr)`, background: '#fff', border: '1px solid #E0E0E0' }}>
      {segments.map((s, i) => {
        const selected = value === s.key;
        const disabled = s.count === 0;
        const countColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : s.color ?? '#161616';
        const labelColor = disabled ? '#8D8D8D' : selected ? '#0F62FE' : '#525252';
        return (
          <button
            key={s.key}
            type="button"
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : () => onChange(s.key)}
            style={{
              height: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              borderTop: 'none',
              borderRight: 'none',
              borderLeft: i === 0 ? 'none' : '1px solid #E0E0E0',
              borderBottom: selected ? '3px solid #0F62FE' : '3px solid transparent',
              background: disabled ? '#FAFAFA' : selected ? '#EDF5FF' : '#fff',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1, color: countColor }}>{s.count}</span>
            <span style={{ fontSize: 10, letterSpacing: '.04em', color: labelColor }}>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
