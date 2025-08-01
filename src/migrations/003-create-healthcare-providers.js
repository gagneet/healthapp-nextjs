// src/migrations/003-create-healthcare-providers.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Create healthcare_providers table
    await queryInterface.createTable('healthcare_providers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
      },
      
      // Professional information
      license_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      specialties: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      sub_specialties: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      qualifications: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      years_of_experience: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      
      // Verification
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      verification_documents: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      verification_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verified_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      
      // Settings
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      availability_schedule: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      notification_preferences: {
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

    // Add indexes as per schema
    await queryInterface.addIndex('healthcare_providers', ['user_id'], { 
      name: 'idx_providers_user_id'
    });
    await queryInterface.addIndex('healthcare_providers', ['organization_id'], { 
      where: { deleted_at: null },
      name: 'idx_providers_org'
    });
    await queryInterface.addIndex('healthcare_providers', ['is_verified'], { 
      where: { deleted_at: null },
      name: 'idx_providers_verified'
    });

    // GIN index for specialties array
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_providers_specialties ON healthcare_providers USING GIN(specialties);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('healthcare_providers');
  }
};