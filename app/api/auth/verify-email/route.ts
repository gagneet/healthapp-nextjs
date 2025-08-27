/**
 * Email Verification API for Healthcare Management Platform
 * Auth.js v5 Compatible - Handles email verification tokens
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for email verification
const verifyEmailSchema = z.object({
  token: z.string().uuid("Invalid verification token format"),
  email: z.string().email("Invalid email format").toLowerCase().trim()
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = verifyEmailSchema.safeParse(body)
    
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
    
    const { token, email } = validation.data
    
    // Find user with matching email and verification token
    const user = await prisma.user.findFirst({
      where: {
        email,
        emailVerificationToken: token,
        accountStatus: "PENDING_VERIFICATION"
      }
    })
    
    if (!user || !user.id || typeof user.id !== 'string') {
      return NextResponse.json(
        { 
          error: "Invalid or expired verification token",
          message: "The verification link is invalid or has already been used"
        },
        { status: 400 }
      )
    }
    
    try {
      // Update user as verified using Auth.js v5 compatible fields
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null,
          accountStatus: "ACTIVE",
          updatedAt: new Date()
        }
      })
      
      // ✅ Create audit log for email verification
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "EMAIL_VERIFICATION",
          resource: "user_account",
          accessGranted: true,
          userRole: user.role,
          dataChanges: {
            accountActivated: true,
            verificationMethod: "email_token"
          },
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || null,
          timestamp: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          accountStatus: updatedUser.accountStatus,
          emailVerified: true,
          role: updatedUser.role
        },
        nextSteps: {
          signin: "You can now sign in to your account",
          ...(user.role !== "PATIENT" && {
            verification: "Professional credentials verification may be required"
          }),
          hipaaConsent: "Please review and accept HIPAA privacy policies"
        }
      })
      
    } catch (dbError) {
      console.error("Database error during email verification:", dbError)
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error("Email verification error:", error)
    
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

// GET method to verify token via URL parameters (for email links)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing verification parameters" },
        { status: 400 }
      )
    }
    
    // Use the same verification logic as POST
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ token, email })
    }))
    
  } catch (error) {
    console.error("Email verification GET error:", error)
    return NextResponse.json(
      { error: "Invalid verification link" },
      { status: 400 }
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
