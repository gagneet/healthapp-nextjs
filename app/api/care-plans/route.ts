// app/api/care-plans/route.ts - Care plans management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const doctorId = searchParams.get('doctor_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    // Role-based access control
    if (user.role === 'PATIENT') {
      const patient = await prisma.patients.findFirst({
        where: { user_id: user.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patient_id = patient.id;
    } else if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: user.id }
      });
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
        }, { status: 403 });
      }
      whereClause.created_by = doctor.id;
    }

    // Additional filters
    if (patientId && ['DOCTOR', 'HSP', 'ADMIN'].includes(user.role)) {
      whereClause.patient_id = patientId;
    }
    
    if (doctorId && ['ADMIN', 'HSP'].includes(user.role)) {
      whereClause.created_by = doctorId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [carePlans, totalCount] = await Promise.all([
      prisma.care_plans.findMany({
        where: whereClause,
        include: {
          patients: {
            select: {
              id: true,
              patient_id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          },
          doctors: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true
                }
              },
              specialities: {
                select: {
                  name: true
                }
              }
            }
          },
          medications: {
            select: {
              id: true,
              medicine_name: true,
              dosage: true,
              frequency: true,
              status: true
            }
          },
          vitals: {
            select: {
              id: true,
              description: true,
              vital_templates: {
                select: {
                  name: true,
                  unit: true
                }
              }
            }
          },
          _count: {
            select: {
              medications: true,
              vitals: true,
              appointments: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.care_plans.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          care_plans: carePlans,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Care plans retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching care plans:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    // Only doctors and HSPs can create care plans
    if (!['DOCTOR', 'HSP'].includes(user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can create care plans' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      patient_id,
      title,
      description,
      start_date,
      end_date,
      goals,
      status,
      priority,
      care_team_notes
    } = body;

    // Get doctor ID
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: user.id }
    });

    if (!doctor && user.role === 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
      }, { status: 403 });
    }

    const carePlan = await prisma.care_plans.create({
      data: {
        patient_id,
        created_by: doctor?.id || user.id,
        title,
        description,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        goals: goals || [],
        status: status || 'active',
        priority: priority || 'medium',
        care_team_notes,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        patients: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        doctors: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { care_plan: carePlan },
        message: 'Care plan created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating care plan:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, goals, status, priority, care_team_notes, end_date } = body;

    // Get existing care plan to verify permissions
    const existingPlan = await prisma.care_plans.findUnique({
      where: { id },
      include: {
        doctors: { select: { user_id: true } }
      }
    });

    if (!existingPlan) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Care plan not found' } }
      }, { status: 404 });
    }

    // Check permissions - only creator or admin can modify
    const canModify = 
      user.role === 'ADMIN' ||
      (user.role === 'DOCTOR' && existingPlan.doctors?.user_id === user.id) ||
      user.role === 'HSP';

    if (!canModify) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Cannot modify this care plan' } }
      }, { status: 403 });
    }

    const updatedCarePlan = await prisma.care_plans.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(goals && { goals }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(care_team_notes && { care_team_notes }),
        ...(end_date && { end_date: new Date(end_date) }),
        updated_at: new Date()
      },
      include: {
        patients: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        doctors: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        _count: {
          select: {
            medications: true,
            vitals: true,
            appointments: true
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { care_plan: updatedCarePlan },
        message: 'Care plan updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating care plan:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}