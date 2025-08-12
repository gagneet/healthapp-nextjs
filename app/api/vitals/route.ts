// app/api/vitals/route.ts - Vitals management API
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get patient vitals with template information
    const vitals = await prisma.vitals.findMany({
      where: patientId ? { 
        care_plans: {
          patient_id: patientId
        }
      } : {},
      include: {
        vital_templates: {
          select: {
            name: true,
            unit: true,
            normal_range_min: true,
            normal_range_max: true,
            category: true
          }
        },
        care_plans: {
          select: {
            patient_id: true,
            patients: {
              select: {
                id: true,
                patient_id: true,
                user: {
                  select: {
                    first_name: true,
                    last_name: true
                  }
                }
              }
            }
          }
        },
        vital_readings: {
          orderBy: { created_at: 'desc' },
          take: 5,
          select: {
            value: true,
            systolic_value: true,
            diastolic_value: true,
            alert_level: true,
            created_at: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    const totalCount = await prisma.vitals.count({
      where: patientId ? { 
        care_plans: {
          patient_id: patientId
        }
      } : {}
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          vitals,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Vitals retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching vitals:', error);
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

    // Only doctors and HSPs can create vitals
    if (!['DOCTOR', 'HSP'].includes(user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can create vitals' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      patient_id,
      vital_template_id,
      care_plan_id,
      description,
      repeat_interval,
      repeat_days,
      start_date,
      end_date
    } = body;

    // Create the vital monitoring
    const vital = await prisma.vitals.create({
      data: {
        vital_template_id,
        care_plan_id,
        description,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        details: {
          repeat_interval_id: repeat_interval,
          repeat_days,
          patient_id
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        vital_templates: {
          select: {
            name: true,
            unit: true,
            category: true
          }
        },
        care_plans: {
          select: {
            patient_id: true,
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
            }
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { vital },
        message: 'Vital monitoring created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating vital:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}