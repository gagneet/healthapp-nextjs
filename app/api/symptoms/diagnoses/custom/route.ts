/**
 * Custom Diagnoses API Route
 * Allows healthcare providers to add custom diagnoses to the database
 * Business Logic: Only doctors and system admins can add custom diagnoses
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

const CustomDiagnosisSchema = z.object({
  diagnosisName: z.string().min(3, "Diagnosis name must be at least 3 characters"),
  category: z.string().min(2, "Category is required"),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  severityIndicators: z.array(z.string()).optional().default(['MILD', 'MODERATE', 'SEVERE']),
  commonAgeGroups: z.array(z.string()).optional().default([]),
  genderSpecific: z.enum(['MALE', 'FEMALE', 'BOTH']).optional().default('BOTH'),
  riskFactors: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
  icd10Codes: z.array(z.string()).optional().default([]),
  treatmentSuggestions: z.array(z.string()).optional().default([])
})

/**
 * POST /api/symptoms/diagnoses/custom
 * Add custom diagnosis to the database
 * Business Logic: Only doctors and system admins can add custom diagnoses
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and system admins can add custom diagnoses
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and system administrators can add custom diagnoses")
  }

  const body = await request.json()
  const validationResult = CustomDiagnosisSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const customDiagnosis = validationResult.data

  try {
    // Check if diagnosis already exists
    const existingDiagnosis = await prisma.symptomsDatabase.findFirst({
      where: {
        diagnosisName: { equals: customDiagnosis.diagnosisName, mode: 'insensitive' }
      }
    })

    if (existingDiagnosis) {
      return createErrorResponse(new Error("Diagnosis with this name already exists"))
    }

    // Create new custom diagnosis entry
    const newDiagnosis = await prisma.symptomsDatabase.create({
      data: {
        id: crypto.randomUUID(),
        diagnosisName: customDiagnosis.diagnosisName,
        symptoms: customDiagnosis.symptoms,
        category: customDiagnosis.category,
        severityIndicators: customDiagnosis.severityIndicators,
        commonAgeGroups: customDiagnosis.commonAgeGroups,
        genderSpecific: customDiagnosis.genderSpecific === 'BOTH' ? null : customDiagnosis.genderSpecific.toLowerCase(),
        riskFactors: customDiagnosis.riskFactors,
        isActive: true,
        createdBy: session.user.profileId,
        createdAt: new Date()
      }
    })

    // Log the creation for audit purposes
    console.log(`Custom diagnosis created: ${customDiagnosis.diagnosisName} by ${session.user.role} ${session.user.profileId}`)

    return createSuccessResponse({
      id: newDiagnosis.id,
      diagnosisName: customDiagnosis.diagnosisName,
      category: customDiagnosis.category,
      symptoms: customDiagnosis.symptoms,
      severityIndicators: customDiagnosis.severityIndicators,
      commonAgeGroups: customDiagnosis.commonAgeGroups,
      genderSpecific: customDiagnosis.genderSpecific,
      riskFactors: customDiagnosis.riskFactors,
      description: customDiagnosis.description,
      icd10Codes: customDiagnosis.icd10Codes,
      treatmentSuggestions: customDiagnosis.treatmentSuggestions,
      createdBy: session.user.profileId,
      createdAt: newDiagnosis.createdAt
    }, 201)

  } catch (error) {
    console.error('Custom diagnosis creation error:', error)
    return createErrorResponse(error as Error)
  }
})

/**
 * GET /api/symptoms/diagnoses/custom
 * Retrieve custom diagnoses added by the organization
 * Business Logic: Healthcare providers can view custom diagnoses
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Healthcare providers can view custom diagnoses
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to custom diagnoses denied")
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const category = searchParams.get('category')
  const createdBy = searchParams.get('createdBy')

  try {
    const whereClause: any = {
      AND: [
        { isActive: true },
        // Filter for custom diagnoses by looking for entries created by users
        { createdBy: { not: null } }
      ]
    }

    if (category) {
      whereClause.AND.push({ category: { contains: category, mode: 'insensitive' } })
    }

    if (createdBy) {
      whereClause.AND.push({ createdBy: createdBy })
    }

    const customDiagnoses = await prisma.symptomsDatabase.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        diagnosisName: true,
        symptoms: true,
        category: true,
        severityIndicators: true,
        commonAgeGroups: true,
        genderSpecific: true,
        riskFactors: true,
        createdBy: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get creator information for each diagnosis
    const creatorIds = [...new Set(customDiagnoses.map(d => d.createdBy).filter(id => id))]
    const creators = await prisma.user.findMany({
      where: { profileId: { in: creatorIds } },
      select: {
        profileId: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    const creatorMap = creators.reduce((acc, creator) => {
      acc[creator.profileId] = {
        name: `${creator.firstName} ${creator.lastName}`.trim(),
        role: creator.role
      }
      return acc
    }, {} as Record<string, { name: string; role: string }>)

    const formattedDiagnoses = customDiagnoses.map(diagnosis => ({
      id: diagnosis.id,
      diagnosisName: diagnosis.diagnosisName,
      category: diagnosis.category,
      symptoms: diagnosis.symptoms || [],
      symptomCount: Array.isArray(diagnosis.symptoms) ? diagnosis.symptoms.length : 0,
      severityIndicators: diagnosis.severityIndicators || [],
      commonAgeGroups: diagnosis.commonAgeGroups || [],
      genderSpecific: diagnosis.genderSpecific?.toUpperCase() || 'BOTH',
      riskFactors: diagnosis.riskFactors || [],
      creator: diagnosis.createdBy ? creatorMap[diagnosis.createdBy] : null,
      createdAt: diagnosis.createdAt
    }))

    return createSuccessResponse({
      customDiagnoses: formattedDiagnoses,
      metadata: {
        total: formattedDiagnoses.length,
        category,
        createdBy,
        limit,
        availableCreators: Object.keys(creatorMap).map(id => ({
          id,
          ...creatorMap[id]
        }))
      }
    })

  } catch (error) {
    console.error('Custom diagnoses retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})