import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/user/sessions/[id]
 * Revoke a specific session
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const { id: sessionId } = params;

    // Verify session belongs to current user
    const targetSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id
      }
    });

    if (!targetSession) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Session not found or access denied' } }
      }, { status: 404 });
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: 'Session revoked successfully'
      }
    });

  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}