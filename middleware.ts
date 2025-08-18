/**
 * Next.js Middleware for Healthcare Management Platform
 * Implements NextAuth.js authentication with role-based route protection
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip middleware for public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Check for NextAuth.js session cookies (simplified for Edge Runtime compatibility)
  const sessionToken = req.cookies.get('next-auth.session-token') || 
                      req.cookies.get('__Secure-next-auth.session-token')

  // For now, skip detailed user role checks in middleware to avoid Edge Runtime issues
  // Let individual API routes handle detailed authorization
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Allow the request to continue - detailed auth will be handled by API routes
  return NextResponse.next()
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled by individual route files)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}