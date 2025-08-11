/**
 * Next.js Middleware for Healthcare Management Platform
 * 
 * This middleware handles authentication, authorization, and security
 * for the entire application using Next.js 14 App Router patterns.
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to avoid webpack issues
let jwt: any = null;

async function initializeJWT() {
  if (!jwt) {
    jwt = (await import('jsonwebtoken')).default;
  }
  return jwt;
}

/**
 * Extract and verify JWT token
 */
async function verifyToken(request: NextRequest): Promise<any> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const jwtLib = await initializeJWT();
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwtLib.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
function hasRole(user: any, allowedRoles: string[]): boolean {
  if (!user || !user.role) {
    return false;
  }
  
  return allowedRoles.includes(user.role) || allowedRoles.includes(user.category);
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/api/health'
  ) {
    return NextResponse.next();
  }

  // Handle authentication for protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    // Skip auth routes and public API routes
    if (
      pathname.startsWith('/api/auth') ||
      pathname === '/api' ||
      pathname === '/api/health'
    ) {
      return NextResponse.next();
    }

    // Verify authentication for protected routes
    const user = await verifyToken(request);
    if (!user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            status: false,
            statusCode: 401,
            payload: {
              error: {
                status: 'error',
                message: 'Authentication required'
              }
            }
          },
          { status: 401 }
        );
      } else {
        // Redirect to login for dashboard routes
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // Role-based authorization for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const role = user.role || user.category;
      
      // Admin routes
      if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // Doctor routes
      if (pathname.startsWith('/dashboard/doctor') && !['DOCTOR', 'admin'].includes(role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // Patient routes
      if (pathname.startsWith('/dashboard/patient') && !['PATIENT', 'DOCTOR', 'admin'].includes(role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // Hospital/HSP routes
      if (pathname.startsWith('/dashboard/hospital') && !['HSP', 'DOCTOR', 'admin'].includes(role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // API route authorization
    if (pathname.startsWith('/api/')) {
      const role = user.role || user.category;
      
      // Admin-only API routes
      if (pathname.startsWith('/api/admin') && role !== 'admin') {
        return NextResponse.json(
          {
            status: false,
            statusCode: 403,
            payload: {
              error: {
                status: 'error',
                message: 'Admin access required'
              }
            }
          },
          { status: 403 }
        );
      }
      
      // Healthcare provider routes (doctors/HSPs)
      if (
        (pathname.startsWith('/api/doctors') || pathname.startsWith('/api/medications')) &&
        !['DOCTOR', 'HSP', 'admin'].includes(role)
      ) {
        return NextResponse.json(
          {
            status: false,
            statusCode: 403,
            payload: {
              error: {
                status: 'error',
                message: 'Healthcare provider access required'
              }
            }
          },
          { status: 403 }
        );
      }
    }

    // Add user info to request headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id || user.userId);
      requestHeaders.set('x-user-role', user.role || user.category);
      requestHeaders.set('x-user-email', user.email || '');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // Security headers for all responses
  const response = NextResponse.next();
  
  // HIPAA compliance security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
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