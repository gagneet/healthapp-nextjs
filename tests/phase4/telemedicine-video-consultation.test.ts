import { prisma } from '@/lib/prisma';
import { jest } from '@jest/globals';

const mockPrisma = {
  videoConsultation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

global.fetch = jest.fn();

describe('VideoConsultationService', () => {
  let VideoConsultationService: any;

  beforeAll(async () => {
    const serviceModule = await import('@/lib/services/VideoConsultationService');
    VideoConsultationService = serviceModule.default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConsultation', () => {
    it('should create a Daily.co room and a consultation record', async () => {
      const mockRoom = { id: 'test-room-id', url: 'https://test.daily.co/test-room-id', name: 'test-room-id' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoom,
      });

      const mockConsultation = { id: 'consultation-id', ...mockRoom };
      mockPrisma.videoConsultation.create.mockResolvedValueOnce(mockConsultation);

      const consultationData = {
        doctorId: 'doctor-id',
        patientId: 'patient-id',
        scheduledStartTime: new Date(),
        duration: 30,
        consultationType: 'scheduled' as const,
        priority: 'medium' as const,
      };

      const result = await VideoConsultationService.createConsultation(consultationData);

      expect(fetch).toHaveBeenCalledWith('https://api.daily.co/v1/rooms', expect.any(Object));
      expect(mockPrisma.videoConsultation.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          room_id: mockRoom.id,
          doctor_join_url: mockRoom.url,
          patient_join_url: mockRoom.url,
        }),
      }));
      expect(result.success).toBe(true);
      expect(result.consultation).toEqual(mockConsultation);
    });
  });

  describe('toggleRecording', () => {
    it('should start a recording', async () => {
      const mockConsultation = { id: 'consultation-id', room_id: 'test-room-id', doctorId: 'doctor-id' };
      mockPrisma.videoConsultation.findUnique.mockResolvedValueOnce(mockConsultation);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await VideoConsultationService.toggleRecording('consultation-id', 'start', 'doctor-id');

      expect(fetch).toHaveBeenCalledWith('https://api.daily.co/v1/recordings', expect.objectContaining({
        body: JSON.stringify({ room: 'test-room-id', action: 'start' }),
      }));
      expect(result.success).toBe(true);
    });

    it('should stop a recording and save the URL', async () => {
      const mockConsultation = { id: 'consultation-id', room_id: 'test-room-id', doctorId: 'doctor-id' };
      const mockRecordingData = { url: 'https://recorder.daily.co/test-recording.mp4' };
      mockPrisma.videoConsultation.findUnique.mockResolvedValueOnce(mockConsultation);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, ...mockRecordingData }),
      });

      const result = await VideoConsultationService.toggleRecording('consultation-id', 'stop', 'doctor-id');

      expect(fetch).toHaveBeenCalledWith('https://api.daily.co/v1/recordings', expect.objectContaining({
        body: JSON.stringify({ room: 'test-room-id', action: 'stop' }),
      }));
      expect(mockPrisma.videoConsultation.update).toHaveBeenCalledWith({
        where: { id: mockConsultation.id },
        data: { recording_url: mockRecordingData.url },
      });
      expect(result.success).toBe(true);
    });
  });
});
