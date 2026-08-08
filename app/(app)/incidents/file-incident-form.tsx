'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { fileIncidentAction, type IncidentActionState } from './actions';
import { INCIDENT_CATEGORIES } from '@/lib/incidents';

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };

export default function FileIncidentForm({ childOptions }: { childOptions: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<IncidentActionState, FormData>(fileIncidentAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState('');
  const [guardianNotified, setGuardianNotified] = useState(false);

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setCategory('');
      setGuardianNotified(false);
    }
  }, [state]);

  const input: React.CSSProperties = { width: '100%', height: 40, background: '#fff', border: '1px solid #E0E0E0', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' };
  const area: React.CSSProperties = { width: '100%', minHeight: 72, background: '#fff', border: '1px solid #E0E0E0', padding: 10, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 };
  const outer: React.CSSProperties = { background: '#fff', border: '1px solid #E0E0E0', padding: 20, marginBottom: 24 };
  const section: React.CSSProperties = { marginTop: 18, borderTop: '1px solid #E0E0E0', paddingTop: 16 };

  return (
    <form ref={formRef} action={action} style={outer}>
      <div style={grid}>
        <div>
          <label style={label}>Type of incident *</label>
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...input, appearance: 'auto' }}>
            <option value="">Select…</option>
            {INCIDENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {category === 'other' && (
          <div>
            <label style={label}>Describe the type *</label>
            <input name="categoryOther" style={input} />
          </div>
        )}
      </div>

      <div style={{ ...grid, marginTop: 14 }}>
        <div>
          <label style={label}>When did it happen?</label>
          <input name="incidentAt" type="datetime-local" style={{ ...input, appearance: 'auto' }} />
        </div>
        <div>
          <label style={label}>Where did it happen?</label>
          <input name="location" placeholder="e.g. Main hall" style={input} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={label}>Child involved (if any)</label>
        <select name="childId" defaultValue="" style={{ ...input, appearance: 'auto' }}>
          <option value="">— No specific child (or an adult) —</option>
          {childOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={label}>Who was involved?</label>
        <textarea name="personsInvolved" placeholder="Names / roles of people involved or present" style={area} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={label}>How were they involved?</label>
        <textarea name="howInvolved" style={area} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={label}>What happened? *</label>
        <textarea name="narrative" placeholder="A clear, factual account of what happened" style={{ ...area, minHeight: 120 }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={label}>Any other key notes</label>
        <textarea name="keyNotes" style={area} />
      </div>

      {/* Guardian notified (E13-S3) */}
      <div style={section}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" name="guardianNotified" checked={guardianNotified} onChange={(e) => setGuardianNotified(e.target.checked)} style={{ width: 16, height: 16 }} />
          The child’s guardian has been notified
        </label>
        {guardianNotified && (
          <div style={{ marginTop: 12, maxWidth: 320 }}>
            <label style={label}>When were they notified?</label>
            <input name="guardianNotifiedAt" type="datetime-local" style={{ ...input, appearance: 'auto' }} />
          </div>
        )}
      </div>

      {/* External reporter (optional) */}
      <div style={section}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Reporter details</div>
        <div style={{ fontSize: 12, color: '#8D8D8D', margin: '4px 0 12px' }}>
          You’re recorded as the person filing this report. Only fill these in if the person who
          reported the incident to you isn’t you.
        </div>
        <div style={grid}>
          <div>
            <label style={label}>Reporter name</label>
            <input name="reporterName" style={input} />
          </div>
          <div>
            <label style={label}>Reporter phone</label>
            <input name="reporterPhone" inputMode="tel" style={{ ...input, fontFamily: 'var(--font-mono, monospace)' }} />
          </div>
          <div>
            <label style={label}>Reporter email</label>
            <input name="reporterEmail" type="email" autoComplete="off" style={input} />
          </div>
        </div>
      </div>

      {state.error && (
        <div style={{ marginTop: 16, background: '#FFF1F1', border: '1px solid #FFB3B8', borderLeft: '3px solid #DA1E28', padding: '10px 14px', fontSize: 13 }}>
          {state.error}
        </div>
      )}
      {state.ok && (
        <div style={{ marginTop: 16, background: '#DEFBE6', border: '1px solid #A7F0BA', borderLeft: '3px solid #24A148', padding: '10px 14px', fontSize: 13 }}>
          Incident report filed. Thank you — a Protection Officer will review it.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: 16, height: 44, padding: '0 24px', background: pending ? '#C6C6C6' : '#DA1E28', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer' }}
      >
        {pending ? 'Filing…' : 'File report'}
      </button>
    </form>
  );
}
