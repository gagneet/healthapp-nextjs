/**
 * Next.js API Services Layer with Prisma
 * 
 * This module provides healthcare-specific API functions that work with Next.js 14
 * using Prisma ORM for type-safe database operations.
 */

import { prisma, healthcareDb } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, Patient, doctors, hsps } from './prisma-client';

// Type definitions for API responses
export interface APIResponse<T = any> {
  status: boolean;
  statusCode: number;
  payload: {
    data?: T;
    message?: string;
    error?: {
      status: string;
      message: string;
    };
  };
}

export interface AuthResult {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
      firstName?: string | null;
      lastName?: string | null;
    };
  };
  message?: string;
}

/**
 * Healthcare Authentication Services with Prisma
 */

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user with healthcare provider/patient details
    const user = await healthcareDb.getUserWithProvider(
      await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true }
      }).then(u => u?.id || '')
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Check account status
    if (user.account_status !== 'ACTIVE') {
      return {
        success: false,
        message: `Account is ${user.account_status.toLowerCase()}`
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'healthcare-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed'
    };
  }
}

/**
 * Verify JWT token and return user data
 */
export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthcare-secret-key') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        account_status: true,
      }
    });

    if (!user || user.account_status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };
  } catch (error) {
    return null;
  }
}

/**
 * Create new user with healthcare role
 */
export async function createUser(userData: {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });

    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        password_hash: hashedPassword,
        role: userData.role as any,
        first_name: userData.firstName,
        last_name: userData.lastName,
        account_status: 'PENDING_VERIFICATION'
      }
    });

    // Create specialized profile based on role
    if (userData.role === 'PATIENT') {
      await prisma.patient.create({
        data: {
          user_id: user.id,
          // Add any additional patient-specific fields from userData
        }
      });
    } else if (userData.role === 'DOCTOR' || userData.role === 'HSP') {
      await prisma.healthcareProvider.create({
        data: {
          user_id: user.id,
          hsp_type: userData.role === 'HSP' ? userData.hspType : undefined,
          can_prescribe_medications: userData.role === 'DOCTOR',
          can_diagnose: userData.role === 'DOCTOR',
          can_create_care_plans: userData.role === 'DOCTOR',
        }
      });
    }

    return {
      success: true,
      data: {
        token: '', // Token will be generated on login
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    };
  } catch (error) {
    console.error('User creation error:', error);
    return {
      success: false,
      message: 'Failed to create user'
    };
  }
}

/**
 * Healthcare Patient Services with Prisma
 */

/**
 * Get patients assigned to a doctor with pagination
 */
