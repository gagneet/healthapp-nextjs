'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('patients');
    if (tableDescription.patientId) {
      console.log('Column patientId already exists in patients table, skipping');
      return;
    }

    // Add patientId field to patients table
    await queryInterface.addColumn('patients', 'patientId', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Custom patient identifier - supports any format (numbers, alphanumeric, structured)'
    });

    // Add index for patientId with error handling
    try {
      await queryInterface.addIndex('patients', ['patientId'], { 
        name: 'idx_patients_patient_id',
        unique: true,
        where: { 
          patientId: { [Sequelize.Op.ne]: null },
          deleted_at: null 
        }
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_patients_patient_id already exists, skipping');
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    // Remove index first
    await queryInterface.removeIndex('patients', 'idx_patients_patient_id');
    
    // Remove column
    await queryInterface.removeColumn('patients', 'patientId');
  }
};