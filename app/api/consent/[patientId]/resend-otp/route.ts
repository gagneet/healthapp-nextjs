/**
 * Resend Patient Consent OTP API Route
 * Resend OTP for patient consent (generates new OTP)
 * Business Logic: Healthcare providers can resend OTP when needed
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

const ResendOtpSchema = z.object({
  assignmentId: z.string().uuid().optional(),
  consentMethod: z.enum(['sms_otp', 'email_otp', 'in_person', 'phone_call']).optional(),
  reason: z.string().min(5, "Reason for resending OTP is required").optional().default("OTP resend requested")
})

/**
 * POST /api/consent/:patientId/resend-otp
 * Resend OTP for patient consent (generates new OTP)
 * Business Logic: Healthcare providers can resend OTP
 */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can resend consent OTP
  if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
    return createForbiddenResponse("Only healthcare providers can resend consent OTP")
  }

  const { patientId } = params
  const body = await request.json()
  const validationResult = ResendOtpSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const { assignmentId, consentMethod, reason } = validationResult.data

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
          patientConsentRequired: true,
          patientConsentStatus: 'PENDING',
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

    if (!assignment.patientConsentRequired) {
      return createErrorResponse(new Error("Consent not required for this assignment"))
    }

    if (assignment.patientConsentStatus === 'GRANTED') {
      return createErrorResponse(new Error("Consent already granted for this assignment"))
    }

    // Get existing OTP to determine consent method if not provided
    const existingOtp = await prisma.patientConsentOtp.findFirst({
      where: {
        patientDoctorAssignmentId: assignment.id
      },
      orderBy: { createdAt: 'desc' }
    })

    const finalConsentMethod = consentMethod || existingOtp?.consentMethod || 'email_otp'

    // Check rate limiting (no more than 3 OTPs in 30 minutes)
    const recentOtps = await prisma.patientConsentOtp.count({
      where: {
        patientDoctorAssignmentId: assignment.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      }
    })

    if (recentOtps >= 3) {
      return createErrorResponse(new Error("Too many OTP requests. Please wait 30 minutes before requesting again."))
    }

    // Invalidate all previous OTPs for this assignment
    await prisma.patientConsentOtp.updateMany({
      where: {
        patientDoctorAssignmentId: assignment.id,
        isVerified: false
      },
      data: {
        isBlocked: true,
        notes: 'Invalidated due to OTP resend request'
      }
    })

    // Generate new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes expiry

    // Create new OTP record
    const newOtpRecord = await prisma.patientConsentOtp.create({
      data: {
        id: crypto.randomUUID(),
        secondaryAssignmentId: crypto.randomUUID(), // Generate a temporary ID
        patientDoctorAssignmentId: assignment.id,
        patientId: assignment.patientId,
        primaryDoctorId: assignment.primaryDoctorId || assignment.doctorId,
        otpCode: otpCode,
        expiresAt: expiresAt,
        consentMethod: finalConsentMethod,
        requestedByUserId: session.user.id,
        customMessage: `OTP resent - Reason: ${reason}`,
        isVerified: false,
        isBlocked: false,
        verificationAttempts: 0
      }
    })

    // TODO: Send OTP via chosen method
    // For now, we'll log it (in production, integrate with SMS/Email service)
    console.log(`Resent OTP for patient ${patientId}: ${otpCode} (Method: ${finalConsentMethod})`)

    // Mock delivery based on method
    const deliveryInfo = {
      sms_otp: {
        delivered_to: assignment.patient.user.phone,
        method: 'SMS',
        message: `Your NEW consent OTP is: ${otpCode}. Previous OTP is now invalid. Valid for 15 minutes.`
      },
      email_otp: {
        delivered_to: assignment.patient.user.email,
        method: 'Email',
        subject: 'NEW Healthcare Consent Verification OTP'
      },
      in_person: {
        delivered_to: 'In-person verification',
        method: 'In-person',
        note: 'New OTP to be verified during in-person consultation'
      },
      phone_call: {
        delivered_to: assignment.patient.user.phone,
        method: 'Phone call',
        note: 'New OTP will be communicated via phone call'
      }
    }

    // Calculate remaining time
    const remainingTimeSeconds = Math.floor((new Date(newOtpRecord.expiresAt).getTime() - Date.now()) / 1000)

    return createSuccessResponse({
      otp_resent: true,
      previous_otp_invalidated: true,
      assignment_id: assignment.id,
      patient: {
        id: assignment.patient.id,
        name: `${assignment.patient.user.firstName} ${assignment.patient.user.lastName}`.trim(),
        email: assignment.patient.user.email,
        phone: assignment.patient.user.phone
      },
      new_otp_details: {
        expires_at: newOtpRecord.expiresAt,
        remaining_time_seconds: remainingTimeSeconds,
        consent_method: finalConsentMethod,
        verification_attempts_remaining: 3
      },
      delivery_info: deliveryInfo[finalConsentMethod as keyof typeof deliveryInfo],
      resend_info: {
        reason: reason,
        resent_by: `${session.user.firstName} ${session.user.lastName}`.trim(),
        resent_at: new Date().toISOString(),
        total_resends_today: recentOtps + 1,
        remaining_resends_in_30min: Math.max(0, 3 - (recentOtps + 1))
      },
      instructions: {
        patient_action: `Patient should use the NEW OTP code received via ${finalConsentMethod.replace('_', ' ')}. Previous OTP codes are no longer valid.`,
        expiry_note: 'New OTP expires in 15 minutes from generation time.',
        verification_note: 'Maximum 3 verification attempts allowed before OTP is blocked.',
        rate_limit_note: recentOtps >= 2 ? 'This is your final OTP request for the next 30 minutes.' : undefined
      }
    })

  } catch (error) {
    console.error('OTP resend error:', error)
    return createErrorResponse(error as Error)
  }
})