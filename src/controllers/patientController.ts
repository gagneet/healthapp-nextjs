// src/controllers/PatientController.js - Modern ES Module Pattern
import { Request, Response, NextFunction } from 'express';
import { User, Doctor, Patient, CarePlan } from '../models/index.js';
import { Op } from 'sequelize';
import { PAGINATION, USER_CATEGORIES } from '../config/constants.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import PatientService from '../services/PatientService.js';
import PatientAccessService from '../services/PatientAccessService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import '../types/express.js';

class PatientController {
  /**
   * Get patient details with comprehensive medical information
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      // Use the normalized User model approach
      const user = await User.findOne({
        where: { 
          id: patientId,
          role: USER_CATEGORIES.PATIENT 
        },
        include: [
          {
            model: Patient,
            as: 'patientProfile',
            required: true,
            include: [
              {
                model: Doctor,
                as: 'primaryCareDoctor',
                required: false,
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'email']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!user) {
        throw new NotFoundError('Patient not found');
      }

      // Modern response formatting with the normalized data
      const responseData = {
        patients: {
          [user.patientProfile.id]: {
            basic_info: {
              id: user.patientProfile.id.toString(),
              user_id: user.id.toString(),
              
              // Common fields from User model
              gender: user.gender,
              first_name: user.first_name,
              middle_name: user.middle_name,
              last_name: user.last_name,
              full_name: `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.replace(/\s+/g, ' ').trim(), // Constructed field
              current_age: user.current_age, // Virtual field
              age: `${user.current_age} years`,
              
              // Address information from User model
              street: user.street,
              city: user.city,
              state: user.state,
              country: user.country,
              formatted_address: user.formatted_address,
              
              // Contact from User model
              mobile_number: user.mobile_number,
              email: user.email,
              
              // Patient-specific fields
              medical_record_number: user.patientProfile.medical_record_number,
              blood_group: user.patientProfile.blood_group,
              height_cm: user.patientProfile.height_cm,
              weight_kg: user.patientProfile.weight_kg,
              bmi: user.patientProfile.bmi, // Virtual field
            },
            
            // Medical information
            medical_info: {
              allergies: user.patientProfile.allergies || [],
              chronic_conditions: user.patientProfile.chronic_conditions || [],
              current_medications: user.patientProfile.current_medications || [],
              family_medical_history: user.patientProfile.family_medical_history || {},
              emergency_contact: user.patientProfile.emergency_contact || {},
              insurance_info: user.patientProfile.insurance_info || {}
            },
            
            // System fields
            consent_given: user.patientProfile.consent_given,
            data_sharing_consent: user.patientProfile.data_sharing_consent,
            activated_on: user.activated_on,
            created_at: user.created_at,
            updated_at: user.updated_at,
            
            // Relationships
            primary_doctor: user.patientProfile.primaryCareDoctor ? {
              id: user.patientProfile.primaryCareDoctor.id,
              name: `${user.patientProfile.primaryCareDoctor.user.first_name || ''} ${user.patientProfile.primaryCareDoctor.user.middle_name || ''} ${user.patientProfile.primaryCareDoctor.user.last_name || ''}`.replace(/\s+/g, ' ').trim(),
              email: user.patientProfile.primaryCareDoctor.user.email
            } : null,
            
            // Integration fields
            feedId: Buffer.from(`patient_${user.patientProfile.id}`).toString('base64'),
            notificationToken: 'getstream_token' // Implement GetStream integration
          }
        }
      };

      res.status(200).json(ResponseFormatter.success(
        responseData,
        'Patient details retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Create a new patient with modern validation and service layer
   */
  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientData = req.body;
      
      // Use service layer for complex business logic
      const result = await PatientService.createPatientWithUser(
        patientData, 
        req.user.id
      );

