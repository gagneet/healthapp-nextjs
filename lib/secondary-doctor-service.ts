/**
 * Secondary Doctor Assignment Service
 * Implements the 4-type assignment system with proper permission matrix
 */

import { prisma } from '@/lib/prisma';
import { PatientDoctorAssignment } from '../prisma/generated/prisma/index.js';

// Assignment Types as per documentation
export enum AssignmentType {
  PRIMARY = 'PRIMARY',
  SPECIALIST = 'SPECIALIST', 
  SUBSTITUTE = 'SUBSTITUTE',
  TRANSFERRED = 'TRANSFERRED'
}

export enum ConsentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  REQUESTED = 'REQUESTED',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED'
}

// Permission Matrix Interface
export interface DoctorPermissions {
  can_view_patient: boolean;
  can_create_care_plans: boolean;
  can_modify_care_plans: boolean;
  can_prescribe: boolean;
  can_order_tests: boolean;
  can_access_full_history: boolean;
}

// Permission Matrix Implementation as per documentation
export const ASSIGNMENT_PERMISSION_MATRIX: Record<AssignmentType, DoctorPermissions> = {
  [AssignmentType.PRIMARY]: {
    can_view_patient: true,
    can_create_care_plans: true,
    can_modify_care_plans: true,
    can_prescribe: true,
    can_order_tests: true,
    can_access_full_history: true
  },
  [AssignmentType.SPECIALIST]: {
    can_view_patient: true,
    can_create_care_plans: true,
    can_modify_care_plans: true,
    can_prescribe: true,
    can_order_tests: true,
    can_access_full_history: true
  },
  [AssignmentType.SUBSTITUTE]: {
    can_view_patient: true,
    can_create_care_plans: false, // Substitute doctors cannot create new care plans
    can_modify_care_plans: true,
    can_prescribe: true,
    can_order_tests: true,
    can_access_full_history: true
  },
  [AssignmentType.TRANSFERRED]: {
    can_view_patient: true, // Only after consent
    can_create_care_plans: true, // Only after consent
    can_modify_care_plans: true, // Only after consent
    can_prescribe: true, // Only after consent
    can_order_tests: true, // Only after consent
    can_access_full_history: true // Only after consent
  }
};

export interface AssignmentRequest {
  patientId: string;
  doctorId: string;
  assignmentType: AssignmentType;
  assignedBy: string; // Doctor or Admin ID
  specialtyFocus?: string[];
  carePlanIds?: string[];
  assignmentReason?: string;
  notes?: string;
  requiresSameOrganization?: boolean;
}

export interface AssignmentResult {
  success: boolean;
  assignmentId?: string;
  requiresConsent?: boolean;
  consentOtp?: string;
  message: string;
  error?: string;
}

export class SecondaryDoctorService {
  
  /**
   * Create a new secondary doctor assignment with proper permission matrix
   */
  static async assignSecondaryDoctor(request: AssignmentRequest): Promise<AssignmentResult> {
    try {
      // Validate patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: request.patientId }
      });

      if (!patient) {
        return {
          success: false,
          message: 'Patient not found',
          error: 'PATIENT_NOT_FOUND'
        };
      }

      // Validate doctor exists
      const doctor = await prisma.doctor.findUnique({
        where: { id: request.doctorId },
        include: {
          organization: true
        }
      });

      if (!doctor) {
        return {
          success: false,
          message: 'Doctor not found',
          error: 'DOCTOR_NOT_FOUND'
        };
      }

      // Check for existing assignment
      const existingAssignment = await prisma.patientDoctorAssignment.findFirst({
        where: {
          patientId: request.patientId,
          doctorId: request.doctorId,
          isActive: true
        }
      });

      if (existingAssignment) {
        return {
          success: false,
          message: 'Doctor is already assigned to this patient',
          error: 'ASSIGNMENT_EXISTS'
        };
      }

      // Get automatic permissions for assignment type
      const permissions = ASSIGNMENT_PERMISSION_MATRIX[request.assignmentType];

      // Determine if consent is required
      const requiresConsent = await this.doesAssignmentRequireConsent(
        request.patientId,
        request.doctorId,
        request.assignmentType
      );

      let consentStatus = ConsentStatus.NOT_REQUIRED;
      let consentOtp: string | undefined;

      if (requiresConsent) {
        consentStatus = ConsentStatus.PENDING;
        
        // Generate OTP for transferred assignments
        if (request.assignmentType === AssignmentType.TRANSFERRED) {
          consentOtp = this.generateOTP();
          consentStatus = ConsentStatus.REQUESTED;
        }
      }

      // Create the assignment
      const assignment = await prisma.patientDoctorAssignment.create({
        data: {
          patientId: request.patientId,
          doctorId: request.doctorId,
          assignmentType: request.assignmentType,
          permissions: permissions,
          specialtyFocus: request.specialtyFocus || [],
          carePlanIds: request.carePlanIds || [],
          assignedByDoctorId: request.assignedBy,
          patientConsentRequired: requiresConsent,
          patientConsentStatus: consentStatus,
          consentOtp: consentOtp,
          consentOtpExpiresAt: consentOtp ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 minutes
          assignmentReason: request.assignmentReason,
          notes: request.notes,
          requiresSameOrganization: request.requiresSameOrganization || false,
          assignmentStartDate: new Date(),
          isActive: true,
          createdAt: new Date()
        }
      });

      // Send OTP if required
      if (consentOtp) {
        await this.sendConsentOTP(request.patientId, request.doctorId, consentOtp);
      }

