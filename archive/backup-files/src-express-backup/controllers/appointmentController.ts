// src/controllers/appointmentController.ts
import { Request, Response, NextFunction } from 'express';
import { Appointment, Patient, Doctor, User, ScheduleEvent, AppointmentSlot } from '../models/index.js';
import { Op } from 'sequelize';
import CalendarService from '../services/CalendarService.js';
import '../types/express.js';

class AppointmentController {
  async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const {
        patient_id,
        description,
        start_date,
        end_date,
        appointment_type,
        treatment_id,
        repeat_type,
        repeat_count,
        slot_id
      } = req.body;

      const startTime = new Date(start_date);
      const endTime = new Date(end_date);

      // Check for conflicts
      const conflicts = await CalendarService.checkConflicts(
        req.user!.id,
        startTime,
        endTime
      );

      if (conflicts.length > 0) {
        res.status(409).json({
          status: false,
          statusCode: 409,
          payload: {
            error: {
              status: 'CONFLICT',
              message: 'Time slot conflicts with existing appointment',
              conflicts: conflicts.map((c: any) => ({
                id: c.id,
                start_time: c.start_time,
                end_time: c.end_time
              }))
            }
          }
        });
        return;
      }

      // Book slot if provided
      if (slot_id) {
        try {
          await CalendarService.bookAppointmentSlot(slot_id, null);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          res.status(400).json({
            status: false,
            statusCode: 400,
            payload: {
              error: {
                status: 'SLOT_UNAVAILABLE',
                message: errorMessage
              }
            }
          });
          return;
        }
      }

      const appointment = await Appointment.create({
        participant_one_type: req.userCategory || req.user!.role || 'user',
        participant_one_id: req.user!.id,
        participant_two_type: 'patient',
        participant_two_id: patient_id,
        organizer_type: req.userCategory || req.user!.role || 'user',
        organizer_id: req.user!.id,
        description,
        start_date: startTime.toISOString().split('T')[0],
        end_date: endTime.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        details: {
          type: appointment_type,
          treatment_id,
          status: 'scheduled',
          slot_id
        },
        rr_rule: repeat_type !== 'none' ? this.generateRRule(repeat_type) : null
      });

      // Update slot with appointment ID
      if (slot_id) {
        await CalendarService.bookAppointmentSlot(slot_id, appointment.id);
      }

      // Create schedule events
      await this.createAppointmentSchedule(appointment, repeat_count);

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { appointment },
          message: 'Appointment created successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getPatientAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;

