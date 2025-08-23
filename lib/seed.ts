// lib/seed.ts - Comprehensive Healthcare Test Data Seeding with Updated Schema
import { PrismaClient, AdherenceType, UserRole, UserAccountStatus, UserGender, MedicationOrganizerType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper functions for realistic dates
const getRandomPastDate = (minDaysAgo = 7, maxDaysAgo = 90): Date => {
    const now = new Date();
    const minDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
    return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};

const getRecentDate = (): Date => getRandomPastDate(1, 7);
const getTodayDate = (): Date => new Date();
const getFutureDate = (daysAhead = 1): Date => new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

// Add retry logic and table verification
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

// Generate secure password hash
async function generateSecurePasswordHash(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

export async function seedComprehensiveHealthcareData() {
    console.log('📊 Seeding comprehensive healthcare test data with updated schema...');

    try {
        await waitForTables();

        // Check if data already exists
        const existingUsers = await prisma.user.findMany({
            where: {
                email: {
                    in: [
                        'doctor@healthapp.com',
                        'doctor1@healthapp.com',
                        'patient1@healthapp.com',
                        'admin@healthapp.com'
                    ]
                }
            }
        });

        if (existingUsers.length > 0) {
            console.log(`ℹ️ Test data already exists (${existingUsers.length} users found), skipping seeding`);
            return {
                success: true,
                message: 'Test data already exists',
                users: existingUsers.length
            };
        }

        // Password setup
        const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        const basicDoctorPassword = await bcrypt.hash('TempPassword123!', 12);

        // Helper function to create user with Auth.js v5 fields and updated schema
        const createUserData = (userData: any) => ({
            ...userData,
            // Auth.js v5 required fields
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            emailVerified: userData.emailVerifiedLegacy ? userData.createdAt : null,
            image: null,
        });

        // Create 12 users with specified roles
        console.log('👥 Creating 12 users with specified roles...');
        
        const testUsers = await prisma.user.createMany({
            skipDuplicates: true,
            data: [
                // 4 Doctors
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
                }),
                createUserData({
                    id: '00000000-0000-0000-0000-000000000004',
                    email: 'doctor3@healthapp.com',
                    passwordHash: hashedPassword,
                    role: 'DOCTOR' as UserRole,
                    firstName: 'Dr. Robert',
                    lastName: 'Wilson',
                    phone: '+1-555-0004',
                    dateOfBirth: new Date('1970-07-15'),
                    gender: 'MALE' as UserGender,
                    accountStatus: 'ACTIVE' as UserAccountStatus,
                    emailVerifiedLegacy: true,
                    createdAt: getRandomPastDate(22, 82),
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
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
                    updatedAt: getRecentDate()
                }),

                // 1 Admin
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
                    updatedAt: getRecentDate()
                }),

                // 1 Provider
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
                    updatedAt: getRecentDate()
                })
            ]
        });

        console.log(`✅ Created ${testUsers.count} users`);

        // Create 1 Organization
        console.log('🏥 Creating organization...');
        const organization = await prisma.organization.upsert({
            where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
            update: {},
            create: {
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                name: 'HealthApp Medical Center',
                type: 'hospital',
                license_number: 'HC-2024-001',
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

        // Create 11 Medical Specialties
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
        const psychiatrySpec = await prisma.speciality.findFirst({ where: { name: 'Psychiatry' } });

        // Create doctor profiles
        console.log('👨‍⚕️ Creating doctor profiles...');
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
                },
                {
                    id: '00000000-0000-0000-0000-000000000044',
                    user_id: '00000000-0000-0000-0000-000000000004',
                    doctor_id: 'DR004',
                    speciality_id: psychiatrySpec?.id,
                    medical_license_number: 'MD901234',
                    years_of_experience: 20,
                    board_certifications: ['Board Certified Psychiatry', 'Child Psychiatry'],
                    consultation_fee: 220.00,
                    is_verified: true,
                    verification_date: getRandomPastDate(25, 65),
                    practice_name: 'Wilson Mental Health Center',
                    created_at: getRandomPastDate(22, 72),
                }
            ]
        });

        console.log(`✅ Created doctor profiles`);

        // Create HSP profile using correct model name
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

        // Create Provider
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
                        license_number: 'PROV-2024-001'
                    },
                    created_at: getRandomPastDate(45, 85),
                    updated_at: getRecentDate()
                }
            });
            console.log(`✅ Created provider`);
        } catch (error: any) {
            console.log(`⚠️ Skipping provider creation - table name issue`);
            provider = null;
        }

        // Create patient profiles
        console.log('👥 Creating patient profiles...');
        await prisma.patient.createMany({
            skipDuplicates: true,
            data: [
                {
                    user_id: '77777777-7777-7777-7777-777777777777',
                    patient_id: 'PAT-2024-001',
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
                    patient_id: 'PAT-2024-002',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                    height_cm: 178.0,
                    weight_kg: 82.3,
                    blood_type: 'O-',
                    primary_language: 'en',
                    allergies: [],
                    medical_history: [
                        { condition: 'Seasonal Allergies', diagnosed: '2020-05-10', status: 'active' }
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
                    patient_id: 'PAT-2024-003',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022',
                    height_cm: 162.0,
                    weight_kg: 55.2,
                    blood_type: 'B+',
                    primary_language: 'en',
                    allergies: [
                        { name: 'Latex', severity: 'mild', reaction: 'skin irritation' }
                    ],
                    medical_history: [
                        { condition: 'Anxiety', diagnosed: '2023-01-10', status: 'managed' }
                    ],
                    emergency_contacts: [
                        { name: 'David Williams', relationship: 'father', phone: '+1-555-0106', primary: true }
                    ],
                    overall_adherence_score: 78.5,
                    created_at: getRandomPastDate(16, 66),
                    updated_at: getRecentDate()
                },
                {
                    user_id: '22222222-2222-2222-2222-222222222222',
                    patient_id: 'PAT-2024-004',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022',
                    height_cm: 175.0,
                    weight_kg: 88.7,
                    blood_type: 'AB+',
                    primary_language: 'en',
                    allergies: [],
                    medical_history: [
                        { condition: 'High Cholesterol', diagnosed: '2020-08-15', status: 'controlled' },
                        { condition: 'Arthritis', diagnosed: '2022-11-20', status: 'active' }
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
                    patient_id: 'PAT-2024-005',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000033',
                    height_cm: 158.0,
                    weight_kg: 52.1,
                    blood_type: 'O+',
                    primary_language: 'en',
                    allergies: [
                        { name: 'Aspirin', severity: 'severe', reaction: 'stomach upset' }
                    ],
                    medical_history: [
                        { condition: 'Migraines', diagnosed: '2021-06-30', status: 'active' }
                    ],
                    emergency_contacts: [
                        { name: 'Thomas Davis', relationship: 'brother', phone: '+1-555-0108', primary: true }
                    ],
                    overall_adherence_score: 95.1,
                    created_at: getRandomPastDate(12, 62),
                    updated_at: getRecentDate()
                }
            ]
        });

        console.log(`✅ Created patient profiles`);

        // Create 10 comprehensive medicines
        console.log('💊 Creating 10 comprehensive medicines...');
        const medicines = [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Metformin',
                type: 'tablet',
                description: 'First-line medication for type 2 diabetes management',
                details: {
                    generic_name: 'Metformin Hydrochloride',
                    brand_names: ['Glucophage', 'Fortamet', 'Glumetza'],
                    drug_class: 'Biguanide',
                    common_dosages: ['500mg', '850mg', '1000mg'],
                    side_effects: ['Nausea', 'Diarrhea', 'Stomach upset'],
                    contraindications: ['Severe kidney disease', 'Liver disease']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Lisinopril',
                type: 'tablet',
                description: 'ACE inhibitor for high blood pressure and heart failure',
                details: {
                    generic_name: 'Lisinopril',
                    brand_names: ['Prinivil', 'Zestril'],
                    drug_class: 'ACE Inhibitor',
                    common_dosages: ['2.5mg', '5mg', '10mg', '20mg'],
                    side_effects: ['Dry cough', 'Dizziness', 'Headache'],
                    contraindications: ['Pregnancy', 'History of angioedema']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440003',
                name: 'Aspirin',
                type: 'tablet',
                description: 'Pain relief and cardiovascular protection',
                details: {
                    generic_name: 'Acetylsalicylic Acid',
                    brand_names: ['Bayer', 'Bufferin', 'Ecotrin'],
                    drug_class: 'NSAID/Antiplatelet',
                    common_dosages: ['81mg', '325mg', '500mg'],
                    side_effects: ['Stomach irritation', 'Bleeding'],
                    contraindications: ['Active bleeding', 'Severe asthma']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440004',
                name: 'Amlodipine',
                type: 'tablet',
                description: 'Calcium channel blocker for high blood pressure',
                details: {
                    generic_name: 'Amlodipine Besylate',
                    brand_names: ['Norvasc', 'Katerzia'],
                    drug_class: 'Calcium Channel Blocker',
                    common_dosages: ['2.5mg', '5mg', '10mg'],
                    side_effects: ['Ankle swelling', 'Dizziness'],
                    contraindications: ['Severe aortic stenosis']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440005',
                name: 'Simvastatin',
                type: 'tablet',
                description: 'Statin medication for high cholesterol',
                details: {
                    generic_name: 'Simvastatin',
                    brand_names: ['Zocor', 'FloLipid'],
                    drug_class: 'HMG-CoA Reductase Inhibitor',
                    common_dosages: ['5mg', '10mg', '20mg', '40mg'],
                    side_effects: ['Muscle pain', 'Liver enzyme elevation'],
                    contraindications: ['Active liver disease', 'Pregnancy']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440006',
                name: 'Omeprazole',
                type: 'capsule',
                description: 'Proton pump inhibitor for acid reflux',
                details: {
                    generic_name: 'Omeprazole',
                    brand_names: ['Prilosec', 'Zegerid'],
                    drug_class: 'Proton Pump Inhibitor',
                    common_dosages: ['10mg', '20mg', '40mg'],
                    side_effects: ['Headache', 'Nausea', 'Diarrhea'],
                    contraindications: ['Hypersensitivity to benzimidazoles']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440007',
                name: 'Albuterol',
                type: 'inhaler',
                description: 'Bronchodilator for asthma and COPD',
                details: {
                    generic_name: 'Albuterol Sulfate',
                    brand_names: ['ProAir', 'Ventolin', 'Proventil'],
                    drug_class: 'Short-Acting Beta2 Agonist',
                    common_dosages: ['90mcg/puff', '108mcg/puff'],
                    side_effects: ['Tremor', 'Nervousness'],
                    contraindications: ['Hypersensitivity to albuterol']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440008',
                name: 'Levothyroxine',
                type: 'tablet',
                description: 'Thyroid hormone replacement therapy',
                details: {
                    generic_name: 'Levothyroxine Sodium',
                    brand_names: ['Synthroid', 'Levoxyl', 'Tirosint'],
                    drug_class: 'Thyroid Hormone',
                    common_dosages: ['25mcg', '50mcg', '75mcg', '100mcg'],
                    side_effects: ['Heart palpitations', 'Weight loss'],
                    contraindications: ['Untreated adrenal insufficiency']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440009',
                name: 'Sertraline',
                type: 'tablet',
                description: 'SSRI antidepressant for depression and anxiety',
                details: {
                    generic_name: 'Sertraline Hydrochloride',
                    brand_names: ['Zoloft', 'Lustral'],
                    drug_class: 'SSRI',
                    common_dosages: ['25mg', '50mg', '100mg'],
                    side_effects: ['Nausea', 'Sexual dysfunction'],
                    contraindications: ['MAO inhibitor use']
                }
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440010',
                name: 'Ibuprofen',
                type: 'tablet',
                description: 'Anti-inflammatory pain and fever reducer',
                details: {
                    generic_name: 'Ibuprofen',
                    brand_names: ['Advil', 'Motrin', 'Nuprin'],
                    drug_class: 'NSAID',
                    common_dosages: ['200mg', '400mg', '600mg'],
                    side_effects: ['Stomach upset', 'Kidney problems'],
                    contraindications: ['Heart disease', 'Active ulcers']
                }
            }
        ];

        for (const med of medicines) {
            await prisma.medicine.upsert({
                where: { id: med.id },
                update: {},
                create: {
                    id: med.id,
                    name: med.name,
                    type: med.type,
                    description: med.description,
                    details: med.details,
                    public_medicine: true,
                    created_at: getRandomPastDate(30, 60),
                    updated_at: getRecentDate()
                }
            });
        }

        console.log(`✅ Created ${medicines.length} medicines`);

        // Create 4 vital templates
        console.log('📊 Creating 4 vital templates...');
        const vitalTemplates = [
            { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Blood Pressure', unit: 'mmHg' },
            { id: '550e8400-e29b-41d4-a716-446655440021', name: 'Heart Rate', unit: 'bpm' },
            { id: '550e8400-e29b-41d4-a716-446655440022', name: 'Weight', unit: 'kg' },
            { id: '550e8400-e29b-41d4-a716-446655440023', name: 'Blood Glucose', unit: 'mg/dL' }
        ];

        for (const template of vitalTemplates) {
            await prisma.vitalTemplates.upsert({
                where: { id: template.id },
                update: {},
                create: {
                    id: template.id,
                    name: template.name,
                    unit: template.unit,
                    created_at: getRandomPastDate(40, 70),
                    updated_at: getRecentDate()
                }
            });
        }

        console.log(`✅ Created ${vitalTemplates.length} vital templates`);

        // Create 5 symptoms/conditions
        console.log('🩺 Creating 5 symptoms/conditions...');
        try {
            const symptomsData = [
                {
                    id: '550e8400-e29b-41d4-a716-446655440030',
                    diagnosis_name: 'Type 2 Diabetes',
                    symptoms: ['Excessive thirst', 'Frequent urination', 'Unexplained weight loss', 'Increased hunger', 'Fatigue'],
                    category: 'Endocrine',
                    severity_indicators: {
                        mild: ['Mild thirst', 'Occasional fatigue'],
                        moderate: ['Increased hunger', 'Blurred vision'],
                        severe: ['Unexplained weight loss', 'Frequent urination']
                    },
                    common_age_groups: ['adults', 'elderly'],
                    gender_specific: 'both',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440031',
                    diagnosis_name: 'Hypertension',
                    symptoms: ['Headaches', 'Dizziness', 'Chest pain', 'Nosebleeds', 'Shortness of breath'],
                    category: 'Cardiovascular',
                    severity_indicators: {
                        mild: ['Occasional headaches'],
                        moderate: ['Regular headaches', 'Chest discomfort'],
                        severe: ['Severe headaches', 'Chest pain', 'Shortness of breath']
                    },
                    common_age_groups: ['adults', 'elderly'],
                    gender_specific: 'both',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440032',
                    diagnosis_name: 'Asthma',
                    symptoms: ['Wheezing', 'Coughing', 'Chest tightness', 'Shortness of breath'],
                    category: 'Respiratory',
                    severity_indicators: {
                        mild: ['Occasional wheezing'],
                        moderate: ['Regular shortness of breath'],
                        severe: ['Difficulty speaking', 'Severe breathing problems']
                    },
                    common_age_groups: ['children', 'adults'],
                    gender_specific: 'both',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440033',
                    diagnosis_name: 'Depression',
                    symptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Sleep disturbances', 'Appetite changes'],
                    category: 'Mental Health',
                    severity_indicators: {
                        mild: ['Occasional sadness'],
                        moderate: ['Regular mood changes'],
                        severe: ['Persistent hopelessness', 'Thoughts of self-harm']
                    },
                    common_age_groups: ['adolescents', 'adults', 'elderly'],
                    gender_specific: 'both',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440034',
                    diagnosis_name: 'Anxiety Disorder',
                    symptoms: ['Excessive worry', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Irritability', 'Muscle tension'],
                    category: 'Mental Health',
                    severity_indicators: {
                        mild: ['Occasional worry'],
                        moderate: ['Regular anxiety'],
                        severe: ['Panic attacks', 'Unable to perform daily activities']
                    },
                    common_age_groups: ['adolescents', 'adults'],
                    gender_specific: 'both',
                    is_active: true
                }
            ];

            for (const symptom of symptomsData) {
                await prisma.symptomsDatabase.upsert({
                    where: { id: symptom.id },
                    update: {},
                    create: {
                        ...symptom,
                        created_at: getRandomPastDate(35, 65),
                        updated_at: getRecentDate()
                    }
                });
            }

            console.log(`✅ Created ${symptomsData.length} symptoms/conditions`);
        } catch (error: any) {
            console.log(`⚠️ Skipping symptoms database creation - table issue: ${error.message}`);
        }

        // Create 5 treatments
        console.log('💉 Creating 5 treatments...');
        try {
            const treatmentsData = [
                {
                    id: '550e8400-e29b-41d4-a716-446655440040',
                    treatment_name: 'Metformin Therapy',
                    treatment_type: 'medication',
                    description: 'First-line medication for Type 2 diabetes management',
                    applicable_conditions: ['Type 2 Diabetes', 'Pre-diabetes'],
                    duration: 'Long-term',
                    frequency: 'Twice daily with meals',
                    dosage_info: {
                        initial_dose: '500mg twice daily',
                        maximum_dose: '2000mg daily',
                        titration: 'Increase by 500mg weekly as tolerated'
                    },
                    category: 'Antidiabetic',
                    severity_level: 'moderate',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440041',
                    treatment_name: 'ACE Inhibitor Therapy',
                    treatment_type: 'medication',
                    description: 'First-line treatment for hypertension',
                    applicable_conditions: ['Hypertension', 'Heart Failure'],
                    duration: 'Long-term',
                    frequency: 'Once daily',
                    dosage_info: {
                        initial_dose: '5mg daily',
                        maximum_dose: '40mg daily',
                        titration: 'Increase every 1-2 weeks'
                    },
                    category: 'Cardiovascular',
                    severity_level: 'moderate',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440042',
                    treatment_name: 'Inhaled Bronchodilator Therapy',
                    treatment_type: 'medication',
                    description: 'Short-acting beta2 agonist for asthma',
                    applicable_conditions: ['Asthma', 'COPD'],
                    duration: 'As needed',
                    frequency: '2 puffs every 4-6 hours as needed',
                    dosage_info: {
                        initial_dose: '90mcg (2 puffs) as needed',
                        maximum_dose: '12 puffs per day'
                    },
                    category: 'Respiratory',
                    severity_level: 'mild_to_moderate',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440043',
                    treatment_name: 'Cognitive Behavioral Therapy',
                    treatment_type: 'therapy',
                    description: 'Evidence-based psychotherapy for depression and anxiety',
                    applicable_conditions: ['Depression', 'Anxiety Disorder', 'PTSD'],
                    duration: '12-20 sessions over 3-6 months',
                    frequency: 'Weekly sessions initially',
                    dosage_info: {
                        initial_dose: '45-50 minute sessions weekly',
                        titration: 'Adjust frequency based on progress'
                    },
                    category: 'Mental Health',
                    severity_level: 'mild_to_severe',
                    is_active: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440044',
                    treatment_name: 'Lifestyle Modification Program',
                    treatment_type: 'lifestyle',
                    description: 'Comprehensive diet and exercise program',
                    applicable_conditions: ['Type 2 Diabetes', 'Hypertension', 'Obesity'],
                    duration: 'Ongoing lifestyle changes',
                    frequency: 'Daily adherence',
                    dosage_info: {
                        initial_dose: '30 minutes moderate exercise, 5 days/week',
                        maximum_dose: '60+ minutes daily as tolerated'
                    },
                    category: 'Lifestyle',
                    severity_level: 'all_levels',
                    is_active: true
                }
            ];

            for (const treatment of treatmentsData) {
                await prisma.treatmentDatabase.upsert({
                    where: { id: treatment.id },
                    update: {},
                    create: {
                        ...treatment,
                        created_at: getRandomPastDate(30, 60),
                        updated_at: getRecentDate()
                    }
                });
            }

            console.log(`✅ Created ${treatmentsData.length} treatments`);
        } catch (error: any) {
            console.log(`⚠️ Skipping treatments database creation - table issue: ${error.message}`);
        }

        // Create 3 appointments (today + future)
        console.log('📅 Creating 3 appointments...');
        const createdPatients = await prisma.patient.findMany({
            select: { id: true },
            take: 3,
            orderBy: { created_at: 'asc' }
        });

        if (createdPatients.length >= 3) {
            const appointmentsData = [
                {
                    id: '00000000-0000-0000-0000-000000000301',
                    doctor_id: '00000000-0000-0000-0000-000000000011',
                    patient_id: createdPatients[0].id,
                    start_date: getTodayDate(),
                    start_time: new Date(new Date().setHours(9, 0, 0, 0)),
                    end_time: new Date(new Date().setHours(9, 30, 0, 0)),
                    description: 'Routine checkup and medication review',
                    created_at: getRecentDate(),
                },
                {
                    id: '00000000-0000-0000-0000-000000000302',
                    doctor_id: '00000000-0000-0000-0000-000000000011',
                    patient_id: createdPatients[1].id,
                    start_date: getTodayDate(),
                    start_time: new Date(new Date().setHours(14, 0, 0, 0)),
                    end_time: new Date(new Date().setHours(14, 30, 0, 0)),
                    description: 'Follow-up for hypertension management',
                    created_at: getRecentDate(),
                },
                {
                    id: '00000000-0000-0000-0000-000000000303',
                    doctor_id: '00000000-0000-0000-0000-000000000022',
                    patient_id: createdPatients[2].id,
                    start_date: getFutureDate(1),
                    start_time: new Date(getFutureDate(1).setHours(10, 0, 0, 0)),
                    end_time: new Date(getFutureDate(1).setHours(10, 30, 0, 0)),
                    description: 'Diabetes management consultation',
                    created_at: getRecentDate(),
                }
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
                {
                    id: '00000000-0000-0000-0000-000000000401',
                    patient_id: createdPatients[0].id,
                    adherence_type: 'MEDICATION' as AdherenceType,
                    due_at: getRandomPastDate(1, 7),
                    recorded_at: getRandomPastDate(1, 7),
                    is_completed: true,
                    is_missed: false,
                    created_at: getRandomPastDate(1, 7),
                    updated_at: getRecentDate()
                },
                {
                    id: '00000000-0000-0000-0000-000000000402',
                    patient_id: createdPatients[1].id,
                    adherence_type: 'VITAL_CHECK' as AdherenceType,
                    due_at: getRandomPastDate(2, 8),
                    recorded_at: getRandomPastDate(2, 8),
                    is_completed: true,
                    is_missed: false,
                    created_at: getRandomPastDate(2, 8),
                    updated_at: getRecentDate()
                },
                {
                    id: '00000000-0000-0000-0000-000000000403',
                    patient_id: createdPatients.length >= 3 ? createdPatients[2].id : createdPatients[0].id,
                    adherence_type: 'APPOINTMENT' as AdherenceType,
                    due_at: getRandomPastDate(3, 9),
                    recorded_at: null,
                    is_completed: false,
                    is_missed: true,
                    created_at: getRandomPastDate(3, 9),
                    updated_at: getRecentDate()
                }
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
        console.log(`   - Users: 12 (5 patients, 4 doctors, 1 HSP, 1 admin, 1 provider)`);
        console.log(`   - Organization: 1 ✅`);
        console.log(`   - Medical Specialties: 11 ✅`);
        console.log(`   - Medicines: 10 ✅`);
        console.log(`   - Vital Templates: 4 ✅`);
        console.log(`   - Symptoms/Conditions: 5 ✅`);
        console.log(`   - Treatments: 5 ✅`);
        console.log(`   - Appointments: 3 ✅`);
        console.log(`   - Adherence Records: 3 ✅`);
        console.log(`   - Provider: ${provider ? '✅' : '⚠️'}`);
        console.log(`   - Basic doctor credentials: doctor@healthapp.com / TempPassword123!`);
        console.log(`   - Basic doctor credentials: doctor1@healthapp.com / TempPassword123!`);
        console.log(`   - Other test credentials: email/${defaultPassword} for all other users`);

        return {
            success: true,
            message: 'Comprehensive healthcare test data seeded successfully',
            data: {
                users: 12,
                patients: 5,
                doctors: 4,
                organizations: 1,
                specialties: 11,
                medicines: 10,
                vitalTemplates: 4,
                symptomsConditions: 5,
                treatments: 5,
                appointments: 3,
                adherenceRecords: 3,
                provider: provider ? 1 : 0
            }
        };

    } catch (error) {
        console.error('❌ Error seeding healthcare data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
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