'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  previewImportAction,
  importChildrenAction,
  type ImportPreviewState,
  type ImportResultState,
} from './import-actions';

export default function ImportChildren() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewState | null>(null);
  const [sendEmails, setSendEmails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResultState | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setSendEmails(false);
    setResult(null);
    setBusy(false);
  }
  function close() {
    setOpen(false);
    reset();
  }

  async function onFile(f: File | null) {
    setFile(f);
    setPreview(null);
    setResult(null);
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    fd.set('file', f);
    setPreview(await previewImportAction({}, fd));
    setBusy(false);
  }

  async function doImport() {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set('file', file);
    if (sendEmails) fd.set('sendEmails', 'on');
    const r = await importChildrenAction({}, fd);
    setResult(r);
    setBusy(false);
    if (r.imported) router.refresh();
  }

  const validCount = preview?.validCount ?? 0;
  const box: React.CSSProperties = { padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid' };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 14, cursor: 'pointer' }}
      >
        Import from spreadsheet
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Import children from a spreadsheet"
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(22,22,22,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 560, border: '1px solid #E0E0E0' }}>
            <div style={{ height: 56, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Import children</span>
              <button type="button" onClick={close} aria-label="Close" style={{ width: 44, height: 44, background: 'transparent', border: 'none', fontSize: 22, color: '#525252', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {result ? (
                result.error ? (
                  <div style={{ ...box, background: '#FFF1F1', borderColor: '#FFB3B8' }}>{result.error}</div>
                ) : (
                  <>
                    <div style={{ ...box, background: '#DEFBE6', borderColor: '#A7F0BA' }}>
                      Imported <strong>{result.imported}</strong> {result.imported === 1 ? 'child' : 'children'}
                      {result.emailed ? ` · emailed ${result.emailed} guardian${result.emailed === 1 ? '' : 's'}` : ''}
                      {result.skipped ? ` · skipped ${result.skipped} invalid row${result.skipped === 1 ? '' : 's'}` : ''}.
                    </div>
                    <button type="button" onClick={close} style={{ width: '100%', height: 44, background: '#0F62FE', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                      Done
                    </button>
                  </>
                )
              ) : (
                <>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: '#525252' }}>
                    Upload a CSV with columns: <strong>First name, Last name, Age, Guardian name, Guardian phone, Guardian email, Home address, Health details</strong> (first four required).{' '}
                    <a href="/children-import-template.csv" download style={{ color: '#0F62FE' }}>
                      Download template
                    </a>
                  </p>

                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                    style={{ display: 'block', marginBottom: 16, fontSize: 14 }}
                  />

                  {busy && !preview && <p style={{ fontSize: 13, color: '#525252' }}>Reading file…</p>}

                  {preview?.fatal && <div style={{ ...box, background: '#FFF1F1', borderColor: '#FFB3B8' }}>{preview.fatal}</div>}

                  {preview && !preview.fatal && (
                    <>
                      <div style={{ ...box, background: validCount ? '#EDF5FF' : '#FFF1F1', borderColor: validCount ? '#A6C8FF' : '#FFB3B8' }}>
                        <strong>{validCount}</strong> of {preview.total} row{preview.total === 1 ? '' : 's'} ready to import
                        {preview.sample && preview.sample.length > 0 && (
                          <span style={{ color: '#525252' }}> — e.g. {preview.sample.join(', ')}{validCount > preview.sample.length ? '…' : ''}</span>
                        )}
                      </div>

                      {preview.errors && preview.errors.length > 0 && (
                        <div style={{ border: '1px solid #E0E0E0', maxHeight: 160, overflowY: 'auto', marginBottom: 14 }}>
                          <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#8D6E00', background: '#FCF4D6', borderBottom: '1px solid #E0E0E0' }}>
                            {preview.errors.length} row{preview.errors.length === 1 ? '' : 's'} will be skipped
                          </div>
                          {preview.errors.map((e) => (
                            <div key={e.row} style={{ padding: '6px 12px', fontSize: 12.5, color: '#525252', borderBottom: '1px solid #F4F4F4' }}>
                              Row {e.row}: {e.reason}
                            </div>
                          ))}
                        </div>
                      )}

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#161616', marginBottom: 16, cursor: 'pointer' }}>
                        <input type="checkbox" checked={sendEmails} onChange={(e) => setSendEmails(e.target.checked)} style={{ width: 16, height: 16 }} />
                        Email each guardian their QR code (only rows with a guardian email)
                      </label>

                      <button
                        type="button"
                        onClick={doImport}
                        disabled={busy || validCount === 0}
                        style={{ width: '100%', height: 44, background: busy || validCount === 0 ? '#E0E0E0' : '#0F62FE', color: busy || validCount === 0 ? '#525252' : '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: busy || validCount === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        {busy ? 'Importing…' : validCount ? `Import ${validCount} ${validCount === 1 ? 'child' : 'children'}` : 'Nothing to import'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
