// src/services/PatientAccessService.js - Provider-aware Patient Access Control Service
import { 
  Patient, 
  Doctor, 
  HSP, 
  User, 
  Organization, 
  SecondaryDoctorAssignment, 
  PatientConsentOtp 
} from '../models/index.js';
import { Op } from 'sequelize';
import { USER_CATEGORIES } from '../config/constants.js';
import NotificationService from './NotificationService.js';

class PatientAccessService {
  
  /**
   * Get accessible patients for a doctor with provider-aware logic
   * @param {string} doctorUserId - User ID of the requesting doctor
   * @param {Object} options - Query options (pagination, filters, etc.)
   * @returns {Object} - Accessible patients with access status
   */
  async getAccessiblePatients(doctorUserId: any, options = {}) {
    try {
      // Get the doctor record
      const doctorRecord = await Doctor.findOne({
        where: { userId: doctorUserId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!doctorRecord) {
        throw new Error('Doctor profile not found');
      }

      // Get primary patients (always accessible)
      const primaryPatients = await this.getPrimaryPatients(doctorRecord, options);
      
      // Get secondary patients with access status
      const secondaryPatients = await this.getSecondaryPatients(doctorRecord, options);

      return {
        primary_patients: primaryPatients,
        secondary_patients: secondaryPatients,
        doctor_info: {
          id: doctorRecord.id,
          name: `${doctorRecord.user.first_name} ${doctorRecord.user.last_name}`,
          provider: doctorRecord.organization?.name || 'No Provider'
        }
      };

    } catch (error) {
      console.error('PatientAccessService.getAccessiblePatients error:', error);
      throw error;
    }
  }

  /**
   * Get primary patients (direct care responsibility)
   */
  async getPrimaryPatients(doctorRecord: any, options = {}) {
    const whereClause = {
      primaryCareDoctorId: doctorRecord.id,
      is_active: true
    };

    // Add search filters if provided
    if ((options as any).search) {
      (whereClause as any)[Op.or] = [
        { '$user.first_name$': { [Op.iLike]: `%${(options as any).search}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${(options as any).search}%` } },
        { medical_record_number: { [Op.iLike]: `%${(options as any).search}%` } }
      ];
    }

    const patients = await Patient.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        }
      ],
      limit: (options as any).limit || 50,
      offset: (options as any).offset || 0,
      order: [['created_at', 'DESC']]
    });

    return patients.map((patient: any) => ({
      ...patient.toJSON(),
      access_type: 'primary',
      access_granted: true,
      requires_consent: false
    }));
  }

  /**
   * Get secondary patients with provider-aware access logic
   */
  async getSecondaryPatients(doctorRecord: any, options = {}) {
    // Find all secondary assignments for this doctor
    const assignments = await SecondaryDoctorAssignment.findAll({
      where: {
        secondary_doctor_id: doctorRecord.id,
        is_active: true
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
            }
          ]
        },
        {
          model: Doctor,
          as: 'primaryDoctor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }
          ]
        },
        {
          model: Organization,
          as: 'primaryDoctorProvider',
          attributes: ['id', 'name']
        },
        {
          model: Organization,
          as: 'secondaryDoctorProvider',
          attributes: ['id', 'name']
        }
      ]
    });

    return assignments.map((assignment: any) => {
      const isSameProvider = this.checkSameProvider(assignment);
      const requiresConsent = !isSameProvider;
      
      return {
        ...assignment.patient.toJSON(),
        assignment_id: assignment.id,
        access_type: 'secondary',
        access_granted: assignment.access_granted,
        requires_consent: requiresConsent,
        consent_status: assignment.consent_status,
        same_provider: isSameProvider,
        assignment_reason: assignment.assignment_reason,
        specialty_focus: assignment.specialty_focus,
        primary_doctor: assignment.primaryDoctor ? 
          `${assignment.primaryDoctor.user.first_name} ${assignment.primaryDoctor.user.last_name}` : 
          'Unknown',
        primary_doctor_provider: assignment.primaryDoctorProvider?.name || 'No Provider',
        secondary_doctor_provider: assignment.secondaryDoctorProvider?.name || 'No Provider'
      };
    });
  }

  /**
   * Check if primary and secondary doctors are from the same provider
   */
  checkSameProvider(assignment: any) {
    return assignment.primary_doctor_provider_id && 
           assignment.secondary_doctor_provider_id &&
           assignment.primary_doctor_provider_id === assignment.secondary_doctor_provider_id;
  }

  /**
   * Create a secondary doctor assignment with provider-aware consent logic
   */
  async assignSecondaryDoctor(primaryDoctorId: any, patientId: any, secondaryDoctorId: any, assignmentData = {}) {
    try {
      // Get provider information for both doctors
      const [primaryDoctor, secondaryDoctor] = await Promise.all([
        Doctor.findByPk(primaryDoctorId, {
          include: [{ model: Organization, as: 'organization' }]
        }),
        Doctor.findByPk(secondaryDoctorId, {
          include: [{ model: Organization, as: 'organization' }]
        })
      ]);

      if (!primaryDoctor || !secondaryDoctor) {
        throw new Error('Doctor(s) not found');
      }

      const primaryProviderId = primaryDoctor.organization?.id || null;
      const secondaryProviderId = secondaryDoctor.organization?.id || null;
      const isSameProvider = primaryProviderId && secondaryProviderId && 
                            primaryProviderId === secondaryProviderId;

      // Create the assignment
      const assignment = await SecondaryDoctorAssignment.create({
        patientId: patientId,
        primary_doctor_id: primaryDoctorId,
        secondary_doctor_id: secondaryDoctorId,
        primary_doctor_provider_id: primaryProviderId,
        secondary_doctor_provider_id: secondaryProviderId,
        consent_required: !isSameProvider,
        consent_status: isSameProvider ? 'granted' : 'pending',
        access_granted: isSameProvider,
        access_granted_at: isSameProvider ? new Date() : null,
        assignment_reason: (assignmentData as any).reason || 'Secondary care assignment',
        specialty_focus: (assignmentData as any).specialty_focus || [],
        care_plan_ids: (assignmentData as any).care_plan_ids || []
      });

      // Auto-update patient_provider_consent_history for same provider
      if (isSameProvider) {
        await this.recordAutomaticConsent(assignment);
      }

      return {
        assignment,
        requires_consent: !isSameProvider,
        same_provider: isSameProvider
      };

    } catch (error) {
      console.error('PatientAccessService.assignSecondaryDoctor error:', error);
      throw error;
    }
  }

  /**
   * Check if a doctor can access a specific patient
   */
  async canAccessPatient(doctorUserId: any, patientId: any) {
    try {
      const doctorRecord = await Doctor.findOne({
        where: { userId: doctorUserId }
      });

      if (!doctorRecord) {
        return { can_access: false, reason: 'DOCTOR_NOT_FOUND' };
      }

      // Check primary access
      const isPrimaryDoctor = await Patient.findOne({
        where: {
          id: patientId,
          primaryCareDoctorId: doctorRecord.id,
          is_active: true
        }
      });

      if (isPrimaryDoctor) {
        return {
          can_access: true,
          access_type: 'primary',
          requires_consent: false
        };
      }

      // Check secondary access
      const secondaryAssignment = await SecondaryDoctorAssignment.findOne({
        where: {
          patientId: patientId,
          secondary_doctor_id: doctorRecord.id,
          is_active: true
        }
      });

      if (secondaryAssignment) {
        const canAccess = secondaryAssignment.canAccess();
        const requiresConsent = secondaryAssignment.requiresConsent();

        return {
          can_access: canAccess,
          access_type: 'secondary',
          requires_consent: requiresConsent,
          consent_status: secondaryAssignment.consent_status,
          assignment_id: secondaryAssignment.id
        };
      }

      return { 
        can_access: false, 
        reason: 'NO_ASSIGNMENT',
        requires_consent: false
      };

    } catch (error) {
      console.error('PatientAccessService.canAccessPatient error:', error);
      throw error;
    }
  }

  /**
   * Generate OTP for patient consent
   */
  async generateConsentOtp(assignmentId: any, requestedByUserId: any, requestInfo = {}) {
    try {
      // Get assignment details
      const assignment = await SecondaryDoctorAssignment.findByPk(assignmentId, {
        include: [
          {
            model: Patient,
            as: 'patient',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['email', 'phone']
              }
            ]
          }
        ]
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (!assignment.requiresConsent()) {
        throw new Error('Consent not required for this assignment');
      }

      // Check for existing active OTP
      const existingOtp = await PatientConsentOtp.findActiveByAssignment(assignmentId);
      if (existingOtp && existingOtp.canVerify()) {
        return {
          otp_exists: true,
          expires_at: existingOtp.expires_at,
          remaining_time: existingOtp.getRemainingTime()
        };
      }

      // Generate new OTP
      const otp = await PatientConsentOtp.create({
        secondary_assignment_id: assignmentId,
        patientId: assignment.patientId,
        primary_doctor_id: assignment.primary_doctor_id,
        secondary_doctor_id: assignment.secondary_doctor_id,
        secondary_hsp_id: assignment.secondary_hsp_id,
        patient_phone: assignment.patient.user.phone,
        patient_email: assignment.patient.user.email,
        requested_by_userId: requestedByUserId,
        request_ip_address: (requestInfo as any).ip,
        request_user_agent: (requestInfo as any).userAgent
      });

      // Get patient and doctor names for personalized messages
      const patientName = `${assignment.patient.user?.first_name || ''} ${assignment.patient.user?.last_name || ''}`.trim();
      let doctorName = 'Healthcare Provider';
      
      // Get doctor name from assignment
      if (assignment.secondary_doctor_id) {
        const secondaryDoctor = await Doctor.findByPk(assignment.secondary_doctor_id, {
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          }]
        });
        if (secondaryDoctor) {
          doctorName = `${secondaryDoctor.user.first_name || ''} ${secondaryDoctor.user.last_name || ''}`.trim();
        }
      }

      // Send OTP via SMS and/or Email
      const deliveryResult = await NotificationService.sendBothOtp(
        assignment.patient.user.phone,
        assignment.patient.user.email,
        otp.otp_code,
        patientName,
        doctorName
      );

      // Update OTP record with delivery status
      await otp.markAsSent('sms', deliveryResult.sms.success, deliveryResult.sms.error);
      await otp.markAsSent('email', deliveryResult.email.success, deliveryResult.email.error);

      // Update assignment status
      assignment.consent_status = 'requested';
      assignment.recordAccessAttempt();
      await assignment.save();

      return {
        otp_generated: true,
        otp_id: otp.id,
        expires_at: otp.expires_at,
        remaining_time: otp.getRemainingTime(),
        delivery_methods: this.getDeliveryMethods(assignment.patient.user),
        delivery_status: {
          sms_sent: deliveryResult.sms.success,
          email_sent: deliveryResult.email.success,
          overall_success: deliveryResult.overall_success
        }
      };

    } catch (error) {
      console.error('PatientAccessService.generateConsentOtp error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and grant access
   */
  async verifyConsentOtp(assignmentId: any, otpCode: any, verifiedByUserId: any) {
    try {
      const otp = await PatientConsentOtp.findActiveByAssignment(assignmentId);
      
      if (!otp) {
        return { success: false, error: 'NO_ACTIVE_OTP' };
      }

      const verificationResult = otp.verify(otpCode);
      await otp.save();

      if (verificationResult.success) {
        // Grant access to the assignment
        const assignment = await SecondaryDoctorAssignment.findByPk(assignmentId);
        if (assignment) {
          await assignment.grantAccess();
          
          // Record consent in history
          await this.recordConsentGiven(assignment, otp, verifiedByUserId);
        }

        return {
          success: true,
          access_granted: true,
          verified_at: verificationResult.verified_at
        };
      }

      return verificationResult;

    } catch (error) {
      console.error('PatientAccessService.verifyConsentOtp error:', error);
      throw error;
    }
  }

  /**
   * Record automatic consent for same provider assignments
   */
  async recordAutomaticConsent(assignment: any) {
    try {
      // This would integrate with patient_provider_consent_history
      // Implementation depends on the existing consent history structure
      console.log(`Automatic consent granted for assignment ${assignment.id} (same provider)`);
      
      // TODO: Add actual patient_provider_consent_history record
      // await PatientProviderConsentHistory.create({
      //   patientId: assignment.patientId,
      //   provider_id: assignment.secondary_doctor_provider_id,
      //   consent_type: 'automatic_same_provider',
      //   consent_status: 'granted',
      //   granted_at: new Date(),
      //   granted_by: 'system'
      // });
      
    } catch (error) {
      console.error('PatientAccessService.recordAutomaticConsent error:', error);
    }
  }

  /**
   * Record OTP-based consent in history
   */
  async recordConsentGiven(assignment: any, otp: any, verifiedByUserId: any) {
    try {
      // This would integrate with patient_provider_consent_history
      console.log(`OTP consent granted for assignment ${assignment.id}`);
      
      // TODO: Add actual patient_provider_consent_history record
      // await PatientProviderConsentHistory.create({
      //   patientId: assignment.patientId,
      //   provider_id: assignment.secondary_doctor_provider_id,
      //   consent_type: 'otp_verification',
      //   consent_status: 'granted',
      //   granted_at: otp.verified_at,
      //   granted_by: verifiedByUserId,
      //   otp_reference: otp.id
      // });
      
    } catch (error) {
      console.error('PatientAccessService.recordConsentGiven error:', error);
    }
  }

  /**
   * Get available delivery methods for OTP
   */
  getDeliveryMethods(user: any) {
    const methods = [];
    
    if (user.phone) {
      methods.push('sms');
    }
    
    if (user.email) {
      methods.push('email');
    }
    
    return methods.length > 0 ? methods : ['email']; // Default to email
  }

  /**
   * Check if assignment has expired consent
   */
  async checkExpiredConsents() {
    try {
      const expiredAssignments = await SecondaryDoctorAssignment.findAll({
        where: {
          consent_expires_at: {
            [Op.lt]: new Date()
          },
          consent_status: 'granted',
          is_active: true
        }
      });

      for (const assignment of expiredAssignments) {
        assignment.consent_status = 'expired';
        assignment.access_granted = false;
        await assignment.save();
      }

      return expiredAssignments.length;

    } catch (error) {
      console.error('PatientAccessService.checkExpiredConsents error:', error);
      throw error;
    }
  }
}

export default new PatientAccessService();