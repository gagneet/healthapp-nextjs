// lib/seed.ts - Complete version with full dataset and linked symptoms + treatments
import { PrismaClient, MedicationOrganizerType, MedicationLogAdherenceStatus } from '@prisma/client';
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

// 🧹 Database cleanup
async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  const cleanupOps = [
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
    () => prisma.speciality.deleteMany({}),
    () => prisma.organization.deleteMany({}),
    () => prisma.user.deleteMany({})
  ];

  for (const op of cleanupOps) {
    try {
      await op();
    } catch (e: any) {
      console.log(`⚠️ ${e.message}`);
    }
  }
}

// 🚀 Main seeding function
async function main() {
  await cleanDatabase();
  const password = await bcrypt.hash('TempPassword123!', 12);

  // 👤 Users
  await prisma.user.createMany({
    data: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'doctor@healthapp.com',
        passwordHash: password,
        role: 'DOCTOR',
        firstName: 'John',
        lastName: 'Smith',
        accountStatus: 'ACTIVE',
        gender: 'MALE',
        createdAt: getRandomPastDate(),
        updatedAt: getRecentDate()
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        email: 'patient1@healthapp.com',
        passwordHash: password,
        role: 'PATIENT',
        firstName: 'Sarah',
        lastName: 'Johnson',
        accountStatus: 'ACTIVE',
        gender: 'FEMALE',
        createdAt: getRandomPastDate(),
        updatedAt: getRecentDate()
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        email: 'patient2@healthapp.com',
        passwordHash: password,
        role: 'PATIENT',
        firstName: 'Michael',
        lastName: 'Chen',
        accountStatus: 'ACTIVE',
        gender: 'MALE',
        createdAt: getRandomPastDate(),
        updatedAt: getRecentDate()
      }
    ]
  });

  // 🏥 Organization
  const org = await prisma.organization.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'HealthApp Medical Center',
      type: 'hospital',
      license_number: 'HC-2025-001',
      is_active: true,
      created_at: getRandomPastDate(),
      updated_at: getRecentDate()
    }
  });

  // 🩺 Doctor
  await prisma.doctor.create({
    data: {
      id: '00000000-0000-0000-0000-000000000011',
      user_id: '00000000-0000-0000-0000-000000000001',
      doctor_id: 'DR001',
      medical_license_number: 'MD123456',
      years_of_experience: 15,
      consultation_fee: 200,
      is_verified: true,
      created_at: getRandomPastDate()
    }
  });

  // 🧑‍⚕️ Patients
  await prisma.patient.createMany({
    data: [
      {
        id: 'pat-1',
        user_id: '77777777-7777-7777-7777-777777777777',
        patient_id: 'PAT-2025-001',
        organization_id: org.id,
        primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
        height_cm: 165,
        weight_kg: 68,
        blood_type: 'A+',
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      },
      {
        id: 'pat-2',
        user_id: '88888888-8888-8888-8888-888888888888',
        patient_id: 'PAT-2025-002',
        organization_id: org.id,
        primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
        height_cm: 178,
        weight_kg: 82,
        blood_type: 'O-',
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      }
    ]
  });

  // 💊 Medicines
  await prisma.medicine.createMany({
    data: [
      {
        id: 'med-1',
        name: 'Metformin',
        description: 'Diabetes medication',
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      },
      {
        id: 'med-2',
        name: 'Lisinopril',
        description: 'Hypertension treatment',
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      }
    ]
  });

  // 🧠 Symptom Database
  await prisma.symptomDatabase.createMany({
    data: [
      {
        id: 'symdb-1',
        diagnosis_name: 'Type 2 Diabetes',
        category: 'Endocrine',
        is_active: true,
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      },
      {
        id: 'symdb-2',
        diagnosis_name: 'Hypertension',
        category: 'Cardiovascular',
        is_active: true,
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      }
    ]
  });

  // 🧪 Treatment Database
  await prisma.treatmentDatabase.createMany({
    data: [
      {
        id: 'treat-1',
        treatment_name: 'Metformin Therapy',
        treatment_type: 'medication',
        description: 'Type 2 diabetes management',
        is_active: true,
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      },
      {
        id: 'treat-2',
        treatment_name: 'ACE Inhibitor Therapy',
        treatment_type: 'medication',
        description: 'For hypertension',
        is_active: true,
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      }
    ]
  });

  // 📋 Care Plans
  await prisma.carePlan.createMany({
    data: [
      {
        id: 'cp-1',
        patient_id: 'pat-1',
        doctor_id: '00000000-0000-0000-0000-000000000011',
        title: 'Diabetes Management Plan',
        description: 'Monitor blood glucose, medication adherence, exercise',
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      },
      {
        id: 'cp-2',
        patient_id: 'pat-2',
        doctor_id: '00000000-0000-0000-0000-000000000011',
        title: 'Hypertension Control Plan',
        description: 'Daily BP check, low-salt diet, regular exercise',
        created_at: getRandomPastDate(),
        updated_at: getRecentDate()
      }
    ]
  });

