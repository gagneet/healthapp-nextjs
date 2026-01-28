import { prisma } from '@/lib/prisma';
import { ConsultationStatus } from '@/prisma/generated/prisma';
import VideoConsultationService from './VideoConsultationService';

export interface BookConsultationData {
  doctorId: string;
  patientId: string;
  appointmentDate: Date;
  duration: number;
  consultationType: 'emergency' | 'scheduled' | 'followup' | 'second_opinion';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  reason?: string;
  notes?: string;
}

export interface ConsultationSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  consultationId?: string;
}

export class ConsultationBookingService {

  /**
   * Book a new video consultation appointment
   */
  async bookConsultation(data: BookConsultationData) {
    try {
      // Check if the slot is available
      const isAvailable = await this.isSlotAvailable(
        data.doctorId,
        data.appointmentDate,
        data.duration
      );

      if (!isAvailable) {
        return {
          success: false,
          error: 'Time slot not available',
          message: 'The requested time slot is already booked or unavailable'
        };
      }

      // Create appointment first
      const appointment = await prisma.appointment.create({
        data: {
          doctorId: data.doctorId,
          patientId: data.patientId,
          organizerType: 'DOCTOR',
          organizerId: data.doctorId,
          participantOneType: 'DOCTOR',
          participantOneId: data.doctorId,
          participantTwoType: 'PATIENT',
          participantTwoId: data.patientId,
          startTime: data.appointmentDate,
          endTime: new Date(data.appointmentDate.getTime() + (data.duration * 60 * 1000)),
          description: data.reason,
          details: {
            consultationType: data.consultationType,
            priority: data.priority,
            notes: data.notes,
            duration: data.duration
          },
          createdAt: new Date(),
        }
      });

      // Create video consultation session
      const videoConsultationResult = await VideoConsultationService.createConsultation({
        doctorId: data.doctorId,
        patientId: data.patientId,
        appointmentId: appointment.id,
        scheduledStartTime: data.appointmentDate,
        duration: data.duration,
        consultationType: data.consultationType,
        priority: data.priority,
        notes: data.notes
      });

      if (!videoConsultationResult.success) {
        // Rollback appointment creation
        await prisma.appointment.delete({
          where: { id: appointment.id }
        });

        return {
          success: false,
          error: 'Failed to create video consultation session',
          message: videoConsultationResult.message
        };
      }

      return {
        success: true,
        data: {
          appointment,
          videoConsultation: videoConsultationResult.consultation
        },
        message: 'Video consultation booked successfully'
      };

    } catch (error) {
      console.error('Error booking consultation:', error);
      return {
        success: false,
        error: 'Failed to book consultation',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId: string, date: Date, duration: number = 30) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(8, 0, 0, 0); // 8 AM start

      const endOfDay = new Date(date);
      endOfDay.setHours(18, 0, 0, 0); // 6 PM end

      // Get existing appointments for the day
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctorId,
          startTime: {
            gte: startOfDay,
            lt: endOfDay
          },
          status: {
            in: [ConsultationStatus.SCHEDULED, ConsultationStatus.IN_PROGRESS]
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Generate available slots
      const slots: ConsultationSlot[] = [];
      const currentTime = new Date(startOfDay);

      while (currentTime < endOfDay) {
        const slotEnd = new Date(currentTime.getTime() + (duration * 60 * 1000));
        
        // Check if this slot conflicts with existing appointments
        const isConflicted = existingAppointments.some(appointment => {
          const appointmentStart = appointment.startTime || currentTime;
          const appointmentEnd = appointment.endTime || new Date(appointmentStart.getTime() + (duration * 60 * 1000));
          return (
            (currentTime >= appointmentStart && currentTime < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (currentTime <= appointmentStart && slotEnd >= appointmentEnd)
          );
        });

        // Check if slot is in the past
        const isPast = currentTime < new Date();

        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
          available: !isConflicted && !isPast
        });

        // Move to next slot (every 15 minutes)
        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }

      return {
        success: true,
        data: slots,
        date,
        doctorId
      };

    } catch (error) {
      console.error('Error getting available slots:', error);
      return {
        success: false,
        error: 'Failed to get available slots',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(doctorId: string, startTime: Date, duration: number) {
    try {
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));

      const conflictingAppointments = await prisma.appointment.count({
        where: {
          doctorId: doctorId,
          status: {
            in: [ConsultationStatus.SCHEDULED, ConsultationStatus.IN_PROGRESS]
          },
          AND: [
            {
              startTime: {
                lt: endTime
              }
            },
            {
              endTime: {
                gt: startTime
              }
            }
          ]
        }
      });

      return conflictingAppointments === 0;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  }

  /**
   * Reschedule an existing consultation
   */
  async rescheduleConsultation(appointmentId: string, newDateTime: Date, userId: string) {
    try {
      // Get the existing appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          videoConsultations: true
        }
      });

      if (!appointment) {
        return {
          success: false,
          error: 'Appointment not found'
        };
      }

      // Verify user permissions (doctor or patient can reschedule)
      if (appointment.doctorId !== userId && appointment.patientId !== userId) {
        return {
          success: false,
          error: 'Unauthorized to reschedule this appointment'
        };
      }

      // Calculate duration from existing appointment
      const currentDuration = appointment.startTime && appointment.endTime ? 
        (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60) : 30;

      // Check if new slot is available
      const isAvailable = await this.isSlotAvailable(
        appointment.doctorId!,
        newDateTime,
        currentDuration
      );

      if (!isAvailable) {
        return {
          success: false,
          error: 'New time slot is not available'
        };
      }

      // Update appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime: newDateTime,
          endTime: new Date(newDateTime.getTime() + (currentDuration * 60 * 1000)),
          status: 'SCHEDULED'
        }
      });

      // Update video consultation if it exists
      if (appointment.videoConsultations && appointment.videoConsultations.length > 0) {
        await prisma.videoConsultation.update({
          where: { id: appointment.videoConsultations[0].id },
          data: {
            scheduledStartTime: newDateTime,
            status: 'SCHEDULED'
          }
        });
      }

      return {
        success: true,
        data: updatedAppointment,
        message: 'Consultation rescheduled successfully'
      };

    } catch (error) {
      console.error('Error rescheduling consultation:', error);
      return {
        success: false,
        error: 'Failed to reschedule consultation',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a consultation
   */
  async cancelConsultation(appointmentId: string, userId: string, reason?: string) {
    try {
      // Get the existing appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          videoConsultations: true
        }
      });

      if (!appointment) {
        return {
          success: false,
          error: 'Appointment not found'
        };
      }

      // Verify user permissions
      if (appointment.doctorId !== userId && appointment.patientId !== userId) {
        return {
          success: false,
          error: 'Unauthorized to cancel this appointment'
        };
      }

      // Update appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          description: reason ? `${appointment.description || ''}\n\nCancellation reason: ${reason}` : appointment.description,
        }
      });

      // Update video consultation if it exists
      if (appointment.videoConsultations && appointment.videoConsultations.length > 0) {
        await prisma.videoConsultation.update({
          where: { id: appointment.videoConsultations[0].id },
          data: {
            status: 'CANCELLED',
          }
        });
      }

      return {
        success: true,
        data: updatedAppointment,
        message: 'Consultation cancelled successfully'
      };

    } catch (error) {
      console.error('Error cancelling consultation:', error);
      return {
        success: false,
        error: 'Failed to cancel consultation',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get upcoming consultations for a user
   */
  async getUpcomingConsultations(userId: string, userRole: string, limit: number = 5) {
    try {
      const whereClause = userRole === 'DOCTOR' 
        ? { doctorId: userId }
        : { patientId: userId };

      const consultations = await prisma.appointment.findMany({
        where: {
          ...whereClause,
          status: {
            in: ['scheduled', 'confirmed']
          },
          appointment_date: {
            gte: new Date()
          }
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specialty: {
                select: {
                  name: true
                }
              }
            }
          },
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          VideoConsultation: {
            select: {
              consultation_id: true,
              status: true,
              room_id: true
            }
          }
        },
        orderBy: {
          appointment_date: 'asc'
        },
        take: limit
      });

      return {
        success: true,
        data: consultations,
        message: 'Upcoming consultations retrieved successfully'
      };

    } catch (error) {
      console.error('Error getting upcoming consultations:', error);
      return {
        success: false,
        error: 'Failed to get upcoming consultations',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get doctor's schedule for a date range
   */
  async getDoctorSchedule(doctorId: string, startDate: Date, endDate: Date) {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctorId,
          appointment_date: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: ['scheduled', 'confirmed', 'in_progress', 'completed']
          }
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true
                }
              }
            }
          },
          VideoConsultation: {
            select: {
              consultation_id: true,
              status: true,
              consultation_type: true,
              priority: true
            }
          }
        },
        orderBy: {
          appointment_date: 'asc'
        }
      });

      return {
        success: true,
        data: appointments,
        dateRange: {
          startDate,
          endDate
        },
        message: 'Doctor schedule retrieved successfully'
      };

    } catch (error) {
      console.error('Error getting doctor schedule:', error);
      return {
        success: false,
        error: 'Failed to get doctor schedule',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new ConsultationBookingService();
