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
    let whereClause: any = {}

    // Business Logic: Role-based data access
    switch (session.user.role) {
      case 'DOCTOR':
        // Doctors can only see their assigned patients
        whereClause.primary_doctor_id = session.user.profileId;
        break;
      case 'HSP':
        // HSPs can see patients through care team assignments
        // TODO: Implement care team relationship filtering
        whereClause.care_team = {
          some: {
            hsp_id: session.user.profileId
          }
        };
        break;
      case 'SYSTEM_ADMIN':
        // System admins can see all patients
        break;
      case 'HOSPITAL_ADMIN':
        // Hospital admins can see patients in their organization
        if (session.user.organizationId) {
          whereClause.organization_id = session.user.organizationId;
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
          medical_record_number: { contains: searchQuery, mode: 'insensitive' }
        }
      ];
    }

    // Apply doctor filter
    if (doctorFilter) {
      whereClause.primary_doctor_id = doctorFilter;
    }

    // Apply status filter
    if (statusFilter) {
      whereClause.user = {
        ...whereClause.user,
        accountStatus: statusFilter.toUpperCase()
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
        medical_record_number: true,
        height_cm: true,
        weight_kg: true,
        blood_type: true,
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
            date_of_birth: true,
            gender: true,
            accountStatus: true,
            createdAt: true,
            updatedAt: true
          }
        },
        // Include primary doctor info
        doctors: {
          select: {
            doctorId: true,
            users_doctors_userIdTousers: {
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
                      patient.user.full_name ||
                      `${patient.user.first_name || ''} ${patient.user.last_name || ''}`.trim()
      
      const userImage = patient.user.image || patient.user.profile_picture_url
      
      const doctorName = patient.doctors ? 
        (patient.doctors.users_doctors_userIdTousers.name ||
         patient.doctors.users_doctors_userIdTousers.full_name ||
         `${patient.doctors.users_doctors_userIdTousers.first_name || ''} ${patient.doctors.users_doctors_userIdTousers.last_name || ''}`.trim())
        : null

      return {
        id: patient.id,
        patientId: patient.patientId,
        medicalRecordNumber: patient.medical_record_number,
        user: {
          id: patient.user.id,
          email: patient.user.email,
          
          // ✅ Auth.js v5 standard fields (preferred)
          name: userName,
          image: userImage,
          emailVerified: patient.user.emailVerified,
          
          // ✅ Legacy fields (for backward compatibility)
          firstName: patient.user.first_name,
          lastName: patient.user.last_name,
          fullName: patient.user.full_name,
          profilePictureUrl: patient.user.profile_picture_url,
          emailVerifiedLegacy: patient.user.email_verified,
          
          // ✅ Additional healthcare fields
          phone: patient.user.phone,
          dateOfBirth: patient.user.date_of_birth,
          gender: patient.user.gender,
          accountStatus: patient.user.account_status
        },
        primaryDoctor: patient.doctors ? {
          doctorId: patient.doctors.doctorId,
          
          // ✅ Auth.js v5 standard fields (preferred)
          name: doctorName,
          image: patient.doctors.users_doctors_userIdTousers.image || patient.doctors.users_doctors_userIdTousers.profile_picture_url,
          
          // ✅ Legacy fields (for backward compatibility)  
          firstName: patient.doctors.users_doctors_userIdTousers.first_name,
          lastName: patient.doctors.users_doctors_userIdTousers.last_name,
          fullName: patient.doctors.users_doctors_userIdTousers.full_name,
          profilePictureUrl: patient.doctors.users_doctors_userIdTousers.profile_picture_url,
          
          email: patient.doctors.users_doctors_userIdTousers.email
        } : null,
        height: patient.height_cm,
        weight: patient.weight_kg,
        bloodType: patient.blood_type,
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

  const body = await request.json()
  const validationResult = PatientSchema.safeParse(body)

  if (!validationResult.success) {
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
          middle_name: patientData.middleName,
          phone: patientData.phone,
          date_of_birth: patientData.dateOfBirth,
          gender: patientData.gender,
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          
          // ✅ Security fields
          passwordHash: '$2b$12$defaulthash', // This should be a properly hashed temporary password
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
          password_changed_at: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Create patient profile
      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          patientId: patientBusinessId,
          medical_record_number: `MRN${Date.now()}`, // Generate unique MRN
          primaryCareDoctorId: patientData.primaryDoctorId,
          height_cm: patientData.height,
          weight_kg: patientData.weight,
          blood_type: patientData.bloodType,
          medical_history: patientData.medicalHistory,
          allergies: patientData.allergies,
          emergency_contacts: patientData.emergencyContact,
          insurance_information: patientData.insuranceDetails,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return { user, patient };
    });

    // Format response
    // ✅ Format response with dual field support
    const userName = result.user.name || result.user.full_name || `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim()
    const userImage = result.user.image || result.user.profile_picture_url

    const responseData = {
      id: result.patient.id,
      patientId: result.patient.patientId,
      medicalRecordNumber: result.patient.medical_record_number,
      user: {
        id: result.user.id,
        email: result.user.email,
        
        // ✅ Auth.js v5 standard fields (preferred)
        name: userName,
        image: userImage,
        emailVerified: result.user.emailVerified,
        
        // ✅ Legacy fields (for backward compatibility)
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        fullName: result.user.full_name,
        profilePictureUrl: result.user.profile_picture_url,
        emailVerifiedLegacy: result.user.email_verified,
        
        // ✅ Additional healthcare fields
        phone: result.user.phone,
        dateOfBirth: result.user.date_of_birth,
        gender: result.user.gender,
        accountStatus: result.user.account_status
      },
      height: result.patient.height_cm,
      weight: result.patient.weight_kg,
      bloodType: result.patient.blood_type,
      medicalHistory: result.patient.medical_history,
      allergies: result.patient.allergies,
      emergencyContact: result.patient.emergency_contacts,
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