      return {
        success: true,
        assignmentId: assignment.id,
        requiresConsent: requiresConsent,
        consentOtp: consentOtp, // Only for development/testing
        message: requiresConsent 
          ? 'Assignment created. Patient consent required via OTP.' 
          : 'Assignment created successfully'
      };

    } catch (error) {
      console.error('Error in assignSecondaryDoctor:', error);
      return {
        success: false,
        message: 'Failed to create assignment',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Verify patient consent via OTP
   */
  static async verifyPatientConsent(assignmentId: string, otp: string): Promise<AssignmentResult> {
    try {
      const assignment = await prisma.patientDoctorAssignment.findUnique({
        where: { id: assignmentId }
      });

      if (!assignment) {
        return {
          success: false,
          message: 'Assignment not found',
          error: 'ASSIGNMENT_NOT_FOUND'
        };
      }

      // Check if OTP is valid and not expired
      if (!assignment.consentOtp || assignment.consentOtp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP',
          error: 'INVALID_OTP'
        };
      }

      if (!assignment.consentOtpExpiresAt || assignment.consentOtpExpiresAt < new Date()) {
        return {
          success: false,
          message: 'OTP has expired',
          error: 'OTP_EXPIRED'
        };
      }

      // Grant consent
      await prisma.patientDoctorAssignment.update({
        where: { id: assignmentId },
        data: {
          patientConsentStatus: ConsentStatus.GRANTED,
          consentGrantedAt: new Date(),
          consentOtp: null, // Clear OTP after successful verification
          consentOtpExpiresAt: null
        }
      });

      return {
        success: true,
        message: 'Consent granted successfully'
      };

    } catch (error) {
      console.error('Error in verifyPatientConsent:', error);
      return {
        success: false,
        message: 'Failed to verify consent',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Check if doctor can access patient based on assignment and consent status
   */
  static async canDoctorAccessPatient(doctorId: string, patientId: string): Promise<{
    canAccess: boolean;
    assignmentType?: AssignmentType;
    permissions?: DoctorPermissions;
    requiresConsent?: boolean;
    consentStatus?: ConsentStatus;
    reason?: string;
  }> {
    try {
      const assignment = await prisma.patientDoctorAssignment.findFirst({
        where: {
          doctorId: doctorId,
          patientId: patientId,
          isActive: true
        }
      });

      if (!assignment) {
        return {
          canAccess: false,
          reason: 'No active assignment found'
        };
      }

      const assignmentType = assignment.assignmentType as AssignmentType;
      const permissions = assignment.permissions as DoctorPermissions;
      const consentStatus = assignment.patientConsentStatus as ConsentStatus;

      // For transferred assignments, check consent status
      if (assignmentType === AssignmentType.TRANSFERRED) {
        if (consentStatus !== ConsentStatus.GRANTED) {
          return {
            canAccess: false,
            assignmentType,
            permissions,
            requiresConsent: true,
            consentStatus,
            reason: 'Patient consent required for transferred assignment'
          };
        }
      }

      return {
        canAccess: true,
        assignmentType,
        permissions,
        requiresConsent: assignment.patientConsentRequired || false,
        consentStatus
      };

    } catch (error) {
      console.error('Error in canDoctorAccessPatient:', error);
      return {
        canAccess: false,
        reason: 'Error checking access permissions'
      };
    }
  }

  /**
   * Get all assignments for a patient
   */
  static async getPatientAssignments(patientId: string) {
    try {
      const assignments = await prisma.patientDoctorAssignment.findMany({
        where: {
          patientId: patientId,
          isActive: true
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specialty: true,
              organization: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          assignmentType: assignment.assignmentType,
          permissions: assignment.permissions,
          consentStatus: assignment.patientConsentStatus,
          requiresConsent: assignment.patientConsentRequired,
          specialtyFocus: assignment.specialtyFocus,
          doctor: {
            id: assignment.doctor.id,
            name: `${assignment.doctor.user?.firstName || ''} ${assignment.doctor.user?.lastName || ''}`.trim(),
            email: assignment.doctor.user?.email,
            specialties: assignment.doctor.specialty ? [assignment.doctor.specialty.name] : [],
            organization: assignment.doctor.organization?.name
          },
          createdAt: assignment.createdAt,
          assignmentReason: assignment.assignmentReason
        }))
      };

    } catch (error) {
      console.error('Error in getPatientAssignments:', error);
      return {
        success: false,
        message: 'Failed to fetch assignments',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Determine if an assignment requires patient consent
   */
  private static async doesAssignmentRequireConsent(
    patientId: string, 
    doctorId: string, 
    assignmentType: AssignmentType
  ): Promise<boolean> {
    
    // PRIMARY assignments never require consent (created by the original doctor)
    if (assignmentType === AssignmentType.PRIMARY) {
      return false;
    }

    // TRANSFERRED assignments always require consent
    if (assignmentType === AssignmentType.TRANSFERRED) {
      return true;
    }

    // For SPECIALIST and SUBSTITUTE, check if they're from the same organization
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        primaryCareDoctor: {
          include: { organization: true }
        }
      }
    });

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { organization: true }
    });

    // If both primary doctor and new doctor are from the same organization, no consent needed
    if (patient?.primaryCareDoctor?.organization && doctor?.organization) {
      if (patient.primaryCareDoctor.organization.id === doctor.organization.id) {
        return false;
      }
    }

    // Different organizations or no organization = consent required
    return true;
  }

  /**
   * Generate 6-digit OTP
   */
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send consent OTP to patient (mock implementation)
   */
  private static async sendConsentOTP(patientId: string, doctorId: string, otp: string): Promise<void> {
    // TODO: Implement actual SMS/Email sending
    console.log(`Sending OTP ${otp} to patient ${patientId} for doctor ${doctorId}`);
    
    // Store in notification/audit log
    // await NotificationService.sendOTP(patientId, otp);
  }
}

export default SecondaryDoctorService;