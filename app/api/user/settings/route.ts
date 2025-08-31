import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/settings
 * Get current user's settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id || typeof session.user.id !== 'string') {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Get user with current settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        timezone: true,
        locale: true,
        preferences: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    // Parse preferences or use defaults
    const preferences = user.preferences as any || {};
    const defaultSettings = {
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        appointmentReminders: true,
        medicationAlerts: true,
        systemUpdates: false
      },
      privacy: {
        profileVisibility: 'colleagues_only',
        showOnlineStatus: true,
        allowPatientMessaging: true
      },
      preferences: {
        language: user.locale || 'en',
        timezone: user.timezone || 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        defaultConsultationDuration: 30
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled || false,
        loginNotifications: true,
        sessionTimeout: 24
      }
    };

    // Merge with user's actual preferences
    const mergedSettings = {
      notifications: { ...defaultSettings.notifications, ...preferences.notifications },
      privacy: { ...defaultSettings.privacy, ...preferences.privacy },
      preferences: { ...defaultSettings.preferences, ...preferences.preferences },
      security: { ...defaultSettings.security, ...preferences.security }
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          settings: mergedSettings
        },
        message: 'Settings retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * PUT /api/user/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id || typeof session.user.id !== 'string') {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const body = await request.json();

    // Validate the settings structure
    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Settings object is required' } }
      }, { status: 400 });
    }

    // Get current user preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true, timezone: true, locale: true }
    });

    if (!currentUser) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    // Merge new settings with existing preferences
    const currentPreferences = currentUser.preferences as any || {};
    const updatedPreferences = {
      ...currentPreferences,
      notifications: body.settings.notifications || currentPreferences.notifications,
      privacy: body.settings.privacy || currentPreferences.privacy,
      preferences: body.settings.preferences || currentPreferences.preferences,
      security: body.settings.security || currentPreferences.security
    };

    // Extract timezone and locale from preferences for database fields
    const timezone = body.settings.preferences?.timezone || currentUser.timezone;
    const locale = body.settings.preferences?.language || currentUser.locale;
    const twoFactorEnabled = body.settings.security?.twoFactorEnabled !== undefined 
      ? body.settings.security.twoFactorEnabled 
      : currentPreferences.security?.twoFactorEnabled;

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: updatedPreferences,
        timezone: timezone,
        locale: locale,
        ...(twoFactorEnabled !== undefined && { twoFactorEnabled: twoFactorEnabled }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          message: 'Settings updated successfully',
          settings: updatedPreferences
        },
        message: 'Settings updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * POST /api/user/settings/password
 * Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id || typeof session.user.id !== 'string') {
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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(body.currentPassword, user.passwordHash);
    
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
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
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