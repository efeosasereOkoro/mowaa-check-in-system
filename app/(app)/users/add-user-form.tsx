'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { inviteUserAction, type UserActionState } from './actions';
import type { StaffRole } from '@/lib/staff';

// Local labels — this is a client component, so it must NOT import a *value* from
// lib/staff.ts (that module pulls in server-only auth/db code). Type-only import above
// is erased at build; the labels live here.
const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  receptionist: 'Receptionist',
  health: 'Health Officer',
};

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };
const input: React.CSSProperties = {
  width: '100%',
  height: 40,
  background: '#fff',
  border: 'none',
  borderBottom: '1px solid #8D8D8D',
  padding: '0 12px',
  fontSize: 14,
};

const ROLES: StaffRole[] = ['receptionist', 'health', 'admin'];

function suggestPassword(): string {
  // Client-side convenience only (not a secret source): readable temp password.
  const words = ['Camp', 'Tag', 'Kids', 'Check', 'Gate', 'Blue', 'Green', 'Star'];
  const w = words[new Date().getSeconds() % words.length];
  const n = 1000 + (new Date().getMilliseconds() % 9000);
  return `${w}${n}!`;
}

export default function AddUserForm() {
  const [state, action, pending] = useActionState<UserActionState, FormData>(inviteUserAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setPassword('');
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20, marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Add user</div>
      <p style={{ fontSize: 12, color: '#525252', margin: '0 0 16px', maxWidth: 640 }}>
        There is no public sign-up — you provision each staff member here. Set a temporary password and share it with
        them; they use it to log in. (Self-set passwords via an emailed invite come later.)
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div>
          <label style={label}>Full name *</label>
          <input name="name" autoComplete="off" style={input} />
        </div>
        <div>
          <label style={label}>Email *</label>
          <input name="email" type="email" autoComplete="off" inputMode="email" style={input} />
        </div>
        <div>
          <label style={label}>Role *</label>
          <select name="role" defaultValue="receptionist" style={{ ...input, cursor: 'pointer' }}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 14, maxWidth: 420 }}>
        <label style={label}>Temporary password * (min 8 characters)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input
            name="password"
            type="text"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...input, fontFamily: 'var(--font-mono, monospace)', flex: 1 }}
          />
          <button
            type="button"
            onClick={() => setPassword(suggestPassword())}
            style={{ height: 40, padding: '0 14px', background: '#fff', border: '1px solid #0F62FE', color: '#0F62FE', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Suggest
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#8D8D8D', marginTop: 6 }}>Shown in plain text so you can copy it to share. Ask the user to change it after first login.</p>
      </div>

      {state.error && (
        <div style={{ marginTop: 16, background: '#FFF1F1', border: '1px solid #FFB3B8', borderLeft: '3px solid #DA1E28', padding: '10px 14px', fontSize: 13 }}>
          {state.error}
        </div>
      )}
      {state.ok && (
        <div style={{ marginTop: 16, background: '#DEFBE6', border: '1px solid #A7F0BA', borderLeft: '3px solid #24A148', padding: '10px 14px', fontSize: 13 }}>
          <strong>{state.createdName}</strong> added. Share their email and the temporary password so they can log in.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: 16, height: 40, padding: '0 24px', background: pending ? '#C6C6C6' : '#0F62FE', color: '#fff', border: 'none', fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer' }}
      >
        {pending ? 'Adding…' : 'Add user'}
      </button>
    </form>
  );
}
