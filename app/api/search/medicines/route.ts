/**
 * Advanced Medicine Search API Route
 * Enhanced medicine search with detailed filters and clinical information
 * Business Logic: All authenticated healthcare users can search medicines for prescribing
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
 * GET /api/search/medicines
 * Advanced medicine search with detailed filters
 * Enhanced from basic search to include drug class, interactions, contraindications
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: All authenticated healthcare users can search medicines
  if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to medicine search denied")
  }

  const { searchParams } = new URL(request.url)
  const value = searchParams.get('value')
  const type = searchParams.get('type')
  const drugClass = searchParams.get('drugClass')
  const strength = searchParams.get('strength')
  const manufacturer = searchParams.get('manufacturer')
  const publicOnly = searchParams.get('publicOnly') !== 'false' // Default to true
  const limit = parseInt(searchParams.get('limit') || '20')
  const includeDetails = searchParams.get('includeDetails') === 'true'
  const includeInteractions = searchParams.get('includeInteractions') === 'true'

  if (!value || value.trim().length < 2) {
    return createErrorResponse(new Error("Search value must be at least 2 characters"))
  }

  try {
    let whereClause: any = {
      AND: [
        ...(publicOnly ? [{ publicMedicine: true }] : []),
        {
          OR: [
            { name: { contains: value, mode: 'insensitive' } },
            { description: { contains: value, mode: 'insensitive' } },
            // Search within details JSON for generic names and brand names
            { details: { path: "$.genericName", string_contains: value } },
            { details: { path: "$.brand_names[*]", string_contains: value } }
          ]
        }
      ]
    }

    // Add type filter
    if (type) {
      whereClause.AND.push({ type: { contains: type, mode: 'insensitive' } })
    }

    // Add drug class filter
    if (drugClass) {
      whereClause.AND.push({ 
        details: { path: "$.drug_class", string_contains: drugClass }
      })
    }

    // Add strength filter
    if (strength) {
      whereClause.AND.push({
        OR: [
          { details: { path: "$.strength", string_contains: strength } },
          { details: { path: "$.common_dosages[*]", string_contains: strength } }
        ]
      })
    }

    // Add manufacturer filter
    if (manufacturer) {
      whereClause.AND.push({ 
        details: { path: "$.manufacturer", string_contains: manufacturer }
      })
    }

    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        details: true,
        publicMedicine: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    })

    // Calculate relevance scores
    const scoredMedicines = medicines.map(medicine => {
      let relevanceScore = 0
      const valueLower = value.toLowerCase()
      const nameLower = medicine.name?.toLowerCase() || ''
      
      // Exact name match gets highest score
      if (nameLower === valueLower) {
        relevanceScore += 100
      } else if (nameLower.startsWith(valueLower)) {
        relevanceScore += 50
      } else if (nameLower.includes(valueLower)) {
        relevanceScore += 25
      }

      // Generic name match
      const genericName = medicine.details?.genericName?.toLowerCase() || ''
      if (genericName.includes(valueLower)) {
        relevanceScore += 30
      }

      // Brand names match
      if (Array.isArray(medicine.details?.brand_names)) {
        const brandMatches = medicine.details.brand_names.filter((brand: string) =>
          brand.toLowerCase().includes(valueLower)
        ).length
        relevanceScore += brandMatches * 20
      }

      return { ...medicine, relevanceScore }
    })

    // Sort by relevance score then by name
    scoredMedicines.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      return (a.name || '').localeCompare(b.name || '')
    })

    // Transform to expected format
    const responseData = {
      medicines: scoredMedicines.reduce((acc: any, medicine: any) => {
        const details = medicine.details || {}
        acc[medicine.id] = {
          basic_info: {
            id: medicine.id.toString(),
            name: medicine.name,
            type: medicine.type,
            strength: details.strength || details.common_dosages?.[0] || '',
            genericName: details.genericName || '',
            description: medicine.description,
            relevance_score: medicine.relevanceScore,
            ...(includeDetails && {
              brand_names: details.brand_names || [],
              drug_class: details.drug_class || '',
              manufacturer: details.manufacturer || '',
              common_dosages: details.common_dosages || [],
              dosage_forms: details.dosage_forms || [],
              route_of_administration: details.route_of_administration || [],
              indications: details.indications || [],
              pregnancy_category: details.pregnancy_category || '',
              controlled_substance: details.controlled_substance || false,
              requires_prescription: details.requires_prescription || true
            }),
            ...(includeInteractions && {
              side_effects: details.side_effects || [],
              contraindications: details.contraindications || [],
              drug_interactions: details.interactions || [],
              warnings: details.warnings || [],
              precautions: details.precautions || []
            })
          }
        }
        return acc
      }, {})
    }

    // Generate search insights
    const insights = {
      total_results: scoredMedicines.length,
      drug_classes: [...new Set(scoredMedicines.map(m => m.details?.drug_class).filter(Boolean))].slice(0, 5),
      types: [...new Set(scoredMedicines.map(m => m.type).filter(Boolean))],
      manufacturers: [...new Set(scoredMedicines.map(m => m.details?.manufacturer).filter(Boolean))].slice(0, 5),
      prescription_required: scoredMedicines.filter(m => m.details?.requires_prescription !== false).length,
      controlled_substances: scoredMedicines.filter(m => m.details?.controlled_substance === true).length
    }

    return createSuccessResponse({
      ...responseData,
      search_insights: insights,
      metadata: {
        query: value,
        filters: { type, drugClass, strength, manufacturer, publicOnly, includeDetails, includeInteractions },
        total_found: scoredMedicines.length,
        limit
      }
    })

  } catch (error) {
    console.error('Advanced medicine search error:', error)
    return createErrorResponse(error as Error)
  }
})
