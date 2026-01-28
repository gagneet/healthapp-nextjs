/**
 * Comprehensive Patient Medication Test Data Seeding
 * Creates realistic test data for medication management features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPatientMedications() {
  console.log('🏥 Seeding patient medication test data...');

  try {
    // Find or create test patient
    const testPatientUser = await prisma.user.upsert({
      where: { email: 'patient.test@healthapp.com' },
      update: {},
      create: {
        email: 'patient.test@healthapp.com',
        password: await import('bcryptjs').then(bcrypt =>
          bcrypt.hashSync('Test@123', 10)
        ),
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
        phone: '+1234567890',
        phoneVerified: true,
        status: 'ACTIVE'
      }
    });

    const testPatient = await prisma.patient.upsert({
      where: { userId: testPatientUser.id },
      update: {},
      create: {
        userId: testPatientUser.id,
        dateOfBirth: new Date('1985-06-15'),
        bloodGroup: 'O+',
        emergencyContact: '+1987654321',
        address: '123 Test Street, Test City, TS 12345'
      }
    });

    // Find or create test doctor
    const testDoctorUser = await prisma.user.upsert({
      where: { email: 'doctor.test@healthapp.com' },
      update: {},
      create: {
        email: 'doctor.test@healthapp.com',
        password: await import('bcryptjs').then(bcrypt =>
          bcrypt.hashSync('Test@123', 10)
        ),
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        role: 'DOCTOR',
        phone: '+1234567891',
        phoneVerified: true,
        status: 'ACTIVE'
      }
    });

    const testDoctor = await prisma.doctor.upsert({
      where: { userId: testDoctorUser.id },
      update: {},
      create: {
        userId: testDoctorUser.id,
        registrationNumber: 'MED123456',
        primarySpecialization: 'Internal Medicine',
        yearsOfExperience: 10,
        consultationFee: 100
      }
    });

    // Assign doctor to patient
    await prisma.patientDoctorAssignment.upsert({
      where: {
        patientId_doctorId: {
          patientId: testPatient.id,
          doctorId: testDoctor.id
        }
      },
      update: { isPrimary: true },
      create: {
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        isPrimary: true,
        assignedAt: new Date()
      }
    });

    // Create medicines in database
    const medicines = await Promise.all([
      prisma.medicine.upsert({
        where: { name: 'Metformin' },
        update: {},
        create: {
          name: 'Metformin',
          genericName: 'Metformin Hydrochloride',
          category: 'Antidiabetic',
          manufacturer: 'Generic Pharma',
          strength: '500mg',
          form: 'Tablet',
          description: 'Used to treat type 2 diabetes',
          sideEffects: ['Nausea', 'Diarrhea', 'Upset stomach', 'Dizziness']
        }
      }),
      prisma.medicine.upsert({
        where: { name: 'Lisinopril' },
        update: {},
        create: {
          name: 'Lisinopril',
          genericName: 'Lisinopril',
          category: 'Antihypertensive',
          manufacturer: 'BP Meds Inc',
          strength: '10mg',
          form: 'Tablet',
          description: 'ACE inhibitor for high blood pressure',
          sideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue']
        }
      }),
      prisma.medicine.upsert({
        where: { name: 'Atorvastatin' },
        update: {},
        create: {
          name: 'Atorvastatin',
          genericName: 'Atorvastatin Calcium',
          category: 'Statin',
          manufacturer: 'Cholesterol Solutions',
          strength: '20mg',
          form: 'Tablet',
          description: 'Lowers cholesterol levels',
          sideEffects: ['Muscle pain', 'Headache', 'Nausea', 'Drowsiness']
        }
      }),
      prisma.medicine.upsert({
        where: { name: 'Levothyroxine' },
        update: {},
        create: {
          name: 'Levothyroxine',
          genericName: 'Levothyroxine Sodium',
          category: 'Thyroid Hormone',
          manufacturer: 'Thyroid Health Co',
          strength: '75mcg',
          form: 'Tablet',
          description: 'Thyroid hormone replacement',
          sideEffects: ['Anxiety', 'Insomnia', 'Headache', 'Rash']
        }
      })
    ]);

    // Create care plan
    const carePlan = await prisma.carePlan.create({
      data: {
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        diagnosis: 'Type 2 Diabetes, Hypertension, Hyperlipidemia',
        goals: 'Control blood sugar, manage blood pressure, lower cholesterol',
        notes: 'Patient requires regular monitoring',
        status: 'ACTIVE',
        startDate: new Date(),
        reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      }
    });

    // Create care plan medications
    const carePlanMedications = await Promise.all([
      prisma.carePlanMedication.create({
        data: {
          carePlanId: carePlan.id,
          medicineId: medicines[0].id, // Metformin
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: 90,
          instructions: 'Take with meals',
          startDate: new Date(),
          isActive: true
        }
      }),
      prisma.carePlanMedication.create({
        data: {
          carePlanId: carePlan.id,
          medicineId: medicines[1].id, // Lisinopril
          dosage: '10mg',
          frequency: 'Once daily',
          duration: 90,
          instructions: 'Take in the morning',
          startDate: new Date(),
          isActive: true
        }
      }),
      prisma.carePlanMedication.create({
        data: {
          carePlanId: carePlan.id,
          medicineId: medicines[2].id, // Atorvastatin
          dosage: '20mg',
          frequency: 'Once daily',
          duration: 90,
          instructions: 'Take at bedtime',
          startDate: new Date(),
          isActive: true
        }
      }),
      prisma.carePlanMedication.create({
        data: {
          carePlanId: carePlan.id,
          medicineId: medicines[3].id, // Levothyroxine
          dosage: '75mcg',
          frequency: 'Once daily',
          duration: 90,
          instructions: 'Take on empty stomach, 30 min before breakfast',
          startDate: new Date(),
          isActive: true
        }
      })
    ]);

    // Create medication logs for the past 30 days
    const medicationLogs = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const logDate = new Date(today);
      logDate.setDate(logDate.getDate() - i);
      logDate.setHours(8, 0, 0, 0);

      for (const carePlanMed of carePlanMedications) {
        // Create morning dose
        const status = Math.random() > 0.15 ? 'TAKEN' : (Math.random() > 0.5 ? 'MISSED' : 'LATE');

        const log = await prisma.medicationLog.create({
          data: {
            patientId: testPatient.id,
            carePlanMedicationId: carePlanMed.id,
            scheduledTime: logDate,
            actualTime: status === 'TAKEN' || status === 'LATE'
              ? new Date(logDate.getTime() + (status === 'LATE' ? 2 * 60 * 60 * 1000 : 0))
              : null,
            status: status as any,
            dosageTaken: status === 'TAKEN' || status === 'LATE' ? carePlanMed.dosage : null,
            notes: status === 'LATE' ? 'Took medication late' : null,
            pointsEarned: status === 'TAKEN' ? 10 : 0
          }
        });

        medicationLogs.push(log);

        // Add side effects for some medications (5% chance)
        if (Math.random() < 0.05 && status === 'TAKEN') {
          const sideEffectIndex = Math.floor(Math.random() * (carePlanMed.medicine?.sideEffects as string[] || []).length);
          const sideEffect = (carePlanMed.medicine?.sideEffects as string[] || [])[sideEffectIndex];

          if (sideEffect) {
            await prisma.medicationLog.update({
              where: { id: log.id },
              data: {
                sideEffects: [{
                  symptom: sideEffect,
                  severity: ['MILD', 'MODERATE', 'SEVERE'][Math.floor(Math.random() * 3)],
                  description: `Experienced ${sideEffect.toLowerCase()} after taking medication`,
                  startedAt: new Date(logDate.getTime() + 30 * 60 * 1000).toISOString()
                }]
              }
            });
          }
        }
      }
    }

    // Create refill requests (some approved, some pending)
    const refillRequests = await Promise.all([
      prisma.refillRequest.create({
        data: {
          patientId: testPatient.id,
          carePlanMedicationId: carePlanMedications[0].id,
          medicineName: medicines[0].name,
          quantity: 60,
          reason: 'Running low on medication',
          urgency: 'NORMAL',
          status: 'APPROVED',
          requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          reviewedBy: testDoctor.id,
          reviewNotes: 'Approved - patient adherence good'
        }
      }),
      prisma.refillRequest.create({
        data: {
          patientId: testPatient.id,
          carePlanMedicationId: carePlanMedications[1].id,
          medicineName: medicines[1].name,
          quantity: 30,
          reason: 'Going on vacation, need extra supply',
          urgency: 'URGENT',
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.refillRequest.create({
        data: {
          patientId: testPatient.id,
          carePlanMedicationId: carePlanMedications[2].id,
          medicineName: medicines[2].name,
          quantity: 30,
          reason: 'Regular refill',
          urgency: 'NORMAL',
          status: 'DISPENSED',
          requestedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          reviewedBy: testDoctor.id,
          reviewNotes: 'Approved and dispensed'
        }
      })
    ]);

    // Create patient notification preferences
    await prisma.patientNotificationPreference.upsert({
      where: { patientId: testPatient.id },
      update: {},
      create: {
        patientId: testPatient.id,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        medicationReminders: true,
        appointmentReminders: true,
        vitalReminders: true,
        exerciseReminders: true,
        labResultAlerts: true,
        achievementAlerts: true,
        careTeamMessages: true,
        reminderLeadTime: 15,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        timezone: 'America/New_York'
      }
    });

    console.log('✅ Patient medication test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Test Patient: ${testPatientUser.email} (password: Test@123)`);
    console.log(`- Test Doctor: ${testDoctorUser.email} (password: Test@123)`);
    console.log(`- Medicines: ${medicines.length}`);
    console.log(`- Care Plan Medications: ${carePlanMedications.length}`);
    console.log(`- Medication Logs (30 days): ${medicationLogs.length}`);
    console.log(`- Refill Requests: ${refillRequests.length}`);
    console.log(`- Side Effects Reported: ${medicationLogs.filter(l => l.sideEffects).length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('Patient: patient.test@healthapp.com / Test@123');
    console.log('Doctor: doctor.test@healthapp.com / Test@123');

  } catch (error) {
    console.error('❌ Error seeding patient medication data:', error);
    throw error;
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedPatientMedications()
    .then(() => {
      console.log('\n✨ Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedPatientMedications };
