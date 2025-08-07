'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('patients');
    if (tableDescription.patient_id) {
      console.log('Column patient_id already exists in patients table, skipping');
      return;
    }

    // Add patient_id field to patients table
    await queryInterface.addColumn('patients', 'patient_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Custom patient identifier - supports any format (numbers, alphanumeric, structured)'
    });

    // Add index for patient_id with error handling
    try {
      await queryInterface.addIndex('patients', ['patient_id'], { 
        name: 'idx_patients_patient_id',
        unique: true,
        where: { 
          patient_id: { [Sequelize.Op.ne]: null },
          deleted_at: null 
        }
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_patients_patient_id already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('patients', 'idx_patients_patient_id');
    
    // Remove column
    await queryInterface.removeColumn('patients', 'patient_id');
  }
};