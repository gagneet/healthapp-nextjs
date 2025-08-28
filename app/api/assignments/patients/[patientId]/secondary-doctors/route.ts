/**
 * Patient Secondary Doctors Assignment API Route
 * Manage secondary doctor assignments for patients
 * Business Logic: Primary doctors can assign secondary doctors, providers can view assignments
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

const AssignSecondaryDoctorSchema = z.object({
  doctorId: z.string().uuid("Doctor ID must be a valid UUID"),
  assignmentType: z.enum(['specialist', 'substitute', 'transferred']),
  specialtyFocus: z.array(z.string()).optional().default([]),
  carePlanIds: z.array(z.string().uuid()).optional().default([]),
  assignmentReason: z.string().min(10, "Assignment reason must be at least 10 characters"),
  notes: z.string().optional(),
  requiresConsent: z.boolean().optional(),
  permissions: z.object({
    canViewMedications: z.boolean().optional().default(true),
    canPrescribe: z.boolean().optional().default(false),
    canViewVitals: z.boolean().optional().default(true),
    canEditCarePlan: z.boolean().optional().default(false),
    canViewLabResults: z.boolean().optional().default(true),
    accessLevel: z.enum(['read_only', 'limited', 'full']).optional().default('limited')
  }).optional().default({})
})

/**
 * POST /api/assignments/patients/:patientId/secondary-doctors
 * Assign secondary doctor to patient
 * Business Logic: Only primary doctors can assign secondary doctors
 */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can assign secondary doctors
  if (!['DOCTOR'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors can assign secondary doctors")
  }

  const { patientId } = params
  const body = await request.json()
  const validationResult = AssignSecondaryDoctorSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const {
    doctorId,
    assignmentType,
    specialtyFocus,
    carePlanIds,
    assignmentReason,
    notes,
    requiresConsent,
    permissions
  } = validationResult.data

  try {
    // Get primary doctor profile
    const primaryDoctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    })

    if (!primaryDoctor) {
      return createErrorResponse(new Error("Primary doctor profile not found"))
    }

    // Verify patient belongs to primary doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        primaryCareDoctorId: primaryDoctor.id
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        }
      }
    })

    if (!patient) {
      return createErrorResponse(new Error("Patient not found or not assigned to you"))
    }

    // Verify secondary doctor exists and is active
    const secondaryDoctor = await prisma.doctor.findFirst({
      where: { 
        id: doctorId, 
        isActive: true 
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        speciality: {
          select: { name: true, description: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    })

    if (!secondaryDoctor) {
      return createErrorResponse(new Error("Secondary doctor not found or inactive"))
    }

    // Check for existing active assignment
    const existingAssignment = await prisma.patientDoctorAssignment.findFirst({
      where: {
        patientId: patientId,
        secondaryDoctorId: doctorId,
        isActive: true
      }
    })

    if (existingAssignment) {
      return createErrorResponse(new Error("Active assignment already exists between this patient and doctor"))
    }

    // Determine if consent is required
    const sameOrganization = primaryDoctor.organizationId === secondaryDoctor.organizationId
    const needsConsent = requiresConsent !== undefined ? requiresConsent : !sameOrganization

    // Set assignment permissions based on type and same organization
    const finalPermissions = {
      canViewMedications: permissions.canViewMedications ?? true,
      canPrescribe: permissions.canPrescribe ?? (assignmentType === 'transferred'),
      canViewVitals: permissions.canViewVitals ?? true,
      canEditCarePlan: permissions.canEditCarePlan ?? (assignmentType !== 'specialist'),
      canViewLabResults: permissions.canViewLabResults ?? true,
      accessLevel: permissions.accessLevel ?? (assignmentType === 'transferred' ? 'full' : 'limited')
    }

    // Calculate expiration date (default 90 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    // Create assignment
    const assignment = await prisma.patientDoctorAssignment.create({
      data: {
        patientId,
        primaryDoctorId: primaryDoctor.id,
        secondaryDoctorId: doctorId,
        assignmentType,
        assignmentReason,
        specialtyFocus: specialtyFocus.length > 0 ? specialtyFocus : null,
        requiresConsent: needsConsent,
        consentStatus: needsConsent ? 'pending' : 'granted',
        accessGranted: !needsConsent,
        permissions: finalPermissions,
        expiresAt,
        notes,
        createdBy: session.user.id,
        isActive: true
      }
    })

    // Link care plans if specified
    if (carePlanIds.length > 0) {
      await prisma.carePlan.updateMany({
        where: { 
          id: { in: carePlanIds },
          patientId: patientId
        },
        data: {
          assignedDoctorId: doctorId
        }
      })
    }

    const responseData = {
      assignment_id: assignment.id,
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
        email: patient.user.email,
        phone: patient.user.phone
      },
      primary_doctor: {
        id: primaryDoctor.id,
        name: `${primaryDoctor.user.firstName} ${primaryDoctor.user.lastName}`.trim(),
        email: primaryDoctor.user.email,
        organization: primaryDoctor.organization?.name
      },
      secondary_doctor: {
        id: secondaryDoctor.id,
        name: `${secondaryDoctor.user.firstName} ${secondaryDoctor.user.lastName}`.trim(),
        email: secondaryDoctor.user.email,
        specialty: secondaryDoctor.speciality?.name || 'General Practice',
        organization: secondaryDoctor.organization?.name
      },
      assignment_details: {
        assignment_type: assignmentType,
        assignment_reason: assignmentReason,
        specialty_focus: specialtyFocus,
        permissions: finalPermissions,
        expires_at: assignment.expiresAt,
        notes: notes,
        linked_care_plans: carePlanIds.length
      },
      consent_info: {
        requires_consent: needsConsent,
        consent_status: assignment.consentStatus,
        access_granted: assignment.accessGranted,
        same_organization: sameOrganization,
        reason: sameOrganization 
          ? 'Same organization - automatic access granted'
          : 'Different organization - patient consent required'
      }
    }

    const message = needsConsent
      ? 'Secondary doctor assigned successfully. Patient consent required before access is granted.'
      : 'Secondary doctor assigned successfully with automatic access (same organization).'

    return createSuccessResponse(responseData, 201)

  } catch (error) {
    console.error('Secondary doctor assignment error:', error)
    return createErrorResponse(error as Error)
  }
})

