import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/sessions
 * Get current user's active sessions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Get all active sessions for this user from Auth.js Session table
    const sessions = await prisma.Session.findMany({
      where: {
        userId: session.user.id,
        expires: {
          gt: new Date() // Only non-expired sessions
        }
      },
      select: {
        id: true,
        sessionToken: true,
        expires: true,
        // Note: Auth.js doesn't store device info by default
        // We'd need to extend this with custom fields
      },
      orderBy: {
        expires: 'desc'
      }
    });

    // Transform to expected format
    const formattedSessions = sessions.map(sess => {
      // Get current session token from request cookies
      const currentSessionToken = request.cookies.get('next-auth.session-token')?.value || 
                                 request.cookies.get('__Secure-next-auth.session-token')?.value;
      
      return {
        sessionId: sess.id,
        createdAt: sess.expires, // Auth.js doesn't store creation time by default
        deviceInfo: {
          ip: 'Unknown', // Would need custom tracking
          userAgent: 'Unknown Browser' // Would need custom tracking
        },
        isCurrentSession: sess.sessionToken === currentSessionToken,
        expiresAt: sess.expires
      };
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          sessions: formattedSessions,
          total: formattedSessions.length
        },
        message: 'Sessions retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * DELETE /api/user/sessions
 * Revoke all sessions except current one (logout from all devices)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Get current session token
    const currentSessionToken = request.cookies.get('next-auth.session-token')?.value || 
                               request.cookies.get('__Secure-next-auth.session-token')?.value;

    // Delete all sessions except the current one
    const deleteResult = await prisma.Session.deleteMany({
      where: {
        userId: session.user.id,
        sessionToken: {
          not: currentSessionToken
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          revokedSessions: deleteResult.count
        },
        message: `Successfully logged out from ${deleteResult.count} devices`
      }
    });

  } catch (error) {
    console.error('Error revoking sessions:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}