export async function getPatients(doctorId: string, pagination: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const skip = (pagination.page - 1) * pagination.limit;
    
    // Build where clause
    const whereClause: any = {
      patient_doctor_assignments: {
        some: {
          doctor_id: doctorId,
          is_active: true,
        },
      },
    };

    // Add search functionality
    if (pagination.search) {
      whereClause.OR = [
        {
          user: {
            first_name: {
              contains: pagination.search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            last_name: {
              contains: pagination.search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: pagination.search,
              mode: 'insensitive',
            },
          },
        },
        {
          patient_id: {
            contains: pagination.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get patients with user details
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: pagination.limit,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone_number: true,
              date_of_birth: true,
            },
          },
          primary_doctor: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
              speciality: true,
            },
          },
          _count: {
            select: {
              medications: true,
              appointments: true,
              vital_readings: true,
            },
          },
        },
        orderBy: {
          [pagination.sortBy === 'name' ? 'user' : pagination.sortBy || 'created_at']: 
            pagination.sortBy === 'name' 
              ? { first_name: pagination.sortOrder || 'asc' }
              : pagination.sortOrder || 'desc'
        },
      }),
      prisma.patient.count({ where: whereClause }),
    ]);

    return {
      patients: patients.map(patient => ({
        id: patient.id,
        patientId: patient.patient_id,
        firstName: patient.user.first_name,
        lastName: patient.user.last_name,
        email: patient.user.email,
        phone: patient.user.phone_number,
        dateOfBirth: patient.user.date_of_birth,
        primaryDoctor: patient.primary_doctor ? {
          name: `${patient.primary_doctor.user.first_name} ${patient.primary_doctor.user.last_name}`,
          speciality: patient.primary_doctor.speciality?.name,
        } : null,
        stats: {
          medicationsCount: patient._count.medications,
          appointmentsCount: patient._count.appointments,
          vitalsCount: patient._count.vital_readings,
        },
        createdAt: patient.created_at,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  } catch (error) {
    console.error('Get patients error:', error);
    throw new Error('Failed to retrieve patients');
  }
}

/**
 * Get detailed patient information by ID
 */
export async function getPatient(patientId: string) {
  try {
    const patient = await healthcareDb.getPatientWithMedicalRecords(patientId);
    
    if (!patient) {
      return null;
    }

    // Calculate adherence rate
    const adherenceData = await healthcareDb.getPatientAdherence(patientId);

    return {
      id: patient.id,
      patientId: patient.patient_id,
      medicalRecordNumber: patient.medical_record_number,
      user: {
        firstName: patient.user.first_name,
        lastName: patient.user.last_name,
        email: patient.user.email,
        phone: patient.user.phone_number,
        dateOfBirth: patient.user.date_of_birth,
        gender: patient.user.gender,
      },
      medicalInfo: {
        bloodType: patient.blood_type,
        allergies: patient.allergies,
        medicalConditions: patient.medical_conditions,
        medicalHistory: patient.medical_history,
        height: patient.height_cm,
        weight: patient.weight_kg,
      },
      careTeam: {
        primaryDoctor: patient.primary_doctor ? {
          id: patient.primary_doctor.id,
          name: `${patient.primary_doctor.user.first_name} ${patient.primary_doctor.user.last_name}`,
          speciality: patient.primary_doctor.speciality?.name,
        } : null,
        careCoordinator: patient.care_coordinator ? {
          id: patient.care_coordinator.id,
          name: `${patient.care_coordinator.user.first_name} ${patient.care_coordinator.user.last_name}`,
        } : null,
      },
      carePlans: patient.care_plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        status: plan.status,
        startDate: plan.start_date,
        endDate: plan.end_date,
        doctor: {
          name: `${plan.doctor.user.first_name} ${plan.doctor.user.last_name}`,
        },
        medicationsCount: plan.medications.length,
      })),
      medications: patient.medications.map(med => ({
        id: med.id,
        medicine: {
          name: med.medicine.name,
          genericName: med.medicine.generic_name,
        },
        dosage: med.dosage,
        frequency: med.frequency,
        isActive: med.is_active,
        adherenceScore: med.adherence_score,
        prescriber: {
          name: `${med.prescriber.user.first_name} ${med.prescriber.user.last_name}`,
        },
        recentAdherence: med.adherence_records.slice(0, 5),
      })),
      appointments: patient.appointments.slice(0, 10).map(apt => ({
        id: apt.id,
        date: apt.scheduled_date,
        time: apt.scheduled_time,
        status: apt.status,
        type: apt.appointment_type,
        doctor: {
          name: `${apt.doctor.user.first_name} ${apt.doctor.user.last_name}`,
        },
        clinic: apt.clinic?.name,
      })),
      vitals: patient.vital_readings.slice(0, 20).map(vital => ({
        id: vital.id,
        type: vital.vital_type.name,
        value: vital.value_primary,
        secondaryValue: vital.value_secondary,
        unit: vital.unit,
        measuredAt: vital.measured_at,
        isCritical: vital.is_critical,
      })),
      adherence: adherenceData,
      symptoms: patient.symptoms.slice(0, 10).map(symptom => ({
        id: symptom.id,
        name: symptom.symptom_name,
        severity: symptom.severity,
        description: symptom.description,
        onsetDate: symptom.onset_date,
        createdAt: symptom.created_at,
      })),
    };
  } catch (error) {
    console.error('Get patient error:', error);
    throw new Error('Failed to retrieve patient');
  }
}

/**
 * Create a new patient
 */
export async function createPatient(patientData: {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  gender?: string;
  doctorId: string;
  [key: string]: any;
}) {
  try {
    // Create user and patient in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: patientData.email.toLowerCase(),
          password_hash: await bcrypt.hash('temp-password', 12),
          role: 'PATIENT',
          first_name: patientData.firstName,
          last_name: patientData.lastName,
          date_of_birth: patientData.dateOfBirth,
          phone_number: patientData.phone,
          gender: patientData.gender as any,
          account_status: 'PENDING_VERIFICATION',
        },
      });

      // Create patient profile
      const patient = await tx.patient.create({
        data: {
          user_id: user.id,
          primary_doctor_id: patientData.doctorId,
          blood_type: patientData.bloodType,
          allergies: patientData.allergies || [],
          medical_conditions: patientData.medicalConditions || [],
          height_cm: patientData.height,
          weight_kg: patientData.weight,
          emergency_contacts: patientData.emergencyContacts || [],
        },
      });

      // Create doctor-patient assignment
      await tx.patientDoctorAssignment.create({
        data: {
          patient_id: patient.id,
          doctor_id: patientData.doctorId,
          assignment_type: 'primary',
          is_active: true,
        },
      });

      return { user, patient };
    });

    return {
      id: result.patient.id,
      userId: result.user.id,
      firstName: result.user.first_name,
      lastName: result.user.last_name,
      email: result.user.email,
      createdAt: result.patient.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Create patient error:', error);
    throw new Error('Failed to create patient');
  }
}

/**
 * Get doctor dashboard with real healthcare metrics using introspected schema
 */
