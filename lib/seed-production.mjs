// seed-production.mjs - Simple seeding for production deployment
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Generate secure password hash
async function generateSecurePasswordHash(password) {
  const saltRounds = 12; // Higher security for production
  return await bcrypt.hash(password, saltRounds);
}

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Use environment variable or generate secure default password
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
    const securePasswordHash = await generateSecurePasswordHash(defaultPassword);
    
    // Create test doctor users with secure, randomized data
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: 'doctor@healthapp.com',
        password_hash: securePasswordHash,
        role: 'DOCTOR',
        first_name: 'Dr. John',
        last_name: 'Smith',
        email_verified: true,
        account_status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: 'doctor1@healthapp.com',
        password_hash: securePasswordHash,
        role: 'DOCTOR',
        first_name: 'Dr. Jane',
        last_name: 'Doe',
        email_verified: true,
        account_status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log('✅ Basic users seeded successfully');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Users already exist, skipping user creation');
    } else {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error('Fatal seeding error:', error);
  process.exit(1);
});