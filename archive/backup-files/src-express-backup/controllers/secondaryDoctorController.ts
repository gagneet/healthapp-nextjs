// src/controllers/secondaryDoctorController.ts - API endpoints for Secondary Doctor Management
import { Request, Response, NextFunction } from 'express';
import SecondaryDoctorService from '../services/SecondaryDoctorService.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import { createLogger } from '../middleware/logger.js';
import { validationResult } from 'express-validator';
import '../types/express.js';

const logger = createLogger(import.meta.url);

export class SecondaryDoctorController {
  /**
   * Assign a secondary doctor to patient
   * POST /api/patients/:patientId/secondary-doctors
   */
  static async assignSecondaryDoctor(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(ResponseFormatter.error('Validation failed', 400));
        return;
      }

      const { patientId } = req.params;
      const {
        doctorId,
        assignmentType,
        specialtyFocus = [],
        carePlanIds = [],
        assignmentReason,
        notes,
        requiresConsent = false
      } = req.body;

      const assignedBy = req.user!.doctorProfile?.id;
      if (!assignedBy) {
        res.status(403).json(ResponseFormatter.error('Only doctors can assign secondary doctors', 403));
        return;
      }

      const assignment = await SecondaryDoctorService.assignSecondaryDoctor({
        patientId,
        doctorId,
        assignmentType,
        assignedBy,
        specialtyFocus,
        carePlanIds,
        assignmentReason,
        notes,
        requiresConsent
      });

      logger.info(`Secondary doctor assigned successfully`, {
        patientId,
        doctorId,
        assignmentType,
        assignedBy: req.user!.id
      });

      res.status(201).json(ResponseFormatter.success(assignment, 'Secondary doctor assigned successfully'));
      return;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in assignSecondaryDoctor:', error);
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Get all doctor assignments for a patient
   * GET /api/patients/:patientId/secondary-doctors
   */
  static async getPatientDoctorAssignments(req: Request, res: Response): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const { includeInactive = 'false' } = req.query;

      // Check if user can access this patient
      const doctorId = req.user!.doctorProfile?.id;
      if (doctorId) {
        const accessCheck = await SecondaryDoctorService.canDoctorAccessPatient(doctorId, patientId);
        if (!accessCheck.canAccess) {
          res.status(403).json(ResponseFormatter.error('Access denied to this patient', 403));
          return;
        }
      }

      const assignments = await SecondaryDoctorService.getPatientDoctorAssignments(
        patientId, 
        includeInactive === 'true'
      );

