/**
 * Diagnoses Search API Route
 * Advanced search functionality for diagnoses database
 * Business Logic: Healthcare providers can search diagnoses for clinical decision support
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
 * GET /api/symptoms/diagnoses/search
 * Search diagnoses database with advanced filtering and ranking
 * Business Logic: Healthcare providers can search diagnoses for clinical decision support
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can search diagnoses database
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to diagnoses search denied")
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const category = searchParams.get('category')
  const severity = searchParams.get('severity')
  const ageGroup = searchParams.get('ageGroup')
  const gender = searchParams.get('gender')
  const limit = parseInt(searchParams.get('limit') || '20')
  const includeSymptoms = searchParams.get('includeSymptoms') === 'true'

  if (!query || query.trim().length < 2) {
    return createErrorResponse(new Error("Search query must be at least 2 characters"))
  }

  try {
    const whereClause: any = {
      AND: [
        { isActive: true },
        {
          OR: [
            { diagnosisName: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    }

    // Add category filter
    if (category) {
      whereClause.AND.push({ category: { contains: category, mode: 'insensitive' } })
    }

    // Add gender filter
    if (gender && gender !== 'all') {
      whereClause.AND.push({
        OR: [
          { genderSpecific: gender },
          { genderSpecific: null }
        ]
      })
    }

    const diagnoses = await prisma.symptomsDatabase.findMany({
      where: whereClause,
      take: limit * 2, // Get more results for filtering and ranking
      select: {
        id: true,
        diagnosisName: true,
        symptoms: true,
        category: true,
        severityIndicators: true,
        commonAgeGroups: true,
        genderSpecific: true,
        createdAt: true
      },
      orderBy: { diagnosisName: 'asc' }
    })

    // Advanced filtering and ranking
    let filteredDiagnoses = diagnoses

    // Filter by age group
    if (ageGroup) {
      filteredDiagnoses = filteredDiagnoses.filter(diagnosis => {
        if (!diagnosis.commonAgeGroups || !Array.isArray(diagnosis.commonAgeGroups)) {
          return true // Include diagnoses with no age restrictions
        }
        return diagnosis.commonAgeGroups.some((age: string) => 
          age.toLowerCase().includes(ageGroup.toLowerCase())
        )
      })
    }

    // Filter by severity indicators
    if (severity) {
      filteredDiagnoses = filteredDiagnoses.filter(diagnosis => {
        if (!diagnosis.severityIndicators || !Array.isArray(diagnosis.severityIndicators)) {
          return false
        }
        return diagnosis.severityIndicators.some((indicator: string) => 
          indicator.toLowerCase().includes(severity.toLowerCase())
        )
      })
    }

    // Rank results by relevance
    const rankedDiagnoses = filteredDiagnoses.map(diagnosis => {
      let relevanceScore = 0
      const queryLower = query.toLowerCase()
      const diagnosisNameLower = diagnosis.diagnosisName?.toLowerCase() || ''
      const categoryLower = diagnosis.category?.toLowerCase() || ''

      // Exact name match gets highest score
      if (diagnosisNameLower === queryLower) {
        relevanceScore += 100
      } else if (diagnosisNameLower.startsWith(queryLower)) {
        relevanceScore += 50
      } else if (diagnosisNameLower.includes(queryLower)) {
        relevanceScore += 25
      }

      // Category match
      if (categoryLower.includes(queryLower)) {
        relevanceScore += 15
      }

      // Symptoms match (if available)
      if (includeSymptoms && Array.isArray(diagnosis.symptoms)) {
        const symptomMatches = diagnosis.symptoms.filter((symptom: string) =>
          symptom.toLowerCase().includes(queryLower)
        ).length
        relevanceScore += symptomMatches * 10
      }

      return { ...diagnosis, relevanceScore }
    })

    // Sort by relevance score (descending) then by name
    rankedDiagnoses.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      return (a.diagnosisName || '').localeCompare(b.diagnosisName || '')
    })

    // Take only the requested limit after ranking
    const finalResults = rankedDiagnoses.slice(0, limit)

    const formattedDiagnoses = finalResults.map(diagnosis => ({
      id: diagnosis.id,
      name: diagnosis.diagnosisName,
      category: diagnosis.category,
      symptoms: includeSymptoms ? (diagnosis.symptoms || []) : undefined,
      severityIndicators: diagnosis.severityIndicators || [],
      commonAgeGroups: diagnosis.commonAgeGroups || [],
      genderSpecific: diagnosis.genderSpecific,
      symptomCount: Array.isArray(diagnosis.symptoms) ? diagnosis.symptoms.length : 0,
      relevanceScore: diagnosis.relevanceScore,
      createdAt: diagnosis.createdAt
    }))

    // Get symptom frequency if including symptoms
    const symptomFrequency: { [key: string]: number } = {}
    if (includeSymptoms) {
      finalResults.forEach(diagnosis => {
        if (Array.isArray(diagnosis.symptoms)) {
          diagnosis.symptoms.forEach((symptom: string) => {
            if (symptom.toLowerCase().includes(query.toLowerCase())) {
              symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1
            }
          })
        }
      })
    }

    return createSuccessResponse({
      diagnoses: formattedDiagnoses,
      metadata: {
        query,
        category,
        severity,
        ageGroup,
        gender,
        includeSymptoms,
        totalResults: formattedDiagnoses.length,
        searchScope: 'diagnoses_database',
        ...(includeSymptoms && { 
          commonSymptoms: Object.entries(symptomFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([symptom, frequency]) => ({ symptom, frequency }))
        })
      }
    })

  } catch (error) {
    console.error('Diagnoses search error:', error)
    return createErrorResponse(error as Error)
  }
})
