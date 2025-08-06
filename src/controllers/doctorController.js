// src/controllers/doctorController.js
import { Doctor, User, Speciality, Patient, CarePlan } from '../models/index.js';
import { Op } from 'sequelize';

class DoctorController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.user_id;

      const doctor = await Doctor.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'mobile_number', 'user_name', 'first_name', 'middle_name', 'last_name', 'gender']
          },
          {
            model: Speciality,
            as: 'speciality'
          }
        ]
      });

      if (!doctor) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor profile not found'
            }
          }
        });
      }

      // Get doctor's patients (watchlist)
      const watchlistPatients = await Patient.findAll({
        where: { assigned_doctor_id: doctor.user_id },
        attributes: ['id']
      });

      const responseData = {
        doctors: {
          [doctor.id]: {
            basic_info: {
              id: doctor.id.toString(),
              user_id: doctor.user_id.toString(),
              gender: doctor.user?.gender || 'not_specified',
              first_name: doctor.user?.first_name || '',
              middle_name: doctor.user?.middle_name || '',
              last_name: doctor.user?.last_name || '',
              full_name: `${doctor.user?.first_name || ''} ${doctor.user?.middle_name || ''} ${doctor.user?.last_name || ''}`.trim(),
              email: doctor.user?.email,
              mobile_number: doctor.user?.mobile_number,
              speciality_id: doctor.speciality_id?.toString(),
              specialties: doctor.specialties || [],
              years_of_experience: doctor.years_of_experience,
              is_verified: doctor.is_verified,
              practice_name: doctor.practice_name,
              medical_school: doctor.medical_school,
              board_certifications: doctor.board_certifications || [],
              consultation_fee: doctor.consultation_fee,
              signature_pic: doctor.signature_pic
            },
            qualifications: doctor.board_certifications || [],
            activated_on: doctor.created_at,
            razorpay_account_id: doctor.razorpay_account_id,
            watchlist_patient_ids: watchlistPatients.map(p => p.id),
            availability_schedule: doctor.availability_schedule,
            languages_spoken: doctor.languages_spoken || ['en']
          }
        },
        specialities: doctor.speciality ? {
          [doctor.speciality.id]: {
            basic_info: {
              id: doctor.speciality.id.toString(),
              name: doctor.speciality.name,
              description: doctor.speciality.description
            }
          }
        } : {}
      };

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Doctor profile retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'mobile_number', 'user_name', 'first_name', 'middle_name', 'last_name', 'gender']
          },
          {
            model: Speciality,
            as: 'speciality'
          }
        ]
      });

      if (!doctor) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
      }

      // Get doctor's patients (watchlist)
      const watchlistPatients = await Patient.findAll({
        where: { assigned_doctor_id: doctor.user_id },
        attributes: ['id']
      });

      const responseData = {
        doctors: {
          [doctor.id]: {
            basic_info: {
              id: doctor.id.toString(),
              user_id: doctor.user_id.toString(),
              gender: doctor.gender,
              first_name: doctor.first_name,
              middle_name: doctor.middle_name,
              last_name: doctor.last_name,
              full_name: `${doctor.first_name} ${doctor.middle_name || ''} ${doctor.last_name}`.trim(),
              city: doctor.city,
              place_id: doctor.place_id,
              latitude: doctor.latitude,
              longitude: doctor.longitude,
              speciality_id: doctor.speciality_id?.toString(),
              profile_pic: doctor.profile_pic,
              signature_pic: doctor.signature_pic
            },
            qualifications: [], // Implement if qualifications table exists
            activated_on: doctor.activated_on,
            razorpay_account_id: null, // Implement if payment integration exists
            watchlist_patient_ids: watchlistPatients.map(p => p.id)
          }
        },
        specialities: doctor.speciality ? {
          [doctor.speciality.id]: {
            basic_info: {
              id: doctor.speciality.id.toString(),
              name: doctor.speciality.name,
              description: doctor.speciality.description
            }
          }
        } : {}
      };

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Doctor details retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const updateData = req.body;

      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
      }

      await doctor.update(updateData);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { doctor },
          message: 'Doctor profile updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorPatients(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
      }

      const offset = (page - 1) * limit;
      const { count, rows: patients } = await Patient.findAndCountAll({
        where: { assigned_doctor_id: doctor.user_id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'mobile_number']
          }
        ],
        offset,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      const responseData = { patients: {} };
      patients.forEach(patient => {
        responseData.patients[patient.id] = {
          basic_info: {
            id: patient.id.toString(),
            first_name: patient.first_name,
            last_name: patient.last_name,
            current_age: patient.current_age,
            gender: patient.gender,
            mobile_number: patient.user?.mobile_number
          }
        };
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          },
          message: 'Doctor patients retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();
