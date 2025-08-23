// src/seeders/007-complete-test-profiles.ts
'use strict';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    console.log('🏥 Creating complete test profiles (Patient, Doctor, Admin)...');
    
    // First ensure specialities exist (idempotent)
    const existingSpecialities = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM specialities",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingSpecialities[0].count === 0) {
      console.log('📋 Creating basic specialities...');
      await queryInterface.bulkInsert('specialities', [
        {
          id: 1,
          name: 'General Medicine',
          description: 'General practice and family medicine',
          category: 'primary_care',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Cardiology',
          description: 'Heart and cardiovascular system',
          category: 'specialist',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Internal Medicine',
          description: 'Internal medicine and adult primary care',
          category: 'primary_care',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { ignoreDuplicates: true });
    }

    // Hash password for test users
    const passwordHash = await bcrypt.hash('password123', 10);

    // Get existing users or create them
    let users = await queryInterface.sequelize.query(
      "SELECT id, email, role FROM users WHERE email IN ('admin@healthapp.com', 'doctor@healthapp.com', 'patient@healthapp.com')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create missing users
    const existingEmails = users.map((u: any) => u.email);
    const usersToCreate = [];

    if (!existingEmails.includes('admin@healthapp.com')) {
      usersToCreate.push({
        id: '11111111-1111-1111-1111-111111111111', // Deterministic UUID for admin
        email: 'admin@healthapp.com',
        password_hash: passwordHash,
        role: 'SYSTEM_ADMIN',
        account_status: 'ACTIVE',
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+1-555-0001',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (!existingEmails.includes('doctor@healthapp.com')) {
      usersToCreate.push({
        id: '22222222-2222-2222-2222-222222222222', // Deterministic UUID for doctor
        email: 'doctor@healthapp.com',
        password_hash: passwordHash,
        role: 'DOCTOR',
        account_status: 'ACTIVE',
        first_name: 'Dr. John',
        last_name: 'Doe',
        middle_name: 'Michael',
        phone: '+1-555-0002',
        date_of_birth: '1980-05-15',
        gender: 'MALE',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (!existingEmails.includes('patient@healthapp.com')) {
      usersToCreate.push({
        id: '33333333-3333-3333-3333-333333333333', // Deterministic UUID for patient
        email: 'patient@healthapp.com',
        password_hash: passwordHash,
        role: 'PATIENT',
        account_status: 'ACTIVE',
        first_name: 'Jane',
        last_name: 'Patient',
        middle_name: 'Elizabeth',
        phone: '+1-555-0003',
        date_of_birth: '1990-08-22',
        gender: 'FEMALE',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (usersToCreate.length > 0) {
      await queryInterface.bulkInsert('users', usersToCreate, { ignoreDuplicates: true });
      console.log(`✅ Created ${usersToCreate.length} new users`);
    }

    // Re-fetch all users after creation
    users = await queryInterface.sequelize.query(
      "SELECT id, email, role FROM users WHERE email IN ('admin@healthapp.com', 'doctor@healthapp.com', 'patient@healthapp.com')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminUser = users.find((u: any) => u.email === 'admin@healthapp.com');
    const doctorUser = users.find((u: any) => u.email === 'doctor@healthapp.com');
    const patientUser = users.find((u: any) => u.email === 'patient@healthapp.com');

    // CREATE DOCTOR PROFILE
    if (doctorUser) {
      const existingDoctor = await queryInterface.sequelize.query(
        "SELECT id FROM doctors WHERE user_id = :userId",
        { 
          replacements: { userId: doctorUser.id },
          type: Sequelize.QueryTypes.SELECT 
        }
      );

      if (existingDoctor.length === 0) {
        const doctorId = '44444444-4444-4444-4444-444444444444'; // Deterministic UUID for doctor profile
        await queryInterface.bulkInsert('doctors', [{
          id: doctorId,
          user_id: doctorUser.id,
          medical_license_number: 'LIC-TX-123456789',
          npi_number: '1234567890',
          speciality_id: 1, // General Medicine
          specialties: ['general medicine', 'family practice'],
          board_certifications: ['American Board of Family Medicine'],
          medical_school: 'University of Texas Medical School',
          residency_programs: JSON.stringify([
            {
              program: 'Family Medicine Residency',
              institution: 'Houston Methodist Hospital',
              year_completed: 2008
            }
          ]),
          years_of_experience: 15,
          is_verified: true,
          verification_date: new Date(),
          verified_by: adminUser?.id,
          consultation_fee: 150.00,
          practice_name: 'Dr. John Doe Family Practice',
          practice_address: JSON.stringify({
            street: '123 Medical Center Drive',
            city: 'Houston',
            state: 'TX',
            zipcode: '77001',
            country: 'USA'
          }),
          practice_phone: '+1-555-123-4567',
          languages_spoken: ['en', 'es'],
          total_patients: 0,
          active_treatment_plans: 0,
          active_care_plans: 0,
          average_rating: 4.8,
          total_reviews: 127,
          is_available_online: true,
          created_at: new Date(),
          updated_at: new Date()
        }], { ignoreDuplicates: true });

        // Create a clinic for the doctor
        await queryInterface.bulkInsert('clinics', [{
          id: '55555555-5555-5555-5555-555555555555', // Deterministic UUID for clinic
          doctor_id: doctorId,
          name: 'Main Family Practice Clinic',
          address: JSON.stringify({
            street: '123 Medical Center Drive',
            city: 'Houston',
            state: 'TX',
            zipcode: '77001',
            country: 'USA'
          }),
          phone: '+1-555-123-4567',
          email: 'clinic@drjohndoe.com',
          operating_hours: JSON.stringify({
            monday: { start: '08:00', end: '17:00', available: true },
            tuesday: { start: '08:00', end: '17:00', available: true },
            wednesday: { start: '08:00', end: '17:00', available: true },
            thursday: { start: '08:00', end: '17:00', available: true },
            friday: { start: '08:00', end: '16:00', available: true },
            saturday: { available: false },
            sunday: { available: false }
          }),
          services_offered: ['consultation', 'preventive_care', 'chronic_disease_management', 'vaccinations'],
          is_primary: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }], { ignoreDuplicates: true });

        console.log('✅ Complete doctor profile created for doctor@healthapp.com');
      } else {
        console.log('ℹ️ Doctor profile already exists for doctor@healthapp.com');
      }
    }

    // CREATE PATIENT PROFILE
    if (patientUser && doctorUser) {
      const existingPatient = await queryInterface.sequelize.query(
        "SELECT id FROM patients WHERE user_id = :userId",
        { 
          replacements: { userId: patientUser.id },
          type: Sequelize.QueryTypes.SELECT 
        }
      );

      if (existingPatient.length === 0) {
        // Get the doctor ID first
        const doctorRecord = await queryInterface.sequelize.query(
          "SELECT id FROM doctors WHERE user_id = :userId",
          { 
            replacements: { userId: doctorUser.id },
            type: Sequelize.QueryTypes.SELECT 
          }
        );

        const patientId = '66666666-6666-6666-6666-666666666666'; // Deterministic UUID for patient profile
        await queryInterface.bulkInsert('patients', [{
          id: patientId,
          user_id: patientUser.id,
          medical_record_number: 'MRN-2025-001',
          patient_id: 'JMD/202501/000001', // Doctor initials/Year-Month/Sequence
          primary_care_doctor_id: doctorRecord.length > 0 ? doctorRecord[0].id : null,
          emergency_contacts: JSON.stringify([
            {
              name: 'John Patient',
              relationship: 'spouse',
              phone: '+1-555-0004',
              email: 'john.patient@example.com'
            },
            {
              name: 'Mary Patient',
              relationship: 'mother',
              phone: '+1-555-0005',
              email: 'mary.patient@example.com'
            }
          ]),
          insurance_information: JSON.stringify({
            primary: {
              provider: 'Blue Cross Blue Shield',
              plan_name: 'Health Plus',
              policy_number: 'BCBS123456789',
              group_number: 'GRP001',
              subscriber_id: 'SUB123456'
            }
          }),
          medical_history: JSON.stringify([
            'hypertension',
            'type_2_diabetes',
            'seasonal_allergies'
          ]),
          allergies: JSON.stringify([
            {
              allergen: 'penicillin',
              reaction: 'rash',
              severity: 'moderate'
            },
            {
              allergen: 'peanuts',
              reaction: 'anaphylaxis',
              severity: 'severe'
            }
          ]),
          current_medications: JSON.stringify([
            {
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'twice daily',
              prescribed_date: '2025-01-15'
            },
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'once daily',
              prescribed_date: '2025-02-01'
            }
          ]),
          height_cm: 165.0,
          weight_kg: 68.5,
          blood_type: 'O+',
          primary_language: 'en',
          risk_level: 'medium',
          risk_factors: JSON.stringify(['diabetes', 'hypertension', 'family_history_heart_disease']),
          communication_preferences: JSON.stringify({
            preferred_contact_method: 'email',
            language: 'en',
            time_zone: 'America/Chicago',
            appointment_reminders: true,
            medication_reminders: true,
            health_tips: true,
            research_participation: false
          }),
          privacy_settings: JSON.stringify({
            share_with_family: true,
            share_for_research: false,
            data_sharing_consent: true,
            marketing_communications: false,
            provider_directory_listing: false
          }),
          overall_adherence_score: 87.5,
          last_adherence_calculation: new Date(),
          total_appointments: 12,
          missed_appointments: 1,
          last_visit_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          is_active: true,
          requires_interpreter: false,
          has_mobility_issues: false,
          created_at: new Date(),
          updated_at: new Date()
        }], { ignoreDuplicates: true });

        console.log('✅ Complete patient profile created for patient@healthapp.com');
      } else {
        console.log('ℹ️ Patient profile already exists for patient@healthapp.com');
      }
    }

    // UPDATE USER PROFILES WITH ADDITIONAL DETAILS
    // Update doctor user with complete information
    if (doctorUser) {
      await queryInterface.sequelize.query(
        `UPDATE users SET 
         phone = COALESCE(phone, '+1-555-0002'),
         date_of_birth = COALESCE(date_of_birth, '1980-05-15'),
         gender = COALESCE(gender, 'MALE'),
         updated_at = NOW()
         WHERE id = :userId`,
        {
          replacements: { userId: doctorUser.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }

    // Update patient user with complete information
    if (patientUser) {
      await queryInterface.sequelize.query(
        `UPDATE users SET 
         phone = COALESCE(phone, '+1-555-0003'),
         date_of_birth = COALESCE(date_of_birth, '1990-08-22'),
         gender = COALESCE(gender, 'FEMALE'),
         updated_at = NOW()
         WHERE id = :userId`,
        {
          replacements: { userId: patientUser.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }

    // Update admin user with complete information
    if (adminUser) {
      await queryInterface.sequelize.query(
        `UPDATE users SET 
         phone = COALESCE(phone, '+1-555-0001'),
         updated_at = NOW()
         WHERE id = :userId`,
        {
          replacements: { userId: adminUser.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }

    console.log('✅ Complete test profiles created successfully!');
    console.log('📧 Test credentials:');
    console.log('👩‍⚕️ doctor@healthapp.com (DOCTOR) - password: password123');
    console.log('👤 patient@healthapp.com (PATIENT) - password: password123');
    console.log('👨‍💼 admin@healthapp.com (SYSTEM_ADMIN) - password: password123');
    
    console.log('🏥 Doctor Profile: Complete with license, speciality, clinic');
    console.log('👤 Patient Profile: Complete with medical history, allergies, medications');
    console.log('👨‍💼 Admin Profile: System administrator with full access');
  },

  down: async (queryInterface: any, Sequelize: any) => {
    // Delete in reverse order due to foreign key constraints
    await queryInterface.bulkDelete('clinics', {
      doctor_id: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          "(SELECT d.id FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.email = 'doctor@healthapp.com')"
        )
      }
    });

    await queryInterface.bulkDelete('patients', {
      user_id: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          "(SELECT id FROM users WHERE email = 'patient@healthapp.com')"
        )
      }
    });

    await queryInterface.bulkDelete('doctors', {
      user_id: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          "(SELECT id FROM users WHERE email = 'doctor@healthapp.com')"
        )
      }
    });

    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@healthapp.com', 'doctor@healthapp.com', 'patient@healthapp.com']
      }
    });

    await queryInterface.bulkDelete('specialities', {
      id: {
        [Sequelize.Op.in]: [1, 2, 3]
      }
    });
  }
};