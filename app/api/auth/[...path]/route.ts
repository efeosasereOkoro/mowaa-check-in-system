import { auth } from '@/lib/auth/server';

// Neon Auth API handler — proxies client auth calls to the Neon Auth server.
export const { GET, POST } = auth.handler();
