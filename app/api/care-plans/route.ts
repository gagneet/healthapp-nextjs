/**
 * Care Plans API Route
 * Manages medical care plan operations with role-based access control
 * Business Logic: Only doctors can create care plans, patients can view their own
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

/**
 * GET /api/care-plans
 * Retrieve care plans based on user role and permissions
 * Business Logic: Role-based filtering for healthcare data access
 */

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  
  // Pagination and filtering with validation
  const paginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    searchQuery: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })

  const paginationResult = paginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    patientId: searchParams.get('patientId') || undefined,
    doctorId: searchParams.get('doctorId') || undefined,
    searchQuery: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, patientId, doctorId, searchQuery, status, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  const whereClause: any = {}

    // Business Logic: Role-based data access control
    switch (session.user.role) {
      case 'DOCTOR':
        whereClause.createdByDoctorId = session.user.profileId
        break
      case 'HSP':
        whereClause.OR = [
          { createdByDoctorId: session.user.profileId },
          {
            patient: {
              patientDoctorAssignments: {
                some: {
                  doctorId: session.user.profileId,
                  assignmentType: { in: ['SECONDARY', 'CONSULTING', 'SPECIALIST'] }
                }
              }
            }
          }
        ]
        break
      case 'PATIENT':
        whereClause.patientId = session.user.profileId
        break
      case 'SYSTEM_ADMIN':
        break
      default:
        return createForbiddenResponse("Invalid role for care plan access")
    }

    if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(session.user.role)) {
      whereClause.patientId = patientId
    }

    if (doctorId && session.user.role === 'SYSTEM_ADMIN') {
      whereClause.createdByDoctorId = doctorId
    }

    if (searchQuery) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          title: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          description: { contains: searchQuery, mode: 'insensitive' }
        }
      ]
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const total = await prisma.carePlan.count({ where: whereClause })

    const carePlans = await prisma.carePlan.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            specialty: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const formattedCarePlans = carePlans

    return createSuccessResponse(
      formattedCarePlans,
      200,
      {
        page,
        limit,
        total
      }
    );

})

/**
 * POST /api/care-plans
 * Create new care plan with medical validation
 * Business Logic: Only doctors can create care plans
 */
const createCarePlanSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional().default('ACTIVE'),
  priority: z.string().optional().default('MEDIUM'),
  // The old implementation had a 'details' blob. We'll map some of those fields.
  // These can be expanded later.
  clinicalNotes: z.string().optional(),
  followUpAdvise: z.string().optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can create care plans");
  }

  const body = await request.json();
  const validationResult = createCarePlanSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { patientId, title, description, startDate, endDate, status, priority, clinicalNotes, followUpAdvise } = validationResult.data;

  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    return createErrorResponse(new Error("Patient not found"));
  }

  const doctorId = session.user.profileId;
  if (!doctorId) {
      return createErrorResponse(new Error("Doctor profile not found for the current user"));
  }

  const carePlan = await prisma.carePlan.create({
    data: {
      patient: {
        connect: { id: patientId },
      },
      doctor: {
        connect: { id: doctorId },
      },
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      priority,
      details: {
        // Storing extra details in the JSON blob for compatibility/flexibility
        clinical_notes: clinicalNotes,
        follow_up_advise: followUpAdvise,
      },
      // You can add more structured fields here as needed
    },
  });

  return createSuccessResponse(carePlan, 201);
});

/**
 * PUT /api/care-plans
 * Update care plan information
 * Business Logic: Only care plan creator or admins can update care plans
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  return NextResponse.json({ 
    status: false, 
    statusCode: 501, 
    payload: { error: { status: 'not_implemented', message: 'Care plan updates not yet implemented' } } 
  }, { status: 501 });
})
