/**
 * Healthcare Management Platform - Test Setup
 * Configures the testing environment for healthcare workflows
 */

const { PrismaClient } = require('@prisma/client')

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://healthapp_user:secure_pg_password@localhost:5434/healthapp_test?schema=public'
process.env.NEXTAUTH_SECRET = 'test-secret-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Global test setup
declare global {
  var prisma: PrismaClient
  var testSpecialtyId: string
  var testUser: {
    id: string
    email: string
    role: 'DOCTOR' | 'PATIENT' | 'HSP' | 'SYSTEM_ADMIN'
  }
}

// Initialize Prisma client for testing
globalThis.prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Test database setup
beforeAll(async () => {
  // Connect to test database
  await globalThis.prisma.$connect()
  
  // Create test specialty for doctors
  const testSpecialty = await globalThis.prisma.specialty.upsert({
    where: { name: 'General Medicine' },
    update: {},
    create: {
      name: 'General Medicine',
      description: 'General medical practice for testing',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  
  // Store specialty ID for test utilities
  globalThis.testSpecialtyId = testSpecialty.id
  
  console.log('🧪 Healthcare Test Suite Initialized')
  console.log('📊 Database:', process.env.DATABASE_URL?.split('@')[1])
  console.log('🏥 Test Specialty Created:', testSpecialty.name)
})

// Test database cleanup
afterAll(async () => {
  // Clean up test database
  await globalThis.prisma.$disconnect()
  console.log('🧹 Healthcare Test Suite Cleanup Complete')
})

// Clean database between tests
beforeEach(async () => {
  // Clean up test data (in reverse dependency order)
  await globalThis.prisma.auditLog.deleteMany({})
  await globalThis.prisma.emergencyAlert.deleteMany({})
  await globalThis.prisma.patientAllergy.deleteMany({})
  await globalThis.prisma.drugInteraction.deleteMany({})
  await globalThis.prisma.deviceReading.deleteMany({})
  await globalThis.prisma.connectedDevice.deleteMany({})
  await globalThis.prisma.labOrder.deleteMany({})
  await globalThis.prisma.videoConsultation.deleteMany({})
  await globalThis.prisma.vitalReading.deleteMany({})
  await globalThis.prisma.medication.deleteMany({})
  await globalThis.prisma.careplan.deleteMany({})
  await globalThis.prisma.appointment.deleteMany({})
  await globalThis.prisma.patient.deleteMany({})
  await globalThis.prisma.doctor.deleteMany({})
  await globalThis.prisma.user.deleteMany({})
})

afterEach(async () => {
  // Additional cleanup if needed
})

// Test utilities for healthcare workflows
export const createTestUser = async (role: 'DOCTOR' | 'PATIENT' | 'HSP' | 'SYSTEM_ADMIN' = 'DOCTOR') => {
  const user = await globalThis.prisma.user.create({
    data: {
      email: `test-${role.toLowerCase()}-${Date.now()}@test.com`,
      password_hash: 'hashed-password',
      firstName: `Test`,
      lastName: `${role}`,
      role: role,
      account_status: 'active',
    },
  })
  
  return user
}

export const createTestDoctor = async (userId: string) => {
  const doctor = await globalThis.prisma.doctor.create({
    data: {
      id: userId,
      license_number: `LIC${Date.now()}`,
      speciality_id: globalThis.testSpecialtyId,
      years_of_experience: 5,
      consultation_fee: 150.00,
      is_available: true,
    },
  })
  
  return doctor
}

export const createTestPatient = async (userId: string) => {
  const patient = await globalThis.prisma.patient.create({
    data: {
      id: userId,
      date_of_birth: new Date('1990-01-01'),
      gender: 'male',
      blood_type: 'O_POSITIVE',
      height_cm: 180,
      weight_kg: 75,
      medical_history: {},
      emergency_contact: {},
    },
  })
  
  return patient
}

// Mock authentication for tests
export const mockAuthSession = (role: 'DOCTOR' | 'PATIENT' | 'HSP' | 'SYSTEM_ADMIN' = 'DOCTOR') => {
  return {
    user: {
      id: `test-user-${role.toLowerCase()}`,
      email: `test-${role.toLowerCase()}@test.com`,
      role: role,
      name: `Test ${role}`,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Healthcare test data generators
export const generateMedicationData = () => {
  return {
    medicine_name: 'Test Medicine',
    dosage: '10mg',
    frequency: 'twice_daily',
    duration_days: 7,
    instructions: 'Take with food',
    prescribed_date: new Date(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
}

export const generateVitalReadingData = () => {
  return {
    reading_value: '120',
    unit: 'mmHg',
    recordedAt: new Date(),
    notes: 'Normal reading',
  }
}

console.log('✅ Healthcare Test Setup Complete')

module.exports = {
  createTestUser,
  createTestDoctor,
  createTestPatient,
  mockAuthSession,
  generateMedicationData,
  generateVitalReadingData,
}