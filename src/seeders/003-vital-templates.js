// src/seeders/003-vital-templates.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('vital_templates', [
      {
        id: 1,
        name: 'Blood Pressure',
        unit: 'mmHg',
        details: JSON.stringify({
          normal_range: '120/80',
          description: 'Systolic and diastolic blood pressure measurement',
          fields: ['systolic', 'diastolic', 'pulse']
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Blood Sugar',
        unit: 'mg/dL',
        details: JSON.stringify({
          normal_range: '70-140',
          description: 'Blood glucose level measurement',
          fields: ['glucose_level', 'measurement_time']
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Weight',
        unit: 'kg',
        details: JSON.stringify({
          normal_range: 'Varies by individual',
          description: 'Body weight measurement',
          fields: ['weight']
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        name: 'Temperature',
        unit: '°F',
        details: JSON.stringify({
          normal_range: '98.6',
          description: 'Body temperature measurement',
          fields: ['temperature']
        }),
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('vital_templates', null, {});
  }
};
