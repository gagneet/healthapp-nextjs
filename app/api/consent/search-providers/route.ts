/**
 * Search Healthcare Providers API Route
 * Search for doctors/HSPs available for secondary care assignment
 * Business Logic: Healthcare providers can search for colleagues for patient referrals
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
 * GET /api/consent/search-providers
 * Search for healthcare providers available for assignment
 * Business Logic: Doctors and admins can search for providers for secondary care
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and admins can search providers for assignment
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and administrators can search providers for assignment")
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const type = searchParams.get('type') || 'both' // doctor, hsp, or both
  const specialty = searchParams.get('specialty')
  const organizationId = searchParams.get('organizationId')
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query || query.trim().length < 2) {
    return createErrorResponse(new Error("Search query must be at least 2 characters"))
  }

  try {
    const results = { doctors: [], hsps: [] }

    // Search doctors
    if (type === 'doctor' || type === 'both') {
      interface DoctorSearchConditions {
        AND: Array<{
          isActive?: boolean;
          OR?: Array<{
            user?: {
              firstName?: { contains: string; mode: 'insensitive' };
              lastName?: { contains: string; mode: 'insensitive' };
              email?: { contains: string; mode: 'insensitive' };
            };
            medicalLicenseNumber?: { contains: string; mode: 'insensitive' };
          }>;
          specialty?: {
            name: { contains: string; mode: 'insensitive' };
          };
          organizationId?: string;
        }>;
      }
      const doctorWhere: DoctorSearchConditions = {
        AND: [
          { isActive: includeInactive ? undefined : true },
          {
            OR: [
              { user: { firstName: { contains: query, mode: 'insensitive' } } },
              { user: { lastName: { contains: query, mode: 'insensitive' } } },
              { user: { email: { contains: query, mode: 'insensitive' } } },
              { medicalLicenseNumber: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      };

      // Add specialty filter
      if (specialty) {
        doctorWhere.AND.push({
          specialty: {
            name: { contains: specialty, mode: 'insensitive' }
          }
        });
      }

      // Add organization filter
      if (organizationId) {
        doctorWhere.AND.push({ organizationId });
      }

      const doctors = await prisma.doctor.findMany({
        where: doctorWhere,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          specialty: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { isAcceptingNewPatients: 'desc' },
          { user: { lastName: 'asc' } }
        ]
      })

      results.doctors = doctors.map(doctor => ({
        id: doctor.id,
        name: `${doctor.user.firstName} ${doctor.user.lastName}`.trim(),
        email: doctor.user.email,
        phone: doctor.user.phone,
        specialty: doctor.specialty?.name || 'General Practice',
        speciality_id: doctor.specialty?.id,
        speciality_description: doctor.specialty?.description,
        license: doctor.medicalLicenseNumber,
        organization: doctor.organization?.name || 'Independent',
        organization_id: doctor.organizationId,
        experience_years: doctor.yearsOfExperience,
        accepting_new_patients: doctor.isAcceptingNewPatients,
        consultation_fee: doctor.consultationFee,
        isActive: doctor.isActive,
        type: 'doctor',
        availability_info: {
          online_consultations: doctor.offersOnlineConsultations || false,
          emergency_availability: doctor.emergencyAvailability || false
        }
      }))
    }

    // Search HSPs
    if (type === 'hsp' || type === 'both') {
      interface HSPSearchConditions {
        AND: Array<{
          isActive?: boolean;
          OR?: Array<{
            user?: {
              firstName?: { contains: string; mode: 'insensitive' };
              lastName?: { contains: string; mode: 'insensitive' };
              email?: { contains: string; mode: 'insensitive' };
            };
            licenseNumber?: { contains: string; mode: 'insensitive' };
          }>;
          organizationId?: string;
        }>;
      }
      const hspWhere: HSPSearchConditions = {
        AND: [
          { isActive: includeInactive ? undefined : true },
          {
            OR: [
              { user: { firstName: { contains: query, mode: 'insensitive' } } },
              { user: { lastName: { contains: query, mode: 'insensitive' } } },
              { user: { email: { contains: query, mode: 'insensitive' } } },
              { licenseNumber: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      };

      // Add organization filter
      if (organizationId) {
        hspWhere.AND.push({ organizationId });
      }

      const hsps = await prisma.hsp.findMany({
        where: hspWhere,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { user: { lastName: 'asc' } }
        ]
      })

      results.hsps = hsps.map(hsp => ({
        id: hsp.id,
        name: `${hsp.user.firstName} ${hsp.user.lastName}`.trim(),
        email: hsp.user.email,
        phone: hsp.user.phone,
        license: hsp.licenseNumber,
        hsp_type: hsp.hspType,
        certifications: hsp.certifications || [],
        organization: hsp.organization?.name || 'Independent',
        organization_id: hsp.organizationId,
        experience_years: hsp.yearsOfExperience,
        isActive: hsp.isActive,
        type: 'hsp',
        specialization_areas: hsp.specializationAreas || []
      }))
    }

    // Get current user's organization for context
    const currentUserProfile = session.user.role === 'DOCTOR' 
      ? await prisma.doctor.findFirst({ 
          where: { userId: session.user.id },
          include: { organization: { select: { id: true, name: true } } }
        })
      : null

    // Mark providers from same organization
    const currentOrgId = currentUserProfile?.organizationId

    if (currentOrgId) {
      results.doctors.forEach((doctor: any) => {
        doctor.same_organization = doctor.organization_id === currentOrgId
        doctor.requiresConsent = doctor.organization_id !== currentOrgId
      })

      results.hsps.forEach((hsp: any) => {
        hsp.same_organization = hsp.organization_id === currentOrgId
        hsp.requiresConsent = hsp.organization_id !== currentOrgId
      })
    }

    // Calculate relevance scores
    const scoredDoctors = results.doctors.map((doctor: any) => {
      let relevanceScore = 0
      const queryLower = query.toLowerCase()
      const nameLower = doctor.name.toLowerCase()
      const emailLower = doctor.email.toLowerCase()
      
      if (nameLower.includes(queryLower)) relevanceScore += 30
      if (emailLower.includes(queryLower)) relevanceScore += 20
      if (doctor.specialty.toLowerCase().includes(queryLower)) relevanceScore += 25
      if (doctor.accepting_new_patients) relevanceScore += 15
      if (doctor.same_organization) relevanceScore += 10
      
      return { ...doctor, relevanceScore }
    })

    const scoredHsps = results.hsps.map((hsp: any) => {
      let relevanceScore = 0
      const queryLower = query.toLowerCase()
      const nameLower = hsp.name.toLowerCase()
      const emailLower = hsp.email.toLowerCase()
      
      if (nameLower.includes(queryLower)) relevanceScore += 30
      if (emailLower.includes(queryLower)) relevanceScore += 20
      if (hsp.hsp_type?.toLowerCase().includes(queryLower)) relevanceScore += 25
      if (hsp.same_organization) relevanceScore += 10
      
      return { ...hsp, relevanceScore }
    })

    // Sort by relevance
    scoredDoctors.sort((a, b) => b.relevanceScore - a.relevanceScore)
    scoredHsps.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Generate search insights
    const insights = {
      totalDoctors: scoredDoctors.length,
      total_hsps: scoredHsps.length,
      same_organization_doctors: scoredDoctors.filter(d => d.same_organization).length,
      same_organization_hsps: scoredHsps.filter(h => h.same_organization).length,
      accepting_new_patients: scoredDoctors.filter(d => d.accepting_new_patients).length,
      specialties_found: [...new Set(scoredDoctors.map(d => d.specialty))],
      organizations_represented: [
        ...new Set([
          ...scoredDoctors.map(d => d.organization),
          ...scoredHsps.map(h => h.organization)
        ])
      ].filter(Boolean)
    }

    return createSuccessResponse({
      providers: {
        doctors: scoredDoctors,
        hsps: scoredHsps
      },
      search_context: {
        current_organization: currentUserProfile?.organization?.name || 'Unknown',
        consent_info: {
          same_org_note: 'Providers from your organization will have automatic access (no consent required)',
          different_org_note: 'Providers from different organizations require patient consent'
        }
      },
      search_insights: insights,
      metadata: {
        query,
        type,
        specialty,
        organizationId,
        includeInactive,
        total_results: scoredDoctors.length + scoredHsps.length,
        limit
      }
    })

  } catch (error) {
    console.error('Provider search error:', error)
    return createErrorResponse(error as Error)
  }
})