// app/api/admin/users/[id]/route.ts - Individual user management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Get specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only system admins can view any user, others can only view themselves
    const userId = params.id;
    if (session.user.role !== 'SYSTEM_ADMIN' && session.user.id !== userId) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Access denied' } }
      }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        // Auth.js v5 fields
        name: true,
        image: true,
        email_verified_at: true,
        // Legacy fields
        first_name: true,
        last_name: true,
        full_name: true,
        phone: true,
        date_of_birth: true,
        gender: true,
        role: true,
        account_status: true,
        email_verified: true,
        profile_picture_url: true,
        created_at: true,
        updated_at: true,
        last_login_at: true,
        // Relations with detailed info
        doctors: {
          select: {
            id: true,
            doctor_id: true,
            medical_license_number: true,
            years_of_experience: true,
            qualification_details: true,
            consultation_fee: true,
            mobile_number: true,
            specialities: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            organizations: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            _count: {
              select: {
                doctor_assignments: true,
                appointments: true
              }
            }
          }
        },
        patients: {
          select: {
            id: true,
            patient_id: true,
            medical_record_number: true,
            height_cm: true,
            weight_kg: true,
            blood_type: true,
            allergies: true,
            medical_history: true,
            emergency_contacts: true,
            doctors: {
              select: {
                id: true,
                doctor_id: true,
                users_doctors_user_idTousers: {
                  select: {
                    name: true,
                    first_name: true,
                    last_name: true
                  }
                },
                specialities: {
                  select: { name: true }
                }
              }
            },
            _count: {
              select: {
                care_plans: true,
                appointments: true,
                medications: true,
                vitals: true
              }
            }
          }
        },
        hsps: {
          select: {
            id: true,
            hsp_id: true,
            qualification: true,
            license_number: true,
            years_of_experience: true,
            consultation_fee: true,
            mobile_number: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { user },
        message: 'User retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();
    const {
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      role,
      account_status,
      password // Optional password update
    } = body;

    // Permission check
    if (session.user.role !== 'SYSTEM_ADMIN' && session.user.id !== userId) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Access denied' } }
      }, { status: 403 });
    }

    // Non-admins can only update their own basic info, not role/status
    if (session.user.id === userId && session.user.role !== 'SYSTEM_ADMIN') {
      if (role !== undefined || account_status !== undefined) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Cannot update role or account status' } }
        }, { status: 403 });
      }
    }

    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    if (first_name !== undefined) {
      updateData.first_name = first_name;
      // Update Auth.js v5 name field if both first_name and last_name available
      const newLastName = last_name !== undefined ? last_name : existingUser.last_name;
      if (newLastName) {
        updateData.name = `${first_name} ${newLastName}`.trim();
        updateData.full_name = `${first_name} ${newLastName}`.trim();
      }
    }

    if (last_name !== undefined) {
      updateData.last_name = last_name;
      // Update Auth.js v5 name field if both first_name and last_name available
      const newFirstName = first_name !== undefined ? first_name : existingUser.first_name;
      if (newFirstName) {
        updateData.name = `${newFirstName} ${last_name}`.trim();
        updateData.full_name = `${newFirstName} ${last_name}`.trim();
      }
    }

    if (phone !== undefined) updateData.phone = phone;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
    if (gender !== undefined) updateData.gender = gender;
    
    // Admin-only fields
    if (session.user.role === 'SYSTEM_ADMIN') {
      if (role !== undefined) updateData.role = role;
      if (account_status !== undefined) updateData.account_status = account_status;
    }

    // Password update
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        first_name: true,
        last_name: true,
        phone: true,
        date_of_birth: true,
        gender: true,
        role: true,
        account_status: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { user: updatedUser },
        message: 'User updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Deactivate user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only system admins can deactivate users
    if (session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'System admin access required' } }
      }, { status: 403 });
    }

    const userId = params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'User not found' } }
      }, { status: 404 });
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Cannot deactivate your own account' } }
      }, { status: 400 });
    }

    // Soft delete - deactivate user
    await prisma.user.update({
      where: { id: userId },
      data: {
        account_status: 'INACTIVE',
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { user_id: userId },
        message: 'User deactivated successfully'
      }
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}