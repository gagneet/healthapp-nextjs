/**
 * Verify Patient Consent OTP API Route
 * Verify OTP for patient consent to grant secondary care access
 * Business Logic: Healthcare providers and patients can verify OTP
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

const VerifyOtpSchema = z.object({
  otpCode: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only numbers"),
  assignmentId: z.string().uuid().optional(),
  verifiedBy: z.enum(['patient', 'provider']).optional().default('provider')
})

/**
 * POST /api/consent/:patientId/verify-otp
 * Verify OTP for patient consent
 * Business Logic: Healthcare providers and patients can verify OTP
 */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { patientId: string } }) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Healthcare providers and patients can verify OTP
  if (!['DOCTOR', 'HSP', 'PATIENT'].includes(session.user.role)) {
    return createForbiddenResponse("Only healthcare providers and patients can verify consent OTP")
  }

  const { patientId } = params
  const body = await request.json()
  const validationResult = VerifyOtpSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const { otpCode, assignmentId, verifiedBy } = validationResult.data

  try {
    // Verify patient access for patients
    if (session.user.role === 'PATIENT') {
      const patientProfile = await prisma.patient.findFirst({ 
        where: { userId: session.user.id } 
      })
      
      if (!patientProfile || patientProfile.id !== patientId) {
        return createForbiddenResponse("Patients can only verify OTP for their own consent")
      }
    }

    // Get healthcare provider profile (if applicable)
    let providerProfile = null
    if (session.user.role !== 'PATIENT') {
      providerProfile = session.user.role === 'DOCTOR' 
        ? await prisma.doctor.findFirst({ where: { userId: session.user.id } })
        : await prisma.hsp.findFirst({ where: { userId: session.user.id } })

      if (!providerProfile) {
        return createErrorResponse(new Error("Healthcare provider profile not found"))
      }
    }

    // Find the assignment and OTP
    let assignment
    if (assignmentId) {
      assignment = await prisma.patientDoctorAssignment.findFirst({
        where: {
          id: assignmentId,
          patientId: patientId
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
        }
      })
    } else {
      // Find the most recent active assignment requiring consent
      let assignmentWhere: any = {
        patientId: patientId,
        requiresConsent: true,
        consentStatus: 'pending',
        isActive: true
      }

      if (providerProfile) {
        assignmentWhere.OR = [
          { secondaryDoctorId: providerProfile.id },
          { secondaryHspId: providerProfile.id }
        ]
      }

      assignment = await prisma.patientDoctorAssignment.findFirst({
        where: assignmentWhere,
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
    }

    if (!assignment) {
      return createErrorResponse(new Error("No assignment found requiring consent for this patient"))
    }

    // Find active OTP for this assignment
    const otpRecord = await prisma.patientConsentOtp.findFirst({
      where: {
        patientDoctorAssignmentId: assignment.id,
        expiresAt: { gt: new Date() },
        isVerified: false,
        isBlocked: false
      }
    })

    if (!otpRecord) {
      return createErrorResponse(new Error("No active OTP found. Please request a new OTP."))
    }

    // Check if OTP is correct
    if (otpRecord.otpCode !== otpCode) {
      // Increment verification attempts
      const updatedOtp = await prisma.patientConsentOtp.update({
        where: { id: otpRecord.id },
        data: {
          verificationAttempts: { increment: 1 },
          // Block OTP if max attempts reached
          isBlocked: otpRecord.verificationAttempts >= 2 // 3 attempts total (0, 1, 2)
        }
      })

      if (updatedOtp.isBlocked) {
        return createErrorResponse(new Error("OTP verification blocked due to too many incorrect attempts. Please request a new OTP."))
      }

      return createErrorResponse(new Error(`Incorrect OTP. ${2 - updatedOtp.verificationAttempts} attempts remaining.`))
    }

    // OTP is correct - verify it and grant access
    await prisma.$transaction(async (tx) => {
      // Mark OTP as verified
      await tx.patientConsentOtp.update({
        where: { id: otpRecord.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          verificationMethod: verifiedBy
        }
      })

      // Grant access in the assignment
      await tx.patientDoctorAssignment.update({
        where: { id: assignment.id },
        data: {
          consentStatus: 'granted',
          accessGranted: true,
          consentGrantedAt: new Date(),
          consentGrantedBy: session.user.id
        }
      })
    })

    // Determine secondary provider info
    const secondaryProvider = assignment.secondaryDoctor || assignment.secondaryHsp
    const providerType = assignment.secondaryDoctor ? 'doctor' : 'hsp'

    return createSuccessResponse({
      verification_successful: true,
      accessGranted: true,
      verified_at: new Date().toISOString(),
      assignment_id: assignment.id,
      patient: {
        id: assignment.patient.id,
        name: `${assignment.patient.user.firstName} ${assignment.patient.user.lastName}`.trim(),
        email: assignment.patient.user.email
      },
      secondary_provider: secondaryProvider ? {
        id: secondaryProvider.id,
        name: `${secondaryProvider.user.firstName} ${secondaryProvider.user.lastName}`.trim(),
        type: providerType
      } : null,
      consent_details: {
        consentStatus: 'granted',
        consent_method: otpRecord.consentMethod,
        verified_by_role: session.user.role,
        verified_by_name: `${session.user.firstName} ${session.user.lastName}`.trim(),
        assignment_reason: assignment.assignmentReason,
        specialtyFocus: assignment.specialtyFocus || [],
        expires_at: assignment.expiresAt
      },
      next_steps: {
        for_provider: "You now have access to this patient's medical records and can provide secondary care as per the assignment.",
        for_patient: "Your consent has been recorded. The assigned healthcare provider can now access your medical information for the specified care."
      }
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return createErrorResponse(error as Error)
  }
})