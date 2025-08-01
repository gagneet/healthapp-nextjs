// src/controllers/appointmentController.js
import { Appointment, Patient, Doctor, User, ScheduleEvent } from '../models/index.js';
import { Op } from 'sequelize';

class AppointmentController {
  async createAppointment(req, res, next) {
    try {
      const {
        patient_id,
        description,
        start_date,
        end_date,
        appointment_type,
        treatment_id,
        repeat_type,
        repeat_count
      } = req.body;

      const appointment = await Appointment.create({
        participant_one_type: req.userCategory,
        participant_one_id: req.user.id,
        participant_two_type: 'patient',
        participant_two_id: patient_id,
        organizer_type: req.userCategory,
        organizer_id: req.user.id,
        description,
        start_date,
        end_date,
        start_time: new Date(start_date),
        end_time: new Date(end_date),
        details: {
          type: appointment_type,
          treatment_id,
          status: 'scheduled'
        },
        rr_rule: repeat_type !== 'none' ? this.generateRRule(repeat_type) : null
      });

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
    } catch (error) {
      next(error);
    }
  }

  async getPatientAppointments(req, res, next) {
    try {
      const { patientId } = req.params;

      const appointments = await Appointment.findAll({
        where: {
          [Op.or]: [
            { participant_one_id: patientId, participant_one_type: 'patient' },
            { participant_two_id: patientId, participant_two_type: 'patient' }
          ]
        },
        include: [
          {
            model: User,
            as: 'provider'
          }
        ],
        order: [['start_time', 'ASC']]
      });

      const responseData = { appointments: {} };

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
    } catch (error) {
      next(error);
    }
  }

  async getAppointmentsByDate(req, res, next) {
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
          ...(req.userCategory === 'doctor' && {
            [Op.or]: [
              { participant_one_id: req.user.id, participant_one_type: 'doctor' },
              { organizer_id: req.user.id, organizer_type: 'doctor' }
            ]
          })
        },
        order: [['start_time', 'ASC']]
      });

      const responseData = { appointments: {} };

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
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  async getOrganizerDetails(organizerType, organizerId) {
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

  async getParticipantDetails(participantType, participantId) {
    if (participantType === 'patient') {
      const patient = await Patient.findByPk(participantId);
      return { name: `${patient?.first_name} ${patient?.last_name}` };
    } else if (participantType === 'doctor') {
      const doctor = await Doctor.findByPk(participantId);
      return { name: `Dr. ${doctor?.first_name} ${doctor?.last_name}` };
    }
    return null;
  }

  generateRRule(repeatType) {
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

  async createAppointmentSchedule(appointment, repeatCount = 1) {
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
}

export default new AppointmentController();
