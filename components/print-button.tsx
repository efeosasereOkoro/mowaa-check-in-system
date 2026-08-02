'use client';

// Generic print trigger for standalone printable pages (e.g. the individual child report).
export default function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ height: 44, padding: '0 24px', background: '#0F62FE', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer' }}
    >
      {label}
    </button>
  );
}
