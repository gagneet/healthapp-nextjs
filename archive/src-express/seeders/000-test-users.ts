// src/seeders/000-test-users.ts
'use strict';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    console.log('👥 Seeding test users (idempotent)...');
    
    // Check if test users already exist
    const existingUsers = await queryInterface.sequelize.query(
      "SELECT email FROM users WHERE email IN ('gagneet@silverfoxtechnologies.com.au', 'doctor@healthapp.com', 'hsp@healthapp.com', 'hospital.gagneet@silverfoxtechnologies.com.au', 'patient@healthapp.com')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingUsers.length > 0) {
      console.log(`ℹ️ Test users already exist (${existingUsers.length} found), skipping seeding`);
      return;
    }

    // Hash passwords for test users
    const passwordHash = await bcrypt.hash('T3mpP@ssw0rd2376!', 10);

    // Create test users with different roles
    const users = [
      {
        id: uuidv4(),
        email: 'gagneet@silverfoxtechnologies.com.au',
        password_hash: passwordHash,
        role: 'SYSTEM_ADMIN',
        account_status: 'ACTIVE',
        firstName: 'System',
        lastName: 'Administrator',
        email_verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: 'doctor@healthapp.com',
        password_hash: passwordHash,
        role: 'DOCTOR',
        account_status: 'ACTIVE',
        firstName: 'Dr. John',
        lastName: 'Doe',
        email_verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: 'hsp@healthapp.com',
        password_hash: passwordHash,
        role: 'HSP',
        account_status: 'ACTIVE',
        firstName: 'Healthcare',
        lastName: 'Provider',
        email_verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),        
      },
      {
        id: uuidv4(),
        email: 'hospital.gagneet@silverfoxtechnologies.com.au',
        password_hash: passwordHash,
        role: 'HOSPITAL_ADMIN',
        account_status: 'ACTIVE',
        firstName: 'Hospital',
        lastName: 'Admin',
        email_verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: 'patient@healthapp.com',
        password_hash: passwordHash,
        role: 'PATIENT',
        account_status: 'ACTIVE',
        firstName: 'Jane',
        lastName: 'Patient',
        email_verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await queryInterface.bulkInsert('users', users, { ignoreDuplicates: true });

    // Create corresponding doctor records for doctor role users (idempotent)
    console.log('👨‍⚕️ Creating doctor profiles for doctor role users...');
    
    // Check for existing doctor records by email to handle both new and existing users
    const existingDoctorUsers = await queryInterface.sequelize.query(
      `SELECT u.id, u.email FROM users u 
       LEFT JOIN doctors d ON u.id = d.userId 
       WHERE u.role = 'DOCTOR' AND d.id IS NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingDoctorUsers.length > 0) {
      // Ensure General Medicine specialty exists (idempotent)
      await queryInterface.sequelize.query(
        `INSERT INTO specialities (id, name, description, createdAt, updatedAt) 
         VALUES (3, 'General Medicine', 'General medical practice', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        { type: Sequelize.QueryTypes.INSERT }
      );

      const doctorRecords = existingDoctorUsers.map((user: any) => ({
        id: uuidv4(),
        userId: user.id,
        medical_license_number: user.email === 'doctor@healthapp.com' ? 'LIC-12345-TEST' : `LIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        speciality_id: 3, // General Medicine
        specialties: ['general medicine'],
        years_of_experience: 10,
        is_verified: true,
        verification_date: new Date(),
        practice_name: user.email === 'doctor@healthapp.com' ? 'Dr. John Doe Family Practice' : 'Medical Practice',
        medical_school: 'University of Medicine',
        boardCertifications: ['internal medicine'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await queryInterface.bulkInsert('doctors', doctorRecords, { ignoreDuplicates: true });
      console.log(`✅ Doctor profiles created for ${existingDoctorUsers.length} users: ${existingDoctorUsers.map((u: any) => u.email).join(', ')}`);
    } else {
      console.log('ℹ️ All doctor users already have corresponding doctor profiles');
    }

    // Update existing doctor records with missing profile information
    console.log('🩺 Updating existing doctor profiles with complete information...');
    
    const existingDoctorsToUpdate = await queryInterface.sequelize.query(
      `SELECT d.id, d.userId, u.email FROM doctors d 
       JOIN users u ON d.userId = u.id 
       WHERE u.role = 'DOCTOR' AND (d.speciality_id IS NULL OR d.specialties = '{}' OR d.is_verified = false)`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingDoctorsToUpdate.length > 0) {
      // Ensure General Medicine specialty exists (idempotent)
      await queryInterface.sequelize.query(
        `INSERT INTO specialities (id, name, description, createdAt, updatedAt) 
         VALUES (3, 'General Medicine', 'General medical practice', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        { type: Sequelize.QueryTypes.INSERT }
      );

      for (const doctor of existingDoctorsToUpdate) {
        await queryInterface.sequelize.query(
          `UPDATE doctors SET 
           speciality_id = 3,
           specialties = ARRAY['general medicine'],
           years_of_experience = 10,
           is_verified = true,
           verification_date = NOW(),
           practice_name = CASE 
             WHEN :email = 'doctor@healthapp.com' THEN 'Dr. John Doe Family Practice'
             ELSE 'Medical Practice'
           END,
           medical_school = 'University of Medicine',
           boardCertifications = ARRAY['internal medicine'],
           updatedAt = NOW()
           WHERE id = :doctorId`,
          {
            replacements: { 
              doctorId: doctor.id,
              email: doctor.email
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
      console.log(`✅ Updated ${existingDoctorsToUpdate.length} existing doctor profiles: ${existingDoctorsToUpdate.map((d: any) => d.email).join(', ')}`);
    } else {
      console.log('ℹ️ All existing doctor profiles are already complete');
    }

    // Create corresponding patient records for patient role users (idempotent)
    console.log('🏥 Creating patient profiles for patient role users...');
    
    // Check for existing patient records by email to handle both new and existing users
    const existingPatientUsers = await queryInterface.sequelize.query(
      `SELECT u.id, u.email FROM users u 
       LEFT JOIN patients p ON u.id = p.userId 
       WHERE u.role = 'PATIENT' AND p.id IS NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPatientUsers.length > 0) {
      const patientRecords = existingPatientUsers.map((user: any, index: any) => ({
        id: uuidv4(),
        userId: user.id,
        medicalRecordNumber: user.email === 'patient@healthapp.com' ? 'MRN-TEST-001' : `MRN-TEST-${String(index + 2).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await queryInterface.bulkInsert('patients', patientRecords, { ignoreDuplicates: true });
      console.log(`✅ Patient profiles created for ${existingPatientUsers.length} users: ${existingPatientUsers.map((u: any) => u.email).join(', ')}`);
    } else {
      console.log('ℹ️ All patient users already have corresponding patient profiles');
    }

    console.log('✅ Test users seeded successfully:');
    console.log('📧 gagneet@silverfoxtechnologies.com.au (SYSTEM_ADMIN) - password: T3mpP@ssw0rd2376!');
    console.log('📧 doctor@healthapp.com (DOCTOR) - password: T3mpP@ssw0rd2376!');
    console.log('📧 hsp@healthapp.com (HSP) - password: T3mpP@ssw0rd2376!');
    console.log('📧 hospital.gagneet@silverfoxtechnologies.com.au (HOSPITAL_ADMIN) - password: T3mpP@ssw0rd2376!');
    console.log('📧 patient@healthapp.com (PATIENT) - password: T3mpP@ssw0rd2376!');
  },

  down: async (queryInterface: any, Sequelize: any) => {
    // Delete doctor and patient records first (due to foreign key constraints)
    await queryInterface.bulkDelete('doctors', null, {});
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};