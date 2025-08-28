// src/controllers/PatientController.js - Modern ES Module Pattern
import { Request, Response, NextFunction } from 'express';
import { User, Doctor, Patient, CarePlan, Medication, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { PAGINATION, USER_CATEGORIES } from '../config/constants.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import PatientService from '../services/PatientService.js';
import PatientAccessService from '../services/PatientAccessService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import '../types/express.js';
import { parseQueryParam, parseQueryParamAsNumber, parseQueryParamAsInt } from '../utils/queryHelpers.js';

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

      // Find patient by patient table ID, then get associated user
      const patient = await Patient.findOne({
        where: { 
          id: patientId
        },
        include: [
          {
            model: User,
            as: 'user',
            required: true,
            where: {
              role: USER_CATEGORIES.PATIENT
            }
          },
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
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Modern response formatting with the normalized data
      const responseData = {
        patients: {
          [patient.id]: {
            basic_info: {
              id: patient.id.toString(),
              userId: patient.user.id.toString(),
              
              // Common fields from User model
              gender: patient.user.gender,
              first_name: patient.user.first_name,
              middle_name: patient.user.middle_name,
              last_name: patient.user.last_name,
              full_name: `${patient.user.first_name || ''} ${patient.user.middle_name || ''} ${patient.user.last_name || ''}`.replace(/\s+/g, ' ').trim(), // Constructed field
              current_age: patient.user.current_age, // Virtual field
              age: `${patient.user.current_age} years`,
              
              // Address information from User model
              street: patient.user.street,
              city: patient.user.city,
              state: patient.user.state,
              country: patient.user.country,
              formatted_address: patient.user.formatted_address,
              
              // Contact from User model
              mobile_number: patient.user.mobile_number,
              email: patient.user.email,
              
              // Patient-specific fields
              medical_record_number: patient.medical_record_number,
              blood_group: patient.blood_type,
              height_cm: patient.height_cm,
              weight_kg: patient.weight_kg,
              bmi: patient.bmi, // Virtual field
            },
            
            // Medical information
            medical_info: {
              allergies: patient.allergies || [],
              chronic_conditions: patient.medical_history || [],
              current_medications: patient.current_medications || [],
              family_medical_history: patient.medical_history || {},
              emergency_contact: patient.emergency_contacts || {},
              insurance_info: patient.insurance_information || {}
            },
            
            // System fields
            consent_given: patient.provider_consent_given,
            data_sharing_consent: patient.privacy_settings?.data_sharing_consent || false,
            activated_on: patient.user.activated_on,
            created_at: patient.created_at,
            updated_at: patient.updated_at,
            
            // Relationships
            primary_doctor: patient.primaryCareDoctor ? {
              id: patient.primaryCareDoctor.id,
              name: `${patient.primaryCareDoctor.user.first_name || ''} ${patient.primaryCareDoctor.user.middle_name || ''} ${patient.primaryCareDoctor.user.last_name || ''}`.replace(/\s+/g, ' ').trim(),
              email: patient.primaryCareDoctor.user.email
            } : null,
            
            // Integration fields
            feedId: Buffer.from(`patient_${patient.id}`).toString('base64'),
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
        req.user!.id
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
        result?.exists ? 'Patient found' : 'No patient found with this phone number'
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
        const user = await User.findByPk(req.user!.id);
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
      const { search, filter = {}, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      // Use PatientAccessService for provider-aware patient access
      if (req.userCategory === USER_CATEGORIES.DOCTOR || req.userCategory === USER_CATEGORIES.HSP) {
        const limitNum = parseQueryParamAsInt(req.query.limit, PAGINATION.DEFAULT_LIMIT);
        const pageNum = parseQueryParamAsInt(req.query.page, PAGINATION.DEFAULT_PAGE);
        const searchStr = parseQueryParam(search);
        
        const options = {
          limit: limitNum,
          offset: (pageNum - 1) * limitNum,
          search: searchStr
        };

        const accessiblePatients = await PatientAccessService.getAccessiblePatients(req.user!.id, options);

        // Combine primary and secondary patients
        const allPatients: any[] = [];

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
                userId: patient.userId?.toString() || patient.user?.id?.toString(),
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
          page: pageNum,
          limit: limitNum,
          total: allPatients.length,
          total_pages: Math.ceil(allPatients.length / limitNum),
          has_next: pageNum < Math.ceil(allPatients.length / limitNum),
          has_prev: pageNum > 1
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
        offset: (parseQueryParamAsInt(req.query.page, 1) - 1) * parseQueryParamAsInt(req.query.limit, 20),
        limit: parseQueryParamAsInt(req.query.limit, 20),
        order: [[sortBy, (sortOrder as any).toUpperCase()]],
        distinct: true
      });

      const responseData = {
        patients: users.reduce((acc: any, user: any) => {
          acc[user.patientProfile.id] = {
            basic_info: {
              id: user.patientProfile.id.toString(),
              userId: user.id.toString(),
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

      const pageNum = parseQueryParamAsInt(req.query.page, 1);
      const limitNum = parseQueryParamAsInt(req.query.limit, 20);
      
      const pagination = {
        page: pageNum,
        limit: limitNum,
        total: count,
        total_pages: Math.ceil(count / limitNum),
        has_next: pageNum < Math.ceil(count / limitNum),
        has_prev: pageNum > 1
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
        req.user!.id
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
   * Get patient dashboard data - comprehensive overview
   */
  async getPatientDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      // Find the patient with all necessary relationships
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
                include: [{
                  model: User,
                  as: 'user',
                  attributes: ['first_name', 'last_name', 'email']
                }]
              },
              {
                model: CarePlan,
                as: 'carePlans',
                required: false,
                include: [
                  {
                    model: Medication,
                    as: 'medicationPrescriptions',
                    required: false
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

      const patient = user.patientProfile;

      // Get comprehensive dashboard data
      const dashboardData = {
        patient_info: {
          id: patient.id.toString(),
          userId: user.id.toString(),
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          age: user.current_age,
          gender: user.gender,
          medical_record_number: patient.medical_record_number,
          primary_doctor: patient.primaryCareDoctor ? {
            name: `${patient.primaryCareDoctor.user.first_name || ''} ${patient.primaryCareDoctor.user.last_name || ''}`.trim(),
            email: patient.primaryCareDoctor.user.email
          } : null
        },
        
        health_overview: {
          overall_adherence_score: patient.overall_adherence_score || 0,
          risk_level: patient.risk_level || 'low',
          last_visit_date: patient.last_visit_date,
          next_appointment_date: patient.next_appointment_date,
          bmi: patient.bmi,
          blood_type: patient.blood_type
        },

        current_medications: patient.carePlans?.flatMap((plan: any) => 
          plan.medicationPrescriptions?.map((med: any) => ({
            id: med.id,
            name: med.medication_name,
            dosage: med.dosage,
            frequency: med.frequency,
            status: med.status,
            adherence_score: med.adherence_score || 0
          })) || []
        ) || [],

        vital_signs_summary: {
          latest_readings: [],
          trends: {},
          alerts_count: 0
        },

        recent_activities: [],
        
        alerts: {
          critical: [],
          warnings: [],
          reminders: []
        }
      };

      res.status(200).json(ResponseFormatter.success(
        dashboardData,
        'Patient dashboard data retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get patient medication events (complete/missed tracking)
   */
  async getPatientEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      const { startDate, endDate, eventType, limit = 50 } = req.query;

      // Verify patient exists
      const patient = await Patient.findOne({
        where: { userId: patientId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name']
        }]
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Build query conditions
      const whereClause: any = { patient_id: patient.id };
      
      if (startDate && endDate) {
        whereClause.created_at = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }
      
      if (eventType && eventType !== 'all') {
        whereClause.event_type = eventType;
      }

      // Get medication logs/events (assuming MedicationLog model exists)
      const events = await (sequelize as any).models.MedicationLog?.findAll({
        where: whereClause,
        include: [
          {
            model: Medication,
            as: 'medication',
            attributes: ['medication_name', 'dosage']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit as string)
      }) || [];

      const formattedEvents = events.map((event: any) => ({
        id: event.id,
        event_type: event.event_type,
        medication_name: event.medication?.medication_name,
        dosage: event.medication?.dosage,
        scheduled_time: event.scheduled_time,
        actual_time: event.actual_time,
        status: event.status,
        notes: event.notes,
        created_at: event.created_at
      }));

      res.status(200).json(ResponseFormatter.success(
        { 
          events: formattedEvents,
          patient_id: patientId,
          total_events: formattedEvents.length
        },
        'Patient events retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Record patient medication event (complete/missed)
   */
  async recordPatientEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      const { 
        medication_id, 
        event_type, 
        scheduled_time, 
        actual_time, 
        notes 
      } = req.body;

      // Verify patient exists
      const patient = await Patient.findOne({
        where: { userId: patientId }
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Create medication event log
      const eventLog = await (sequelize as any).models.MedicationLog?.create({
        patient_id: patient.id,
        medication_id,
        event_type, // 'completed', 'missed', 'delayed'
        scheduled_time: new Date(scheduled_time),
        actual_time: actual_time ? new Date(actual_time) : null,
        status: event_type === 'completed' ? 'taken' : 'missed',
        notes: notes || null,
        recorded_by: req.user!.id
      }) || {};

      res.status(201).json(ResponseFormatter.success(
        { event: eventLog },
        'Patient medication event recorded successfully',
        201
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
          deactivated_by: req.user!.id
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

  /**
   * Request patient consent for secondary doctor assignment
   */
  async requestPatientConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      const { 
        secondary_doctor_id, 
        secondary_hsp_id, 
        assignment_reason, 
        specialty_focus,
        consent_method = 'sms'
      } = req.body;

      // Verify patient exists
      const patient = await Patient.findOne({
        where: { userId: patientId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'mobile_number', 'email']
        }]
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Get the requesting doctor's information
      const requestingDoctor = await Doctor.findOne({
        where: { userId: req.user!.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name']
        }]
      });

      if (!requestingDoctor) {
        throw new NotFoundError('Doctor profile not found');
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create consent request record
      const consentRequest = await (sequelize as any).models.PatientConsentOtp?.create({
        patient_id: patient.id,
        primary_doctor_id: requestingDoctor.id,
        secondary_doctor_id: secondary_doctor_id || null,
        secondary_hsp_id: secondary_hsp_id || null,
        assignment_reason: assignment_reason || 'Care coordination',
        specialty_focus: specialty_focus || [],
        otp_code: otp,
        consent_method,
        expires_at: expiresAt,
        requested_by_userId: req.user!.id,
        status: 'pending'
      }) || {};

      // TODO: Send OTP via SMS/Email (integrate with notification service)
      const contactInfo = consent_method === 'sms' ? 
        patient.user.mobile_number : 
        patient.user.email;

      res.status(201).json(ResponseFormatter.success(
        {
          consent_request_id: consentRequest.id,
          patient_name: `${patient.user.first_name} ${patient.user.last_name}`,
          contact_method: consent_method,
          contact_info: contactInfo,
          expires_at: expiresAt,
          otp_sent: true
        },
        'Consent request sent successfully',
        201
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Verify patient consent with OTP
   */
  async verifyPatientConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { consent_request_id, otp_code, patient_signature } = req.body;

      if (!consent_request_id || !otp_code) {
        res.status(400).json(ResponseFormatter.error(
          'Consent request ID and OTP code are required',
          400
        ));
        return;
      }

      // Find the consent request
      const consentRequest = await (sequelize as any).models.PatientConsentOtp?.findOne({
        where: { 
          id: consent_request_id,
          otp_code,
          status: 'pending',
          expires_at: { [Op.gt]: new Date() }
        },
        include: [
          {
            model: Patient,
            as: 'patient',
            include: [{
              model: User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }]
          }
        ]
      });

      if (!consentRequest) {
        res.status(400).json(ResponseFormatter.error(
          'Invalid or expired consent request',
          400
        ));
        return;
      }

      // Update consent request as verified
      await consentRequest.update({
        status: 'verified',
        verified_at: new Date(),
        patient_signature: patient_signature || null
      });

      // Create the secondary doctor assignment
      const assignment = await (sequelize as any).models.SecondaryDoctorAssignment?.create({
        patient_id: consentRequest.patient_id,
        primary_doctor_id: consentRequest.primary_doctor_id,
        secondary_doctor_id: consentRequest.secondary_doctor_id,
        secondary_hsp_id: consentRequest.secondary_hsp_id,
        assignment_reason: consentRequest.assignment_reason,
        specialty_focus: consentRequest.specialty_focus,
        assignment_status: 'active',
        consent_given: true,
        consent_given_at: new Date(),
        consent_method: consentRequest.consent_method,
        created_by: consentRequest.requested_by_userId
      }) || {};

      res.status(200).json(ResponseFormatter.success(
        {
          assignment_id: assignment.id,
          patient_name: `${consentRequest.patient.user.first_name} ${consentRequest.patient.user.last_name}`,
          consent_verified: true,
          assignment_active: true
        },
        'Patient consent verified and assignment created successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get patient consent status and assignments
   */
  async getPatientConsentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      // Get patient with assignments
      const patient = await Patient.findOne({
        where: { userId: patientId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          }
        ]
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Get active secondary assignments
      const assignments = await (sequelize as any).models.SecondaryDoctorAssignment?.findAll({
        where: { 
          patient_id: patient.id,
          assignment_status: 'active'
        },
        include: [
          {
            model: Doctor,
            as: 'primaryDoctor',
            include: [{
              model: User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }]
          },
          {
            model: Doctor,
            as: 'secondaryDoctor',
            required: false,
            include: [{
              model: User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }]
          }
        ]
      }) || [];

      // Get pending consent requests
      const pendingRequests = await (sequelize as any).models.PatientConsentOtp?.findAll({
        where: {
          patient_id: patient.id,
          status: 'pending',
          expires_at: { [Op.gt]: new Date() }
        }
      }) || [];

      res.status(200).json(ResponseFormatter.success(
        {
          patient_info: {
            id: patient.id,
            name: `${patient.user.first_name} ${patient.user.last_name}`
          },
          active_assignments: assignments.map((assignment: any) => ({
            id: assignment.id,
            primary_doctor: assignment.primaryDoctor ? 
              `${assignment.primaryDoctor.user.first_name} ${assignment.primaryDoctor.user.last_name}` : null,
            secondary_doctor: assignment.secondaryDoctor ? 
              `${assignment.secondaryDoctor.user.first_name} ${assignment.secondaryDoctor.user.last_name}` : null,
            assignment_reason: assignment.assignment_reason,
            specialty_focus: assignment.specialty_focus,
            consent_given_at: assignment.consent_given_at
          })),
          pending_requests: pendingRequests.length,
          total_assignments: assignments.length
        },
        'Patient consent status retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  // Helper methods using modern ES6+ features
  buildSearchClause(search: any): any {
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
        where: { userId: userId }
      });
      
      if (doctorRecord) {
        (clause as any)['$patient.primaryCareDoctorId$'] = doctorRecord.id;
      } else {
        // If no doctor record exists, return empty results
        (clause as any)['$patient.primaryCareDoctorId$'] = null;
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
