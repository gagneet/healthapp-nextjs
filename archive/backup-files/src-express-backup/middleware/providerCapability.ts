// src/middleware/providerCapability.js - Validate provider capabilities
import { createLogger } from './logger.js';
import { PROVIDER_CAPABILITIES, USER_ROLES } from '../config/enums.js';

const logger = createLogger(import.meta.url);

/**
 * Middleware to validate that a provider has the required capability to perform an action
 * @param {string} requiredCapability - The capability required (from PROVIDER_CAPABILITIES enum)
 * @returns {Function} Express middleware function
 */
export const requireCapability = (requiredCapability: any) => {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // System admins can do everything
      if (user.role === USER_ROLES.SYSTEM_ADMIN) {
        return next();
      }
      
      let provider = null;
      let providerType = null;
      
      // Get provider based on user role
      if (user.role === USER_ROLES.DOCTOR) {
        const { Doctor } = req.app.get('models');
        provider = await Doctor.findOne({ where: { userId: user.id } });
        providerType = 'doctor';
      } else if (user.role === USER_ROLES.HSP) {
        const { HSP } = req.app.get('models');
        provider = await HSP.findOne({ where: { userId: user.id } });
        providerType = 'hsp';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only healthcare providers can perform this action'
        });
      }
      
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: `${providerType} profile not found`
        });
      }
      
      // Check if provider is verified
      if (!provider.is_verified) {
        return res.status(403).json({
          success: false,
          message: 'Provider must be verified to perform this action'
        });
      }
      
      // Check if provider has the required capability
      if (!provider.capabilities || !provider.capabilities.includes(requiredCapability)) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required capability: ${requiredCapability}`,
          required_capability: requiredCapability,
          provider_capabilities: provider.capabilities
        });
      }
      
      // For HSPs, check supervision requirements for certain actions
      if (providerType === 'hsp') {
        const supervisedCapabilities = [
          PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS,
          PROVIDER_CAPABILITIES.DIAGNOSE
        ];
        
        if (supervisedCapabilities.includes(requiredCapability) && 
            provider.requires_supervision && 
            !provider.supervising_doctor_id) {
          return res.status(403).json({
            success: false,
            message: 'This action requires supervision by a licensed physician'
          });
        }
      }
      
      // Attach provider info to request for use in controllers
      req.provider = provider;
      req.providerType = providerType;
      
      next();
    } catch (error) {
      logger.error('Provider capability validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating provider capabilities'
      });
    }
  };
};

/**
 * Middleware to require prescription capability with additional validation
 */
export const requirePrescriptionCapability = async (req: any, res: any, next: any) => {
  const capabilityCheck = requireCapability(PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS);
  
  return capabilityCheck(req, res, async (err: any) => {
    if (err) return next(err);
    
    try {
      // Additional validation for prescriptions
      const provider = req.provider;
      
      if (req.providerType === 'doctor') {
        // Doctors need valid medical license
        if (!provider.medical_license_number) {
          return res.status(403).json({
            success: false,
            message: 'Valid medical license required for prescriptions'
          });
        }
      } else if (req.providerType === 'hsp') {
        // HSPs need to be NP or PA with prescriptive authority
        const prescribingTypes = ['nurse_practitioner', 'physician_assistant'];
        if (!prescribingTypes.includes(provider.hsp_type)) {
          return res.status(403).json({
            success: false,
            message: 'Only Nurse Practitioners and Physician Assistants can prescribe medications'
          });
        }
        
        // Check for DEA number or prescriptive authority
        if (!provider.certifications?.includes('prescriptive_authority')) {
          return res.status(403).json({
            success: false,
            message: 'Prescriptive authority certification required'
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Prescription capability validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating prescription capabilities'
      });
    }
  });
};

/**
 * Middleware to require diagnosis capability
 */
export const requireDiagnosisCapability = requireCapability(PROVIDER_CAPABILITIES.DIAGNOSE);

/**
 * Middleware to require treatment plan creation capability
 */
export const requireTreatmentPlanCapability = requireCapability(PROVIDER_CAPABILITIES.CREATE_TREATMENT_PLANS);

/**
 * Middleware to require care plan creation capability
 */
export const requireCarePlanCapability = requireCapability(PROVIDER_CAPABILITIES.CREATE_CARE_PLANS);

/**
 * Middleware to validate that provider can access a specific patient
 * @param {string} patientIdParam - The request parameter containing patient ID (default: 'patientId')
 */
export const requirePatientAccess = (patientIdParam = 'patientId') => {
  return async (req: any, res: any, next: any) => {
    try {
      const patientId = req.params[patientIdParam];
      const provider = req.provider;
      const providerType = req.providerType;
      
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID required'
        });
      }
      
      const { Patient } = req.app.get('models');
      const patient = await Patient.findByPk(patientId);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      
      // Check if provider has access to this patient
      let hasAccess = false;
      
      if (providerType === 'doctor') {
        hasAccess = (
          patient.primary_care_doctor_id === provider.id ||
          (patient.care_coordinator_id === provider.id && patient.care_coordinator_type === 'doctor')
        );
      } else if (providerType === 'hsp') {
        hasAccess = (
          patient.primary_care_hsp_id === provider.id ||
          (patient.care_coordinator_id === provider.id && patient.care_coordinator_type === 'hsp')
        );
      }
      
      // Also check if provider is part of care team for any active care plans
      if (!hasAccess) {
        const { CarePlan } = req.app.get('models');
        const carePlans = await CarePlan.findAll({
          where: {
            patient_id: patientId,
            status: 'ACTIVE'
          }
        });
        
        hasAccess = carePlans.some((plan: any) => 
          (providerType === 'doctor' && plan.created_by_doctor_id === provider.id) ||
          (providerType === 'hsp' && plan.created_by_hsp_id === provider.id) ||
          plan.care_team_members.some((member: any) => 
            member.id === provider.id && member.type === providerType
          )
        );
      }
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to access this patient\'s information'
        });
      }
      
      req.patient = patient;
      next();
    } catch (error) {
      logger.error('Patient access validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating patient access'
      });
    }
  };
};

/**
 * Middleware to validate organization access (multi-tenant)
 */
export const requireOrganizationAccess = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    const provider = req.provider;
    
    // System admins can access all organizations
    if (user.role === USER_ROLES.SYSTEM_ADMIN) {
      return next();
    }
    
    // Check if provider belongs to the organization
    const organizationId = req.params.organizationId || req.body.organization_id;
    
    if (organizationId && provider.organization_id !== organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Provider does not belong to this organization'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Organization access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating organization access'
    });
  }
};

export default {
  requireCapability,
  requirePrescriptionCapability,
  requireDiagnosisCapability,
  requireTreatmentPlanCapability,
  requireCarePlanCapability,
  requirePatientAccess,
  requireOrganizationAccess
};