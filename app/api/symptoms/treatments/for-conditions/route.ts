/**
 * Treatments for Conditions API Route
 * Find appropriate treatments for specific medical conditions
 * Business Logic: Healthcare providers can find treatments for specific conditions
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

const ConditionTreatmentSchema = z.object({
  conditions: z.array(z.string()).min(1, "At least one condition is required"),
  patientAge: z.number().min(0).max(120).optional(),
  severityLevel: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']).optional(),
  treatmentType: z.string().optional(),
  excludeTypes: z.array(z.string()).optional().default([]),
  maxResults: z.number().min(1).max(50).default(20),
  includeContraindications: z.boolean().default(true)
})

/**
 * POST /api/symptoms/treatments/for-conditions
 * Find treatments applicable for specific conditions
 * Business Logic: Healthcare providers can find treatments for patient conditions
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can access treatment recommendations
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to treatment recommendations denied")
  }

  const body = await request.json()
  const validationResult = ConditionTreatmentSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const { 
    conditions, 
    patientAge, 
    severityLevel, 
    treatmentType, 
    excludeTypes, 
    maxResults, 
    includeContraindications 
  } = validationResult.data

  try {
    // Build base query for treatments
    let whereClause: any = {
      AND: [
        { isActive: true },
        {
          OR: conditions.map(condition => ({
            applicableConditions: { has: condition }
          }))
        }
      ]
    }

    // Add treatment type filter
    if (treatmentType) {
      whereClause.AND.push({ treatmentType: { contains: treatmentType, mode: 'insensitive' } })
    }

    // Exclude specified treatment types
    if (excludeTypes.length > 0) {
      whereClause.AND.push({
        NOT: {
          OR: excludeTypes.map(type => ({
            treatmentType: { contains: type, mode: 'insensitive' }
          }))
        }
      })
    }

    // Add severity level filter
    if (severityLevel) {
      whereClause.AND.push({
        OR: [
          { severityLevel: { contains: severityLevel, mode: 'insensitive' } },
          { severityLevel: null } // Include treatments with no severity restriction
        ]
      })
    }

    const treatments = await prisma.treatmentDatabase.findMany({
      where: whereClause,
      take: maxResults * 2, // Get more for ranking
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
        ageRestrictions: true,
        createdAt: true
      }
    })

    // Calculate relevance and applicability scores
    const scoredTreatments = treatments.map(treatment => {
      let relevanceScore = 0
      let applicabilityScore = 0
      const matchingConditions: string[] = []

      // Calculate condition matches
      if (Array.isArray(treatment.applicableConditions)) {
        conditions.forEach(condition => {
          const conditionMatches = treatment.applicableConditions.some((tc: string) =>
            tc.toLowerCase().includes(condition.toLowerCase()) ||
            condition.toLowerCase().includes(tc.toLowerCase())
          )
          if (conditionMatches) {
            matchingConditions.push(condition)
            relevanceScore += 20
          }
        })
      }

      // Calculate applicability based on condition coverage
      const conditionCoverage = matchingConditions.length / conditions.length
      applicabilityScore += conditionCoverage * 50

      // Age appropriateness (if age restrictions exist)
      let ageAppropriate = true
      if (patientAge && treatment.ageRestrictions) {
        // This would require parsing age restrictions - simplified for now
        ageAppropriate = true // Assume appropriate unless clearly not
      }

      // Severity appropriateness
      let severityAppropriate = true
      if (severityLevel && treatment.severityLevel) {
        const treatmentSeverityLower = treatment.severityLevel.toLowerCase()
        const inputSeverityLower = severityLevel.toLowerCase()
        
        // Check if treatment severity matches or is appropriate
        severityAppropriate = treatmentSeverityLower.includes(inputSeverityLower) ||
                             treatmentSeverityLower === 'any' ||
                             !treatment.severityLevel
      }

      // Calculate final score
      const finalScore = relevanceScore + applicabilityScore + 
                        (ageAppropriate ? 10 : -20) + 
                        (severityAppropriate ? 10 : -10)

      return {
        ...treatment,
        matchingConditions,
        conditionCoverage,
        relevanceScore,
        applicabilityScore,
        finalScore,
        ageAppropriate,
        severityAppropriate
      }
    })

    // Filter and sort by final score
    const filteredTreatments = scoredTreatments
      .filter(treatment => treatment.finalScore > 0 && treatment.matchingConditions.length > 0)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxResults)

    // Format results
    const formattedTreatments = filteredTreatments.map((treatment, index) => ({
      rank: index + 1,
      treatment: {
        id: treatment.id,
        name: treatment.treatmentName,
        type: treatment.treatmentType,
        description: treatment.description,
        category: treatment.category,
        duration: treatment.duration,
        frequency: treatment.frequency,
        dosageInfo: treatment.dosageInfo || {},
        severityLevel: treatment.severityLevel
      },
      applicability: {
        matchingConditions: treatment.matchingConditions,
        conditionCoverage: Math.round(treatment.conditionCoverage * 100),
        relevanceScore: treatment.relevanceScore,
        applicabilityScore: Math.round(treatment.applicabilityScore),
        finalScore: Math.round(treatment.finalScore),
        ageAppropriate: treatment.ageAppropriate,
        severityAppropriate: treatment.severityAppropriate
      },
      ...(includeContraindications && {
        contraindications: treatment.contraindications || [],
        sideEffects: treatment.sideEffects || []
      })
    }))

    // Generate recommendations and insights
    const recommendations = {
      highlyRecommended: formattedTreatments.filter(t => t.applicability.finalScore >= 70),
      moderatelyRecommended: formattedTreatments.filter(t => t.applicability.finalScore >= 40 && t.applicability.finalScore < 70),
      considerWithCaution: formattedTreatments.filter(t => t.applicability.finalScore < 40),
      
      treatmentTypes: [...new Set(formattedTreatments.map(t => t.treatment.type))]
        .filter(type => type)
        .slice(0, 5),
        
      categories: [...new Set(formattedTreatments.map(t => t.treatment.category))]
        .filter(cat => cat)
        .slice(0, 5)
    }

    // Coverage analysis
    const coverageAnalysis = {
      totalConditions: conditions.length,
      fullyMatchedConditions: conditions.filter(condition =>
        formattedTreatments.some(t => 
          t.applicability.matchingConditions.includes(condition)
        )
      ),
      partiallyMatchedConditions: conditions.filter(condition =>
        formattedTreatments.some(t =>
          t.applicability.matchingConditions.some(mc =>
            mc.toLowerCase().includes(condition.toLowerCase()) ||
            condition.toLowerCase().includes(mc.toLowerCase())
          )
        )
      ),
      unmatchedConditions: conditions.filter(condition =>
        !formattedTreatments.some(t =>
          t.applicability.matchingConditions.some(mc =>
            mc.toLowerCase().includes(condition.toLowerCase()) ||
            condition.toLowerCase().includes(mc.toLowerCase())
          )
        )
      )
    }

    return createSuccessResponse({
      treatments: formattedTreatments,
      recommendations,
      coverageAnalysis,
      metadata: {
        inputConditions: conditions,
        patientAge,
        severityLevel,
        treatmentType,
        excludeTypes,
        includeContraindications,
        totalTreatmentsFound: formattedTreatments.length,
        searchTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Treatments for conditions error:', error)
    return createErrorResponse(error as Error)
  }
})

/**
 * GET /api/symptoms/treatments/for-conditions
 * Get treatments for conditions via query parameters (simplified version)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to treatment recommendations denied")
  }

  const { searchParams } = new URL(request.url)
  const condition = searchParams.get('condition')
  const treatmentType = searchParams.get('treatmentType')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!condition) {
    return createErrorResponse(new Error("Condition parameter is required"))
  }

  try {
    // Simplified search for single condition
    let whereClause: any = {
      AND: [
        { isActive: true },
        { applicableConditions: { has: condition } }
      ]
    }

    if (treatmentType) {
      whereClause.AND.push({ treatmentType: { contains: treatmentType, mode: 'insensitive' } })
    }

    const treatments = await prisma.treatmentDatabase.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        treatmentName: true,
        treatmentType: true,
        description: true,
        duration: true,
        frequency: true,
        category: true,
        severityLevel: true
      },
      orderBy: { treatmentName: 'asc' }
    })

    const formattedTreatments = treatments.map(treatment => ({
      id: treatment.id,
      name: treatment.treatmentName,
      type: treatment.treatmentType,
      description: treatment.description,
      category: treatment.category,
      duration: treatment.duration,
      frequency: treatment.frequency,
      severityLevel: treatment.severityLevel
    }))

    return createSuccessResponse({
      treatments: formattedTreatments,
      metadata: {
        condition,
        treatmentType,
        totalFound: formattedTreatments.length
      }
    })

  } catch (error) {
    console.error('Simple treatments search error:', error)
    return createErrorResponse(error as Error)
  }
})