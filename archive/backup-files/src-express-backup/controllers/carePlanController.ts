// src/controllers/carePlanController.ts
import { Request, Response, NextFunction } from 'express';
import { CarePlan, Patient, Doctor, User, Medication, Appointment, Vital } from '../models/index.js';
import { Op } from 'sequelize';
import '../types/express.js';

class CarePlanController {
  async getPatientCarePlan(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;

      // First verify the patient exists
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

      const carePlans = await CarePlan.findAll({
        where: { 
          patient_id: patientId,
          deleted_at: null 
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [{ model: User, as: 'user' }]
          },
          {
            model: Patient,
            as: 'patient'
          }
        ],
        order: [['created_at', 'DESC']]
      });

      if (!carePlans.length) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'No care plans found for this patient'
            }
          }
        });
      }

      const responseData = {
        care_plans: {},
        treatments: {},
        conditions: {}
      };

      for (const carePlan of carePlans) {
        // Get associated medications, appointments, vitals
        const medications = await Medication.findAll({
          where: { participant_id: patientId }
        });

        const appointments = await Appointment.findAll({
          where: {
            [Op.or]: [
              { participant_two_id: patientId, participant_two_type: 'patient' }
            ]
          }
        });

        const vitals = await Vital.findAll({
          where: { care_plan_id: carePlan.id }
        });

        (responseData as any).care_plans[carePlan.id] = {
          basic_info: {
            id: carePlan.id.toString(),
            patient_id: carePlan.patient_id.toString(),
            doctor_id: carePlan.doctor_id.toString(),
            treatment_id: carePlan.treatment_id?.toString(),
            condition_id: carePlan.details?.condition_id?.toString(),
            severity_id: carePlan.details?.severity_id?.toString(),
            name: carePlan.details?.name || 'Care Plan',
            status: carePlan.details?.status || 'active'
          },
          details: {
            clinical_notes: carePlan.details?.clinical_notes || '',
            follow_up_advise: carePlan.details?.follow_up_advise || '',
            start_date: carePlan.start_date || carePlan.created_at,
            diagnosis: carePlan.diagnosis,
            priority: carePlan.priority
          },
          medication_ids: medications.map((m: any) => m.id),
          appointment_ids: appointments.map((a: any) => a.id),
          vital_ids: vitals.map((v: any) => v.id),
          diet_ids: [], // Implement if diet table exists
          workout_ids: [], // Implement if workout table exists
          created_at: carePlan.created_at,
          updated_at: carePlan.updated_at
        };

        // Add treatment and condition info if available
        if (carePlan.treatment_id) {
          (responseData as any).treatments[carePlan.treatment_id] = {
            basic_info: {
              id: carePlan.treatment_id.toString(),
              name: carePlan.details?.treatment_name || 'Treatment Plan',
              description: carePlan.details?.treatment_description || ''
            }
          };
        }

        if (carePlan.details?.condition_id) {
          (responseData as any).conditions[carePlan.details.condition_id] = {
            basic_info: {
              id: carePlan.details.condition_id.toString(),
              name: carePlan.details?.condition_name || 'Medical Condition',
              description: carePlan.details?.condition_description || ''
            }
          };
        }
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Care plan details retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async createCarePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'User not authenticated'
            }
          }
        });
        return;
      }

      const { patientId } = req.params;
      const {
        treatment_id,
        condition_id,
        severity_id,
        name,
        clinical_notes,
        follow_up_advise,
        start_date
      } = req.body;

      // Get doctor ID from authenticated user
      const doctor = await Doctor.findOne({ where: { userId: req.user!.id } });
      if (!doctor) {
        res.status(403).json({
          status: false,
          statusCode: 403,
          payload: {
            error: {
              status: 'FORBIDDEN',
              message: 'Only doctors can create care plans'
            }
          }
        });
        return;
      }

      const carePlan = await CarePlan.create({
        doctor_id: doctor.id,
        patient_id: patientId,
        start_date,
        activated_on: new Date(),
        details: {
          treatment_id,
          condition_id,
          severity_id,
          name,
          clinical_notes,
          follow_up_advise,
          status: 'active'
        }
      });

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { carePlan },
          message: 'Care plan created successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async updateCarePlan(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { carePlanId } = req.params;
      const updateData = req.body;

      const carePlan = await CarePlan.findByPk(carePlanId);
      if (!carePlan) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Care plan not found'
            }
          }
        });
      }

      // Update details JSON field
      const updatedDetails = { ...carePlan.details, ...updateData };
      await carePlan.update({ details: updatedDetails });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { carePlan },
          message: 'Care plan updated successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new CarePlanController();
