// src/services/medicationService.js
import { Medication, Medicine, ScheduleEvent } from '../models/index.ts';
import { Op } from 'sequelize';

class MedicationService {
  async createMedicationWithSchedule(medicationData: any) {
    const {
      participant_id,
      organizer_type,
      organizer_id,
      medicine_id,
      quantity,
      strength,
      unit,
      when_to_take,
      repeat_type,
      start_date,
      end_date,
      instructions
    } = medicationData;

    // Create medication
    const medication = await Medication.create({
      participant_id,
      organizer_type,
      organizer_id,
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

    // Create schedule events
    await this.createMedicationSchedule(medication);

    return medication;
  }

  async getMedicationAdherence(medicationId: any) {
    const events = await ScheduleEvent.findAll({
      where: {
        event_type: 'medication-reminder',
        event_id: medicationId
      }
    });

    const totalEvents = events.length;
    const completedEvents = events.filter((e: any) => e.status === 'completed').length;
    const missedEvents = events.filter((e: any) => e.status === 'expired').length;

    const adherencePercentage = totalEvents > 0 ? 
      (completedEvents / totalEvents * 100).toFixed(2) : '0';

    return {
      total_scheduled: totalEvents,
      completed: completedEvents,
      missed: missedEvents,
      adherence_percentage: parseFloat(adherencePercentage)
    };
  }

  generateRRule(repeatType: any, startDate: any) {
    switch (repeatType) {
      case 'daily':
        return 'FREQ=DAILY;INTERVAL=1';
      case 'weekly':
        return 'FREQ=WEEKLY;INTERVAL=1';
      case 'monthly':
        return 'FREQ=MONTHLY;INTERVAL=1';
      case 'twice_daily':
        return 'FREQ=DAILY;INTERVAL=1;COUNT=2';
      case 'three_times_daily':
        return 'FREQ=DAILY;INTERVAL=1;COUNT=3';
      default:
        return 'FREQ=DAILY;INTERVAL=1';
    }
  }

  async createMedicationSchedule(medication: any) {
    const startDate = new Date(medication.start_date);
    const endDate = new Date(medication.end_date);
    const whenToTake = medication.details?.when_to_take || 'after_breakfast';
    
    // Define default times for different meal times
    const timeMap = {
      'before_breakfast': 7,
      'after_breakfast': 9,
      'before_lunch': 11,
      'after_lunch': 13,
      'before_dinner': 17,
      'after_dinner': 19,
      'bedtime': 21
    };

    const scheduleHour = (timeMap as any)[whenToTake] || 9;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const scheduleTime = new Date(date);
      scheduleTime.setHours(scheduleHour, 0, 0, 0);

      await ScheduleEvent.create({
        event_type: 'medication-reminder',
        event_id: medication.id,
        status: 'pending',
        date: date.toISOString().split('T')[0],
        start_time: scheduleTime,
        details: {
          medication_id: medication.id,
          participant_id: medication.participant_id,
          medicine_name: 'Medicine Name', // Get from medicine table
          dosage: `${medication.details?.quantity} ${medication.details?.unit}`
        }
      });
    }
  }
}

export default new MedicationService();
