// app/api/admin/doctors/[id]/route.ts - Individual doctor management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            fullName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            accountStatus: true,
            emailVerified: true,
            profilePictureUrl: true
          }
        },
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
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor not found' } }
      }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { doctor },
        message: 'Doctor retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

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

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      mobileNumber,
      gender,
      speciality_id,
      medical_license_number,
      years_of_experience,
      qualification_details,
      organization_id,
      consultation_fee,
      is_verified,
      account_status
    } = body;

    // Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingDoctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor not found' } }
      }, { status: 404 });
    }

    // Check for medical license number conflicts if being changed
    if (medical_license_number && medical_license_number !== existingDoctor.medicalLicenseNumber) {
      const licenseConflict = await prisma.doctor.findFirst({
        where: { 
          medicalLicenseNumber: medical_license_number,
          id: { not: params.id }
        }
      });

      if (licenseConflict) {
        return NextResponse.json({
          status: false,
          statusCode: 409,
          payload: { error: { status: 'conflict', message: 'Medical license number already exists' } }
        }, { status: 409 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user information
      const userUpdates: any = {};
      if (firstName !== undefined) {
        userUpdates.firstName = firstName;
      }
      if (lastName !== undefined) {
        userUpdates.lastName = lastName;
      }
      if (firstName !== undefined || lastName !== undefined) {
        const newFirstName = firstName !== undefined ? firstName : existingDoctor.user.firstName;
        const newLastName = lastName !== undefined ? lastName : existingDoctor.user.lastName;
        userUpdates.fullName = `${newFirstName} ${newLastName}`.trim();
        userUpdates.name = userUpdates.fullName;
      }
      if (mobileNumber !== undefined) {
        userUpdates.phone = mobileNumber;
      }
      if (gender !== undefined) {
        userUpdates.gender = gender;
      }
      if (account_status !== undefined) {
        userUpdates.accountStatus = account_status;
      }
      userUpdates.updatedAt = new Date();

      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: existingDoctor.userId },
          data: userUpdates
        });
      }

      // Update doctor information
      const doctorUpdates: any = {};
      if (speciality_id !== undefined) {
        doctorUpdates.specialtyId = speciality_id;
      }
      if (medical_license_number !== undefined) {
        doctorUpdates.medicalLicenseNumber = medical_license_number;
      }
      if (years_of_experience !== undefined) {
        doctorUpdates.yearsOfExperience = years_of_experience;
      }
      if (qualification_details !== undefined) {
        doctorUpdates.qualificationDetails = qualification_details;
      }
      if (organization_id !== undefined) {
        doctorUpdates.organizationId = organization_id;
      }
      if (consultation_fee !== undefined) {
        doctorUpdates.consultationFee = consultation_fee;
      }
      if (mobileNumber !== undefined) {
        doctorUpdates.mobileNumber = mobileNumber;
      }
      if (gender !== undefined) {
        doctorUpdates.gender = gender;
      }
      if (is_verified !== undefined) {
        doctorUpdates.isVerified = is_verified;
      }
      doctorUpdates.updatedAt = new Date();

      const updatedDoctor = await tx.doctor.update({
        where: { id: params.id },
        data: doctorUpdates,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              fullName: true,
              phone: true,
              accountStatus: true
            }
          },
          specialty: {
            select: {
              name: true,
              description: true
            }
          }
        }
      });

      return updatedDoctor;
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { doctor: result },
        message: 'Doctor updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

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

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    // Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingDoctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor not found' } }
      }, { status: 404 });
    }

    // Check if doctor has active assignments or appointments
    const [activeAssignments, activeAppointments] = await Promise.all([
      prisma.patientDoctorAssignment.count({
        where: { 
          doctorId: params.id,
          isActive: true
        }
      }),
      prisma.appointment.count({
        where: { 
          doctorId: params.id,
          status: { in: ['SCHEDULED'] }
        }
      })
    ]);

    if (activeAssignments > 0 || activeAppointments > 0) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { 
          error: { 
            status: 'conflict', 
            message: `Cannot delete doctor with active assignments (${activeAssignments}) or upcoming appointments (${activeAppointments})` 
          } 
        }
      }, { status: 409 });
    }

    // Soft delete - set account as inactive instead of hard delete
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingDoctor.userId },
        data: { 
          accountStatus: 'SUSPENDED',
          updatedAt: new Date()
        }
      });

      await tx.doctor.update({
        where: { id: params.id },
        data: { 
          isVerified: false,
          updatedAt: new Date()
        }
      });
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: 'Doctor account deactivated successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}