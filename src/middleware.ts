import createMiddleware from 'next-intl/middleware';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'pt', 'emakua'],
  defaultLocale: 'pt'
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pattern for admin routes: /admin, /pt/admin, /en/admin, etc.
  const isAdminPath = pathname.match(/^\/(?:en|pt|emakua)\/admin/) || pathname.match(/^\/admin/);

  if (isAdminPath) {
    // Force Auth0 authentication for admin paths at the edge level
    // Note: Role check happens server-side in layout/API since edge can't reach SQLite
    return (withMiddlewareAuthRequired(async function(req) {
      return intlMiddleware(req);
    }) as any)(req, {});
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

