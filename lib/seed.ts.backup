// lib/seed.ts - Prisma-based seeding for comprehensive healthcare test data
import { PrismaClient } from './prisma-client';
import bcrypt from 'bcryptjs';
import { generateDoctorId, generateHspId, generatePatientId } from './id-generation.js';

const prisma = new PrismaClient();

export async function seedComprehensiveHealthcareData() {
  console.log('📊 Seeding comprehensive healthcare test data...');

  try {
    // Check if data already exists
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'patient1@healthapp.com',
            'patient2@healthapp.com', 
            'patient3@healthapp.com',
            'patient4@healthapp.com',
            'patient5@healthapp.com',
            'doctor1@healthapp.com',
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

    // Hash password for all test users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test users with all roles
    const testUsers = await prisma.user.createMany({
      data: [
        // 5 Patients
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        // 2 Doctors
        {
          id: '99999999-9999-9999-9999-999999999999',
          email: 'doctor1@healthapp.com',
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
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          email: 'doctor2@healthapp.com',
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
        },
        // HSP
        {
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
        },
        // Admin
        {
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
        },
        // Provider Admin
        {
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
        }
      ]
    });

    console.log(`✅ Created ${testUsers.count} test users`);

    // Create organization first
    const organization = await prisma.organization.create({
      data: {
        id: 'org-healthcare-main',
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

    // Create specialities first
    const specialities = await prisma.speciality.createMany({
      data: [
        {
          name: 'Internal Medicine',
          description: 'Internal medicine specialists',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Cardiology',
          description: 'Heart and cardiovascular specialists',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    });

    console.log(`✅ Created specialities`);

    // Create doctor profiles
    const doctorProfiles = await prisma.doctors.createMany({
      data: [
        {
          id: '99999999-9999-9999-9999-999999999991',
          user_id: '99999999-9999-9999-9999-999999999999',
          doctor_id: 'DR001',
          speciality_id: 1,
          medical_license_number: 'MD123456',
          years_of_experience: 15,
          board_certifications: ['Board Certified Internal Medicine', 'Diabetes Care Specialist'],
          consultation_fee: 200.00,
          created_at: new Date(),
        },
        {
          id: '44444444-4444-4444-4444-444444444441',
          user_id: '44444444-4444-4444-4444-444444444444',
          doctor_id: 'DR002',
          speciality_id: 2,
          medical_license_number: 'MD789012',
          years_of_experience: 20,
          board_certifications: ['Board Certified Cardiology', 'Interventional Cardiology'],
          consultation_fee: 250.00,
          created_at: new Date(),
        }
      ]
    });

    console.log(`✅ Created doctor profiles`);

    // Create HSP profile
    const hspProfile = await prisma.hsps.create({
      data: {
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

    // Create provider
    const provider = await prisma.providers.create({
      data: {
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

    // Create patient profiles with detailed medical data
    const patientProfiles = await prisma.patient.createMany({
      data: [
        {
          id: 'pat-sarah-johnson',
          user_id: '77777777-7777-7777-7777-777777777777',
          patient_id: 'PAT-2024-001',
          organization_id: organization.id,
          primary_care_doctor_id: '99999999-9999-9999-9999-999999999991',
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
          id: 'pat-michael-chen',
          user_id: '88888888-8888-8888-8888-888888888888',
          patient_id: 'PAT-2024-002',
          organization_id: organization.id,
          primary_care_doctor_id: '99999999-9999-9999-9999-999999999991',
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
          id: 'pat-emma-williams',
          user_id: '11111111-1111-1111-1111-111111111111',
          patient_id: 'PAT-2024-003',
          organization_id: organization.id,
          primary_care_doctor_id: '44444444-4444-4444-4444-444444444441',
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
          id: 'pat-james-brown',
          user_id: '22222222-2222-2222-2222-222222222222',
          patient_id: 'PAT-2024-004',
          organization_id: organization.id,
          primary_care_doctor_id: '44444444-4444-4444-4444-444444444441',
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
          id: 'pat-olivia-davis',
          user_id: '33333333-3333-3333-3333-333333333333',
          patient_id: 'PAT-2024-005',
          organization_id: organization.id,
          primary_care_doctor_id: '99999999-9999-9999-9999-999999999991',
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

    // Create medicines
    const medicines = await prisma.medicine.createMany({
      data: [
        {
          id: '99999999-9999-9999-9999-999999999981',
          name: 'Metformin',
          type: 'tablet',
          description: 'Used to treat type 2 diabetes',
          details: {
            generic_name: 'Metformin Hydrochloride',
            brand_names: ['Glucophage', 'Fortamet'],
            drug_class: 'Biguanide',
            common_dosages: ['500mg', '850mg', '1000mg'],
            side_effects: ['Nausea', 'Diarrhea', 'Stomach upset'],
            contraindications: ['Kidney disease', 'Liver disease']
          },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '99999999-9999-9999-9999-999999999982',
          name: 'Lisinopril',
          type: 'tablet',
          description: 'Used to treat high blood pressure',
          details: {
            generic_name: 'Lisinopril',
            brand_names: ['Prinivil', 'Zestril'],
            drug_class: 'ACE Inhibitor',
            common_dosages: ['5mg', '10mg', '20mg'],
            side_effects: ['Dry cough', 'Dizziness', 'Headache'],
            contraindications: ['Pregnancy', 'Angioedema history']
          },
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    });

    console.log(`✅ Created medicines`);

    // Create vital templates
    const vitalTemplates = await prisma.vital_templates.createMany({
      data: [
        {
          id: 'vital-blood-pressure',
          name: 'Blood Pressure',
          unit: 'mmHg',
          category: 'cardiovascular',
          normal_range_min: 120,
          normal_range_max: 80,
          description: 'Systolic and diastolic blood pressure measurement',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'vital-heart-rate',
          name: 'Heart Rate',
          unit: 'bpm',
          category: 'cardiovascular',
          normal_range_min: 60,
          normal_range_max: 100,
          description: 'Heart rate measurement',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'vital-weight',
          name: 'Weight',
          unit: 'kg',
          category: 'physical',
          normal_range_min: 50,
          normal_range_max: 120,
          description: 'Body weight measurement',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'vital-blood-glucose',
          name: 'Blood Glucose',
          unit: 'mg/dL',
          category: 'metabolic',
          normal_range_min: 80,
          normal_range_max: 130,
          description: 'Blood glucose level measurement',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    });

    console.log(`✅ Created vital templates`);

    console.log(`🎉 Successfully seeded comprehensive healthcare test data!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: 10 (5 patients, 2 doctors, 1 HSP, 1 admin, 1 provider)`);
    console.log(`   - Organization: 1`);
    console.log(`   - Specialities: 2`);
    console.log(`   - Medicines: 2`);
    console.log(`   - Vital Templates: 4`);
    console.log(`   - Test credentials: email/password123 for all users`);

    return {
      success: true,
      message: 'Comprehensive healthcare test data seeded successfully',
      data: {
        users: 10,
        patients: 5,
        doctors: 2,
        organizations: 1,
        specialities: 2,
        medicines: 2,
        vitalTemplates: 4
      }
    };

  } catch (error) {
    console.error('❌ Error seeding healthcare data:', error);
    throw error;
  }
}

export async function clearTestData() {
  console.log('🗑️ Clearing test data...');
  
  try {
    // Delete in reverse dependency order
    await prisma.patient.deleteMany({
      where: {
        patient_id: {
          startsWith: 'PAT-2024-'
        }
      }
    });

    await prisma.doctors.deleteMany({
      where: {
        id: {
          in: ['doc-emily-rodriguez', 'doc-robert-smith']
        }
      }
    });

    await prisma.hsps.deleteMany({
      where: {
        id: 'hsp-maria-garcia'
      }
    });

    await prisma.providers.deleteMany({
      where: {
        id: 'prov-healthcare-system'
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: '@healthapp.com'
        }
      }
    });

    await prisma.organization.deleteMany({
      where: {
        id: 'org-healthcare-main'
      }
    });

    await prisma.specialities.deleteMany({
      where: {
        id: {
          in: ['spec-internal-medicine', 'spec-cardiology']
        }
      }
    });

    await prisma.medicines.deleteMany({
      where: {
        id: {
          in: ['med-metformin', 'med-lisinopril']
        }
      }
    });

    await prisma.vital_templates.deleteMany({
      where: {
        id: {
          in: ['vital-blood-pressure', 'vital-heart-rate', 'vital-weight', 'vital-blood-glucose']
        }
      }
    });

    console.log('✅ Test data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
}

// Run seeding if this script is called directly
// Note: In ES modules, use import.meta.url for main module detection
if (import.meta.url === `file://${process.argv[1]}`) {
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