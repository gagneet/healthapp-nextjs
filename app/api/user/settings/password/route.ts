import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/settings/password
 * Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Current password and new password are required' } }
      }, { status: 400 });
    }

    // Validate password strength
    if (body.newPassword.length < 6) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'New password must be at least 6 characters long' } }
      }, { status: 400 });
    }

    // Get current user with password hash
    const user = await prisma.User.findUnique({
      where: { id: session.user.id },
      select: { id: true, password_hash: true }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(body.currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Current password is incorrect' } }
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(body.newPassword, saltRounds);

    // Update password
    await prisma.User.update({
      where: { id: session.user.id },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: 'Password changed successfully'
      }
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}