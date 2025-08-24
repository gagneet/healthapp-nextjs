// lib/seed-updated.cjs - Comprehensive Healthcare Test Data Seeding with Fixed Schema (CommonJS)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Database cleanup function to remove all existing data
async function cleanDatabase() {
  console.log('🧹 Cleaning database - removing all existing data...');
  
  try {
    // Delete in reverse dependency order to avoid foreign key constraints
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

async function seedComprehensiveHealthcareData() {
  console.log('📊 Seeding comprehensive healthcare test data with corrected schema...');

  try {
    await waitForTables();
    await cleanDatabase();

    // Password setup
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const basicDoctorPassword = await bcrypt.hash('TempPassword123!', 12);

    // Helper function to create user with Auth.js v5 fields
    const createUserData = (userData) => ({
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`.trim(),
      emailVerified: userData.emailVerifiedLegacy ? userData.createdAt : null,
      image: null,
    });

    console.log('👥 Creating users...');
    
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
        }),
        
        // 5 Patients
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
        })
      ]
    });

    console.log(`✅ Created ${testUsers.count} users`);

    // Create Organization with correct schema
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

    // Create Medical Specialties
    console.log('🩺 Creating medical specialties...');
    const specialties = [
      { name: 'Cardiology', description: 'Heart and cardiovascular system specialist' },
      { name: 'Endocrinology', description: 'Hormonal disorders and diabetes specialist' },
      { name: 'General Medicine', description: 'General medical practice' }
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

    // Get specialties for doctor profiles
    const cardiologySpec = await prisma.speciality.findFirst({ where: { name: 'Cardiology' } });
    const endocrinologySpec = await prisma.speciality.findFirst({ where: { name: 'Endocrinology' } });
    const generalMedSpec = await prisma.speciality.findFirst({ where: { name: 'General Medicine' } });

    // Create Doctor profiles
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
        }
      ]
    });

    console.log(`✅ Created doctor profiles`);

    // Create Patient profiles
    console.log('👥 Creating patient profiles...');
    await prisma.patient.createMany({
      skipDuplicates: true,
      data: [
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
            { name: 'Penicillin', severity: 'severe', reaction: 'rash' }
          ],
          medical_history: [
            { condition: 'Type 2 Diabetes', diagnosed: '2022-03-15', status: 'active' }
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
            { condition: 'Hypertension', diagnosed: '2020-05-10', status: 'active' }
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
            { condition: 'Type 2 Diabetes', diagnosed: '2020-08-15', status: 'controlled' }
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
            { condition: 'Hypothyroidism', diagnosed: '2021-06-30', status: 'active' }
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

    // Create Clinic with correct schema (JSON address field)
    console.log('🏥 Creating clinic...');
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
        services_offered: ['Cardiac Consultation', 'Echocardiograms', 'Stress Testing'],
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

    console.log(`✅ Created clinic`);

    // Get created patients for care plans
    const createdPatients = await prisma.patient.findMany({
      select: { id: true, user_id: true },
      orderBy: { created_at: 'asc' },
      take: 2  // Just create 2 sample care plans
    });

    // Create Care Plans with correct schema fields
    console.log('🩺 Creating care plans...');
    if (createdPatients.length >= 2) {
      const carePlanData = [
        {
          patient_id: createdPatients[0]?.id,
          created_by_doctor_id: '00000000-0000-0000-0000-000000000011',
          organization_id: organization.id,
          title: 'Diabetes Management Plan',
          description: 'Comprehensive care plan for Type 2 diabetes management',
          chronic_conditions: ['Type 2 Diabetes'],
          condition_severity: { 'Type 2 Diabetes': 'moderate' },
          long_term_goals: [
            'Maintain HbA1c below 7.0%',
            'Achieve weight loss of 10 pounds'
          ],
          lifestyle_modifications: [
            {
              type: 'diet',
              details: {
                calories_per_day: 1800,
                restrictions: ['Low sodium', 'Limited refined sugars']
              }
            }
          ],
          start_date: getRandomPastDate(30, 60),
          end_date: getFutureDate(180),
          status: 'ACTIVE',
          priority: 'HIGH'
        },
        {
          patient_id: createdPatients[1]?.id,
          created_by_doctor_id: '00000000-0000-0000-0000-000000000011',
          organization_id: organization.id,
          title: 'Hypertension Control Plan',
          description: 'Blood pressure management and lifestyle modification',
          chronic_conditions: ['Hypertension'],
          condition_severity: { 'Hypertension': 'mild' },
          long_term_goals: [
            'Reduce blood pressure to <130/80 mmHg',
            'Maintain healthy weight'
          ],
          lifestyle_modifications: [
            {
              type: 'diet',
              details: {
                sodium_mg: 1500,
                restrictions: ['Low sodium', 'Heart-healthy fats']
              }
            }
          ],
          start_date: getRandomPastDate(25, 55),
          end_date: getFutureDate(120),
          status: 'ACTIVE',
          priority: 'MEDIUM'
        }
      ];

      for (let i = 0; i < carePlanData.length; i++) {
        const planData = carePlanData[i];
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

      console.log(`✅ Created ${carePlanData.length} care plans with correct schema`);
    }

    console.log(`\n🎉 Successfully seeded healthcare test data with corrected schema!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${testUsers.count} ✅`);
    console.log(`   - Organization: 1 ✅`);
    console.log(`   - Medical Specialties: ${specialties.length} ✅`);
    console.log(`   - Doctor profiles: 3 ✅`);
    console.log(`   - Patient profiles: 5 ✅`);
    console.log(`   - Clinic: 1 (with JSON address field) ✅`);
    console.log(`   - Care Plans: 2 (with correct schema fields) ✅`);
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   - Dr. Smith: doctor@healthapp.com / TempPassword123!`);
    console.log(`   - Dr. Doe: doctor1@healthapp.com / TempPassword123!`);
    console.log(`   - All other users: email / ${defaultPassword}`);

    return {
      success: true,
      message: 'Healthcare test data seeded successfully with corrected schema',
      data: {
        users: testUsers.count,
        organization: organization.name,
        correctedFields: {
          clinic: 'address field converted to JSON',
          carePlan: 'removed invalid fields (objectives, diet_plan, workout_plan), added correct schema fields'
        }
      }
    };

  } catch (error) {
    console.error('❌ Error seeding healthcare data:', error);
    
    if (error.code === 'P2002') {
      console.error('🔍 Unique constraint violation - data may already exist');
    } else if (error.code === 'P2003') {
      console.error('🔍 Foreign key constraint failed - relationship data missing');
    } else if (error.code === 'P2021') {
      console.error('🔍 Database table does not exist - run migrations first');
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Run: npx prisma migrate dev');
    console.error('   2. Run: npx prisma generate');
    console.error('   3. Check database connection');
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
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