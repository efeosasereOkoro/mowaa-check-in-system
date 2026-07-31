'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ height: 44, padding: '0 24px', background: '#0F62FE', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer' }}
    >
      Print cards
    </button>
  );
}
