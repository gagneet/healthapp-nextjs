// src/controllers/consentController.ts - Patient Consent Workflow Controller
import { Request, Response, NextFunction } from 'express';
import '../types/express.js';
import { Op } from 'sequelize';
import PatientAccessService from '../services/PatientAccessService.js';
import { Doctor, Patient, HSP, User, Speciality } from '../models/index.js';
import { USER_CATEGORIES } from '../config/constants.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

class ConsentController {

  /**
   * Get secondary patients for the current doctor with consent status
   * GET /api/doctors/patients/secondary
   */
  async getSecondaryPatients(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const doctorUserId = req.user!.id;
      const { page = 1, limit = 20, search } = req.query;
      const pageNum = parseInt(String(page)) || 1;
      const limitNum = parseInt(String(limit)) || 20;

      const options = {
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
        search
      };

      const result = await PatientAccessService.getAccessiblePatients(doctorUserId, options);

      res.status(200).json(ResponseFormatter.success(
        {
          secondary_patients: result.secondary_patients,
          doctor_info: result.doctor_info,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.secondary_patients.length
          }
        },
        'Secondary patients retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Assign a secondary doctor to a patient
   * POST /api/doctors/patients/:patientId/assign-secondary
   */
  async assignSecondaryDoctor(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const { 
        secondary_doctor_id, 
        secondary_hsp_id,
        assignment_reason,
        specialtyFocus = [],
        care_plan_ids = []
      } = req.body;

      // Validate input
      if (!secondary_doctor_id && !secondary_hsp_id) {
        throw new ValidationError('Either secondary_doctor_id or secondary_hsp_id must be provided');
      }

      if (secondary_doctor_id && secondary_hsp_id) {
        throw new ValidationError('Cannot assign both doctor and HSP to the same patient');
      }

      // Get current doctor (primary doctor)
      const primaryDoctor = await Doctor.findOne({
        where: { userId: req.user!.id }
      });

      if (!primaryDoctor) {
        throw new NotFoundError('Primary doctor profile not found');
      }

      // Verify patient exists and belongs to primary doctor
      const patient = await Patient.findOne({
        where: {
          id: patientId,
          primaryCareDoctorId: primaryDoctor.id
        }
      });

      if (!patient) {
        throw new NotFoundError('Patient not found or not assigned to you');
      }

      // Verify secondary provider exists
      if (secondary_doctor_id) {
        const secondaryDoctor = await Doctor.findByPk(secondary_doctor_id);
        if (!secondaryDoctor) {
          throw new NotFoundError('Secondary doctor not found');
        }
      }

      if (secondary_hsp_id) {
        const secondaryHsp = await HSP.findByPk(secondary_hsp_id);
        if (!secondaryHsp) {
          throw new NotFoundError('Secondary HSP not found');
        }
      }

      const assignmentData = {
        reason: assignment_reason || 'Secondary care referral',
        specialtyFocus,
        care_plan_ids
      };

      const result = await PatientAccessService.assignSecondaryDoctor(
        primaryDoctor.id,
        patientId,
        secondary_doctor_id || secondary_hsp_id,
        assignmentData
      );

      res.status(201).json(ResponseFormatter.success(
        {
          assignment_id: result.assignment.id,
          requires_consent: result.requires_consent,
          same_provider: result.same_provider,
          consent_status: result.assignment.consent_status,
          accessGranted: result.assignment.accessGranted
        },
        result.same_provider ? 
          'Secondary doctor assigned successfully with automatic access' :
          'Secondary doctor assigned successfully. Patient consent required.'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Request patient consent by generating OTP
   * POST /api/doctors/patients/:patientId/request-consent
   */
  async requestConsent(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const requestingUserId = req.user!.id;

      // Find the secondary assignment for this doctor and patient
      const doctorRecord = await Doctor.findOne({
        where: { userId: requestingUserId }
      });

      if (!doctorRecord) {
        throw new NotFoundError('Doctor profile not found');
      }

      // Check if user can access this patient
      const accessCheck = await PatientAccessService.canAccessPatient(requestingUserId, patientId);
      
      if (!accessCheck.can_access && accessCheck.reason === 'NO_ASSIGNMENT') {
        throw new ValidationError('No secondary assignment found for this patient');
      }

      if (!accessCheck.requires_consent) {
        throw new ValidationError('Consent not required for this patient');
      }

      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      const result = await PatientAccessService.generateConsentOtp(
        accessCheck.assignment_id,
        requestingUserId,
        requestInfo
      );

      res.status(200).json(ResponseFormatter.success(
        {
          otp_generated: result.otp_generated,
          otp_exists: result.otp_exists || false,
          expires_at: result.expires_at,
          remaining_time_seconds: result.remaining_time,
          delivery_methods: result.delivery_methods || ['email'],
          assignment_id: accessCheck.assignment_id
        },
        result.otp_exists ? 
          'Active OTP already exists' : 
          'OTP generated and sent to patient'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Verify patient consent OTP
   * POST /api/doctors/patients/:patientId/verify-consent
   */
  async verifyConsent(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const { otp_code } = req.body;
      const requestingUserId = req.user!.id;

      if (!otp_code || !/^\d{4,6}$/.test(otp_code)) {
        throw new ValidationError('Valid OTP code is required (4-6 digits)');
      }

      // Find the assignment
      const accessCheck = await PatientAccessService.canAccessPatient(requestingUserId, patientId);
      
      if (!accessCheck.assignment_id) {
        throw new ValidationError('No assignment found for verification');
      }

      const result = await PatientAccessService.verifyConsentOtp(
        accessCheck.assignment_id,
        otp_code,
        requestingUserId
      );

      if (result.success) {
        res.status(200).json(ResponseFormatter.success(
          {
            accessGranted: result.accessGranted,
            verified_at: result.verified_at,
            assignment_id: accessCheck.assignment_id
          },
          'OTP verified successfully. Patient access granted.'
        ));
      } else {
        res.status(400).json(ResponseFormatter.error(this.getOtpErrorMessage(result.error), 400));
      }

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Resend OTP for patient consent
   * POST /api/doctors/patients/:patientId/resend-otp
   */
  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const requestingUserId = req.user!.id;

      // Find the assignment
      const accessCheck = await PatientAccessService.canAccessPatient(requestingUserId, patientId);
      
      if (!accessCheck.assignment_id) {
        throw new ValidationError('No assignment found for OTP resend');
      }

      if (!accessCheck.requires_consent) {
        throw new ValidationError('Consent not required for this patient');
      }

      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Generate new OTP (this will invalidate the old one)
      const result = await PatientAccessService.generateConsentOtp(
        accessCheck.assignment_id,
        requestingUserId,
        requestInfo
      );

      res.status(200).json(ResponseFormatter.success(
        {
          otp_resent: true,
          expires_at: result.expires_at,
          remaining_time_seconds: result.remaining_time,
          delivery_methods: result.delivery_methods || ['email'],
          assignment_id: accessCheck.assignment_id
        },
        'New OTP generated and sent to patient'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Check consent status for a patient
   * GET /api/doctors/patients/:patientId/consent-status
   */
  async getConsentStatus(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const requestingUserId = req.user!.id;

      const accessCheck = await PatientAccessService.canAccessPatient(requestingUserId, patientId);

      res.status(200).json(ResponseFormatter.success(
        {
          can_access: accessCheck.can_access,
          access_type: accessCheck.access_type || 'none',
          requires_consent: accessCheck.requires_consent || false,
          consent_status: accessCheck.consent_status || 'none',
          assignment_id: accessCheck.assignment_id || null,
          reason: accessCheck.reason || null
        },
        'Consent status retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get user-friendly error messages for OTP errors
   */
  getOtpErrorMessage(errorCode: string): string {
    const errorMessages = {
      'OTP_EXPIRED': 'OTP has expired. Please request a new one.',
      'OTP_BLOCKED': 'OTP is blocked due to too many attempts. Please request a new one.',
      'OTP_ALREADY_VERIFIED': 'OTP has already been verified.',
      'OTP_INCORRECT': 'Incorrect OTP. Please try again.',
      'NO_ACTIVE_OTP': 'No active OTP found. Please request a new one.',
      'OTP_INVALID_STATE': 'OTP is in invalid state. Please request a new one.'
    };

    return (errorMessages as any)[errorCode] || 'OTP verification failed. Please try again.';
  }

  /**
   * Search for doctors/HSPs for assignment
   * GET /api/doctors/search-providers
   */
  async searchProviders(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { query, type = 'both', limit = 10 } = req.query;
      const limitNum = parseInt(String(limit)) || 10;

      if (!query || (query as any).trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
      }

      const results = { doctors: [], hsps: [] };

      // Search doctors
      if (type === 'doctor' || type === 'both') {
        results.doctors = await Doctor.findAll({
          where: {
            [Op.or]: [
              { '$user.first_name$': { [Op.iLike]: `%${query}%` } },
              { '$user.last_name$': { [Op.iLike]: `%${query}%` } },
              { '$user.email$': { [Op.iLike]: `%${query}%` } }
            ]
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email']
            },
            {
              model: Speciality,
              as: 'speciality',
              attributes: ['id', 'name']
            }
          ],
          limit: limitNum,
          attributes: ['id', 'medical_license_number']
        });
      }

      // Search HSPs
      if (type === 'hsp' || type === 'both') {
        results.hsps = await HSP.findAll({
          where: {
            [Op.or]: [
              { '$user.first_name$': { [Op.iLike]: `%${query}%` } },
              { '$user.last_name$': { [Op.iLike]: `%${query}%` } },
              { '$user.email$': { [Op.iLike]: `%${query}%` } }
            ]
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ],
          limit: limitNum,
          attributes: ['id', 'license_number']
        });
      }

      res.status(200).json(ResponseFormatter.success(
        {
          doctors: results.doctors.map(doctor => ({
            id: (doctor as any).id,
            name: `${(doctor as any).user.first_name} ${(doctor as any).user.last_name}`,
            email: (doctor as any).user.email,
            speciality: (doctor as any).speciality?.name || 'General',
            license: (doctor as any).medical_license_number,
            type: 'doctor'
          })),
          hsps: results.hsps.map(hsp => ({
            id: (hsp as any).id,
            name: `${(hsp as any).user.first_name} ${(hsp as any).user.last_name}`,
            email: (hsp as any).user.email,
            license: (hsp as any).license_number,
            type: 'hsp'
          }))
        },
        'Provider search completed'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new ConsentController();