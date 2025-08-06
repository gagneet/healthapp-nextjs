// src/controllers/doctorController.js
import { Doctor, User, Speciality, Patient, CarePlan, Clinic } from '../models/index.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/doctors/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profile_picture' || file.fieldname === 'banner_image' || file.fieldname === 'signature_image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

class DoctorController {
  // Get comprehensive doctor profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const doctor = await Doctor.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'phone', 'full_name', 'first_name', 'middle_name', 'last_name', 'gender', 'profile_picture_url', 'email_verified', 'created_at']
          },
          {
            model: Speciality,
            as: 'speciality',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Clinic,
            as: 'clinics',
            attributes: ['id', 'name', 'address', 'phone', 'email', 'website', 'operating_hours', 'services_offered', 'banner_image', 'is_primary', 'consultation_fee', 'is_active']
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

      // Get doctor's patients count
      const patientsCount = await Patient.count({
        where: { primary_care_doctor_id: doctor.id }
      });

      const responseData = {
        profile: {
          // Basic Information
          id: doctor.id.toString(),
          user_id: doctor.user_id.toString(),
          full_name: doctor.user?.full_name || `${doctor.user?.first_name || ''} ${doctor.user?.last_name || ''}`.trim(),
          first_name: doctor.user?.first_name || '',
          middle_name: doctor.user?.middle_name || '',
          last_name: doctor.user?.last_name || '',
          email: doctor.user?.email,
          mobile_number: doctor.mobile_number || doctor.user?.phone,
          gender: doctor.gender || doctor.user?.gender,
          
          // Profile Images
          profile_picture_url: doctor.profile_picture_url || doctor.user?.profile_picture_url,
          banner_image_url: doctor.banner_image_url,
          signature_image_url: doctor.signature_image_url,
          signature_data: doctor.signature_data,
          
          // Verification Status (Read Only)
          is_verified: doctor.is_verified,
          verification_date: doctor.verification_date,
          email_verified: doctor.user?.email_verified,
          
          // Professional Details
          medical_license_number: doctor.medical_license_number,
          npi_number: doctor.npi_number,
          speciality_id: doctor.speciality_id,
          speciality: doctor.speciality ? {
            id: doctor.speciality.id,
            name: doctor.speciality.name,
            description: doctor.speciality.description
          } : null,
          specialties: doctor.specialties || [],
          sub_specialties: doctor.sub_specialties || [],
          years_of_experience: doctor.years_of_experience,
          
          // Qualification Details
          qualification_details: doctor.qualification_details || [],
          medical_school: doctor.medical_school,
          board_certifications: doctor.board_certifications || [],
          residency_programs: doctor.residency_programs || [],
          
          // Registration Details
          registration_details: doctor.registration_details || {},
          
          // Subscription & Payment Details
          subscription_details: doctor.subscription_details || {},
          razorpay_account_id: doctor.razorpay_account_id,
          consultation_fee: doctor.consultation_fee,
          
          // Practice Information
          practice_name: doctor.practice_name,
          practice_address: doctor.practice_address || {},
          practice_phone: doctor.practice_phone,
          languages_spoken: doctor.languages_spoken || ['en'],
          
          // Capabilities and Schedule
          capabilities: doctor.capabilities || [],
          availability_schedule: doctor.availability_schedule || {},
          notification_preferences: doctor.notification_preferences || {},
          
          // Statistics
          total_patients: patientsCount,
          active_treatment_plans: doctor.active_treatment_plans || 0,
          active_care_plans: doctor.active_care_plans || 0,
          average_rating: doctor.average_rating,
          total_reviews: doctor.total_reviews || 0,
          is_available_online: doctor.is_available_online,
          
          // Timestamps
          created_at: doctor.created_at,
          updated_at: doctor.updated_at
        },
        
        // Clinics
        clinics: doctor.clinics ? doctor.clinics.map(clinic => ({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          email: clinic.email,
          website: clinic.website,
          operating_hours: clinic.operating_hours,
          services_offered: clinic.services_offered || [],
          banner_image: clinic.banner_image,
          is_primary: clinic.is_primary,
          consultation_fee: clinic.consultation_fee,
          is_active: clinic.is_active
        })) : []
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

  // Update comprehensive doctor profile
  async updateProfile(req, res, next) {
    const transaction = await Doctor.sequelize.transaction();
    
    try {
      const userId = req.user.id;
      const {
        // Basic Information
        full_name,
        gender,
        mobile_number,
        
        // Professional Details
        medical_license_number,
        npi_number,
        speciality_id,
        specialties,
        sub_specialties,
        years_of_experience,
        
        // Qualification Details
        qualification_details,
        medical_school,
        board_certifications,
        residency_programs,
        
        // Registration Details
        registration_details,
        
        // Subscription Details
        subscription_details,
        razorpay_account_id,
        consultation_fee,
        
        // Practice Information
        practice_name,
        practice_address,
        practice_phone,
        languages_spoken,
        
        // Capabilities and Schedule
        capabilities,
        availability_schedule,
        notification_preferences,
        
        // Digital Signature
        signature_data
      } = req.body;

      // Find doctor
      const doctor = await Doctor.findOne({
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }],
        transaction
      });

      if (!doctor) {
        await transaction.rollback();
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

      // Update User table (basic info)
      const userUpdateData = {};
      if (full_name) {
        userUpdateData.full_name = full_name;
        // Split full name into components
        const nameParts = full_name.trim().split(' ');
        if (nameParts.length >= 1) userUpdateData.first_name = nameParts[0];
        if (nameParts.length >= 2) userUpdateData.last_name = nameParts[nameParts.length - 1];
        if (nameParts.length >= 3) {
          userUpdateData.middle_name = nameParts.slice(1, -1).join(' ');
        }
      }
      if (gender) userUpdateData.gender = gender;
      if (mobile_number) userUpdateData.phone = mobile_number;

      if (Object.keys(userUpdateData).length > 0) {
        await doctor.user.update(userUpdateData, { transaction });
      }

      // Update Doctor table
      const doctorUpdateData = {
        ...(mobile_number && { mobile_number }),
        ...(gender && { gender }),
        ...(medical_license_number && { medical_license_number }),
        ...(npi_number && { npi_number }),
        ...(speciality_id && { speciality_id }),
        ...(specialties && { specialties: Array.isArray(specialties) ? specialties : [specialties] }),
        ...(sub_specialties && { sub_specialties: Array.isArray(sub_specialties) ? sub_specialties : [sub_specialties] }),
        ...(years_of_experience !== undefined && { years_of_experience }),
        ...(qualification_details && { qualification_details }),
        ...(medical_school && { medical_school }),
        ...(board_certifications && { board_certifications }),
        ...(residency_programs && { residency_programs }),
        ...(registration_details && { registration_details }),
        ...(subscription_details && { subscription_details }),
        ...(razorpay_account_id && { razorpay_account_id }),
        ...(consultation_fee !== undefined && { consultation_fee }),
        ...(practice_name && { practice_name }),
        ...(practice_address && { practice_address }),
        ...(practice_phone && { practice_phone }),
        ...(languages_spoken && { languages_spoken }),
        ...(capabilities && { capabilities }),
        ...(availability_schedule && { availability_schedule }),
        ...(notification_preferences && { notification_preferences }),
        ...(signature_data && { signature_data })
      };

      await doctor.update(doctorUpdateData, { transaction });

      await transaction.commit();

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Doctor profile updated successfully'
        }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Upload profile images (profile picture, banner, signature)
  async uploadImages(req, res, next) {
    try {
      const userId = req.user.id;
      const uploadFields = upload.fields([
        { name: 'profile_picture', maxCount: 1 },
        { name: 'banner_image', maxCount: 1 },
        { name: 'signature_image', maxCount: 1 }
      ]);

      uploadFields(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            status: false,
            statusCode: 400,
            payload: {
              error: {
                status: 'UPLOAD_ERROR',
                message: err.message
              }
            }
          });
        }

        const doctor = await Doctor.findOne({ where: { user_id: userId } });
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

        const updateData = {};
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/doctors/`;

        if (req.files.profile_picture) {
          updateData.profile_picture_url = baseUrl + req.files.profile_picture[0].filename;
        }
        if (req.files.banner_image) {
          updateData.banner_image_url = baseUrl + req.files.banner_image[0].filename;
        }
        if (req.files.signature_image) {
          updateData.signature_image_url = baseUrl + req.files.signature_image[0].filename;
        }

        await doctor.update(updateData);

        res.status(200).json({
          status: true,
          statusCode: 200,
          payload: {
            data: {
              uploaded_files: updateData
            },
            message: 'Images uploaded successfully'
          }
        });
      });
    } catch (error) {
      next(error);
    }
  }

  // Get doctor by ID (for admin/other users)
  async getDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'full_name', 'first_name', 'last_name', 'email_verified']
          },
          {
            model: Speciality,
            as: 'speciality'
          },
          {
            model: Clinic,
            as: 'clinics',
            where: { is_active: true },
            required: false
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

      const patientsCount = await Patient.count({
        where: { primary_care_doctor_id: doctor.id }
      });

      const responseData = {
        id: doctor.id.toString(),
        user_id: doctor.user_id.toString(),
        full_name: doctor.user?.full_name,
        first_name: doctor.user?.first_name,
        last_name: doctor.user?.last_name,
        email: doctor.user?.email,
        mobile_number: doctor.mobile_number,
        gender: doctor.gender,
        profile_picture_url: doctor.profile_picture_url,
        banner_image_url: doctor.banner_image_url,
        is_verified: doctor.is_verified,
        email_verified: doctor.user?.email_verified,
        medical_license_number: doctor.medical_license_number,
        speciality: doctor.speciality,
        specialties: doctor.specialties,
        years_of_experience: doctor.years_of_experience,
        practice_name: doctor.practice_name,
        consultation_fee: doctor.consultation_fee,
        languages_spoken: doctor.languages_spoken,
        is_available_online: doctor.is_available_online,
        total_patients: patientsCount,
        average_rating: doctor.average_rating,
        total_reviews: doctor.total_reviews,
        clinics: doctor.clinics,
        created_at: doctor.created_at
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

  // Get doctor's patients
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
        where: { primary_care_doctor_id: doctor.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'phone', 'full_name']
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
            full_name: patient.user?.full_name,
            current_age: patient.current_age,
            gender: patient.gender,
            mobile_number: patient.user?.phone,
            email: patient.user?.email
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

  // Clinic Management Methods

  // Get doctor's clinics
  async getClinics(req, res, next) {
    try {
      const userId = req.user.id;

      const doctor = await Doctor.findOne({ where: { user_id: userId } });
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

      const clinics = await Clinic.findAll({
        where: { doctor_id: doctor.id, is_active: true },
        order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { clinics },
          message: 'Doctor clinics retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new clinic
  async createClinic(req, res, next) {
    try {
      const userId = req.user.id;
      const clinicData = req.body;

      const doctor = await Doctor.findOne({ where: { user_id: userId } });
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

      const clinic = await Clinic.create({
        ...clinicData,
        doctor_id: doctor.id
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { clinic },
          message: 'Clinic created successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update clinic
  async updateClinic(req, res, next) {
    try {
      const { clinicId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const doctor = await Doctor.findOne({ where: { user_id: userId } });
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

      const clinic = await Clinic.findOne({
        where: { id: clinicId, doctor_id: doctor.id }
      });

      if (!clinic) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Clinic not found'
            }
          }
        });
      }

      await clinic.update(updateData);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { clinic },
          message: 'Clinic updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete clinic (soft delete)
  async deleteClinic(req, res, next) {
    try {
      const { clinicId } = req.params;
      const userId = req.user.id;

      const doctor = await Doctor.findOne({ where: { user_id: userId } });
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

      const clinic = await Clinic.findOne({
        where: { id: clinicId, doctor_id: doctor.id }
      });

      if (!clinic) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Clinic not found'
            }
          }
        });
      }

      await clinic.update({ is_active: false });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Clinic deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Legacy update method for backward compatibility
  async updateDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const updateData = req.body;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: User, as: 'user' }]
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

      // Basic update for legacy compatibility
      await doctor.update(updateData);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { doctor },
          message: 'Doctor updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();