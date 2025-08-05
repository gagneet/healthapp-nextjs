// src/seeders/002-medicines.cjs
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('💊 Seeding medicines database (idempotent)...');
    
    // Check if medicines already exist
    const existingMedicines = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM medicines",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingMedicines[0].count > 0) {
      console.log(`ℹ️ Medicines already exist (${existingMedicines[0].count} found), skipping seeding`);
      return;
    }

    await queryInterface.bulkInsert('medicines', [
      {
        id: 1,
        name: 'Metformin',
        type: 'tablet',
        description: 'Diabetes medication',
        details: JSON.stringify({
          generic_name: 'Metformin Hydrochloride',
          formulation: 'tablet',
          strength: '500mg'
        }),
        public_medicine: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Lisinopril',
        type: 'tablet',
        description: 'Blood pressure medication',
        details: JSON.stringify({
          generic_name: 'Lisinopril',
          formulation: 'tablet',
          strength: '10mg'
        }),
        public_medicine: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Aspirin',
        type: 'tablet',
        description: 'Pain relief and blood thinner',
        details: JSON.stringify({
          generic_name: 'Acetylsalicylic acid',
          formulation: 'tablet',
          strength: '81mg'
        }),
        public_medicine: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], { ignoreDuplicates: true });
    
    console.log('✅ Medicines database seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('medicines', null, {});
  }
};
