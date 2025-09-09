/**
 * Assign Secondary Provider Consent API Route
 * Assign secondary doctor/HSP to a patient with consent workflow
 * Business Logic: Primary doctors can assign secondary providers to their patients
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

const AssignSecondarySchema = z.object({
  secondaryDoctorId: z.string().uuid().optional(),
  secondaryHspId: z.string().uuid().optional(),
  assignmentReason: z.string().min(10, "Assignment reason must be at least 10 characters"),
  specialtyFocus: z.array(z.string()).optional().default([]),
  carePlanIds: z.array(z.string().uuid()).optional().default([]),
  requiresConsent: z.boolean().optional(),
  expiresInDays: z.number().min(1).max(365).optional().default(90),
  notes: z.string().optional()
})

/**
 * POST /api/consent/:patientId/assign-secondary
 * Assign secondary doctor/HSP to a patient
 * Business Logic: Only primary doctors can assign secondary providers
 */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and system admins can assign secondary providers
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors can assign secondary providers")
  }

  const { patientId } = params
  const body = await request.json()
  const validationResult = AssignSecondarySchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const {
    secondaryDoctorId,
    secondaryHspId,
    assignmentReason,
    specialtyFocus,
    carePlanIds,
    requiresConsent,
    expiresInDays,
    notes
  } = validationResult.data

  // Validate that either doctor or HSP is provided
  if (!secondaryDoctorId && !secondaryHspId) {
    return createErrorResponse(new Error("Either secondary doctor or HSP must be provided"))
  }

  if (secondaryDoctorId && secondaryHspId) {
    return createErrorResponse(new Error("Cannot assign both doctor and HSP to the same patient"))
  }

  try {
    // Get primary doctor profile
    const primaryDoctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    })

    if (!primaryDoctor && session.user.role !== 'SYSTEM_ADMIN') {
      return createErrorResponse(new Error("Primary doctor profile not found"))
    }

    // Verify patient exists and belongs to primary doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        ...(primaryDoctor && { primaryCareDoctorId: primaryDoctor.id })
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        },
        primaryCareDoctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    })

    if (!patient) {
      return createErrorResponse(new Error("Patient not found or not assigned to you"))
    }

    // Verify secondary provider exists
    let secondaryProvider = null
    let providerType = ''

    if (secondaryDoctorId) {
      secondaryProvider = await prisma.doctor.findFirst({
        where: { id: secondaryDoctorId, isActive: true },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          specialty: {
            select: { name: true }
          }
        }
      })
      providerType = 'doctor'

      if (!secondaryProvider) {
        return createErrorResponse(new Error("Secondary doctor not found or inactive"))
      }
    }

    if (secondaryHspId) {
      secondaryProvider = await prisma.hspProfile.findFirst({
        where: { id: secondaryHspId, isActive: true },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      })
      providerType = 'hsp'

      if (!secondaryProvider) {
        return createErrorResponse(new Error("Secondary HSP not found or inactive"))
      }
    }

    // Check for existing active assignment
    const existingAssignment = await prisma.patientDoctorAssignment.findFirst({
      where: {
        patientId: patientId,
        ...(secondaryDoctorId && { secondaryDoctorId }),
        ...(secondaryHspId && { secondaryHspId }),
        isActive: true
      }
    })

    if (existingAssignment) {
      return createErrorResponse(new Error("Active assignment already exists for this patient and provider"))
    }

    // Determine if consent is required (different organization = consent required)
    const sameOrganization = primaryDoctor?.organizationId === secondaryProvider!.organizationId
    const needsConsent = requiresConsent !== undefined ? requiresConsent : !sameOrganization

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Create assignment
    const assignment = await prisma.patientDoctorAssignment.create({
      data: {
        patientId,
        primaryDoctorId: primaryDoctor?.id || null,
        ...(secondaryDoctorId && { secondaryDoctorId }),
        ...(secondaryHspId && { secondaryHspId }),
        assignmentType: 'secondary_care',
        assignmentReason,
        specialtyFocus: specialtyFocus.length > 0 ? specialtyFocus : null,
        requiresConsent: needsConsent,
        consentStatus: needsConsent ? 'pending' : 'granted',
        accessGranted: !needsConsent,
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
          assignedDoctorId: secondaryDoctorId || undefined,
          assignedHspId: secondaryHspId || undefined
        }
      })
    }

    const responseData = {
      assignment_id: assignment.id,
      patient: {
        id: patient.id,
        name: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
        email: patient.user.email,
        phone: patient.user.phone
      },
      secondary_provider: {
        id: secondaryProvider!.id,
        name: `${secondaryProvider!.user.firstName} ${secondaryProvider!.user.lastName}`.trim(),
        email: secondaryProvider!.user.email,
        type: providerType,
        ...(providerType === 'doctor' && {
          specialty: (secondaryProvider as any).specialty?.name
        })
      },
      assignment_details: {
        assignmentType: assignment.assignmentType,
        assignment_reason: assignmentReason,
        specialtyFocus: specialtyFocus,
        expires_at: assignment.expiresAt,
        notes: notes
      },
      consent_info: {
        requiresConsent: needsConsent,
        consentStatus: assignment.consentStatus,
        accessGranted: assignment.accessGranted,
        same_organization: sameOrganization,
        reason: sameOrganization 
          ? 'Same organization - automatic access granted'
          : 'Different organization - patient consent required'
      },
      linked_care_plans: carePlanIds.length
    }

    const message = needsConsent
      ? 'Secondary provider assigned successfully. Patient consent required before access is granted.'
      : 'Secondary provider assigned successfully with automatic access (same organization).'

    return createSuccessResponse(responseData, 201, undefined, Date.now())

  } catch (error) {
    console.error('Secondary provider assignment error:', error)
    return createErrorResponse(error as Error)
  }
})