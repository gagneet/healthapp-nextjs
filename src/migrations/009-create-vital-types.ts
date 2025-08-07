// src/migrations/009-create-vital-types.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('vital_types');
    if (tableExists) {
      console.log('Table vital_types already exists, skipping creation');
      return;
    }

    // Create vital_types table
    await queryInterface.createTable('vital_types', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      normal_range_min: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      normal_range_max: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      validation_rules: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
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
    });

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('vital_types', ['name'], { name: 'idx_vital_types_name' });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_vital_types_name already exists, skipping');
    }

    try {
      await queryInterface.addIndex('vital_types', ['unit'], { name: 'idx_vital_types_unit' });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_vital_types_unit already exists, skipping');
    }

    // Insert default vital types from schema with existence check
    const existingRecords = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM vital_types',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (existingRecords[0].count > 0) {
      console.log('Vital types data already exists, skipping seeding');
      return;
    }

    await queryInterface.bulkInsert('vital_types', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Blood Pressure Systolic',
        unit: 'mmHg',
        normal_range_min: 90,
        normal_range_max: 140,
        description: 'Systolic blood pressure measurement',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Blood Pressure Diastolic',
        unit: 'mmHg',
        normal_range_min: 60,
        normal_range_max: 90,
        description: 'Diastolic blood pressure measurement',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Heart Rate',
        unit: 'bpm',
        normal_range_min: 60,
        normal_range_max: 100,
        description: 'Resting heart rate',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Body Temperature',
        unit: '°F',
        normal_range_min: 97.0,
        normal_range_max: 99.5,
        description: 'Body temperature in Fahrenheit',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Weight',
        unit: 'lbs',
        normal_range_min: null,
        normal_range_max: null,
        description: 'Body weight in pounds',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Blood Glucose',
        unit: 'mg/dL',
        normal_range_min: 70,
        normal_range_max: 140,
        description: 'Blood glucose level',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Oxygen Saturation',
        unit: '%',
        normal_range_min: 95,
        normal_range_max: 100,
        description: 'Blood oxygen saturation level',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vital_types');
  }
};