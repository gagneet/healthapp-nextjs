/**
 * Custom Symptoms API Route
 * Allows healthcare providers to add custom symptoms to the database
 * Business Logic: Only doctors and system admins can add custom symptoms
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

const CustomSymptomSchema = z.object({
  symptomName: z.string().min(2, "Symptom name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  severityLevels: z.array(z.string()).optional().default(['MILD', 'MODERATE', 'SEVERE']),
  commonBodyLocations: z.array(z.string()).optional().default([]),
  associatedDiagnoses: z.array(z.string()).optional().default([]),
  commonTriggers: z.array(z.string()).optional().default([]),
  ageGroups: z.array(z.string()).optional().default([]),
  genderSpecific: z.enum(['MALE', 'FEMALE', 'BOTH']).optional().default('BOTH'),
  riskFactors: z.array(z.string()).optional().default([])
})

/**
 * POST /api/symptoms/custom
 * Add custom symptom to the symptoms database
 * Business Logic: Only doctors and system admins can add custom symptoms
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and system admins can add custom symptoms
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and system administrators can add custom symptoms")
  }

  const body = await request.json()
  const validationResult = CustomSymptomSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const customSymptom = validationResult.data

  try {
    // Check if symptom already exists
    const existingSymptom = await prisma.symptomsDatabase.findFirst({
      where: {
        OR: [
          { diagnosisName: { equals: customSymptom.symptomName, mode: 'insensitive' } },
          { symptoms: { has: customSymptom.symptomName } }
        ]
      }
    })

    if (existingSymptom) {
      return createErrorResponse(new Error("Symptom already exists in the database"))
    }

    // Create new custom symptom entry
    const newSymptom = await prisma.symptomsDatabase.create({
      data: {
        id: crypto.randomUUID(),
        diagnosisName: `Custom: ${customSymptom.symptomName}`,
        symptoms: [customSymptom.symptomName],
        category: customSymptom.category,
        severityIndicators: customSymptom.severityLevels,
        commonAgeGroups: customSymptom.ageGroups,
        genderSpecific: customSymptom.genderSpecific === 'BOTH' ? null : customSymptom.genderSpecific.toLowerCase(),
        isActive: true,
        createdBy: session.user.profileId,
        createdAt: new Date()
      }
    })

    // Log the creation for audit purposes
    console.log(`Custom symptom created: ${customSymptom.symptomName} by ${session.user.role} ${session.user.profileId}`)

    return createSuccessResponse({
      id: newSymptom.id,
      symptomName: customSymptom.symptomName,
      category: customSymptom.category,
      description: customSymptom.description,
      severityLevels: customSymptom.severityLevels,
      associatedDiagnoses: customSymptom.associatedDiagnoses,
      commonBodyLocations: customSymptom.commonBodyLocations,
      commonTriggers: customSymptom.commonTriggers,
      ageGroups: customSymptom.ageGroups,
      genderSpecific: customSymptom.genderSpecific,
      riskFactors: customSymptom.riskFactors,
      createdBy: session.user.profileId,
      createdAt: newSymptom.createdAt
    }, 201)

  } catch (error) {
    console.error('Custom symptom creation error:', error)
    return createErrorResponse(error as Error)
  }
})

/**
 * GET /api/symptoms/custom
 * Retrieve custom symptoms added by the organization
 * Business Logic: Healthcare providers can view custom symptoms
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Healthcare providers can view custom symptoms
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to custom symptoms denied")
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const category = searchParams.get('category')

  try {
    const customSymptoms = await prisma.symptomsDatabase.findMany({
      where: {
        AND: [
          { diagnosisName: { startsWith: 'Custom:' } },
          { isActive: true },
          ...(category ? [{ category: { contains: category, mode: 'insensitive' } }] : [])
        ]
      },
      take: limit,
      select: {
        id: true,
        diagnosisName: true,
        symptoms: true,
        category: true,
        severityIndicators: true,
        commonAgeGroups: true,
        genderSpecific: true,
        createdBy: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedSymptoms = customSymptoms.map(symptom => ({
      id: symptom.id,
      symptomName: symptom.diagnosisName?.replace('Custom: ', '') || '',
      category: symptom.category,
      severityLevels: symptom.severityIndicators,
      ageGroups: symptom.commonAgeGroups,
      genderSpecific: symptom.genderSpecific?.toUpperCase() || 'BOTH',
      createdBy: symptom.createdBy,
      createdAt: symptom.createdAt
    }))

    return createSuccessResponse({
      customSymptoms: formattedSymptoms,
      metadata: {
        total: formattedSymptoms.length,
        category,
        limit
      }
    })

  } catch (error) {
    console.error('Custom symptoms retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})