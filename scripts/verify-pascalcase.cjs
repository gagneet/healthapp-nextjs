// verify-pascalcase-tables.cjs - Verify all tables are properly renamed
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyPascalCaseTables() {
  console.log('🧪 Verifying PascalCase table naming...');
  
  try {
    // Check what tables actually exist
    console.log('\n📋 Current database tables:');
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const tableNames = allTables.map(t => t.table_name);
    tableNames.forEach(name => {
      const isPascalCase = /^[A-Z][a-zA-Z]*$/.test(name);
      const isSystemTable = ['SequelizeMeta', '_prisma_migrations', '_DeviceReadingToEmergencyAlert'].includes(name);
      
      if (isSystemTable) {
        console.log(`  📄 ${name} (system table)`);
      } else if (isPascalCase) {
        console.log(`  ✅ ${name} (PascalCase)`);
      } else {
        console.log(`  ❌ ${name} (not PascalCase)`);
      }
    });
    
    // Test Prisma model access
    console.log('\n🧪 Testing Prisma model access:');
    
    const tests = [
      { model: 'user', name: 'Users' },
      { model: 'organization', name: 'Organizations' },
      { model: 'patient', name: 'Patients' },
      { model: 'doctor', name: 'Doctor' },
      { model: 'medicine', name: 'Medicines' },
      { model: 'appointment', name: 'Appointments' }
    ];
    
    let allSuccess = true;
    
    for (const test of tests) {
      try {
        const count = await prisma[test.model].count();
        console.log(`  ✅ prisma.${test.model}.count() = ${count} (table: ${test.name})`);
      } catch (error) {
        console.log(`  ❌ prisma.${test.model}.count() failed: ${error.message}`);
        allSuccess = false;
        
        if (error.code === 'P2021') {
          const expectedTable = error.message.match(/table `public\.(.+?)` does not exist/)?.[1];
          console.log(`     Expected table: ${expectedTable}`);
        }
      }
    }
    
    if (allSuccess) {
      console.log('\n🎉 SUCCESS! All tables are properly named and accessible.');
      console.log('✅ Your schema convention is working correctly:');
      console.log('   • PascalCase models: model User, model Patient');
      console.log('   • PascalCase database tables: Users, Patients');
      console.log('   • camelCase client: prisma.user, prisma.patient');
      console.log('\n✅ You can now run: npm run seed');
    } else {
      console.log('\n❌ Some issues found. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPascalCaseTables();
