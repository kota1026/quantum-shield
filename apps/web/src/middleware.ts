import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

const API_SERVER = process.env.API_SERVER_URL || 'http://localhost:8080';

export default async function middleware(request: NextRequest) {
  // Proxy /api/proxy/* requests to the backend API server
  if (request.nextUrl.pathname.startsWith('/api/proxy/')) {
    const backendPath = request.nextUrl.pathname.replace('/api/proxy', '');
    const targetUrl = `${API_SERVER}${backendPath}${request.nextUrl.search}`;
    return NextResponse.rewrite(targetUrl);
  }

  // All other routes: i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match:
  // - /api/proxy/* (API proxy)
  // - All pathnames except API routes, _next, public files (i18n)
  matcher: ['/api/proxy/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
