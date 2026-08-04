'use client';

import { useEffect, useState } from 'react';

const Download = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    <path d="M8 2v8" />
    <path d="M4.5 7 8 10.5 11.5 7" />
    <path d="M3 13h10" />
  </svg>
);

// Narrow-only: sticky "Export" bar + a sheet with the download / PDF options (honours the range).
export default function ExportSheet({ range }: { range: string }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [open, setOpen] = useState(false);
  if (!narrow) return null;

  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, padding: '12px 14px', border: '1px solid #E0E0E0', color: '#161616', textDecoration: 'none', background: '#fff', marginBottom: 10 };

  return (
    <>
      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />

      <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 15, bottom: 'calc(56px + env(safe-area-inset-bottom))', padding: '6px 16px', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ width: '100%', height: 44, background: '#0F62FE', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Download />
          Export
        </button>
      </div>

      {open && (
        <div role="dialog" aria-label="Export" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 'none', height: 56, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Export</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ width: 44, height: 44, background: 'transparent', border: 'none', fontSize: 22, color: '#525252', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <a href={`/api/reports/attendance?${range}`} style={rowStyle}>
              <Download size={18} />
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Attendance — CSV</span>
                <span style={{ display: 'block', fontSize: 12, color: '#525252' }}>The selected days · Opens in Excel</span>
              </span>
            </a>
            <a href={`/reports/print?${range}`} target="_blank" style={rowStyle}>
              <Download size={18} />
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Attendance — PDF</span>
                <span style={{ display: 'block', fontSize: 12, color: '#525252' }}>The selected days · Print or save as PDF</span>
              </span>
            </a>
            <a href="/api/reports/register" style={rowStyle}>
              <Download size={18} />
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Children register</span>
                <span style={{ display: 'block', fontSize: 12, color: '#525252' }}>The full children list · Opens in Excel</span>
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