      // First verify the patient exists
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Patient not found'
            }
          }
        });
        return;
      }

      const appointments = await Appointment.findAll({
        where: {
          patient_id: patientId
        },
        include: [
          {
            model: User,
            as: 'provider'
          }
        ],
        order: [['start_time', 'ASC']]
      });

      const responseData: { appointments: { [key: string]: any } } = { appointments: {} };

      for (const appointment of appointments) {
        // Get organizer details
        const organizer = await this.getOrganizerDetails(appointment.organizer_type, appointment.organizer_id);
        const participantTwo = await this.getParticipantDetails(appointment.participant_two_type, appointment.participant_two_id);

        responseData.appointments[appointment.id] = {
          basic_info: {
            id: appointment.id.toString(),
            description: appointment.description,
            details: appointment.details || {},
            start_date: appointment.start_time,
            end_date: appointment.end_time,
            start_time: appointment.start_time ? appointment.start_time.toTimeString().split(' ')[0] : null,
            end_time: appointment.end_time ? appointment.end_time.toTimeString().split(' ')[0] : null
          },
          participant_one: {
            id: appointment.participant_one_id?.toString(),
            category: appointment.participant_one_type,
            name: organizer?.name || 'Unknown'
          },
          participant_two: {
            id: appointment.participant_two_id?.toString(),
            category: appointment.participant_two_type,
            name: participantTwo?.name || 'Unknown'
          },
          organizer: {
            id: appointment.organizer_id?.toString(),
            category: appointment.organizer_type,
            name: organizer?.name || 'Unknown'
          },
          rr_rule: appointment.rr_rule,
          provider_id: appointment.provider_id?.toString(),
          provider_name: appointment.provider_name,
          remaining: 0, // Calculate remaining appointments
          total: 1, // Calculate total appointments
          documents: [] // Get appointment documents
        };
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Appointments retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getAppointmentsByDate(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Date parameter is required'
            }
          }
        });
      }

      const appointments = await Appointment.findAll({
        where: {
          start_date: date,
          // Add user-specific filtering based on role
          ...(req.userCategory === 'doctor' && req.user && {
            [Op.or]: [
              { participant_one_id: req.user!.id, participant_one_type: 'doctor' },
              { organizer_id: req.user!.id, organizer_type: 'doctor' }
            ]
          })
        },
        order: [['start_time', 'ASC']]
      });

      const responseData: { appointments: { [key: string]: any } } = { appointments: {} };

      for (const appointment of appointments) {
        const participantTwo = await this.getParticipantDetails(
          appointment.participant_two_type, 
          appointment.participant_two_id
        );

        responseData.appointments[appointment.id] = {
          basic_info: {
            id: appointment.id.toString(),
            description: appointment.description,
            start_date: appointment.start_time,
            end_date: appointment.end_time
          },
          participant_two: {
            id: appointment.participant_two_id?.toString(),
            category: appointment.participant_two_type,
            name: participantTwo?.name || 'Unknown'
          }
        };
      }

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Daily appointments retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  // Helper methods
  async getOrganizerDetails(organizerType: string, organizerId: number | string): Promise<{ name: string } | null> {
    if (organizerType === 'doctor') {
      const doctor = await Doctor.findByPk(organizerId, {
        include: [{ model: User, as: 'user' }]
      });
      return { name: `Dr. ${doctor?.first_name} ${doctor?.last_name}` };
    } else if (organizerType === 'patient') {
      const patient = await Patient.findByPk(organizerId);
      return { name: `${patient?.first_name} ${patient?.last_name}` };
    }
    return null;
  }

  async getParticipantDetails(participantType: string, participantId: number | string): Promise<{ name: string } | null> {
    if (participantType === 'patient') {
      const patient = await Patient.findByPk(participantId);
      return { name: `${patient?.first_name} ${patient?.last_name}` };
    } else if (participantType === 'doctor') {
      const doctor = await Doctor.findByPk(participantId);
      return { name: `Dr. ${doctor?.first_name} ${doctor?.last_name}` };
    }
    return null;
  }

  generateRRule(repeatType: string): string | null {
    switch (repeatType) {
      case 'daily':
        return 'FREQ=DAILY;INTERVAL=1';
      case 'weekly':
        return 'FREQ=WEEKLY;INTERVAL=1';
      case 'monthly':
        return 'FREQ=MONTHLY;INTERVAL=1';
      default:
        return null;
    }
  }

  async createAppointmentSchedule(appointment: any, repeatCount = 1): Promise<void> {
    // Create schedule events for appointments
    for (let i = 0; i < repeatCount; i++) {
      const eventDate = new Date(appointment.start_time);
      if (appointment.rr_rule?.includes('WEEKLY')) {
        eventDate.setDate(eventDate.getDate() + (i * 7));
      } else if (appointment.rr_rule?.includes('DAILY')) {
        eventDate.setDate(eventDate.getDate() + i);
      }

      await ScheduleEvent.create({
        event_type: 'appointment',
        event_id: appointment.id,
        status: 'scheduled',
        date: eventDate.toISOString().split('T')[0],
        start_time: eventDate,
        end_time: new Date(eventDate.getTime() + (appointment.end_time - appointment.start_time)),
        details: {
          appointment_id: appointment.id,
          participant_one_id: appointment.participant_one_id,
          participant_two_id: appointment.participant_two_id
        }
      });
    }
  }

  // New calendar and availability methods
  async getDoctorAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId, date, appointmentType } = req.query;

      if (!doctorId || !date) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Doctor ID and date are required'
            }
          }
        });
        return;
      }

      const slots = await CalendarService.getAvailableSlots(doctorId as string, date as string, appointmentType as string);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { slots, date, doctor_id: doctorId },
          message: 'Available slots retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getDoctorCalendar(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      // Use current user's ID if doctorId not provided and user is doctor
      const targetDoctorId = doctorId || (req.userCategory === 'doctor' && req.user ? req.user!.id : null);

      if (!targetDoctorId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Doctor ID is required'
            }
          }
        });
      }

      const defaultStartDate = startDate || new Date().toISOString().split('T')[0];
      const defaultEndDate = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const calendar = await CalendarService.getDoctorCalendar(targetDoctorId, defaultStartDate, defaultEndDate);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: calendar,
          message: 'Doctor calendar retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getPatientCalendar(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;

      // Use current user's ID if patientId not provided and user is patient
      const targetPatientId = patientId || (req.userCategory === 'patient' && req.user ? req.user!.id : null);

      if (!targetPatientId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Patient ID is required'
            }
          }
        });
      }

      const defaultStartDate = startDate || new Date().toISOString().split('T')[0];
      const defaultEndDate = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const calendar = await CalendarService.getPatientCalendar(targetPatientId, defaultStartDate, defaultEndDate);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: calendar,
          message: 'Patient calendar retrieved successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async setDoctorAvailability(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { doctorId } = req.params;
      const availabilityData = req.body;

      // Use current user's ID if doctorId not provided and user is doctor
      const targetDoctorId = doctorId || (req.userCategory === 'doctor' && req.user ? req.user!.id : null);

      if (!targetDoctorId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Doctor ID is required'
            }
          }
        });
      }

      const availability = await CalendarService.setDoctorAvailability(targetDoctorId, availabilityData);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { availability },
          message: 'Doctor availability updated successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async rescheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { appointmentId } = req.params;
      const { start_time, end_time, slot_id } = req.body;

      if (!start_time || !end_time) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Start time and end time are required'
            }
          }
        });
      }

      const appointment = await CalendarService.rescheduleAppointment(
        appointmentId,
        new Date(start_time),
        new Date(end_time),
        slot_id
      );

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { appointment },
          message: 'Appointment rescheduled successfully'
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('conflict')) {
        return res.status(409).json({
          status: false,
          statusCode: 409,
          payload: {
            error: {
              status: 'CONFLICT',
              message: errorMessage
            }
          }
        });
      }
      next(error);
    }
  }

  async updateAppointment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { appointmentId } = req.params;
      const updateData = req.body;

      const appointment = await Appointment.findByPk(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Appointment not found'
            }
          }
        });
      }

      // Update appointment details
      await appointment.update({
        description: updateData.description || appointment.description,
        details: {
          ...appointment.details,
          ...updateData.details,
          status: updateData.status || appointment.details?.status,
          notes: updateData.notes || appointment.details?.notes
        }
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { appointment },
          message: 'Appointment updated successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { appointmentId } = req.params;
      const { cancellation_reason } = req.body;

      const appointment = await Appointment.findByPk(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Appointment not found'
            }
          }
        });
      }

      // Release slot if exists
      if (appointment.details?.slot_id) {
        await CalendarService.releaseAppointmentSlot(appointment.details.slot_id);
      }

      // Update appointment status
      await appointment.update({
        details: {
          ...appointment.details,
          status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason
        }
      });

      // Update related schedule events
      await ScheduleEvent.update(
        { status: 'cancelled' },
        {
          where: {
            event_type: 'appointment',
            event_id: appointmentId
          }
        }
      );

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { appointment },
          message: 'Appointment cancelled successfully'
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new AppointmentController();
