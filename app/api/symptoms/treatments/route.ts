/**
 * Treatments Management API Route
 * Provides access to treatments database for healthcare decision support
 * Business Logic: Healthcare providers can access treatments database for clinical support
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

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  sortBy: z.string().default('treatmentName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/symptoms/treatments
 * Retrieve all treatments from the database
 * Business Logic: Healthcare providers can access treatments for clinical decision support
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can access treatments database
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to treatments database denied")
  }

  const { searchParams } = new URL(request.url)
  const paginationResult = PaginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
    sortBy: searchParams.get('sortBy') || 'treatmentName',
    sortOrder: searchParams.get('sortOrder') || 'asc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  // Additional filters
  const treatmentType = searchParams.get('treatmentType')
  const category = searchParams.get('category')
  const severityLevel = searchParams.get('severityLevel')

  let whereClause: any = {
    isActive: true
  }

  if (treatmentType) {
    whereClause.treatmentType = { contains: treatmentType, mode: 'insensitive' }
  }

  if (category) {
    whereClause.category = { contains: category, mode: 'insensitive' }
  }

  if (severityLevel) {
    whereClause.severityLevel = { contains: severityLevel, mode: 'insensitive' }
  }

  try {
    // Get total count for pagination
    const total = await prisma.treatmentDatabase.count({ where: whereClause })

    // Fetch treatments
    const treatments = await prisma.treatmentDatabase.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        treatmentName: true,
        treatmentType: true,
        description: true,
        applicableConditions: true,
        duration: true,
        frequency: true,
        dosageInfo: true,
        category: true,
        severityLevel: true,
        contraindications: true,
        sideEffects: true,
        createdAt: true
      }
    })

    const formattedTreatments = treatments.map(treatment => ({
      id: treatment.id,
      name: treatment.treatmentName,
      type: treatment.treatmentType,
      description: treatment.description,
      applicableConditions: treatment.applicableConditions || [],
      duration: treatment.duration,
      frequency: treatment.frequency,
      dosageInfo: treatment.dosageInfo || {},
      category: treatment.category,
      severityLevel: treatment.severityLevel,
      contraindications: treatment.contraindications || [],
      sideEffects: treatment.sideEffects || [],
      conditionCount: Array.isArray(treatment.applicableConditions) ? treatment.applicableConditions.length : 0,
      createdAt: treatment.createdAt
    }))

    return createSuccessResponse({
      treatments: formattedTreatments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      metadata: {
        treatmentType,
        category,
        severityLevel,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Treatments retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})