// app/api/admin/users/[id]/route.ts - Individual user management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
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
        name: true,
        image: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        accountStatus: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // Relations with detailed info
        doctorProfile: {
          select: {
            id: true,
            doctorId: true,
            medicalLicenseNumber: true,
            yearsOfExperience: true,
            qualificationDetails: true,
            consultationFee: true,
            mobileNumber: true,
            specialty: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            organization: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            _count: {
              select: {
                doctorAssignments: true,
                appointments: true
              }
            }
          }
        },
        patientProfile: {
          select: {
            id: true,
            patientId: true,
            medicalRecordNumber: true,
            heightCm: true,
            weightKg: true,
            bloodType: true,
            allergies: true,
            medicalHistory: true,
            emergencyContacts: true,
            primaryCareDoctor: {
              select: {
                id: true,
                doctorId: true,
                user: {
                  select: {
                    name: true,
                    firstName: true,
                    lastName: true
                  }
                },
                specialty: {
                  select: { name: true }
                }
              }
            },
            _count: {
              select: {
                carePlans: true,
                appointments: true,
                medicationLogs: true,
                vitalReadings: true
              }
            }
          }
        },
        hspProfile: {
          select: {
            id: true,
            hspId: true,
            certifications: true,
            licenseNumber: true,
            yearsOfExperience: true,
            hourlyRate: true,
            departments: true
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
      updatedAt: new Date()
    };

    if (first_name !== undefined) {
      updateData.firstName = first_name;
      const newLastName = last_name !== undefined ? last_name : existingUser.lastName;
      if (newLastName) {
        updateData.name = `${first_name} ${newLastName}`.trim();
        updateData.fullName = `${first_name} ${newLastName}`.trim();
      }
    }

    if (last_name !== undefined) {
      updateData.lastName = last_name;
      const newFirstName = first_name !== undefined ? first_name : existingUser.firstName;
      if (newFirstName) {
        updateData.name = `${newFirstName} ${last_name}`.trim();
        updateData.fullName = `${newFirstName} ${last_name}`.trim();
      }
    }

    if (phone !== undefined) updateData.phone = phone;
    if (date_of_birth !== undefined) updateData.dateOfBirth = date_of_birth ? new Date(date_of_birth) : null;
    if (gender !== undefined) updateData.gender = gender;
    
    // Admin-only fields
    if (session.user.role === 'SYSTEM_ADMIN') {
      if (role !== undefined) updateData.role = role;
      if (account_status !== undefined) updateData.accountStatus = account_status;
    }

    // Password update
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        accountStatus: true,
        updatedAt: true
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
        accountStatus: 'INACTIVE',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { userId: userId },
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
