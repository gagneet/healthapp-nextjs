/**
 * Symptoms Search API Route
 * Provides advanced search functionality for symptoms database
 * Business Logic: Healthcare providers and patients can search symptoms for diagnosis assistance
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

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/symptoms/search
 * Search symptoms database with advanced filtering
 * Business Logic: All authenticated healthcare users can search symptoms
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare users can search symptoms database
  if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to symptoms search denied")
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const category = searchParams.get('category')
  const severity = searchParams.get('severity')
  const ageGroup = searchParams.get('ageGroup')
  const gender = searchParams.get('gender')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!query || query.trim().length < 2) {
    return createErrorResponse(new Error("Search query must be at least 2 characters"))
  }

  try {
    // Search in symptoms database
    const symptomsFromDb = await prisma.symptomsDatabase.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { diagnosisName: { contains: query, mode: 'insensitive' } },
              // Search within symptoms JSON array
              { symptoms: { path: "$[*]", string_contains: query } }
            ]
          },
          ...(category ? [{ category: { contains: category, mode: 'insensitive' } }] : []),
          ...(gender && gender !== 'all' ? [{ genderSpecific: gender }] : [])
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
        genderSpecific: true
      },
      orderBy: { diagnosisName: 'asc' }
    })

    // Extract unique symptoms matching the query
    const matchingSymptoms = new Set<{
      name: string;
      category: string;
      severity: string[];
      relatedDiagnoses: string[];
      ageGroups: string[];
      genderSpecific: string | null;
    }>()

    symptomsFromDb.forEach(diagnosis => {
      if (Array.isArray(diagnosis.symptoms)) {
        diagnosis.symptoms.forEach((symptom: string) => {
          if (symptom.toLowerCase().includes(query.toLowerCase())) {
            matchingSymptoms.add({
              name: symptom,
              category: diagnosis.category || 'General',
              severity: Array.isArray(diagnosis.severityIndicators) 
                ? diagnosis.severityIndicators as string[]
                : [],
              relatedDiagnoses: [diagnosis.diagnosisName],
              ageGroups: Array.isArray(diagnosis.commonAgeGroups) 
                ? diagnosis.commonAgeGroups as string[]
                : [],
              genderSpecific: diagnosis.genderSpecific
            })
          }
        })
      }
    })

    // Also search in patient symptoms for real-world data
    const patientSymptoms = await prisma.symptom.findMany({
      where: {
        OR: [
          { symptomName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20,
      select: {
        symptomName: true,
        description: true,
        severity: true,
        bodyLocation: true,
        triggers: true
      },
      distinct: ['symptomName']
    })

    // Combine and deduplicate results
    const symptomsList = Array.from(matchingSymptoms)
    const patientSymptomsFormatted = patientSymptoms.map(ps => ({
      name: ps.symptomName,
      category: 'Patient Reported',
      severity: [ps.severity?.toString() || '1'],
      relatedDiagnoses: [],
      ageGroups: [],
      genderSpecific: null,
      description: ps.description,
      commonBodyLocations: ps.bodyLocation,
      commonTriggers: ps.triggers
    }))

    // Merge and remove duplicates by name
    const allSymptoms = [...symptomsList, ...patientSymptomsFormatted]
      .filter((symptom, index, self) =>
        index === self.findIndex(s => s.name.toLowerCase() === symptom.name.toLowerCase())
      )

    // Apply additional filters
    let filteredSymptoms = allSymptoms

    if (severity) {
      filteredSymptoms = filteredSymptoms.filter(symptom =>
        symptom.severity.some(sev => sev.toLowerCase().includes(severity.toLowerCase()))
      )
    }

    if (ageGroup) {
      filteredSymptoms = filteredSymptoms.filter(symptom =>
        symptom.ageGroups.some(age => age.toLowerCase().includes(ageGroup.toLowerCase())) ||
        symptom.ageGroups.length === 0  // Include symptoms with no age restrictions
      )
    }

    return createSuccessResponse({
      symptoms: filteredSymptoms.slice(0, limit),
      relatedDiagnoses: symptomsFromDb.map(diagnosis => ({
        id: diagnosis.id,
        name: diagnosis.diagnosisName,
        category: diagnosis.category,
        symptoms: diagnosis.symptoms,
        severityIndicators: diagnosis.severityIndicators
      })),
      metadata: {
        query,
        category,
        severity,
        ageGroup,
        gender,
        totalSymptoms: filteredSymptoms.length,
        relatedDiagnosesCount: symptomsFromDb.length
      }
    })

  } catch (error) {
    console.error('Symptoms search error:', error)
    return createErrorResponse(error as Error)
  }
})