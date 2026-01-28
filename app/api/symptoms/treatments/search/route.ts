/**
 * Treatments Search API Route
 * Advanced search functionality for treatments database
 * Business Logic: Healthcare providers can search treatments for clinical decision support
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


export const dynamic = 'force-dynamic';

export const runtime = 'nodejs'

/**
 * GET /api/symptoms/treatments/search
 * Search treatments database with advanced filtering and ranking
 * Business Logic: Healthcare providers can search treatments for clinical decision support
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can search treatments database
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to treatments search denied")
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const treatmentType = searchParams.get('treatmentType')
  const category = searchParams.get('category')
  const severityLevel = searchParams.get('severityLevel')
  const condition = searchParams.get('condition')
  const limit = parseInt(searchParams.get('limit') || '20')
  const includeConditions = searchParams.get('includeConditions') === 'true'

  if (!query || query.trim().length < 2) {
    return createErrorResponse(new Error("Search query must be at least 2 characters"))
  }

  try {
    const whereClause: any = {
      AND: [
        { isActive: true },
        {
          OR: [
            { treatmentName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    }

    // Add treatment type filter
    if (treatmentType) {
      whereClause.AND.push({ treatmentType: { contains: treatmentType, mode: 'insensitive' } })
    }

    // Add category filter
    if (category) {
      whereClause.AND.push({ category: { contains: category, mode: 'insensitive' } })
    }

    // Add severity level filter
    if (severityLevel) {
      whereClause.AND.push({ severityLevel: { contains: severityLevel, mode: 'insensitive' } })
    }

    // Add condition filter - search within applicableConditions JSON array
    if (condition) {
      whereClause.AND.push({
        applicableConditions: { has: condition }
      })
    }

    const treatments = await prisma.treatmentDatabase.findMany({
      where: whereClause,
      take: limit * 2, // Get more results for ranking
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
      },
      orderBy: { treatmentName: 'asc' }
    })

    // Rank results by relevance
    const rankedTreatments = treatments.map(treatment => {
      let relevanceScore = 0
      const queryLower = query.toLowerCase()
      const treatmentNameLower = treatment.treatmentName?.toLowerCase() || ''
      const descriptionLower = treatment.description?.toLowerCase() || ''
      const categoryLower = treatment.category?.toLowerCase() || ''

      // Exact name match gets highest score
      if (treatmentNameLower === queryLower) {
        relevanceScore += 100
      } else if (treatmentNameLower.startsWith(queryLower)) {
        relevanceScore += 50
      } else if (treatmentNameLower.includes(queryLower)) {
        relevanceScore += 25
      }

      // Description match
      if (descriptionLower.includes(queryLower)) {
        relevanceScore += 20
      }

      // Category match
      if (categoryLower.includes(queryLower)) {
        relevanceScore += 15
      }

      // Applicable conditions match
      if (includeConditions && Array.isArray(treatment.applicableConditions)) {
        const conditionMatches = treatment.applicableConditions.filter((cond: string) =>
          cond.toLowerCase().includes(queryLower)
        ).length
        relevanceScore += conditionMatches * 10
      }

      // Treatment type match
      if (treatment.treatmentType?.toLowerCase().includes(queryLower)) {
        relevanceScore += 15
      }

      return { ...treatment, relevanceScore }
    })

    // Sort by relevance score (descending) then by name
    rankedTreatments.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      return (a.treatmentName || '').localeCompare(b.treatmentName || '')
    })

    // Take only the requested limit after ranking
    const finalResults = rankedTreatments.slice(0, limit)

    const formattedTreatments = finalResults.map(treatment => ({
      id: treatment.id,
      name: treatment.treatmentName,
      type: treatment.treatmentType,
      description: treatment.description,
      category: treatment.category,
      severityLevel: treatment.severityLevel,
      duration: treatment.duration,
      frequency: treatment.frequency,
      dosageInfo: treatment.dosageInfo || {},
      applicableConditions: includeConditions ? (treatment.applicableConditions || []) : undefined,
      contraindications: treatment.contraindications || [],
      sideEffects: treatment.sideEffects || [],
      conditionCount: Array.isArray(treatment.applicableConditions) ? treatment.applicableConditions.length : 0,
      relevanceScore: treatment.relevanceScore,
      createdAt: treatment.createdAt
    }))

    // Get condition frequency if including conditions
    const conditionFrequency: { [key: string]: number } = {}
    if (includeConditions) {
      finalResults.forEach(treatment => {
        if (Array.isArray(treatment.applicableConditions)) {
          treatment.applicableConditions.forEach((condition: string) => {
            if (condition.toLowerCase().includes(query.toLowerCase())) {
              conditionFrequency[condition] = (conditionFrequency[condition] || 0) + 1
            }
          })
        }
      })
    }

    // Generate treatment categories summary
    const categorySummary = finalResults.reduce((acc, treatment) => {
      const category = treatment.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return createSuccessResponse({
      treatments: formattedTreatments,
      metadata: {
        query,
        treatmentType,
        category,
        severityLevel,
        condition,
        includeConditions,
        totalResults: formattedTreatments.length,
        searchScope: 'treatments_database',
        categorySummary,
        ...(includeConditions && { 
          commonConditions: Object.entries(conditionFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([condition, frequency]) => ({ condition, frequency }))
        })
      }
    })

  } catch (error) {
    console.error('Treatments search error:', error)
    return createErrorResponse(error as Error)
  }
})