/**
 * GET /api/assignments/patients/:patientId/secondary-doctors
 * Get patient's secondary doctor assignments
 * Business Logic: Primary doctors and assigned secondary doctors can view assignments
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Doctors and admins can view secondary doctor assignments
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors can view secondary doctor assignments")
  }

  const { patientId } = params
  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'

  try {
    // Get requesting doctor's profile
    const requestingDoctor = session.user.role === 'DOCTOR'
      ? await prisma.doctor.findFirst({ where: { userId: session.user.id } })
      : null

    // Verify access to patient
    const patient = await prisma.patient.findFirst({
      where: { id: patientId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        }
      }
    })

    if (!patient) {
      return createErrorResponse(new Error("Patient not found"))
    }

    // Check if requesting doctor has access to this patient
    if (requestingDoctor) {
      const hasAccess = await prisma.patientDoctorAssignment.findFirst({
        where: {
          patientId: patientId,
          OR: [
            { primaryDoctorId: requestingDoctor.id },
            { secondaryDoctorId: requestingDoctor.id }
          ],
          accessGranted: true
        }
      })

      if (!hasAccess && patient.primaryCareDoctorId !== requestingDoctor.id) {
        return createForbiddenResponse("Access denied to this patient's assignments")
      }
    }

    // Get assignments
    const assignments = await prisma.patientDoctorAssignment.findMany({
      where: {
        patientId: patientId,
        secondaryDoctorId: { not: null },
        isActive: includeInactive ? undefined : true
      },
      include: {
        primaryDoctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            },
            speciality: {
              select: { name: true }
            }
          }
        },
        secondaryDoctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            },
            speciality: {
              select: { name: true }
            },
            organization: {
              select: { name: true }
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

    const consentMap = consentOtps.reduce((acc, otp) => {
      if (!acc[otp.patientDoctorAssignmentId]) {
        acc[otp.patientDoctorAssignmentId] = otp
      }
      return acc
    }, {} as Record<string, any>)

    // Format assignments
    const formattedAssignments = assignments.map(assignment => {
      const consent = consentMap[assignment.id]
      
      return {
        assignment_id: assignment.id,
        assignment_type: assignment.assignmentType,
        assignment_reason: assignment.assignmentReason,
        specialty_focus: assignment.specialtyFocus || [],
        created_at: assignment.createdAt,
        expires_at: assignment.expiresAt,
        isActive: assignment.isActive,
        notes: assignment.notes,
        primary_doctor: assignment.primaryDoctor ? {
          id: assignment.primaryDoctor.id,
          name: `${assignment.primaryDoctor.user.firstName} ${assignment.primaryDoctor.user.lastName}`.trim(),
          email: assignment.primaryDoctor.user.email,
          specialty: assignment.primaryDoctor.speciality?.name
        } : null,
        secondary_doctor: assignment.secondaryDoctor ? {
          id: assignment.secondaryDoctor.id,
          name: `${assignment.secondaryDoctor.user.firstName} ${assignment.secondaryDoctor.user.lastName}`.trim(),
          email: assignment.secondaryDoctor.user.email,
          specialty: assignment.secondaryDoctor.speciality?.name,
          organization: assignment.secondaryDoctor.organization?.name
        } : null,
        permissions: assignment.permissions || {},
        consent_details: {
          requires_consent: assignment.requiresConsent,
          consent_status: assignment.consentStatus,
          access_granted: assignment.accessGranted,
          consent_granted_at: assignment.consentGrantedAt,
          otp_info: consent ? {
            has_active_otp: !consent.isVerified && new Date() < new Date(consent.expiresAt),
            is_verified: consent.isVerified,
            verification_attempts: consent.verificationAttempts,
            last_otp_request: consent.createdAt
          } : null
        }
      }
    })

    // Generate summary
    const summary = {
      total_assignments: formattedAssignments.length,
      active_assignments: formattedAssignments.filter(a => a.isActive).length,
      granted_access: formattedAssignments.filter(a => a.consent_details.access_granted).length,
      pending_consent: formattedAssignments.filter(a => 
        a.consent_details.requires_consent && !a.consent_details.access_granted
      ).length,
      by_assignment_type: {
        specialist: formattedAssignments.filter(a => a.assignment_type === 'specialist').length,
        substitute: formattedAssignments.filter(a => a.assignment_type === 'substitute').length,
        transferred: formattedAssignments.filter(a => a.assignment_type === 'transferred').length
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
      assignments: formattedAssignments,
      summary,
      metadata: {
        include_inactive: includeInactive,
        requesting_doctor: requestingDoctor ? {
          id: requestingDoctor.id,
          name: `${session.user.firstName} ${session.user.lastName}`.trim()
        } : null
      }
    })

  } catch (error) {
    console.error('Secondary doctor assignments retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})