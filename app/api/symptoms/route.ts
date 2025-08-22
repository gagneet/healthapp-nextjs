/**
 * Symptoms Management API Route
 * Handles symptom recording and retrieval with 2D/3D body mapping support
 * Business Logic: Patients can record symptoms, healthcare providers can manage symptoms
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
import { 
  SymptomSchema, 
  PaginationSchema 
} from "@/lib/validations/healthcare"

/**
 * GET /api/symptoms
 * Retrieve patient symptoms with filtering and pagination
 * Business Logic: Patients can view their own symptoms, healthcare providers can view patient symptoms
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only patients and healthcare providers can access symptoms
  if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Access to symptoms denied")
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
  const searchQuery = searchParams.get('search')
  const category = searchParams.get('category')
  const severity = searchParams.get('severity')

  // Build where clause based on user role and filters
  let whereClause: any = {}

  // Business Logic: Role-based data access
  switch (session.user.role) {
      case 'PATIENT':
        // Patients can only see their own symptoms
        whereClause.patient_id = session.user.profileId
        break
      case 'DOCTOR':
        // Doctors can see symptoms for their patients
        whereClause.patient = {
          primary_doctor_id: session.user.profileId
        }
        break
      case 'HSP':
        // HSPs can see symptoms for patients in their care
        whereClause.patient = {
          care_team: {
            some: {
              hsp_id: session.user.profileId
            }
          }
        }
        break
      case 'SYSTEM_ADMIN':
        // System admins can see all symptoms
        break
      default:
        return createForbiddenResponse("Invalid role for symptom access")
  }

  // Apply patient filter (for healthcare providers)
  if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    whereClause.patient_id = patientId
  }

  // Apply search filter on symptom names
  if (searchQuery) {
    whereClause.symptoms = {
      some: {
        name: { contains: searchQuery, mode: 'insensitive' }
      }
    }
  }

  // Apply category filter
  if (category) {
    whereClause.symptoms = {
      some: {
        category: category.toLowerCase()
      }
    }
  }

  // Apply severity filter
  if (severity) {
    whereClause.symptoms = {
      some: {
        severity: severity.toUpperCase()
      }
    }
  }

  // Get total count for pagination
  const total = await prisma.symptom.count({ where: whereClause })

  // Fetch symptoms with related data
  const patientSymptoms = await prisma.symptom.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy === 'createdAt' ? 'created_at' : sortBy as string]: sortOrder as 'asc' | 'desc'
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
        }
      }
    })

    // Format response data
    const formattedSymptoms = patientSymptoms.map(record => ({
      id: record.id,
      patient: {
        id: record.patient.id,
        patientId: record.patient.patient_id,
        name: `${record.patient.user.first_name} ${record.patient.user.last_name}`.trim(),
        email: record.patient.user.email
      },
      symptomName: record.symptom_name,
      description: record.description,
      onsetTime: record.onset_time,
      bodyLocation: record.body_location || {},
      severity: record.severity,
      triggers: record.triggers || [],
      relievingFactors: record.relieving_factors || [],
      associatedSymptoms: record.associated_symptoms || [],
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }))

    return createSuccessResponse(
      formattedSymptoms,
      200,
      { page, limit, total }
    );
})

/**
 * POST /api/symptoms
 * Record patient symptoms with 2D/3D body mapping support
 * Business Logic: Patients can record their own symptoms, healthcare providers can record for patients
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only patients and healthcare providers can record symptoms
  if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only patients and healthcare providers can record symptoms")
  }

  const body = await request.json()
  const validationResult = SymptomSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const symptomData = validationResult.data
  let targetPatientId: string

    // Business Logic: Determine which patient the symptoms are for
    if (symptomData.patientId) {
      // Healthcare provider recording symptoms for a patient
      if (session.user.role === 'PATIENT') {
        return createForbiddenResponse("Patients can only record their own symptoms")
      }

      // Verify healthcare provider has access to the patient
      const patientAccess = await prisma.Patient.findFirst({
        where: {
          id: symptomData.patientId,
          OR: [
            { primary_care_doctor_id: session.user.profileId },
            { primary_care_hsp_id: session.user.profileId }
          ]
        }
      })

      if (!patientAccess && session.user.role !== 'SYSTEM_ADMIN') {
        return createForbiddenResponse("Access denied to patient")
      }

      targetPatientId = symptomData.patientId
    } else {
      // Patient recording their own symptoms
      if (session.user.role !== 'PATIENT') {
        return createErrorResponse(new Error("Patient ID is required for healthcare providers"))
      }

      if (!session.user.profileId) {
        return createErrorResponse(new Error("Patient profile not found"))
      }

      targetPatientId = session.user.profileId
    }

    // Create symptom record with 2D/3D body mapping support
    const symptomRecord = await prisma.symptom.create({
      data: {
        patient_id: targetPatientId,
        symptom_name: symptomData.symptoms[0]?.name || 'General symptoms',
        severity: typeof symptomData.symptoms[0]?.severity === 'number' 
          ? symptomData.symptoms[0].severity 
          : (symptomData.symptoms[0]?.severity === 'SEVERE' ? 5 : 
             symptomData.symptoms[0]?.severity === 'MODERATE' ? 3 : 1),
        description: symptomData.additionalNotes || symptomData.symptoms[0]?.description,
        body_location: symptomData.bodyMapping || {},
        onset_time: symptomData.onsetDate ? new Date(symptomData.onsetDate) : new Date(),
        recorded_at: new Date(),
        triggers: [],
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
      id: symptomRecord.id,
      patient: {
        id: symptomRecord.patient.id,
        patientId: symptomRecord.patient.patient_id,
        name: `${symptomRecord.patient.user.first_name} ${symptomRecord.patient.user.last_name}`.trim(),
        email: symptomRecord.patient.user.email
      },
      symptomName: symptomRecord.symptom_name,
      description: symptomRecord.description,
      onsetTime: symptomRecord.onset_time,
      bodyLocation: symptomRecord.body_location,
      severity: symptomRecord.severity,
      triggers: symptomRecord.triggers,
      recordedAt: symptomRecord.recorded_at,
      createdAt: symptomRecord.created_at
    }

    // TODO: Send alerts for severe symptoms to healthcare providers
    // TODO: Log audit trail for symptom recording

    return createSuccessResponse(responseData, 201);
})
