// src/controllers/patientController.js
const { Patient, User, Doctor, CarePlan, Medication, Appointment } = require('../models');
const { Op } = require('sequelize');
const { PAGINATION } = require('../config/constants');

class PatientController {
  async getPatient(req, res, next) {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findByPk(patientId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'mobile_number', 'user_name']
          },
          {
            model: User,
            as: 'assignedDoctor',
            attributes: ['user_name', 'email']
          }
        ]
      });

      if (!patient) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Patient not found'
            }
          }
        });
      }

      // Format response according to API documentation
      const responseData = {
        patients: {
          [patient.id]: {
            basic_info: {
              id: patient.id.toString(),
              user_id: patient.user_id.toString(),
              gender: patient.gender,
              height: patient.height,
              weight: patient.weight,
              height_cm: patient.height_cm,
              weight_kg: patient.weight_kg,
              current_age: patient.current_age,
              age: `${patient.current_age} years`,
              first_name: patient.first_name,
              middle_name: patient.middle_name,
              last_name: patient.last_name,
              full_name: `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim(),
              address: `${patient.street || ''} ${patient.city || ''} ${patient.state || ''}`.trim(),
              uid: patient.uid,
              mobile_number: patient.user?.mobile_number
            },
            payment_terms_accepted: !!patient.payment_terms_accepted,
            activated_on: patient.activated_on,
            details: {
              profile_pic: patient.details?.profile_pic || null,
              comorbidities: patient.details?.comorbidities || null,
              allergies: patient.details?.allergies || null
            },
            dob: patient.dob,
            created_at: patient.created_at,
            care_plan_id: null, // Get from active care plan
            user_role_id: null, // Get from user roles
            feedId: Buffer.from(`patient_${patient.id}`).toString('base64'),
            notificationToken: 'getstream_token'
          }
        }
      };

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Patient details retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatients(req, res, next) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { uid: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add doctor filter if user is a doctor
      if (req.userCategory === 'doctor') {
        // Get doctor's patients only (implement based on your business logic)
      }

      const { count, rows: patients } = await Patient.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'mobile_number']
          }
        ],
        offset,
        limit: parseInt(limit),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      const responseData = {
        patients: {}
      };

      patients.forEach(patient => {
        responseData.patients[patient.id] = {
          basic_info: {
            id: patient.id.toString(),
            first_name: patient.first_name,
            last_name: patient.last_name,
            mobile_number: patient.user?.mobile_number,
            current_age: patient.current_age,
            gender: patient.gender
          }
        };
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
          },
          message: 'Patients retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createPatient(req, res, next) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        gender,
        dob,
        mobile_number,
        email,
        address,
        comorbidities,
        allergies,
        height_cm,
        weight_kg
      } = req.body;

      // Create user account for patient
      const user = await User.create({
        email,
        mobile_number,
        user_name: `${first_name} ${last_name}`,
        category: 'patient',
        account_status: 'active'
      });

      // Create patient record
      const patient = await Patient.create({
        user_id: user.id,
        first_name,
        middle_name,
        last_name,
        gender,
        dob,
        height_cm,
        weight_kg,
        street: address,
        details: {
          comorbidities,
          allergies
        },
        uid: `PAT${String(user.id).padStart(6, '0')}`
      });

      // Create user role
      await UserRole.create({
        user_identity: user.id,
        linked_with: 'patient',
        linked_id: patient.id
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: {
            patient: {
              id: patient.id,
              user_id: user.id,
              uid: patient.uid
            }
          },
          message: 'Patient created successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePatient(req, res, next) {
    try {
      const { patientId } = req.params;
      const updateData = req.body;

      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Patient not found'
            }
          }
        });
      }

      await patient.update(updateData);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { patient },
          message: 'Patient updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePatient(req, res, next) {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Patient not found'
            }
          }
        });
      }

      await patient.destroy(); // Soft delete

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Patient deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PatientController();
