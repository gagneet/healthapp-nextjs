/**
 * Diagnoses Management API Route
 * Provides access to diagnosis database for healthcare decision support
 * Business Logic: Healthcare providers can access diagnoses database for clinical support
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


export const dynamic = 'force-dynamic';

export const runtime = 'nodejs'

const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  sortBy: z.string().default('diagnosisName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

/**
 * GET /api/symptoms/diagnoses
 * Retrieve all diagnoses from the database
 * Business Logic: Healthcare providers can access diagnoses for clinical decision support
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can access diagnoses database
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to diagnoses database denied")
  }

  const { searchParams } = new URL(request.url)
  const paginationResult = PaginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
    sortBy: searchParams.get('sortBy') || 'diagnosisName',
    sortOrder: searchParams.get('sortOrder') || 'asc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  // Additional filters
  const category = searchParams.get('category')
  const ageGroup = searchParams.get('ageGroup')
  const gender = searchParams.get('gender')

  const whereClause: any = {
    isActive: true
  }

  if (category) {
    whereClause.category = { contains: category, mode: 'insensitive' }
  }

  if (gender && gender !== 'all') {
    whereClause.OR = [
      { genderSpecific: gender },
      { genderSpecific: null }
    ]
  }

  try {
    // Get total count for pagination
    const total = await prisma.symptomsDatabase.count({ where: whereClause })

    // Fetch diagnoses
    const diagnoses = await prisma.symptomsDatabase.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        diagnosisName: true,
        symptoms: true,
        category: true,
        severityIndicators: true,
        commonAgeGroups: true,
        genderSpecific: true,
        createdAt: true
      }
    })

    // Filter by age group if specified
    let filteredDiagnoses = diagnoses
    if (ageGroup) {
      filteredDiagnoses = diagnoses.filter(diagnosis => {
        if (!diagnosis.commonAgeGroups || !Array.isArray(diagnosis.commonAgeGroups)) {
          return true // Include diagnoses with no age restrictions
        }
        return diagnosis.commonAgeGroups.some((age: string) => 
          age.toLowerCase().includes(ageGroup.toLowerCase())
        )
      })
    }

    const formattedDiagnoses = filteredDiagnoses.map(diagnosis => ({
      id: diagnosis.id,
      name: diagnosis.diagnosisName,
      symptoms: diagnosis.symptoms || [],
      category: diagnosis.category,
      severityIndicators: diagnosis.severityIndicators || [],
      commonAgeGroups: diagnosis.commonAgeGroups || [],
      genderSpecific: diagnosis.genderSpecific,
      symptomCount: Array.isArray(diagnosis.symptoms) ? diagnosis.symptoms.length : 0,
      createdAt: diagnosis.createdAt
    }))

    return createSuccessResponse({
      diagnoses: formattedDiagnoses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      metadata: {
        category,
        ageGroup,
        gender,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Diagnoses retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})
