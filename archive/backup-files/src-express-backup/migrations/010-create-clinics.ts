// src/migrations/010-create-clinics.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    console.log('🏥 Creating clinics table...');
    
    // Check if clinics table already exists
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinics')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists[0].exists) {
      console.log('ℹ️ Clinics table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('clinics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      address: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
        comment: 'Complete address with geo-location data'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      operating_hours: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
        comment: 'Weekly schedule with timings for each day'
      },
      services_offered: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        allowNull: true
      },
      clinic_images: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true,
        comment: 'Array of image URLs for clinic photos'
      },
      banner_image: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Main banner image for the clinic'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Indicates if this is the doctors primary clinic'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      registration_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Clinic registration number with local authorities'
      },
      established_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      facilities: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true,
        comment: 'List of facilities available at the clinic'
      },
      insurance_accepted: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('clinics', ['doctor_id']);
    await queryInterface.addIndex('clinics', ['organization_id']);
    await queryInterface.addIndex('clinics', ['is_active']);
    await queryInterface.addIndex('clinics', ['is_primary']);

    console.log('✅ Clinics table created successfully');
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('clinics');
  }
};