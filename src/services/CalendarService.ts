// src/services/CalendarService.js
import { Appointment, ScheduleEvent, DoctorAvailability, AppointmentSlot, Doctor, Patient, User } from '../models/index.ts';
import { Op } from 'sequelize';
import db from '../models/index.ts';

class CalendarService {
  // Generate time slots for a doctor on a specific date
  async generateDoctorSlots(doctorId: any, date: any) {
    const dayOfWeek = new Date(date).getDay();
    
    // Get doctor availability for this day
    const availability = await DoctorAvailability.findOne({
      where: {
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_available: true
      }
    });

    if (!availability) {
      return [];
    }

    const slots = [];
    const startTime = this.timeStringToMinutes(availability.start_time);
    const endTime = this.timeStringToMinutes(availability.end_time);
    const slotDuration = availability.slot_duration;
    
    // Generate slots
    for (let time = startTime; time < endTime; time += slotDuration) {
      // Skip break time if defined
      if (availability.break_start_time && availability.break_end_time) {
        const breakStart = this.timeStringToMinutes(availability.break_start_time);
        const breakEnd = this.timeStringToMinutes(availability.break_end_time);
        
        if (time >= breakStart && time < breakEnd) {
          continue;
        }
      }

      const slotStartTime = this.minutesToTimeString(time);
      const slotEndTime = this.minutesToTimeString(time + slotDuration);

      // Check if slot already exists
      const existingSlot = await AppointmentSlot.findOne({
        where: {
          doctor_id: doctorId,
          date: date,
          start_time: slotStartTime
        }
      });

      if (!existingSlot) {
        slots.push({
          doctor_id: doctorId,
          date: date,
          start_time: slotStartTime,
          end_time: slotEndTime,
          max_appointments: availability.max_appointments_per_slot,
          slot_type: 'regular'
        });
      }
    }

    // Bulk create slots
    if (slots.length > 0) {
      await AppointmentSlot.bulkCreate(slots, {
        ignoreDuplicates: true
      });
    }

    return slots;
  }

  // Get available slots for a doctor on a specific date
  async getAvailableSlots(doctorId: any, date: any, appointmentType = 'regular') {
    // First generate slots if they don't exist
    await this.generateDoctorSlots(doctorId, date);

    const slots = await AppointmentSlot.findAll({
      where: {
        doctor_id: doctorId,
        date: date,
        is_available: true,
        [(Op as any).where]: db.sequelize.literal('booked_appointments < max_appointments')
      },
      order: [['start_time', 'ASC']]
    });

    return slots.map((slot: any) => ({
      slot_id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      available_spots: slot.max_appointments - slot.booked_appointments,
      slot_type: slot.slot_type
    }));
  }

  // Book an appointment slot
  async bookAppointmentSlot(slotId: any, appointmentId: any) {
    const slot = await AppointmentSlot.findByPk(slotId);
    
    if (!slot || !slot.is_available || slot.booked_appointments >= slot.max_appointments) {
      throw new Error('Slot is not available');
    }

    // Update slot booking count
    await slot.update({
      booked_appointments: slot.booked_appointments + 1,
      is_available: slot.booked_appointments + 1 < slot.max_appointments
    });

    return slot;
  }

  // Release an appointment slot
  async releaseAppointmentSlot(slotId: any) {
    const slot = await AppointmentSlot.findByPk(slotId);
    
    if (!slot) {
      throw new Error('Slot not found');
    }

    await slot.update({
      booked_appointments: Math.max(0, slot.booked_appointments - 1),
      is_available: true
    });

    return slot;
  }

