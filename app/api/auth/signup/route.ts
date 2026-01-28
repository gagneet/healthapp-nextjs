/**
 * Sign-Up API - Creates user with hashed password
 * Keep separate from NextAuth - this creates users, NextAuth handles sign-in
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"


const signUpSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(12, "Password must be at least 12 characters"),
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  role: z.enum(["SYSTEM_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "HSP", "PATIENT", "CAREGIVER"]).default("PATIENT"),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const validationResult = signUpSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, role, phone } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    // Hash password with bcrypt (cost 12 as per security guide)
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: passwordHash,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        role: role,
        phone,
        accountStatus: 'ACTIVE', // Set to PENDING_VERIFICATION if email verification required
        emailVerifiedLegacy: false, // Will be true after email verification
      }
    })

    // Return success (don't include password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Sign-up error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
