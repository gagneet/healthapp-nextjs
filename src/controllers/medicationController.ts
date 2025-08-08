// src/controllers/medicationController.ts
import { Request, Response, NextFunction } from 'express';
import '../types/express.js';
import { Medication, Medicine, Patient, User, ScheduleEvent } from '../models/index.js';
import { Op } from 'sequelize';

class MedicationController {
  async getPatientMedications(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;

      const medications = await Medication.findAll({
        where: { 
          participant_id: patientId,
          deleted_at: null 
        },
        include: [
          {
            model: Medicine,
            as: 'medicine'
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const responseData = {
        medication_reminders: {},
        medicines: {}
      };

      medications.forEach((medication: any) => {
        (responseData as any).medication_reminders[medication.id] = {
          basic_info: {
            id: medication.id.toString(),
            description: medication.description,
            details: {
              medicine_id: medication.medicine_id.toString(),
              quantity: medication.details?.quantity || 1,
              strength: medication.details?.strength || '',
              unit: medication.details?.unit || 'tablet',
              when_to_take: medication.details?.when_to_take || '',
              repeat_type: medication.details?.repeat_type || 'daily',
              custom_repeat_options: medication.details?.custom_repeat_options || {}
            },
            start_date: medication.start_date,
            end_date: medication.end_date,
            updated_at: medication.updated_at,
            created_at: medication.created_at
          },
          organizer: {
            id: medication.organizer_id.toString(),
            category: medication.organizer_type,
            name: 'Dr. John Smith' // Get from organizer details
          },
          participant_id: medication.participant_id.toString(),
          rr_rule: medication.rr_rule,
          remaining: this.calculateRemaining(medication),
          total: this.calculateTotal(medication),
          latest_pending_event_id: null // Get from schedule events
        };

        if (medication.medicine) {
          (responseData as any).medicines[medication.medicine.id] = {
            basic_info: {
              id: medication.medicine.id.toString(),
              name: medication.medicine.name,
              type: medication.medicine.type,
              details: medication.medicine.details || {},
              description: medication.medicine.description,
              creator_id: medication.medicine.creator_id?.toString(),
              public_medicine: medication.medicine.public_medicine
            },
            updated_at: medication.medicine.updated_at,
            created_at: medication.medicine.created_at
          };
        }
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Medications retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async createMedication(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId, carePlanId } = req.params;
      const {
        medicine_id,
        quantity,
        strength,
        unit,
        when_to_take,
        repeat_type,
        start_date,
        end_date,
        instructions
      } = req.body;

      const medication = await Medication.create({
        participant_id: patientId,
        organizer_type: req.userCategory,
        organizer_id: req.user.id,
        medicine_id,
        description: `${quantity} ${unit} ${strength}`,
        start_date,
        end_date,
        details: {
          quantity,
          strength,
          unit,
          when_to_take,
          repeat_type,
          instructions
        },
        rr_rule: this.generateRRule(repeat_type, start_date)
      });

      // Create schedule events for this medication
      await this.createMedicationSchedule(medication);

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { medication },
          message: 'Medication added successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getMedicationTimeline(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { medicationId } = req.params;

      const medication = await Medication.findByPk(medicationId);
      if (!medication) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Medication not found'
            }
          }
        });
      }

      // Get schedule events for this medication
      const events = await ScheduleEvent.findAll({
        where: {
          event_type: 'medication-reminder',
          event_id: medicationId
        },
        order: [['start_time', 'DESC']],
        limit: 30
      });

      const timeline = events.map((event: any) => ({
        event_id: `evt_${event.id}`,
        scheduled_time: event.start_time,
        status: event.status,
        completed_at: event.status === 'completed' ? event.updated_at : null,
        notes: event.details?.notes || null
      }));

      const completedEvents = events.filter((e: any) => e.status === 'completed').length;
      const adherencePercentage = events.length > 0 ? 
        (completedEvents / events.length * 100).toFixed(2) : 0;

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: {
            timeline,
            adherence_stats: {
              total_scheduled: events.length,
              completed: completedEvents,
              missed: events.filter((e: any) => e.status === 'expired').length,
              adherence_percentage: parseFloat(adherencePercentage)
            }
          },
          message: 'Medication timeline retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  // Helper methods
  calculateRemaining(medication: any): number {
    // Calculate remaining doses based on schedule
    const now = new Date();
    const endDate = new Date(medication.end_date);
    const daysDiff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff);
  }

  calculateTotal(medication: any): number {
    // Calculate total doses
    const startDate = new Date(medication.start_date);
    const endDate = new Date(medication.end_date);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  }

  generateRRule(repeatType: string, startDate: string): string {
    // Generate RRule string based on repeat type
    switch (repeatType) {
      case 'daily':
        return 'FREQ=DAILY;INTERVAL=1';
      case 'weekly':
        return 'FREQ=WEEKLY;INTERVAL=1';
      case 'monthly':
        return 'FREQ=MONTHLY;INTERVAL=1';
      default:
        return 'FREQ=DAILY;INTERVAL=1';
    }
  }

  async createMedicationSchedule(medication: any): Promise<void> {
    // Create schedule events based on medication schedule
    // This would implement recurring event creation logic
    // For now, create a simple daily schedule
    const startDate = new Date(medication.start_date);
    const endDate = new Date(medication.end_date);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      await ScheduleEvent.create({
        event_type: 'medication-reminder',
        event_id: medication.id,
        status: 'pending',
        date: date.toISOString().split('T')[0],
        start_time: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM default
        details: {
          medication_id: medication.id,
          participant_id: medication.participant_id
        }
      });
    }
  }
}

export default new MedicationController();
