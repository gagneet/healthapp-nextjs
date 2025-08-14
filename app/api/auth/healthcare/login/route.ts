/**
 * Healthcare Authentication Login API
 * Handles username/password authentication with database sessions
 */

import { NextRequest, NextResponse } from "next/server"
import { HealthcareAuth } from "@/lib/auth/healthcare-auth"
import { z } from "zod"

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = LoginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid input", 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data
    const ipAddress = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Authenticate user
    const authResult = await HealthcareAuth.authenticate(
      email, 
      password, 
      ipAddress, 
      userAgent
    )

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
        name: authResult.user!.full_name || `${authResult.user!.first_name} ${authResult.user!.last_name}`.trim(),
        role: authResult.user!.role,
        accountStatus: authResult.user!.account_status,
        permissions: HealthcareAuth.getHealthcarePermissions(authResult.user!),
        lastLoginAt: authResult.user!.last_login_at
      }
    })

    // Set secure session cookie
    response.cookies.set("healthcare_session", authResult.session!.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/"
    })

    return response

  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}