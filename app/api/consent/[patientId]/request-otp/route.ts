/**
 * Request Patient Consent OTP API Route
 * Generate OTP for patient consent to secondary care access
 * Business Logic: Healthcare providers can request OTP for patient consent
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

const RequestOtpSchema = z.object({
  consentMethod: z.enum(['sms_otp', 'email_otp', 'in_person', 'phone_call']).optional().default('email_otp'),
  assignmentId: z.string().uuid().optional(),
  message: z.string().optional()
})

/**
 * POST /api/consent/:patientId/request-otp
 * Generate OTP for patient consent
 * Business Logic: Only assigned healthcare providers can request OTP
 */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can request consent OTP
  if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
    return createForbiddenResponse("Only healthcare providers can request consent OTP")
  }

  const { patientId } = params
  const body = await request.json()
  const validationResult = RequestOtpSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const { consentMethod, assignmentId, message } = validationResult.data

  try {
    // Get healthcare provider profile
    const providerProfile = session.user.role === 'DOCTOR' 
      ? await prisma.doctor.findFirst({ where: { userId: session.user.id } })
      : await prisma.hsp.findFirst({ where: { userId: session.user.id } })

    if (!providerProfile) {
      return createErrorResponse(new Error("Healthcare provider profile not found"))
    }

    // Find the assignment that requires consent
    let assignment
    if (assignmentId) {
      assignment = await prisma.patientDoctorAssignment.findFirst({
        where: {
          id: assignmentId,
          patientId: patientId,
          OR: [
            { secondaryDoctorId: providerProfile.id },
            { secondaryHspId: providerProfile.id }
          ]
        },
        include: {
          patient: {
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
          }
        }
      })
    } else {
      // Find any active assignment that requires consent
      assignment = await prisma.patientDoctorAssignment.findFirst({
        where: {
          patientId: patientId,
          OR: [
            { secondaryDoctorId: providerProfile.id },
            { secondaryHspId: providerProfile.id }
          ],
          requiresConsent: true,
          consentStatus: 'pending',
          isActive: true
        },
        include: {
          patient: {
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
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    if (!assignment) {
      return createErrorResponse(new Error("No assignment found requiring consent for this patient"))
    }

    if (!assignment.requiresConsent) {
      return createErrorResponse(new Error("Consent not required for this assignment"))
    }

    if (assignment.consentStatus === 'granted') {
      return createErrorResponse(new Error("Consent already granted for this assignment"))
    }

    // Check for existing active OTP
    const existingOtp = await prisma.patientConsentOtp.findFirst({
      where: {
        patientDoctorAssignmentId: assignment.id,
        expiresAt: { gt: new Date() },
        isVerified: false,
        isBlocked: false
      }
    })

    // Generate new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes expiry

    let otpRecord
    if (existingOtp) {
      // Update existing OTP
      otpRecord = await prisma.patientConsentOtp.update({
        where: { id: existingOtp.id },
        data: {
          otpCode: otpCode,
          expiresAt: expiresAt,
          verificationAttempts: 0,
          isBlocked: false,
          consentMethod: consentMethod,
          requestedBy: session.user.id,
          customMessage: message
        }
      })
    } else {
      // Create new OTP record
      otpRecord = await prisma.patientConsentOtp.create({
        data: {
          patientDoctorAssignmentId: assignment.id,
          otpCode: otpCode,
          expiresAt: expiresAt,
          consentMethod: consentMethod,
          requestedBy: session.user.id,
          customMessage: message,
          isVerified: false,
          isBlocked: false,
          verificationAttempts: 0
        }
      })
    }

    // TODO: Send OTP via chosen method
    // For now, we'll log it (in production, integrate with SMS/Email service)
    console.log(`OTP for patient ${patientId}: ${otpCode} (Method: ${consentMethod})`)

    // Mock delivery based on method
    const deliveryInfo = {
      sms_otp: {
        delivered_to: assignment.patient.user.phone,
        method: 'SMS',
        message: `Your consent OTP is: ${otpCode}. Valid for 15 minutes.`
      },
      email_otp: {
        delivered_to: assignment.patient.user.email,
        method: 'Email',
        subject: 'Healthcare Consent Verification'
      },
      in_person: {
        delivered_to: 'In-person verification',
        method: 'In-person',
        note: 'OTP to be verified during in-person consultation'
      },
      phone_call: {
        delivered_to: assignment.patient.user.phone,
        method: 'Phone call',
        note: 'OTP will be communicated via phone call'
      }
    }

    // Calculate remaining time for existing OTP
    const remainingTimeSeconds = Math.max(0, Math.floor((new Date(otpRecord.expiresAt).getTime() - Date.now()) / 1000))

    return createSuccessResponse({
      otp_generated: true,
      otp_exists: !!existingOtp,
      assignment_id: assignment.id,
      patient: {
        id: assignment.patient.id,
        name: `${assignment.patient.user.firstName} ${assignment.patient.user.lastName}`.trim(),
        email: assignment.patient.user.email,
        phone: assignment.patient.user.phone
      },
      otp_details: {
        expires_at: otpRecord.expiresAt,
        remaining_time_seconds: remainingTimeSeconds,
        consent_method: consentMethod,
        verification_attempts_remaining: 3 - otpRecord.verificationAttempts
      },
      delivery_info: deliveryInfo[consentMethod],
      provider_info: {
        id: providerProfile.id,
        name: `${session.user.firstName} ${session.user.lastName}`.trim(),
        role: session.user.role
      },
      instructions: {
        patient_action: `Patient should provide the OTP code received via ${consentMethod.replace('_', ' ')} to grant consent for secondary care access.`,
        expiry_note: 'OTP expires in 15 minutes from generation time.',
        verification_note: 'Maximum 3 verification attempts allowed before OTP is blocked.'
      }
    }, existingOtp ? 200 : 201)

  } catch (error) {
    console.error('OTP request error:', error)
    return createErrorResponse(error as Error)
  }
})