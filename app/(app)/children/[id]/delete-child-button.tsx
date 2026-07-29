'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteChildAction, type ChildActionState } from '../actions';

export default function DeleteChildButton({ id }: { id: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ChildActionState, FormData>(deleteChildAction, {});

  useEffect(() => {
    if (state.ok) {
      router.push('/children');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Delete this child? This cannot be undone.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {state.error && (
        <div
          style={{
            marginBottom: 12,
            background: '#FFF1F1',
            border: '1px solid #FFB3B8',
            borderLeft: '3px solid #DA1E28',
            padding: '10px 14px',
            fontSize: 13,
            maxWidth: 520,
          }}
        >
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{
          height: 40,
          padding: '0 16px',
          background: 'transparent',
          border: '1px solid #DA1E28',
          color: '#DA1E28',
          fontSize: 14,
          cursor: pending ? 'not-allowed' : 'pointer',
        }}
      >
        {pending ? 'Deleting…' : 'Delete child'}
      </button>
    </form>
  );
}
