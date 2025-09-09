#!/usr/bin/env npx tsx

import { PrismaClient } from 'prisma-client-7e72d2f550c5ff4f73ac96df23033c6f3479aae70fdddbbe64c5fd8a64d30539';

const prisma = new PrismaClient();

const dietPlans = [
    { name: 'Balanced Diet', description: 'A balanced diet focusing on all major food groups.', type: 'General', details: { guidelines: 'Eat a variety of fruits, vegetables, grains, proteins, and dairy.' } },
    { name: 'Low-Carb Diet', description: 'A diet that restricts carbohydrates, such as those found in sugary foods, pasta, and bread.', type: 'Weight Loss', details: { guidelines: 'Focus on protein, healthy fats, and non-starchy vegetables.' } },
    { name: 'Mediterranean Diet', description: 'A diet inspired by the eating habits of Greece, Southern Italy, and Spain.', type: 'Heart Health', details: { guidelines: 'Emphasizes fruits, vegetables, whole grains, legumes, nuts, seeds, and healthy fats.' } },
    { name: 'Vegetarian Diet', description: 'A diet that excludes meat and fish.', type: 'Lifestyle', details: { guidelines: 'Focus on plant-based proteins like beans, lentils, tofu, and tempeh.' } },
];

const workoutPlans = [
    { name: 'Beginner Cardio', description: 'A 30-minute cardio workout for beginners.', type: 'Cardio', details: { routine: '5 min warmup, 20 min brisk walking or cycling, 5 min cool down.' } },
    { name: 'Full-Body Strength Training', description: 'A full-body workout using weights or bodyweight.', type: 'Strength', details: { routine: '3 sets of 10-12 reps of squats, push-ups, rows, and overhead press.' } },
    { name: 'Yoga and Flexibility', description: 'A relaxing yoga routine to improve flexibility and reduce stress.', type: 'Flexibility', details: { routine: 'A series of basic yoga poses and stretches held for 30 seconds each.' } },
    { name: 'High-Intensity Interval Training (HIIT)', description: 'A short, intense workout that alternates between high-intensity and low-intensity periods.', type: 'Cardio', details: { routine: '30 seconds of max effort (e.g., burpees, sprints) followed by 30 seconds of rest, repeated for 15 minutes.' } },
];

async function seedDietAndWorkoutPlans() {
    try {
        console.log('🥗 Creating diet plans...');
        for (const plan of dietPlans) {
            await prisma.dietPlan.upsert({
                where: { name: plan.name },
                update: {},
                create: plan,
            });
            console.log(`✅ Created/Updated diet plan: ${plan.name}`);
        }

        console.log('💪 Creating workout plans...');
        for (const plan of workoutPlans) {
            await prisma.workoutPlan.upsert({
                where: { name: plan.name },
                update: {},
                create: plan,
            });
            console.log(`✅ Created/Updated workout plan: ${plan.name}`);
        }

        console.log(`\n🎉 Successfully seeded ${dietPlans.length} diet plans and ${workoutPlans.length} workout plans!`);

    } catch (error) {
        console.error('❌ Error seeding diet and workout plans:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedDietAndWorkoutPlans();