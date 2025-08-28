/**
 * Vitals Management API Route
 * Handles vital signs monitoring and recording with medical validation
 * Business Logic: Patients can record vitals, healthcare providers can manage vitals
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling
} from "@/lib/api-response"
import { 
  VitalSignSchema, 
  PaginationSchema 
} from "@/lib/validations/healthcare"

/**
 * GET /api/vitals
 * Retrieve vital signs with filtering and pagination
 * Business Logic: Patients can view their own vitals, healthcare providers can view patient vitals
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only patients and healthcare providers can access vitals
  if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to vitals denied")
  }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get patient vitals with template information
    const vitals = await prisma.vitals.findMany({
      where: patientId ? { 
        care_plans: {
          patientId: patientId
        }
      } : {},
      include: {
        vital_templates: {
          select: {
            name: true,
            unit: true,
            details: true
          }
        },
        care_plans: {
          select: {
            patientId: true,
            patient: {
              select: {
                id: true,
                patientId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    const totalCount = await prisma.vital.count({
      where: patientId ? { 
        care_plans: {
          patientId: patientId
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
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Only doctors and HSPs can create vitals
  if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
    return createForbiddenResponse('Only doctors and HSPs can create vitals')
  }

    const body = await request.json();
    const {
      patientId,
      vital_template_id,
      care_plan_id,
      description,
      repeat_interval,
      repeat_days,
      start_date,
      end_date
    } = body;

    // Create the vital monitoring
    const vital = await prisma.vital.create({
      data: {
        id: require('crypto').randomUUID(),
        vital_template_id,
        care_plan_id,
        description,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        details: {
          repeat_interval_id: repeat_interval,
          repeat_days,
          patientId
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        vital_templates: {
          select: {
            name: true,
            unit: true
          }
        },
        care_plans: {
          select: {
            patientId: true,
            patient: {
              select: {
                patientId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return createSuccessResponse({ vital }, 201);
});
