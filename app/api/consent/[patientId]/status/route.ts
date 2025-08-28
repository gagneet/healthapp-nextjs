/**
 * Patient Consent Status API Route
 * Check consent status for patient secondary care assignments
 * Business Logic: Healthcare providers can check consent status for their patient assignments
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
 * GET /api/consent/:patientId/status
 * Check consent status for patient assignments
 * Business Logic: Healthcare providers can check consent status for their assignments
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can check consent status
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only healthcare providers can check consent status")
  }

  const { patientId } = params

  try {
    // Get healthcare provider profile
    const providerProfile = session.user.role === 'DOCTOR' 
      ? await prisma.doctor.findFirst({ where: { userId: session.user.id } })
      : session.user.role === 'HSP'
      ? await prisma.hsp.findFirst({ where: { userId: session.user.id } })
      : null

    if (!providerProfile && session.user.role !== 'SYSTEM_ADMIN') {
      return createErrorResponse(new Error("Healthcare provider profile not found"))
    }

    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: patientId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!patient) {
      return createErrorResponse(new Error("Patient not found"))
    }

    // Get all assignments for this patient where current user is involved
    let assignmentConditions: any = {
      patientId: patientId
    }

    if (session.user.role === 'DOCTOR') {
      assignmentConditions.OR = [
        { primaryDoctorId: providerProfile!.id },
        { secondaryDoctorId: providerProfile!.id }
      ]
    } else if (session.user.role === 'HSP') {
      assignmentConditions.OR = [
        { secondaryHspId: providerProfile!.id }
      ]
    }
    // SYSTEM_ADMIN can see all assignments

    const assignments = await prisma.patientDoctorAssignment.findMany({
      where: assignmentConditions,
      include: {
        primaryDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        secondaryDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            speciality: {
              select: { name: true }
            }
          }
        },
        secondaryHsp: {
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
      },
      orderBy: { createdAt: 'desc' }
    })

    if (assignments.length === 0) {
      return createSuccessResponse({
        can_access: false,
        access_type: 'none',
        requires_consent: false,
        consent_status: 'no_assignment',
        assignments: [],
        reason: 'No assignments found for this patient'
      })
    }

    // Get consent OTPs for all assignments
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

    // Format assignments with consent status
    const formattedAssignments = assignments.map(assignment => {
      const consent = consentMap[assignment.id]
      const isCurrentUserAssignment = 
        (session.user.role === 'DOCTOR' && 
         (assignment.primaryDoctorId === providerProfile?.id || assignment.secondaryDoctorId === providerProfile?.id)) ||
        (session.user.role === 'HSP' && assignment.secondaryHspId === providerProfile?.id)

      return {
        assignment_id: assignment.id,
        assignment_type: assignment.assignmentType,
        is_current_user: isCurrentUserAssignment,
        providers: {
          primary_doctor: assignment.primaryDoctor ? {
            id: assignment.primaryDoctor.id,
            name: `${assignment.primaryDoctor.user.firstName} ${assignment.primaryDoctor.user.lastName}`.trim(),
            email: assignment.primaryDoctor.user.email
          } : null,
          secondary_doctor: assignment.secondaryDoctor ? {
            id: assignment.secondaryDoctor.id,
            name: `${assignment.secondaryDoctor.user.firstName} ${assignment.secondaryDoctor.user.lastName}`.trim(),
            email: assignment.secondaryDoctor.user.email,
            specialty: assignment.secondaryDoctor.speciality?.name
          } : null,
          secondary_hsp: assignment.secondaryHsp ? {
            id: assignment.secondaryHsp.id,
            name: `${assignment.secondaryHsp.user.firstName} ${assignment.secondaryHsp.user.lastName}`.trim(),
            email: assignment.secondaryHsp.user.email
          } : null
        },
        consent_details: {
          requires_consent: assignment.requiresConsent,
          consent_status: assignment.consentStatus,
          access_granted: assignment.accessGranted,
          otp_info: consent ? {
            otp_generated: true,
            is_verified: consent.isVerified,
            is_expired: new Date() > new Date(consent.expiresAt),
            is_blocked: consent.isBlocked,
            verification_attempts: consent.verificationAttempts,
            created_at: consent.createdAt,
            expires_at: consent.expiresAt,
            verified_at: consent.verifiedAt
          } : {
            otp_generated: false
          }
        },
        assignment_info: {
          assignment_reason: assignment.assignmentReason,
          specialty_focus: assignment.specialtyFocus || [],
          created_at: assignment.createdAt,
          expires_at: assignment.expiresAt,
          isActive: assignment.isActive,
          notes: assignment.notes
        }
      }
    })

    // Determine overall access status for current user
    const currentUserAssignments = formattedAssignments.filter(a => a.is_current_user)
    const canAccess = currentUserAssignments.some(a => a.consent_details.access_granted)
    const requiresConsent = currentUserAssignments.some(a => a.consent_details.requires_consent && !a.consent_details.access_granted)
    const hasActiveOtp = currentUserAssignments.some(a => 
      a.consent_details.otp_info.otp_generated && 
      !a.consent_details.otp_info.is_expired && 
      !a.consent_details.otp_info.is_verified
    )

    // Determine access type
    let accessType = 'none'
    if (currentUserAssignments.some(a => a.providers.primary_doctor?.id === providerProfile?.id)) {
      accessType = 'primary'
    } else if (currentUserAssignments.length > 0) {
      accessType = 'secondary'
    }

    // Overall consent status
    let overallConsentStatus = 'no_assignment'
    if (currentUserAssignments.length > 0) {
      if (canAccess) {
        overallConsentStatus = 'granted'
      } else if (requiresConsent) {
        if (hasActiveOtp) {
          overallConsentStatus = 'otp_pending'
        } else {
          overallConsentStatus = 'pending'
        }
      } else {
        overallConsentStatus = 'not_required'
      }
    }

    return createSuccessResponse({
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
        email: patient.user.email,
        phone: patient.user.phone
      },
      access_summary: {
        can_access: canAccess,
        access_type: accessType,
        requires_consent: requiresConsent,
        consent_status: overallConsentStatus,
        has_active_otp: hasActiveOtp,
        total_assignments: assignments.length,
        user_assignments: currentUserAssignments.length
      },
      assignments: formattedAssignments,
      metadata: {
        requesting_provider: {
          id: providerProfile?.id || null,
          role: session.user.role,
          name: `${session.user.firstName} ${session.user.lastName}`.trim()
        },
        checked_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Consent status check error:', error)
    return createErrorResponse(error as Error)
  }
})