// seed-production.mjs - Simple seeding for production deployment
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Create test doctor users  
    await prisma.user.create({
      data: {
        id: '3daf23be-9a9b-437e-9de7-62f9617a9018',
        email: 'doctor@healthapp.com',
        password_hash: '$2a$10$Ek8C8F4QoF2mFN2jF3JT6OBLy6qYJ8F2OVN2JT6OBLy6qYJ8F2OVN',
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
        id: '4daf23be-9a9b-437e-9de7-62f9617a9019',
        email: 'doctor1@healthapp.com',
        password_hash: '$2a$10$Ek8C8F4QoF2mFN2jF3JT6OBLy6qYJ8F2OVN2JT6OBLy6qYJ8F2OVN',
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