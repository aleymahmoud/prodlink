import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth', '/api/health'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login page
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
