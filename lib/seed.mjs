// lib/seed.mjs - Prisma-based seeding for comprehensive healthcare test data (JavaScript ES module version)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Generate secure password hash
async function generateSecurePasswordHash(password) {
  const saltRounds = 12; // Higher security for production
  return await bcrypt.hash(password, saltRounds);
}

export async function seedComprehensiveHealthcareData() {
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

    console.log(`🎉 Successfully seeded comprehensive healthcare test data!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: 10 (5 patients, 3 doctors, 1 HSP, 1 admin, 1 provider)`);
    console.log(`   - Basic doctor credentials: doctor@healthapp.com / TempPassword123!`);
    console.log(`   - Basic doctor credentials: doctor1@healthapp.com / TempPassword123!`);
    console.log(`   - Other test credentials: email/${defaultPassword} for all other users`);

    return {
      success: true,
      message: 'Comprehensive healthcare test data seeded successfully',
      data: {
        users: 10,
        patients: 5,
        doctors: 3,
      }
    };

  } catch (error) {
    console.error('❌ Error seeding healthcare data:', error);
    throw error;
  }
}

// Run seeding if this script is called directly
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