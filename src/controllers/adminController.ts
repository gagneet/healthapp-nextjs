// src/controllers/adminController.ts
import { Request, Response, NextFunction } from 'express';
import '../types/express.js';
import { Doctor, Patient, User, Medicine, Speciality, Medication, Appointment, SymptomsDatabase, TreatmentDatabase, Clinic, UserRole } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { USER_CATEGORIES } from '../config/constants.js';
import { parseQueryParam, parseQueryParamAsNumber } from '../utils/queryHelpers.js';

class AdminController {
  async getDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const pageNum = parseQueryParamAsNumber(page, 1);
      const limitNum = parseQueryParamAsNumber(limit, 20);
      const offset = (pageNum - 1) * limitNum;

      interface WhereClause {
        [Op.or]?: Array<{
          first_name?: { [Op.like]: string };
          last_name?: { [Op.like]: string };
        }>;
      }
      
      const whereClause: WhereClause = {};
      if (search) {
        const searchString = parseQueryParam(search);
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${searchString}%` } },
          { last_name: { [Op.like]: `%${searchString}%` } }
        ];
      }

      const { count, rows: doctors } = await Doctor.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'mobile_number', 'account_status', 'verified']
          },
          {
            model: Speciality,
            as: 'speciality'
          }
        ],
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']]
      });

      const responseData: { doctors: Record<string, any> } = { doctors: {} };

      for (const doctor of doctors) {
        // Get patient count
        const patientCount = await Patient.count({
          where: { assigned_doctor_id: doctor.user_id }
        });

        responseData.doctors[doctor.id] = {
          basic_info: {
            id: doctor.id.toString(),
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            email: doctor.user?.email,
            speciality: doctor.speciality?.name,
            verification_status: doctor.user?.verified ? 'verified' : 'pending',
            account_status: doctor.user?.account_status
          },
          statistics: {
            total_patients: patientCount,
            active_care_plans: 0, // Calculate if needed
            completed_appointments: 0 // Calculate if needed
          }
        };
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count,
            total_pages: Math.ceil(count / limitNum)
          },
          message: 'Doctors retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const pageNum = parseQueryParamAsNumber(page, 1);
      const limitNum = parseQueryParamAsNumber(limit, 20);
      const offset = (pageNum - 1) * limitNum;

      interface MedicineWhereClause {
        name?: { [Op.like]: string };
      }
      
      const whereClause: MedicineWhereClause = {};
      if (search) {
        const searchString = parseQueryParam(search);
        whereClause.name = { [Op.like]: `%${searchString}%` };
      }

      const { count, rows: medicines } = await Medicine.findAndCountAll({
        where: whereClause,
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']]
      });

      const responseData: { medicines: Record<string, any> } = { medicines: {} };

      for (const medicine of medicines) {
        // Get usage statistics
        const prescriptionCount = await Medication.count({
          where: { medicine_id: medicine.id }
        });

        const activePrescriptions = await Medication.count({
          where: { 
            medicine_id: medicine.id,
            end_date: { [Op.gte]: new Date() }
          }
        });

        responseData.medicines[medicine.id] = {
          basic_info: {
            id: medicine.id.toString(),
            name: medicine.name,
            type: medicine.type,
            strength: medicine.details?.strength || '',
            public_medicine: medicine.public_medicine,
            creator_id: medicine.creator_id?.toString(),
            creator_name: 'Dr. System' // Get creator name if needed
          },
          usage_statistics: {
            total_prescriptions: prescriptionCount,
            active_prescriptions: activePrescriptions
          }
        };
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count,
            total_pages: Math.ceil(count / limitNum)
          },
          message: 'Medicines retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get overall system statistics
      const totalDoctors = await Doctor.count();
      const totalPatients = await Patient.count();
      const totalMedicines = await Medicine.count();
      const totalAppointments = await Appointment.count();

      // Get recent activity
      const recentDoctors = await Doctor.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      const recentPatients = await Patient.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: {
            overview: {
              total_doctors: totalDoctors,
              total_patients: totalPatients,
              total_medicines: totalMedicines,
              total_appointments: totalAppointments
            },
            recent_activity: {
              new_doctors_30_days: recentDoctors,
              new_patients_30_days: recentPatients
            }
          },
          message: 'System statistics retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Comprehensive Doctor Creation
  async createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await User.sequelize.transaction();
    
    try {
      const {
        // Basic Information
        full_name,
        first_name,
        middle_name,
        last_name,
        email,
        mobile_number,
        gender,
        password,
        
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
        
        // Initial Clinic Information (optional)
        clinic_name,
        clinic_address,
        clinic_phone,
        clinic_email,
        clinic_operating_hours,
        clinic_services_offered,
        clinic_consultation_fee
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        where: { email }, 
        transaction 
      });
      
      if (existingUser) {
        await transaction.rollback();
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'User with this email already exists'
            }
          }
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password || 'temporaryPassword123!', 12);

      // Create User
      const user = await User.create({
        full_name: full_name || `${first_name || ''} ${middle_name || ''} ${last_name || ''}`.trim(),
        first_name,
        middle_name,
        last_name,
        email,
        phone: mobile_number,
        password: hashedPassword,
        gender,
        user_category: USER_CATEGORIES.DOCTOR,
        account_status: 'active',
        email_verified: false,
        created_by: req.user?.userId
      }, { transaction });

      // Create UserRole
      await UserRole.create({
        user_identity: user.id,
        role_name: USER_CATEGORIES.DOCTOR,
        role_value: 'doctor',
        status: 'active'
      }, { transaction });

      // Create Doctor profile
      const doctor = await Doctor.create({
        user_id: user.id,
        mobile_number,
        gender,
        medical_license_number,
        npi_number,
        speciality_id,
        specialties: Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []),
        sub_specialties: Array.isArray(sub_specialties) ? sub_specialties : (sub_specialties ? [sub_specialties] : []),
        years_of_experience: years_of_experience || 0,
        qualification_details: qualification_details || [],
        medical_school,
        board_certifications: board_certifications || [],
        residency_programs: residency_programs || [],
        registration_details: registration_details || {},
        subscription_details: subscription_details || {},
        razorpay_account_id,
        consultation_fee: consultation_fee || 0,
        practice_name,
        practice_address: practice_address || {},
        practice_phone,
        languages_spoken: languages_spoken || ['en'],
        capabilities: capabilities || [],
        availability_schedule: availability_schedule || {},
        notification_preferences: notification_preferences || {},
        is_verified: false,
        is_available_online: false
      }, { transaction });

      // Create initial clinic if provided
      if (clinic_name) {
        await Clinic.create({
          doctor_id: doctor.id,
          name: clinic_name,
          address: clinic_address || {},
          phone: clinic_phone,
          email: clinic_email,
          operating_hours: clinic_operating_hours || {},
          services_offered: clinic_services_offered || [],
          consultation_fee: clinic_consultation_fee || consultation_fee || 0,
          is_primary: true,
          is_active: true
        }, { transaction });
      }

      await transaction.commit();

      // Fetch the created doctor with all related data
      const createdDoctor = await Doctor.findByPk(doctor.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'phone', 'first_name', 'middle_name', 'last_name', 'gender', 'email_verified', 'created_at']
          },
          {
            model: Speciality,
            as: 'speciality',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Clinic,
            as: 'clinics'
          }
        ]
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { doctor: createdDoctor },
          message: 'Doctor created successfully'
        }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Comprehensive Doctor Update
  async updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await User.sequelize.transaction();
    
    try {
      const { doctorId } = req.params;
      const {
        // Basic Information
        full_name,
        first_name,
        middle_name,
        last_name,
        email,
        mobile_number,
        gender,
        
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
        notification_preferences
      } = req.body;

      // Find doctor with user data
      const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: User, as: 'user' }],
        transaction
      });

      if (!doctor) {
        await transaction.rollback();
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
        return;
      }

      // Update User table (basic info)
      const userUpdateData: Record<string, any> = {};
      if (full_name) {
        // Split full name into components (don't store full_name as it's not a real field)
        const nameParts = full_name.trim().split(' ');
        if (nameParts.length >= 1) (userUpdateData as any).first_name = nameParts[0];
        if (nameParts.length >= 2) (userUpdateData as any).last_name = nameParts[nameParts.length - 1];
        if (nameParts.length >= 3) {
          (userUpdateData as any).middle_name = nameParts.slice(1, -1).join(' ');
        }
      }
      if (first_name) (userUpdateData as any).first_name = first_name;
      if (middle_name) (userUpdateData as any).middle_name = middle_name;
      if (last_name) (userUpdateData as any).last_name = last_name;
      if (email) (userUpdateData as any).email = email;
      if (gender) (userUpdateData as any).gender = gender;
      if (mobile_number) (userUpdateData as any).phone = mobile_number;

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
        ...(notification_preferences && { notification_preferences })
      };

      await doctor.update(doctorUpdateData, { transaction });

      await transaction.commit();

      // Fetch updated doctor
      const updatedDoctor = await Doctor.findByPk(doctorId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'phone', 'first_name', 'middle_name', 'last_name', 'gender', 'email_verified']
          },
          {
            model: Speciality,
            as: 'speciality',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Clinic,
            as: 'clinics'
          }
        ]
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { doctor: updatedDoctor },
          message: 'Doctor updated successfully'
        }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async updateDoctorStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { status, verification_status } = req.body;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: User, as: 'user' }]
      });

      if (!doctor) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
        return;
      }

      // Update user status
      const userUpdateData: Record<string, any> = {};
      if (status) (userUpdateData as any).account_status = status;
      if (verification_status !== undefined) (userUpdateData as any).email_verified = verification_status === 'verified';

      await doctor.user.update(userUpdateData);

      // Update doctor verification status
      const doctorUpdateData: Record<string, any> = {};
      if (verification_status !== undefined) {
        (doctorUpdateData as any).is_verified = verification_status === 'verified';
        if (verification_status === 'verified') {
          (doctorUpdateData as any).verification_date = new Date();
          (doctorUpdateData as any).verified_by = req.user?.userId;
        }
      }

      if (Object.keys(doctorUpdateData).length > 0) {
        await doctor.update(doctorUpdateData);
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { doctor },
          message: 'Doctor status updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single doctor by ID
  async getDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'phone', 'first_name', 'middle_name', 'last_name', 'gender', 'email_verified', 'account_status', 'created_at']
          },
          {
            model: Speciality,
            as: 'speciality',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Clinic,
            as: 'clinics'
          }
        ]
      });

      if (!doctor) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
        return;
      }

      // Get patient count
      const patientCount = await Patient.count({
        where: { primary_care_doctor_id: doctor.id }
      });

      const responseData = {
        profile: {
          // Basic Information
          id: doctor.id.toString(),
          user_id: doctor.user_id.toString(),
          full_name: `${doctor.user?.first_name || ''} ${doctor.user?.middle_name || ''} ${doctor.user?.last_name || ''}`.replace(/\s+/g, ' ').trim(),
          first_name: doctor.user?.first_name || '',
          middle_name: doctor.user?.middle_name || '',
          last_name: doctor.user?.last_name || '',
          email: doctor.user?.email,
          mobile_number: doctor.mobile_number || doctor.user?.phone,
          gender: doctor.gender || doctor.user?.gender,
          
          // Verification Status (Read Only)
          is_verified: doctor.is_verified,
          verification_date: doctor.verification_date,
          email_verified: doctor.user?.email_verified,
          account_status: doctor.user?.account_status,
          
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
          total_patients: patientCount,
          is_available_online: doctor.is_available_online,
          
          // Timestamps
          created_at: doctor.created_at,
          updated_at: doctor.updated_at
        },
        
        // Clinics
        clinics: doctor.clinics ? doctor.clinics.map((clinic: any) => ({
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
          message: 'Doctor details retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete doctor (soft delete)
  async deleteDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await User.sequelize.transaction();
    
    try {
      const { doctorId } = req.params;

      const doctor = await Doctor.findByPk(doctorId, {
        include: [{ model: User, as: 'user' }],
        transaction
      });

      if (!doctor) {
        await transaction.rollback();
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Doctor not found'
            }
          }
        });
        return;
      }

      // Check if doctor has active patients
      const activePatients = await Patient.count({
        where: { primary_care_doctor_id: doctor.id },
        transaction
      });

      if (activePatients > 0) {
        await transaction.rollback();
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: `Cannot delete doctor with ${activePatients} active patients`
            }
          }
        });
        return;
      }

      // Soft delete user account
      await doctor.user.update({ 
        account_status: 'deleted',
        deleted_at: new Date()
      }, { transaction });

      // Deactivate all clinics
      await Clinic.update(
        { is_active: false },
        { 
          where: { doctor_id: doctor.id },
          transaction 
        }
      );

      await transaction.commit();

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Doctor deleted successfully'
        }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Medicine CRUD Operations
  async createMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, type, strength, generic_name, description, public_medicine = true } = req.body;

      const medicine = await Medicine.create({
        name,
        type,
        details: {
          strength,
          generic_name
        },
        description,
        public_medicine,
        creator_id: req.user?.userId
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { medicine },
          message: 'Medicine created successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { medicineId } = req.params;
      const { name, type, strength, generic_name, description, public_medicine } = req.body;

      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Medicine not found'
            }
          }
        });
        return;
      }

      await medicine.update({
        name,
        type,
        details: {
          strength,
          generic_name
        },
        description,
        public_medicine
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { medicine },
          message: 'Medicine updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { medicineId } = req.params;

      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Medicine not found'
            }
          }
        });
        return;
      }

      // Check if medicine is being used in active prescriptions
      const activeUsage = await Medication.count({
        where: { 
          medicine_id: medicineId,
          end_date: { [Op.gte]: new Date() }
        }
      });

      if (activeUsage > 0) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Cannot delete medicine with active prescriptions'
            }
          }
        });
        return;
      }

      await medicine.destroy();

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Medicine deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Condition Management using SymptomsDatabase
  async getConditions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const pageNum = parseQueryParamAsNumber(page, 1);
      const limitNum = parseQueryParamAsNumber(limit, 20);
      const offset = (pageNum - 1) * limitNum;

      interface ConditionWhereClause {
        is_active: boolean;
        diagnosis_name?: { [Op.like]: string };
      }
      
      const whereClause: ConditionWhereClause = { is_active: true };
      if (search) {
        const searchString = parseQueryParam(search);
        whereClause.diagnosis_name = { [Op.like]: `%${searchString}%` };
      }

      const { count, rows: conditions } = await SymptomsDatabase.findAndCountAll({
        where: whereClause,
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']]
      });

      const responseData: { conditions: Record<string, any> } = { conditions: {} };

      for (const condition of conditions) {
        responseData.conditions[condition.id] = {
          basic_info: {
            id: condition.id.toString(),
            diagnosis_name: condition.diagnosis_name,
            category: condition.category,
            symptoms: condition.symptoms,
            severity_indicators: condition.severity_indicators,
            common_age_groups: condition.common_age_groups,
            gender_specific: condition.gender_specific,
            is_active: condition.is_active
          },
          metadata: {
            created_by: condition.created_by?.toString(),
            created_at: condition.created_at,
            updated_at: condition.updated_at
          }
        };
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count,
            total_pages: Math.ceil(count / limitNum)
          },
          message: 'Conditions retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createCondition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        diagnosis_name, 
        category, 
        symptoms, 
        severity_indicators,
        common_age_groups,
        gender_specific = 'both'
      } = req.body;

      const condition = await SymptomsDatabase.create({
        diagnosis_name,
        category,
        symptoms: Array.isArray(symptoms) ? symptoms : JSON.parse(symptoms || '[]'),
        severity_indicators: typeof severity_indicators === 'object' ? severity_indicators : JSON.parse(severity_indicators || '{}'),
        common_age_groups: Array.isArray(common_age_groups) ? common_age_groups : JSON.parse(common_age_groups || '[]'),
        gender_specific,
        is_active: true,
        created_by: req.user?.userId
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { condition },
          message: 'Condition created successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCondition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conditionId } = req.params;
      const { 
        diagnosis_name, 
        category, 
        symptoms, 
        severity_indicators,
        common_age_groups,
        gender_specific,
        is_active
      } = req.body;

      const condition = await SymptomsDatabase.findByPk(conditionId);
      if (!condition) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Condition not found'
            }
          }
        });
        return;
      }

      await condition.update({
        diagnosis_name,
        category,
        symptoms: Array.isArray(symptoms) ? symptoms : JSON.parse(symptoms || '[]'),
        severity_indicators: typeof severity_indicators === 'object' ? severity_indicators : JSON.parse(severity_indicators || '{}'),
        common_age_groups: Array.isArray(common_age_groups) ? common_age_groups : JSON.parse(common_age_groups || '[]'),
        gender_specific,
        is_active
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { condition },
          message: 'Condition updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCondition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conditionId } = req.params;

      const condition = await SymptomsDatabase.findByPk(conditionId);
      if (!condition) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Condition not found'
            }
          }
        });
        return;
      }

      // Soft delete by setting is_active to false
      await condition.update({ is_active: false });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Condition deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Treatment Management using TreatmentDatabase
  async getTreatments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const pageNum = parseQueryParamAsNumber(page, 1);
      const limitNum = parseQueryParamAsNumber(limit, 20);
      const offset = (pageNum - 1) * limitNum;

      interface TreatmentWhereClause {
        is_active: boolean;
        treatment_name?: { [Op.like]: string };
      }
      
      const whereClause: TreatmentWhereClause = { is_active: true };
      if (search) {
        const searchString = parseQueryParam(search);
        whereClause.treatment_name = { [Op.like]: `%${searchString}%` };
      }

      const { count, rows: treatments } = await TreatmentDatabase.findAndCountAll({
        where: whereClause,
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']]
      });

      const responseData: { treatments: Record<string, any> } = { treatments: {} };

      for (const treatment of treatments) {
        responseData.treatments[treatment.id] = {
          basic_info: {
            id: treatment.id.toString(),
            treatment_name: treatment.treatment_name,
            treatment_type: treatment.treatment_type,
            description: treatment.description,
            applicable_conditions: treatment.applicable_conditions,
            duration: treatment.duration,
            frequency: treatment.frequency,
            dosage_info: treatment.dosage_info,
            category: treatment.category,
            severity_level: treatment.severity_level,
            requires_specialist: treatment.requires_specialist,
            prescription_required: treatment.prescription_required,
            is_active: treatment.is_active
          },
          safety_info: {
            age_restrictions: treatment.age_restrictions,
            contraindications: treatment.contraindications,
            side_effects: treatment.side_effects,
            monitoring_required: treatment.monitoring_required
          },
          metadata: {
            created_by: treatment.created_by?.toString(),
            created_at: treatment.created_at,
            updated_at: treatment.updated_at
          }
        };
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count,
            total_pages: Math.ceil(count / limitNum)
          },
          message: 'Treatments retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        treatment_name, 
        treatment_type,
        description,
        applicable_conditions,
        duration,
        frequency,
        dosage_info,
        category,
        severity_level,
        age_restrictions,
        contraindications,
        side_effects,
        monitoring_required,
        requires_specialist = false,
        prescription_required = false
      } = req.body;

      const treatment = await TreatmentDatabase.create({
        treatment_name,
        treatment_type,
        description,
        applicable_conditions: Array.isArray(applicable_conditions) ? applicable_conditions : JSON.parse(applicable_conditions || '[]'),
        duration,
        frequency,
        dosage_info: typeof dosage_info === 'object' ? dosage_info : JSON.parse(dosage_info || '{}'),
        category,
        severity_level,
        age_restrictions: typeof age_restrictions === 'object' ? age_restrictions : JSON.parse(age_restrictions || '{}'),
        contraindications: Array.isArray(contraindications) ? contraindications : JSON.parse(contraindications || '[]'),
        side_effects: Array.isArray(side_effects) ? side_effects : JSON.parse(side_effects || '[]'),
        monitoring_required: Array.isArray(monitoring_required) ? monitoring_required : JSON.parse(monitoring_required || '[]'),
        requires_specialist,
        prescription_required,
        is_active: true,
        created_by: req.user?.userId
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { treatment },
          message: 'Treatment created successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { treatmentId } = req.params;
      const { 
        treatment_name, 
        treatment_type,
        description,
        applicable_conditions,
        duration,
        frequency,
        dosage_info,
        category,
        severity_level,
        age_restrictions,
        contraindications,
        side_effects,
        monitoring_required,
        requires_specialist,
        prescription_required,
        is_active
      } = req.body;

      const treatment = await TreatmentDatabase.findByPk(treatmentId);
      if (!treatment) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Treatment not found'
            }
          }
        });
        return;
      }

      await treatment.update({
        treatment_name,
        treatment_type,
        description,
        applicable_conditions: Array.isArray(applicable_conditions) ? applicable_conditions : JSON.parse(applicable_conditions || '[]'),
        duration,
        frequency,
        dosage_info: typeof dosage_info === 'object' ? dosage_info : JSON.parse(dosage_info || '{}'),
        category,
        severity_level,
        age_restrictions: typeof age_restrictions === 'object' ? age_restrictions : JSON.parse(age_restrictions || '{}'),
        contraindications: Array.isArray(contraindications) ? contraindications : JSON.parse(contraindications || '[]'),
        side_effects: Array.isArray(side_effects) ? side_effects : JSON.parse(side_effects || '[]'),
        monitoring_required: Array.isArray(monitoring_required) ? monitoring_required : JSON.parse(monitoring_required || '[]'),
        requires_specialist,
        prescription_required,
        is_active
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { treatment },
          message: 'Treatment updated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { treatmentId } = req.params;

      const treatment = await TreatmentDatabase.findByPk(treatmentId);
      if (!treatment) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Treatment not found'
            }
          }
        });
        return;
      }

      // Soft delete by setting is_active to false
      await treatment.update({ is_active: false });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Treatment deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
