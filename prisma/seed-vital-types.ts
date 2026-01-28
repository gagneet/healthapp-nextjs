/**
 * Seed VitalTypes - Standard Vital Signs
 * Run: npx tsx prisma/seed-vital-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vitalTypes = [
  {
    name: 'Blood Pressure',
    unit: 'mmHg',
    normalRangeMin: 90,
    normalRangeMax: 140,
    description: 'Systolic blood pressure measurement',
    validationRules: {
      type: 'compound',
      fields: ['systolic', 'diastolic'],
      systolicRange: [70, 200],
      diastolicRange: [40, 130]
    }
  },
  {
    name: 'Heart Rate',
    unit: 'bpm',
    normalRangeMin: 60,
    normalRangeMax: 100,
    description: 'Resting heart rate',
    validationRules: {
      type: 'single',
      min: 40,
      max: 200
    }
  },
  {
    name: 'Body Temperature',
    unit: '°F',
    normalRangeMin: 97.0,
    normalRangeMax: 99.0,
    description: 'Body temperature in Fahrenheit',
    validationRules: {
      type: 'single',
      min: 95.0,
      max: 106.0
    }
  },
  {
    name: 'Weight',
    unit: 'lbs',
    normalRangeMin: null,
    normalRangeMax: null,
    description: 'Body weight in pounds',
    validationRules: {
      type: 'single',
      min: 50,
      max: 600
    }
  },
  {
    name: 'Blood Glucose',
    unit: 'mg/dL',
    normalRangeMin: 70,
    normalRangeMax: 140,
    description: 'Blood glucose level',
    validationRules: {
      type: 'single',
      min: 40,
      max: 600,
      fasting: { min: 70, max: 100 },
      postMeal: { min: 70, max: 140 }
    }
  },
  {
    name: 'Oxygen Saturation',
    unit: '%',
    normalRangeMin: 95,
    normalRangeMax: 100,
    description: 'Blood oxygen saturation level (SpO2)',
    validationRules: {
      type: 'single',
      min: 70,
      max: 100
    }
  },
  {
    name: 'Respiratory Rate',
    unit: 'breaths/min',
    normalRangeMin: 12,
    normalRangeMax: 20,
    description: 'Number of breaths per minute',
    validationRules: {
      type: 'single',
      min: 8,
      max: 40
    }
  },
  {
    name: 'Height',
    unit: 'inches',
    normalRangeMin: null,
    normalRangeMax: null,
    description: 'Height in inches',
    validationRules: {
      type: 'single',
      min: 36,
      max: 96
    }
  },
  {
    name: 'BMI',
    unit: 'kg/m²',
    normalRangeMin: 18.5,
    normalRangeMax: 24.9,
    description: 'Body Mass Index',
    validationRules: {
      type: 'calculated',
      formula: 'weight(kg) / (height(m))^2',
      min: 10,
      max: 60
    }
  },
  {
    name: 'Pulse',
    unit: 'bpm',
    normalRangeMin: 60,
    normalRangeMax: 100,
    description: 'Pulse rate',
    validationRules: {
      type: 'single',
      min: 40,
      max: 200
    }
  }
];

async function seedVitalTypes() {
  console.log('🏥 Seeding VitalTypes...\n');

  try {
    // Check existing vital types
    const existingCount = await prisma.vitalType.count();
    console.log(`Found ${existingCount} existing vital types`);

    if (existingCount > 0) {
      console.log('⚠️  VitalTypes already exist. Do you want to:');
      console.log('   1. Skip seeding (existing data preserved)');
      console.log('   2. Add only missing types');
      console.log('\nProceeding with option 2: Adding only missing types\n');
    }

    let created = 0;
    let skipped = 0;

    for (const vitalType of vitalTypes) {
      const existing = await prisma.vitalType.findFirst({
        where: { name: vitalType.name }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${vitalType.name} (already exists)`);
        skipped++;
      } else {
        await prisma.vitalType.create({
          data: vitalType
        });
        console.log(`✅ Created: ${vitalType.name} (${vitalType.unit})`);
        created++;
      }
    }

    console.log(`\n✨ Seeding completed!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${created + skipped}\n`);

    // Display all vital types
    const allVitalTypes = await prisma.vitalType.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('📋 Current VitalTypes in database:\n');
    allVitalTypes.forEach((vt, index) => {
      console.log(`${index + 1}. ${vt.name}`);
      console.log(`   ID: ${vt.id}`);
      console.log(`   Unit: ${vt.unit}`);
      console.log(`   Normal Range: ${vt.normalRangeMin || 'N/A'} - ${vt.normalRangeMax || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding VitalTypes:', error);
    throw error;
  }
}

// Execute if run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedVitalTypes()
    .then(() => {
      console.log('✅ Seeding process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedVitalTypes };
