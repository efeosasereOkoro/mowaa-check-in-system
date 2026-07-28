import { auth } from '@/lib/auth/server';

// Protect every app route: unauthenticated requests are redirected to /sign-in.
export default auth.middleware({ loginUrl: '/sign-in' });

export const config = {
  // Run on everything except the auth API, the sign-in page, and static assets.
  matcher: ['/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)'],
};
