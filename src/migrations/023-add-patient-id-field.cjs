'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add patient_id field to patients table
    await queryInterface.addColumn('patients', 'patient_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Custom patient identifier - supports any format (numbers, alphanumeric, structured)'
    });

    // Add index for patient_id
    await queryInterface.addIndex('patients', ['patient_id'], { 
      name: 'idx_patients_patient_id',
      unique: true,
      where: { 
        patient_id: { [Sequelize.Op.ne]: null },
        deleted_at: null 
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('patients', 'idx_patients_patient_id');
    
    // Remove column
    await queryInterface.removeColumn('patients', 'patient_id');
  }
};