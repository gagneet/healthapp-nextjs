/**
 * Secondary Patients Consent API Route
 * Get secondary patients for healthcare providers with consent status
 * Business Logic: Doctors and HSPs can view patients requiring consent for secondary care
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

const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional()
})

/**
 * GET /api/consent/secondary-patients
 * Get secondary patients with consent status for current healthcare provider
 * Business Logic: Doctors and HSPs can view patients requiring consent
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and HSPs can view secondary patient consent status
  if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and HSPs can view secondary patient consent")
  }

  const { searchParams } = new URL(request.url)
  const paginationResult = PaginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    search: searchParams.get('search') || undefined
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, search } = paginationResult.data
  const skip = (page - 1) * limit

  try {
    // Get the healthcare provider profile
    const providerProfile = session.user.role === 'DOCTOR' 
      ? await prisma.doctor.findFirst({ where: { userId: session.user.id } })
      : await prisma.hspProfile.findFirst({ where: { userId: session.user.id } })

    if (!providerProfile) {
      return createErrorResponse(new Error("Healthcare provider profile not found"))
    }

    // Build search conditions
    const patientSearchConditions: any = {}
    if (search) {
      patientSearchConditions.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { patientId: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get secondary assignments for this provider
    const assignments = await prisma.patientDoctorAssignment.findMany({
      where: {
        OR: [
          { secondaryDoctorId: providerProfile.id },
          { secondaryHspId: providerProfile.id }
        ],
        patient: patientSearchConditions
      },
      skip,
      take: limit,
      include: {
        patient: {
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
            primaryCareDoctor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        secondaryDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        secondaryHsp: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get consent status for each assignment
    const assignmentIds = assignments.map(a => a.id)
    const consentOtps = await prisma.patientConsentOtp.findMany({
      where: {
        patientDoctorAssignmentId: { in: assignmentIds }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Map consent status to assignments
    const consentMap = consentOtps.reduce((acc, otp) => {
      if (!acc[otp.patientDoctorAssignmentId]) {
        acc[otp.patientDoctorAssignmentId] = otp
      }
      return acc
    }, {} as Record<string, any>)

    // Format response
    const secondaryPatients = assignments.map(assignment => {
      const consent = consentMap[assignment.id]
      const patient = assignment.patient
      const primaryDoctor = patient.primaryCareDoctor

      return {
        assignment_id: assignment.id,
        patient: {
          id: patient.id,
          patientId: patient.patientId,
          name: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
          email: patient.user.email,
          phone: patient.user.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender
        },
        doctors: primaryDoctor ? {
          id: primaryDoctor.id,
          name: `${primaryDoctor.user.firstName} ${primaryDoctor.user.lastName}`.trim(),
          email: primaryDoctor.user.email
        } : null,
        assignment_details: {
          assignmentType: assignment.assignmentType,
          assignment_reason: assignment.assignmentReason,
          specialtyFocus: assignment.specialtyFocus || [],
          accessGranted: assignment.accessGranted,
          createdAt: assignment.createdAt,
          expires_at: assignment.expiresAt
        },
        consentStatus: {
          status: assignment.consentStatus || 'pending',
          requiresConsent: assignment.requiresConsent,
          otp_generated: !!consent,
          otp_verified: consent?.isVerified || false,
          otp_expires_at: consent?.expiresAt || null,
          last_otp_request: consent?.createdAt || null,
          verification_attempts: consent?.verificationAttempts || 0,
          is_blocked: consent?.isBlocked || false
        }
      }
    })

    // Get total count for pagination
    const total = await prisma.patientDoctorAssignment.count({
      where: {
        OR: [
          { secondaryDoctorId: providerProfile.id },
          { secondaryHspId: providerProfile.id }
        ],
        patient: patientSearchConditions
      }
    })

    // Generate summary statistics
    const summary = {
      total_assignments: secondaryPatients.length,
      pending_consent: secondaryPatients.filter(p => p.consentStatus.status === 'pending').length,
      granted_access: secondaryPatients.filter(p => p.assignment_details.accessGranted).length,
      blocked_otps: secondaryPatients.filter(p => p.consentStatus.is_blocked).length,
      expired_assignments: secondaryPatients.filter(p => 
        p.assignment_details.expires_at && new Date(p.assignment_details.expires_at) < new Date()
      ).length
    }

    return createSuccessResponse({
      secondary_patients: secondaryPatients,
      summary,
      doctor_info: {
        id: providerProfile.id,
        role: session.user.role,
        name: `${session.user.firstName} ${session.user.lastName}`.trim()
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Secondary patients consent retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})