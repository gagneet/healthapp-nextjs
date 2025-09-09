// diagnostic-tables.cjs - Check which tables need renaming
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticTableNames() {
  console.log('🔍 Diagnosing table name issues...');
  
  try {
    // Get current table names
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('SequelizeMeta', '_prisma_migrations', '_DeviceReadingToEmergencyAlert')
      ORDER BY table_name
    `;
    
    const currentTableNames = allTables.map(t => t.table_name);
    
    // Expected mappings based on your schema @@map directives
    const expectedMappings = {
      // Core tables
      'users': 'Users',
      'organizations': 'Organizations', 
      'patients': 'Patients',
      'doctors': 'Doctor',
      'hsps': 'Hsp',
      'specialities': 'Specialities',
      'clinics': 'Clinics',
      
      // Medical tables
      'medicines': 'Medicines',
      'medications': 'Medications',
      'medication_logs': 'MedicationLogs',
      'carePlans': 'CarePlans',
      'appointments': 'Appointments',
      'symptoms': 'Symptoms',
      'adherence_records': 'AdherenceRecords',
      'vital_types': 'VitalTypes',
      'vital_readings': 'VitalReadings',
      'vital_templates': 'VitalTemplates',
      'vitals': 'Vitals',
      
      // System tables
      'notifications': 'Notifications',
      'audit_logs': 'AuditLogs',
      'accounts': 'Accounts',
      'sessions': 'Sessions',
      'verificationtokens': 'VerificationTokens',
      'account_links': 'AccountLinks',
      
      // The problematic ones from your error
      'providers': 'Providers',
      'healthcare_providers': 'HealthcareProviders',
    };
    
    console.log('\n📊 Table Status Report:');
    console.log('='.repeat(50));
    
    let needsRename = [];
    let alreadyCorrect = [];
    let missing = [];
    
    for (const [oldName, expectedName] of Object.entries(expectedMappings)) {
      if (currentTableNames.includes(expectedName)) {
        alreadyCorrect.push(`✅ ${expectedName} (correct)`);
      } else if (currentTableNames.includes(oldName)) {
        needsRename.push(`❌ ${oldName} → needs rename to ${expectedName}`);
      } else {
        missing.push(`⚠️  Neither ${oldName} nor ${expectedName} found`);
      }
    }
    
    if (alreadyCorrect.length > 0) {
      console.log('\n✅ Correctly Named Tables:');
      alreadyCorrect.forEach(msg => console.log(`  ${msg}`));
    }
    
    if (needsRename.length > 0) {
      console.log('\n❌ Tables That Need Renaming:');
      needsRename.forEach(msg => console.log(`  ${msg}`));
    }
    
    if (missing.length > 0) {
      console.log('\n⚠️  Missing Tables:');
      missing.forEach(msg => console.log(`  ${msg}`));
    }
    
    // Show other tables that exist but aren't in our mapping
    const otherTables = currentTableNames.filter(name => 
      !Object.values(expectedMappings).includes(name) &&
      !Object.keys(expectedMappings).includes(name)
    );
    
    if (otherTables.length > 0) {
      console.log('\n📋 Other Tables (may need attention):');
      otherTables.forEach(name => {
        const isPascalCase = /^[A-Z][a-zA-Z]*$/.test(name);
        console.log(`  ${isPascalCase ? '✅' : '❓'} ${name}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (needsRename.length > 0) {
      console.log(`\n🔧 Action Required: ${needsRename.length} tables need renaming`);
      console.log('Run: node fix-remaining-tables.cjs');
    } else {
      console.log('\n🎉 All expected tables are correctly named!');
      console.log('Try running: npm run seed');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticTableNames();
