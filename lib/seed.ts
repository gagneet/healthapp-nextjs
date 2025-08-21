// lib/seed.ts - Prisma-based seeding for comprehensive healthcare test data
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const seedTimestamp = new Date();

// --- Data Definitions ---
const seedData = {
  users: [
    { id: '00000000-0000-0000-0000-000000000001', email: 'doctor@healthapp.com', role: 'DOCTOR', first_name: 'Dr. John', last_name: 'Smith', phone: '+1-555-0001', date_of_birth: new Date('1975-01-15'), gender: 'MALE', account_status: 'ACTIVE', email_verified: true },
    { id: '00000000-0000-0000-0000-000000000002', email: 'doctor1@healthapp.com', role: 'DOCTOR', first_name: 'Dr. Jane', last_name: 'Doe', phone: '+1-555-0002', date_of_birth: new Date('1978-05-20'), gender: 'FEMALE', account_status: 'ACTIVE', email_verified: true },
    { id: '99999999-9999-9999-9999-999999999999', email: 'doctor2@healthapp.com', role: 'DOCTOR', first_name: 'Dr. Emily', last_name: 'Rodriguez', phone: '+1-555-0201', date_of_birth: new Date('1975-11-08'), gender: 'FEMALE', account_status: 'ACTIVE', email_verified: true },
    { id: '77777777-7777-7777-7777-777777777777', email: 'patient1@healthapp.com', role: 'PATIENT', first_name: 'Sarah', last_name: 'Johnson', phone: '+1-555-0101', date_of_birth: new Date('1985-06-15'), gender: 'FEMALE', account_status: 'ACTIVE', email_verified: true },
  ],
  organization: {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'HealthApp Medical Center',
  },
  specialties: [
      { name: 'Cardiology', description: 'Heart and cardiovascular system specialist' },
      { name: 'Endocrinology', description: 'Hormonal disorders and diabetes specialist' },
  ],
  doctors: [
      { user_id: '00000000-0000-0000-0000-000000000001', doctor_id: 'DR001', specialityName: 'Cardiology', medical_license_number: 'MD123456' },
      { user_id: '00000000-0000-0000-0000-000000000002', doctor_id: 'DR002', specialityName: 'Endocrinology', medical_license_number: 'MD789012' },
      { user_id: '99999999-9999-9999-9999-999999999999', doctor_id: 'DR003', specialityName: 'Cardiology', medical_license_number: 'MD345678' },
  ],
  patients: [
      { user_id: '77777777-7777-7777-7777-777777777777', patient_id: 'PAT-2024-001', primary_care_doctor_id: '00000000-0000-0000-0000-000000000001' },
  ]
};

// --- Seeding Functions ---

async function seedUsers() {
  const hashedPassword = await bcrypt.hash('TempPassword123!', 12);
  const userData = seedData.users.map(user => ({
    ...user,
    password_hash: hashedPassword,
    name: `${user.first_name} ${user.last_name}`.trim(),
    emailVerified: user.email_verified ? seedTimestamp : null,
    created_at: seedTimestamp,
    updated_at: seedTimestamp,
  }));

  await prisma.user.createMany({ data: userData, skipDuplicates: true });
  console.log(`✅ Seeded ${userData.length} users`);
}

async function seedOrganization() {
    await prisma.organization.upsert({
        where: { id: seedData.organization.id },
        update: {},
        create: { ...seedData.organization, created_at: seedTimestamp, updated_at: seedTimestamp },
    });
    console.log(`✅ Seeded organization`);
}

async function seedSpecialties() {
    const specialtyData = seedData.specialties.map(s => ({ ...s, created_at: seedTimestamp, updated_at: seedTimestamp }));
    await prisma.speciality.createMany({ data: specialtyData, skipDuplicates: true });
    console.log(`✅ Seeded ${specialtyData.length} specialties`);
}

async function seedDoctors() {
    const specialties = await prisma.speciality.findMany({
        where: { name: { in: seedData.doctors.map(d => d.specialityName) } },
    });
    const specialtyMap = Object.fromEntries(specialties.map(s => [s.name, s.id]));

    const doctorData = seedData.doctors.map(doc => ({
        ...doc,
        id: doc.user_id.replace(/-/g, '').substring(0, 32)), // Create a deterministic but valid-looking UUID part
        organization_id: seedData.organization.id,
        speciality_id: specialtyMap[doc.specialityName],
        is_verified: true,
        created_at: seedTimestamp,
        updated_at: seedTimestamp,
    }));

    // Remove specialityName before inserting
    doctorData.forEach(d => delete (d as any).specialityName);

    await prisma.doctors.createMany({ data: doctorData, skipDuplicates: true });
    console.log(`✅ Seeded ${doctorData.length} doctors`);
}

async function seedPatients() {
    const patientData = seedData.patients.map(p => ({
        ...p,
        organization_id: seedData.organization.id,
        created_at: seedTimestamp,
        updated_at: seedTimestamp,
    }));
    await prisma.patient.createMany({ data: patientData, skipDuplicates: true });
    console.log(`✅ Seeded ${patientData.length} patients`);
}

// --- Main Seeding and Clearing Functions ---

export async function seedComprehensiveHealthcareData() {
  console.log('📊 Seeding comprehensive healthcare test data...');
  const userEmails = seedData.users.map(u => u.email);

  const existingUsers = await prisma.user.findMany({ where: { email: { in: userEmails } } });
  if (existingUsers.length > 0) {
    console.log(`ℹ️ Test data already exists, skipping seeding.`);
    return;
  }

  await seedUsers();
  await seedOrganization();
  await seedSpecialties();
  await seedDoctors();
  await seedPatients();

  console.log(`🎉 Successfully seeded comprehensive healthcare test data!`);
}

export async function clearTestData() {
  console.log('🗑️ Clearing test data...');
  try {
    const userEmails = seedData.users.map(u => u.email);
    const doctorIds = seedData.doctors.map(d => d.user_id.replace(/-/g, '').substring(0, 32));
    const patientUserIds = seedData.patients.map(p => p.user_id);

    await prisma.$transaction(async (tx) => {
      await tx.patient.deleteMany({ where: { user_id: { in: patientUserIds } } });
      await tx.doctors.deleteMany({ where: { id: { in: doctorIds } } });
      await tx.user.deleteMany({ where: { email: { in: userEmails } } });
      await tx.organization.deleteMany({ where: { id: seedData.organization.id } });
      await tx.speciality.deleteMany({ where: { name: { in: seedData.specialties.map(s => s.name) } } });
    });
    console.log('✅ Test data cleared successfully in transaction');
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
}

// --- Script Execution ---

if (import.meta.url.endsWith(process.argv[1])) {
  seedComprehensiveHealthcareData()
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}