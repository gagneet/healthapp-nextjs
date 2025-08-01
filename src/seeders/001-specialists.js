// src/seeders/001-specialities.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('specialities', [
      {
        id: 1,
        name: 'Cardiology',
        description: 'Heart and cardiovascular system specialist',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Endocrinology',
        description: 'Hormonal disorders and diabetes specialist',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'General Medicine',
        description: 'General medical practice',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        name: 'Pediatrics',
        description: 'Children\'s health specialist',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        name: 'Orthopedics',
        description: 'Bone and joint specialist',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('specialities', null, {});
  }
};
