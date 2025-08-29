// src/seeders/003-vital-templates.js
'use strict';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    console.log('🩺 Seeding vital sign templates (idempotent)...');
    
    // Check if vital templates already exist
    const existingTemplates = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM vital_templates",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingTemplates[0].count > 0) {
      console.log(`ℹ️ Vital templates already exist (${existingTemplates[0].count} found), skipping seeding`);
      return;
    }

    await queryInterface.bulkInsert('vital_templates', [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'Blood Pressure',
        unit: 'mmHg',
        details: JSON.stringify({
          normalRange: '120/80',
          description: 'Systolic and diastolic blood pressure measurement',
          fields: ['systolic', 'diastolic', 'pulse']
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        name: 'Blood Sugar',
        unit: 'mg/dL',
        details: JSON.stringify({
          normalRange: '70-140',
          description: 'Blood glucose level measurement',
          fields: ['glucose_level', 'measurement_time']
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        name: 'Weight',
        unit: 'kg',
        details: JSON.stringify({
          normalRange: 'Varies by individual',
          description: 'Body weight measurement',
          fields: ['weight']
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        name: 'Temperature',
        unit: '°F',
        details: JSON.stringify({
          normalRange: '98.6',
          description: 'Body temperature measurement',
          fields: ['temperature']
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], { ignoreDuplicates: true });
    
    console.log('✅ Vital sign templates seeded successfully');
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.bulkDelete('vital_templates', null, {});
  }
};
