import { signOutAction } from '@/lib/auth-actions';

// Server-action sign-out (clears cookies on the server response — see B-017).
export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        style={{
          height: 40,
          padding: '0 16px',
          background: 'transparent',
          border: '1px solid #0F62FE',
          color: '#0F62FE',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </form>
  );
}
