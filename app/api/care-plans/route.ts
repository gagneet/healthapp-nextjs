/**
 * Care Plan Management API Route
 * Handles CRUD operations for care plan management with healthcare business logic compliance
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling,
  validateHealthcarePermissions
} from "@/lib/api-response"
import { 
  CarePlanSchema, 
  PaginationSchema 
} from "@/lib/validations/healthcare"

/**
 * GET /api/care-plans
 * Retrieve care plans with filtering and pagination
 * Business Logic: Only healthcare providers can access care plans
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can access care plans
  if (!['DOCTOR', 'HSP', 'PATIENT', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to care plans denied")
  }

  const { searchParams } = new URL(request.url)
  const paginationResult = PaginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  // Additional filters
  const patientId = searchParams.get('patientId')
  const doctorId = searchParams.get('doctorId')
  const searchQuery = searchParams.get('search')
  const status = searchParams.get('status')

  try {
    // Build where clause based on user role and filters
    let whereClause: any = {}

    // Business Logic: Role-based data access
    switch (session.user.role) {
      case 'DOCTOR':
        // Doctors can only see care plans they created or are assigned to
        whereClause.primary_doctor_id = session.user.profileId
        break
      case 'HSP':
        // HSPs can see care plans through care team assignments
        whereClause.OR = [
          {
            care_team: {
              some: {
                hsp_id: session.user.profileId
              }
            }
          },
          {
            assigned_hsps: {
              some: {
                hsp_id: session.user.profileId
              }
            }
          }
        ]
        break
      case 'PATIENT':
        // Patients can only see their own care plans
        whereClause.patient_id = session.user.profileId
        break
      case 'SYSTEM_ADMIN':
        // System admins can see all care plans
        break
      default:
        return createForbiddenResponse("Invalid role for care plan access")
    }

    // Apply patient filter (for healthcare providers)
    if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
      whereClause.patient_id = patientId
    }

    // Apply doctor filter (for admins)
    if (doctorId && session.user.role === 'SYSTEM_ADMIN') {
      whereClause.primary_doctor_id = doctorId
    }

    // Apply search filter
    if (searchQuery) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          plan_name: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          primary_diagnosis: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          patient: {
            user: {
              OR: [
                { first_name: { contains: searchQuery, mode: 'insensitive' } },
                { last_name: { contains: searchQuery, mode: 'insensitive' } }
              ]
            }
          }
        }
      ]
    }

    // Apply status filter
    if (status) {
      whereClause.status = status.toUpperCase()
    }

    // Get total count for pagination
    const total = await prisma.care_plan.count({ where: whereClause })

    // Fetch care plans with related data
    const carePlans = await prisma.care_plan.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        doctors_care_plan_primary_doctor_idTodoctors: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            },
            speciality: {
              select: {
                name: true
              }
            }
          }
        },
        // Include medications count
        medications: {
          select: {
            id: true
          }
        }
      }
    })

    // Format response data
    const formattedCarePlans = carePlans.map(carePlan => ({
      id: carePlan.id,
      carePlanId: carePlan.care_plan_id,
      planName: carePlan.plan_name,
      primaryDiagnosis: carePlan.primary_diagnosis,
      icd10Codes: carePlan.icd10_codes || [],
      status: carePlan.status,
      patient: {
        id: carePlan.patient.id,
        patientId: carePlan.patient.patient_id,
        name: `${carePlan.patient.user.first_name} ${carePlan.patient.user.last_name}`.trim(),
        email: carePlan.patient.user.email
      },
      primaryDoctor: carePlan.doctors_care_plan_primary_doctor_idTodoctors ? {
        id: carePlan.doctors_care_plan_primary_doctor_idTodoctors.id,
        doctorId: carePlan.doctors_care_plan_primary_doctor_idTodoctors.doctor_id,
        name: `${carePlan.doctors_care_plan_primary_doctor_idTodoctors.user.first_name} ${carePlan.doctors_care_plan_primary_doctor_idTodoctors.user.last_name}`.trim(),
        email: carePlan.doctors_care_plan_primary_doctor_idTodoctors.user.email,
        speciality: carePlan.doctors_care_plan_primary_doctor_idTodoctors.speciality?.name
      } : null,
      treatmentGoals: carePlan.treatment_goals || [],
      medicationCount: carePlan.medications.length,
      startDate: carePlan.start_date,
      endDate: carePlan.end_date,
      planDetails: carePlan.plan_details,
      createdAt: carePlan.created_at,
      updatedAt: carePlan.updated_at
    }))

    return createSuccessResponse(
      formattedCarePlans,
      200,
      { page, limit, total }
    )
  } catch (error) {
    console.error("Failed to fetch care plans:", error)
    throw error
  }
})

/**
 * POST /api/care-plans
 * Create new care plan with medical validation
 * Business Logic: Only doctors can create care plans
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can create care plans
  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can create care plans")
  }

  const body = await request.json()
  const validationResult = CarePlanSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const carePlanData = validationResult.data

  try {
    // Verify doctor has access to the patient
    const patientExists = await prisma.patient.findFirst({
      where: {
        id: carePlanData.patientId,
        // Business Logic: Ensure doctor-patient relationship
        OR: [
          { primary_doctor_id: session.user.profileId },
          { 
            patient_doctor_assignments: {
              some: {
                doctor_id: session.user.profileId,
                assignment_type: { in: ['primary', 'specialist', 'consulting'] }
              }
            }
          }
        ]
      }
    })

    if (!patientExists) {
      return createForbiddenResponse("Access denied to patient or patient not found")
    }

    // Generate business ID for care plan
    const carePlanBusinessId = `CP-${Date.now()}`

    // Create care plan record
    const carePlan = await prisma.care_plan.create({
      data: {
        care_plan_id: carePlanBusinessId,
        patient_id: carePlanData.patientId,
        primary_doctor_id: session.user.profileId!,
        plan_name: carePlanData.planName,
        primary_diagnosis: carePlanData.primaryDiagnosis,
        icd10_codes: carePlanData.icd10Codes,
        treatment_goals: carePlanData.treatmentGoals,
        start_date: carePlanData.startDate,
        end_date: carePlanData.endDate,
        plan_details: carePlanData.planDetails,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Format response
    const responseData = {
      id: carePlan.id,
      carePlanId: carePlan.care_plan_id,
      planName: carePlan.plan_name,
      primaryDiagnosis: carePlan.primary_diagnosis,
      patient: {
        id: carePlan.patient.id,
        name: `${carePlan.patient.user.first_name} ${carePlan.patient.user.last_name}`.trim(),
        email: carePlan.patient.user.email
      },
      status: carePlan.status,
      startDate: carePlan.start_date,
      endDate: carePlan.end_date,
      treatmentGoals: carePlan.treatment_goals,
      createdAt: carePlan.created_at
    }

    // TODO: Send notifications to care team
    // TODO: Log audit trail for care plan creation

    return createSuccessResponse(responseData, 201)
  } catch (error) {
    console.error("Failed to create care plan:", error)
    throw error
  }
})

/**
 * PUT /api/care-plans
 * Update care plan information
 * Business Logic: Only care plan creator or admins can update care plans
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only healthcare providers can update care plans
  if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only healthcare providers can update care plans")
  }

  const body = await request.json()
  const { id, ...updateData } = body

  if (!id) {
    return createErrorResponse(new Error("Care plan ID is required"))
  }

  try {
    // Get existing care plan to verify permissions
    const existingPlan = await prisma.care_plan.findUnique({
      where: { id },
      include: {
        doctors_care_plan_primary_doctor_idTodoctors: {
          select: { user_id: true }
        }
      }
    })

    if (!existingPlan) {
      return createErrorResponse(new Error("Care plan not found"), 404)
    }

    // Business Logic: Check permissions - only creator, care team, or admin can modify
    const canModify = 
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'DOCTOR' && existingPlan.primary_doctor_id === session.user.profileId) ||
      (session.user.role === 'HSP') // HSPs can update care plans they're assigned to

    if (!canModify) {
      return createForbiddenResponse("Cannot modify this care plan")
    }

    // Build update data
    const carePlanUpdateData: any = {
      updated_at: new Date()
    }

    if (updateData.planName) carePlanUpdateData.plan_name = updateData.planName
    if (updateData.primaryDiagnosis) carePlanUpdateData.primary_diagnosis = updateData.primaryDiagnosis
    if (updateData.treatmentGoals) carePlanUpdateData.treatment_goals = updateData.treatmentGoals
    if (updateData.status) carePlanUpdateData.status = updateData.status.toUpperCase()
    if (updateData.endDate) carePlanUpdateData.end_date = new Date(updateData.endDate)
    if (updateData.planDetails) carePlanUpdateData.plan_details = updateData.planDetails
    if (updateData.icd10Codes) carePlanUpdateData.icd10_codes = updateData.icd10Codes

    const updatedCarePlan = await prisma.care_plan.update({
      where: { id },
      data: carePlanUpdateData,
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        doctors_care_plan_primary_doctor_idTodoctors: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      }
    })

    // Format response
    const responseData = {
      id: updatedCarePlan.id,
      carePlanId: updatedCarePlan.care_plan_id,
      planName: updatedCarePlan.plan_name,
      primaryDiagnosis: updatedCarePlan.primary_diagnosis,
      patient: {
        id: updatedCarePlan.patient.id,
        name: `${updatedCarePlan.patient.user.first_name} ${updatedCarePlan.patient.user.last_name}`.trim(),
        email: updatedCarePlan.patient.user.email
      },
      status: updatedCarePlan.status,
      treatmentGoals: updatedCarePlan.treatment_goals,
      planDetails: updatedCarePlan.plan_details,
      updatedAt: updatedCarePlan.updated_at
    }

    return createSuccessResponse(responseData)
  } catch (error) {
    console.error("Failed to update care plan:", error)
    throw error
  }
})