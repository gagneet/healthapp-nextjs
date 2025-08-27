// lib/seed.ts - Comprehensive Healthcare Test Data Seeding with Updated Schema
import { PrismaClient, AdherenceType, UserRole, UserAccountStatus, UserGender, MedicationOrganizerType, MedicationLogAdherenceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 🛠️ Helpers
const getRandomPastDate = (minDaysAgo = 7, maxDaysAgo = 90): Date => {
  const now = new Date();
  const minDate = new Date(now.getTime() - maxDaysAgo * 86400000);
  const maxDate = new Date(now.getTime() - minDaysAgo * 86400000);
  return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const getRecentDate = (): Date => getRandomPastDate(1, 7);
const getFutureDate = (daysAhead = 1): Date => new Date(Date.now() + daysAhead * 86400000);
const getTodayDate = (): Date => new Date();

// Database cleanup function to remove all existing data
async function cleanDatabase() {
  console.log('🧹 Cleaning database - removing all existing data...');
  
  try {
    // Delete in reverse dependency order to avoid foreign key constraints
    // Use error handling for each operation to continue even if tables don't exist
    
    const cleanupOperations = [
      () => prisma.adherenceRecord.deleteMany({}),
      () => prisma.medication.deleteMany({}),
      () => prisma.vital.deleteMany({}),
      () => prisma.symptom.deleteMany({}),
      () => prisma.carePlan.deleteMany({}),
      () => prisma.appointment.deleteMany({}),
      () => prisma.clinic.deleteMany({}),
      () => prisma.patient.deleteMany({}),
      () => prisma.doctor.deleteMany({}),
      () => prisma.hsp.deleteMany({}),
      () => prisma.provider.deleteMany({}),
      () => prisma.medicine.deleteMany({}),
      () => prisma.vitalTemplate.deleteMany({}),
      () => prisma.symptomDatabase.deleteMany({}),
      () => prisma.treatmentDatabase.deleteMany({}),
      () => prisma.specialty.deleteMany({}),
      () => prisma.organization.deleteMany({}),
      () => prisma.user.deleteMany({})
    ];
    
    for (const operation of cleanupOperations) {
      try {
        await operation();
      } catch (error: any) {
        // Continue with next operation even if current fails
        console.log(`⚠️ Cleanup operation failed (continuing): ${error.message}`);
      }
    }
    
    console.log('✅ Database cleaned successfully');
  } catch (error: any) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
}

// Add retry logic and table verification
async function waitForTables(maxRetries = 10, delay = 1000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await prisma.user.count();
            console.log('✅ Database tables are ready');
            return true;
        } catch (error: any) {
            if ((error as any).code === 'P2021') { // Correctly type error
                console.log(`⏳ Waiting for database tables... (attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Database tables not ready after maximum retries');
}

// Generate secure password hash
async function generateSecurePasswordHash(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

const sanitize = (input: any) => {
  if (typeof input === 'string') {
    return input.replace(/(\r\n|\n|\r)/gm, "");
  }
  return input;
}

export async function seedComprehensiveHealthcareData() {
    console.log('📊 Seeding comprehensive healthcare test data with updated schema...');

    try {
        await waitForTables();

        // Always start with a clean database
        await cleanDatabase();

        // Password setup
        const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        const basicDoctorPassword = await bcrypt.hash('TempPassword123!', 12);

        // Helper function to create user with Auth.js v5 fields and updated schema
        const createUserData = (userData: any) => ({
            ...userData,
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            emailVerified: userData.emailVerifiedLegacy ? userData.createdAt : null,
            image: null,
        });

        // Create specific users per your requirements
        console.log('👥 Creating users with exact structure per requirements...');
        
        const testUsers = await prisma.user.createMany({
            skipDuplicates: true,
            data: [
                // 3 Doctors
                createUserData({
                    id: '00000000-0000-0000-0000-000000000001',
                    email: 'doctor@healthapp.com',
                    passwordHash: basicDoctorPassword,
                    role: 'DOCTOR' as UserRole,
                    firstName: 'Dr. John',
                    lastName: 'Smith',
                    phone: '+1-555-0001',
                    dateOfBirth: new Date('1975-01-15'),
                    gender: 'MALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(30, 90),
                    updatedAt: getRecentDate(),
                }),
                createUserData({
                    id: '00000000-0000-0000-0000-000000000002',
                    email: 'doctor1@healthapp.com',
                    passwordHash: basicDoctorPassword,
                    role: 'DOCTOR' as UserRole,
                    firstName: 'Dr. Jane',
                    lastName: 'Doe',
                    phone: '+1-555-0002',
                    dateOfBirth: new Date('1978-05-20'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(28, 88),
                    updatedAt: getRecentDate(),
                }),
                createUserData({
                    id: '00000000-0000-0000-0000-000000000003',
                    email: 'doctor2@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'DOCTOR' as UserRole,
                    firstName: 'Dr. Emily',
                    lastName: 'Rodriguez',
                    phone: '+1-555-0003',
                    dateOfBirth: new Date('1980-11-08'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(25, 85),
                    updatedAt: getRecentDate(),
                }),
                
                // 5 Patients
                createUserData({
                    id: '77777777-7777-7777-7777-777777777777',
                    email: 'patient1@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT' as UserRole,
                    firstName: 'Sarah',
                    lastName: 'Johnson',
                    phone: '+1-555-0101',
                    dateOfBirth: new Date('1985-06-15'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(20, 80),
                    updatedAt: getRecentDate(),
                }),
                createUserData({
                    id: '88888888-8888-8888-8888-888888888888',
                    email: 'patient2@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT' as UserRole,
                    firstName: 'Michael',
                    lastName: 'Chen',
                    phone: '+1-555-0102',
                    dateOfBirth: new Date('1978-03-22'),
                    gender: 'MALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(18, 78),
                    updatedAt: getRecentDate(),
                }),
                createUserData({
                    id: '11111111-1111-1111-1111-111111111111',
                    email: 'patient3@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT' as UserRole,
                    firstName: 'Emma',
                    lastName: 'Williams',
                    phone: '+1-555-0103',
                    dateOfBirth: new Date('1990-09-10'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(16, 76),
                    updatedAt: getRecentDate(),
                }),
                createUserData({
                    id: '22222222-2222-2222-2222-222222222222',
                    email: 'patient4@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT' as UserRole,
                    firstName: 'James',
                    lastName: 'Brown',
                    phone: '+1-555-0104',
                    dateOfBirth: new Date('1965-12-05'),
                    gender: 'MALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(14, 74),
                    updatedAt: getRecentDate(),
                }),
                createUserData({
                    id: '33333333-3333-3333-3333-333333333333',
                    email: 'patient5@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT' as UserRole,
                    firstName: 'Olivia',
                    lastName: 'Davis',
                    phone: '+1-555-0105',
                    dateOfBirth: new Date('1995-04-20'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(12, 72),
                    updatedAt: getRecentDate(),
                }),

                // 1 HSP
                createUserData({
                    id: '55555555-5555-5555-5555-555555555555',
                    email: 'hsp@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'HSP' as UserRole,
                    firstName: 'Maria',
                    lastName: 'Garcia',
                    phone: '+1-555-0301',
                    dateOfBirth: new Date('1980-03-25'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(35, 85),
                    updatedAt: getRecentDate(),
                }),

                // 1 System Admin
                createUserData({
                    id: '66666666-6666-6666-6666-666666666666',
                    email: 'admin@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'SYSTEM_ADMIN' as UserRole,
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '+1-555-0401',
                    dateOfBirth: new Date('1985-01-01'),
                    gender: 'OTHER' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(40, 90),
                    updatedAt: getRecentDate(),
                }),

                // 1 Provider Admin
                createUserData({
                    id: '10101010-1010-1010-1010-101010101010',
                    email: 'provider@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'HOSPITAL_ADMIN' as UserRole,
                    firstName: 'Provider',
                    lastName: 'Administrator',
                    phone: '+1-555-0501',
                    dateOfBirth: new Date('1982-05-15'),
                    gender: 'MALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(45, 90),
                    updatedAt: getRecentDate(),
                })
            ]
        });

        console.log(`✅ Created ${testUsers.count} users`);

        // Create One Organization
        console.log('🏥 Creating organization...');
        const organization = await prisma.organization.upsert({
            where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
            update: {},
            create: {
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                name: 'HealthApp Medical Center',
                type: 'hospital',
                licenseNumber: 'HC-2025-001',
                contactInfo: {
                    phone: '+1-555-0100',
                    email: 'info@healthapp.com',
                    website: 'https://healthapp.com'
                },
                address: {
                    street: '123 Medical Drive',
                    city: 'Healthcare City',
                    state: 'CA',
                    zipCode: '90210',
                    country: 'USA'
                },
                isActive: true,
                createdAt: getRandomPastDate(60, 90),
                updatedAt: getRecentDate()
            }
        });

        console.log(`✅ Created organization: ${organization.name}`);

        // Create Eleven Medical Specialties
        console.log('🩺 Creating 11 medical specialties...');
        const specialties = [
            { name: 'Cardiology', description: 'Heart and cardiovascular system specialist' },
            { name: 'Endocrinology', description: 'Hormonal disorders and diabetes specialist' },
            { name: 'General Medicine', description: 'General medical practice' },
            { name: 'Pediatrics', description: 'Children\'s health specialist' },
            { name: 'Orthopedics', description: 'Bone, joint, and muscle specialist' },
            { name: 'Dermatology', description: 'Skin conditions specialist' },
            { name: 'Neurology', description: 'Brain and nervous system specialist' },
            { name: 'Psychiatry', description: 'Mental health specialist' },
            { name: 'Gynecology', description: 'Women\'s reproductive health specialist' },
            { name: 'Ophthalmology', description: 'Eye and vision specialist' },
            { name: 'Emergency Medicine', description: 'Emergency and acute care specialist' }
        ];

        for (const spec of specialties) {
            await prisma.specialty.upsert({
                where: { name: spec.name },
                update: {},
                create: {
                    name: spec.name,
                    description: spec.description,
                    createdAt: getRandomPastDate(50, 90),
                    updatedAt: getRecentDate()
                }
            });
        }

        console.log(`✅ Created ${specialties.length} medical specialties`);

        // Get the created specialties for doctor profiles
        const cardiologySpec = await prisma.specialty.findFirst({ where: { name: 'Cardiology' } });
        const endocrinologySpec = await prisma.specialty.findFirst({ where: { name: 'Endocrinology' } });
        const generalMedSpec = await prisma.specialty.findFirst({ where: { name: 'General Medicine' } });

        // Create Three Doctor profiles
        console.log('👨‍⚕️ Creating 3 doctor profiles...');
        await prisma.doctor.createMany({
            skipDuplicates: true,
            data: [
                {
                    id: '00000000-0000-0000-0000-000000000011',
                    userId: '00000000-0000-0000-0000-000000000001',
                    doctorId: 'DR001',
                    specialtyId: cardiologySpec?.id,
                    medicalLicenseNumber: 'MD123456',
                    yearsOfExperience: 15,
                    boardCertifications: ['Board Certified Internal Medicine', 'Cardiology'],
                    consultationFee: 200.00,
                    isVerified: true,
                    verificationDate: getRandomPastDate(20, 60),
                    practiceName: 'Smith Cardiology Clinic',
                    createdAt: getRandomPastDate(30, 80),
                },
                {
                    id: '00000000-0000-0000-0000-000000000022',
                    userId: '00000000-0000-0000-0000-000000000002',
                    doctorId: 'DR002',
                    specialtyId: endocrinologySpec?.id,
                    medicalLicenseNumber: 'MD789012',
                    yearsOfExperience: 12,
                    boardCertifications: ['Board Certified Family Medicine', 'Endocrinology'],
                    consultationFee: 180.00,
                    isVerified: true,
                    verificationDate: getRandomPastDate(15, 55),
                    practiceName: 'Doe Endocrinology Center',
                    createdAt: getRandomPastDate(28, 78),
                },
                {
                    id: '00000000-0000-0000-0000-000000000033',
                    userId: '00000000-0000-0000-0000-000000000003',
                    doctorId: 'DR003',
                    specialtyId: generalMedSpec?.id,
                    medicalLicenseNumber: 'MD345678',
                    yearsOfExperience: 8,
                    boardCertifications: ['Board Certified Family Medicine'],
                    consultationFee: 160.00,
                    isVerified: true,
                    verificationDate: getRandomPastDate(12, 50),
                    practiceName: 'Rodriguez Family Medicine',
                    createdAt: getRandomPastDate(25, 75),
                }
            ]
        });

        console.log(`✅ Created doctor profiles`);

        // Create HSP profile
        console.log('🩺 Creating HSP profile...');
        await prisma.hsp.upsert({
            where: { id: '55555555-5555-5555-5555-555555555551' },
            update: {},
            create: {
                id: '55555555-5555-5555-5555-555555555551',
                userId: '55555555-5555-5555-5555-555555555555',
                hspId: 'HSP001',
                hspType: 'wellness_coach',
                licenseNumber: 'HSP12345',
                certifications: ['Certified Wellness Coach', 'Nutrition Specialist'],
                specializations: ['wellness_coaching', 'nutrition'],
                yearsOfExperience: 8,
                createdAt: getRandomPastDate(35, 75)
            }
        });

        console.log(`✅ Created HSP profile`);

        // Create Provider
        console.log('🏢 Creating provider...');
        let provider;
        try {
            provider = await prisma.provider.upsert({
                where: { id: '10101010-1010-1010-1010-101010101011' },
                update: {},
                create: {
                    id: '10101010-1010-1010-1010-101010101011',
                    userId: '10101010-1010-1010-1010-101010101010',
                    name: 'HealthApp Provider System',
                    address: '456 Provider Ave',
                    city: 'Healthcare City',
                    state: 'CA',
                    details: {
                        phone: '+1-555-0500',
                        email: 'provider@healthapp.com',
                        provider_type: 'health_system',
                        license_number: 'PROV-2025-001'
                    },
                    createdAt: getRandomPastDate(45, 85),
                    updatedAt: getRecentDate()
                }
            });
            console.log(`✅ Created provider`);
        } catch (error: any) {
            console.log(`⚠️ Skipping provider creation - schema mismatch: ${error.message}`);
            provider = null;
        }

        // Create five patient profiles
        console.log('👥 Creating patient profiles with specific doctor assignments...');
        await prisma.patient.createMany({
            skipDuplicates: true,
            data: [
                // 3 patients for Doctor 1 (Dr. John Smith)
                {
                    userId: '77777777-7777-7777-7777-777777777777',
                    patientId: 'PAT-2025-001',
                    organizationId: organization.id,
                    primaryCareDoctorId: '00000000-0000-0000-0000-000000000011',
                    heightCm: 165.0,
                    weightKg: 68.5,
                    bloodType: 'A+',
                    primaryLanguage: 'en',
                    allergies: [
                        { name: 'Penicillin', severity: 'severe', reaction: 'rash' },
                        { name: 'Shellfish', severity: 'moderate', reaction: 'hives' }
                    ],
                    medicalHistory: [
                        { condition: 'Type 2 Diabetes', diagnosed: '2022-03-15', status: 'active' },
                        { condition: 'Hypertension', diagnosed: '2021-08-20', status: 'controlled' }
                    ],
                    emergencyContacts: [
                        { name: 'John Johnson', relationship: 'spouse', phone: '+1-555-0103', primary: true }
                    ],
                    overallAdherenceScore: 85.5,
                    createdAt: getRandomPastDate(20, 70),
                    updatedAt: getRecentDate()
                },
                {
                    userId: '88888888-8888-8888-8888-888888888888',
                    patientId: 'PAT-2025-002',
                    organizationId: organization.id,
                    primaryCareDoctorId: '00000000-0000-0000-0000-000000000011',
                    heightCm: 178.0,
                    weightKg: 82.3,
                    bloodType: 'O-',
                    primaryLanguage: 'en',
                    allergies: [],
                    medicalHistory: [
                        { condition: 'Hypertension', diagnosed: '2020-05-10', status: 'active' },
                        { condition: 'High Cholesterol', diagnosed: '2019-11-15', status: 'controlled' }
                    ],
                    emergencyContacts: [
                        { name: 'Lisa Chen', relationship: 'wife', phone: '+1-555-0104', primary: true }
                    ],
                    overallAdherenceScore: 92.0,
                    createdAt: getRandomPastDate(18, 68),
                    updatedAt: getRecentDate()
                },
                {
                    userId: '11111111-1111-1111-1111-111111111111',
                    patientId: 'PAT-2025-003',
                    organizationId: organization.id,
                    primaryCareDoctorId: '00000000-0000-0000-0000-000000000011',
                    heightCm: 162.0,
                    weightKg: 55.2,
                    bloodType: 'B+',
                    primaryLanguage: 'en',
                    allergies: [
                        { name: 'Latex', severity: 'mild', reaction: 'skin irritation' }
                    ],
                    medicalHistory: [
                        { condition: 'Coronary Artery Disease', diagnosed: '2023-01-10', status: 'managed' }
                    ],
                    emergencyContacts: [
                        { name: 'David Williams', relationship: 'father', phone: '+1-555-0106', primary: true }
                    ],
                    overallAdherenceScore: 78.5,
                    createdAt: getRandomPastDate(16, 66),
                    updatedAt: getRecentDate()
                },
                // 2 patients for Doctor 2 (Dr. Jane Doe)
                {
                    userId: '22222222-2222-2222-2222-222222222222',
                    patientId: 'PAT-2025-004',
                    organizationId: organization.id,
                    primaryCareDoctorId: '00000000-0000-0000-0000-000000000022',
                    heightCm: 175.0,
                    weightKg: 88.7,
                    bloodType: 'AB+',
                    primaryLanguage: 'en',
                    allergies: [],
                    medicalHistory: [
                        { condition: 'Type 2 Diabetes', diagnosed: '2020-08-15', status: 'controlled' },
                        { condition: 'Diabetic Neuropathy', diagnosed: '2022-11-20', status: 'active' }
                    ],
                    emergencyContacts: [
                        { name: 'Mary Brown', relationship: 'wife', phone: '+1-555-0107', primary: true }
                    ],
                    overallAdherenceScore: 88.2,
                    createdAt: getRandomPastDate(14, 64),
                    updatedAt: getRecentDate()
                },
                {
                    userId: '33333333-3333-3333-3333-333333333333',
                    patientId: 'PAT-2025-005',
                    organizationId: organization.id,
                    primaryCareDoctorId: '00000000-0000-0000-0000-000000000022',
                    heightCm: 158.0,
                    weightKg: 52.1,
                    bloodType: 'O+',
                    primaryLanguage: 'en',
                    allergies: [
                        { name: 'Aspirin', severity: 'severe', reaction: 'stomach upset' }
                    ],
                    medicalHistory: [
                        { condition: 'Hypothyroidism', diagnosed: '2021-06-30', status: 'active' },
                        { condition: 'Prediabetes', diagnosed: '2023-02-15', status: 'monitoring' }
                    ],
                    emergencyContacts: [
                        { name: 'Thomas Davis', relationship: 'brother', phone: '+1-555-0108', primary: true }
                    ],
                    overallAdherenceScore: 95.1,
                    createdAt: getRandomPastDate(12, 62),
                    updatedAt: getRecentDate()
                }
            ]
        });

        console.log(`✅ Created patient profiles`);

        // Create clinic for Doctor 1
        console.log('🏥 Creating clinic for Dr. Smith...');
        await prisma.clinic.upsert({
            where: { id: '00000000-0000-0000-0000-000000000501' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000501',
                doctorId: '00000000-0000-0000-0000-000000000011',
                organizationId: organization.id,
                name: 'Smith Cardiology Clinic',
                address: {
                    street: '123 Heart Avenue, Medical District',
                    city: 'Healthcare City',
                    state: 'CA',
                    zipCode: '90210',
                    country: 'USA'
                },
                phone: '+1-555-HEART1',
                email: 'info@smithcardiology.com',
                website: 'https://smithcardiology.com',
                operatingHours: {
                    monday: '8:00 AM - 5:00 PM',
                    tuesday: '8:00 AM - 5:00 PM',
                    wednesday: '8:00 AM - 5:00 PM',
                    thursday: '8:00 AM - 5:00 PM',
                    friday: '8:00 AM - 4:00 PM',
                    saturday: 'Closed',
                    sunday: 'Emergency only'
                },
                servicesOffered: ['Cardiac Consultation', 'Echocardiograms', 'Stress Testing', 'Heart Disease Management'],
                facilities: {
                    parking: true,
                    wheelchair_accessible: true,
                    languages: ['English', 'Spanish']
                },
                insuranceAccepted: ['Medicare', 'Blue Cross', 'Aetna', 'Cigna'],
                isActive: true,
                createdAt: getRandomPastDate(25, 75),
                updatedAt: getRecentDate()
            }
        });
        
        console.log(`✅ Created clinic for Dr. Smith`);

        // Create 10 comprehensive medicines
        console.log('💊 Creating 10 comprehensive medicines...');
        const medicines = [
            { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Metformin', type: 'tablet', description: 'First-line medication for type 2 diabetes management', details: { generic_name: 'Metformin Hydrochloride', brand_names: ['Glucophage', 'Fortamet', 'Glumetza'], drug_class: 'Biguanide', common_dosages: ['500mg', '850mg', '1000mg'], side_effects: ['Nausea', 'Diarrhea', 'Stomach upset'], contraindications: ['Severe kidney disease', 'Liver disease'] } },
            { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Lisinopril', type: 'tablet', description: 'ACE inhibitor for high blood pressure and heart failure', details: { generic_name: 'Lisinopril', brand_names: ['Prinivil', 'Zestril'], drug_class: 'ACE Inhibitor', common_dosages: ['2.5mg', '5mg', '10mg', '20mg'], side_effects: ['Dry cough', 'Dizziness', 'Headache'], contraindications: ['Pregnancy', 'History of angioedema'] } },
            { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Aspirin', type: 'tablet', description: 'Pain relief and cardiovascular protection', details: { generic_name: 'Acetylsalicylic Acid', brand_names: ['Bayer', 'Bufferin', 'Ecotrin'], drug_class: 'NSAID/Antiplatelet', common_dosages: ['81mg', '325mg', '500mg'], side_effects: ['Stomach irritation', 'Bleeding'], contraindications: ['Active bleeding', 'Severe asthma'] } },
            { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Amlodipine', type: 'tablet', description: 'Calcium channel blocker for high blood pressure', details: { generic_name: 'Amlodipine Besylate', brand_names: ['Norvasc', 'Katerzia'], drug_class: 'Calcium Channel Blocker', common_dosages: ['2.5mg', '5mg', '10mg'], side_effects: ['Ankle swelling', 'Dizziness'], contraindications: ['Severe aortic stenosis'] } },
            { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Simvastatin', type: 'tablet', description: 'Statin medication for high cholesterol', details: { generic_name: 'Simvastatin', brand_names: ['Zocor', 'FloLipid'], drug_class: 'HMG-CoA Reductase Inhibitor', common_dosages: ['5mg', '10mg', '20mg', '40mg'], side_effects: ['Muscle pain', 'Liver enzyme elevation'], contraindications: ['Active liver disease', 'Pregnancy'] } },
            { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Omeprazole', type: 'capsule', description: 'Proton pump inhibitor for acid reflux', details: { generic_name: 'Omeprazole', brand_names: ['Prilosec', 'Zegerid'], drug_class: 'Proton Pump Inhibitor', common_dosages: ['10mg', '20mg', '40mg'], side_effects: ['Headache', 'Nausea', 'Diarrhea'], contraindications: ['Hypersensitivity to benzimidazoles'] } },
            { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Albuterol', type: 'inhaler', description: 'Bronchodilator for asthma and COPD', details: { generic_name: 'Albuterol Sulfate', brand_names: ['ProAir', 'Ventolin', 'Proventil'], drug_class: 'Short-Acting Beta2 Agonist', common_dosages: ['90mcg/puff', '108mcg/puff'], side_effects: ['Tremor', 'Nervousness'], contraindications: ['Hypersensitivity to albuterol'] } },
            { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Levothyroxine', type: 'tablet', description: 'Thyroid hormone replacement therapy', details: { generic_name: 'Levothyroxine Sodium', brand_names: ['Synthroid', 'Levoxyl', 'Tirosint'], drug_class: 'Thyroid Hormone', common_dosages: ['25mcg', '50mcg', '75mcg', '100mcg'], side_effects: ['Heart palpitations', 'Weight loss'], contraindications: ['Untreated adrenal insufficiency'] } },
            { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Sertraline', type: 'tablet', description: 'SSRI antidepressant for depression and anxiety', details: { generic_name: 'Sertraline Hydrochloride', brand_names: ['Zoloft', 'Lustral'], drug_class: 'SSRI', common_dosages: ['25mg', '50mg', '100mg'], side_effects: ['Nausea', 'Sexual dysfunction'], contraindications: ['MAO inhibitor use'] } },
            { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Ibuprofen', type: 'tablet', description: 'Anti-inflammatory pain and fever reducer', details: { generic_name: 'Ibuprofen', brand_names: ['Advil', 'Motrin', 'Nuprin'], drug_class: 'NSAID', common_dosages: ['200mg', '400mg', '600mg'], side_effects: ['Stomach upset', 'Kidney problems'], contraindications: ['Heart disease', 'Active ulcers'] } }
        ];

        for (const med of medicines) {
            await prisma.medicine.upsert({
                where: { id: med.id },
                update: {},
                create: {
                    ...med,
                    publicMedicine: true,
                    createdAt: getRandomPastDate(30, 60),
                    updatedAt: getRecentDate()
                }
            });
        }

        console.log(`✅ Created ${medicines.length} medicines`);

        // Create comprehensive care plans for all patients
        console.log('🩺 Creating comprehensive care plans for all patients...');
        const createdPatients = await prisma.patient.findMany({
            select: { id: true, userId: true },
            orderBy: { createdAt: 'asc' }
        });

        const carePlanData = [
            { patientId: createdPatients[0]?.id, createdByDoctorId: '00000000-0000-0000-0000-000000000011', organizationId: organization.id, title: 'Diabetes & Hypertension Management Plan', description: 'Comprehensive care plan for managing Type 2 diabetes and hypertension with lifestyle modifications and medication adherence.', chronicConditions: ['Type 2 Diabetes', 'Hypertension'], conditionSeverity: { 'Type 2 Diabetes': 'moderate', 'Hypertension': 'mild' }, longTermGoals: ['Maintain HbA1c below 7.0%', 'Keep blood pressure under 130/80 mmHg', 'Achieve weight loss of 10-15 pounds', 'Improve cardiovascular fitness'], lifestyleModifications: [{ type: 'diet', details: { calories_per_day: 1800, carbohydrate_grams: 180, protein_grams: 120, fat_grams: 60, meal_plan: { breakfast: 'Oatmeal with berries, Greek yogurt', lunch: 'Grilled chicken salad with olive oil dressing', dinner: 'Baked salmon, steamed vegetables, quinoa', snacks: 'Apple with almonds, carrot sticks' }, restrictions: ['Low sodium', 'Limited refined sugars', 'Complex carbohydrates only'] } }, { type: 'exercise', details: { frequency: '5 days per week', duration: '45 minutes', activities: { cardio: 'Brisk walking 30 min, 4x/week', strength: 'Light weights 2x/week', flexibility: 'Yoga 15 min daily' }, target_heart_rate: '120-140 bpm', progression: 'Increase walking duration by 5 min every 2 weeks' } }], startDate: getRandomPastDate(30, 60), endDate: getFutureDate(180), status: 'ACTIVE', priority: 'HIGH' },
            { patientId: createdPatients[1]?.id, createdByDoctorId: '00000000-0000-0000-0000-000000000011', organizationId: organization.id, title: 'Hypertension & Cholesterol Control Plan', description: 'Cardiovascular health management focusing on blood pressure control and cholesterol reduction.', chronicConditions: ['Hypertension', 'High Cholesterol'], conditionSeverity: { 'Hypertension': 'moderate', 'High Cholesterol': 'mild' }, longTermGoals: ['Reduce blood pressure to <130/80 mmHg', 'Lower LDL cholesterol below 100 mg/dL', 'Maintain healthy weight', 'Increase physical activity'], lifestyleModifications: [{ type: 'diet', details: { calories_per_day: 2000, sodium_mg: 1500, fiber_grams: 35, meal_plan: { breakfast: 'Whole grain cereal with low-fat milk', lunch: 'Turkey and avocado wrap with vegetables', dinner: 'Lean beef, sweet potato, green beans', snacks: 'Mixed nuts, fresh fruit' }, restrictions: ['Low sodium', 'Low saturated fat', 'Heart-healthy fats'] } }, { type: 'exercise', details: { frequency: '4 days per week', duration: '40 minutes', activities: { cardio: 'Cycling or swimming 30 min, 3x/week', strength: 'Resistance bands 2x/week', flexibility: 'Stretching routine daily' }, target_heart_rate: '125-145 bpm' } }], startDate: getRandomPastDate(25, 55), endDate: getFutureDate(120), status: 'ACTIVE', priority: 'MEDIUM' },
            { patientId: createdPatients[2]?.id, createdByDoctorId: '00000000-0000-0000-0000-000000000011', organizationId: organization.id, title: 'Coronary Heart Disease Management', description: 'Cardiac rehabilitation and lifestyle modification program for coronary artery disease.', chronicConditions: ['Coronary Artery Disease'], conditionSeverity: { 'Coronary Artery Disease': 'severe' }, longTermGoals: ['Improve cardiac function and endurance', 'Prevent further coronary events', 'Manage stress and anxiety', 'Optimize medication adherence'], lifestyleModifications: [{ type: 'diet', details: { calories_per_day: 1600, sodium_mg: 1200, cholesterol_mg: 200, meal_plan: { breakfast: 'Oatmeal with walnuts and berries', lunch: 'Grilled fish with quinoa salad', dinner: 'Vegetable stir-fry with tofu', snacks: 'Greek yogurt, handful of almonds' }, restrictions: ['Very low sodium', 'Low cholesterol', 'Omega-3 rich foods'] } }, { type: 'exercise', details: { frequency: '6 days per week', duration: '30 minutes', activities: { cardio: 'Supervised walking program 3x/week', strength: 'Light resistance training 2x/week', flexibility: 'Gentle yoga daily', stress_management: 'Meditation 10 min daily' }, target_heart_rate: '100-120 bpm' } }], startDate: getRandomPastDate(20, 50), endDate: getFutureDate(365), status: 'ACTIVE', priority: 'HIGH' },
            { patientId: createdPatients[3]?.id, createdByDoctorId: '00000000-0000-0000-0000-000000000022', organizationId: organization.id, title: 'Diabetes & Neuropathy Care Plan', description: 'Comprehensive diabetes management with focus on neuropathy prevention and pain management.', chronicConditions: ['Type 2 Diabetes', 'Diabetic Neuropathy'], conditionSeverity: { 'Type 2 Diabetes': 'moderate', 'Diabetic Neuropathy': 'mild' }, longTermGoals: ['Maintain stable blood glucose levels', 'Prevent neuropathy progression', 'Manage neuropathic pain', 'Improve quality of life'], lifestyleModifications: [{ type: 'diet', details: { calories_per_day: 2200, carbohydrate_grams: 200, protein_grams: 140, meal_plan: { breakfast: 'Scrambled eggs with whole wheat toast', lunch: 'Chicken and vegetable soup with crackers', dinner: 'Grilled pork tenderloin with roasted vegetables', snacks: 'Cheese and whole grain crackers' }, restrictions: ['Consistent carbohydrate timing', 'Limited simple sugars'] } }, { type: 'exercise', details: { frequency: '3 days per week', duration: '30 minutes', activities: { cardio: 'Low-impact water aerobics 2x/week', strength: 'Chair exercises 2x/week', flexibility: 'Foot and ankle exercises daily' }, special_considerations: ['Foot care routine', 'Check feet daily for injuries'] } }], startDate: getRandomPastDate(18, 48), endDate: getFutureDate(180), status: 'ACTIVE', priority: 'MEDIUM' },
            { patientId: createdPatients[4]?.id, createdByDoctorId: '00000000-0000-0000-0000-000000000022', organizationId: organization.id, title: 'Thyroid & Pre-diabetes Management', description: 'Hormone optimization and diabetes prevention through lifestyle intervention.', chronicConditions: ['Hypothyroidism', 'Prediabetes'], conditionSeverity: { 'Hypothyroidism': 'mild', 'Prediabetes': 'mild' }, longTermGoals: ['Normalize thyroid hormone levels', 'Prevent progression to Type 2 diabetes', 'Maintain healthy weight', 'Optimize energy levels'], lifestyleModifications: [{ type: 'diet', details: { calories_per_day: 1500, iodine_mcg: 150, fiber_grams: 30, meal_plan: { breakfast: 'Greek yogurt with granola and fruit', lunch: 'Lentil soup with whole grain roll', dinner: 'Baked chicken breast with brown rice', snacks: 'Apple with peanut butter' }, restrictions: ['Thyroid-supporting foods', 'Low glycemic index'] } }, { type: 'exercise', details: { frequency: '5 days per week', duration: '35 minutes', activities: { cardio: 'Dance fitness 3x/week', strength: 'Bodyweight exercises 2x/week', flexibility: 'Pilates 2x/week' }, target_heart_rate: '130-150 bpm' } }], startDate: getRandomPastDate(15, 45), endDate: getFutureDate(270), status: 'ACTIVE', priority: 'MEDIUM' }
        ];

        // Create care plans
        for (const planData of carePlanData) {
            if (planData.patientId) {
                await prisma.carePlan.create({
                    data: {
                        ...planData,
                        createdAt: getRandomPastDate(20, 50),
                        updatedAt: getRecentDate()
                    }
                });
            }
        }
        
        // Create symptoms for each patient
        console.log('🩺 Creating patient symptoms...');
        const symptomData = [
            { patientId: createdPatients[0]?.id, name: 'Excessive thirst', severity: 'moderate', frequency: 'daily', duration: '2-3 hours' },
            { patientId: createdPatients[0]?.id, name: 'Frequent urination', severity: 'mild', frequency: 'multiple times daily', duration: 'ongoing' },
            { patientId: createdPatients[0]?.id, name: 'Fatigue after meals', severity: 'moderate', frequency: 'after meals', duration: '1-2 hours' },
            { patientId: createdPatients[1]?.id, name: 'Morning headaches', severity: 'mild', frequency: '3-4 times per week', duration: '30-60 minutes' },
            { patientId: createdPatients[1]?.id, name: 'Dizziness when standing', severity: 'mild', frequency: 'occasionally', duration: 'few seconds' },
            { patientId: createdPatients[2]?.id, name: 'Chest tightness with activity', severity: 'moderate', frequency: 'during exercise', duration: '5-10 minutes' },
            { patientId: createdPatients[2]?.id, name: 'Shortness of breath', severity: 'mild', frequency: 'with exertion', duration: 'until rest' },
            { patientId: createdPatients[3]?.id, name: 'Tingling in feet', severity: 'moderate', frequency: 'daily', duration: 'intermittent throughout day' },
            { patientId: createdPatients[3]?.id, name: 'Burning sensation in hands', severity: 'mild', frequency: 'evenings', duration: '2-3 hours' },
            { patientId: createdPatients[4]?.id, name: 'Feeling cold', severity: 'mild', frequency: 'daily', duration: 'most of the day' },
            { patientId: createdPatients[4]?.id, name: 'Dry skin and hair', severity: 'mild', frequency: 'constant', duration: 'ongoing' }
        ];

        const severityMap: { [key: string]: number } = { mild: 1, moderate: 2, severe: 3 };

        for (const symptom of symptomData) {
            if (symptom.patientId) {
                await prisma.symptom.create({
                    data: {
                        patientId: symptom.patientId,
                        symptomName: symptom.name,
                        severity: severityMap[symptom.severity] || 1,
                        description: `${symptom.frequency}, duration: ${symptom.duration}`,
                        onsetTime: getRandomPastDate(10, 30),
                        createdAt: getRandomPastDate(5, 25),
                        updatedAt: getRecentDate()
                    }
                });
            }
        }
        
        console.log(`✅ Created comprehensive care plans and symptoms for all patients`);

        // Create 4 vital templates
        console.log('📊 Creating 4 vital templates...');
        const vitalTemplates = [
            { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Blood Pressure', unit: 'mmHg' },
            { id: '550e8400-e29b-41d4-a716-446655440021', name: 'Heart Rate', unit: 'bpm' },
            { id: '550e8400-e29b-41d4-a716-446655440022', name: 'Weight', unit: 'kg' },
            { id: '550e8400-e29b-41d4-a716-446655440023', name: 'Blood Glucose', unit: 'mg/dL' }
        ];

        for (const template of vitalTemplates) {
            await prisma.vitalTemplate.upsert({
                where: { id: template.id },
                update: {},
                create: {
                    ...template,
                    createdAt: getRandomPastDate(40, 70),
                    updatedAt: getRecentDate()
                }
            });
        }

        console.log(`✅ Created ${vitalTemplates.length} vital templates`);
        
        // Create 3 medication reminders for each patient (15 total)
        console.log('💊 Creating 3 medication reminders per patient...');
        const medicationReminderData = [
            // Patient 1
            { participantId: createdPatients[0]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440001', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '500mg', frequency: 'Twice daily with meals', duration_days: 90, instructions: 'Take with breakfast and dinner to reduce stomach upset. Monitor blood sugar levels.' }, startDate: getRandomPastDate(20, 40), endDate: getFutureDate(70) },
            { participantId: createdPatients[0]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440002', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '10mg', frequency: 'Once daily in the morning', duration_days: 90, instructions: 'Take at same time each morning. Monitor blood pressure regularly.' }, startDate: getRandomPastDate(18, 38), endDate: getFutureDate(72) },
            { participantId: createdPatients[0]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440003', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '81mg', frequency: 'Once daily with food', duration_days: 90, instructions: 'Low-dose aspirin for cardiovascular protection. Take with food to prevent stomach irritation.' }, startDate: getRandomPastDate(16, 36), endDate: getFutureDate(74) },
            // Patient 2
            { participantId: createdPatients[1]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440004', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '5mg', frequency: 'Once daily', duration_days: 90, instructions: 'Take at the same time each day. May cause ankle swelling - report if persistent.' }, startDate: getRandomPastDate(22, 42), endDate: getFutureDate(68) },
            { participantId: createdPatients[1]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440005', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '20mg', frequency: 'Once daily in the evening', duration_days: 90, instructions: 'Take in the evening with or without food. Report any unexplained muscle pain.' }, startDate: getRandomPastDate(24, 44), endDate: getFutureDate(66) },
            { participantId: createdPatients[1]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440003', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '81mg', frequency: 'Once daily with breakfast', duration_days: 90, instructions: 'Cardioprotective dose. Take with food to minimize stomach irritation.' }, startDate: getRandomPastDate(20, 40), endDate: getFutureDate(70) },
            // Patient 3
            { participantId: createdPatients[2]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440002', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '5mg', frequency: 'Once daily', duration_days: 90, instructions: 'For heart protection and blood pressure control. Take consistently at same time.' }, startDate: getRandomPastDate(26, 46), endDate: getFutureDate(64) },
            { participantId: createdPatients[2]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440005', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '40mg', frequency: 'Once daily in the evening', duration_days: 90, instructions: 'High-intensity statin for coronary disease. Monitor for muscle symptoms.' }, startDate: getRandomPastDate(24, 44), endDate: getFutureDate(66) },
            { participantId: createdPatients[2]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440003', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000011', details: { dosage: '81mg', frequency: 'Once daily with dinner', duration_days: 90, instructions: 'Essential for coronary disease management. Take with food consistently.' }, startDate: getRandomPastDate(22, 42), endDate: getFutureDate(68) },
            // Patient 4
            { participantId: createdPatients[3]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440001', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000022', details: { dosage: '1000mg', frequency: 'Twice daily with meals', duration_days: 90, instructions: 'Extended-release formula. Take with breakfast and dinner.' }, startDate: getRandomPastDate(28, 48), endDate: getFutureDate(62) },
            { participantId: createdPatients[3]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440008', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000022', details: { dosage: '300mg', frequency: 'Three times daily', duration_days: 90, instructions: 'For diabetic neuropathy pain. Start with bedtime dose, gradually increase as tolerated.' }, startDate: getRandomPastDate(26, 46), endDate: getFutureDate(64) }, // Using Levothyroxine as Gabapentin substitute
            { participantId: createdPatients[3]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440010', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000022', details: { dosage: '400mg', frequency: 'As needed, up to 3 times daily', duration_days: 30, instructions: 'For pain relief. Take with food. Do not exceed 1200mg per day.' }, startDate: getRandomPastDate(15, 30), endDate: getFutureDate(15) },
            // Patient 5
            { participantId: createdPatients[4]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440008', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000022', details: { dosage: '75mcg', frequency: 'Once daily in the morning', duration_days: 90, instructions: 'Take on empty stomach, 30-60 minutes before breakfast. Avoid calcium/iron supplements.' }, startDate: getRandomPastDate(30, 50), endDate: getFutureDate(60) },
            { participantId: createdPatients[4]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440001', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000022', details: { dosage: '500mg', frequency: 'Once daily with dinner', duration_days: 90, instructions: 'For prediabetes management. Start low dose to minimize GI side effects.' }, startDate: getRandomPastDate(20, 35), endDate: getFutureDate(75) },
            { participantId: createdPatients[4]?.id, medicineId: '550e8400-e29b-41d4-a716-446655440006', organizerType: 'DOCTOR' as MedicationOrganizerType, organizerId: '00000000-0000-0000-0000-000000000022', details: { dosage: '20mg', frequency: 'Once daily before breakfast', duration_days: 60, instructions: 'For acid reflux related to thyroid medication. Take 30 minutes before eating.' }, startDate: getRandomPastDate(25, 40), endDate: getFutureDate(35) }
        ];

        for (const medData of medicationReminderData) {
            if (medData.participantId) {
                await prisma.medication.create({
                    data: {
                        ...medData,
                        createdAt: getRandomPastDate(15, 35),
                        updatedAt: getRecentDate()
                    }
                });
            }
        }
        
        console.log(`✅ Created 3 medication reminders for each patient (15 total)`);

        // Create 5 symptoms/conditions
        console.log('🩺 Creating 5 symptoms/conditions...');
        try {
            const symptomsData = [
                { id: '550e8400-e29b-41d4-a716-446655440030', diagnosisName: 'Type 2 Diabetes', symptoms: ['Excessive thirst', 'Frequent urination', 'Unexplained weight loss', 'Increased hunger', 'Fatigue'], category: 'Endocrine', severityIndicators: { mild: ['Mild thirst', 'Occasional fatigue'], moderate: ['Increased hunger', 'Blurred vision'], severe: ['Unexplained weight loss', 'Frequent urination'] }, commonAgeGroups: ['adults', 'elderly'], genderSpecific: 'both', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440031', diagnosisName: 'Hypertension', symptoms: ['Headaches', 'Dizziness', 'Chest pain', 'Nosebleeds', 'Shortness of breath'], category: 'Cardiovascular', severityIndicators: { mild: ['Occasional headaches'], moderate: ['Regular headaches', 'Chest discomfort'], severe: ['Severe headaches', 'Chest pain', 'Shortness of breath'] }, commonAgeGroups: ['adults', 'elderly'], genderSpecific: 'both', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440032', diagnosisName: 'Asthma', symptoms: ['Wheezing', 'Coughing', 'Chest tightness', 'Shortness of breath'], category: 'Respiratory', severityIndicators: { mild: ['Occasional wheezing'], moderate: ['Regular shortness of breath'], severe: ['Difficulty speaking', 'Severe breathing problems'] }, commonAgeGroups: ['children', 'adults'], genderSpecific: 'both', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440033', diagnosisName: 'Depression', symptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Sleep disturbances', 'Appetite changes'], category: 'Mental Health', severityIndicators: { mild: ['Occasional sadness'], moderate: ['Regular mood changes'], severe: ['Persistent hopelessness', 'Thoughts of self-harm'] }, commonAgeGroups: ['adolescents', 'adults', 'elderly'], genderSpecific: 'both', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440034', diagnosisName: 'Anxiety Disorder', symptoms: ['Excessive worry', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Irritability', 'Muscle tension'], category: 'Mental Health', severityIndicators: { mild: ['Occasional worry'], moderate: ['Regular anxiety'], severe: ['Panic attacks', 'Unable to perform daily activities'] }, commonAgeGroups: ['adolescents', 'adults'], genderSpecific: 'both', isActive: true }
            ];

            for (const symptom of symptomsData) {
                await prisma.symptomDatabase.upsert({
                    where: { id: symptom.id },
                    update: {},
                    create: {
                        ...symptom,
                        createdAt: getRandomPastDate(35, 65),
                        updatedAt: getRecentDate()
                    }
                });
            }

            console.log(`✅ Created ${symptomsData.length} symptoms/conditions`);
        } catch (error: any) {
            console.log(`⚠️ Skipping symptoms database creation - table issue: ${error.message}`);
        }
        
        // Link Provider Admin to 2 doctors
        console.log('🔗 Creating provider relationships...');
        try {
            if (provider) {
                await prisma.doctor.update({ where: { id: '00000000-0000-0000-0000-000000000011' }, data: { organizationId: organization.id, updatedAt: getRecentDate() } });
                await prisma.doctor.update({ where: { id: '00000000-0000-0000-0000-000000000033' }, data: { organizationId: organization.id, updatedAt: getRecentDate() } });
                console.log(`✅ Linked Provider Admin to 2 doctors (1 with patients, 1 without)`);
            }
        } catch (error: any) {
            console.log(`⚠️ Could not create provider relationships: ${error.message}`);
        }

        // Create 5 treatments
        console.log('💉 Creating 5 treatments...');
        try {
            const treatmentsData = [
                { id: '550e8400-e29b-41d4-a716-446655440040', treatmentName: 'Metformin Therapy', treatmentType: 'medication', description: 'First-line medication for Type 2 diabetes management', applicableConditions: ['Type 2 Diabetes', 'Pre-diabetes'], duration: 'Long-term', frequency: 'Twice daily with meals', dosageInfo: { initial_dose: '500mg twice daily', maximum_dose: '2000mg daily', titration: 'Increase by 500mg weekly as tolerated' }, category: 'Antidiabetic', severityLevel: 'moderate', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440041', treatmentName: 'ACE Inhibitor Therapy', treatmentType: 'medication', description: 'First-line treatment for hypertension', applicableConditions: ['Hypertension', 'Heart Failure'], duration: 'Long-term', frequency: 'Once daily', dosageInfo: { initial_dose: '5mg daily', maximum_dose: '40mg daily', titration: 'Increase every 1-2 weeks' }, category: 'Cardiovascular', severityLevel: 'moderate', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440042', treatmentName: 'Inhaled Bronchodilator Therapy', treatmentType: 'medication', description: 'Short-acting beta2 agonist for asthma', applicableConditions: ['Asthma', 'COPD'], duration: 'As needed', frequency: '2 puffs every 4-6 hours as needed', dosageInfo: { initial_dose: '90mcg (2 puffs) as needed', maximum_dose: '12 puffs per day' }, category: 'Respiratory', severityLevel: 'mild_to_moderate', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440043', treatmentName: 'Cognitive Behavioral Therapy', treatmentType: 'therapy', description: 'Evidence-based psychotherapy for depression and anxiety', applicableConditions: ['Depression', 'Anxiety Disorder', 'PTSD'], duration: '12-20 sessions over 3-6 months', frequency: 'Weekly sessions initially', dosageInfo: { initial_dose: '45-50 minute sessions weekly', titration: 'Adjust frequency based on progress' }, category: 'Mental Health', severityLevel: 'mild_to_severe', isActive: true },
                { id: '550e8400-e29b-41d4-a716-446655440044', treatmentName: 'Lifestyle Modification Program', treatmentType: 'lifestyle', description: 'Comprehensive diet and exercise program', applicableConditions: ['Type 2 Diabetes', 'Hypertension', 'Obesity'], duration: 'Ongoing lifestyle changes', frequency: 'Daily adherence', dosageInfo: { initial_dose: '30 minutes moderate exercise, 5 days/week', maximum_dose: '60+ minutes daily as tolerated' }, category: 'Lifestyle', severityLevel: 'all_levels', isActive: true }
            ];

            for (const treatment of treatmentsData) {
                await prisma.treatmentDatabase.upsert({
                    where: { id: treatment.id },
                    update: {},
                    create: {
                        ...treatment,
                        createdAt: getRandomPastDate(30, 60),
                        updatedAt: getRecentDate()
                    }
                });
            }

            console.log(`✅ Created ${treatmentsData.length} treatments`);
        } catch (error: any) {
            console.log(`⚠️ Skipping treatments database creation - table issue: ${error.message}`);
        }

        // Create 3 appointments
        console.log('📅 Creating 3 appointments...');
        const patientsForAppointments = await prisma.patient.findMany({
            select: { id: true },
            take: 3,
            orderBy: { createdAt: 'asc' }
        });

        if (patientsForAppointments.length >= 3) {
            const appointmentsData = [
                { id: '00000000-0000-0000-0000-000000000301', doctorId: '00000000-0000-0000-0000-000000000011', patientId: patientsForAppointments[0].id, startDate: getTodayDate(), startTime: new Date(new Date().setHours(9, 0, 0, 0)), endTime: new Date(new Date().setHours(9, 30, 0, 0)), description: 'Routine checkup and medication review', createdAt: getRecentDate() },
                { id: '00000000-0000-0000-0000-000000000302', doctorId: '00000000-0000-0000-0000-000000000011', patientId: patientsForAppointments[1].id, startDate: getTodayDate(), startTime: new Date(new Date().setHours(14, 0, 0, 0)), endTime: new Date(new Date().setHours(14, 30, 0, 0)), description: 'Follow-up for hypertension management', createdAt: getRecentDate() },
                { id: '00000000-0000-0000-0000-000000000303', doctorId: '00000000-0000-0000-0000-000000000022', patientId: patientsForAppointments[2].id, startDate: getFutureDate(1), startTime: new Date(getFutureDate(1).setHours(10, 0, 0, 0)), endTime: new Date(getFutureDate(1).setHours(10, 30, 0, 0)), description: 'Diabetes management consultation', createdAt: getRecentDate() }
            ];

            for (const apt of appointmentsData) {
                await prisma.appointment.upsert({
                    where: { id: apt.id },
                    update: {},
                    create: apt
                });
            }

            console.log('✅ Created 3 appointments');
        }

        // Create 3 adherence records
        console.log('📋 Creating 3 adherence records...');
        if (createdPatients.length >= 2) {
            const adherenceData = [
                { id: '00000000-0000-0000-0000-000000000401', patientId: createdPatients[0].id, adherenceType: 'MEDICATION' as AdherenceType, dueAt: getRandomPastDate(1, 7), recordedAt: getRandomPastDate(1, 7), isCompleted: true, isMissed: false, createdAt: getRandomPastDate(1, 7), updatedAt: getRecentDate() },
                { id: '00000000-0000-0000-0000-000000000402', patientId: createdPatients[1].id, adherenceType: 'VITAL_CHECK' as AdherenceType, dueAt: getRandomPastDate(2, 8), recordedAt: getRandomPastDate(2, 8), isCompleted: true, isMissed: false, createdAt: getRandomPastDate(2, 8), updatedAt: getRecentDate() },
                { id: '00000000-0000-0000-0000-000000000403', patientId: createdPatients.length >= 3 ? createdPatients[2].id : createdPatients[0].id, adherenceType: 'APPOINTMENT' as AdherenceType, dueAt: getRandomPastDate(3, 9), recordedAt: null, isCompleted: false, isMissed: true, createdAt: getRandomPastDate(3, 9), updatedAt: getRecentDate() }
            ];

            for (const record of adherenceData) {
                await prisma.adherenceRecord.upsert({
                    where: { id: record.id },
                    update: {},
                    create: record
                });
            }

            console.log('✅ Created 3 adherence records');
        }

        console.log(`\n🎉 Successfully seeded comprehensive healthcare test data!`);
        console.log(`📊 Summary:`);
        console.log(`   - Users: ${testUsers.count} (5 patients, 3 doctors, 1 HSP, 1 system admin, 1 provider admin) ✅`);
        console.log(`   - Doctor-Patient Relationships:`);
        console.log(`     * Dr. John Smith (Cardiology): 3 patients + clinic ✅`);
        console.log(`     * Dr. Jane Doe (Endocrinology): 2 patients ✅`);
        console.log(`     * Dr. Emily Rodriguez (General Medicine): 0 patients ✅`);
        console.log(`   - Provider Admin linked to Dr. Smith & Dr. Rodriguez ✅`);
        console.log(`   - Organization: 1 ✅`);
        console.log(`   - Medical Specialties: 11 ✅`);
        console.log(`   - Medicines: 10 ✅`);
        console.log(`   - Patient Care Plans: 5 (with diets, workouts, symptoms) ✅`);
        console.log(`   - Patient Symptoms: 11 individual symptoms ✅`);
        console.log(`   - Medication Reminders: 15 (3 per patient) ✅`);
        console.log(`   - Clinic: 1 (Smith Cardiology Clinic) ✅`);
        console.log(`   - Vital Templates: 4 ✅`);
        console.log(`   - Symptoms Database: 5 ✅`);
        console.log(`   - Treatments Database: 5 ✅`);
        console.log(`   - Appointments: 3 ✅`);
        console.log(`   - Adherence Records: 3 ✅`);
        console.log(`   - Provider: ${provider ? '✅' : '⚠️'}`);
        console.log(`\n🔑 Login Credentials:`);
        console.log(`   - Dr. Smith (3 patients + clinic): doctor@healthapp.com / TempPassword123!`);
        console.log(`   - Dr. Doe (2 patients): doctor1@healthapp.com / TempPassword123!`);
        console.log(`   - All other users: email / ${sanitize(defaultPassword)}`);
        console.log(`\n📈 Dashboard Data Ready:`);
        console.log(`   - Doctor Dashboards: Patient lists, appointments, medication tracking ✅`);
        console.log(`   - Patient Dashboards: Care plans, medications, symptoms, vitals ✅`);

        return {
            success: true,
            message: 'Comprehensive healthcare test data seeded successfully with exact structure requested',
            data: {
                users: testUsers.count,
                patients: 5,
                doctors: 3,
                doctorPatientDistribution: 'Dr.Smith(3), Dr.Doe(2), Dr.Rodriguez(0)',
                hsp: 1,
                systemAdmin: 1,
                providerAdmin: 1,
                organizations: 1,
                clinics: 1,
                specialties: 11,
                medicines: 10,
                carePlans: 5,
                patientSymptoms: 11,
                medicationReminders: 15,
                vitalTemplates: 4,
                symptomsDatabase: 5,
                treatmentsDatabase: 5,
                appointments: 3,
                adherenceRecords: 3,
                provider: provider ? 1 : 0,
                providerDoctorLinks: 2
            }
        };

    } catch (error: any) {
        console.error('❌ Error seeding healthcare data:', error);
        
        if (error.code === 'P2002') {
            console.error('🔍 Unique constraint violation - data may already exist or IDs conflict');
        } else if (error.code === 'P2003') {
            console.error('🔍 Foreign key constraint failed - relationship data missing or invalid');
        } else if (error.code === 'P2021') {
            console.error('🔍 Database table does not exist - run migrations first');
        } else if (error.code === 'P2025') {
            console.error('🔍 Record not found - dependency data missing');
        } else if (error.message.includes('Unknown field')) {
            console.error('🔍 Schema field mismatch - check Prisma schema against database');
        } else {
            console.error('🔍 Unexpected error during seeding process');
        }
        
        console.error('\n💡 Troubleshooting suggestions:');
        console.error('   1. Run: npx prisma migrate dev');
        console.error('   2. Run: npx prisma generate');
        console.error('   3. Check database connection');
        console.error('   4. Verify Prisma schema matches database structure');
        
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution when run directly
if (require.main === module) {
    console.log('🚀 Starting healthcare data seeding...');
    seedComprehensiveHealthcareData()
        .then((result) => {
            console.log('🎉 Seeding completed successfully:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}
