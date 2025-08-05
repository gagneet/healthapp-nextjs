'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add slot_id column to appointments table
    await queryInterface.addColumn('appointments', 'slot_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'appointment_slots',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add index for slot_id
    await queryInterface.addIndex('appointments', ['slot_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('appointments', 'slot_id');
  }
};