/**
 * Next.js Middleware for Healthcare Management Platform
 * Temporarily disabled to fix authentication redirect loop
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Temporarily disable middleware to fix authentication issues
  // Authentication will be handled by individual pages and API routes
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