/**
 * Available Doctors for Assignment API Route
 * Get doctors available for secondary care assignment
 * Business Logic: Primary doctors can search for available doctors to assign
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
 * GET /api/assignments/doctors/available-for-assignment
 * Get doctors available for secondary care assignment
 * Business Logic: Primary doctors can view available doctors for assignment
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can view available doctors for assignment
  if (!['DOCTOR'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors can view available doctors for assignment")
  }

  const { searchParams } = new URL(request.url)
  const specialty = searchParams.get('specialty')
  const organizationId = searchParams.get('organizationId')
  const assignmentType = searchParams.get('assignmentType')
  const patientId = searchParams.get('patientId')
  const excludeCurrentAssignments = searchParams.get('excludeCurrentAssignments') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // Get requesting doctor profile
    const requestingDoctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    })

    if (!requestingDoctor) {
      return createErrorResponse(new Error("Doctor profile not found"))
    }

    // Build query conditions
    const whereConditions: any = {
      isActive: true,
      id: { not: requestingDoctor.id } // Exclude the requesting doctor
    }

    // Filter by specialty
    if (specialty) {
      whereConditions.specialty = {
        name: { contains: specialty, mode: 'insensitive' }
      }
    }

    // Filter by organization
    if (organizationId) {
      whereConditions.organizationId = organizationId
    }

    // Get excluded doctors if patientId and excludeCurrentAssignments are provided
    let excludedDoctorIds: string[] = []
    if (patientId && excludeCurrentAssignments) {
      const existingAssignments = await prisma.patientDoctorAssignment.findMany({
        where: {
          patientId: patientId,
          isActive: true
        },
        select: { secondaryDoctorId: true }
      })
      
      excludedDoctorIds = existingAssignments
        .map(a => a.secondaryDoctorId)
        .filter(Boolean) as string[]

      if (excludedDoctorIds.length > 0) {
        whereConditions.id = { 
          not: requestingDoctor.id,
          notIn: excludedDoctorIds 
        }
      }
    }

    // Get available doctors
    const availableDoctors = await prisma.doctor.findMany({
      where: whereConditions,
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
        { yearsOfExperience: 'desc' },
        { user: { lastName: 'asc' } }
      ]
    })

    // Get current workload for each doctor (active assignments)
    const doctorIds = availableDoctors.map(d => d.id)
    const workloadData = await prisma.patientDoctorAssignment.groupBy({
      by: ['secondaryDoctorId'],
      where: {
        secondaryDoctorId: { in: doctorIds },
        isActive: true,
        accessGranted: true
      },
      _count: {
        id: true
      }
    })

    const workloadMap = workloadData.reduce((acc, item) => {
      if (item.secondaryDoctorId) {
        acc[item.secondaryDoctorId] = item._count.id
      }
      return acc
    }, {} as Record<string, number>)

    // Format doctor information
    const formattedDoctors = availableDoctors.map(doctor => {
      const sameOrganization = requestingDoctor.organizationId === doctor.organizationId
      const currentWorkload = workloadMap[doctor.id] || 0
      
      return {
        id: doctor.id,
        name: `${doctor.user.firstName} ${doctor.user.lastName}`.trim(),
        email: doctor.user.email,
        phone: doctor.user.phone,
        specialty: {
          id: doctor.specialty?.id,
          name: doctor.specialty?.name || 'General Practice',
          description: doctor.specialty?.description
        },
        organization: {
          id: doctor.organizationId,
          name: doctor.organization?.name || 'Independent',
          same_as_requesting: sameOrganization
        },
        experience: {
          years: doctor.yearsOfExperience,
          level: doctor.yearsOfExperience >= 15 ? 'Senior' : 
                 doctor.yearsOfExperience >= 5 ? 'Experienced' : 'Junior'
        },
        availability: {
          accepting_new_patients: doctor.isAcceptingNewPatients,
          offers_online_consultations: doctor.offersOnlineConsultations || false,
          emergency_availability: doctor.emergencyAvailability || false,
          current_secondary_assignments: currentWorkload,
          workload_level: currentWorkload >= 10 ? 'High' :
                         currentWorkload >= 5 ? 'Medium' : 'Low'
        },
        fees: {
          consultation_fee: doctor.consultationFee,
          currency: 'USD' // Could be configurable
        },
        assignment_suitability: {
          requiresConsent: !sameOrganization,
          consent_reason: sameOrganization 
            ? 'Same organization - automatic access'
            : 'Different organization - patient consent required',
          recommended_for_emergency: doctor.emergencyAvailability && currentWorkload < 5,
          suitable_for_assignment_type: {
            specialist: doctor.specialty?.name !== 'General Practice',
            substitute: sameOrganization && currentWorkload < 8,
            transferred: currentWorkload < 5
          }
        }
      }
    })

    // Apply assignment type filtering
    let filteredDoctors = formattedDoctors
    if (assignmentType) {
      filteredDoctors = formattedDoctors.filter(doctor => {
        const suitability = doctor.assignment_suitability.suitable_for_assignment_type
        return suitability[assignmentType as keyof typeof suitability]
      })
    }

    // Generate recommendations
    const recommendations = {
      same_organization: filteredDoctors.filter(d => d.organization.same_as_requesting),
      specialists: filteredDoctors.filter(d => d.specialty.name !== 'General Practice'),
      low_workload: filteredDoctors.filter(d => d.availability.workload_level === 'Low'),
      emergency_capable: filteredDoctors.filter(d => d.availability.emergency_availability),
      highly_experienced: filteredDoctors.filter(d => d.experience.level === 'Senior'),
      accepting_patients: filteredDoctors.filter(d => d.availability.accepting_new_patients)
    }

    // Generate insights
    const insights = {
      total_available: filteredDoctors.length,
      same_organization_count: recommendations.same_organization.length,
      different_organization_count: filteredDoctors.length - recommendations.same_organization.length,
      specialties_available: [...new Set(filteredDoctors.map(d => d.specialty.name))],
      organizations_represented: [...new Set(filteredDoctors.map(d => d.organization.name))],
      average_experience: filteredDoctors.reduce((sum, d) => sum + d.experience.years, 0) / filteredDoctors.length,
      workload_distribution: {
        low: filteredDoctors.filter(d => d.availability.workload_level === 'Low').length,
        medium: filteredDoctors.filter(d => d.availability.workload_level === 'Medium').length,
        high: filteredDoctors.filter(d => d.availability.workload_level === 'High').length
      }
    }

    return createSuccessResponse({
      available_doctors: filteredDoctors,
      recommendations,
      insights,
      requesting_doctor: {
        id: requestingDoctor.id,
        name: `${session.user.firstName} ${session.user.lastName}`.trim(),
        organization: requestingDoctor.organization?.name || 'Independent'
      },
      metadata: {
        filters: {
          specialty,
          organizationId,
          assignmentType,
          patientId,
          excludeCurrentAssignments
        },
        total_found: filteredDoctors.length,
        limit
      }
    })

  } catch (error) {
    console.error('Available doctors retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})