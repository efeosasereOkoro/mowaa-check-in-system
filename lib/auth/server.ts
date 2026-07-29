import { createNeonAuth } from '@neondatabase/auth/next/server';

/**
 * Server-side Neon Auth instance (Managed Better Auth).
 * Single entry point for: the API handler, route-protection middleware, and
 * server-side session/auth methods (getSession, signIn, signOut, ...).
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    // Short session-data cache so revocations/sign-outs reflect quickly — important
    // for shared reception devices (default is 300s). See B-017.
    sessionDataTtl: 30,
  },
});
