/**
 * Assignment Request Consent API Route
 * Request patient consent for a specific assignment
 * Business Logic: Assigned doctors can request consent for their assignments
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

const RequestConsentSchema = z.object({
  consentMethod: z.enum(['sms_otp', 'email_otp', 'in_person', 'phone_call']).optional().default('email_otp'),
  customMessage: z.string().optional()
})

/**
 * POST /api/assignments/:id/request-consent
 * Request patient consent for assignment
 * Business Logic: Only assigned doctors can request consent
 */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can request consent
  if (!['DOCTOR'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors can request patient consent")
  }

  const { id: assignmentId } = params
  const body = await request.json()
  const validationResult = RequestConsentSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const { consentMethod, customMessage } = validationResult.data

  try {
    // Get requesting doctor profile
    const requestingDoctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id }
    })

    if (!requestingDoctor) {
      return createErrorResponse(new Error("Doctor profile not found"))
    }

    // Get assignment and verify doctor has access
    const assignment = await prisma.patientDoctorAssignment.findFirst({
      where: {
        id: assignmentId,
        OR: [
          { assignedByDoctorId: requestingDoctor.id },
          { doctorId: requestingDoctor.id }
        ]
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true }
            }
          }
        },
        assignedByDoctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    })

    if (!assignment) {
      return createErrorResponse(new Error("Assignment not found or access denied"))
    }

    if (!assignment.patientConsentRequired) {
      return createErrorResponse(new Error("Consent not required for this assignment"))
    }

    if (assignment.patientConsentStatus === 'GRANTED') {
      return createErrorResponse(new Error("Consent already granted for this assignment"))
    }

    if (!assignment.isActive) {
      return createErrorResponse(new Error("Cannot request consent for inactive assignment"))
    }

    // Check for existing active OTP
    const existingOtp = await prisma.patientConsentOtp.findFirst({
      where: {
        secondaryAssignmentId: assignmentId,
        expiresAt: { gt: new Date() },
        isVerified: false,
        isBlocked: false
      }
    })

    if (existingOtp) {
      const remainingTime = Math.max(0, Math.floor((new Date(existingOtp.expiresAt).getTime() - Date.now()) / 1000))
      
      return createSuccessResponse({
        otp_already_exists: true,
        assignment_id: assignmentId,
        existing_otp: {
          expires_at: existingOtp.expiresAt,
          remaining_time_seconds: remainingTime,
          consent_method: existingOtp.otpMethod,
          verification_attempts_remaining: (existingOtp.maxAttempts || 3) - (existingOtp.attemptsCount || 0)
        },
        message: "Active OTP already exists. Please use existing OTP or wait for expiration."
      })
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes expiry

    const otpRecord = await prisma.patientConsentOtp.create({
      data: {
        id: crypto.randomUUID(),
        secondaryAssignmentId: assignmentId,
        patientId: assignment.patientId,
        primaryDoctorId: assignment.assignedByDoctorId || requestingDoctor.id,
        secondaryDoctorId: assignment.doctorId,
        otpCode,
        otpMethod: consentMethod === 'sms_otp' ? 'SMS' : consentMethod === 'email_otp' ? 'EMAIL' : 'BOTH',
        patientPhone: assignment.patient?.user.phone,
        patientEmail: assignment.patient?.user.email,
        generatedAt: new Date(),
        expiresAt,
        requestedByUserId: session.user.id,
        isVerified: false,
        isBlocked: false,
        attemptsCount: 0,
        maxAttempts: 3
      }
    })

    // TODO: Send OTP via chosen method (SMS/Email integration)
    console.log(`Consent OTP for assignment ${assignmentId}: ${otpCode} (Method: ${consentMethod})`)

    const remainingTime = Math.floor((new Date(otpRecord.expiresAt).getTime() - Date.now()) / 1000)

    return createSuccessResponse({
      consent_request_sent: true,
      assignment_id: assignmentId,
      patient: assignment.patient?.user ? {
        id: assignment.patient.id,
        name: `${assignment.patient.user.firstName} ${assignment.patient.user.lastName}`.trim(),
        email: assignment.patient.user.email,
        phone: assignment.patient.user.phone
      } : null,
      assignment_info: {
        assignmentType: assignment.assignmentType,
        assignment_reason: assignment.assignmentReason,
        doctors: assignment.assignedByDoctor?.user ?
          `${assignment.assignedByDoctor.user.firstName} ${assignment.assignedByDoctor.user.lastName}`.trim() : null,
        secondary_doctor: assignment.doctor?.user ?
          `${assignment.doctor.user.firstName} ${assignment.doctor.user.lastName}`.trim() : null
      },
      otp_details: {
        consent_method: consentMethod,
        expires_at: otpRecord.expiresAt,
        remaining_time_seconds: remainingTime,
        verification_attempts_allowed: 3
      },
      next_steps: {
        for_doctor: "OTP has been sent to patient. Patient needs to provide OTP to grant consent.",
        for_patient: `Patient should check their ${consentMethod.replace('_', ' ')} for the consent verification code.`
      }
    }, 201)

  } catch (error) {
    console.error('Assignment consent request error:', error)
    return createErrorResponse(error as Error)
  }
})