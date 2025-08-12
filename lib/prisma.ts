/**
 * Prisma Database Connection for Next.js Healthcare Application
 * 
 * This module provides a singleton Prisma client instance optimized for
 * Next.js development and production environments with connection pooling
 * and proper cleanup handling.
 * 
 * Schema introspected from existing PostgreSQL database with 46 healthcare models
 */

import { PrismaClient } from './prisma-client';

// Global variable to store the Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma Client with optimized configuration for healthcare applications
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// In development, store the client on the global object to prevent
// multiple instances during hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler for production environments
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Healthcare-specific database utilities
 */
export const healthcareDb = {
  /**
   * Get user with healthcare provider details
   */
  async getUserWithProvider(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        healthcare_provider: {
          include: {
            organization: true,
          },
        },
        patient: {
          include: {
            organization: true,
          },
        },
      },
    });
  },

  /**
   * Get patient with complete medical records
   */
  async getPatientWithMedicalRecords(patientId: string) {
    return await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
        doctors: {
          include: {
            users_doctors_user_idTousers: true,
            specialities: true,
          },
        },
        care_plans: {
          include: {
            doctors: {
              include: {
                users_doctors_user_idTousers: true,
              },
            },
          },
        },
        appointments: true,
        adherence_records: true,
        symptoms: true,
      },
    });
  },

  /**
   * Get doctor dashboard data with patient statistics
   */
  async getDoctorDashboard(doctorId: string) {
    const [
      totalPatients,
      activeCarePlans,
      todayAppointments,
      criticalVitals,
      missedMedications,
    ] = await Promise.all([
      // Total patients assigned to this doctor
      prisma.patientDoctorAssignment.count({
        where: {
          doctor_id: doctorId,
          is_active: true,
        },
      }),

      // Active care plans created by this doctor
      prisma.carePlan.count({
        where: {
          created_by_doctor_id: doctorId,
          status: 'ACTIVE',
        },
      }),

      // Today's appointments
      prisma.appointment.count({
        where: {
          doctor_id: doctorId,
          start_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Critical vital readings in last 24 hours
      prisma.vitalReading.count({
        where: {
          patient: {
            patient_doctor_assignments: {
              some: {
                doctor_id: doctorId,
                is_active: true,
              },
            },
          },
          is_flagged: true,
          reading_time: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Missed medications in last 24 hours
      prisma.adherenceRecord.count({
        where: {
          patient: {
            patient_doctor_assignments: {
              some: {
                doctor_id: doctorId,
                is_active: true,
              },
            },
          },
          is_missed: true,
          due_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            lt: new Date(),
          },
        },
      }),
    ]);

    return {
      totalPatients,
      activeCarePlans,
      todayAppointments,
      criticalVitals,
      missedMedications,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Check medication adherence for a patient
   */
  async getPatientAdherence(patientId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const adherenceRecords = await prisma.adherenceRecord.findMany({
      where: {
        patient_id: patientId,
        due_at: {
          gte: startDate,
        },
      },
      include: {
        patient: true,
      },
    });

    const totalScheduled = adherenceRecords.length;
    const totalTaken = adherenceRecords.filter(record => record.is_completed).length;

    return {
      adherenceRate: totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0,
      totalScheduled,
      totalTaken,
      missedDoses: totalScheduled - totalTaken,
      records: adherenceRecords,
    };
  },
};

/**
 * Type-safe transaction wrapper
 */
export async function withTransaction<T>(
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback as any) as T;
}

export default prisma;