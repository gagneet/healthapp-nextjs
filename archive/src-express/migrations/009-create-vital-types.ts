// src/migrations/009-create-vital-types.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
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
      normalRangeMin: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      normalRangeMax: {
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
    });

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('vital_types', ['name'], { name: 'idx_vital_types_name' });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_vital_types_name already exists, skipping');
    }

    try {
      await queryInterface.addIndex('vital_types', ['unit'], { name: 'idx_vital_types_unit' });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
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
        normalRangeMin: 90,
        normalRangeMax: 140,
        description: 'Systolic blood pressure measurement',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Blood Pressure Diastolic',
        unit: 'mmHg',
        normalRangeMin: 60,
        normalRangeMax: 90,
        description: 'Diastolic blood pressure measurement',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Heart Rate',
        unit: 'bpm',
        normalRangeMin: 60,
        normalRangeMax: 100,
        description: 'Resting heart rate',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Body Temperature',
        unit: '°F',
        normalRangeMin: 97.0,
        normalRangeMax: 99.5,
        description: 'Body temperature in Fahrenheit',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Weight',
        unit: 'lbs',
        normalRangeMin: null,
        normalRangeMax: null,
        description: 'Body weight in pounds',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Blood Glucose',
        unit: 'mg/dL',
        normalRangeMin: 70,
        normalRangeMax: 140,
        description: 'Blood glucose level',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Oxygen Saturation',
        unit: '%',
        normalRangeMin: 95,
        normalRangeMax: 100,
        description: 'Blood oxygen saturation level',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('vital_types');
  }
};