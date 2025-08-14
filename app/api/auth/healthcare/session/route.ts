/**
 * Healthcare Authentication Session API
 * Returns current user session information
 */

import { NextRequest, NextResponse } from "next/server"
import { HealthcareAuth } from "@/lib/auth/healthcare-auth"

export async function GET(request: NextRequest) {
  try {
    const session = await HealthcareAuth.getCurrentSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "No active session" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.full_name || `${session.user.first_name} ${session.user.last_name}`.trim(),
        role: session.user.role,
        accountStatus: session.user.account_status,
        permissions: HealthcareAuth.getHealthcarePermissions(session.user),
        lastLoginAt: session.user.last_login_at,
        // Healthcare-specific profile data
        profileData: session.user.role === "DOCTOR" ? session.user.doctors_doctors_user_idTousers :
                     session.user.role === "PATIENT" ? session.user.patient :
                     session.user.role === "HSP" ? session.user.hsps_hsps_user_idTousers :
                     session.user.healthcare_provider
      },
      session: {
        expiresAt: session.expires_at,
        createdAt: session.created_at
      }
    })

  } catch (error) {
    console.error("Session API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}