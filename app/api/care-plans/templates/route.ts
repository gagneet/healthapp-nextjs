/**
 * Care Plan Templates API Route
 * Handles CRUD operations for reusable care plan templates
 * Business Logic: Only doctors and system admins can manage templates
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
  withErrorHandling
} from "@/lib/api-response"
import { PaginationSchema } from "@/lib/validations/healthcare"
import { z } from "zod"

// Care Plan Template Schema
const CarePlanTemplateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  templateDescription: z.string().optional(),
  specialityId: z.string().uuid("Invalid speciality ID").optional(),
  diagnosisCategory: z.string().optional(),
  icd10Codes: z.array(z.string()).default([]),
  templateGoals: z.array(z.object({
    goal: z.string(),
    timeframe: z.string().optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM')
  })).default([]),
  defaultMedications: z.array(z.object({
    medicationName: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string().optional()
  })).default([]),
  defaultVitals: z.array(z.string()).default([]),
  followUpSchedule: z.object({
    initialFollowUp: z.number().optional(), // days
    routineFollowUp: z.number().optional(), // days
    emergencyContact: z.boolean().default(false)
  }).optional(),
  templateNotes: z.string().optional(),
  isActive: z.boolean().default(true)
})

/**
 * GET /api/care-plans/templates
 * Retrieve care plan templates with filtering and pagination
 * Business Logic: Doctors can view templates for their speciality, admins can view all
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and admins can access templates
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and administrators can access care plan templates")
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
  const specialityId = searchParams.get('specialityId')
  const category = searchParams.get('category')
  const searchQuery = searchParams.get('search')
  const isActive = searchParams.get('isActive')

  try {
    // Build where clause based on user role and filters
    let whereClause: any = {}

    // Apply active filter by default
    if (isActive !== 'false') {
      whereClause.is_active = true
    }

    // Business Logic: Role-based access to templates
    if (session.user.role === 'DOCTOR') {
      // Doctors can see templates for their speciality or general templates
      const doctor = await prisma.doctors.findUnique({
        where: { id: session.user.profileId },
        select: { speciality_id: true }
      })

      if (doctor?.speciality_id) {
        whereClause.OR = [
          { speciality_id: doctor.speciality_id },
          { speciality_id: null } // General templates
        ]
      } else {
        whereClause.speciality_id = null // Only general templates
      }
    }

    // Apply speciality filter
    if (specialityId) {
      whereClause.speciality_id = specialityId
    }

    // Apply category filter
    if (category) {
      whereClause.diagnosis_category = { contains: category, mode: 'insensitive' }
    }

    // Apply search filter
    if (searchQuery) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          template_name: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          template_description: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          diagnosis_category: { contains: searchQuery, mode: 'insensitive' }
        }
      ]
    }

    // Get total count for pagination
    const total = await prisma.care_plan_templates.count({ where: whereClause })

    // Fetch templates with related data
    const templates = await prisma.care_plan_templates.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        speciality: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        doctors_care_plan_templates_created_byTodoctors: {
          select: {
            id: true,
            doctor_id: true,
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

    // Format response data
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      templateId: template.template_id,
      templateName: template.template_name,
      templateDescription: template.template_description,
      speciality: template.speciality ? {
        id: template.speciality.id,
        name: template.speciality.name,
        description: template.speciality.description
      } : null,
      diagnosisCategory: template.diagnosis_category,
      icd10Codes: template.icd10_codes || [],
      templateGoals: template.template_goals || [],
      defaultMedications: template.default_medications || [],
      defaultVitals: template.default_vitals || [],
      followUpSchedule: template.follow_up_schedule,
      templateNotes: template.template_notes,
      isActive: template.is_active,
      createdBy: template.doctors_care_plan_templates_created_byTodoctors ? {
        id: template.doctors_care_plan_templates_created_byTodoctors.id,
        doctorId: template.doctors_care_plan_templates_created_byTodoctors.doctor_id,
        name: `${template.doctors_care_plan_templates_created_byTodoctors.user.first_name} ${template.doctors_care_plan_templates_created_byTodoctors.user.last_name}`.trim(),
        email: template.doctors_care_plan_templates_created_byTodoctors.user.email
      } : null,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }))

    return createSuccessResponse(
      formattedTemplates,
      200,
      { page, limit, total }
    )
  } catch (error) {
    console.error("Failed to fetch care plan templates:", error)
    throw error
  }
})

/**
 * POST /api/care-plans/templates
 * Create new care plan template
 * Business Logic: Only doctors can create templates
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can create templates
  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can create care plan templates")
  }

  const body = await request.json()
  const validationResult = CarePlanTemplateSchema.safeParse(body)

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  const templateData = validationResult.data

  try {
    // Generate template ID
    const templateId = `TPL-${Date.now()}`

    // Get doctor's speciality if not provided
    let specialityId = templateData.specialityId
    if (!specialityId) {
      const doctor = await prisma.doctors.findUnique({
        where: { id: session.user.profileId },
        select: { speciality_id: true }
      })
      specialityId = doctor?.speciality_id
    }

    // Create template record
    const template = await prisma.care_plan_templates.create({
      data: {
        template_id: templateId,
        template_name: templateData.templateName,
        template_description: templateData.templateDescription,
        speciality_id: specialityId,
        diagnosis_category: templateData.diagnosisCategory,
        icd10_codes: templateData.icd10Codes,
        template_goals: templateData.templateGoals,
        default_medications: templateData.defaultMedications,
        default_vitals: templateData.defaultVitals,
        follow_up_schedule: templateData.followUpSchedule,
        template_notes: templateData.templateNotes,
        is_active: templateData.isActive,
        created_by: session.user.profileId!,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        speciality: {
          select: {
            name: true,
            description: true
          }
        }
      }
    })

    // Format response
    const responseData = {
      id: template.id,
      templateId: template.template_id,
      templateName: template.template_name,
      templateDescription: template.template_description,
      speciality: template.speciality ? {
        name: template.speciality.name,
        description: template.speciality.description
      } : null,
      diagnosisCategory: template.diagnosis_category,
      templateGoals: template.template_goals,
      isActive: template.is_active,
      createdAt: template.created_at
    }

    return createSuccessResponse(responseData, 201)
  } catch (error) {
    console.error("Failed to create care plan template:", error)
    throw error
  }
})

/**
 * PUT /api/care-plans/templates
 * Update care plan template
 * Business Logic: Only template creator or admins can update templates
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and admins can update templates
  if (!['DOCTOR', 'SYSTEM_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and administrators can update templates")
  }

  const body = await request.json()
  const { id, ...updateData } = body

  if (!id) {
    return createErrorResponse(new Error("Template ID is required"))
  }

  const validationResult = CarePlanTemplateSchema.partial().safeParse(updateData)
  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  try {
    // Get existing template to verify permissions
    const existingTemplate = await prisma.care_plan_templates.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return createErrorResponse(new Error("Template not found"), 404)
    }

    // Business Logic: Check permissions - only creator or admin can modify
    const canModify = 
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'DOCTOR' && existingTemplate.created_by === session.user.profileId)

    if (!canModify) {
      return createForbiddenResponse("Cannot modify this template")
    }

    const validatedData = validationResult.data

    // Build update data
    const templateUpdateData: any = {
      updated_at: new Date()
    }

    if (validatedData.templateName) templateUpdateData.template_name = validatedData.templateName
    if (validatedData.templateDescription !== undefined) templateUpdateData.template_description = validatedData.templateDescription
    if (validatedData.specialityId !== undefined) templateUpdateData.speciality_id = validatedData.specialityId
    if (validatedData.diagnosisCategory !== undefined) templateUpdateData.diagnosis_category = validatedData.diagnosisCategory
    if (validatedData.icd10Codes) templateUpdateData.icd10_codes = validatedData.icd10Codes
    if (validatedData.templateGoals) templateUpdateData.template_goals = validatedData.templateGoals
    if (validatedData.defaultMedications) templateUpdateData.default_medications = validatedData.defaultMedications
    if (validatedData.defaultVitals) templateUpdateData.default_vitals = validatedData.defaultVitals
    if (validatedData.followUpSchedule) templateUpdateData.follow_up_schedule = validatedData.followUpSchedule
    if (validatedData.templateNotes !== undefined) templateUpdateData.template_notes = validatedData.templateNotes
    if (validatedData.isActive !== undefined) templateUpdateData.is_active = validatedData.isActive

    const updatedTemplate = await prisma.care_plan_templates.update({
      where: { id },
      data: templateUpdateData,
      include: {
        speciality: {
          select: {
            name: true,
            description: true
          }
        }
      }
    })

    // Format response
    const responseData = {
      id: updatedTemplate.id,
      templateId: updatedTemplate.template_id,
      templateName: updatedTemplate.template_name,
      templateDescription: updatedTemplate.template_description,
      speciality: updatedTemplate.speciality ? {
        name: updatedTemplate.speciality.name,
        description: updatedTemplate.speciality.description
      } : null,
      diagnosisCategory: updatedTemplate.diagnosis_category,
      templateGoals: updatedTemplate.template_goals,
      isActive: updatedTemplate.is_active,
      updatedAt: updatedTemplate.updated_at
    }

    return createSuccessResponse(responseData)
  } catch (error) {
    console.error("Failed to update care plan template:", error)
    throw error
  }
})