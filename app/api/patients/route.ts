/**
 * Patient Management API Route
 * Handles CRUD operations for patient management with healthcare business logic compliance
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { 

  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  HealthcareErrorCodes,
  withErrorHandling,
  validateHealthcarePermissions
} from "@/lib/api-response"
import { 
  PatientSchema, 
  PaginationSchema 
} from "@/lib/validations/healthcare"
import { generatePatientId } from "@/lib/id-generation"

/**
 * GET /api/patients
 * Retrieve patients list with filtering and pagination
 * Business Logic: Only doctors, HSPs, and admins can access patient lists
 */

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Check permissions to access patient data
  if (!session.user.canAccessPatientData) {
    return createForbiddenResponse("Access to patient data denied")
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const paginationResult = PaginationSchema.safeParse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  if (!paginationResult.success) {
    return createErrorResponse(paginationResult.error)
  }

  const { page, limit, sortBy, sortOrder } = paginationResult.data
  const skip = (page - 1) * limit

  // Additional filters
  const searchQuery = searchParams.get('search')
  const doctorFilter = searchParams.get('doctorId') 
  const statusFilter = searchParams.get('status')

  try {
    // Build where clause based on user role and filters
    const whereClause: any = {}

    // Business Logic: Role-based data access
    switch (session.user.role) {
      case 'DOCTOR':
        // Doctors can only see their assigned patients
        whereClause.primaryCareDoctorId = session.user.profileId;

        break;
      case 'HSP':
        // HSPs can see patients through care team assignments
        // TODO: Implement care team relationship filtering
        whereClause.careTeam = {
          some: {
            hspId: session.user.profileId
          }
        };
        break;
      case 'SYSTEM_ADMIN':
        // System admins can see all patients
        break;
      case 'HOSPITAL_ADMIN':
        // Hospital admins can see patients in their organization
        if (session.user.organizationId) {
          whereClause.organizationId = session.user.organizationId;
        }
        break;
      default:
        return createForbiddenResponse("Invalid role for patient access");
    }

    // Apply search filter with dual field support
    if (searchQuery) {
      whereClause.OR = [
        {
          user: {
            OR: [
              // ✅ Auth.js v5 fields
              { name: { contains: searchQuery, mode: 'insensitive' } },
              // ✅ Legacy fields for backward compatibility
              { firstName: { contains: searchQuery, mode: 'insensitive' } },
              { lastName: { contains: searchQuery, mode: 'insensitive' } },
              { fullName: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } }
            ]
          }
        },
        {
          patientId: { contains: searchQuery, mode: 'insensitive' }
        },
        {
          medicalRecordNumber: { contains: searchQuery, mode: 'insensitive' }
        }
      ];
    }

    // Apply doctor filter
    if (doctorFilter) {
      whereClause.primaryCareDoctorId = doctorFilter;
    }

    // Apply status filter
    if (statusFilter) {
      whereClause.user = {
        ...whereClause.user,
        accountStatus: statusFilter.toUpperCase() as any
      };
    }

    // Get total count for pagination
    const total = await prisma.patient.count({ where: whereClause });

    // Fetch patients with user details
    const patients = await prisma.patient.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy === 'createdAt' ? 'createdAt' : sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      select: {
        id: true,
        patientId: true,
        medicalRecordNumber: true,
        heightCm: true,
        weightKg: true,
        bloodType: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            // ✅ Auth.js v5 fields
            name: true,
            image: true,
            emailVerified: true,
            // ✅ Legacy fields for backward compatibility
            firstName: true,
            lastName: true,
            fullName: true,
            profilePictureUrl: true,
            emailVerifiedLegacy: true,
            // ✅ Additional fields
            phone: true,
            dateOfBirth: true,
            gender: true,
            accountStatus: true,
            createdAt: true,
            updatedAt: true
          }
        },
        // Include primary doctor info
        primaryCareDoctor: {
          select: {
            doctorId: true,
            user: {
              select: {
                email: true,
                // ✅ Auth.js v5 fields
                name: true,
                image: true,
                // ✅ Legacy fields for backward compatibility
                firstName: true,
                lastName: true,
                fullName: true,
                profilePictureUrl: true
              }
            }
          }
        }
      }
    })

    // Format response data
    const formattedPatients = patients.map(patient => {
      // ✅ Helper to get name with fallbacks
      const userName = patient.user.name || 
                      patient.user.fullName ||
                      `${patient.user.firstName || ''} ${patient.user.lastName || ''}`.trim()
      
      const userImage = patient.user.image || patient.user.profilePictureUrl
      
      const doctorName = patient.primaryCareDoctor ?
        (patient.primaryCareDoctor.user.name ||
         patient.primaryCareDoctor.user.fullName ||
         `${patient.primaryCareDoctor.user.firstName || ''} ${patient.primaryCareDoctor.user.lastName || ''}`.trim())
        : null

      return {
        id: patient.id,
        patientId: patient.patientId,
        medicalRecordNumber: patient.medicalRecordNumber,
        user: {
          id: patient.user.id,
          email: patient.user.email,
          
          // ✅ Auth.js v5 standard fields (preferred)
          name: userName,
          image: userImage,
          emailVerified: patient.user.emailVerified,
          
          // ✅ Legacy fields (for backward compatibility)
          firstName: patient.user.firstName,
          lastName: patient.user.lastName,
          fullName: patient.user.fullName,
          profilePictureUrl: patient.user.profilePictureUrl,
          emailVerifiedLegacy: patient.user.emailVerifiedLegacy,
          
          // ✅ Additional healthcare fields
          phone: patient.user.phone,
          dateOfBirth: patient.user.dateOfBirth,
          gender: patient.user.gender,
          accountStatus: patient.user.accountStatus
        },
        primaryDoctor: patient.primaryCareDoctor ? {
          doctorId: patient.primaryCareDoctor.doctorId,
          
          // ✅ Auth.js v5 standard fields (preferred)
          name: doctorName,
          image: patient.primaryCareDoctor.user.image || patient.primaryCareDoctor.user.profilePictureUrl,
          
          // ✅ Legacy fields (for backward compatibility)  
          firstName: patient.primaryCareDoctor.user.firstName,
          lastName: patient.primaryCareDoctor.user.lastName,
          fullName: patient.primaryCareDoctor.user.fullName,
          profilePictureUrl: patient.primaryCareDoctor.user.profilePictureUrl,
          
          email: patient.primaryCareDoctor.user.email
        } : null,
        height: patient.heightCm,
        weight: patient.weightKg,
        bloodType: patient.bloodType,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      }
    });

    return createSuccessResponse(
      formattedPatients,
      200,
      { page, limit, total }
    );
  } catch (error) {
    console.error("Failed to fetch patients:", error);
    throw error;
  }
});

