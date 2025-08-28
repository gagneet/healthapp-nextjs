'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctor_availability'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists.length > 0) {
      console.log('ℹ️ Table "doctor_availability" already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('doctor_availability', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 6
        }
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      slot_duration: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      max_appointments_per_slot: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      break_start_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      break_end_time: {
        type: Sequelize.TIME,
        allowNull: true,
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

    // Add indexes
    await queryInterface.addIndex('doctor_availability', ['doctorId', 'day_of_week']);
    await queryInterface.addIndex('doctor_availability', ['doctorId', 'is_available']);
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('doctor_availability');
  }
};