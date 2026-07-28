'use client';

import { createAuthClient } from '@neondatabase/auth/next';

/** Client-side Neon Auth (sign-in form, sign-out, useSession, ...). */
export const authClient = createAuthClient();
