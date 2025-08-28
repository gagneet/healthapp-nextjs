/**
 * Find Diagnoses by Symptoms API Route
 * Clinical decision support system for symptom-based diagnosis suggestions
 * Business Logic: Healthcare providers can find potential diagnoses based on patient symptoms
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

const SymptomMatchSchema = z.object({
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  patientAge: z.number().min(0).max(120).optional(),
  patientGender: z.enum(['MALE', 'FEMALE']).optional(),
  severityLevel: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']).optional(),
  matchThreshold: z.number().min(0).max(1).default(0.3), // Minimum percentage of symptoms that must match
  maxResults: z.number().min(1).max(50).default(20)
})

/**
 * POST /api/symptoms/diagnoses/find-by-symptoms
 * Find potential diagnoses based on a set of symptoms
 * Business Logic: Healthcare providers can use this for clinical decision support
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can use diagnostic assistance
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to diagnostic assistance denied")
  }

  const body = await request.json()
  const validationResult = SymptomMatchSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const { 
    symptoms, 
    patientAge, 
    patientGender, 
    severityLevel, 
    matchThreshold, 
    maxResults 
  } = validationResult.data

  try {
    // Get all active diagnoses from the database
    const allDiagnoses = await prisma.symptomsDatabase.findMany({
      where: {
        isActive: true,
        // Filter by gender if specified
        ...(patientGender && {
          OR: [
            { genderSpecific: patientGender.toLowerCase() },
            { genderSpecific: null }
          ]
        })
      },
      select: {
        id: true,
        diagnosisName: true,
        symptoms: true,
        category: true,
        severityIndicators: true,
        commonAgeGroups: true,
        genderSpecific: true
      }
    })

    // Calculate symptom matches and confidence scores
    const diagnosisMatches = allDiagnoses.map(diagnosis => {
      if (!Array.isArray(diagnosis.symptoms)) {
        return null
      }

      const diagnosisSymptoms = diagnosis.symptoms.map((s: string) => s.toLowerCase())
      const inputSymptoms = symptoms.map(s => s.toLowerCase())
      
      // Calculate exact matches
      const exactMatches = inputSymptoms.filter(symptom =>
        diagnosisSymptoms.some(diagSymptom => 
          diagSymptom.includes(symptom) || symptom.includes(diagSymptom)
        )
      )

      // Calculate partial matches (fuzzy matching)
      const partialMatches = inputSymptoms.filter(symptom =>
        diagnosisSymptoms.some(diagSymptom => {
          // Simple fuzzy matching - could be enhanced with Levenshtein distance
          const words1 = symptom.split(' ')
          const words2 = diagSymptom.split(' ')
          return words1.some(w1 => words2.some(w2 => 
            w1.length > 3 && w2.length > 3 && (w1.includes(w2) || w2.includes(w1))
          ))
        })
      )

      const exactMatchCount = exactMatches.length
      const partialMatchCount = partialMatches.filter(pm => !exactMatches.includes(pm)).length
      
      // Calculate confidence score
      const totalSymptomMatches = exactMatchCount + (partialMatchCount * 0.5)
      const matchPercentage = totalSymptomMatches / Math.max(inputSymptoms.length, 1)
      const coveragePercentage = totalSymptomMatches / Math.max(diagnosisSymptoms.length, 1)
      
      // Combined confidence score (weighted average)
      const confidenceScore = (matchPercentage * 0.7) + (coveragePercentage * 0.3)

      // Apply age group filtering if patient age is provided
      let ageMatch = true
      if (patientAge && diagnosis.commonAgeGroups && Array.isArray(diagnosis.commonAgeGroups)) {
        ageMatch = diagnosis.commonAgeGroups.some((ageGroup: string) => {
          const ageGroupLower = ageGroup.toLowerCase()
          if (ageGroupLower.includes('infant') || ageGroupLower.includes('newborn')) return patientAge < 1
          if (ageGroupLower.includes('child') || ageGroupLower.includes('pediatric')) return patientAge < 18
          if (ageGroupLower.includes('adult')) return patientAge >= 18
          if (ageGroupLower.includes('elderly') || ageGroupLower.includes('senior')) return patientAge >= 65
          return true // Include if age group is ambiguous
        })
      }

      // Apply severity filtering
      let severityMatch = true
      if (severityLevel && diagnosis.severityIndicators && Array.isArray(diagnosis.severityIndicators)) {
        severityMatch = diagnosis.severityIndicators.some((indicator: string) =>
          indicator.toLowerCase().includes(severityLevel.toLowerCase())
        )
      }

      return {
        diagnosis,
        exactMatches,
        partialMatches,
        exactMatchCount,
        partialMatchCount,
        totalMatches: totalSymptomMatches,
        matchPercentage,
        coveragePercentage,
        confidenceScore,
        ageMatch,
        severityMatch,
        overallScore: confidenceScore * (ageMatch ? 1 : 0.8) * (severityMatch ? 1 : 0.9)
      }
    })

    // Filter out null results and apply threshold
    const validMatches = diagnosisMatches
      .filter(match => match !== null && match.overallScore >= matchThreshold)
      .sort((a, b) => b!.overallScore - a!.overallScore)
      .slice(0, maxResults)

    // Format results for response
    const formattedResults = validMatches.map((match, index) => ({
      rank: index + 1,
      diagnosis: {
        id: match!.diagnosis.id,
        name: match!.diagnosis.diagnosisName,
        category: match!.diagnosis.category,
        allSymptoms: match!.diagnosis.symptoms,
        genderSpecific: match!.diagnosis.genderSpecific,
        ageGroups: match!.diagnosis.commonAgeGroups
      },
      matching: {
        exactMatches: match!.exactMatches,
        partialMatches: match!.partialMatches,
        exactMatchCount: match!.exactMatchCount,
        partialMatchCount: match!.partialMatchCount,
        totalMatches: match!.totalMatches,
        matchPercentage: Math.round(match!.matchPercentage * 100),
        coveragePercentage: Math.round(match!.coveragePercentage * 100),
        confidenceScore: Math.round(match!.confidenceScore * 100),
        overallScore: Math.round(match!.overallScore * 100)
      },
      filters: {
        ageMatch: match!.ageMatch,
        severityMatch: match!.severityMatch
      }
    }))

    // Generate recommendations
    const recommendations = {
      highConfidence: formattedResults.filter(r => r.matching.overallScore >= 70),
      moderateConfidence: formattedResults.filter(r => r.matching.overallScore >= 50 && r.matching.overallScore < 70),
      lowConfidence: formattedResults.filter(r => r.matching.overallScore < 50),
      
      commonCategories: [...new Set(formattedResults.map(r => r.diagnosis.category))]
        .filter(cat => cat)
        .slice(0, 5),
        
      additionalSymptomsToConsider: [...new Set(
        formattedResults.slice(0, 5).flatMap(result =>
          result.diagnosis.allSymptoms.filter((symptom: string) =>
            !symptoms.some(inputSymptom => 
              symptom.toLowerCase().includes(inputSymptom.toLowerCase()) ||
              inputSymptom.toLowerCase().includes(symptom.toLowerCase())
            )
          )
        )
      )].slice(0, 10)
    }

    return createSuccessResponse({
      results: formattedResults,
      recommendations,
      metadata: {
        inputSymptoms: symptoms,
        patientAge,
        patientGender,
        severityLevel,
        matchThreshold,
        totalDiagnosesSearched: allDiagnoses.length,
        resultsReturned: formattedResults.length,
        searchTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Diagnosis matching error:', error)
    return createErrorResponse(error as Error)
  }
})