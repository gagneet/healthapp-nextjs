// src/migrations/003-create-healthcare-providers.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('healthcare_providers');
    if (tableExists) {
      console.log('Table healthcare_providers already exists, skipping creation');
      return;
    }

    // Create healthcare_providers table
    await queryInterface.createTable('healthcare_providers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
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
    try {
      await queryInterface.addIndex('healthcare_providers', ['userId'], { 
        name: 'idx_providers_userId'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_providers_userId already exists, skipping');
    }

    try {
      await queryInterface.addIndex('healthcare_providers', ['organization_id'], { 
        where: { deleted_at: null },
        name: 'idx_providers_org'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_providers_org already exists, skipping');
    }

    try {
      await queryInterface.addIndex('healthcare_providers', ['is_verified'], { 
        where: { deleted_at: null },
        name: 'idx_providers_verified'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_providers_verified already exists, skipping');
    }

    // GIN index for specialties array with error handling
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX idx_providers_specialties ON healthcare_providers USING GIN(specialties);
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_providers_specialties already exists, skipping');
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('healthcare_providers');
  }
};