/**
 * POST /api/patients
 * Create new patient with medical validation
 * Business Logic: Only doctors and admins can create patient records
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors and admins can create patients
  if (!['DOCTOR', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Only doctors and administrators can create patient records")
  }

  // Get doctor profile if user is a doctor
  let doctorId: string | undefined = undefined
  if (session.user.role === 'DOCTOR') {
    const doctorProfile = await prisma.doctor.findUnique({
      where: { userId: session.user.id }
    })
    if (!doctorProfile) {
      return createErrorResponse(new Error("Doctor profile not found"), 400)
    }
    doctorId = doctorProfile.id
  }

  const body = await request.json()
  
  // Transform the frontend data to match our schema
  const transformedData = {
    // Required fields
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    middleName: body.middleName || undefined,
    email: body.email || '',
    phone: body.phone || '',
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth).toISOString() : undefined,
    gender: body.gender || undefined,
    
    // Optional physical measurements - convert null to undefined
    height: body.height !== null && body.height !== '' ? Number(body.height) : undefined,
    weight: body.weight !== null && body.weight !== '' ? Number(body.weight) : undefined,
    bloodType: body.bloodType || undefined,
    
    // Set primary doctor to the current user if they're a doctor
    primaryDoctorId: doctorId,
    
    // Medical history - handle string or array format
    medicalHistory: [],
    allergies: [],
    
    // Emergency contact - transform from form structure
    emergencyContact: (body.emergency_contacts && body.emergency_contacts.length > 0) ? {
      name: body.emergency_contacts[0].name || 'Emergency Contact',
      relationship: body.emergency_contacts[0].relationship || 'Emergency Contact',
      phone: body.emergency_contacts[0].contact_number || body.emergencyContactNumber || '',
      email: undefined
    } : undefined,
    
    // Insurance details - transform from form structure
    insuranceDetails: body.insurance_information ? {
      provider: body.insurance_information.primary?.insurance_company || '',
      policyNumber: body.insurance_information.primary?.policy_number || '',
      groupNumber: body.insurance_information.primary?.group_number || ''
    } : undefined
  }

  const validationResult = PatientSchema.safeParse(transformedData)

  if (!validationResult.success) {
    console.error('Validation failed:', validationResult.error.issues)
    return createErrorResponse(validationResult.error)
  }

  const patientData = validationResult.data

  try {
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: patientData.email }
    })

    if (existingUser) {
      return createErrorResponse(
        new Error("User with this email already exists"),
        400
      );
    }

    // Generate business ID for patient
    const { businessId: patientBusinessId } = await generatePatientId();

    // Create user and patient records in transaction
    const result = await prisma.$transaction(async (tx) => {
      // ✅ Generate names for dual field support
      const fullName = `${patientData.firstName} ${patientData.lastName}`.trim()
      
      // Create user record with dual field support
      const user = await tx.user.create({
        data: {
          email: patientData.email,
          
          // ✅ Auth.js v5 required fields
          name: fullName, // Required by Auth.js v5
          image: null, // Profile picture can be set later
          emailVerified: null, // Will be set when email is verified (DateTime)
          
          // ✅ Legacy fields for backward compatibility
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          fullName: fullName,
          profilePictureUrl: null, // Legacy field
          emailVerifiedLegacy: false, // Legacy boolean field
          
          // ✅ Additional healthcare fields
          middleName: patientData.middleName,
          phone: patientData.phone,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          
          // ✅ Security fields
          passwordHash: '$2b$12$defaulthash', // This should be a properly hashed temporary password
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
          passwordResetExpires: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Create patient profile
      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          patientId: patientBusinessId,
          medicalRecordNumber: `MRN${Date.now()}`, // Generate unique MRN
          primaryCareDoctorId: patientData.primaryDoctorId,
          heightCm: patientData.height,
          weightKg: patientData.weight,
          bloodType: patientData.bloodType,
          medicalHistory: patientData.medicalHistory || [],
          allergies: patientData.allergies || [],
          emergencyContacts: patientData.emergencyContact ? [patientData.emergencyContact] : [],
          insuranceInformation: patientData.insuranceDetails || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return { user, patient };
    });

    // Format response
    // ✅ Format response with dual field support
    const userName = result.user.name || result.user.fullName || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim()
    const userImage = result.user.image || result.user.profilePictureUrl

    const responseData = {
      id: result.patient.id,
      patientId: result.patient.patientId,
      medicalRecordNumber: result.patient.medicalRecordNumber,
      user: {
        id: result.user.id,
        email: result.user.email,
        
        // ✅ Auth.js v5 standard fields (preferred)
        name: userName,
        image: userImage,
        emailVerified: result.user.emailVerified,
        
        // ✅ Legacy fields (for backward compatibility)
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        fullName: result.user.fullName,
        profilePictureUrl: result.user.profilePictureUrl,
        emailVerifiedLegacy: result.user.emailVerifiedLegacy,
        
        // ✅ Additional healthcare fields
        phone: result.user.phone,
        dateOfBirth: result.user.dateOfBirth,
        gender: result.user.gender,
        accountStatus: result.user.accountStatus
      },
      height: result.patient.heightCm,
      weight: result.patient.weightKg,
      bloodType: result.patient.bloodType,
      medicalHistory: result.patient.medicalHistory,
      allergies: result.patient.allergies,
      emergencyContact: result.patient.emergencyContacts,
      createdAt: result.patient.createdAt
    };

    // TODO: Send welcome email with temporary password
    // TODO: Log audit trail for patient creation

    return createSuccessResponse(responseData, 201);
  } catch (error) {
    console.error("Failed to create patient:", error);
    throw error;
  }
});
