import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

const authMiddleware = auth.middleware({ loginUrl: '/sign-in' });

// Guard page NAVIGATIONS (GET) only: redirect unauthenticated users to /sign-in.
// Server-action / form / API POSTs pass through here — running the auth middleware
// on those POSTs broke Server Actions ("page couldn't load"). Auth on those is still
// enforced inside the actions/handlers themselves via requireStaff/requireRole.
export default function middleware(req: NextRequest) {
  if (req.method !== 'GET') return NextResponse.next();
  // The root path is the public marketing landing — the page itself redirects
  // signed-in users to their home, so it must not be gated by auth here.
  if (req.nextUrl.pathname === '/') return NextResponse.next();
  return authMiddleware(req);
}

export const config = {
  // Run on everything except the auth API, the sign-in page, and static assets.
  matcher: ['/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)'],
};
