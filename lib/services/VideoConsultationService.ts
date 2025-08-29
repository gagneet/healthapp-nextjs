import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

export interface CreateConsultationData {
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  scheduledStartTime: Date;
  duration: number;
  consultationType: 'emergency' | 'scheduled' | 'followup' | 'second_opinion';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  notes?: string;
}

export interface JoinConsultationData {
  consultationId: string;
  userId: string;
  userType: 'doctor' | 'patient';
}

export class VideoConsultationService {
  private readonly DAILY_API_URL = process.env.DAILY_API_URL || 'https://api.daily.co/v1';
  private readonly DAILY_API_KEY = process.env.DAILY_API_KEY;

  /**
   * Create a new Daily.co video call room
   */
  private async createDailyRoom(duration: number, startTime: Date): Promise<{ id: string; url: string; name: string } | null> {
    if (!this.DAILY_API_KEY || this.DAILY_API_KEY === 'YOUR_DAILY_API_KEY') {
      console.error('Daily.co API key is not configured.');
      // In a real app, you might want to throw an error here
      // For this implementation, we'll return a mock room for development if no key is present
      if (process.env.NODE_ENV === 'development') {
        const roomId = `dev_room_${crypto.randomBytes(8).toString('hex')}`;
        return {
          id: roomId,
          url: `https://your-daily-co-domain.daily.co/${roomId}`,
          name: roomId,
        };
      }
      return null;
    }

    try {
      const response = await fetch(`${this.DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            // Room expires 30 minutes after the scheduled end time
            exp: Math.floor((startTime.getTime() + duration * 60 * 1000 + 30 * 60 * 1000) / 1000),
            enable_recording: 'cloud',
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to create Daily.co room:', response.status, errorBody);
        return null;
      }

      const room = await response.json();
      return { id: room.id, url: room.url, name: room.name };
    } catch (error) {
      console.error('Error creating Daily.co room:', error);
      return null;
    }
  }

  /**
   * Create a new video consultation session
   */
  async createConsultation(data: CreateConsultationData) {
    try {
      const dailyRoom = await this.createDailyRoom(data.duration, data.scheduledStartTime);

      if (!dailyRoom) {
        return {
          success: false,
          error: 'Failed to create video consultation room',
          message: 'Could not create a room with the video provider. Please ensure the API keys are set up correctly.'
        };
      }
      
      const consultation = await prisma.videoConsultation.create({
        data: {
          consultation_id: crypto.randomUUID(),
          doctorId: data.doctorId,
          patientId: data.patientId,
          appointment_id: data.appointmentId,
          room_id: dailyRoom.id,
          room_token: null, // We will generate meeting tokens on demand
          doctor_join_url: dailyRoom.url,
          patient_join_url: dailyRoom.url,
          scheduled_start: data.scheduledStartTime,
          scheduled_end: new Date(data.scheduledStartTime.getTime() + (data.duration * 60 * 1000)),
          duration_minutes: data.duration,
          consultation_type: data.consultationType.toUpperCase() as any,
          priority: data.priority.toUpperCase() as any,
          status: 'SCHEDULED' as any,
          consultation_notes: data.notes,
          created_by: data.doctorId,
          recording_enabled: this.shouldEnableRecording(data.consultationType),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          doctor: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
              specialization: true,
            }
          },
          patient: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
              date_of_birth: true,
            }
          },
          appointment: {
            select: { id: true, appointment_date: true, status: true, }
          }
        }
      });

      return {
        success: true,
        consultation,
        message: 'Video consultation created successfully'
      };
    } catch (error) {
      console.error('Error creating video consultation:', error);
      return {
        success: false,
        error: 'Failed to create video consultation',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Join a video consultation
   */
  async joinConsultation({ consultationId, userId, userType }: JoinConsultationData) {
    try {
      const consultation = await prisma.videoConsultation.findUnique({
        where: { consultation_id: consultationId },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        }
      });

      if (!consultation) {
        return { success: false, error: 'Consultation not found' };
      }

      const canJoin = this.verifyJoinPermissions(consultation, userId, userType);
      if (!canJoin.success) {
        return canJoin;
      }

      if (consultation.status === 'SCHEDULED') {
        await prisma.videoConsultation.update({
          where: { id: consultation.id },
          data: { status: 'IN_PROGRESS', actual_start: new Date(), updatedAt: new Date() }
        });
      }

      // The joinUrl is the same for both participants now
      const joinUrl = consultation.doctor_join_url;

      return {
        success: true,
        joinUrl,
        roomId: consultation.room_id,
        consultation: {
          id: consultation.consultation_id,
          status: consultation.status,
          recordingEnabled: consultation.recording_enabled,
          duration: consultation.duration_minutes,
        }
      };
    } catch (error) {
      console.error('Error joining video consultation:', error);
      return {
        success: false,
        error: 'Failed to join consultation',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * End a video consultation
   */
  async endConsultation(consultationId: string, userId: string, summary?: string) {
    try {
      const consultation = await prisma.videoConsultation.findUnique({
        where: { consultation_id: consultationId },
      });

      if (!consultation) {
        return { success: false, error: 'Consultation not found' };
      }

      if (consultation.doctorId !== userId && consultation.patientId !== userId) {
        return { success: false, error: 'Unauthorized to end consultation' };
      }

      const updatedConsultation = await prisma.videoConsultation.update({
        where: { id: consultation.id },
        data: {
          status: 'COMPLETED',
          actual_end: new Date(),
          // The 'summary' parameter is stored in 'consultation_notes' as per the database schema.
          consultation_notes: summary,
          updatedAt: new Date(),
        }
      });

      return {
        success: true,
        consultation: updatedConsultation,
        message: 'Consultation ended successfully'
      };
    } catch (error) {
      console.error('Error ending video consultation:', error);
      return {
        success: false,
        error: 'Failed to end consultation',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get consultation history for a user
   */
  async getConsultationHistory(userId: string, userType: 'doctor' | 'patient', page = 1, limit = 10) {
    try {
      const whereClause = userType === 'doctor' ? { doctorId: userId } : { patientId: userId };

      const consultations = await prisma.videoConsultation.findMany({
        where: whereClause,
        include: {
          doctor: { select: { id: true, user: { select: { firstName: true, lastName: true, } }, specialization: true, } },
          patient: { select: { id: true, user: { select: { firstName: true, lastName: true, } }, } },
          appointment: { select: { id: true, appointment_date: true, } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.videoConsultation.count({ where: whereClause });

      return {
        success: true,
        consultations,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      };
    } catch (error) {
      console.error('Error fetching consultation history:', error);
      return {
        success: false,
        error: 'Failed to fetch consultation history',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine if recording should be enabled for consultation type
   */
  private shouldEnableRecording(consultationType: string): boolean {
    return ['emergency', 'scheduled'].includes(consultationType);
  }

  /**
   * Verify user permissions to join consultation
   */
  private verifyJoinPermissions(consultation: any, userId: string, userType: string) {
    if (userType === 'doctor' && consultation.doctorId !== userId) {
      return { success: false, error: 'Not authorized to join this consultation as doctor' };
    }
    
    if (userType === 'patient' && consultation.patientId !== userId) {
      return { success: false, error: 'Not authorized to join this consultation as patient' };
    }

    const now = new Date();
    const scheduledTime = new Date(consultation.scheduled_start);
    const maxJoinTime = new Date(scheduledTime.getTime() + (consultation.duration_minutes || 60) * 60 * 1000 + (30 * 60 * 1000));

    if (now > maxJoinTime && consultation.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Consultation has expired' };
    }

    return { success: true };
  }

  /**
   * Toggle recording for a consultation
   */
  async toggleRecording(consultationId: string, action: 'start' | 'stop', userId: string) {
    try {
      const consultation = await prisma.videoConsultation.findUnique({
        where: { consultation_id: consultationId },
      });

      if (!consultation) {
        return { success: false, error: 'Consultation not found' };
      }

      if (consultation.doctorId !== userId) {
        return { success: false, error: 'Only the doctor can toggle recording' };
      }

      const response = await this._dailyApiRequest(`/recordings`, 'POST', {
        room: consultation.room_id,
        action: action,
      });

      if (!response.success) {
        return { success: false, error: 'Failed to toggle recording', message: response.error };
      }

      if (action === 'stop' && response.data.url) {
        await prisma.videoConsultation.update({
          where: { id: consultation.id },
          data: { recording_url: response.data.url },
        });
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error toggling recording for consultation ${consultationId}:`, error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Private helper to validate API key
   */
  private _isApiKeyValid(): boolean {
    return !!this.DAILY_API_KEY && this.DAILY_API_KEY !== 'YOUR_DAILY_API_KEY';
  }

  /**
   * Private helper to make requests to the Daily.co API
   */
  private async _dailyApiRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body?: object) {
    if (!this._isApiKeyValid()) {
      console.error('Daily.co API key is not configured.');
      if (process.env.NODE_ENV === 'development') {
        return { success: true, data: { message: "This is a mock response in development." } };
      }
      return { success: false, error: 'Video provider not configured' };
    }

    try {
      const response = await fetch(`${this.DAILY_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Daily.co API request to ${endpoint} failed:`, response.status, errorBody);
        return { success: false, error: `API request failed: ${errorBody}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`Error making Daily.co API request to ${endpoint}:`, error);
      return { success: false, error: 'API request error' };
    }
  }

  /**
   * Get active consultations for a user
   */
  async getActiveConsultations(userId: string, userType: 'doctor' | 'patient') {
    try {
      const whereClause = {
        status: 'IN_PROGRESS' as any,
        ...(userType === 'doctor' ? { doctorId: userId } : { patientId: userId })
      };

      const consultations = await prisma.videoConsultation.findMany({
        where: whereClause,
        include: {
          doctor: { select: { id: true, user: { select: { firstName: true, lastName: true, } }, specialization: true, } },
          patient: { select: { id: true, user: { select: { firstName: true, lastName: true, } }, } }
        },
        orderBy: { actual_start: 'desc' },
      });

      return { success: true, consultations };
    } catch (error) {
      console.error('Error fetching active consultations:', error);
      return {
        success: false,
        error: 'Failed to fetch active consultations',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new VideoConsultationService();