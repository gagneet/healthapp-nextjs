// src/seeders/000-test-users.cjs
'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash passwords for test users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Create organizations first
    const orgId = uuidv4();
    await queryInterface.bulkInsert('organizations', [
      {
        id: orgId,
        name: 'Test Healthcare Organization',
        type: 'clinic',
        contact_info: JSON.stringify({
          email: 'contact@testhealthcare.com',
          phone: '+1234567890'
        }),
        address: JSON.stringify({
          street: '123 Health St',
          city: 'Medical City',
          state: 'HC',
          zip: '12345',
          country: 'USA'
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});

    // Create test users with different roles
    const users = [
      {
        id: uuidv4(),
        email: 'admin@healthapp.com',
        password_hash: passwordHash,
        role: 'SYSTEM_ADMIN',
        account_status: 'ACTIVE',
        first_name: 'System',
        last_name: 'Administrator',
        email_verified: true,
        organization_id: orgId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'doctor@healthapp.com',
        password_hash: passwordHash,
        role: 'DOCTOR',
        account_status: 'ACTIVE',
        first_name: 'Dr. John',
        last_name: 'Doe',
        email_verified: true,
        organization_id: orgId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'hsp@healthapp.com',
        password_hash: passwordHash,
        role: 'HSP',
        account_status: 'ACTIVE',
        first_name: 'Healthcare',
        last_name: 'Provider',
        email_verified: true,
        organization_id: orgId,
        created_at: new Date(),
        updated_at: new Date(),        
      },
      {
        id: uuidv4(),
        email: 'hospital.admin@healthapp.com',
        password_hash: passwordHash,
        role: 'HOSPITAL_ADMIN',
        account_status: 'ACTIVE',
        first_name: 'Hospital',
        last_name: 'Admin',
        email_verified: true,
        organization_id: orgId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        email: 'patient@healthapp.com',
        password_hash: passwordHash,
        role: 'PATIENT',
        account_status: 'ACTIVE',
        first_name: 'Jane',
        last_name: 'Patient',
        email_verified: true,
        organization_id: orgId,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];

    await queryInterface.bulkInsert('users', users, {});

    console.log('✅ Created test users:');
    console.log('📧 admin@healthapp.com (SYSTEM_ADMIN) - password: password123');
    console.log('📧 doctor@healthapp.com (DOCTOR) - password: password123');
    console.log('📧 hsp@healthapp.com (HSP) - password: password123');
    console.log('📧 hospital.admin@healthapp.com (HOSPITAL_ADMIN) - password: password123');
    console.log('📧 patient@healthapp.com (PATIENT) - password: password123');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('organizations', null, {});
  }
};