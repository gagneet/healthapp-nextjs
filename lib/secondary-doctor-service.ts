/**
 * Secondary Doctor Assignment Service
 * Implements the 4-type assignment system with proper permission matrix
 */

import { prisma } from '@/lib/prisma';

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
      const patient = await prisma.Patient.findUnique({
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
      const doctor = await prisma.doctors.findUnique({
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
      const existingAssignment = await prisma.PatientDoctorAssignment.findFirst({
        where: {
          patient_id: request.patientId,
          doctor_id: request.doctorId,
          is_active: true
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
      const assignment = await prisma.PatientDoctorAssignment.create({
        data: {
          patient_id: request.patientId,
          doctor_id: request.doctorId,
          assignment_type: request.assignmentType,
          permissions: permissions,
          specialty_focus: request.specialtyFocus || [],
          care_plan_ids: request.carePlanIds || [],
          assigned_by_doctor_id: request.assignedBy,
          patient_consent_required: requiresConsent,
          patient_consent_status: consentStatus,
          consent_otp: consentOtp,
          consent_otp_expires_at: consentOtp ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 minutes
          assignment_reason: request.assignmentReason,
          notes: request.notes,
          requires_same_organization: request.requiresSameOrganization || false,
          assignment_start_date: new Date(),
          is_active: true,
          created_at: new Date()
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
      const assignment = await prisma.PatientDoctorAssignment.findUnique({
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
      if (!assignment.consent_otp || assignment.consent_otp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP',
          error: 'INVALID_OTP'
        };
      }

      if (!assignment.consent_otp_expires_at || assignment.consent_otp_expires_at < new Date()) {
        return {
          success: false,
          message: 'OTP has expired',
          error: 'OTP_EXPIRED'
        };
      }

      // Grant consent
      await prisma.PatientDoctorAssignment.update({
        where: { id: assignmentId },
        data: {
          patient_consent_status: ConsentStatus.GRANTED,
          consent_granted_at: new Date(),
          consent_otp: null, // Clear OTP after successful verification
          consent_otp_expires_at: null
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
      const assignment = await prisma.PatientDoctorAssignment.findFirst({
        where: {
          doctor_id: doctorId,
          patient_id: patientId,
          is_active: true
        }
      });

      if (!assignment) {
        return {
          canAccess: false,
          reason: 'No active assignment found'
        };
      }

      const assignmentType = assignment.assignment_type as AssignmentType;
      const permissions = assignment.permissions as DoctorPermissions;
      const consentStatus = assignment.patient_consent_status as ConsentStatus;

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
        requiresConsent: assignment.patient_consent_required || false,
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
      const assignments = await prisma.PatientDoctorAssignment.findMany({
        where: {
          patient_id: patientId,
          is_active: true
        },
        include: {
          doctor: {
            include: {
              users_doctors_user_idTousers: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              },
              specialties: true,
              organization: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        success: true,
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          assignmentType: assignment.assignment_type,
          permissions: assignment.permissions,
          consentStatus: assignment.patient_consent_status,
          requiresConsent: assignment.patient_consent_required,
          specialtyFocus: assignment.specialty_focus,
          doctor: {
            id: assignment.doctor.id,
            name: `${assignment.doctor.users_doctors_user_idTousers?.first_name || ''} ${assignment.doctor.users_doctors_user_idTousers?.last_name || ''}`.trim(),
            email: assignment.doctor.users_doctors_user_idTousers?.email,
            specialties: assignment.doctor.specialties,
            organization: assignment.doctor.organization?.name
          },
          createdAt: assignment.created_at,
          assignmentReason: assignment.assignment_reason
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
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
      include: {
        doctors: {
          include: { organization: true }
        }
      }
    });

    const doctor = await prisma.doctors.findUnique({
      where: { id: doctorId },
      include: { organization: true }
    });

    // If both primary doctor and new doctor are from the same organization, no consent needed
    if (patient?.doctors?.organization && doctor?.organization) {
      if (patient.doctors.organization.id === doctor.organization.id) {
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