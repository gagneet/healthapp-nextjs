/**
 * Healthcare Authentication Logout API
 * Invalidates session and clears cookie
 */

import { NextRequest, NextResponse } from "next/server"
import { HealthcareAuth } from "@/lib/auth/healthcare-auth"

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("healthcare_session")?.value

    if (sessionToken) {
      // Invalidate session in database
      await HealthcareAuth.logout(sessionToken)
    }

    // Create response and clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("healthcare_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/"
    })

    return response

  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}