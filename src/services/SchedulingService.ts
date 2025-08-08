// src/services/schedulingService.js
import { ScheduleEvent, Appointment, Medication, Vital } from '../models/index.js';
import { Op } from 'sequelize';

interface MissedMedicationEvent {
  medication_id: string;
  medication_name: string;
  event_id: string;
  scheduled_time: any;
  missed_at: any;
}

interface MissedAppointmentEvent {
  appointment_id: string;
  appointment_type: string;
  event_id: string;
  scheduled_time: any;
  missed_at: any;
}

interface MissedVitalEvent {
  vital_id: string;
  vital_type: string;
  event_id: string;
  scheduled_time: any;
  missed_at: any;
}

class SchedulingService {
  async getMissedEvents(patientId: any, eventType = null) {
    const whereClause = {
      status: 'expired',
      start_time: { [Op.lt]: new Date() }
    };

    if (eventType) {
      (whereClause as any).event_type = eventType;
    }

    // Get events for this patient through their appointments/medications
    const events = await ScheduleEvent.findAll({
      where: whereClause,
      include: [
        {
          model: Appointment,
          where: {
            [Op.or]: [
              { participant_one_id: patientId },
              { participant_two_id: patientId }
            ]
          },
          required: false
        },
        {
          model: Medication,
          where: { participant_id: patientId },
          required: false
        }
      ],
      order: [['start_time', 'DESC']],
      limit: 50
    });

    const missedEvents = {
      medications: [] as MissedMedicationEvent[],
      appointments: [] as MissedAppointmentEvent[],
      vitals: [] as MissedVitalEvent[]
    };

    events.forEach((event: any) => {
      const eventData = {
        event_id: `evt_${event.id}`,
        scheduled_time: event.start_time,
        missed_at: event.updated_at
      };

      switch (event.event_type) {
        case 'medication-reminder':
          missedEvents.medications.push({
            ...eventData,
            medication_id: event.event_id.toString(),
            medication_name: event.details?.medicine_name || 'Unknown'
          });
          break;
        case 'appointment':
          missedEvents.appointments.push({
            ...eventData,
            appointment_id: event.event_id.toString(),
            appointment_type: event.details?.type || 'consultation'
          });
          break;
        case 'vitals':
          missedEvents.vitals.push({
            ...eventData,
            vital_id: event.event_id.toString(),
            vital_type: event.details?.vital_type || 'Unknown'
          });
          break;
      }
    });

    const statistics = {
      total_missed: events.length,
      missed_medications: missedEvents.medications.length,
      missed_appointments: missedEvents.appointments.length,
      missed_vitals: missedEvents.vitals.length
    };

    return { missedEvents, statistics };
  }

  async completeEvent(eventId: any, completionData: any) {
    const event = await ScheduleEvent.findByPk(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'pending') {
      throw new Error('Event cannot be completed');
    }

    await event.update({
      status: 'completed',
      details: {
        ...event.details,
        completion_time: completionData.completion_time || new Date(),
        notes: completionData.notes,
        response_data: completionData.response_data
      }
    });

    return event;
  }

  async getUpcomingEvents(userId: any, userCategory: any, days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const events = await ScheduleEvent.findAll({
      where: {
        status: 'pending',
        start_time: {
          [Op.between]: [new Date(), futureDate]
        }
      },
      order: [['start_time', 'ASC']],
      limit: 20
    });

    // Filter events based on user category and permissions
    // This would need to be implemented based on business logic

    return events;
  }
}

export default new SchedulingService();
