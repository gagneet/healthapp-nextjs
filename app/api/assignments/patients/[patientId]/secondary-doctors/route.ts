/**
 * Patient Secondary Doctors Assignment API Route
 * Manage secondary doctor assignments for patients
 * Business Logic: Primary doctors can assign secondary doctors, providers can view assignments
 */

import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto";
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
import { SecondaryDoctorAssignmentConsentStatus } from "@prisma/client";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AssignSecondaryDoctorSchema = z.object({
  doctorId: z.string().uuid("Doctor ID must be a valid UUID"),
  specialtyFocus: z.array(z.string()).optional().default([]),
  carePlanIds: z.array(z.string().uuid()).optional().default([]),
  assignmentReason: z.string().min(10, "Assignment reason must be at least 10 characters"),
  requiresConsent: z.boolean().optional(),
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
    specialtyFocus,
    carePlanIds,
    assignmentReason,
    requiresConsent,
  } = validationResult.data

  try {
    // Get primary doctor profile
    const primaryDoctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        hsps: {
          select: { id: true, user: { select: { name: true } } }
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
        isVerified: true
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        specialty: {
          select: { name: true, description: true }
        },
        hsps: {
          select: { id: true, user: { select: { name: true } } }
        }
      }
    })

    if (!secondaryDoctor) {
      return createErrorResponse(new Error("Secondary doctor not found or inactive"))
    }

    // Check for existing active assignment
    const existingAssignment = await prisma.secondaryDoctorAssignment.findFirst({
      where: {
        patientId: patientId,
        secondaryDoctorId: doctorId,
        isActive: true
      }
    })

    if (existingAssignment) {
      return createErrorResponse(new Error("Active assignment already exists between this patient and doctor"))
    }

    // Determine if consent is required by checking for shared organizations (HSPs)
    const primaryDoctorHspIds = primaryDoctor.hsps.map(h => h.id);
    const secondaryDoctorHspIds = secondaryDoctor.hsps.map(h => h.id);
    const sameOrganization = primaryDoctorHspIds.some(id => secondaryDoctorHspIds.includes(id));
    const needsConsent = requiresConsent !== undefined ? requiresConsent : !sameOrganization

    // Calculate expiration date (default 90 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    // Create assignment
    const newAssignmentId = randomUUID();
    const assignment = await prisma.secondaryDoctorAssignment.create({
      data: {
        id: newAssignmentId,
        patient: { connect: { id: patientId } },
        primaryDoctor: { connect: { id: primaryDoctor.id } },
        secondaryDoctor: { connect: { id: doctorId } },
        assignmentReason,
        specialtyFocus,
        carePlanIds,
        consentRequired: needsConsent,
        consentStatus: needsConsent ? SecondaryDoctorAssignmentConsentStatus.PENDING : SecondaryDoctorAssignmentConsentStatus.GRANTED,
        accessGranted: !needsConsent,
        consentExpiresAt: expiresAt,
        isActive: true
      }
    })

    const responseData = {
      assignment_id: assignment.id,
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
        email: patient.user.email,
        phone: patient.user.phone
      },
      primaryDoctor: {
        id: primaryDoctor.id,
        name: `${primaryDoctor.user.firstName} ${primaryDoctor.user.lastName}`.trim(),
        email: primaryDoctor.user.email,
        organization: primaryDoctor.hsps?.[0]?.user?.name
      },
      secondary_doctor: {
        id: secondaryDoctor.id,
        name: `${secondaryDoctor.user.firstName} ${secondaryDoctor.user.lastName}`.trim(),
        email: secondaryDoctor.user.email,
        specialty: secondaryDoctor.specialty?.name || 'General Practice',
        organization: secondaryDoctor.hsps?.[0]?.user?.name
      },
      assignment_details: {
        assignment_reason: assignmentReason,
        specialtyFocus: specialtyFocus,
        expires_at: assignment.consentExpiresAt,
        linked_care_plans: carePlanIds.length
      },
      consent_info: {
        requiresConsent: needsConsent,
        consentStatus: assignment.consentStatus,
        accessGranted: assignment.accessGranted,
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
      const isSecondaryDoctor = await prisma.secondaryDoctorAssignment.findFirst({
        where: {
          patientId: patientId,
          secondaryDoctorId: requestingDoctor.id,
          accessGranted: true,
        },
      });

      if (!isSecondaryDoctor && patient.primaryCareDoctorId !== requestingDoctor.id) {
        return createForbiddenResponse("Access denied to this patient's assignments")
      }
    }

    // Get assignments
    const assignments = await prisma.secondaryDoctorAssignment.findMany({
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
            specialty: { select: { name: true } }
          }
        },
        secondaryDoctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            },
            specialty: { select: { name: true } },
            hsps: {
              select: {
                user: { select: { name: true } }
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
        secondaryAssignmentId: { in: assignmentIds }
      },
      orderBy: { createdAt: 'desc' }
    })

    const consentMap = consentOtps.reduce((acc, otp) => {
      if (otp.secondaryAssignmentId && !acc[otp.secondaryAssignmentId]) {
        acc[otp.secondaryAssignmentId] = otp
      }
      return acc
    }, {} as Record<string, any>)

    // Format assignments
    const formattedAssignments = assignments.map(assignment => {
      const consent = consentMap[assignment.id]
      
      return {
        assignment_id: assignment.id,
        assignment_reason: assignment.assignmentReason,
        specialtyFocus: assignment.specialtyFocus || [],
        createdAt: assignment.createdAt,
        expires_at: assignment.consentExpiresAt,
        isActive: assignment.isActive,
        primaryDoctor: assignment.primaryDoctor ? {
          id: assignment.primaryDoctor.id,
          name: `${assignment.primaryDoctor.user.firstName} ${assignment.primaryDoctor.user.lastName}`.trim(),
          email: assignment.primaryDoctor.user.email,
          specialty: assignment.primaryDoctor.specialty?.name
        } : null,
        secondaryDoctor: assignment.secondaryDoctor ? {
          id: assignment.secondaryDoctor.id,
          name: `${assignment.secondaryDoctor.user.firstName} ${assignment.secondaryDoctor.user.lastName}`.trim(),
          email: assignment.secondaryDoctor.user.email,
          specialty: assignment.secondaryDoctor.specialty?.name,
          organization: assignment.secondaryDoctor.hsps?.[0]?.user?.name
        } : null,
        consentDetails: {
          requiresConsent: assignment.consentRequired,
          consentStatus: assignment.consentStatus,
          accessGranted: assignment.accessGranted,
          consentGrantedAt: assignment.accessGrantedAt,
          otpInfo: consent ? {
            hasActiveOtp: !consent.isVerified && consent.expiresAt && new Date() < new Date(consent.expiresAt),
            isVerified: consent.isVerified,
            attemptsCount: consent.attemptsCount,
            lastOtpRequest: consent.createdAt
          } : null
        }
      }
    })

    // Generate summary
    const summary = {
      total_assignments: formattedAssignments.length,
      active_assignments: formattedAssignments.filter(a => a.isActive).length,
      granted_access: formattedAssignments.filter(a => a.consentDetails.accessGranted).length,
      pending_consent: formattedAssignments.filter(a => 
        a.consentDetails.requiresConsent && !a.consentDetails.accessGranted
      ).length
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
          name: `${session.user.name}`.trim()
        } : null
      }
    })

  } catch (error) {
    console.error('Secondary doctor assignments retrieval error:', error)
    return createErrorResponse(error as Error)
  }
})