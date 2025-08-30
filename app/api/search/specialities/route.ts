/**
 * Advanced Medical Specialities Search API Route
 * Enhanced specialty search with doctor availability and filtering
 * Business Logic: All authenticated healthcare users can search specialities
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
 * GET /api/search/specialities
 * Advanced specialty search with doctor availability
 * Enhanced to include doctor counts, geographic availability, and subspecialties
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: All authenticated healthcare users can search specialities
  if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to specialty search denied")
  }

  const { searchParams } = new URL(request.url)
  const value = searchParams.get('value')
  const includeAvailability = searchParams.get('includeAvailability') === 'true'
  const organizationId = searchParams.get('organizationId')
  const hasAvailableSlots = searchParams.get('hasAvailableSlots') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')

  let whereClause: any = {}

  // If search value provided, filter by name/description
  if (value && value.trim().length >= 2) {
    whereClause.OR = [
      { name: { contains: value, mode: 'insensitive' } },
      { description: { contains: value, mode: 'insensitive' } }
    ]
  }

  try {
    const specialities = await prisma.specialty.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        ...(includeAvailability && {
          doctors: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              organizationId: true,
              yearsOfExperience: true,
              isAcceptingNewPatients: true,
              consultationFee: true
            },
            where: {
              ...(organizationId && { organizationId }),
              isActive: true
            }
          }
        })
      },
      orderBy: { name: 'asc' }
    })

    // Calculate relevance scores if search query provided
    let scoredSpecialities = specialities
    if (value) {
      scoredSpecialities = specialities.map(specialty => {
        let relevanceScore = 0
        const valueLower = value.toLowerCase()
        const nameLower = specialty.name?.toLowerCase() || ''
        const descLower = specialty.description?.toLowerCase() || ''
        
        // Exact name match gets highest score
        if (nameLower === valueLower) {
          relevanceScore += 100
        } else if (nameLower.startsWith(valueLower)) {
          relevanceScore += 50
        } else if (nameLower.includes(valueLower)) {
          relevanceScore += 25
        }

        // Description match
        if (descLower.includes(valueLower)) {
          relevanceScore += 15
        }

        return { ...specialty, relevanceScore }
      })

      // Sort by relevance score then by name
      scoredSpecialities.sort((a: any, b: any) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return (a.name || '').localeCompare(b.name || '')
      })
    }

    // Filter by availability if requested
    if (hasAvailableSlots && includeAvailability) {
      scoredSpecialities = scoredSpecialities.filter((specialty: any) => 
        specialty.doctors?.some((doctor: any) => doctor.isAcceptingNewPatients)
      )
    }

    // Transform to expected format
    const responseData = {
      specialities: scoredSpecialities.reduce((acc: any, specialty: any) => {
        const doctorInfo = includeAvailability ? {
          doctor_count: specialty.doctors?.length || 0,
          accepting_new_patients: specialty.doctors?.filter((d: any) => d.isAcceptingNewPatients).length || 0,
          average_experience: specialty.doctors?.length > 0 
            ? Math.round(specialty.doctors.reduce((sum: number, d: any) => sum + (d.yearsOfExperience || 0), 0) / specialty.doctors.length)
            : 0,
          fee_range: specialty.doctors?.length > 0 ? {
            min: Math.min(...specialty.doctors.map((d: any) => d.consultationFee || 0).filter(f => f > 0)),
            max: Math.max(...specialty.doctors.map((d: any) => d.consultationFee || 0)),
          } : null,
          available_doctors: specialty.doctors?.filter((d: any) => d.isAcceptingNewPatients).map((doctor: any) => ({
            id: doctor.id,
            name: `${doctor.user.firstName} ${doctor.user.lastName}`.trim(),
            email: doctor.user.email,
            experience: doctor.yearsOfExperience,
            fee: doctor.consultationFee
          })) || []
        } : {
          doctor_count: 0
        }

        acc[specialty.id] = {
          basic_info: {
            id: specialty.id.toString(),
            name: specialty.name,
            description: specialty.description,
            ...(value && { relevance_score: (specialty as any).relevanceScore }),
            ...doctorInfo
          }
        }
        return acc
      }, {})
    }

    // Generate search insights
    const insights = includeAvailability ? {
      total_specialities: scoredSpecialities.length,
      total_doctors: scoredSpecialities.reduce((sum: number, s: any) => sum + (s.doctors?.length || 0), 0),
      accepting_new_patients: scoredSpecialities.reduce((sum: number, s: any) => 
        sum + (s.doctors?.filter((d: any) => d.isAcceptingNewPatients).length || 0), 0),
      organizations_represented: organizationId ? 1 : 
        [...new Set(scoredSpecialities.flatMap((s: any) => 
          s.doctors?.map((d: any) => d.organizationId).filter(Boolean) || []
        ))].length,
      popular_specialities: scoredSpecialities
        .sort((a: any, b: any) => (b.doctors?.length || 0) - (a.doctors?.length || 0))
        .slice(0, 5)
        .map((s: any) => ({
          name: s.name,
          doctor_count: s.doctors?.length || 0
        }))
    } : {
      total_specialities: scoredSpecialities.length
    }

    return createSuccessResponse({
      ...responseData,
      search_insights: insights,
      metadata: {
        query: value,
        filters: { includeAvailability, organizationId, hasAvailableSlots },
        total_found: scoredSpecialities.length,
        limit
      }
    })

  } catch (error) {
    console.error('Advanced specialty search error:', error)
    return createErrorResponse(error as Error)
  }
})
