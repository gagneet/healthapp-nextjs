// src/controllers/vitalsController.ts
import { Request, Response, NextFunction } from 'express';
import '../types/express.js';
import { Vital, VitalTemplate, CarePlan, ScheduleEvent } from '../models/index.js';
import { Op } from 'sequelize';

class VitalsController {
  async createVital(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        vital_template_id,
        care_plan_id,
        description,
        repeat_interval,
        repeat_days,
        start_date,
        end_date
      } = req.body;

      const vital = await Vital.create({
        vital_template_id,
        care_plan_id,
        description,
        start_date,
        end_date,
        details: {
          repeat_interval_id: repeat_interval,
          repeat_days,
          patientId
        }
      });

      // Create schedule events for vital monitoring
      await this.createVitalSchedule(vital, repeat_days);

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { vital },
          message: 'Vital monitoring created successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getPatientVitals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      // Find care plans for this patient
      const carePlans = await CarePlan.findAll({
        where: { patientId: patientId }
      });

      const carePlanIds = carePlans.map((cp: any) => cp.id);

      const vitals = await Vital.findAll({
        where: { 
          care_plan_id: { [Op.in]: carePlanIds }
        },
        include: [
          {
            model: VitalTemplate,
            as: 'template'
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const responseData: {
        vitals: Record<string, any>;
        vital_templates: Record<string, any>;
      } = {
        vitals: {},
        vital_templates: {}
      };

      vitals.forEach((vital: any) => {
        responseData.vitals[vital.id] = {
          basic_info: {
            id: vital.id.toString(),
            vital_template_id: vital.vital_template_id.toString(),
            care_plan_id: vital.care_plan_id.toString()
          },
          details: {
            repeat_interval_id: vital.details?.repeat_interval_id || 'daily',
            repeat_days: vital.details?.repeat_days || [1, 2, 3, 4, 5, 6, 7],
            description: vital.description
          },
          start_date: vital.start_date,
          end_date: vital.end_date,
          remaining: this.calculateRemaining(vital),
          total: this.calculateTotal(vital),
          latest_pending_event_id: null // Get from schedule events
        };

        if (vital.template) {
          responseData.vital_templates[vital.template.id] = {
            basic_info: {
              id: vital.template.id.toString(),
              name: vital.template.name,
              unit: vital.template.unit,
              normal_range: vital.template.details?.normal_range || '',
              description: vital.template.details?.description || ''
            }
          };
        }
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Vitals retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getVitalTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vitalId } = req.params;

      const vital = await Vital.findByPk(vitalId, {
        include: [{ model: VitalTemplate, as: 'template' }]
      });

      if (!vital) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Vital not found'
            }
          }
        });
        return;
      }

      // Get schedule events for this vital
      const events = await ScheduleEvent.findAll({
        where: {
          event_type: 'vitals',
          event_id: vitalId
        },
        order: [['start_time', 'DESC']],
        limit: 30
      });

      const timeline = events.map((event: any) => {
        const measurements = event.details?.measurements || {};
        return {
          event_id: `evt_vital_${event.id}`,
          scheduled_time: event.start_time,
          status: event.status,
          completed_at: event.status === 'completed' ? event.updated_at : null,
          measurements,
          notes: event.details?.notes || null
        };
      });

      // Calculate statistics
      const completedEvents = events.filter((e: any) => e.status === 'completed');
      const measurements = completedEvents
        .map((e: any) => e.details?.measurements)
        .filter((m: any) => m && Object.keys(m).length > 0);

      const statistics: Record<string, any> = {};
      if (measurements.length > 0) {
        // Calculate averages for numeric measurements
        const keys = Object.keys(measurements[0]);
        keys.forEach(key => {
          const values = measurements
            .map((m: any) => parseFloat(m[key]))
            .filter((v: any) => !isNaN(v));
          
          if (values.length > 0) {
            (statistics as any)[`average_${key}`] = (values.reduce((a: any, b: any) => a + b, 0) / values.length).toFixed(1);
          }
        });
        (statistics as any).trend = 'stable'; // Implement trend calculation
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: {
            timeline,
            statistics
          },
          message: 'Vital timeline retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  // Helper methods
  calculateRemaining(vital: any): number {
    const now = new Date();
    const endDate = new Date(vital.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff);
  }

  calculateTotal(vital: any): number {
    const startDate = new Date(vital.start_date);
    const endDate = new Date(vital.end_date);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  async createVitalSchedule(vital: any, repeatDays: number[]): Promise<void> {
    // Create schedule events for vital monitoring
    const startDate = new Date(vital.start_date);
    const endDate = new Date(vital.end_date);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
      
      if (repeatDays.includes(dayOfWeek)) {
        await ScheduleEvent.create({
          event_type: 'vitals',
          event_id: vital.id,
          status: 'pending',
          date: date.toISOString().split('T')[0],
          start_time: new Date(date.getTime() + 8 * 60 * 60 * 1000), // 8 AM default
          details: {
            vital_id: vital.id,
            care_plan_id: vital.care_plan_id
          }
        });
      }
    }
  }
}

export default new VitalsController();
