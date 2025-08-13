import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
  private readonly WEBRTC_SERVER_URL = process.env.WEBRTC_SERVER_URL || 'https://meet.adhere.live';
  private readonly CONSULTATION_SECRET = process.env.CONSULTATION_SECRET || 'secure-consultation-key';

  /**
   * Create a new video consultation session
   */
  async createConsultation(data: CreateConsultationData) {
    try {
      // Generate secure room ID and tokens
      const roomId = this.generateRoomId();
      const roomToken = this.generateRoomToken(roomId);
      
      // Create consultation record
      const consultation = await prisma.videoConsultation.create({
        data: {
          consultation_id: crypto.randomUUID(),
          doctor_id: data.doctorId,
          patient_id: data.patientId,
          appointment_id: data.appointmentId,
          room_id: roomId,
          room_token: roomToken,
          doctor_join_url: this.generateJoinUrl(roomId, 'doctor', data.doctorId),
          patient_join_url: this.generateJoinUrl(roomId, 'patient', data.patientId),
          scheduled_start_time: data.scheduledStartTime,
          duration_minutes: data.duration,
          consultation_type: data.consultationType,
          priority: data.priority,
          status: 'scheduled',
          notes: data.notes,
          recording_enabled: this.shouldEnableRecording(data.consultationType),
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: {
          doctor: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                }
              },
              specialization: true,
            }
          },
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                }
              },
              date_of_birth: true,
            }
          },
          appointment: {
            select: {
              id: true,
              appointment_date: true,
              status: true,
            }
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
      // Find the consultation
      const consultation = await prisma.videoConsultation.findUnique({
        where: { consultation_id: consultationId },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        }
      });

      if (!consultation) {
        return {
          success: false,
          error: 'Consultation not found'
        };
      }

      // Verify user permissions
      const canJoin = this.verifyJoinPermissions(consultation, userId, userType);
      if (!canJoin.success) {
        return canJoin;
      }

      // Update consultation status to active if first join
      if (consultation.status === 'scheduled') {
        await prisma.videoConsultation.update({
          where: { id: consultation.id },
          data: {
            status: 'active',
            actual_start_time: new Date(),
            updated_at: new Date(),
          }
        });
      }

      // Generate join URL based on user type
      const joinUrl = userType === 'doctor' 
        ? consultation.doctor_join_url 
        : consultation.patient_join_url;

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
        return {
          success: false,
          error: 'Consultation not found'
        };
      }

      // Verify user can end consultation (doctor or patient)
      if (consultation.doctor_id !== userId && consultation.patient_id !== userId) {
        return {
          success: false,
          error: 'Unauthorized to end consultation'
        };
      }

      // Update consultation status and end time
      const updatedConsultation = await prisma.videoConsultation.update({
        where: { id: consultation.id },
        data: {
          status: 'completed',
          actual_end_time: new Date(),
          summary,
          updated_at: new Date(),
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
      const whereClause = userType === 'doctor' 
        ? { doctor_id: userId }
        : { patient_id: userId };

      const consultations = await prisma.videoConsultation.findMany({
        where: whereClause,
        include: {
          doctor: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              },
              specialization: true,
            }
          },
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              },
            }
          },
          appointment: {
            select: {
              id: true,
              appointment_date: true,
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.videoConsultation.count({
        where: whereClause,
      });

      return {
        success: true,
        consultations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
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
   * Generate a secure room ID
   */
  private generateRoomId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `room_${timestamp}_${randomBytes}`;
  }

  /**
   * Generate room token for WebRTC authentication
   */
  private generateRoomToken(roomId: string): string {
    const data = {
      roomId,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
    
    const token = crypto
      .createHmac('sha256', this.CONSULTATION_SECRET)
      .update(JSON.stringify(data))
      .digest('hex');
    
    return Buffer.from(JSON.stringify({ ...data, signature: token })).toString('base64');
  }

  /**
   * Generate join URL for WebRTC client
   */
  private generateJoinUrl(roomId: string, userType: string, userId: string): string {
    const params = new URLSearchParams({
      room: roomId,
      user: userId,
      type: userType,
      t: Date.now().toString(),
    });
    
    return `${this.WEBRTC_SERVER_URL}/room/${roomId}?${params.toString()}`;
  }

  /**
   * Determine if recording should be enabled for consultation type
   */
  private shouldEnableRecording(consultationType: string): boolean {
    // Enable recording for emergency and scheduled consultations
    return ['emergency', 'scheduled'].includes(consultationType);
  }

  /**
   * Verify user permissions to join consultation
   */
  private verifyJoinPermissions(consultation: any, userId: string, userType: string) {
    if (userType === 'doctor' && consultation.doctor_id !== userId) {
      return {
        success: false,
        error: 'Not authorized to join this consultation as doctor'
      };
    }
    
    if (userType === 'patient' && consultation.patient_id !== userId) {
      return {
        success: false,
        error: 'Not authorized to join this consultation as patient'
      };
    }

    // Check if consultation is still valid (not expired)
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduled_start_time);
    const maxJoinTime = new Date(scheduledTime.getTime() + (consultation.duration_minutes * 60 * 1000) + (30 * 60 * 1000)); // 30min grace period

    if (now > maxJoinTime && consultation.status !== 'active') {
      return {
        success: false,
        error: 'Consultation has expired'
      };
    }

    return { success: true };
  }

  /**
   * Get active consultations for a user
   */
  async getActiveConsultations(userId: string, userType: 'doctor' | 'patient') {
    try {
      const whereClause = {
        status: 'active',
        ...(userType === 'doctor' ? { doctor_id: userId } : { patient_id: userId })
      };

      const consultations = await prisma.videoConsultation.findMany({
        where: whereClause,
        include: {
          doctor: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              },
              specialization: true,
            }
          },
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              },
            }
          }
        },
        orderBy: { actual_start_time: 'desc' },
      });

      return {
        success: true,
        consultations,
      };
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