export async function getDoctorDashboard(doctorUserId: string) {
  try {
    // First, get the doctor record from introspected schema
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: doctorUserId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        speciality: true,
      },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Get dashboard statistics
    const [
      totalPatients,
      todayAppointments,
      activeCarePlans,
      recentVitals,
      upcomingAppointments,
    ] = await Promise.all([
      // Total patients assigned to this doctor
      prisma.patient_doctor_assignments.count({
        where: {
          doctor_id: doctor.id,
          is_active: true,
        },
      }),

      // Today's appointments
      prisma.appointments.count({
        where: {
          participant_one_id: doctor.id,
          start_time: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
      }),

      // Active care plans created by this doctor
      prisma.care_plans.count({
        where: {
          created_by_doctor_id: doctor.id,
          status: 'ACTIVE',
        },
      }),

      // Recent vital readings from assigned patients (last 24 hours)
      prisma.vital_readings.findMany({
        where: {
          patient: {
            patient_doctor_assignments: {
              some: {
                doctor_id: doctor.id,
                is_active: true,
              },
            },
          },
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
          vital_type: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10,
      }),

      // Upcoming appointments
      prisma.appointments.findMany({
        where: {
          participant_one_id: doctor.id,
          start_time: {
            gte: new Date(),
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          start_time: 'asc',
        },
        take: 5,
      }),
    ]);

    // Get recent patient assignments
    const recentPatients = await prisma.patient_doctor_assignments.findMany({
      where: {
        doctor_id: doctor.id,
        is_active: true,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        assigned_date: 'desc',
      },
      take: 5,
    });

    return {
      doctor: {
        id: doctor.id,
        name: `${doctor.user.first_name} ${doctor.user.last_name}`,
        email: doctor.user.email,
        speciality: doctor.speciality?.name,
      },
      statistics: {
        totalPatients,
        todayAppointments,
        activeCarePlans,
        recentVitalsCount: recentVitals.length,
      },
      recentActivity: {
        vitals: recentVitals.map(vital => ({
          id: vital.id,
          patient: `${vital.patient.user.first_name} ${vital.patient.user.last_name}`,
          vitalType: vital.vital_type.name,
          value: vital.value || vital.systolic_value,
          secondaryValue: vital.diastolic_value,
          unit: vital.unit,
          recordedAt: vital.created_at,
          alertLevel: vital.alert_level,
        })),
        recentPatients: recentPatients.map(assignment => ({
          id: assignment.patient.id,
          name: `${assignment.patient.user.first_name} ${assignment.patient.user.last_name}`,
          email: assignment.patient.user.email,
          assignedDate: assignment.assigned_date,
          assignmentType: assignment.assignment_type,
        })),
      },
      upcomingAppointments: upcomingAppointments.map(apt => ({
        id: apt.id,
        patient: apt.patient ? `${apt.patient.user.first_name} ${apt.patient.user.last_name}` : 'Unknown',
        scheduledTime: apt.start_time,
        duration: apt.duration_minutes || 30,
        status: apt.status,
        type: apt.participant_one_type,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Get doctor dashboard error:', error);
    throw new Error('Failed to retrieve dashboard data');
  }
}

/**
 * Get patient dashboard with real healthcare data using introspected schema
 */
export async function getPatientDashboard(patientId: string) {
  try {
    // Get patient with related data
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            date_of_birth: true,
            gender: true,
          },
        },
        primary_care_doctor: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
            speciality: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get dashboard statistics
    const [
      upcomingAppointments,
      recentVitals,
      medications,
      adherenceRecords,
      carePlans,
    ] = await Promise.all([
      // Upcoming appointments
      prisma.appointments.findMany({
        where: {
          participant_two_id: patientId,
          start_time: {
            gte: new Date(),
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
        include: {
          doctors: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
              speciality: true,
            },
          },
        },
        orderBy: {
          start_time: 'asc',
        },
        take: 5,
      }),

      // Recent vital readings (last 30 days)
      prisma.vital_readings.findMany({
        where: {
          patient_id: patientId,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          vital_type: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10,
      }),

      // Current medications
      prisma.medications.findMany({
        where: {
          participant_id: patientId,
          end_date: {
            gte: new Date(), // Active medications
          },
        },
        include: {
          medicine: true,
        },
        orderBy: {
          start_date: 'desc',
        },
        take: 10,
      }),

      // Recent adherence records (last 7 days)
      prisma.adherence_records.findMany({
        where: {
          patient_id: patientId,
          scheduled_datetime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          medication: {
            include: {
              medicine: true,
            },
          },
        },
        orderBy: {
          scheduled_datetime: 'desc',
        },
        take: 20,
      }),

      // Active care plans
      prisma.care_plans.findMany({
        where: {
          patient_id: patientId,
          status: 'ACTIVE',
        },
        include: {
          doctors: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
              speciality: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    // Calculate adherence score
    const totalScheduled = adherenceRecords.length;
    const totalTaken = adherenceRecords.filter(record => record.was_taken).length;
    const adherenceScore = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

    // Calculate age
    const age = patient.user.date_of_birth 
      ? Math.floor((new Date().getTime() - new Date(patient.user.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return {
      patient: {
        id: patient.id,
        name: `${patient.user.first_name} ${patient.user.last_name}`,
        email: patient.user.email,
        age,
        gender: patient.user.gender,
        medicalRecordNumber: patient.medical_record_number,
        primaryDoctor: patient.primary_care_doctor ? {
          id: patient.primary_care_doctor.id,
          name: `${patient.primary_care_doctor.user.first_name} ${patient.primary_care_doctor.user.last_name}`,
          speciality: patient.primary_care_doctor.speciality?.name,
        } : null,
      },
      statistics: {
        upcomingAppointmentsCount: upcomingAppointments.length,
        activeMedicationsCount: medications.length,
        recentVitalsCount: recentVitals.length,
        activeCarePlansCount: carePlans.length,
        adherenceScore,
      },
      upcomingAppointments: upcomingAppointments.map(apt => ({
        id: apt.id,
        doctor: apt.doctors ? `${apt.doctors.user.first_name} ${apt.doctors.user.last_name}` : 'Unknown',
        speciality: apt.doctors?.speciality?.name,
        scheduledTime: apt.start_time,
        duration: apt.duration_minutes || 30,
        status: apt.status,
        type: apt.participant_one_type,
      })),
      medications: medications.map(med => ({
        id: med.id,
        name: med.medicine.name,
        description: med.description,
        startDate: med.start_date,
        endDate: med.end_date,
        rrule: med.rr_rule, // Recurrence rule for scheduling
      })),
      recentVitals: recentVitals.map(vital => ({
        id: vital.id,
        type: vital.vital_type.name,
        value: vital.value || vital.systolic_value,
        secondaryValue: vital.diastolic_value,
        unit: vital.unit,
        recordedAt: vital.created_at,
        alertLevel: vital.alert_level,
      })),
      carePlans: carePlans.map(plan => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        startDate: plan.start_date,
        doctor: plan.doctors ? `${plan.doctors.user.first_name} ${plan.doctors.user.last_name}` : 'Unknown',
        chronicConditions: plan.chronic_conditions,
        nextReviewDate: plan.next_review_date,
      })),
      adherence: {
        score: adherenceScore,
        totalScheduled,
        totalTaken,
        recentRecords: adherenceRecords.slice(0, 5).map(record => ({
          id: record.id,
          medication: record.medication.medicine.name,
          scheduledTime: record.scheduled_datetime,
          takenTime: record.taken_datetime,
          wasTaken: record.was_taken,
          notes: record.notes,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Get patient dashboard error:', error);
    throw new Error('Failed to retrieve patient dashboard data');
  }
}

/**
 * Medication Services
 */
export async function getMedications(searchParams: any) {
  // Mock medication search - replace with actual implementation
  return {
    medications: [
      {
        id: '1',
        name: 'Aspirin',
        genericName: 'Acetylsalicylic acid',
        dosage: '100mg',
        category: 'Pain reliever'
      },
      {
        id: '2',
        name: 'Metformin',
        genericName: 'Metformin hydrochloride',
        dosage: '500mg',
        category: 'Antidiabetic'
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1
    }
  };
}

export async function createMedication(medicationData: any) {
  // Mock medication creation - replace with actual implementation
  return {
    id: Date.now().toString(),
    ...medicationData,
    createdAt: new Date().toISOString()
  };
}

/**
 * Scheduling Services
 */
export async function getAppointments(params: any) {
  // Mock appointments - replace with actual implementation
  return {
    appointments: [
      {
        id: '1',
        patientId: '1',
        doctorId: '1',
        date: '2025-01-15',
        time: '10:00',
        type: 'consultation',
        status: 'scheduled'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  };
}

export async function createAppointment(appointmentData: any) {
  // Mock appointment creation - replace with actual implementation
  return {
    id: Date.now().toString(),
    ...appointmentData,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
}

/**
 * Health Check Service
 */
export async function getHealthStatus() {
  // Mock health check - replace with actual database connection check
  return {
    status: 'healthy',
    database: 'connected (mock)',
    api: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
}

/**
 * Utility function to safely handle API errors
 */
export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  return {
    status: false,
    statusCode: 500,
    payload: {
      error: {
        status: 'error',
        message: error.message || 'Internal server error'
      }
    }
  };
}

/**
 * Utility function to format API success responses
 */
export function formatApiSuccess(data: any, message: string = 'Success') {
  return {
    status: true,
    statusCode: 200,
    payload: {
      data,
      message
    }
  };
}