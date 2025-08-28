// src/services/SecondaryDoctorService.js - Business logic for Secondary Doctor Management
import { Op } from 'sequelize';
import { createLogger } from '../middleware/logger.js';
import { PatientDoctorAssignment, Doctor, Patient, User, Organization } from '../models/index.js';

const logger = createLogger(import.meta.url);

export class SecondaryDoctorService {
  /**
   * Assign a secondary doctor to a patient
   */
  static async assignSecondaryDoctor({
    patientId,
    doctorId,
    assignmentType,
    assignedBy,
    specialtyFocus = [],
    carePlanIds = [],
    assignmentReason,
    notes,
    requiresConsent = false
  }: {
    patientId: string;
    doctorId: string;
    assignmentType: 'specialist' | 'substitute' | 'transferred';
    assignedBy: string;
    specialtyFocus?: string[];
    carePlanIds?: string[];
    assignmentReason?: string;
    notes?: string;
    requiresConsent?: boolean;
  }) {
    try {
      // Validate assignment type
      const validTypes = ['specialist', 'substitute', 'transferred'];
      if (!validTypes.includes(assignmentType)) {
        throw new Error('Invalid assignment type. Must be specialist, substitute, or transferred');
      }

      // Check if patient exists
      const patient = await Patient.findByPk(patientId, {
        include: [{ model: User, as: 'user' }]
      });
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Check if doctor exists and is verified
      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          { model: User, as: 'user' },
          { model: Organization, as: 'organization' }
        ]
      });
      if (!doctor) {
        throw new Error('Doctor not found');
      }
      if (!doctor.is_verified) {
        throw new Error('Doctor must be verified to be assigned to patients');
      }

      // Get assigning doctor info
      const assigningDoctor = await Doctor.findByPk(assignedBy, {
        include: [{ model: Organization, as: 'organization' }]
      });
      if (!assigningDoctor) {
        throw new Error('Assigning doctor not found');
      }

      // Check if this doctor is already assigned to this patient
      const existingAssignment = await PatientDoctorAssignment.findOne({
        where: {
          patientId: patientId,
          doctorId: doctorId,
          isActive: true
        }
      });
      if (existingAssignment) {
        throw new Error('Doctor is already assigned to this patient');
      }

      // Validate assignment permissions
      await this.validateAssignmentPermissions({
        assignmentType,
        assigningDoctor,
        targetDoctor: doctor,
        patient
      });

      // Create assignment data
      const assignmentData = {
        patientId: patientId,
        doctorId: doctorId,
        assignment_type: assignmentType,
        specialty_focus: specialtyFocus,
        care_plan_ids: carePlanIds,
        assigned_by_doctor_id: assignedBy,
        assignment_reason: assignmentReason,
        notes,
        patient_consent_required: requiresConsent || assignmentType === 'transferred',
        patient_consent_status: requiresConsent || assignmentType === 'transferred' ? 'pending' : 'not_required'
      };

      // For substitute doctors, ensure they're from the same organization
      if (assignmentType === 'substitute') {
        if (!assigningDoctor.organization_id || 
            assigningDoctor.organization_id !== doctor.organization_id) {
          throw new Error('Substitute doctors must be from the same organization as the primary doctor');
        }
        (assignmentData as any).requires_same_organization = true;
      }

      // Create the assignment
      const assignment = await PatientDoctorAssignment.create(assignmentData);

      // Send consent request if required
      if (assignment.patient_consent_required && assignment.patient_consent_status === 'pending') {
        await this.sendConsentRequest(assignment);
      }

      // Log the assignment
      logger.info(`Secondary doctor assigned: ${assignmentType} assignment created`, {
        patientId,
        doctorId,
        assignmentType,
        assignedBy,
        assignmentId: assignment.id
      });

      return await this.getAssignmentDetails(assignment.id);
    } catch (error) {
      logger.error('Error assigning secondary doctor:', error);
      throw error;
    }
  }

  /**
   * Validate assignment permissions based on doctor roles and organization
   */
  static async validateAssignmentPermissions({ assignmentType, assigningDoctor, targetDoctor, patient }: {
    assignmentType: string;
    assigningDoctor: any;
    targetDoctor: any;
    patient: any;
  }) {
    // Check if assigning doctor has permission to assign doctors to this patient
    const primaryAssignment = await PatientDoctorAssignment.findOne({
      where: {
        patientId: patient.id,
        doctorId: assigningDoctor.id,
        assignment_type: 'primary',
        isActive: true
      }
    });

    if (!primaryAssignment) {
      throw new Error('Only the primary doctor can assign secondary doctors to this patient');
    }

    // Additional validations based on assignment type
    switch (assignmentType) {
      case 'specialist':
        // Specialists should have relevant specialties
        if (!targetDoctor.specialties || targetDoctor.specialties.length === 0) {
          throw new Error('Specialist doctors must have defined specialties');
        }
        break;

      case 'substitute':
        // Substitutes must be from same organization
        if (!assigningDoctor.organization_id) {
          throw new Error('Primary doctor must be associated with an organization to assign substitute doctors');
        }
        if (assigningDoctor.organization_id !== targetDoctor.organization_id) {
          throw new Error('Substitute doctors must be from the same organization');
        }
        break;

      case 'transferred':
        // Transfers require patient consent
        break;
    }
  }

  /**
   * Get all doctor assignments for a patient
   */
  static async getPatientDoctorAssignments(patientId: string, includeInactive: boolean = false) {
    try {
      const whereClause = { patientId: patientId };
      if (!includeInactive) {
        (whereClause as any).isActive = true;
      }

      const assignments = await PatientDoctorAssignment.findAll({
        where: whereClause,
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              { model: User, as: 'user' },
              { model: Organization, as: 'organization' }
            ]
          },
          {
            model: Doctor,
            as: 'assignedByDoctor',
            include: [{ model: User, as: 'user' }]
          }
        ],
        order: [
          ['assignment_type', 'ASC'], // Primary first
          ['created_at', 'DESC']
        ]
      });

      return assignments.map((assignment: any) => ({
        id: assignment.id,
        assignmentType: assignment.assignment_type,
        doctor: {
          id: assignment.doctor.id,
          name: assignment.doctor.user.name,
          email: assignment.doctor.user.email,
          specialties: assignment.doctor.specialties,
          organization: assignment.doctor.organization?.name,
          isVerified: assignment.doctor.is_verified
        },
        permissions: assignment.permissions,
        specialtyFocus: assignment.specialty_focus,
        carePlanIds: assignment.care_plan_ids,
        assignmentReason: assignment.assignment_reason,
        notes: assignment.notes,
        consentStatus: assignment.patient_consent_status,
        consentRequired: assignment.patient_consent_required,
        isActive: assignment.isActive,
        assignmentStartDate: assignment.assignment_start_date,
        assignmentEndDate: assignment.assignment_end_date,
        assignedBy: assignment.assignedByDoctor ? {
          name: assignment.assignedByDoctor.user.name,
          email: assignment.assignedByDoctor.user.email
        } : null,
        createdAt: assignment.created_at
      }));
    } catch (error) {
      logger.error('Error fetching patient doctor assignments:', error);
      throw error;
    }
  }

  /**
   * Send consent request to patient for doctor assignment
   */
  static async sendConsentRequest(assignment: any) {
    try {
      // Generate OTP
      await assignment.generateConsentOTP();

      // Here you would integrate with SMS/Email service
      // For now, we'll just log the OTP
      logger.info(`Consent OTP generated for assignment ${assignment.id}: ${assignment.consent_otp}`);

      // TODO: Integrate with SMS/Email service
      // await SMSService.sendOTP(patient.phone, assignment.consent_otp);
      // await EmailService.sendConsentRequest(patient.email, assignment);

      return {
        success: true,
        message: 'Consent request sent to patient',
        consentMethod: 'sms_otp' // This would be dynamic based on patient preference
      };
    } catch (error) {
      logger.error('Error sending consent request:', error);
      throw error;
    }
  }

  /**
   * Verify patient consent OTP
   */
  static async verifyPatientConsent(assignmentId: string, otp: string, verifiedBy: string | null = null) {
    try {
      const assignment = await PatientDoctorAssignment.findByPk(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      const isValid = assignment.verifyConsentOTP(otp);
      if (!isValid) {
        throw new Error('Invalid or expired OTP');
      }

      // Update permissions after consent is granted
      assignment.validatePermissions();
      await assignment.save();

      logger.info(`Patient consent verified for assignment ${assignmentId}`);

      return {
        success: true,
        message: 'Patient consent verified successfully',
        assignment: await this.getAssignmentDetails(assignmentId)
      };
    } catch (error) {
      logger.error('Error verifying patient consent:', error);
      throw error;
    }
  }

  /**
   * Update assignment permissions
   */
  static async updateAssignmentPermissions(assignmentId: string, permissions: any, updatedBy: string) {
    try {
      const assignment = await PatientDoctorAssignment.findByPk(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Validate that updater is the primary doctor
      const primaryAssignment = await PatientDoctorAssignment.findOne({
        where: {
          patientId: assignment.patientId,
          doctorId: updatedBy,
          assignment_type: 'primary',
          isActive: true
        }
      });

      if (!primaryAssignment) {
        throw new Error('Only the primary doctor can update assignment permissions');
      }

      // Update permissions
      assignment.permissions = { ...assignment.permissions, ...permissions };
      await assignment.save();

      logger.info(`Assignment permissions updated for ${assignmentId}`, { permissions, updatedBy });

      return await this.getAssignmentDetails(assignmentId);
    } catch (error) {
      logger.error('Error updating assignment permissions:', error);
      throw error;
    }
  }

  /**
   * Deactivate doctor assignment
   */
  static async deactivateAssignment(assignmentId: string, deactivatedBy: string, reason: string) {
    try {
      const assignment = await PatientDoctorAssignment.findByPk(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Only primary doctor can deactivate assignments
      const primaryAssignment = await PatientDoctorAssignment.findOne({
        where: {
          patientId: assignment.patientId,
          doctorId: deactivatedBy,
          assignment_type: 'primary',
          isActive: true
        }
      });

      if (!primaryAssignment) {
        throw new Error('Only the primary doctor can deactivate assignments');
      }

      // Deactivate assignment
      assignment.isActive = false;
      assignment.assignment_end_date = new Date();
      assignment.notes = assignment.notes 
        ? `${assignment.notes}\n\nDeactivated: ${reason}` 
        : `Deactivated: ${reason}`;
      
      await assignment.save();

      logger.info(`Assignment ${assignmentId} deactivated by ${deactivatedBy}`, { reason });

      return {
        success: true,
        message: 'Assignment deactivated successfully'
      };
    } catch (error) {
      logger.error('Error deactivating assignment:', error);
      throw error;
    }
  }

  /**
   * Get detailed assignment information
   */
  static async getAssignmentDetails(assignmentId: string) {
    try {
      const assignment = await PatientDoctorAssignment.findByPk(assignmentId, {
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              { model: User, as: 'user' },
              { model: Organization, as: 'organization' }
            ]
          },
          {
            model: Patient,
            as: 'patient',
            include: [{ model: User, as: 'user' }]
          },
          {
            model: Doctor,
            as: 'assignedByDoctor',
            include: [{ model: User, as: 'user' }]
          }
        ]
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      return {
        id: assignment.id,
        assignmentType: assignment.assignment_type,
        doctor: {
          id: assignment.doctor.id,
          name: assignment.doctor.user.name,
          email: assignment.doctor.user.email,
          specialties: assignment.doctor.specialties,
          organization: assignment.doctor.organization?.name,
          isVerified: assignment.doctor.is_verified
        },
        patient: {
          id: assignment.patient.id,
          name: assignment.patient.user.name,
          email: assignment.patient.user.email
        },
        permissions: assignment.permissions,
        specialtyFocus: assignment.specialty_focus,
        carePlanIds: assignment.care_plan_ids,
        assignmentReason: assignment.assignment_reason,
        notes: assignment.notes,
        consentStatus: assignment.patient_consent_status,
        consentRequired: assignment.patient_consent_required,
        isActive: assignment.isActive,
        assignmentStartDate: assignment.assignment_start_date,
        assignmentEndDate: assignment.assignment_end_date,
        assignedBy: assignment.assignedByDoctor ? {
          id: assignment.assignedByDoctor.id,
          name: assignment.assignedByDoctor.user.name,
          email: assignment.assignedByDoctor.user.email
        } : null,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at
      };
    } catch (error) {
      logger.error('Error fetching assignment details:', error);
      throw error;
    }
  }

  /**
   * Check if doctor can access patient
   */
  static async canDoctorAccessPatient(doctorId: string, patientId: string) {
    try {
      const assignment = await PatientDoctorAssignment.findOne({
        where: {
          doctorId: doctorId,
          patientId: patientId,
          isActive: true
        }
      });

      if (!assignment) {
        return { canAccess: false, reason: 'No active assignment found' };
      }

      const canAccess = assignment.canAccessPatient();
      return {
        canAccess,
        assignmentType: assignment.assignment_type,
        permissions: assignment.permissions,
        consentStatus: assignment.patient_consent_status
      };
    } catch (error) {
      logger.error('Error checking doctor patient access:', error);
      throw error;
    }
  }
}

export default SecondaryDoctorService;