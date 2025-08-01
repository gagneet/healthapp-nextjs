// src/services/PatientService.js

import { User, Patient, Doctor, sequelize } from '../models/index.js';
import { ValidationError, ConflictError } from '../utils/errors.js';
import { generatePatientId } from '../utils/generators.js';

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
        date_of_birth,
        street,
        city,
        state,
        country,
        
        // Patient-specific fields
        blood_group,
        height_cm,
        weight_kg,
        allergies,
        chronic_conditions,
        emergency_contact,
        insurance_info
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

      // Create user with common fields
      const user = await User.create({
        first_name,
        middle_name,
        last_name,
        email,
        mobile_number,
        gender,
        date_of_birth,
        street,
        city,
        state,
        country,
        category: 'patient',
        account_status: 'active',
        activated_on: new Date()
      }, { transaction });

      // Create patient with medical-specific fields
      const patient = await Patient.create({
        user_id: user.id,
        patient_id: generatePatientId(),
        blood_group,
        height_cm,
        weight_kg,
        allergies: Array.isArray(allergies) ? allergies : [],
        chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : [],
        emergency_contact,
        insurance_info,
        primary_doctor_id: creatorId,
        consent_given: true
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
