// src/seeders/005-treatments.cjs
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    console.log('💉 Seeding treatments database (idempotent)...');
    
    // Check if treatments already exist
    const existingTreatments = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM treatment_database",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingTreatments[0].count > 0) {
      console.log(`ℹ️ Treatments already exist (${existingTreatments[0].count} found), skipping seeding`);
      return;
    }

    await queryInterface.bulkInsert('treatment_database', [
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        treatment_name: 'Metformin Therapy',
        treatment_type: 'medication',
        description: 'First-line medication for Type 2 diabetes management',
        applicable_conditions: JSON.stringify(['Type 2 Diabetes', 'Pre-diabetes', 'PCOS']),
        duration: 'Long-term',
        frequency: 'Twice daily with meals',
        dosage_info: JSON.stringify({
          initial_dose: '500mg twice daily',
          maximum_dose: '2000mg daily',
          titration: 'Increase by 500mg weekly as tolerated'
        }),
        category: 'Antidiabetic',
        severity_level: 'moderate',
        age_restrictions: JSON.stringify({
          minimum_age: 10,
          elderly_considerations: 'Monitor renal function'
        }),
        contraindications: JSON.stringify([
          'Severe renal impairment',
          'Metabolic acidosis',
          'Heart failure requiring medication'
        ]),
        side_effects: JSON.stringify([
          'Gastrointestinal upset',
          'Metallic taste',
          'Vitamin B12 deficiency (long-term)'
        ]),
        monitoring_required: JSON.stringify([
          'Blood glucose levels',
          'Renal function',
          'Vitamin B12 levels annually'
        ]),
        is_active: true,
        requires_specialist: false,
        prescription_required: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        treatment_name: 'ACE Inhibitor Therapy',
        treatment_type: 'medication',
        description: 'Blood pressure management using ACE inhibitors',
        applicable_conditions: JSON.stringify(['Hypertension', 'Heart failure', 'Diabetic nephropathy']),
        duration: 'Long-term',
        frequency: 'Once daily',
        dosage_info: JSON.stringify({
          initial_dose: '10mg daily',
          maximum_dose: '80mg daily',
          titration: 'Increase every 2-4 weeks as needed'
        }),
        category: 'Antihypertensive',
        severity_level: 'moderate',
        age_restrictions: JSON.stringify({
          minimum_age: 18,
          elderly_considerations: 'Start with lower doses'
        }),
        contraindications: JSON.stringify([
          'Pregnancy',
          'Bilateral renal artery stenosis',
          'History of angioedema'
        ]),
        side_effects: JSON.stringify([
          'Dry cough',
          'Hyperkalemia',
          'Angioedema (rare)'
        ]),
        monitoring_required: JSON.stringify([
          'Blood pressure',
          'Renal function',
          'Serum potassium'
        ]),
        is_active: true,
        requires_specialist: false,
        prescription_required: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        treatment_name: 'Rest and Hydration',
        treatment_type: 'supportive_care',
        description: 'Conservative treatment for viral upper respiratory infections',
        applicable_conditions: JSON.stringify(['Common Cold', 'Viral URI', 'Mild fever']),
        duration: '5-7 days',
        frequency: 'As needed',
        dosage_info: JSON.stringify({
          fluids: '8-10 glasses of water daily',
          rest: '7-9 hours of sleep',
          activity: 'Light activity as tolerated'
        }),
        category: 'Supportive Care',
        severity_level: 'mild',
        age_restrictions: JSON.stringify({
          minimum_age: 0,
          pediatric_considerations: 'Ensure adequate fluid intake'
        }),
        contraindications: JSON.stringify([
          'Signs of bacterial infection',
          'Severe dehydration',
          'High fever >101.3°F in infants'
        ]),
        side_effects: JSON.stringify([]),
        monitoring_required: JSON.stringify([
          'Temperature',
          'Hydration status',
          'Symptom progression'
        ]),
        is_active: true,
        requires_specialist: false,
        prescription_required: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440024',
        treatment_name: 'Triptan Therapy',
        treatment_type: 'medication',
        description: 'Acute migraine treatment with triptan medications',
        applicable_conditions: JSON.stringify(['Migraine', 'Cluster headache']),
        duration: 'As needed',
        frequency: 'At onset of migraine',
        dosage_info: JSON.stringify({
          sumatriptan: '50-100mg at onset, may repeat once after 2 hours',
          maximum_daily: '200mg',
          monthly_limit: '9 days per month'
        }),
        category: 'Antimigraine',
        severity_level: 'moderate',
        age_restrictions: JSON.stringify({
          minimum_age: 18,
          maximum_age: 65,
          elderly_considerations: 'Use with caution'
        }),
        contraindications: JSON.stringify([
          'Cardiovascular disease',
          'Uncontrolled hypertension',
          'Pregnancy',
          'Hemiplegic migraine'
        ]),
        side_effects: JSON.stringify([
          'Chest tightness',
          'Tingling sensations',
          'Drowsiness',
          'Nausea'
        ]),
        monitoring_required: JSON.stringify([
          'Headache frequency',
          'Blood pressure',
          'Cardiovascular risk factors'
        ]),
        is_active: true,
        requires_specialist: true,
        prescription_required: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440025',
        treatment_name: 'Cognitive Behavioral Therapy',
        treatment_type: 'psychotherapy',
        description: 'Evidence-based psychotherapy for anxiety disorders',
        applicable_conditions: JSON.stringify(['Anxiety Disorder', 'Depression', 'PTSD', 'Panic Disorder']),
        duration: '12-20 sessions',
        frequency: 'Weekly sessions',
        dosage_info: JSON.stringify({
          session_length: '45-60 minutes',
          homework_exercises: 'Daily practice recommended',
          group_vs_individual: 'Both options available'
        }),
        category: 'Psychotherapy',
        severity_level: 'mild_to_moderate',
        age_restrictions: JSON.stringify({
          minimum_age: 6,
          pediatric_adaptations: 'Play therapy techniques for children'
        }),
        contraindications: JSON.stringify([
          'Active psychosis',
          'Severe cognitive impairment',
          'Substance intoxication'
        ]),
        side_effects: JSON.stringify([
          'Initial increase in anxiety (temporary)',
          'Emotional fatigue after sessions'
        ]),
        monitoring_required: JSON.stringify([
          'Anxiety symptom scales',
          'Functional improvement',
          'Treatment adherence'
        ]),
        is_active: true,
        requires_specialist: true,
        prescription_required: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], { ignoreDuplicates: true });
    
    console.log('✅ Treatments database seeded successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('treatment_database', null, {});
  }
};