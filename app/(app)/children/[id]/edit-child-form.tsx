'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateChildAction, type ChildActionState } from '../actions';

type ChildValues = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  homeAddress: string | null;
  healthDetails: string | null;
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

export default function EditChildForm({ child }: { child: ChildValues }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ChildActionState, FormData>(updateChildAction, {});

  useEffect(() => {
    if (state.ok) {
      router.push('/children');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20 }}>
      <input type="hidden" name="id" value={child.id} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <div>
          <label style={label}>First name *</label>
          <input name="firstName" defaultValue={child.firstName} style={input} />
        </div>
        <div>
          <label style={label}>Last name *</label>
          <input name="lastName" defaultValue={child.lastName} style={input} />
        </div>
        <div>
          <label style={label}>Age</label>
          <input name="age" inputMode="numeric" defaultValue={child.age ?? ''} style={input} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 14 }}>
        <div>
          <label style={label}>Guardian name *</label>
          <input name="guardianName" defaultValue={child.guardianName} style={input} />
        </div>
        <div>
          <label style={label}>Guardian phone *</label>
          <input name="guardianPhone" defaultValue={child.guardianPhone} style={input} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={label}>Home address (admin-only)</label>
        <input name="homeAddress" defaultValue={child.homeAddress ?? ''} style={input} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={label}>Health details (health &amp; admin only)</label>
        <input name="healthDetails" defaultValue={child.healthDetails ?? ''} style={input} />
      </div>

      {state.error && (
        <div
          style={{
            marginTop: 16,
            background: '#FFF1F1',
            border: '1px solid #FFB3B8',
            borderLeft: '3px solid #DA1E28',
            padding: '10px 14px',
            fontSize: 13,
          }}
        >
          {state.error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            height: 40,
            padding: '0 24px',
            background: pending ? '#C6C6C6' : '#0F62FE',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            cursor: pending ? 'not-allowed' : 'pointer',
          }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <a
          href="/children"
          style={{
            height: 40,
            lineHeight: '40px',
            padding: '0 16px',
            border: '1px solid #8D8D8D',
            color: '#161616',
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
