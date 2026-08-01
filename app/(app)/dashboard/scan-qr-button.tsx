'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

// Camera QR scanner (E11). Replaces the NFC tap: opens the device camera, decodes a
// QR frame with jsQR, and feeds the decoded token into the same lookup as manual search.
// Works cross-device (iPhone/Safari, Android, laptop webcam) — unlike Web NFC. Requires
// HTTPS + camera permission; falls back gracefully when neither is available.
export default function ScanQrButton({
  onScan,
  variant = 'default',
  label = 'Scan QR',
}: {
  onScan: (token: string) => void;
  variant?: 'default' | 'bar';
  label?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setOpen(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = (canvasRef.current ??= document.createElement('canvas'));
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      const token = code.data.trim();
      stop();
      onScan(token);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onScan, stop]);

  async function start() {
    setErr(null);
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play();
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setOpen(false);
      const name = e instanceof DOMException ? e.name : '';
      setErr(
        name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow camera access, or use search.'
          : name === 'NotFoundError'
            ? 'No camera found on this device. Use search instead.'
            : 'Could not start the camera. Use search instead.',
      );
    }
  }

  const bar = variant === 'bar';

  if (!supported) {
    return (
      <span style={{ fontSize: bar ? 13 : 12, color: '#8D8D8D', alignSelf: 'center' }}>
        QR scan needs a camera — use search
      </span>
    );
  }

  return (
    <div style={bar ? { width: '100%' } : { display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        onClick={start}
        style={
          bar
            ? { width: '100%', height: 44, background: '#0F62FE', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
            : { height: 48, padding: '0 20px', background: '#0F62FE', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }
        }
      >
        {label}
      </button>
      {err && <span style={{ fontSize: 12, color: '#DA1E28', maxWidth: 220, display: 'block', marginTop: 4 }}>{err}</span>}

      {open && (
        <div
          role="dialog"
          aria-label="Scan a QR code"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}
        >
          <div style={{ color: '#fff', fontSize: 14 }}>Point the camera at the child&apos;s QR code</div>
          <div style={{ position: 'relative', width: 'min(88vw, 420px)', aspectRatio: '1 / 1', background: '#000', overflow: 'hidden', border: '2px solid #fff' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: '18%', border: '2px solid #24A148', boxShadow: '0 0 0 100vmax rgba(0,0,0,0.25)' }} />
          </div>
          <button
            type="button"
            onClick={stop}
            style={{ height: 48, padding: '0 24px', background: '#fff', color: '#161616', border: 'none', fontSize: 14, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
