
import { AlertLevel, DurationUnit, Gender, MedicationFrequency, MedicationPrescriptionStatus, PrescriptionStatus, PrismaClient, UserRole, VitalStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding doctor data...');

    // 1. Create a Doctor
    const doctorEmail = 'doctor@healthapp.com';
    const doctorPassword = await hash('password123', 10);

    const doctorUser = await prisma.user.upsert({
        where: { email: doctorEmail },
        update: {},
        create: {
            email: doctorEmail,
            password: doctorPassword,
            firstName: 'Rajesh',
            lastName: 'Sharma',
            role: UserRole.DOCTOR,
            status: 'ACTIVE',
            phone: '+919876543210',
            phoneVerified: true,
        },
    });

    const doctor = await prisma.doctor.upsert({
        where: { userId: doctorUser.id },
        update: {},
        create: {
            userId: doctorUser.id,
            businessId: 'DOC-SHARMA-001',
            registrationNumber: 'MCI-123456',
            registrationCouncil: 'Delhi Medical Council',
            qualifications: { degrees: ['MBBS', 'MD (Internal Medicine)'] },
            specializations: ['Internal Medicine', 'Diabetology'],
            primarySpecialization: 'Internal Medicine',
            experience: 15,
            consultationFee: 500,
            status: 'ACTIVE',
        },
    });

    // 2. Create Common Medicines
    const medicines = await Promise.all([
        prisma.medicine.create({ data: { name: 'Metformin', dosageForm: 'Tablet', strength: '500mg' } }),
        prisma.medicine.create({ data: { name: 'Amlodipine', dosageForm: 'Tablet', strength: '5mg' } }),
        prisma.medicine.create({ data: { name: 'Atorvastatin', dosageForm: 'Tablet', strength: '10mg' } }),
    ]);

    // 3. Create Patients with different risk profiles
    // Patient 1: High Risk (Low Adherence + Critical Vitals)
    await createPatient(
        { firstName: 'Amit', lastName: 'Verma', email: 'amit@example.com', gender: Gender.MALE },
        doctor.id,
        medicines,
        'HIGH_RISK'
    );

    // Patient 2: Low Adherence (Medium Risk)
    await createPatient(
        { firstName: 'Sneha', lastName: 'Gupta', email: 'sneha@example.com', gender: Gender.FEMALE },
        doctor.id,
        medicines,
        'LOW_ADHERENCE'
    );

    // Patient 3: Stable (Low Risk)
    await createPatient(
        { firstName: 'Rahul', lastName: 'Singh', email: 'rahul@example.com', gender: Gender.MALE },
        doctor.id,
        medicines,
        'STABLE'
    );

    // Patient 4: Recent Refill Request
    await createPatient(
        { firstName: 'Priya', lastName: 'Das', email: 'priya@example.com', gender: Gender.FEMALE },
        doctor.id,
        medicines,
        'REFILL_NEEDED'
    );

    console.log('Seeding finished.');
}

async function createPatient(
    userData: any,
    doctorId: string,
    medicines: any[],
    profile: 'HIGH_RISK' | 'LOW_ADHERENCE' | 'STABLE' | 'REFILL_NEEDED'
) {
    const user = await prisma.user.create({
        data: {
            ...userData,
            password: await hash('password123', 10),
            role: UserRole.PATIENT,
            status: 'ACTIVE',
        }
    });

    const patient = await prisma.patient.create({
        data: {
            userId: user.id,
            businessId: `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            dateOfBirth: new Date('1980-01-01'),
            gender: userData.gender,
            allergies: profile === 'HIGH_RISK' ? ['Penicillin'] : [],
            chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        }
    });

    // Assign Doctor
    await prisma.patientDoctorAssignment.create({
        data: {
            doctorId,
            patientId: patient.id,
            isPrimary: true,
        }
    });

    // Create active prescription
    const prescription = await prisma.prescription.create({
        data: {
            patientId: patient.id,
            doctorId: doctorId,
            prescriptionNumber: `RX-${Date.now()}-${user.lastName}`,
            status: PrescriptionStatus.ACTIVE,
            diagnosis: ['Hypertension'],
        }
    });

    // Add meds to prescription
    const meds = await Promise.all(medicines.map(m =>
        prisma.prescriptionMedication.create({
            data: {
                prescriptionId: prescription.id,
                medicineId: m.id,
                medicineName: m.name,
                dosageForm: m.dosageForm,
                strength: m.strength,
                dosage: '1 tablet',
                frequency: MedicationFrequency.ONCE_DAILY,
                duration: 30,
                durationUnit: DurationUnit.DAYS,
                status: MedicationPrescriptionStatus.ACTIVE,
            }
        })
    ));

    // Generate Logs based on profile
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);

        // Adherence Pattern
        let status = 'TAKEN';
        if (profile === 'HIGH_RISK' || profile === 'LOW_ADHERENCE') {
            // 50% chance of missing
            status = Math.random() > 0.5 ? 'MISSED' : 'TAKEN';
        }

        await prisma.medicationLog.create({
            data: {
                patientId: patient.id,
                prescriptionMedicationId: meds[0].id,
                scheduledTime: date,
                actualTime: status === 'TAKEN' ? date : undefined,
                status: status as any,
            }
        });
    }

    // Generate Vitals based on profile
    if (profile === 'HIGH_RISK') {
        // Critical BP
        const vitalType = await prisma.vitalType.findFirst({ where: { name: 'Blood Pressure' } }); // Assuming exists or need to create?
        // Let's create dummy vital type if we can't be sure it exists, but usually we seed ref data first.
        // For now, I'll rely on creating one if needed in a real app, but here I'll try to find or create.
        const bpType = await prisma.vitalType.upsert({
            where: { code: 'BP' },
            update: {},
            create: {
                code: 'BP',
                name: 'Blood Pressure',
                unit: 'mmHg',
                dataType: 'COMPOUND',
                category: 'CARDIOVASCULAR',
                isCompound: true
            }
        });

        await prisma.vitalReading.create({
            data: {
                patientId: patient.id,
                vitalTypeId: bpType.id,
                components: { systolic: 180, diastolic: 110 },
                status: VitalStatus.CRITICAL,
                alertLevel: AlertLevel.CRITICAL,
                alertMessage: 'Hypertensive Crisis',
                recordedAt: new Date(),
            }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
