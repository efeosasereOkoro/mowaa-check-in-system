'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

/**
 * Server-side sign-out: runs `auth.signOut()` in the request context so the
 * response clears the session cookies (the client-only sign-out left a stale
 * cached session — B-017), then sends the user to the sign-in page.
 */
export async function signOutAction() {
  try {
    await auth.signOut();
  } catch {
    // Ignore — we redirect to sign-in regardless.
  }
  redirect('/sign-in');
}