      res.status(200).json(ResponseFormatter.success(assignments, 'Doctor assignments retrieved successfully'));
      return;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in getPatientDoctorAssignments:', error);
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Get specific assignment details
   * GET /api/assignments/:assignmentId
   */
  static async getAssignmentDetails(req: Request, res: Response): Promise<void | Response> {
    try {
      const { assignmentId } = req.params;

      const assignment = await SecondaryDoctorService.getAssignmentDetails(assignmentId);

      // Check if user can access this assignment
      const doctorId = req.user!.doctorProfile?.id;
      if (doctorId) {
        const accessCheck = await SecondaryDoctorService.canDoctorAccessPatient(
          doctorId, 
          assignment.patient.id
        );
        if (!accessCheck.canAccess && assignment.doctor.id !== doctorId) {
          res.status(403).json(ResponseFormatter.error('Access denied to this assignment', 403));
          return;
        }
      }

      res.status(200).json(ResponseFormatter.success(assignment, 'Assignment details retrieved successfully'));
      return;
    } catch (error: unknown) {
      logger.error('Error in getAssignmentDetails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Send consent request to patient
   * POST /api/assignments/:assignmentId/request-consent
   */
  static async requestPatientConsent(req: Request, res: Response): Promise<void | Response> {
    try {
      const { assignmentId } = req.params;
      const { consentMethod = 'sms_otp' } = req.body;

      // Get assignment details first
      const assignment = await SecondaryDoctorService.getAssignmentDetails(assignmentId);
      
      // Check if requesting user is the primary doctor
      const doctorId = req.user!.doctorProfile?.id;
      if (!assignment.assignedBy || assignment.assignedBy.id !== doctorId) {
        res.status(403).json(ResponseFormatter.error('Only the assigning doctor can request consent', 403));
        return;
      }

      const result = await SecondaryDoctorService.sendConsentRequest(assignment);

      logger.info(`Consent request sent for assignment ${assignmentId}`, {
        consentMethod,
        requestedBy: req.user!.id
      });

      res.status(200).json(ResponseFormatter.success(result, 'Consent request sent successfully'));
      return;
    } catch (error: unknown) {
      logger.error('Error in requestPatientConsent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Verify patient consent OTP
   * POST /api/assignments/:assignmentId/verify-consent
   */
  static async verifyPatientConsent(req: Request, res: Response): Promise<void | Response> {
    try {
      const { assignmentId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        res.status(400).json(ResponseFormatter.error('OTP is required', 400));
        return;
      }

      const result = await SecondaryDoctorService.verifyPatientConsent(
        assignmentId, 
        otp,
        req.user!.id
      );

      logger.info(`Patient consent verified for assignment ${assignmentId}`, {
        verifiedBy: req.user!.id
      });

      res.status(200).json(ResponseFormatter.success(result, 'Patient consent verified successfully'));
      return;
    } catch (error: unknown) {
      logger.error('Error in verifyPatientConsent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Update assignment permissions
   * PUT /api/assignments/:assignmentId/permissions
   */
  static async updateAssignmentPermissions(req: Request, res: Response): Promise<void | Response> {
    try {
      const { assignmentId } = req.params;
      const { permissions } = req.body;

      const doctorId = req.user!.doctorProfile?.id;
      if (!doctorId) {
        res.status(403).json(ResponseFormatter.error('Only doctors can update permissions', 403));
      }

      const assignment = await SecondaryDoctorService.updateAssignmentPermissions(
        assignmentId,
        permissions,
        doctorId
      );

      logger.info(`Assignment permissions updated for ${assignmentId}`, {
        permissions,
        updatedBy: req.user!.id
      });

      res.status(200).json(ResponseFormatter.success(assignment, 'Permissions updated successfully'));
      return;
    } catch (error: unknown) {
      logger.error('Error in updateAssignmentPermissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Deactivate doctor assignment
   * DELETE /api/assignments/:assignmentId
   */
  static async deactivateAssignment(req: Request, res: Response): Promise<void | Response> {
    try {
      const { assignmentId } = req.params;
      const { reason = 'Assignment ended by primary doctor' } = req.body;

      const doctorId = req.user!.doctorProfile?.id;
      if (!doctorId) {
        res.status(403).json(ResponseFormatter.error('Only doctors can deactivate assignments', 403));
      }

      const result = await SecondaryDoctorService.deactivateAssignment(
        assignmentId,
        doctorId,
        reason
      );

      logger.info(`Assignment ${assignmentId} deactivated`, {
        reason,
        deactivatedBy: req.user!.id
      });

      res.status(200).json(ResponseFormatter.success(result, 'Assignment deactivated successfully'));
      return;
    } catch (error: unknown) {
      logger.error('Error in deactivateAssignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Check doctor access to patient
   * GET /api/doctors/:doctorId/patient-access/:patientId
   */
  static async checkDoctorPatientAccess(req: Request, res: Response): Promise<void | Response> {
    try {
      const { doctorId, patientId } = req.params;

      // Only allow doctors to check their own access or admins
      const requestingDoctorId = req.user!.doctorProfile?.id;
      if (requestingDoctorId !== doctorId && req.user!.category !== 'admin') {
        res.status(403).json(ResponseFormatter.error('Access denied', 403));
      }

      const access = await SecondaryDoctorService.canDoctorAccessPatient(doctorId, patientId);

      res.status(200).json(ResponseFormatter.success(access, 'Access check completed'));
      return;
    } catch (error: unknown) {
      logger.error('Error in checkDoctorPatientAccess:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }

  /**
   * Get available doctors for assignment
   * GET /api/doctors/available-for-assignment
   */
  static async getAvailableDoctors(req: Request, res: Response): Promise<void | Response> {
    try {
      const { 
        specialty, 
        organizationId, 
        assignmentType,
        patientId 
      } = req.query;

      const requestingDoctorId = req.user!.doctorProfile?.id;
      if (!requestingDoctorId) {
        res.status(403).json(ResponseFormatter.error('Only doctors can view available doctors', 403));
      }

      // This would be implemented based on your specific requirements
      // For now, returning a basic structure
      const availableDoctors: any[] = [];

      res.status(200).json(ResponseFormatter.success(availableDoctors, 'Available doctors retrieved'));
      return;
    } catch (error: unknown) {
      logger.error('Error in getAvailableDoctors:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json(ResponseFormatter.error(errorMessage, 400));
      return;
    }
  }
}

export default SecondaryDoctorController;