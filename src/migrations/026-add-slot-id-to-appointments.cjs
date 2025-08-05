'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if slot_id column already exists
    const columnExists = await queryInterface.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'slot_id'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (columnExists.length > 0) {
      console.log('ℹ️ Column "slot_id" already exists in appointments table, skipping');
      return;
    }

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