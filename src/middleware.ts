import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Protected routes
  const protectedPaths = ['/dashboard', '/admin', '/seller', '/buyer'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const decoded = verifyToken(token);
      
      // Check role-based access
      if (request.nextUrl.pathname.startsWith('/admin') && decoded.accountType !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      if (request.nextUrl.pathname.startsWith('/seller') && decoded.accountType !== 'business') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      if (request.nextUrl.pathname.startsWith('/buyer') && decoded.accountType !== 'consumer') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/seller/:path*', '/buyer/:path*']
};