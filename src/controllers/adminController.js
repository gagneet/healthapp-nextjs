// src/controllers/adminController.js
import { Doctor, Patient, User, Medicine, Speciality, Medication, Appointment } from '../models/index.js';
import { Op } from 'sequelize';

class AdminController {
  async getDoctors(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } }
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
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      const responseData = { doctors: {} };

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
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          },
          message: 'Doctors retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMedicines(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (search) {
        whereClause.name = { [Op.like]: `%${search}%` };
      }

      const { count, rows: medicines } = await Medicine.findAndCountAll({
        where: whereClause,
        offset,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      const responseData = { medicines: {} };

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
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          },
          message: 'Medicines retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req, res, next) {
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

  async updateDoctorStatus(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { status, verification_status } = req.body;

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

      // Update user status
      const updateData = {};
      if (status) updateData.account_status = status;
      if (verification_status) updateData.verified = verification_status === 'verified';

      await doctor.user.update(updateData);

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

  // Medicine CRUD Operations
  async createMedicine(req, res, next) {
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
        creator_id: req.user.id
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

  async updateMedicine(req, res, next) {
    try {
      const { medicineId } = req.params;
      const { name, type, strength, generic_name, description, public_medicine } = req.body;

      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Medicine not found'
            }
          }
        });
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

  async deleteMedicine(req, res, next) {
    try {
      const { medicineId } = req.params;

      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Medicine not found'
            }
          }
        });
      }

      // Check if medicine is being used in active prescriptions
      const activeUsage = await Medication.count({
        where: { 
          medicine_id: medicineId,
          end_date: { [Op.gte]: new Date() }
        }
      });

      if (activeUsage > 0) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Cannot delete medicine with active prescriptions'
            }
          }
        });
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

  // Condition Management (Simple string-based conditions)
  async getConditions(req, res, next) {
    try {
      // For simplicity, return hardcoded conditions that can be managed
      const conditions = [
        'Acute', 'Chronic', 'Stable', 'Progressive', 'Terminal', 
        'Recovering', 'Under Investigation', 'Monitoring Required', 'Emergency'
      ];

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { conditions },
          message: 'Conditions retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createCondition(req, res, next) {
    try {
      // This would require a new Condition model/table
      res.status(501).json({
        status: false,
        statusCode: 501,
        payload: {
          error: {
            status: 'NOT_IMPLEMENTED',
            message: 'Condition creation not implemented - using predefined list'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCondition(req, res, next) {
    try {
      res.status(501).json({
        status: false,
        statusCode: 501,
        payload: {
          error: {
            status: 'NOT_IMPLEMENTED',
            message: 'Condition update not implemented - using predefined list'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCondition(req, res, next) {
    try {
      res.status(501).json({
        status: false,
        statusCode: 501,
        payload: {
          error: {
            status: 'NOT_IMPLEMENTED',
            message: 'Condition deletion not implemented - using predefined list'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Treatment Management (Simple string-based treatments)
  async getTreatments(req, res, next) {
    try {
      const treatments = [
        'Medication', 'Surgery', 'Hip Replacement', 'Chemotherapy',
        'Diet & Nutrition', 'Exercise & Lifestyle', 'Saline', 'Other'
      ];

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { treatments },
          message: 'Treatments retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createTreatment(req, res, next) {
    try {
      res.status(501).json({
        status: false,
        statusCode: 501,
        payload: {
          error: {
            status: 'NOT_IMPLEMENTED',
            message: 'Treatment creation not implemented - using predefined list'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTreatment(req, res, next) {
    try {
      res.status(501).json({
        status: false,
        statusCode: 501,
        payload: {
          error: {
            status: 'NOT_IMPLEMENTED',
            message: 'Treatment update not implemented - using predefined list'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTreatment(req, res, next) {
    try {
      res.status(501).json({
        status: false,
        statusCode: 501,
        payload: {
          error: {
            status: 'NOT_IMPLEMENTED',
            message: 'Treatment deletion not implemented - using predefined list'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
