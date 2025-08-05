// src/services/PatientService.js

import { User, Patient, Doctor, sequelize } from '../models/index.js';
import { ValidationError, ConflictError, NotFoundError } from '../utils/errors.js';
import { generatePatientId } from '../utils/generators.js';
import { getPhoneSearchFormats, validatePhoneNumber } from '../utils/phoneValidation.js';
import { Op } from 'sequelize';

class PatientService {
  /**
   * Create patient with user account in a transaction
   */
  async createPatientWithUser(patientData, creatorId) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        // User fields
        first_name,
        middle_name,
        last_name,
        email,
        mobile_number,
        gender,
        dob, // Frontend sends 'dob', not 'date_of_birth'
        address, // Frontend sends 'address', not separate street/city/state
        
        // Patient-specific fields
        medical_record_number, // Frontend sends this, not 'patient_id'
        height_cm,
        weight_kg,
        allergies,
        comorbidities, // Frontend sends 'comorbidities', not 'chronic_conditions'
        emergency_contacts, // Frontend sends array, not single object
        insurance_information, // Frontend sends this field name
        
        // Clinical fields from frontend
        symptoms,
        diagnosis,
        treatment,
        clinical_notes,
        condition,
        severity
      } = patientData;

      // Check for existing user
      if (email) {
        const existingUser = await User.findOne({ 
          where: { email },
          transaction 
        });
        if (existingUser) {
          throw new ConflictError('User with this email already exists');
        }
      }

      // Map frontend gender values to database enum values
      const genderMapping = {
        'm': 'MALE',
        'f': 'FEMALE',
        'male': 'MALE',
        'female': 'FEMALE',
        'other': 'OTHER',
        'prefer_not_to_say': 'PREFER_NOT_TO_SAY'
      };
      
      const mappedGender = gender ? genderMapping[gender.toLowerCase()] || gender.toUpperCase() : null;

      // Create user with common fields
      const user = await User.create({
        first_name,
        middle_name,
        last_name,
        email: email || '', // Email can be empty
        phone: mobile_number, // Map 'mobile_number' to 'phone' field
        gender: mappedGender,
        date_of_birth: dob ? new Date(dob) : null, // Convert to Date object
        role: 'PATIENT', // Use 'role' instead of 'category' as per User model
        account_status: 'ACTIVE',
        password_hash: 'temp_password_hash', // Required field - set temporary value
        email_verified: false
      }, { transaction });

      // Use custom medical_record_number if provided, otherwise generate one
      let finalMedicalRecordNumber = medical_record_number;
      
      if (!finalMedicalRecordNumber || finalMedicalRecordNumber.trim() === '') {
        // Get creator info for medical record number generation
        const creator = await User.findByPk(creatorId, { transaction });
        const creatorName = creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown Doctor';
        
        // Generate medical record number
        finalMedicalRecordNumber = await this.generatePatientID(creatorName);
      } else {
        // Validate that custom medical_record_number doesn't already exist
        const existingPatient = await Patient.findOne({
          where: { medical_record_number: finalMedicalRecordNumber.trim() },
          transaction
        });
        
        if (existingPatient) {
          throw new ConflictError(`Medical record number '${finalMedicalRecordNumber}' already exists. Please choose a different ID.`);
        }
      }

      // Create patient with medical-specific fields
      const patient = await Patient.create({
        user_id: user.id,
        medical_record_number: finalMedicalRecordNumber ? finalMedicalRecordNumber.trim() : null,
        height_cm,
        weight_kg,
        // Convert allergies and comorbidities strings to arrays for JSONB storage
        allergies: allergies ? (typeof allergies === 'string' ? [allergies] : allergies) : [],
        medical_history: comorbidities ? (typeof comorbidities === 'string' ? [comorbidities] : comorbidities) : [],
        emergency_contacts: emergency_contacts || [],
        insurance_information: insurance_information || {},
        primary_care_doctor_id: creatorId,
        // Store clinical data for potential care plan creation
        notes: clinical_notes || '',
        // Additional metadata
        created_at: new Date()
      }, { transaction });

      await transaction.commit();
      
      return { user, patient };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update patient data with proper validation
   */
  async updatePatientData(patientId, updateData, updatorId) {
    const transaction = await sequelize.transaction();
    
    try {
      const patient = await Patient.findByPk(patientId, {
        include: [{ model: User, as: 'user' }],
        transaction
      });

      if (!patient) {
        throw new NotFoundError('Patient not found');
      }

      // Separate user fields from patient fields
      const { userFields, patientFields } = this.separateUpdateFields(updateData);

      // Update user fields if present
      if (Object.keys(userFields).length > 0) {
        await patient.user.update(userFields, { transaction });
      }

      // Update patient fields if present
      if (Object.keys(patientFields).length > 0) {
        await patient.update(patientFields, { transaction });
      }

      await transaction.commit();
      
      // Return updated patient with user data
      return await Patient.findByPk(patientId, {
        include: [{ model: User, as: 'user' }]
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Search patient by mobile number with fuzzy matching
   * @param {string} phoneNumber - Phone number to search
   * @param {string} countryCode - Country code (e.g., 'US', 'IN')
   * @returns {Object|null} Patient data if found
   */
  async findPatientByPhone(phoneNumber, countryCode = 'US') {
    try {
      if (!phoneNumber) {
        return null;
      }

      // Get all possible formats for the phone number
      const searchFormats = getPhoneSearchFormats(phoneNumber, countryCode);
      
      // Search for patient with any of these phone number formats
      const user = await User.findOne({
        where: {
          [Op.or]: searchFormats.map(format => ({
            mobile_number: {
              [Op.like]: `%${format}%`
            }
          })),
          category: 'patient'
        },
        include: [{
          model: Patient,
          as: 'patient',
          required: true
        }],
        order: [['created_at', 'DESC']] // Return most recent if multiple matches
      });

      if (user && user.patient) {
        return {
          exists: true,
          patient: {
            id: user.patient.id,
            patient_id: user.patient.patient_id,
            user_id: user.id,
            first_name: user.first_name,
            middle_name: user.middle_name,
            last_name: user.last_name,
            full_name: `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim(),
            email: user.email,
            mobile_number: user.mobile_number,
            gender: user.gender,
            date_of_birth: user.date_of_birth,
            age: user.current_age,
            street: user.street,
            city: user.city,
            state: user.state,
            country: user.country,
            blood_group: user.patient.blood_group,
            height_cm: user.patient.height_cm,
            weight_kg: user.patient.weight_kg,
            allergies: user.patient.allergies || [],
            chronic_conditions: user.patient.chronic_conditions || [],
            created_at: user.created_at,
            last_updated: user.updated_at
          }
        };
      }

      return { exists: false, patient: null };

    } catch (error) {
      console.error('Error searching patient by phone:', error);
      throw new Error('Failed to search patient by phone number');
    }
  }

  /**
   * Validate and format phone number for patient
   * @param {string} phoneNumber - Phone number to validate
   * @param {string} countryCode - Country code
   * @returns {Object} Validation result with formatted number
   */
  async validatePatientPhone(phoneNumber, countryCode = 'US') {
    const validation = validatePhoneNumber(phoneNumber, countryCode);
    
    if (!validation.isValid) {
      return validation;
    }

    // Check if phone number is already in use
    const existingPatient = await this.findPatientByPhone(phoneNumber, countryCode);
    
    return {
      ...validation,
      isAlreadyRegistered: existingPatient.exists,
      existingPatient: existingPatient.patient
    };
  }

  /**
   * Generate patient ID in format XXX/YYYYMM/NNNNNN
   * @param {string} doctorName - Doctor's name for prefix
   * @returns {string} Generated patient ID
   */
  async generatePatientID(doctorName) {
    try {
      // Extract 3-character prefix from doctor name
      const namePrefix = doctorName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3)
        .padEnd(3, 'X');

      // Get current year and month
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${year}${month}`;

      // Find the last patient ID with the same prefix and year/month
      const lastPatient = await Patient.findOne({
        where: {
          patient_id: {
            [Op.like]: `${namePrefix}/${yearMonth}/%`
          }
        },
        order: [['patient_id', 'DESC']]
      });

      let sequenceNumber = 1;
      if (lastPatient && lastPatient.patient_id) {
        const lastSequence = lastPatient.patient_id.split('/')[2];
        sequenceNumber = parseInt(lastSequence) + 1;
      }

      // Format sequence as 6-digit number
      const sequenceStr = sequenceNumber.toString().padStart(6, '0');
      
      return `${namePrefix}/${yearMonth}/${sequenceStr}`;

    } catch (error) {
      console.error('Error generating patient ID:', error);
      // Fallback to timestamp-based ID
      const timestamp = Date.now().toString().slice(-6);
      return `PAT/${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${timestamp}`;
    }
  }

  separateUpdateFields(updateData) {
    const userFields = {};
    const patientFields = {};

    // Define which fields belong to User vs Patient
    const userFieldNames = [
      'first_name', 'middle_name', 'last_name', 'email', 'mobile_number',
      'gender', 'date_of_birth', 'street', 'city', 'state', 'country',
      'profile_picture_url'
    ];

    const patientFieldNames = [
      'blood_group', 'height_cm', 'weight_kg', 'allergies', 
      'chronic_conditions', 'emergency_contact', 'insurance_info',
      'consent_given', 'data_sharing_consent'
    ];

    Object.keys(updateData).forEach(key => {
      if (userFieldNames.includes(key)) {
        userFields[key] = updateData[key];
      } else if (patientFieldNames.includes(key)) {
        patientFields[key] = updateData[key];
      }
    });

    return { userFields, patientFields };
  }
}

export default new PatientService();
