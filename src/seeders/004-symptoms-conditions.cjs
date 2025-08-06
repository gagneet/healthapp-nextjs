// src/seeders/004-symptoms-conditions.cjs
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🩺 Seeding symptoms/conditions database (idempotent)...');
    
    // Check if conditions already exist
    const existingConditions = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM symptoms_database",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingConditions[0].count > 0) {
      console.log(`ℹ️ Conditions already exist (${existingConditions[0].count} found), skipping seeding`);
      return;
    }

    await queryInterface.bulkInsert('symptoms_database', [
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        diagnosis_name: 'Type 2 Diabetes',
        symptoms: JSON.stringify([
          'Excessive thirst',
          'Frequent urination',
          'Unexplained weight loss',
          'Increased hunger',
          'Fatigue',
          'Blurred vision'
        ]),
        category: 'Endocrine',
        severity_indicators: JSON.stringify({
          mild: ['Mild thirst', 'Occasional fatigue'],
          moderate: ['Increased hunger', 'Blurred vision'],
          severe: ['Unexplained weight loss', 'Frequent urination']
        }),
        common_age_groups: JSON.stringify(['adults', 'elderly']),
        gender_specific: 'both',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        diagnosis_name: 'Hypertension',
        symptoms: JSON.stringify([
          'Headaches',
          'Dizziness',
          'Chest pain',
          'Nosebleeds',
          'Shortness of breath',
          'Visual changes'
        ]),
        category: 'Cardiovascular',
        severity_indicators: JSON.stringify({
          mild: ['Mild headaches'],
          moderate: ['Dizziness', 'Chest pain'],
          severe: ['Severe headaches', 'Visual changes', 'Shortness of breath']
        }),
        common_age_groups: JSON.stringify(['adults', 'elderly']),
        gender_specific: 'both',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        diagnosis_name: 'Common Cold',
        symptoms: JSON.stringify([
          'Runny nose',
          'Stuffy nose',
          'Sore throat',
          'Cough',
          'Sneezing',
          'Mild fever',
          'Body aches'
        ]),
        category: 'Respiratory',
        severity_indicators: JSON.stringify({
          mild: ['Runny nose', 'Mild cough'],
          moderate: ['Sore throat', 'Body aches'],
          severe: ['High fever', 'Severe cough']
        }),
        common_age_groups: JSON.stringify(['children', 'adults', 'elderly']),
        gender_specific: 'both',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        diagnosis_name: 'Migraine',
        symptoms: JSON.stringify([
          'Severe headache',
          'Nausea',
          'Vomiting',
          'Sensitivity to light',
          'Sensitivity to sound',
          'Visual aura'
        ]),
        category: 'Neurological',
        severity_indicators: JSON.stringify({
          mild: ['Mild headache'],
          moderate: ['Moderate headache', 'Nausea'],
          severe: ['Severe headache', 'Vomiting', 'Visual aura']
        }),
        common_age_groups: JSON.stringify(['adolescents', 'adults']),
        gender_specific: 'female_predominant',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        diagnosis_name: 'Anxiety Disorder',
        symptoms: JSON.stringify([
          'Excessive worry',
          'Restlessness',
          'Difficulty concentrating',
          'Irritability',
          'Sleep disturbances',
          'Physical tension'
        ]),
        category: 'Mental Health',
        severity_indicators: JSON.stringify({
          mild: ['Mild worry', 'Occasional restlessness'],
          moderate: ['Regular worry', 'Sleep issues'],
          severe: ['Persistent anxiety', 'Panic attacks']
        }),
        common_age_groups: JSON.stringify(['adolescents', 'adults']),
        gender_specific: 'both',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], { ignoreDuplicates: true });
    
    console.log('✅ Symptoms/conditions database seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('symptoms_database', null, {});
  }
};