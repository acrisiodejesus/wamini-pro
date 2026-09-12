import createMiddleware from 'next-intl/middleware';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'pt', 'emakua'],
  defaultLocale: 'pt'
});

const isAuth0Configured = Boolean(
  process.env.AUTH0_SECRET &&
  process.env.AUTH0_CLIENT_ID &&
  process.env.AUTH0_ISSUER_BASE_URL
);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pattern for admin routes: /admin, /pt/admin, /en/admin, etc.
  const isAdminPath = pathname.match(/^\/(?:en|pt|emakua)\/admin/) || pathname.match(/^\/admin/);

  if (isAdminPath && isAuth0Configured) {
    try {
      // Force Auth0 authentication for admin paths at the edge level
      // Note: Role check happens server-side in layout/API since edge can't reach SQLite
      const authMiddleware = withMiddlewareAuthRequired(async function(req) {
        return intlMiddleware(req);
      });
      return await (authMiddleware as any)(req, {});
    } catch (err) {
      console.warn('[Middleware] Auth0 check error:', err);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

