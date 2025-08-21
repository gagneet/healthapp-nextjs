"use strict";
/**
 * Prisma Database Connection for Next.js Healthcare Application
 *
 * This module provides a singleton Prisma client instance optimized for
 * Next.js development and production environments with connection pooling
 * and proper cleanup handling.
 *
 * Schema introspected from existing PostgreSQL database with 46 healthcare models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthcareDb = exports.prisma = void 0;
exports.disconnectPrisma = disconnectPrisma;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.waitForDatabase = waitForDatabase;
exports.withTransaction = withTransaction;
const client_1 = require("@prisma/client");
// Global variable to store the Prisma instance
const globalForPrisma = globalThis;
/**
 * Create Prisma Client with optimized configuration for healthcare applications
 */
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
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
    globalForPrisma.prisma = exports.prisma;
}
/**
 * Graceful shutdown handler for production environments
 */
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
}
/**
 * Database connection health check with retry logic for Docker Swarm
 */
async function checkDatabaseConnection() {
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await exports.prisma.$queryRaw `SELECT 1`;
            if (attempt > 1) {
                console.log(`✅ Database connected on attempt ${attempt}`);
            }
            return { connected: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
            if (attempt === maxRetries) {
                console.error(`❌ Database connection failed after ${maxRetries} attempts:`, errorMessage);
                return {
                    connected: false,
                    error: errorMessage,
                };
            }
            console.log(`⏳ Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    return {
        connected: false,
        error: 'Max retries exceeded',
    };
}
/**
 * Wait for database to be ready (used during application startup)
 */
async function waitForDatabase() {
    console.log('🔄 Waiting for database connection...');
    const result = await checkDatabaseConnection();
    if (result.connected) {
        console.log('✅ Database is ready');
        return true;
    }
    else {
        console.error('❌ Database is not available:', result.error);
        return false;
    }
}
/**
 * Healthcare-specific database utilities
 */
exports.healthcareDb = {
    /**
     * Get user with healthcare provider details
     */
    async getUserWithProvider(userId) {
        return await exports.prisma.user.findUnique({
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
    async getPatientWithMedicalRecords(patientId) {
        return await exports.prisma.patient.findUnique({
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
    async getDoctorDashboard(doctorId) {
        const [totalPatients, activeCarePlans, todayAppointments, criticalVitals, missedMedications,] = await Promise.all([
            // Total patients assigned to this doctor
            exports.prisma.patientDoctorAssignment.count({
                where: {
                    doctor_id: doctorId,
                    is_active: true,
                },
            }),
            // Active care plans created by this doctor
            exports.prisma.carePlan.count({
                where: {
                    created_by_doctor_id: doctorId,
                    status: 'ACTIVE',
                },
            }),
            // Today's appointments
            exports.prisma.appointment.count({
                where: {
                    doctor_id: doctorId,
                    start_date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
            // Critical vital readings in last 24 hours
            exports.prisma.vitalReading.count({
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
            exports.prisma.adherenceRecord.count({
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
    async getPatientAdherence(patientId, days = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const adherenceRecords = await exports.prisma.adherenceRecord.findMany({
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
async function withTransaction(callback) {
    return await exports.prisma.$transaction(callback);
}
exports.default = exports.prisma;
