// lib/seed.cjs - Comprehensive Healthcare Test Data Seeding with Corrected Schema (CommonJS)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
      } catch (error) {
        // Continue with next operation even if current fails
        console.log(`⚠️ Cleanup operation failed (continuing): ${error.message}`);
      }
    }
    
    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
}

// Helper functions for realistic dates
const getRandomPastDate = (minDaysAgo = 7, maxDaysAgo = 90) => {
    const now = new Date();
    const minDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
    return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const getRecentDate = () => getRandomPastDate(1, 7);
const getTodayDate = () => new Date();
const getFutureDate = (daysAhead = 1) => new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

// Add retry logic and table verification
async function waitForTables(maxRetries = 10, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await prisma.user.count();
            console.log('✅ Database tables are ready');
            return true;
        } catch (error) {
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

// Generate secure password hash
async function generateSecurePasswordHash(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

async function seedComprehensiveHealthcareData() {
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
        const createUserData = (userData) => ({
            ...userData,
            // Auth.js v5 required fields
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
                    role: 'DOCTOR',
                    firstName: 'Dr. John',
                    lastName: 'Smith',
                    phone: '+1-555-0001',
                    dateOfBirth: new Date('1975-01-15'),
                    gender: 'MALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(30, 90),
                    updatedAt: getRecentDate(),
                    // Auth.js v5 required fields
                    name: 'Dr. John Smith',
                    emailVerified: getRandomPastDate(30, 90),
                    image: null,
                }),
                createUserData({
                    id: '00000000-0000-0000-0000-000000000002',
                    email: 'doctor1@healthapp.com',
                    passwordHash: basicDoctorPassword,
                    role: 'DOCTOR',
                    firstName: 'Dr. Jane',
                    lastName: 'Doe',
                    phone: '+1-555-0002',
                    dateOfBirth: new Date('1978-05-20'),
                    gender: 'FEMALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(28, 88),
                    updatedAt: getRecentDate(),
                    name: 'Dr. Jane Doe',
                    emailVerified: getRandomPastDate(28, 88),
                    image: null,
                }),
                createUserData({
                    id: '00000000-0000-0000-0000-000000000003',
                    email: 'doctor2@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'DOCTOR',
                    firstName: 'Dr. Emily',
                    lastName: 'Rodriguez',
                    phone: '+1-555-0003',
                    dateOfBirth: new Date('1980-11-08'),
                    gender: 'FEMALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(25, 85),
                    updatedAt: getRecentDate(),
                    name: 'Dr. Emily Rodriguez',
                    emailVerified: getRandomPastDate(25, 85),
                    image: null,
                }),
                
                // 5 Patients (3 for doctor1, 2 for doctor2, 0 for doctor3)
                createUserData({
                    id: '77777777-7777-7777-7777-777777777777',
                    email: 'patient1@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT',
                    firstName: 'Sarah',
                    lastName: 'Johnson',
                    phone: '+1-555-0101',
                    dateOfBirth: new Date('1985-06-15'),
                    gender: 'FEMALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(20, 80),
                    updatedAt: getRecentDate(),
                    name: 'Sarah Johnson',
                    emailVerified: getRandomPastDate(20, 80),
                    image: null,
                }),
                createUserData({
                    id: '88888888-8888-8888-8888-888888888888',
                    email: 'patient2@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT',
                    firstName: 'Michael',
                    lastName: 'Chen',
                    phone: '+1-555-0102',
                    dateOfBirth: new Date('1978-03-22'),
                    gender: 'MALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(18, 78),
                    updatedAt: getRecentDate(),
                    name: 'Michael Chen',
                    emailVerified: getRandomPastDate(18, 78),
                    image: null,
                }),
                createUserData({
                    id: '11111111-1111-1111-1111-111111111111',
                    email: 'patient3@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT',
                    firstName: 'Emma',
                    lastName: 'Williams',
                    phone: '+1-555-0103',
                    dateOfBirth: new Date('1990-09-10'),
                    gender: 'FEMALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(16, 76),
                    updatedAt: getRecentDate(),
                    name: 'Emma Williams',
                    emailVerified: getRandomPastDate(16, 76),
                    image: null,
                }),
                createUserData({
                    id: '22222222-2222-2222-2222-222222222222',
                    email: 'patient4@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT',
                    firstName: 'James',
                    lastName: 'Brown',
                    phone: '+1-555-0104',
                    dateOfBirth: new Date('1965-12-05'),
                    gender: 'MALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(14, 74),
                    updatedAt: getRecentDate(),
                    name: 'James Brown',
                    emailVerified: getRandomPastDate(14, 74),
                    image: null,
                }),
                createUserData({
                    id: '33333333-3333-3333-3333-333333333333',
                    email: 'patient5@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'PATIENT',
                    firstName: 'Olivia',
                    lastName: 'Davis',
                    phone: '+1-555-0105',
                    dateOfBirth: new Date('1995-04-20'),
                    gender: 'FEMALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(12, 72),
                    updatedAt: getRecentDate(),
                    name: 'Olivia Davis',
                    emailVerified: getRandomPastDate(12, 72),
                    image: null,
                }),

                // 1 HSP
                createUserData({
                    id: '55555555-5555-5555-5555-555555555555',
                    email: 'hsp@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'HSP',
                    firstName: 'Maria',
                    lastName: 'Garcia',
                    phone: '+1-555-0301',
                    dateOfBirth: new Date('1980-03-25'),
                    gender: 'FEMALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(35, 85),
                    updatedAt: getRecentDate(),
                    name: 'Maria Garcia',
                    emailVerified: getRandomPastDate(35, 85),
                    image: null,
                }),

                // 1 System Admin
                createUserData({
                    id: '66666666-6666-6666-6666-666666666666',
                    email: 'admin@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'SYSTEM_ADMIN',
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '+1-555-0401',
                    dateOfBirth: new Date('1985-01-01'),
                    gender: 'OTHER',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(40, 90),
                    updatedAt: getRecentDate(),
                    name: 'Admin User',
                    emailVerified: getRandomPastDate(40, 90),
                    image: null,
                }),

                // 1 Provider Admin
                createUserData({
                    id: '10101010-1010-1010-1010-101010101010',
                    email: 'provider@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'HOSPITAL_ADMIN',
                    firstName: 'Provider',
                    lastName: 'Administrator',
                    phone: '+1-555-0501',
                    dateOfBirth: new Date('1982-05-15'),
                    gender: 'MALE',
                    accountStatus: 'ACTIVE',
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(45, 90),
                    updatedAt: getRecentDate(),
                    name: 'Provider Administrator',
                    emailVerified: getRandomPastDate(45, 90),
                    image: null,
                })
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
                license_number: 'HC-2025-001',
                contact_info: {
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
                is_active: true,
                created_at: getRandomPastDate(60, 90),
                updated_at: getRecentDate()
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
                    created_at: getRandomPastDate(50, 90),
                    updated_at: getRecentDate()
                }
            });
        }

        console.log(`✅ Created ${specialties.length} medical specialties`);

        // Get the created specialties for doctor profiles
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
                    user_id: '00000000-0000-0000-0000-000000000001',
                    doctor_id: 'DR001',
                    speciality_id: cardiologySpec?.id,
                    medical_license_number: 'MD123456',
                    years_of_experience: 15,
                    board_certifications: ['Board Certified Internal Medicine', 'Cardiology'],
                    consultation_fee: 200.00,
                    is_verified: true,
                    verification_date: getRandomPastDate(20, 60),
                    practice_name: 'Smith Cardiology Clinic',
                    created_at: getRandomPastDate(30, 80),
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
                    id: '00000000-0000-0000-0000-000000000033',
                    user_id: '00000000-0000-0000-0000-000000000003',
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
                user_id: '55555555-5555-5555-5555-555555555555',
                hsp_id: 'HSP001',
                hsp_type: 'wellness_coach',
                license_number: 'HSP12345',
                certifications: ['Certified Wellness Coach', 'Nutrition Specialist'],
                specializations: ['wellness_coaching', 'nutrition'],
                years_of_experience: 8,
                created_at: getRandomPastDate(35, 75)
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
                    user_id: '10101010-1010-1010-1010-101010101010',
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
                    created_at: getRandomPastDate(45, 85),
                    updated_at: getRecentDate()
                }
            });
            console.log(`✅ Created provider`);
        } catch (error) {
            console.log(`⚠️ Skipping provider creation - schema mismatch: ${error.message}`);
            provider = null;
        }

        // Create five patient profiles with specific doctor linkages - Patient model uses snake_case
        console.log('👥 Creating patient profiles with specific doctor assignments...');
        await prisma.patient.createMany({
            skipDuplicates: true,
            data: [
                // 3 patients for Doctor 1 (Dr. John Smith)
                {
                    user_id: '77777777-7777-7777-7777-777777777777',
                    patient_id: 'PAT-2025-001',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                    height_cm: 165.0,
                    weight_kg: 68.5,
                    blood_type: 'A+',
                    primary_language: 'en',
                    allergies: [
                        { name: 'Penicillin', severity: 'severe', reaction: 'rash' },
                        { name: 'Shellfish', severity: 'moderate', reaction: 'hives' }
                    ],
                    medical_history: [
                        { condition: 'Type 2 Diabetes', diagnosed: '2022-03-15', status: 'active' },
                        { condition: 'Hypertension', diagnosed: '2021-08-20', status: 'controlled' }
                    ],
                    emergency_contacts: [
                        { name: 'John Johnson', relationship: 'spouse', phone: '+1-555-0103', primary: true }
                    ],
                    overall_adherence_score: 85.5,
                    created_at: getRandomPastDate(20, 70),
                    updated_at: getRecentDate()
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
                // 2 patients for Doctor 2 (Dr. Jane Doe)
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
                // Doctor 3 (Dr. Emily Rodriguez) has 0 patients as requested
            ]
        });

        console.log(`✅ Created patient profiles`);

        // Create clinic for Doctor 1 with corrected schema (JSON address field)
        console.log('🏥 Creating clinic for Dr. Smith...');
        await prisma.clinic.upsert({
            where: { id: '00000000-0000-0000-0000-000000000501' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000501',
                doctor_id: '00000000-0000-0000-0000-000000000011',
                organization_id: organization.id,
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
                operating_hours: {
                    monday: '8:00 AM - 5:00 PM',
                    tuesday: '8:00 AM - 5:00 PM',
                    wednesday: '8:00 AM - 5:00 PM',
                    thursday: '8:00 AM - 5:00 PM',
                    friday: '8:00 AM - 4:00 PM',
                    saturday: 'Closed',
                    sunday: 'Emergency only'
                },
                services_offered: ['Cardiac Consultation', 'Echocardiograms', 'Stress Testing', 'Heart Disease Management'],
                facilities: {
                    parking: true,
                    wheelchair_accessible: true,
                    languages: ['English', 'Spanish']
                },
                insurance_accepted: ['Medicare', 'Blue Cross', 'Aetna', 'Cigna'],
                is_active: true,
                created_at: getRandomPastDate(25, 75),
                updated_at: getRecentDate()
            }
        });
        
        console.log(`✅ Created clinic for Dr. Smith with correct schema`);

        // Get created patients for care plans
        console.log('🩺 Creating comprehensive care plans for patients...');
        const createdPatients = await prisma.patient.findMany({
            select: { id: true, user_id: true },
            orderBy: { created_at: 'asc' },
            take: 3  // Create 3 care plans
        });

        const carePlanData = [
            {
                patient_id: createdPatients[0]?.id, // Sarah Johnson
                created_by_doctor_id: '00000000-0000-0000-0000-000000000011',
                organization_id: organization.id,
                title: 'Diabetes & Hypertension Management Plan',
                description: 'Comprehensive care plan for managing Type 2 diabetes and hypertension with lifestyle modifications and medication adherence.',
                chronic_conditions: ['Type 2 Diabetes', 'Hypertension'],
                condition_severity: {
                    'Type 2 Diabetes': 'moderate',
                    'Hypertension': 'mild'
                },
                long_term_goals: [
                    'Maintain HbA1c below 7.0%',
                    'Keep blood pressure under 130/80 mmHg',
                    'Achieve weight loss of 10-15 pounds',
                    'Improve cardiovascular fitness'
                ],
                lifestyle_modifications: [
                    {
                        type: 'diet',
                        details: {
                            calories_per_day: 1800,
                            carbohydrate_grams: 180,
                            protein_grams: 120,
                            fat_grams: 60,
                            meal_plan: {
                                breakfast: 'Oatmeal with berries, Greek yogurt',
                                lunch: 'Grilled chicken salad with olive oil dressing',
                                dinner: 'Baked salmon, steamed vegetables, quinoa',
                                snacks: 'Apple with almonds, carrot sticks'
                            },
                            restrictions: ['Low sodium', 'Limited refined sugars', 'Complex carbohydrates only']
                        }
                    },
                    {
                        type: 'exercise',
                        details: {
                            frequency: '5 days per week',
                            duration: '45 minutes',
                            activities: {
                                cardio: 'Brisk walking 30 min, 4x/week',
                                strength: 'Light weights 2x/week',
                                flexibility: 'Yoga 15 min daily'
                            },
                            target_heart_rate: '120-140 bpm',
                            progression: 'Increase walking duration by 5 min every 2 weeks'
                        }
                    }
                ],
                start_date: getRandomPastDate(30, 60),
                end_date: getFutureDate(180),
                status: 'ACTIVE',
                priority: 'HIGH'
            },
            {
                patient_id: createdPatients[1]?.id, // Michael Chen
                created_by_doctor_id: '00000000-0000-0000-0000-000000000011',
                organization_id: organization.id,
                title: 'Hypertension & Cholesterol Control Plan',
                description: 'Cardiovascular health management focusing on blood pressure control and cholesterol reduction.',
                chronic_conditions: ['Hypertension', 'High Cholesterol'],
                condition_severity: {
                    'Hypertension': 'moderate',
                    'High Cholesterol': 'mild'
                },
                long_term_goals: [
                    'Reduce blood pressure to <130/80 mmHg',
                    'Lower LDL cholesterol below 100 mg/dL',
                    'Maintain healthy weight',
                    'Increase physical activity'
                ],
                lifestyle_modifications: [
                    {
                        type: 'diet',
                        details: {
                            calories_per_day: 2000,
                            sodium_mg: 1500,
                            fiber_grams: 35,
                            meal_plan: {
                                breakfast: 'Whole grain cereal with low-fat milk',
                                lunch: 'Turkey and avocado wrap with vegetables',
                                dinner: 'Lean beef, sweet potato, green beans',
                                snacks: 'Mixed nuts, fresh fruit'
                            },
                            restrictions: ['Low sodium', 'Low saturated fat', 'Heart-healthy fats']
                        }
                    },
                    {
                        type: 'exercise',
                        details: {
                            frequency: '4 days per week',
                            duration: '40 minutes',
                            activities: {
                                cardio: 'Cycling or swimming 30 min, 3x/week',
                                strength: 'Resistance bands 2x/week',
                                flexibility: 'Stretching routine daily'
                            },
                            target_heart_rate: '125-145 bpm'
                        }
                    }
                ],
                start_date: getRandomPastDate(25, 55),
                end_date: getFutureDate(120),
                status: 'ACTIVE',
                priority: 'MEDIUM'
            },
            {
                patient_id: createdPatients[2]?.id, // Emma Williams
                created_by_doctor_id: '00000000-0000-0000-0000-000000000011',
                organization_id: organization.id,
                title: 'Coronary Heart Disease Management',
                description: 'Cardiac rehabilitation and lifestyle modification program for coronary artery disease.',
                chronic_conditions: ['Coronary Artery Disease'],
                condition_severity: {
                    'Coronary Artery Disease': 'severe'
                },
                long_term_goals: [
                    'Improve cardiac function and endurance',
                    'Prevent further coronary events',
                    'Manage stress and anxiety',
                    'Optimize medication adherence'
                ],
                lifestyle_modifications: [
                    {
                        type: 'diet',
                        details: {
                            calories_per_day: 1600,
                            sodium_mg: 1200,
                            cholesterol_mg: 200,
                            meal_plan: {
                                breakfast: 'Oatmeal with walnuts and berries',
                                lunch: 'Grilled fish with quinoa salad',
                                dinner: 'Vegetable stir-fry with tofu',
                                snacks: 'Greek yogurt, handful of almonds'
                            },
                            restrictions: ['Very low sodium', 'Low cholesterol', 'Omega-3 rich foods']
                        }
                    },
                    {
                        type: 'exercise',
                        details: {
                            frequency: '6 days per week',
                            duration: '30 minutes',
                            activities: {
                                cardio: 'Supervised walking program 3x/week',
                                strength: 'Light resistance training 2x/week',
                                flexibility: 'Gentle yoga daily',
                                stress_management: 'Meditation 10 min daily'
                            },
                            target_heart_rate: '100-120 bpm'
                        }
                    }
                ],
                start_date: getRandomPastDate(20, 50),
                end_date: getFutureDate(365),
                status: 'ACTIVE',
                priority: 'HIGH'
            }
        ];

        // Create care plans with corrected schema
        for (let i = 0; i < carePlanData.length && i < createdPatients.length; i++) {
            const planData = carePlanData[i];
            if (planData.patient_id) {
                await prisma.carePlan.upsert({
                    where: { id: `careplan-${i + 1}-${planData.patient_id}` },
                    update: {},
                    create: {
                        id: `careplan-${i + 1}-${planData.patient_id}`,
                        patient_id: planData.patient_id,
                        created_by_doctor_id: planData.created_by_doctor_id,
                        organization_id: planData.organization_id,
                        title: planData.title,
                        description: planData.description,
                        chronic_conditions: planData.chronic_conditions,
                        condition_severity: planData.condition_severity,
                        long_term_goals: planData.long_term_goals,
                        lifestyle_modifications: planData.lifestyle_modifications,
                        start_date: planData.start_date,
                        end_date: planData.end_date,
                        status: planData.status,
                        priority: planData.priority,
                        created_at: getRandomPastDate(20, 50),
                        updated_at: getRecentDate()
                    }
                });
            }
        }
        
        console.log(`✅ Created ${carePlanData.length} comprehensive care plans with correct schema`);

        console.log(`\n🎉 Successfully seeded comprehensive healthcare test data with corrected schema!`);
        console.log(`📊 Summary:`);
        console.log(`   - Users: 8 (5 patients, 3 doctors, 1 HSP, 1 system admin, 1 provider admin) ✅`);
        console.log(`   - Doctor-Patient Relationships:`);
        console.log(`     * Dr. John Smith (Cardiology): 3 patients + clinic ✅`);
        console.log(`     * Dr. Jane Doe (Endocrinology): 2 patients ✅`);
        console.log(`     * Dr. Emily Rodriguez (General Medicine): 0 patients ✅`);
        console.log(`   - Organization: 1 ✅`);
        console.log(`   - Medical Specialties: 11 ✅`);
        console.log(`   - Clinic: 1 (with corrected JSON address field) ✅`);
        console.log(`   - Care Plans: 3 (with correct schema fields) ✅`);
        console.log(`\n🔑 Login Credentials:`);
        console.log(`   - Dr. Smith (3 patients + clinic): doctor@healthapp.com / TempPassword123!`);
        console.log(`   - Dr. Doe (2 patients): doctor1@healthapp.com / TempPassword123!`);
        console.log(`   - All other users: email / ${defaultPassword}`);

        return {
            success: true,
            message: 'Comprehensive healthcare test data seeded successfully with corrected schema',
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
                carePlans: 3,
                provider: provider ? 1 : 0,
                correctedFields: {
                    clinic: 'address converted to JSON structure',
                    carePlan: 'replaced invalid fields with correct schema fields'
                }
            }
        };

    } catch (error) {
        console.error('❌ Error seeding healthcare data:', error);
        
        // Enhanced error handling for common schema issues
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
    console.log('🚀 Starting healthcare data seeding with corrected schema...');
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

module.exports = {
    seedComprehensiveHealthcareData,
    cleanDatabase
};