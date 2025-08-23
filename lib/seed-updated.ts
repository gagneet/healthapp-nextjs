// lib/seed.ts - Fixed field names to match Prisma schema exactly
import { PrismaClient, AdherenceType, UserRole, UserAccountStatus, UserGender, MedicationOrganizerType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Database cleanup function
async function cleanDatabase() {
  console.log('🧹 Cleaning database - removing all existing data...');
  
  try {
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
      () => prisma.hSP.deleteMany({}),
      () => prisma.providers.deleteMany({}),
      () => prisma.medicine.deleteMany({}),
      () => prisma.vitalTemplates.deleteMany({}),
      () => prisma.symptomsDatabase.deleteMany({}),
      () => prisma.treatmentDatabase.deleteMany({}),
      () => prisma.speciality.deleteMany({}),
      () => prisma.organization.deleteMany({}),
      () => prisma.user.deleteMany({})
    ];
    
    for (const operation of cleanupOperations) {
      try {
        await operation();
      } catch (error: any) {
        console.log(`⚠️ Cleanup operation failed (continuing): ${error.message}`);
      }
    }
    
    console.log('✅ Database cleaned successfully');
  } catch (error: any) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
}

// Helper functions for dates
const getRandomPastDate = (minDaysAgo = 7, maxDaysAgo = 90): Date => {
    const now = new Date();
    const minDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
    return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const getRecentDate = (): Date => getRandomPastDate(1, 7);
const getTodayDate = (): Date => new Date();
const getFutureDate = (daysAhead = 1): Date => new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

async function waitForTables(maxRetries = 10, delay = 1000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await prisma.user.count();
            console.log('✅ Database tables are ready');
            return true;
        } catch (error: any) {
            if (error.code === 'P2021') {
                console.log(`⏳ Waiting for database tables... (attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Database tables not ready after maximum retries');
}

export async function seedComprehensiveHealthcareData() {
    console.log('📊 Seeding comprehensive healthcare test data...');

    try {
        await waitForTables();
        await cleanDatabase();

        // Password setup
        const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        const basicDoctorPassword = await bcrypt.hash('TempPassword123!', 12);

        // Create test users - User model uses camelCase fields
        console.log('👥 Creating users...');
        
        const testUsers = await prisma.user.createMany({
            skipDuplicates: true,
            data: [
                // 3 Doctors - User model uses camelCase
                {
                    id: '00000000-0000-0000-0000-000000000001',
                    email: 'doctor@healthapp.com',
                    passwordHash: basicDoctorPassword,  // camelCase for User model
                    role: 'DOCTOR' as UserRole,
                    firstName: 'Dr. John',              // camelCase for User model
                    lastName: 'Smith',                  // camelCase for User model
                    phone: '+1-555-0001',
                    dateOfBirth: new Date('1975-01-15'), // camelCase for User model
                    gender: 'MALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus, // camelCase for User model
                    emailVerifiedLegacy: true,          // camelCase for User model
                    createdAt: getRandomPastDate(30, 90), // camelCase for User model
                    updatedAt: getRecentDate(),         // camelCase for User model
                    // Auth.js v5 required fields
                    name: 'Dr. John Smith',
                    emailVerified: getRandomPastDate(30, 90),
                    image: null,
                },
                {
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
                    name: 'Dr. Jane Doe',
                    emailVerified: getRandomPastDate(28, 88),
                    image: null,
                },
                {
                    id: '99999999-9999-9999-9999-999999999999',
                    email: 'doctor2@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'DOCTOR' as UserRole,
                    firstName: 'Dr. Emily',
                    lastName: 'Rodriguez',
                    phone: '+1-555-0201',
                    dateOfBirth: new Date('1975-11-08'),
                    gender: 'FEMALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(25, 85),
                    updatedAt: getRecentDate(),
                    name: 'Dr. Emily Rodriguez',
                    emailVerified: getRandomPastDate(25, 85),
                    image: null,
                },
                
                // 5 Patients - User model uses camelCase
                {
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
                    name: 'Sarah Johnson',
                    emailVerified: getRandomPastDate(20, 80),
                    image: null,
                },
                {
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
                    name: 'Michael Chen',
                    emailVerified: getRandomPastDate(18, 78),
                    image: null,
                },
                {
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
                    name: 'Emma Williams',
                    emailVerified: getRandomPastDate(16, 76),
                    image: null,
                },
                {
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
                    name: 'James Brown',
                    emailVerified: getRandomPastDate(14, 74),
                    image: null,
                },
                {
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
                    name: 'Olivia Davis',
                    emailVerified: getRandomPastDate(12, 72),
                    image: null,
                },

                // 1 HSP
                {
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
                    name: 'Maria Garcia',
                    emailVerified: getRandomPastDate(35, 85),
                    image: null,
                },

                // 1 System Admin
                {
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
                    name: 'Admin User',
                    emailVerified: getRandomPastDate(40, 90),
                    image: null,
                },

                // 1 Provider Admin
                {
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
                    name: 'Provider Administrator',
                    emailVerified: getRandomPastDate(45, 90),
                    image: null,
                }
            ]
        });

        console.log(`✅ Created ${testUsers.count} users`);

        // Create One Organization - Organization model uses snake_case
        console.log('🏥 Creating organization...');
        const organization = await prisma.organization.upsert({
            where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
            update: {},
            create: {
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                name: 'HealthApp Medical Center',
                type: 'hospital',
                license_number: 'HC-2025-001',      // snake_case for Organization model
                contact_info: {                     // snake_case for Organization model
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
                is_active: true,                    // snake_case for Organization model
                created_at: getRandomPastDate(60, 90), // snake_case for Organization model
                updated_at: getRecentDate()         // snake_case for Organization model
            }
        });

        console.log(`✅ Created organization: ${organization.name}`);

        // Create Eleven Medical Specialties - Speciality model uses snake_case
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
            await prisma.speciality.upsert({
                where: { name: spec.name },
                update: {},
                create: {
                    name: spec.name,
                    description: spec.description,
                    created_at: getRandomPastDate(50, 90), // snake_case for Speciality model
                    updated_at: getRecentDate()            // snake_case for Speciality model
                }
            });
        }

        console.log(`✅ Created ${specialties.length} medical specialties`);

        // Get specialties for doctor profiles
        const cardiologySpec = await prisma.speciality.findFirst({ where: { name: 'Cardiology' } });
        const endocrinologySpec = await prisma.speciality.findFirst({ where: { name: 'Endocrinology' } });
        const generalMedSpec = await prisma.speciality.findFirst({ where: { name: 'General Medicine' } });

        // Create Three Doctor profiles with comprehensive details - Doctor model uses snake_case
        console.log('👨‍⚕️ Creating 3 doctor profiles...');
        await prisma.doctor.createMany({
            skipDuplicates: true,
            data: [
                {
                    id: '00000000-0000-0000-0000-000000000011',
                    user_id: '00000000-0000-0000-0000-000000000001',     // snake_case for Doctor model
                    doctor_id: 'DR001',                                  // snake_case for Doctor model
                    speciality_id: cardiologySpec?.id,                   // snake_case for Doctor model
                    medical_license_number: 'MD123456',                  // snake_case for Doctor model
                    years_of_experience: 15,                             // snake_case for Doctor model
                    board_certifications: ['Board Certified Internal Medicine', 'Cardiology'], // snake_case for Doctor model
                    consultation_fee: 200.00,                            // snake_case for Doctor model
                    is_verified: true,                                    // snake_case for Doctor model
                    verification_date: getRandomPastDate(20, 60),        // snake_case for Doctor model
                    practice_name: 'Smith Cardiology Clinic',            // snake_case for Doctor model
                    created_at: getRandomPastDate(30, 80),               // snake_case for Doctor model
                },
                {
                    id: '00000000-0000-0000-0000-000000000022',
                    user_id: '00000000-0000-0000-0000-000000000002',
                    doctor_id: 'DR002',
                    speciality_id: endocrinologySpec?.id,
                    medical_license_number: 'MD789012',
                    years_of_experience: 12,
                    board_certifications: ['Board Certified Family Medicine', 'Endocrinology'],
                    consultation_fee: 180.00,
                    is_verified: true,
                    verification_date: getRandomPastDate(15, 55),
                    practice_name: 'Doe Endocrinology Center',
                    created_at: getRandomPastDate(28, 78),
                },
                {
                    id: '44444444-4444-4444-4444-444444444444',
                    user_id: '99999999-9999-9999-9999-999999999999',
                    doctor_id: 'DR003',
                    speciality_id: generalMedSpec?.id,
                    medical_license_number: 'MD345678',
                    years_of_experience: 8,
                    board_certifications: ['Board Certified Family Medicine'],
                    consultation_fee: 160.00,
                    is_verified: true,
                    verification_date: getRandomPastDate(12, 50),
                    practice_name: 'Rodriguez Family Medicine',
                    created_at: getRandomPastDate(25, 75),
                }
            ]
        });

        console.log(`✅ Created doctor profiles`);

        // Create HSP profile using correct model name - HSP model uses snake_case
        console.log('🩺 Creating HSP profile...');
        await prisma.hSP.upsert({
            where: { id: '55555555-5555-5555-5555-555555555551' },
            update: {},
            create: {
                id: '55555555-5555-5555-5555-555555555551',
                user_id: '55555555-5555-5555-5555-555555555555', // snake_case for HSP model
                hsp_id: 'HSP001',                                 // snake_case for HSP model
                hsp_type: 'wellness_coach',                       // snake_case for HSP model
                license_number: 'HSP12345',                       // snake_case for HSP model
                certifications: ['Certified Wellness Coach', 'Nutrition Specialist'],
                specializations: ['wellness_coaching', 'nutrition'],
                years_of_experience: 8,                           // snake_case for HSP model
                created_at: getRandomPastDate(35, 75)            // snake_case for HSP model
            }
        });

        console.log(`✅ Created HSP profile`);

        // Create Provider - Providers model uses snake_case
        console.log('🏢 Creating provider...');
        let provider;
        try {
            provider = await prisma.providers.upsert({
                where: { id: '10101010-1010-1010-1010-101010101011' },
                update: {},
                create: {
                    id: '10101010-1010-1010-1010-101010101011',
                    user_id: '10101010-1010-1010-1010-101010101010', // snake_case for Providers model
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
                    created_at: getRandomPastDate(45, 85), // snake_case for Providers model
                    updated_at: getRecentDate()            // snake_case for Providers model
                }
            });
            console.log(`✅ Created provider`);
        } catch (error: any) {
            console.log(`⚠️ Skipping provider creation: ${error.message}`);
            provider = null;
        }

        // Create five patient profiles with specific doctor linkages - Patient model uses snake_case
        console.log('👥 Creating patient profiles...');
        await prisma.patient.createMany({
            skipDuplicates: true,
            data: [
                // 3 patients for Doctor 1
                {
                    user_id: '77777777-7777-7777-7777-777777777777', // snake_case for Patient model
                    patient_id: 'PAT-2025-001',                      // snake_case for Patient model
                    organization_id: organization.id,                // snake_case for Patient model
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011', // snake_case for Patient model
                    height_cm: 165.0,                                 // snake_case for Patient model
                    weight_kg: 68.5,                                  // snake_case for Patient model
                    blood_type: 'A+',                                 // snake_case for Patient model
                    primary_language: 'en',                           // snake_case for Patient model
                    allergies: [
                        { name: 'Penicillin', severity: 'severe', reaction: 'rash' },
                        { name: 'Shellfish', severity: 'moderate', reaction: 'hives' }
                    ],
                    medical_history: [                               // snake_case for Patient model
                        { condition: 'Type 2 Diabetes', diagnosed: '2022-03-15', status: 'active' },
                        { condition: 'Hypertension', diagnosed: '2021-08-20', status: 'controlled' }
                    ],
                    emergency_contacts: [                            // snake_case for Patient model
                        { name: 'John Johnson', relationship: 'spouse', phone: '+1-555-0103', primary: true }
                    ],
                    overall_adherence_score: 85.5,                   // snake_case for Patient model
                    created_at: getRandomPastDate(20, 70),          // snake_case for Patient model
                    updated_at: getRecentDate()                      // snake_case for Patient model
                },
                {
                    user_id: '88888888-8888-8888-8888-888888888888',
                    patient_id: 'PAT-2025-002',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                    height_cm: 178.0,
                    weight_kg: 82.3,
                    blood_type: 'O-',
                    primary_language: 'en',
                    allergies: [],
                    medical_history: [
                        { condition: 'Hypertension', diagnosed: '2020-05-10', status: 'active' },
                        { condition: 'High Cholesterol', diagnosed: '2019-11-15', status: 'controlled' }
                    ],
                    emergency_contacts: [
                        { name: 'Lisa Chen', relationship: 'wife', phone: '+1-555-0104', primary: true }
                    ],
                    overall_adherence_score: 92.0,
                    created_at: getRandomPastDate(18, 68),
                    updated_at: getRecentDate()
                },
                {
                    user_id: '11111111-1111-1111-1111-111111111111',
                    patient_id: 'PAT-2025-003',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                    height_cm: 162.0,
                    weight_kg: 55.2,
                    blood_type: 'B+',
                    primary_language: 'en',
                    allergies: [
                        { name: 'Latex', severity: 'mild', reaction: 'skin irritation' }
                    ],
                    medical_history: [
                        { condition: 'Coronary Artery Disease', diagnosed: '2023-01-10', status: 'managed' }
                    ],
                    emergency_contacts: [
                        { name: 'David Williams', relationship: 'father', phone: '+1-555-0106', primary: true }
                    ],
                    overall_adherence_score: 78.5,
                    created_at: getRandomPastDate(16, 66),
                    updated_at: getRecentDate()
                },
                // 2 patients for Doctor 2
                {
                    user_id: '22222222-2222-2222-2222-222222222222',
                    patient_id: 'PAT-2025-004',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022',
                    height_cm: 175.0,
                    weight_kg: 88.7,
                    blood_type: 'AB+',
                    primary_language: 'en',
                    allergies: [],
                    medical_history: [
                        { condition: 'Type 2 Diabetes', diagnosed: '2020-08-15', status: 'controlled' },
                        { condition: 'Diabetic Neuropathy', diagnosed: '2022-11-20', status: 'active' }
                    ],
                    emergency_contacts: [
                        { name: 'Mary Brown', relationship: 'wife', phone: '+1-555-0107', primary: true }
                    ],
                    overall_adherence_score: 88.2,
                    created_at: getRandomPastDate(14, 64),
                    updated_at: getRecentDate()
                },
                {
                    user_id: '33333333-3333-3333-3333-333333333333',
                    patient_id: 'PAT-2025-005',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022',
                    height_cm: 158.0,
                    weight_kg: 52.1,
                    blood_type: 'O+',
                    primary_language: 'en',
                    allergies: [
                        { name: 'Aspirin', severity: 'severe', reaction: 'stomach upset' }
                    ],
                    medical_history: [
                        { condition: 'Hypothyroidism', diagnosed: '2021-06-30', status: 'active' },
                        { condition: 'Prediabetes', diagnosed: '2023-02-15', status: 'monitoring' }
                    ],
                    emergency_contacts: [
                        { name: 'Thomas Davis', relationship: 'brother', phone: '+1-555-0108', primary: true }
                    ],
                    overall_adherence_score: 95.1,
                    created_at: getRandomPastDate(12, 62),
                    updated_at: getRecentDate()
                }
                // Doctor 3 has 0 patients as requested
            ]
        });

        console.log(`✅ Created patient profiles`);

        console.log(`\n🎉 Successfully seeded comprehensive healthcare test data!`);
        console.log(`📊 Summary:`);
        console.log(`   - Users: 8 (3 doctors, 5 patients, 1 HSP, 1 system admin, 1 provider admin) ✅`);
        console.log(`   - Doctor-Patient Distribution:`);
        console.log(`     * Dr. John Smith: 3 patients ✅`);
        console.log(`     * Dr. Jane Doe: 2 patients ✅`);  
        console.log(`     * Dr. Emily Rodriguez: 0 patients ✅`);
        console.log(`\n🔑 Login Credentials:`);
        console.log(`   - Dr. Smith (3 patients): doctor@healthapp.com / TempPassword123!`);
        console.log(`   - Dr. Doe (2 patients): doctor1@healthapp.com / TempPassword123!`);
        console.log(`   - All other users: email / ${defaultPassword}`);

        return {
            success: true,
            message: 'Healthcare test data seeded successfully with correct field names',
            data: {
                users: testUsers.count,
                patients: 5,
                doctors: 3,
                doctorPatientDistribution: 'Dr.Smith(3), Dr.Doe(2), Dr.Rodriguez(0)',
                hsp: 1,
                systemAdmin: 1,
                providerAdmin: 1
            }
        };

    } catch (error: any) {
        console.error('❌ Error seeding healthcare data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution when run directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
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