      res.status(201).json(ResponseFormatter.success(
        { 
          patient: result.patient,
          user: result.user 
        },
        'Patient created successfully',
        201
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Search patient by phone number
   */
  async searchPatientByPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, countryCode = 'US' } = req.body;

      if (!phoneNumber) {
        res.status(400).json(ResponseFormatter.error(
          'Phone number is required',
          400
        ));
        return;
      }

      const result = await PatientService.findPatientByPhone(phoneNumber, countryCode);

      res.status(200).json(ResponseFormatter.success(
        result,
        result.exists ? 'Patient found' : 'No patient found with this phone number'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Validate patient phone number
   */
  async validatePatientPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, countryCode = 'US' } = req.body;

      if (!phoneNumber) {
        res.status(400).json(ResponseFormatter.error(
          'Phone number is required',
          400
        ));
        return;
      }

      const validation = await PatientService.validatePatientPhone(phoneNumber, countryCode);

      res.status(200).json(ResponseFormatter.success(
        validation,
        'Phone number validation completed'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Generate patient ID preview
   */
  async generatePatientId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorName } = req.body;
      
      // Use current user's name if not provided
      let nameToUse = doctorName;
      if (!nameToUse && req.user) {
        const user = await User.findByPk(req.user.id);
        nameToUse = user ? `${user.first_name} ${user.last_name}` : 'Unknown Doctor';
      }

      const patientId = await PatientService.generatePatientID(nameToUse || 'Unknown Doctor');

      res.status(200).json(ResponseFormatter.success(
        { patientId },
        'Patient ID generated successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get patients with consent workflow support (primary + secondary)
   */
  async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        search,
        filter = {},
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      // Use PatientAccessService for provider-aware patient access
      if (req.userCategory === USER_CATEGORIES.DOCTOR || req.userCategory === USER_CATEGORIES.HSP) {
        const options = {
          limit: parseInt(limit),
          offset: (parseInt(page) - 1) * parseInt(limit),
          search
        };

        const accessiblePatients = await PatientAccessService.getAccessiblePatients(req.user.id, options);

        // Combine primary and secondary patients
        const allPatients = [];

        // Add primary patients with 'M' indicator
        accessiblePatients.primary_patients.forEach((patient: any) => {
          allPatients.push({
            ...patient,
            patient_type: 'M', // Main/Primary
            patient_type_label: 'Primary Patient',
            requires_consent: false,
            consent_status: 'not_required',
            access_granted: true,
            can_view: true
          });
        });

        // Add secondary patients with 'R' indicator
        accessiblePatients.secondary_patients.forEach((patient: any) => {
          allPatients.push({
            ...patient,
            patient_type: 'R', // Referred/Secondary
            patient_type_label: 'Secondary Patient',
            can_view: patient.access_granted
          });
        });

        // Format response data
        const responseData = {
          patients: allPatients.reduce((acc, patient) => {
            // Mask contact information for display
            const maskedPhone = patient.user?.phone ? 
              `****${patient.user.phone.slice(-4)}` : null;
            const maskedEmail = patient.user?.email ? 
              `${patient.user.email.substring(0, 3)}...@${patient.user.email.split('@')[1]?.substring(0, 2)}...${patient.user.email.split('.').pop()}` : null;

            acc[patient.id] = {
              basic_info: {
                id: patient.id.toString(),
                user_id: patient.user_id?.toString() || patient.user?.id?.toString(),
                full_name: `${patient.user?.first_name || patient.first_name || ''} ${patient.user?.last_name || patient.last_name || ''}`.trim(),
                first_name: patient.user?.first_name || patient.first_name,
                last_name: patient.user?.last_name || patient.last_name,
                current_age: patient.current_age,
                gender: patient.gender,
                mobile_number: maskedPhone,
                masked_email: maskedEmail,
                medical_record_number: patient.medical_record_number,
                primary_doctor: patient.primary_doctor
              },
              // Consent workflow fields
              patient_type: patient.patient_type,
              patient_type_label: patient.patient_type_label,
              access_type: patient.access_type,
              requires_consent: patient.requires_consent,
              consent_status: patient.consent_status || 'not_required',
              access_granted: patient.access_granted,
              can_view: patient.can_view,
              same_provider: patient.same_provider || false,
              assignment_id: patient.assignment_id || null,
              assignment_reason: patient.assignment_reason || null,
              specialty_focus: patient.specialty_focus || [],
              // Provider information
              primary_doctor_provider: patient.primary_doctor_provider || null,
              secondary_doctor_provider: patient.secondary_doctor_provider || null
            };
            return acc;
          }, {})
        };

        const pagination = {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allPatients.length,
          total_pages: Math.ceil(allPatients.length / parseInt(limit)),
          has_next: parseInt(page) < Math.ceil(allPatients.length / parseInt(limit)),
          has_prev: parseInt(page) > 1
        };

        res.status(200).json(ResponseFormatter.paginated(
          responseData,
          pagination,
          'Patients retrieved successfully with consent status'
        ));
        return;
      }

      // Fallback for non-doctor users - original logic
      let whereClause = {
        role: USER_CATEGORIES.PATIENT
      };

      if (search) {
        (whereClause as any)[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { '$patientProfile.medical_record_number$': { [Op.like]: `%${search}%` } }
        ];
      }

      if ((filter as any).gender) (whereClause as any).gender = (filter as any).gender;
      if ((filter as any).blood_group) (whereClause as any)['($patientProfile as any).blood_group$'] = (filter as any).blood_group;

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Patient,
            as: 'patientProfile',
            required: true,
            include: [
              {
                model: Doctor,
                as: 'primaryCareDoctor',
                required: false,
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name']
                  }
                ]
              }
            ]
          }
        ],
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
        order: [[sortBy, (sortOrder as any).toUpperCase()]],
        distinct: true
      });

      const responseData = {
        patients: users.reduce((acc: any, user: any) => {
          acc[user.patientProfile.id] = {
            basic_info: {
              id: user.patientProfile.id.toString(),
              user_id: user.id.toString(),
              full_name: `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.replace(/\s+/g, ' ').trim(),
              first_name: user.first_name,
              last_name: user.last_name,
              current_age: user.current_age,
              gender: user.gender,
              mobile_number: user.mobile_number,
              medical_record_number: user.patientProfile.medical_record_number,
              primary_doctor: user.patientProfile.primaryCareDoctor?.user ? 
                `${user.patientProfile.primaryCareDoctor.user.first_name || ''} ${user.patientProfile.primaryCareDoctor.user.last_name || ''}`.trim() : null
            },
            patient_type: 'M',
            access_granted: true,
            can_view: true
          };
          return acc;
        }, {})
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / parseInt(limit)),
        has_next: parseInt(page) < Math.ceil(count / parseInt(limit)),
        has_prev: parseInt(page) > 1
      };

      res.status(200).json(ResponseFormatter.paginated(
        responseData,
        pagination,
        'Patients retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Update patient with partial updates and validation
   */
  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      const updateData = req.body;

      const result = await PatientService.updatePatientData(
        patientId, 
        updateData,
        req.user.id
      );

      res.status(200).json(ResponseFormatter.success(
        { patient: result },
        'Patient updated successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Soft delete patient (deactivate instead of hard delete)
   */
  async deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      
      // Find patient first
      const patient = await User.findOne({
        where: { id: patientId },
        include: [{
          model: Patient,
          as: 'patient',
          required: true
        }]
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Soft delete (deactivate) the patient account
      await User.update(
        { 
          is_active: false,
          status: 'DEACTIVATED',
          deactivated_at: new Date(),
          deactivated_by: req.user.id
        },
        { 
          where: { id: patientId }
        }
      );

      res.status(200).json(ResponseFormatter.success(
        null,
        'Patient account deactivated successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  // Helper methods using modern ES6+ features
  buildSearchClause(search: any) {
    if (!search) return {};
    
    return {
      [Op.or]: [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { '$patient.medical_record_number$': { [Op.like]: `%${search}%` } }
      ]
    };
  }

  async buildFilterClause(filter: any, userCategory: string, userId: number): Promise<any> {
    const clause = {};

    // Doctor can only see their patients
    if (userCategory === USER_CATEGORIES.DOCTOR) {
      // Get the doctor record ID for the current user
      const doctorRecord = await Doctor.findOne({
        where: { user_id: userId }
      });
      
      if (doctorRecord) {
        (clause as any)['$patient.primary_care_doctor_id$'] = doctorRecord.id;
      } else {
        // If no doctor record exists, return empty results
        (clause as any)['$patient.primary_care_doctor_id$'] = null;
      }
    }

    // Additional filters
    if ((filter as any).gender) (clause as any).gender = (filter as any).gender;
    if (filter.blood_group) (clause as any)['$patient.blood_group$'] = filter.blood_group;
    if (filter.age_min || filter.age_max) {
      // Date calculation for age filtering
      const currentYear = new Date().getFullYear();
      if (filter.age_min) {
        (clause as any).date_of_birth = {
          ...(clause as any).date_of_birth,
          [Op.lte]: new Date(currentYear - filter.age_min, 11, 31)
        };
      }
      if (filter.age_max) {
        (clause as any).date_of_birth = {
          ...(clause as any).date_of_birth,
          [Op.gte]: new Date(currentYear - filter.age_max, 0, 1)
        };
      }
    }

    return clause;
  }
}

export default new PatientController();
