// app/api/appointments/route.ts - Appointments management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const doctorId = searchParams.get('doctor_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    // Role-based filtering
    if (user!.role === 'PATIENT') {
      // Patients can only see their own appointments
      const patient = await prisma.Patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patient_id = patient.id;
    } else if (user!.role === 'DOCTOR') {
      // Doctors can only see their own appointments
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: user!.id }
      });
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
        }, { status: 403 });
      }
      whereClause.doctor_id = doctor.id;
    }

    // Additional filters
    if (patientId && ['DOCTOR', 'HSP', 'ADMIN'].includes(user!.role)) {
      whereClause.patient_id = patientId;
    }
    
    if (doctorId && ['ADMIN', 'HSP'].includes(user!.role)) {
      whereClause.doctor_id = doctorId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.start_time = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [appointments, totalCount] = await Promise.all([
      prisma.Appointment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              patient_id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          doctor: {
            select: {
              id: true,
              users_doctors_user_idTousers: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              },
              specialities: {
                select: {
                  name: true
                }
              }
            }
          },
          appointment_slots: {
            select: {
              start_time: true,
              end_time: true,
              slot_type: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { start_time: 'desc' }
      }),
      prisma.Appointment.count({ where: whereClause })
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
      patient_id,
      doctor_id,
      start_time,
      end_time,
      appointment_type = 'CONSULTATION',
      slot_id,
      notes
    } = body;

    // Validate user permissions
    if (user!.role === 'PATIENT') {
      const patient = await prisma.Patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient || patient.id !== patient_id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only book appointments for yourself' } }
        }, { status: 403 });
      }
    }

    // Check if slot is available
    if (slot_id) {
      const slot = await prisma.appointment_slots.findUnique({
        where: { id: slot_id }
      });
      
      if (!slot || slot.is_booked) {
        return NextResponse.json({
          status: false,
          statusCode: 409,
          payload: { error: { status: 'conflict', message: 'Time slot is not available' } }
        }, { status: 409 });
      }
    }

    const appointment = await prisma.Appointment.create({
      data: {
        patient_id,
        doctor_id,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        appointment_type,
        status: 'SCHEDULED',
        notes: notes || '',
        slot_id
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        doctor: {
          select: {
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Mark slot as booked if slot_id was provided
    if (slot_id) {
      await prisma.appointment_slots.update({
        where: { id: slot_id },
        data: { is_booked: true }
      });
    }

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { appointment },
        message: 'Appointment booked successfully'
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
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
    const { id, status, notes, start_time, end_time } = body;

    if (!id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'error', message: 'Appointment ID is required' } }
      }, { status: 400 });
    }

    // Check if user can update this appointment
    const appointment = await prisma.Appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true
      }
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
      const patient = await prisma.Patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient || appointment.patient_id !== patient.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update your own appointments' } }
        }, { status: 403 });
      }
    } else if (user!.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: user!.id }
      });
      if (!doctor || appointment.doctor_id !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update your own appointments' } }
        }, { status: 403 });
      }
    }

    const updatedAppointment = await prisma.Appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(start_time && { start_time: new Date(start_time) }),
        ...(end_time && { end_time: new Date(end_time) }),
        updated_at: new Date()
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        doctor: {
          select: {
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true,
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
