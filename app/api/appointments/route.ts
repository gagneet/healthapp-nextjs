// app/api/appointments/route.ts - Appointments management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated/prisma';


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    // Role-based filtering
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: user!.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patientId = patient.id;
    } else if (user!.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user!.id }
      });
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
        }, { status: 403 });
      }
      whereClause.doctorId = doctor.id;
    }

    // Additional filters
    if (patientId && ['DOCTOR', 'HSP', 'ADMIN'].includes(user!.role)) {
      whereClause.patientId = patientId;
    }
    
    if (doctorId && ['ADMIN', 'HSP'].includes(user!.role)) {
      whereClause.doctorId = doctorId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          doctor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specialty: {
                select: {
                  name: true
                }
              }
            }
          },
          appointmentSlot: {
            select: {
              startTime: true,
              endTime: true,
              slotType: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { startTime: 'desc' }
      }),
      prisma.appointment.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          appointments,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Appointments retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();
    const {
      patientId,
      doctorId,
      startTime,
      endTime,
      appointmentType,
      notes,
      slotId,
    } = body;

    // Validate user permissions
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: user!.id }
      });
      if (!patient || patient.id !== patientId) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only book appointments for yourself' } }
        }, { status: 403 });
      }
    }

    // Use transaction to prevent race condition in slot booking
    const appointment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if slot is available within transaction
      if (slotId) {
        const slot = await tx.appointmentSlot.findUnique({
          where: { id: slotId }
        });
        
        if (!slot || slot.isAvailable === false || (slot.bookedAppointments || 0) >= (slot.maxAppointments || 1)) {
          throw new Error('Time slot is not available');
        }
        
        // Mark slot as booked immediately to prevent race condition
        await tx.appointmentSlot.update({
          where: { id: slotId },
          data: { bookedAppointments: { increment: 1 } }
        });
      }

      // Create appointment within the same transaction
      const newAppointment = await tx.appointment.create({
        data: {
          patientId: patientId,
          doctorId: doctorId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          appointmentType: appointmentType,
          notes: notes,
          status: 'SCHEDULED',
          slotId: slotId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          doctor: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      return newAppointment;
    }).catch((error) => {
      if (error.message === 'Time slot is not available') {
        throw { status: 409, message: 'Time slot is not available' };
      }
      throw error;
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { appointment },
        message: 'Appointment booked successfully'
      }
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    
    // Handle transaction-specific errors
    if (error.status === 409) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: error.message } }
      }, { status: 409 });
    }
    
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();
    const { id, status, notes, startTime, endTime } = body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'error', message: 'Valid appointment ID is required' } }
      }, { status: 400 });
    }

    // Check if user can update this appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'error', message: 'Appointment not found' } }
      }, { status: 404 });
    }

    // Permission checks
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: user!.id }
      });
      if (!patient || appointment.patientId !== patient.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update your own appointments' } }
        }, { status: 403 });
      }
    } else if (user!.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user!.id }
      });
      if (!doctor || appointment.doctorId !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update your own appointments' } }
        }, { status: 403 });
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { details: { ...(appointment.details as object || {}), notes } }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        doctor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { appointment: updatedAppointment },
        message: 'Appointment updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
