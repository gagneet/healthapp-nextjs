/**
 * Care Plans API Route
 * Manages medical care plan operations with role-based access control
 * Business Logic: Only doctors can create care plans, patients can view their own
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling
} from "@/lib/api-response"
import { CarePlanSchema } from "@/lib/validations/healthcare"
import { z } from "zod"

/**
 * GET /api/care-plans
 * Retrieve care plans based on user role and permissions
 * Business Logic: Role-based filtering for healthcare data access
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
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
    sortBy: z.string().default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })

  const paginationResult = paginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    patientId: searchParams.get('patient_id') || undefined,
    doctorId: searchParams.get('doctor_id') || undefined,
    searchQuery: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, patientId, doctorId, searchQuery, status, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  try {
    let whereClause: any = {}

    // Business Logic: Role-based data access control
    switch (session.user.role) {
      case 'DOCTOR':
        // Doctors can see care plans for their patients
        whereClause.primary_doctor_id = session.user.profileId
        break
      case 'HSP':
        // HSPs can see care plans for patients they're treating
        whereClause.OR = [
          { primary_doctor_id: session.user.profileId },
          {
            patient: {
              patient_doctor_assignments: {
                some: {
                  doctor_id: session.user.profileId,
                  assignment_type: { in: ['secondary', 'consulting', 'specialist'] }
                }
              }
            }
          }
        ]
        break
      case 'PATIENT':
        // Patients can only see their own care plans
        whereClause.patient_id = session.user.profileId
        break
      case 'SYSTEM_ADMIN':
        // System admins can see all care plans
        break
      default:
        return createForbiddenResponse("Invalid role for care plan access")

    // Apply patient filter (for healthcare providers)
    if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
      whereClause.patient_id = patientId

    // Apply doctor filter (for admins)
    if (doctorId && session.user.role === 'SYSTEM_ADMIN') {
      whereClause.primary_doctor_id = doctorId

    // Apply search filter
    if (searchQuery) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          plan_name: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          primary_diagnosis: { contains: searchQuery, mode: 'insensitive' }
        }
      ]

    // Apply status filter
    if (status) {
      whereClause.status = status.toUpperCase()

    // Get total count for pagination
    const total = await prisma.carePlan.count({ where: whereClause })

    // Fetch care plans with related data
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
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        doctors: {
          include: {
            users_doctors_user_idTousers: {
              select: {
                id: true,
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
        }
      }
    })

    // Return raw data for now
    const formattedCarePlans = carePlans

    return createSuccessResponse(
      formattedCarePlans,
      200,
      {
        page,
        limit,
        total
      }
    )
  } catch (error) {
    console.error("Failed to fetch care plans:", error)
    throw error
  }
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