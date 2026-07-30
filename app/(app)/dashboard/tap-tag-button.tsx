'use client';

import { useEffect, useState } from 'react';

// Web NFC "tap tag" — reads the tag's serial number (UID) via NDEFReader.
// Feature-detected: only Chrome for Android exposes NDEFReader; elsewhere we show a hint.
// The actual tap needs the client's SmartTag2 + Android device (PRD 10.3); the resolved
// UID flows into the same lookup as manual entry, so the resolve path is testable without hardware.
export default function TapTagButton({ onScan }: { onScan: (uid: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'NDEFReader' in window);
  }, []);

  if (!supported) {
    return (
      <span style={{ fontSize: 12, color: '#8D8D8D', alignSelf: 'center' }}>
        NFC tap: Chrome for Android only
      </span>
    );
  }

  async function tap() {
    setErr(null);
    setScanning(true);
    try {
      const NDEFReader = (window as unknown as { NDEFReader: new () => unknown }).NDEFReader;
      const reader = new NDEFReader() as {
        scan: () => Promise<void>;
        onreading: ((e: { serialNumber?: string }) => void) | null;
        onreadingerror: (() => void) | null;
      };
      await reader.scan();
      reader.onreading = (e) => {
        setScanning(false);
        if (e.serialNumber) onScan(e.serialNumber);
      };
      reader.onreadingerror = () => {
        setScanning(false);
        setErr('Could not read the tag. Try again.');
      };
    } catch (e) {
      setScanning(false);
      setErr(e instanceof Error ? e.message : 'NFC scan failed.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        onClick={tap}
        disabled={scanning}
        style={{
          height: 48,
          padding: '0 20px',
          background: scanning ? '#0353E9' : '#0F62FE',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          cursor: scanning ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {scanning ? 'Tap a tag…' : 'Tap tag'}
      </button>
      {err && <span style={{ fontSize: 12, color: '#DA1E28' }}>{err}</span>}
    </div>
  );
}