  // Get doctor's calendar for a date range
  async getDoctorCalendar(doctorId: any, startDate: any, endDate: any) {
    const appointments = await Appointment.findAll({
      where: {
        [Op.or]: [
          { participant_one_id: doctorId, participant_one_type: 'doctor' },
          { organizer_id: doctorId, organizer_type: 'doctor' }
        ],
        start_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['start_time', 'ASC']]
    });

    const availability = await DoctorAvailability.findAll({
      where: { doctor_id: doctorId }
    });

    const slots = await AppointmentSlot.findAll({
      where: {
        doctor_id: doctorId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    return {
      appointments: appointments.map((apt: any) => this.formatAppointment(apt)),
      availability: availability.map((avail: any) => this.formatAvailability(avail)),
      slots: slots.map((slot: any) => this.formatSlot(slot))
    };
  }

  // Get patient's appointments calendar
  async getPatientCalendar(patientId: any, startDate: any, endDate: any) {
    const appointments = await Appointment.findAll({
      where: {
        [Op.or]: [
          { participant_one_id: patientId, participant_one_type: 'patient' },
          { participant_two_id: patientId, participant_two_type: 'patient' }
        ],
        start_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['start_time', 'ASC']]
    });

    const scheduleEvents = await ScheduleEvent.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        },
        // Add patient filtering through related models
      },
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    return {
      appointments: appointments.map((apt: any) => this.formatAppointment(apt)),
      events: scheduleEvents.map((event: any) => this.formatScheduleEvent(event))
    };
  }

  // Check for appointment conflicts
  async checkConflicts(doctorId: any, startTime: any, endTime: any, excludeAppointmentId = null) {
    const conflicts = await Appointment.findAll({
      where: {
        [Op.or]: [
          { participant_one_id: doctorId, participant_one_type: 'doctor' },
          { organizer_id: doctorId, organizer_type: 'doctor' }
        ],
        [Op.and]: [
          {
            start_time: {
              [Op.lt]: endTime
            }
          },
          {
            end_time: {
              [Op.gt]: startTime
            }
          }
        ],
        ...(excludeAppointmentId ? {
          id: { [Op.ne]: excludeAppointmentId }
        } : {})
      }
    });

    return conflicts;
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId: any, newStartTime: any, newEndTime: any, newSlotId = null) {
    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check for conflicts
    const conflicts = await this.checkConflicts(
      appointment.participant_one_type === 'doctor' ? appointment.participant_one_id : appointment.organizer_id,
      newStartTime,
      newEndTime,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new Error('Time slot conflicts with existing appointment');
    }

    // Release old slot if exists
    if (appointment.slot_id) {
      await this.releaseAppointmentSlot(appointment.slot_id);
    }

    // Book new slot if provided
    if (newSlotId) {
      await this.bookAppointmentSlot(newSlotId, appointmentId);
    }

    // Update appointment
    await appointment.update({
      start_time: newStartTime,
      end_time: newEndTime,
      start_date: newStartTime.toISOString().split('T')[0],
      end_date: newEndTime.toISOString().split('T')[0],
      slot_id: newSlotId,
      details: {
        ...(appointment as any).details,
        rescheduled: true,
        rescheduled_at: new Date(),
        previous_start_time: appointment.start_time
      }
    });

    // Update related schedule events
    await ScheduleEvent.update(
      {
        start_time: newStartTime,
        end_time: newEndTime,
        date: newStartTime.toISOString().split('T')[0]
      },
      {
        where: {
          event_type: 'appointment',
          event_id: appointmentId
        }
      }
    );

    return appointment;
  }

  // Set doctor availability
  async setDoctorAvailability(doctorId: any, availabilityData: any) {
    const { day_of_week, start_time, end_time, slot_duration, max_appointments_per_slot, break_start_time, break_end_time } = availabilityData;

    const [availability, created] = await DoctorAvailability.findOrCreate({
      where: {
        doctor_id: doctorId,
        day_of_week: day_of_week
      },
      defaults: {
        start_time,
        end_time,
        slot_duration: slot_duration || 30,
        max_appointments_per_slot: max_appointments_per_slot || 1,
        break_start_time,
        break_end_time,
        is_available: true
      }
    });

    if (!created) {
      await availability.update({
        start_time,
        end_time,
        slot_duration: slot_duration || availability.slot_duration,
        max_appointments_per_slot: max_appointments_per_slot || availability.max_appointments_per_slot,
        break_start_time,
        break_end_time,
        is_available: true
      });
    }

    return availability;
  }

  // Helper methods
  timeStringToMinutes(timeString: any) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTimeString(minutes: any) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatAppointment(appointment: any) {
    return {
      id: appointment.id,
      description: appointment.description,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      type: appointment.details?.type || 'consultation',
      status: appointment.details?.status || 'scheduled',
      patient_name: appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Unknown',
      doctor_name: appointment.doctor ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}` : 'Unknown'
    };
  }

  formatAvailability(availability: any) {
    return {
      day_of_week: availability.day_of_week,
      start_time: availability.start_time,
      end_time: availability.end_time,
      slot_duration: availability.slot_duration,
      break_time: availability.break_start_time ? {
        start: availability.break_start_time,
        end: availability.break_end_time
      } : null
    };
  }

  formatSlot(slot: any) {
    return {
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      available_spots: slot.max_appointments - slot.booked_appointments,
      slot_type: slot.slot_type,
      is_available: slot.is_available
    };
  }

  formatScheduleEvent(event: any) {
    return {
      id: event.id,
      type: event.event_type,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      priority: event.details?.priority || 'normal'
    };
  }
}

export default new CalendarService();