// src/controllers/PatientController.js - Modern ES Module Pattern
import { User, Doctor, Patient, CarePlan } from '../models/index.js';
import { Op } from 'sequelize';
import { PAGINATION, USER_CATEGORIES } from '../config/constants.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import PatientService from '../services/PatientService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

class PatientController {
  /**
   * Get patient details with comprehensive medical information
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatient(req, res, next) {
    try {
      const { patientId } = req.params;

      // Use the normalized User model approach
      const user = await User.findOne({
        where: { 
          id: patientId,
          category: USER_CATEGORIES.PATIENT 
        },
        include: [
          {
            model: Patient,
            as: 'patient',
            required: true
          },
          {
            model: Doctor,
            as: 'primaryDoctor',
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
      });

      if (!user) {
        throw new NotFoundError('Patient not found');
      }

      // Modern response formatting with the normalized data
      const responseData = {
        patients: {
          [user.patient.id]: {
            basic_info: {
              id: user.patient.id.toString(),
              user_id: user.id.toString(),
              
              // Common fields from User model
              gender: user.gender,
              first_name: user.first_name,
              middle_name: user.middle_name,
              last_name: user.last_name,
              full_name: user.full_name, // Virtual field
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
              patient_id: user.patient.patient_id,
              blood_group: user.patient.blood_group,
              height_cm: user.patient.height_cm,
              weight_kg: user.patient.weight_kg,
              bmi: user.patient.bmi, // Virtual field
            },
            
            // Medical information
            medical_info: {
              allergies: user.patient.allergies || [],
              chronic_conditions: user.patient.chronic_conditions || [],
              current_medications: user.patient.current_medications || [],
              family_medical_history: user.patient.family_medical_history || {},
              emergency_contact: user.patient.emergency_contact || {},
              insurance_info: user.patient.insurance_info || {}
            },
            
            // System fields
            consent_given: user.patient.consent_given,
            data_sharing_consent: user.patient.data_sharing_consent,
            activated_on: user.activated_on,
            created_at: user.created_at,
            updated_at: user.updated_at,
            
            // Relationships
            primary_doctor: user.primaryDoctor ? {
              id: user.primaryDoctor.id,
              name: user.primaryDoctor.user.full_name,
              email: user.primaryDoctor.user.email
            } : null,
            
            // Integration fields
            feedId: Buffer.from(`patient_${user.patient.id}`).toString('base64'),
            notificationToken: 'getstream_token' // Implement GetStream integration
          }
        }
      };

      res.status(200).json(ResponseFormatter.success(
        responseData,
        'Patient details retrieved successfully'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new patient with modern validation and service layer
   */
  async createPatient(req, res, next) {
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patients with advanced filtering and search
   */
  async getPatients(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        search,
        filter = {},
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      // Build dynamic where clause
      const whereClause = {
        category: USER_CATEGORIES.PATIENT,
        ...this.buildSearchClause(search),
        ...this.buildFilterClause(filter, req.userCategory, req.user.id)
      };

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Patient,
            as: 'patient',
            required: true,
            include: [
              {
                model: User,
                as: 'primaryDoctor',
                required: false,
                attributes: ['first_name', 'last_name']
              }
            ]
          }
        ],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [[sortBy, sortOrder.toUpperCase()]],
        distinct: true // Important for accurate count with joins
      });

      // Modern response formatting
      const responseData = {
        patients: users.reduce((acc, user) => {
          acc[user.patient.id] = {
            basic_info: {
              id: user.patient.id.toString(),
              user_id: user.id.toString(),
              full_name: user.full_name,
              first_name: user.first_name,
              last_name: user.last_name,
              current_age: user.current_age,
              gender: user.gender,
              mobile_number: user.mobile_number,
              patient_id: user.patient.patient_id,
              primary_doctor: user.patient.primaryDoctor?.full_name || null
            }
          };
          return acc;
        }, {})
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit),
        has_next: page < Math.ceil(count / limit),
        has_prev: page > 1
      };

      res.status(200).json(ResponseFormatter.paginated(
        responseData,
        pagination,
        'Patients retrieved successfully'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update patient with partial updates and validation
   */
  async updatePatient(req, res, next) {
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete patient (deactivate instead of hard delete)
   */
  async deletePatient(req, res, next) {
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

    } catch (error) {
      next(error);
    }
  }

  // Helper methods using modern ES6+ features
  buildSearchClause(search) {
    if (!search) return {};
    
    return {
      [Op.or]: [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { '$patient.patient_id$': { [Op.like]: `%${search}%` } }
      ]
    };
  }

  buildFilterClause(filter, userCategory, userId) {
    const clause = {};

    // Doctor can only see their patients
    if (userCategory === USER_CATEGORIES.DOCTOR) {
      clause['$patient.primary_doctor_id$'] = userId;
    }

    // Additional filters
    if (filter.gender) clause.gender = filter.gender;
    if (filter.blood_group) clause['$patient.blood_group$'] = filter.blood_group;
    if (filter.age_min || filter.age_max) {
      // Date calculation for age filtering
      const currentYear = new Date().getFullYear();
      if (filter.age_min) {
        clause.date_of_birth = {
          ...clause.date_of_birth,
          [Op.lte]: new Date(currentYear - filter.age_min, 11, 31)
        };
      }
      if (filter.age_max) {
        clause.date_of_birth = {
          ...clause.date_of_birth,
          [Op.gte]: new Date(currentYear - filter.age_max, 0, 1)
        };
      }
    }

    return clause;
  }
}

export default new PatientController();