// 🩺 Symptoms linked to patients
await prisma.symptom.createMany({
  data: [
    {
      id: 'sym-1',
      patient_id: 'pat-1',
      symptomDatabase_id: 'symdb-1',
      notes: 'Elevated blood glucose, fatigue',
      created_at: getRecentDate(),
      updated_at: getRecentDate()
    },
    {
      id: 'sym-2',
      patient_id: 'pat-2',
      symptomDatabase_id: 'symdb-2',
      notes: 'Persistent high BP, headaches',
      created_at: getRecentDate(),
      updated_at: getRecentDate()
    }
  ]
});

// 💊 Treatments linked to care plans
await prisma.treatmentDatabase.update({
  where: { id: 'treat-1' },
  data: {
    carePlans: {
      connect: { id: 'cp-1' }
    }
  }
});

await prisma.treatmentDatabase.update({
  where: { id: 'treat-2' },
  data: {
    carePlans: {
      connect: { id: 'cp-2' }
    }
  }
});

// 🗂️ Medications
await prisma.medication.createMany({
  data: [
    {
      id: 'medication-1',
      patient_id: 'pat-1',
      medicine_id: 'med-1',
      dosage: '500mg',
      frequency: 'Twice daily',
      route: 'Oral',
      start_date: getRandomPastDate(),
      end_date: getFutureDate(30),
      instructions: 'Take with meals',
      organizer_type: MedicationOrganizerType.PILLBOX,
      created_at: getRandomPastDate(),
      updated_at: getRecentDate()
    },
    {
      id: 'medication-2',
      patient_id: 'pat-2',
      medicine_id: 'med-2',
      dosage: '10mg',
      frequency: 'Once daily',
      route: 'Oral',
      start_date: getRandomPastDate(),
      end_date: getFutureDate(30),
      instructions: 'Take in the morning',
      organizer_type: MedicationOrganizerType.PILLPACK,
      created_at: getRandomPastDate(),
      updated_at: getRecentDate()
    }
  ]
});

// 📈 Adherence Records
await prisma.adherenceRecord.createMany({
  data: [
    {
      id: 'adh-1',
      patient_id: 'pat-1',
      medication_id: 'medication-1',
      status: MedicationLogAdherenceStatus.TAKEN,
      recorded_at: new Date(),
      created_at: getRecentDate(),
      updated_at: getRecentDate()
    },
    {
      id: 'adh-2',
      patient_id: 'pat-2',
      medication_id: 'medication-2',
      status: MedicationLogAdherenceStatus.MISSED,
      recorded_at: new Date(),
      created_at: getRecentDate(),
      updated_at: getRecentDate()
    }
  ]
});

// 📅 Appointment
await prisma.appointment.create({
  data: {
    id: 'appt-1',
    doctor_id: '00000000-0000-0000-0000-000000000011',
    patient_id: 'pat-1',
    start_date: new Date(),
    start_time: new Date(),
    end_time: getFutureDate(),
    description: 'Routine checkup',
    createdAt: getRecentDate()
  }
});

console.log('✅ Full seed data (users, patients, symptoms, treatments, care plans, adherence) created successfully');

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });