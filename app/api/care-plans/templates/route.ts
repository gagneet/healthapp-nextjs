/**
 * Care Plan Templates API Route
 * Manages medical care plan template operations with role-based access control
 * Business Logic: Only doctors can create templates, role-based template access
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
 * GET /api/care-plans/templates
 * Retrieve care plan templates based on user role and speciality
 * Business Logic: Role-based filtering for healthcare templates
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
    specialityId: z.string().optional(),
    searchQuery: z.string().optional(),
    diagnosisCategory: z.string().optional(),
    sortBy: z.string().default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })

  const paginationResult = paginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    specialityId: searchParams.get('speciality_id') || undefined,
    searchQuery: searchParams.get('search') || undefined,
    diagnosisCategory: searchParams.get('diagnosis_category') || undefined,
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, specialityId, searchQuery, diagnosisCategory, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  let whereClause: any = {
      is_active: true // Only show active templates
    }

    // Business Logic: Role-based access to templates
    if (session.user.role === 'DOCTOR') {
      // Doctors can see templates for their speciality or general templates
      const doctor = await prisma.doctors.findUnique({
        where: { id: session.user.profileId! },
        select: { speciality_id: true }
      })

      if (doctor?.speciality_id) {
        whereClause.OR = [
          { speciality_id: doctor.speciality_id },
          { speciality_id: null } // General templates
        ]
      }
    } else if (session.user.role === 'HSP') {
      // HSPs can see general templates only
      whereClause.speciality_id = null
    }
    // System admins can see all templates (no additional restrictions)

    // Apply speciality filter (for admins)
    if (specialityId && session.user.role === 'SYSTEM_ADMIN') {
      whereClause.speciality_id = parseInt(specialityId)
    }

    // Apply search filter
    if (searchQuery) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          name: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          description: { contains: searchQuery, mode: 'insensitive' }
        }
      ]
    }

    // Apply diagnosis category filter
    if (diagnosisCategory) {
      whereClause.conditions = {
        has: diagnosisCategory
      }
    }

    // Get total count for pagination
    const total = await prisma.care_plan_templates.count({ where: whereClause })

    // Fetch templates
    const templates = await prisma.care_plan_templates.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      }
    })

    // Return raw data for now
    const formattedTemplates = templates

    return createSuccessResponse(
      formattedTemplates,
      200,
      {
        page,
        limit,
        total
      }
    );
})

/**
 * POST /api/care-plans/templates
 * Create new care plan template
 * Business Logic: Only doctors can create templates
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  return NextResponse.json({ 
    status: false, 
    statusCode: 501, 
    payload: { error: { status: 'not_implemented', message: 'Template creation not yet implemented' } } 
  }, { status: 501 });
})

/**
 * PUT /api/care-plans/templates
 * Update care plan template
 * Business Logic: Only template creator or admins can update templates
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  return NextResponse.json({ 
    status: false, 
    statusCode: 501, 
    payload: { error: { status: 'not_implemented', message: 'Template updates not yet implemented' } } 
  }, { status: 501 });
})
