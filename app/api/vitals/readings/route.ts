// app/api/vitals/readings/route.ts - Vital readings API
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
    const vitalId = searchParams.get('vital_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const alertLevel = searchParams.get('alert_level');

    let whereClause: any = {};
    
    if (patientId) {
      whereClause.patient_id = patientId;
    }
    
    if (vitalId) {
      whereClause.vital_id = vitalId;
    }
    
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    if (alertLevel) {
      whereClause.alert_level = alertLevel;
    }

    const readings = await prisma.vital_readings.findMany({
      where: whereClause,
      include: {
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
        },
        vital_types: {
          select: {
            name: true,
            unit: true,
            normal_range_min: true,
            normal_range_max: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 100
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { readings },
        message: 'Vital readings retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching vital readings:', error);
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

    const body = await request.json();
    const {
      patient_id,
      vital_type_id,
      value,
      systolic_value,
      diastolic_value,
      unit,
      notes,
      reading_date
    } = body;

    // Calculate alert level based on vital type and values
    const vitalType = await prisma.vital_types.findUnique({
      where: { id: vital_type_id }
    });

    let alertLevel = 'normal';
    if (vitalType) {
      const mainValue = systolic_value || value;
      if (mainValue) {
        if (vitalType.critical_min && mainValue <= vitalType.critical_min) {
          alertLevel = 'critical';
        } else if (vitalType.critical_max && mainValue >= vitalType.critical_max) {
          alertLevel = 'critical';
        } else if (vitalType.warning_min && mainValue <= vitalType.warning_min) {
          alertLevel = 'warning';
        } else if (vitalType.warning_max && mainValue >= vitalType.warning_max) {
          alertLevel = 'warning';
        }
      }
    }

    const reading = await prisma.vital_readings.create({
      data: {
        patient_id,
        vital_type_id,
        value: value ? parseFloat(value) : null,
        systolic_value: systolic_value ? parseFloat(systolic_value) : null,
        diastolic_value: diastolic_value ? parseFloat(diastolic_value) : null,
        unit,
        notes,
        alert_level: alertLevel as any,
        reading_date: reading_date ? new Date(reading_date) : new Date(),
        recorded_by: user.id,
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
        vital_types: {
          select: {
            name: true,
            unit: true
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { reading },
        message: 'Vital reading recorded successfully'
      }
    });
  } catch (error) {
    console.error('Error recording vital reading:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}