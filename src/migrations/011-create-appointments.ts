// src/migrations/011-create-appointments.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('appointments');
    if (tableExists) {
      console.log('Table appointments already exists, skipping creation');
      return;
    }

    // Create appointment status enum with error handling
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE appointment_status AS ENUM (
          'SCHEDULED',
          'CONFIRMED',
          'IN_PROGRESS',
          'COMPLETED',
          'CANCELLED',
          'NO_SHOW',
          'RESCHEDULED'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Enum appointment_status already exists, skipping');
    }

    // Create appointments table
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'healthcare_providers',
          key: 'id'
        },
      },
      
      // Appointment details
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      appointment_type: {
        type: Sequelize.STRING(100), // consultation, follow-up, emergency
        allowNull: true,
      },
      
      // Scheduling
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'UTC',
      },
      
      // Status and location
      status: {
        type: 'appointment_status',
        defaultValue: 'SCHEDULED',
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {}, // Can be physical address or virtual meeting info
      },
      is_virtual: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      
      // Metadata
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reminder_preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Timestamps
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes with error handling
    const indexes = [
      { fields: ['patient_id'], options: { where: { deleted_at: null }, name: 'idx_appointments_patient' } },
      { fields: ['provider_id'], options: { where: { deleted_at: null }, name: 'idx_appointments_provider' } },
      { fields: ['start_time'], options: { where: { deleted_at: null }, name: 'idx_appointments_time' } },
      { fields: ['status'], options: { where: { deleted_at: null }, name: 'idx_appointments_status' } }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('appointments', index.fields, index.options);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.options.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('appointments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS appointment_status CASCADE;');
  }
};