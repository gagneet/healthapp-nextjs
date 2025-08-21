"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedComprehensiveHealthcareData = seedComprehensiveHealthcareData;
exports.DANGEROUSLY_CLEAR_ALL_DATA_TABLES = DANGEROUSLY_CLEAR_ALL_DATA_TABLES;
// lib/seed.ts - Prisma-based seeding for comprehensive healthcare test data
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// Generate secure password hash
async function generateSecurePasswordHash(password) {
    const saltRounds = 12; // Higher security for production
    return await bcrypt.hash(password, saltRounds);
}
async function seedComprehensiveHealthcareData() {
    console.log('📊 Seeding comprehensive healthcare test data...');
    try {
        // Check if data already exists
        const existingUsers = await prisma.user.findMany({
            where: {
                email: {
                    in: [
                        'doctor@healthapp.com',
                        'doctor1@healthapp.com',
                        'patient1@healthapp.com',
                        'patient2@healthapp.com',
                        'patient3@healthapp.com',
                        'patient4@healthapp.com',
                        'patient5@healthapp.com',
                        'doctor2@healthapp.com',
                        'hsp@healthapp.com',
                        'admin@healthapp.com',
                        'provider@healthapp.com'
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
        // Use environment variable or default test password for consistency
        const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        // Also create basic doctor accounts that deployment expects
        const basicDoctorPassword = await bcrypt.hash('TempPassword123!', 12);
        // Helper function to create user with Auth.js v5 fields
        const createUserData = (userData) => ({
            ...userData,
            // Auth.js v5 required fields
            name: `${userData.first_name} ${userData.last_name}`.trim(),
            emailVerified: userData.email_verified ? userData.created_at : null,
            image: null,
        });
        // Create test users with all roles (idempotent)
        const testUsers = await prisma.user.createMany({
            skipDuplicates: true,
            data: [
                // Basic doctor accounts needed for deployment
                createUserData({
                    id: '00000000-0000-0000-0000-000000000001',
                    email: 'doctor@healthapp.com',
                    password_hash: basicDoctorPassword,
                    role: 'DOCTOR',
                    first_name: 'Dr. John',
                    last_name: 'Smith',
                    phone: '+1-555-0001',
                    date_of_birth: new Date('1975-01-15'),
                    gender: 'MALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                createUserData({
                    id: '00000000-0000-0000-0000-000000000002',
                    email: 'doctor1@healthapp.com',
                    password_hash: basicDoctorPassword,
                    role: 'DOCTOR',
                    first_name: 'Dr. Jane',
                    last_name: 'Doe',
                    phone: '+1-555-0002',
                    date_of_birth: new Date('1978-05-20'),
                    gender: 'FEMALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                // 5 Patients
                createUserData({
                    id: '77777777-7777-7777-7777-777777777777',
                    email: 'patient1@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    first_name: 'Sarah',
                    last_name: 'Johnson',
                    phone: '+1-555-0101',
                    date_of_birth: new Date('1985-06-15'),
                    gender: 'FEMALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                createUserData({
                    id: '88888888-8888-8888-8888-888888888888',
                    email: 'patient2@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    first_name: 'Michael',
                    last_name: 'Chen',
                    phone: '+1-555-0102',
                    date_of_birth: new Date('1978-03-22'),
                    gender: 'MALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-02'),
                    updated_at: new Date()
                }),
                createUserData({
                    id: '11111111-1111-1111-1111-111111111111',
                    email: 'patient3@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    first_name: 'Emma',
                    last_name: 'Williams',
                    phone: '+1-555-0103',
                    date_of_birth: new Date('1990-09-10'),
                    gender: 'FEMALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-03'),
                    updated_at: new Date()
                }),
                createUserData({
                    id: '22222222-2222-2222-2222-222222222222',
                    email: 'patient4@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    first_name: 'James',
                    last_name: 'Brown',
                    phone: '+1-555-0104',
                    date_of_birth: new Date('1965-12-05'),
                    gender: 'MALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-04'),
                    updated_at: new Date()
                }),
                createUserData({
                    id: '33333333-3333-3333-3333-333333333333',
                    email: 'patient5@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    first_name: 'Olivia',
                    last_name: 'Davis',
                    phone: '+1-555-0105',
                    date_of_birth: new Date('1995-04-20'),
                    gender: 'FEMALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-05'),
                    updated_at: new Date()
                }),
                // 2 Additional Doctors
                createUserData({
                    id: '99999999-9999-9999-9999-999999999999',
                    email: 'doctor2@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'DOCTOR',
                    first_name: 'Dr. Emily',
                    last_name: 'Rodriguez',
                    phone: '+1-555-0201',
                    date_of_birth: new Date('1975-11-08'),
                    gender: 'FEMALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                createUserData({
                    id: '44444444-4444-4444-4444-444444444444',
                    email: 'doctor3@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'DOCTOR',
                    first_name: 'Dr. Robert',
                    last_name: 'Smith',
                    phone: '+1-555-0202',
                    date_of_birth: new Date('1970-07-15'),
                    gender: 'MALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                // HSP
                createUserData({
                    id: '55555555-5555-5555-5555-555555555555',
                    email: 'hsp@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'HSP',
                    first_name: 'Maria',
                    last_name: 'Garcia',
                    phone: '+1-555-0301',
                    date_of_birth: new Date('1980-03-25'),
                    gender: 'FEMALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                // Admin
                createUserData({
                    id: '66666666-6666-6666-6666-666666666666',
                    email: 'admin@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'SYSTEM_ADMIN',
                    first_name: 'Admin',
                    last_name: 'User',
                    phone: '+1-555-0401',
                    date_of_birth: new Date('1985-01-01'),
                    gender: 'OTHER',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                }),
                // Provider Admin
                createUserData({
                    id: '10101010-1010-1010-1010-101010101010',
                    email: 'provider@healthapp.com',
                    password_hash: hashedPassword,
                    role: 'HOSPITAL_ADMIN',
                    first_name: 'Provider',
                    last_name: 'Administrator',
                    phone: '+1-555-0501',
                    date_of_birth: new Date('1982-05-15'),
                    gender: 'MALE',
                    account_status: 'ACTIVE',
                    email_verified: true,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                })
            ]
        });
        console.log(`✅ Created ${testUsers.count} test users`);
        // Create organization first (idempotent)
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
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        console.log(`✅ Created organization: ${organization.name}`);
        // Create comprehensive medical specialties (idempotent)
        const cardiologySpec = await prisma.speciality.upsert({
            where: { name: 'Cardiology' },
            update: {},
            create: {
                name: 'Cardiology',
                description: 'Heart and cardiovascular system specialist',
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        const endocrinologySpec = await prisma.speciality.upsert({
            where: { name: 'Endocrinology' },
            update: {},
            create: {
                name: 'Endocrinology',
                description: 'Hormonal disorders and diabetes specialist',
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        const generalMedSpec = await prisma.speciality.upsert({
            where: { name: 'General Medicine' },
            update: {},
            create: {
                name: 'General Medicine',
                description: 'General medical practice',
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        // Create remaining specialties without hard-coded IDs (idempotent)
        const pediatricsSpec = await prisma.speciality.upsert({
            where: { name: 'Pediatrics' },
            update: {},
            create: {
                name: 'Pediatrics',
                description: 'Children\'s health specialist',
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        // Continue creating other specialties (idempotent)
        await prisma.speciality.createMany({
            skipDuplicates: true,
            data: [
                {
                    name: 'Orthopedics',
                    description: 'Bone, joint, and muscle specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    name: 'Dermatology',
                    description: 'Skin conditions specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    name: 'Neurology',
                    description: 'Brain and nervous system specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    name: 'Psychiatry',
                    description: 'Mental health specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    name: 'Gynecology',
                    description: 'Women\'s reproductive health specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    name: 'Ophthalmology',
                    description: 'Eye and vision specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    name: 'Emergency Medicine',
                    description: 'Emergency and acute care specialist',
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ]
        });
        console.log(`✅ Created specialities`);
        // Create doctor profiles with correct user IDs (idempotent)
        const doctorProfiles = await prisma.doctors.createMany({
            skipDuplicates: true,
            data: [
                // doctor@healthapp.com (Dr. John Smith)
                {
                    id: '00000000-0000-0000-0000-000000000011',
                    user_id: '00000000-0000-0000-0000-000000000001', // Dr. John Smith
                    doctor_id: 'DR001',
                    speciality_id: cardiologySpec.id,
                    medical_license_number: 'MD123456',
                    years_of_experience: 15,
                    board_certifications: ['Board Certified Internal Medicine', 'Diabetes Care Specialist'],
                    consultation_fee: 200.00,
                    is_verified: true,
                    verification_date: new Date(),
                    practice_name: 'Smith Cardiology Clinic',
                    created_at: new Date(),
                },
                // doctor1@healthapp.com (Dr. Jane Doe)
                {
                    id: '00000000-0000-0000-0000-000000000022',
                    user_id: '00000000-0000-0000-0000-000000000002', // Dr. Jane Doe
                    doctor_id: 'DR002',
                    speciality_id: endocrinologySpec.id,
                    medical_license_number: 'MD789012',
                    years_of_experience: 12,
                    board_certifications: ['Board Certified Family Medicine', 'Diabetes Care Specialist'],
                    consultation_fee: 180.00,
                    is_verified: true,
                    verification_date: new Date(),
                    practice_name: 'Doe Family Medicine',
                    created_at: new Date(),
                },
                // doctor2@healthapp.com (Dr. Emily Rodriguez)
                {
                    id: '00000000-0000-0000-0000-000000000033',
                    user_id: '99999999-9999-9999-9999-999999999999', // Dr. Emily Rodriguez
                    doctor_id: 'DR003',
                    speciality_id: cardiologySpec.id,
                    medical_license_number: 'MD345678',
                    years_of_experience: 8,
                    board_certifications: ['Board Certified Internal Medicine'],
                    consultation_fee: 220.00,
                    is_verified: true,
                    verification_date: new Date(),
                    practice_name: 'Rodriguez Internal Medicine',
                    created_at: new Date(),
                },
                // doctor3@healthapp.com (Dr. Robert Smith)
                {
                    id: '00000000-0000-0000-0000-000000000044',
                    user_id: '44444444-4444-4444-4444-444444444444', // Dr. Robert Smith
                    doctor_id: 'DR004',
                    speciality_id: endocrinologySpec.id,
                    medical_license_number: 'MD901234',
                    years_of_experience: 20,
                    board_certifications: ['Board Certified Cardiology', 'Interventional Cardiology'],
                    consultation_fee: 250.00,
                    is_verified: true,
                    verification_date: new Date(),
                    practice_name: 'Smith Cardiac Surgery',
                    created_at: new Date(),
                }
            ]
        });
        console.log(`✅ Created doctor profiles`);
        // Create HSP profile (idempotent)
        const hspProfile = await prisma.hsps.upsert({
            where: { id: '55555555-5555-5555-5555-555555555551' },
            update: {},
            create: {
                id: '55555555-5555-5555-5555-555555555551',
                user_id: '55555555-5555-5555-5555-555555555555',
                hsp_id: 'HSP001',
                hsp_type: 'wellness_coach',
                license_number: 'HSP12345',
                certifications: ['Certified Wellness Coach'],
                specializations: ['wellness_coaching'],
                years_of_experience: 8,
                created_at: new Date()
            }
        });
        console.log(`✅ Created HSP profile`);
        // Create provider (idempotent)
        const provider = await prisma.providers.upsert({
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
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        console.log(`✅ Created provider`);
        const patientProfiles = await prisma.patient.createMany({
            skipDuplicates: true,
            data: [
                {
                    user_id: '77777777-7777-7777-7777-777777777777',
                    patient_id: 'PAT-2024-001',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011', // doctor@healthapp.com
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
                    communication_preferences: {
                        preferred_contact_method: 'email',
                        appointment_reminders: true,
                        medication_reminders: true,
                        health_tips: true
                    },
                    overall_adherence_score: 85.5,
                    created_at: new Date('2024-01-01'),
                    updated_at: new Date()
                },
                {
                    user_id: '88888888-8888-8888-8888-888888888888',
                    patient_id: 'PAT-2024-002',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011', // doctor@healthapp.com
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
                    communication_preferences: {
                        preferred_contact_method: 'sms',
                        appointment_reminders: true,
                        medication_reminders: true
                    },
                    overall_adherence_score: 92.0,
                    created_at: new Date('2024-01-02'),
                    updated_at: new Date()
                },
                {
                    user_id: '11111111-1111-1111-1111-111111111111',
                    patient_id: 'PAT-2024-003',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022', // doctor1@healthapp.com
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
                    communication_preferences: {
                        preferred_contact_method: 'email',
                        appointment_reminders: true
                    },
                    overall_adherence_score: 78.5,
                    created_at: new Date('2024-01-03'),
                    updated_at: new Date()
                },
                {
                    user_id: '22222222-2222-2222-2222-222222222222',
                    patient_id: 'PAT-2024-004',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022', // doctor1@healthapp.com
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
                    communication_preferences: {
                        preferred_contact_method: 'phone',
                        appointment_reminders: true,
                        medication_reminders: true
                    },
                    overall_adherence_score: 88.2,
                    created_at: new Date('2024-01-04'),
                    updated_at: new Date()
                },
                {
                    user_id: '33333333-3333-3333-3333-333333333333',
                    patient_id: 'PAT-2024-005',
                    organization_id: organization.id,
                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011', // doctor@healthapp.com
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
                    communication_preferences: {
                        preferred_contact_method: 'email',
                        appointment_reminders: true,
                        health_tips: true
                    },
                    overall_adherence_score: 95.1,
                    created_at: new Date('2024-01-05'),
                    updated_at: new Date()
                }
            ]
        });
        console.log(`✅ Created patient profiles`);
        // Create comprehensive medicines database (idempotent)
        const medicines = await prisma.medicine.createMany({
            skipDuplicates: true,
            data: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    name: 'Metformin',
                    type: 'tablet',
                    description: 'First-line medication for type 2 diabetes management',
                    details: {
                        generic_name: 'Metformin Hydrochloride',
                        brand_names: ['Glucophage', 'Fortamet', 'Glumetza'],
                        drug_class: 'Biguanide',
                        common_dosages: ['500mg', '850mg', '1000mg', '1500mg'],
                        side_effects: ['Nausea', 'Diarrhea', 'Stomach upset', 'Metallic taste', 'Vitamin B12 deficiency'],
                        contraindications: ['Severe kidney disease', 'Liver disease', 'Heart failure', 'Metabolic acidosis'],
                        interactions: ['Alcohol', 'Contrast dyes', 'Certain diuretics']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
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
                        common_dosages: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
                        side_effects: ['Dry cough', 'Dizziness', 'Headache', 'Hyperkalemia', 'Angioedema'],
                        contraindications: ['Pregnancy', 'History of angioedema', 'Bilateral renal artery stenosis'],
                        interactions: ['Potassium supplements', 'NSAIDs', 'Lithium']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
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
                        side_effects: ['Stomach irritation', 'Bleeding', 'Tinnitus', 'Allergic reactions'],
                        contraindications: ['Active bleeding', 'Severe asthma', 'Children with viral infections'],
                        interactions: ['Warfarin', 'Methotrexate', 'ACE inhibitors']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440004',
                    name: 'Ibuprofen',
                    type: 'tablet',
                    description: 'Anti-inflammatory pain and fever reducer',
                    details: {
                        generic_name: 'Ibuprofen',
                        brand_names: ['Advil', 'Motrin', 'Nuprin'],
                        drug_class: 'NSAID',
                        common_dosages: ['200mg', '400mg', '600mg', '800mg'],
                        side_effects: ['Stomach upset', 'Kidney problems', 'Heart issues', 'High blood pressure'],
                        contraindications: ['Heart disease', 'Kidney disease', 'Active ulcers', 'Asthma'],
                        interactions: ['Blood thinners', 'ACE inhibitors', 'Lithium', 'Methotrexate']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440005',
                    name: 'Amlodipine',
                    type: 'tablet',
                    description: 'Calcium channel blocker for high blood pressure',
                    details: {
                        generic_name: 'Amlodipine Besylate',
                        brand_names: ['Norvasc', 'Katerzia'],
                        drug_class: 'Calcium Channel Blocker',
                        common_dosages: ['2.5mg', '5mg', '10mg'],
                        side_effects: ['Ankle swelling', 'Dizziness', 'Flushing', 'Fatigue'],
                        contraindications: ['Severe aortic stenosis', 'Unstable angina', 'Severe hypotension'],
                        interactions: ['Simvastatin', 'Cyclosporine', 'Strong CYP3A4 inhibitors']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440006',
                    name: 'Simvastatin',
                    type: 'tablet',
                    description: 'Statin medication for high cholesterol',
                    details: {
                        generic_name: 'Simvastatin',
                        brand_names: ['Zocor', 'FloLipid'],
                        drug_class: 'HMG-CoA Reductase Inhibitor (Statin)',
                        common_dosages: ['5mg', '10mg', '20mg', '40mg', '80mg'],
                        side_effects: ['Muscle pain', 'Liver enzyme elevation', 'Headache', 'Nausea'],
                        contraindications: ['Active liver disease', 'Pregnancy', 'Nursing', 'Concurrent cyclosporine'],
                        interactions: ['Grapefruit juice', 'Amiodarone', 'Verapamil', 'Diltiazem']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440007',
                    name: 'Omeprazole',
                    type: 'capsule',
                    description: 'Proton pump inhibitor for acid reflux and ulcers',
                    details: {
                        generic_name: 'Omeprazole',
                        brand_names: ['Prilosec', 'Zegerid'],
                        drug_class: 'Proton Pump Inhibitor',
                        common_dosages: ['10mg', '20mg', '40mg'],
                        side_effects: ['Headache', 'Nausea', 'Diarrhea', 'Vitamin B12 deficiency'],
                        contraindications: ['Hypersensitivity to benzimidazoles', 'Concurrent rilpivirine'],
                        interactions: ['Clopidogrel', 'Warfarin', 'Digoxin', 'Atazanavir']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440008',
                    name: 'Albuterol',
                    type: 'inhaler',
                    description: 'Bronchodilator for asthma and COPD',
                    details: {
                        generic_name: 'Albuterol Sulfate',
                        brand_names: ['ProAir', 'Ventolin', 'Proventil'],
                        drug_class: 'Short-Acting Beta2 Agonist',
                        common_dosages: ['90mcg/puff', '108mcg/puff'],
                        side_effects: ['Tremor', 'Nervousness', 'Headache', 'Rapid heartbeat'],
                        contraindications: ['Hypersensitivity to albuterol', 'Tachyarrhythmias'],
                        interactions: ['Beta-blockers', 'Digoxin', 'MAO inhibitors', 'Tricyclic antidepressants']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440009',
                    name: 'Levothyroxine',
                    type: 'tablet',
                    description: 'Thyroid hormone replacement therapy',
                    details: {
                        generic_name: 'Levothyroxine Sodium',
                        brand_names: ['Synthroid', 'Levoxyl', 'Tirosint'],
                        drug_class: 'Thyroid Hormone',
                        common_dosages: ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg'],
                        side_effects: ['Heart palpitations', 'Weight loss', 'Nervousness', 'Insomnia'],
                        contraindications: ['Untreated adrenal insufficiency', 'Recent myocardial infarction'],
                        interactions: ['Iron supplements', 'Calcium', 'Coffee', 'Soybean flour']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440010',
                    name: 'Sertraline',
                    type: 'tablet',
                    description: 'SSRI antidepressant for depression and anxiety',
                    details: {
                        generic_name: 'Sertraline Hydrochloride',
                        brand_names: ['Zoloft', 'Lustral'],
                        drug_class: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
                        common_dosages: ['25mg', '50mg', '100mg'],
                        side_effects: ['Nausea', 'Diarrhea', 'Sexual dysfunction', 'Weight changes'],
                        contraindications: ['MAO inhibitor use', 'Pimozide use', 'Linezolid use'],
                        interactions: ['MAO inhibitors', 'Blood thinners', 'NSAIDs', 'Triptans']
                    },
                    public_medicine: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ]
        });
        console.log(`✅ Created medicines`);
        // Create vital templates (idempotent)
        const vitalTemplates = await prisma.vital_templates.createMany({
            skipDuplicates: true,
            data: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440020',
                    name: 'Blood Pressure',
                    unit: 'mmHg',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440021',
                    name: 'Heart Rate',
                    unit: 'bpm',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440022',
                    name: 'Weight',
                    unit: 'kg',
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440023',
                    name: 'Blood Glucose',
                    unit: 'mg/dL',
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ]
        });
        console.log(`✅ Created vital templates`);
        // Create symptoms/conditions database (idempotent)
        const symptomsDatabase = await prisma.symptoms_database.createMany({
            skipDuplicates: true,
            data: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440011',
                    diagnosis_name: 'Type 2 Diabetes',
                    symptoms: [
                        'Excessive thirst',
                        'Frequent urination',
                        'Unexplained weight loss',
                        'Increased hunger',
                        'Fatigue',
                        'Blurred vision',
                        'Slow-healing sores',
                        'Frequent infections'
                    ],
                    category: 'Endocrine',
                    severity_indicators: {
                        mild: ['Mild thirst', 'Occasional fatigue'],
                        moderate: ['Increased hunger', 'Blurred vision'],
                        severe: ['Unexplained weight loss', 'Frequent urination', 'Slow-healing wounds']
                    },
                    common_age_groups: ['adults', 'elderly'],
                    gender_specific: 'both',
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440012',
                    diagnosis_name: 'Hypertension',
                    symptoms: [
                        'Headaches',
                        'Dizziness',
                        'Chest pain',
                        'Nosebleeds',
                        'Shortness of breath',
                        'Blurred vision',
                        'Fatigue'
                    ],
                    category: 'Cardiovascular',
                    severity_indicators: {
                        mild: ['Occasional headaches', 'Mild dizziness'],
                        moderate: ['Regular headaches', 'Chest discomfort'],
                        severe: ['Severe headaches', 'Chest pain', 'Shortness of breath']
                    },
                    common_age_groups: ['adults', 'elderly'],
                    gender_specific: 'both',
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440013',
                    diagnosis_name: 'Asthma',
                    symptoms: [
                        'Wheezing',
                        'Coughing',
                        'Chest tightness',
                        'Shortness of breath',
                        'Difficulty breathing',
                        'Rapid breathing'
                    ],
                    category: 'Respiratory',
                    severity_indicators: {
                        mild: ['Occasional wheezing', 'Exercise-induced cough'],
                        moderate: ['Regular shortness of breath', 'Chest tightness'],
                        severe: ['Difficulty speaking', 'Severe breathing problems', 'Blue lips/fingernails']
                    },
                    common_age_groups: ['children', 'adults'],
                    gender_specific: 'both',
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440014',
                    diagnosis_name: 'Depression',
                    symptoms: [
                        'Persistent sadness',
                        'Loss of interest',
                        'Fatigue',
                        'Sleep disturbances',
                        'Appetite changes',
                        'Difficulty concentrating',
                        'Feelings of worthlessness',
                        'Thoughts of death'
                    ],
                    category: 'Mental Health',
                    severity_indicators: {
                        mild: ['Occasional sadness', 'Mild sleep issues'],
                        moderate: ['Regular mood changes', 'Decreased activity'],
                        severe: ['Persistent hopelessness', 'Thoughts of self-harm', 'Unable to function']
                    },
                    common_age_groups: ['adolescents', 'adults', 'elderly'],
                    gender_specific: 'both',
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440015',
                    diagnosis_name: 'Anxiety Disorder',
                    symptoms: [
                        'Excessive worry',
                        'Restlessness',
                        'Fatigue',
                        'Difficulty concentrating',
                        'Irritability',
                        'Muscle tension',
                        'Sleep disturbances',
                        'Panic attacks'
                    ],
                    category: 'Mental Health',
                    severity_indicators: {
                        mild: ['Occasional worry', 'Mild restlessness'],
                        moderate: ['Regular anxiety', 'Difficulty concentrating'],
                        severe: ['Panic attacks', 'Unable to perform daily activities', 'Constant fear']
                    },
                    common_age_groups: ['adolescents', 'adults'],
                    gender_specific: 'both',
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ]
        });
        console.log(`✅ Created symptoms/conditions database`);
        // Create treatments database (idempotent)
        const treatmentsDatabase = await prisma.treatment_database.createMany({
            skipDuplicates: true,
            data: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440021',
                    treatment_name: 'Metformin Therapy',
                    treatment_type: 'medication',
                    description: 'First-line medication for Type 2 diabetes management',
                    applicable_conditions: ['Type 2 Diabetes', 'Pre-diabetes', 'PCOS'],
                    duration: 'Long-term',
                    frequency: 'Twice daily with meals',
                    dosage_info: {
                        initial_dose: '500mg twice daily',
                        maximum_dose: '2000mg daily',
                        titration: 'Increase by 500mg weekly as tolerated'
                    },
                    category: 'Antidiabetic',
                    severity_level: 'moderate',
                    age_restrictions: {
                        minimum_age: 10,
                        elderly_considerations: 'Monitor renal function'
                    },
                    contraindications: [
                        'Severe renal impairment',
                        'Metabolic acidosis',
                        'Heart failure requiring medication'
                    ],
                    side_effects: [
                        'Gastrointestinal upset',
                        'Metallic taste',
                        'Vitamin B12 deficiency (long-term)'
                    ],
                    monitoring_required: [
                        'Blood glucose levels',
                        'Kidney function',
                        'Vitamin B12 levels'
                    ],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440022',
                    treatment_name: 'ACE Inhibitor Therapy',
                    treatment_type: 'medication',
                    description: 'First-line treatment for hypertension and heart failure',
                    applicable_conditions: ['Hypertension', 'Heart Failure', 'Diabetic Nephropathy'],
                    duration: 'Long-term',
                    frequency: 'Once or twice daily',
                    dosage_info: {
                        initial_dose: '2.5-5mg daily',
                        maximum_dose: '40mg daily',
                        titration: 'Increase every 1-2 weeks as needed'
                    },
                    category: 'Cardiovascular',
                    severity_level: 'moderate',
                    age_restrictions: {
                        minimum_age: 18,
                        elderly_considerations: 'Start with lower doses'
                    },
                    contraindications: [
                        'Pregnancy',
                        'History of angioedema',
                        'Bilateral renal artery stenosis'
                    ],
                    side_effects: [
                        'Dry cough',
                        'Hyperkalemia',
                        'Dizziness',
                        'Angioedema (rare)'
                    ],
                    monitoring_required: [
                        'Blood pressure',
                        'Kidney function',
                        'Potassium levels'
                    ],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440023',
                    treatment_name: 'Inhaled Bronchodilator Therapy',
                    treatment_type: 'medication',
                    description: 'Short-acting beta2 agonist for asthma and COPD',
                    applicable_conditions: ['Asthma', 'COPD', 'Exercise-induced bronchospasm'],
                    duration: 'As needed or regular use',
                    frequency: '2 puffs every 4-6 hours as needed',
                    dosage_info: {
                        initial_dose: '90mcg (2 puffs) as needed',
                        maximum_dose: '12 puffs per day',
                        titration: 'Use as needed for symptoms'
                    },
                    category: 'Respiratory',
                    severity_level: 'mild_to_moderate',
                    age_restrictions: {
                        minimum_age: 4,
                        elderly_considerations: 'Monitor for cardiovascular effects'
                    },
                    contraindications: [
                        'Hypersensitivity to albuterol',
                        'Tachyarrhythmias'
                    ],
                    side_effects: [
                        'Tremor',
                        'Nervousness',
                        'Headache',
                        'Rapid heartbeat'
                    ],
                    monitoring_required: [
                        'Peak flow readings',
                        'Symptom frequency',
                        'Heart rate'
                    ],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440024',
                    treatment_name: 'Cognitive Behavioral Therapy',
                    treatment_type: 'therapy',
                    description: 'Evidence-based psychotherapy for depression and anxiety',
                    applicable_conditions: ['Depression', 'Anxiety Disorder', 'PTSD', 'Panic Disorder'],
                    duration: '12-20 sessions over 3-6 months',
                    frequency: 'Weekly sessions initially',
                    dosage_info: {
                        initial_dose: '45-50 minute sessions weekly',
                        maximum_dose: 'Twice weekly in severe cases',
                        titration: 'Adjust frequency based on progress'
                    },
                    category: 'Mental Health',
                    severity_level: 'mild_to_severe',
                    age_restrictions: {
                        minimum_age: 8,
                        elderly_considerations: 'May require modifications for cognitive changes'
                    },
                    contraindications: [
                        'Active psychosis',
                        'Severe cognitive impairment',
                        'Active substance intoxication'
                    ],
                    side_effects: [
                        'Temporary increase in distress',
                        'Emotional fatigue during sessions'
                    ],
                    monitoring_required: [
                        'Mood rating scales',
                        'Functional improvement',
                        'Suicide risk assessment'
                    ],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440025',
                    treatment_name: 'Lifestyle Modification Program',
                    treatment_type: 'lifestyle',
                    description: 'Comprehensive diet and exercise program for chronic disease management',
                    applicable_conditions: ['Type 2 Diabetes', 'Hypertension', 'Obesity', 'High Cholesterol'],
                    duration: 'Ongoing lifestyle changes',
                    frequency: 'Daily adherence to recommendations',
                    dosage_info: {
                        initial_dose: '30 minutes moderate exercise, 5 days/week',
                        maximum_dose: '60+ minutes daily exercise as tolerated',
                        titration: 'Gradually increase intensity and duration'
                    },
                    category: 'Lifestyle',
                    severity_level: 'all_levels',
                    age_restrictions: {
                        minimum_age: 'All ages with modifications',
                        elderly_considerations: 'Lower intensity exercise, fall prevention'
                    },
                    contraindications: [
                        'Severe cardiovascular disease without clearance',
                        'Acute illness',
                        'Uncontrolled diabetes'
                    ],
                    side_effects: [
                        'Initial fatigue',
                        'Muscle soreness',
                        'Temporary hunger adjustments'
                    ],
                    monitoring_required: [
                        'Weight tracking',
                        'Blood pressure monitoring',
                        'Blood glucose levels',
                        'Exercise tolerance'
                    ],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ]
        });
        console.log(`✅ Created treatments database`);
        console.log(`🎉 Successfully seeded comprehensive healthcare test data!`);
        console.log(`📊 Summary:`);
        console.log(`   - Users: 10 (5 patients, 2 doctors, 1 HSP, 1 admin, 1 provider)`);
        console.log(`   - Organization: 1`);
        console.log(`   - Medical Specialties: 11 (complete specialties database)`);
        console.log(`   - Medicines: 10 (comprehensive medication database)`);
        console.log(`   - Vital Templates: 4`);
        console.log(`   - Symptoms/Conditions: 5 (major medical conditions)`);
        console.log(`   - Treatments: 5 (medication, therapy, lifestyle treatments)`);
        console.log(`   - Basic doctor credentials: doctor@healthapp.com / TempPassword123!`);
        console.log(`   - Basic doctor credentials: doctor1@healthapp.com / TempPassword123!`);
        console.log(`   - Other test credentials: email/${defaultPassword} for all other users`);
        return {
            success: true,
            message: 'Comprehensive healthcare test data seeded successfully',
            data: {
                users: 10,
                patients: 5,
                doctors: 2,
                organizations: 1,
                specialties: 11,
                medicines: 10,
                vitalTemplates: 4,
                symptomsConditions: 5,
                treatments: 5
            }
        };
    }
    catch (error) {
        console.error('❌ Error seeding healthcare data:', error);
        throw error;
    }
}
// WARNING: This function is destructive and will wipe all data from the specified tables.
// It is intended for development and testing purposes only.
async function DANGEROUSLY_CLEAR_ALL_DATA_TABLES() {
    console.log('🗑️ DANGEROUSLY clearing all data from tables...');
    try {
        // Wrap all delete operations in a transaction to ensure atomicity
        // Delete in an order that respects foreign key constraints
        await prisma.$transaction(async (tx) => {
            await tx.patient.deleteMany({});
            await tx.hsps.deleteMany({});
            await tx.doctors.deleteMany({});
            // Delete in reverse dependency order
            // await tx.patient.deleteMany({});
            // await tx.doctors.deleteMany({});
            // await tx.hsps.deleteMany({});
            await tx.providers.deleteMany({});
            await tx.user.deleteMany({});
            await tx.organization.deleteMany({});
            await tx.speciality.deleteMany({});
            await tx.medicine.deleteMany({});
            await tx.vital_templates.deleteMany({});
        });
        console.log('✅ All data cleared successfully in transaction');
    }
    catch (error) {
        console.error('❌ Error clearing all data:', error);
        throw error;
    }
}
// Run seeding if this script is called directly
// CommonJS-compatible main module detection
if (require.main === module) {
    seedComprehensiveHealthcareData()
        .then((result) => {
        console.log('Seeding completed:', result);
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
