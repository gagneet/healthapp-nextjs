/**
 * HIPAA Consent API for Healthcare Management Platform
 * Handles HIPAA privacy policy consent and terms acceptance
 * Requires authenticated session
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for HIPAA consent
const hipaaConsentSchema = z.object({
  hipaaConsented: z.boolean(),
  termsAccepted: z.boolean(),
  privacyPolicyAccepted: z.boolean(),
  consentVersion: z.string().optional().default("1.0"),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validation = hipaaConsentSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request", 
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    const { 
      hipaaConsented, 
      termsAccepted, 
      privacyPolicyAccepted,
      consentVersion,
      userAgent,
      ipAddress
    } = validation.data
    
    // Validate all required consents are true
    if (!hipaaConsented || !termsAccepted || !privacyPolicyAccepted) {
      return NextResponse.json(
        { 
          error: "All consents are required",
          message: "HIPAA consent, terms of service, and privacy policy acceptance are mandatory for healthcare platform access"
        },
        { status: 400 }
      )
    }
    
    try {
      // Record all consents with timestamps
      const updatedUser = await prisma.User.update({
        where: { id: session.user.id },
        data: {
          hipaa_consent_date: new Date(),
          terms_accepted_at: new Date(),
          privacy_policy_accepted_at: new Date(),
          updated_at: new Date()
        }
      })
      
      // Create detailed audit log for compliance
      await prisma.auditLog.create({
        data: {
          user_id: session.user.id,
          action: "HIPAA_CONSENT",
          resource: "privacy_compliance",
          access_granted: true,
          user_role: session.user.role || "UNKNOWN",
          data_changes: {
            hipaa_consented: hipaaConsented,
            terms_accepted: termsAccepted,
            privacy_policy_accepted: privacyPolicyAccepted,
            consent_version: consentVersion,
            consent_method: "web_form",
            user_agent: userAgent || request.headers.get('user-agent'),
            consent_timestamp: new Date().toISOString()
          },
          ip_address: ipAddress || request.ip || request.headers.get('x-forwarded-for') || null,
          user_agent: userAgent || request.headers.get('user-agent') || null,
          timestamp: new Date()
        }
      })
      
      // Check if user needs additional verification steps
      const requiresAdditionalVerification = updatedUser.role !== "PATIENT" && 
        (updatedUser.account_status === "PENDING_VERIFICATION" || 
         updatedUser.account_status === "ACTIVE")
      
      return NextResponse.json({
        success: true,
        message: "HIPAA consent and privacy policies accepted successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          accountStatus: updatedUser.account_status,
          hipaaConsentDate: updatedUser.hipaa_consent_date,
          termsAcceptedAt: updatedUser.terms_accepted_at,
          privacyPolicyAcceptedAt: updatedUser.privacy_policy_accepted_at
        },
        compliance: {
          hipaaCompliant: true,
          consentRecorded: true,
          auditTrailCreated: true,
          consentVersion: consentVersion
        },
        nextSteps: {
          ...(requiresAdditionalVerification && {
            verification: "Professional credentials verification required"
          }),
          ...(updatedUser.emailVerified && {
            accessGranted: "You can now access the healthcare platform"
          }),
          ...(!updatedUser.emailVerified && {
            emailVerification: "Please verify your email address to complete registration"
          })
        }
      })
      
    } catch (dbError) {
      console.error("Database error during HIPAA consent:", dbError)
      return NextResponse.json(
        { error: "Failed to record consent" },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error("HIPAA consent error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET method to retrieve current consent status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    // Get user's current consent status
    const user = await prisma.User.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        account_status: true,
        hipaa_consent_date: true,
        terms_accepted_at: true,
        privacy_policy_accepted_at: true,
        emailVerified: true,
        created_at: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    const hasHipaaConsent = !!user.hipaa_consent_date
    const hasTermsAccepted = !!user.terms_accepted_at
    const hasPrivacyAccepted = !!user.privacy_policy_accepted_at
    const hasEmailVerified = !!user.emailVerified
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountStatus: user.account_status
      },
      compliance: {
        hipaaConsent: {
          required: true,
          completed: hasHipaaConsent,
          completedAt: user.hipaa_consent_date
        },
        termsOfService: {
          required: true,
          completed: hasTermsAccepted,
          completedAt: user.terms_accepted_at
        },
        privacyPolicy: {
          required: true,
          completed: hasPrivacyAccepted,
          completedAt: user.privacy_policy_accepted_at
        },
        emailVerification: {
          required: true,
          completed: hasEmailVerified,
          completedAt: user.emailVerified
        }
      },
      overallCompliance: {
        isCompliant: hasHipaaConsent && hasTermsAccepted && hasPrivacyAccepted && hasEmailVerified,
        completedSteps: [
          hasHipaaConsent && "HIPAA",
          hasTermsAccepted && "Terms",
          hasPrivacyAccepted && "Privacy",
          hasEmailVerified && "Email"
        ].filter(Boolean),
        pendingSteps: [
          !hasHipaaConsent && "HIPAA consent required",
          !hasTermsAccepted && "Terms of service acceptance required", 
          !hasPrivacyAccepted && "Privacy policy acceptance required",
          !hasEmailVerified && "Email verification required"
        ].filter(Boolean)
      }
    })
    
  } catch (error) {
    console.error("HIPAA consent status check error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve consent status" },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
