'use strict';

import bcrypt from 'bcryptjs';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    console.log('👥 Seeding patient test data (idempotent)...');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if test patient users already exist (idempotent)
      const existingPatients = await queryInterface.sequelize.query(
        "SELECT email FROM users WHERE email IN ('john.doe@healthapp.com', 'jane.smith@healthapp.com', 'michael.johnson@healthapp.com', 'sarah.brown@healthapp.com', 'david.wilson@healthapp.com')",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      if (existingPatients.length > 0) {
        console.log(`ℹ️ Patient test users already exist (${existingPatients.length} found), skipping seeding`);
        await transaction.rollback();
        return;
      }

      // First, let's find a doctor to assign patients to
      const doctors = await queryInterface.sequelize.query(
        'SELECT id FROM doctors LIMIT 1',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (doctors.length === 0) {
        console.log('No doctors found. Skipping patient seeding.');
        await transaction.rollback();
        return;
      }

      const doctorId = doctors[0].id;
      
      // Create sample users for patients
      const hashedPassword = await bcrypt.hash('patient123', 12);
      
      const users = await queryInterface.bulkInsert('users', [
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          full_name: 'John William Doe',
          first_name: 'John',
          middle_name: 'William',
          last_name: 'Doe',
          email: 'john.doe@healthapp.com',
          password_hash: hashedPassword,
          phone: '+1-555-0123',
          gender: 'MALE',
          role: 'PATIENT',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          full_name: 'Jane Marie Smith',
          first_name: 'Jane',
          middle_name: 'Marie',
          last_name: 'Smith',
          email: 'jane.smith@healthapp.com',
          password_hash: hashedPassword,
          phone: '+1-555-0124',
          gender: 'FEMALE',
          role: 'PATIENT',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          full_name: 'Michael Robert Johnson',
          first_name: 'Michael',
          middle_name: 'Robert',
          last_name: 'Johnson',
          email: 'michael.johnson@healthapp.com',
          password_hash: hashedPassword,
          phone: '+1-555-0125',
          gender: 'MALE',
          role: 'PATIENT',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440013',
          full_name: 'Sarah Elizabeth Brown',
          first_name: 'Sarah',
          middle_name: 'Elizabeth',
          last_name: 'Brown',
          email: 'sarah.brown@healthapp.com',
          password_hash: hashedPassword,
          phone: '+1-555-0126',
          gender: 'FEMALE',
          role: 'PATIENT',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440014',
          full_name: 'David James Wilson',
          first_name: 'David',
          middle_name: 'James',
          last_name: 'Wilson',
          email: 'david.wilson@healthapp.com',
          password_hash: hashedPassword,
          phone: '+1-555-0127',
          gender: 'MALE',
          role: 'PATIENT',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction, returning: true, ignoreDuplicates: true });

      // Users already have role field, so user_roles not needed for basic functionality

      // Create patient records (idempotent)
      await queryInterface.bulkInsert('patients', [
        {
          id: '550e8400-e29b-41d4-a716-446655440030',
          userId: '550e8400-e29b-41d4-a716-446655440010',
          medical_record_number: 'MRN001',
          primaryCareDoctorId: doctorId,
          emergency_contacts: JSON.stringify([{
            name: 'Jane Doe',
            relationship: 'spouse',
            phone: '+1-555-0199',
            email: 'jane.doe.emergency@email.com',
            is_primary: true
          }]),
          insurance_information: JSON.stringify({
            provider: 'Blue Cross Blue Shield',
            policy_number: 'BC123456789',
            group_number: 'GRP001',
            coverage_type: 'family'
          }),
          height_cm: 175.00,
          weight_kg: 75.50,
          blood_type: 'O+',
          risk_level: 'medium',
          overall_adherence_score: 92.00,
          last_visit_date: '2025-01-15',
          next_appointment_date: '2025-02-01',
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440031',
          userId: '550e8400-e29b-41d4-a716-446655440011',
          medical_record_number: 'MRN002',
          primaryCareDoctorId: doctorId,
          emergency_contacts: JSON.stringify([{
            name: 'Robert Smith',
            relationship: 'spouse',
            phone: '+1-555-0198',
            email: 'robert.smith.emergency@email.com',
            is_primary: true
          }]),
          insurance_information: JSON.stringify({
            provider: 'Aetna',
            policy_number: 'AET987654321',
            group_number: 'GRP002',
            coverage_type: 'individual'
          }),
          height_cm: 165.00,
          weight_kg: 62.30,
          blood_type: 'A+',
          risk_level: 'high',
          overall_adherence_score: 65.00,
          last_visit_date: '2025-01-18',
          next_appointment_date: '2025-01-25',
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440032',
          userId: '550e8400-e29b-41d4-a716-446655440012',
          medical_record_number: 'MRN003',
          primaryCareDoctorId: doctorId,
          emergency_contacts: JSON.stringify([{
            name: 'Lisa Johnson',
            relationship: 'mother',
            phone: '+1-555-0197',
            email: 'lisa.johnson.emergency@email.com',
            is_primary: true
          }]),
          insurance_information: JSON.stringify({
            provider: 'UnitedHealthcare',
            policy_number: 'UHC456789123',
            group_number: 'GRP003',
            coverage_type: 'family'
          }),
          height_cm: 180.00,
          weight_kg: 82.10,
          blood_type: 'B-',
          risk_level: 'medium',
          overall_adherence_score: 78.00,
          last_visit_date: '2025-01-20',
          next_appointment_date: '2025-01-30',
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440033',
          userId: '550e8400-e29b-41d4-a716-446655440013',
          medical_record_number: 'MRN004',
          primaryCareDoctorId: doctorId,
          emergency_contacts: JSON.stringify([{
            name: 'Mark Brown',
            relationship: 'father',
            phone: '+1-555-0196',
            email: 'mark.brown.emergency@email.com',
            is_primary: true
          }]),
          insurance_information: JSON.stringify({
            provider: 'Cigna',
            policy_number: 'CIG789123456',
            group_number: 'GRP004',
            coverage_type: 'individual'
          }),
          height_cm: 168.00,
          weight_kg: 58.70,
          blood_type: 'AB+',
          risk_level: 'low',
          overall_adherence_score: 95.00,
          last_visit_date: '2025-01-12',
          next_appointment_date: '2025-02-05',
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440034',
          userId: '550e8400-e29b-41d4-a716-446655440014',
          medical_record_number: 'MRN005',
          primaryCareDoctorId: doctorId,
          emergency_contacts: JSON.stringify([{
            name: 'Mary Wilson',
            relationship: 'spouse',
            phone: '+1-555-0195',
            email: 'mary.wilson.emergency@email.com',
            is_primary: true
          }]),
          insurance_information: JSON.stringify({
            provider: 'Medicare',
            policy_number: 'MED123456789',
            group_number: 'GRP005',
            coverage_type: 'medicare'
          }),
          height_cm: 172.00,
          weight_kg: 78.90,
          blood_type: 'O-',
          risk_level: 'medium',
          overall_adherence_score: 88.00,
          last_visit_date: '2025-01-08',
          next_appointment_date: '2025-01-28',
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction, ignoreDuplicates: true });

      // Skip appointments seeding for now - will handle separately

      await transaction.commit();
      console.log('✅ Successfully seeded patient test data (idempotent)');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error seeding patients:', error);
      throw error;
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Delete in reverse order due to foreign key constraints
      await queryInterface.bulkDelete('appointments', {
        id: [
          '550e8400-e29b-41d4-a716-446655440040',
          '550e8400-e29b-41d4-a716-446655440041',
          '550e8400-e29b-41d4-a716-446655440042'
        ]
      }, { transaction });
      
      await queryInterface.bulkDelete('patients', {
        id: [
          '550e8400-e29b-41d4-a716-446655440030',
          '550e8400-e29b-41d4-a716-446655440031',
          '550e8400-e29b-41d4-a716-446655440032',
          '550e8400-e29b-41d4-a716-446655440033',
          '550e8400-e29b-41d4-a716-446655440034'
        ]
      }, { transaction });
      
      // No user_roles to delete since users have role field
      
      await queryInterface.bulkDelete('users', {
        id: [
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
          '550e8400-e29b-41d4-a716-446655440012',
          '550e8400-e29b-41d4-a716-446655440013',
          '550e8400-e29b-41d4-a716-446655440014'
        ]
      }, { transaction });

      await transaction.commit();
      console.log('✅ Successfully rolled back patients data');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error rolling back patients:', error);
      throw error;
    }
  }
};