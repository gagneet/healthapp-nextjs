/**
 * Care Plans API Route
 * Manages medical care plan operations with role-based access control
 * Business Logic: Only doctors can create care plans, patients can view their own
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
import { z } from "zod"

/**
 * GET /api/care-plans
 * Retrieve care plans based on user role and permissions
 * Business Logic: Role-based filtering for healthcare data access
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  
  // Pagination and filtering with validation
  const paginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    searchQuery: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })

  const paginationResult = paginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    patientId: searchParams.get('patient_id') || undefined,
    doctorId: searchParams.get('doctor_id') || undefined,
    searchQuery: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, patientId, doctorId, searchQuery, status, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  let whereClause: any = {}

    // Business Logic: Role-based data access control
    switch (session.user.role) {
      case 'DOCTOR':
        whereClause.createdByDoctorId = session.user.profileId
        break
      case 'HSP':
        whereClause.OR = [
          { createdByDoctorId: session.user.profileId },
          {
            patient: {
              patientDoctorAssignments: {
                some: {
                  doctorId: session.user.profileId,
                  assignmentType: { in: ['SECONDARY', 'CONSULTING', 'SPECIALIST'] }
                }
              }
            }
          }
        ]
        break
      case 'PATIENT':
        whereClause.patientId = session.user.profileId
        break
      case 'SYSTEM_ADMIN':
        break
      default:
        return createForbiddenResponse("Invalid role for care plan access")
    }

    if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
      whereClause.patientId = patientId
    }

    if (doctorId && session.user.role === 'SYSTEM_ADMIN') {
      whereClause.createdByDoctorId = doctorId
    }

    if (searchQuery) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          title: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          description: { contains: searchQuery, mode: 'insensitive' }
        }
      ]
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const total = await prisma.carePlan.count({ where: whereClause })

    const carePlans = await prisma.carePlan.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
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
        }
      }
    })

    const formattedCarePlans = carePlans

    return createSuccessResponse(
      formattedCarePlans,
      200,
      {
        page,
        limit,
        total
      }
    );
})

/**
 * POST /api/care-plans
 * Create new care plan with medical validation
 * Business Logic: Only doctors can create care plans
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  return NextResponse.json({ 
    status: false, 
    statusCode: 501, 
    payload: { error: { status: 'not_implemented', message: 'Care plan creation not yet implemented' } } 
  }, { status: 501 });
})

/**
 * PUT /api/care-plans
 * Update care plan information
 * Business Logic: Only care plan creator or admins can update care plans
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  return NextResponse.json({ 
    status: false, 
    statusCode: 501, 
    payload: { error: { status: 'not_implemented', message: 'Care plan updates not yet implemented' } } 
  }, { status: 501 });
})
