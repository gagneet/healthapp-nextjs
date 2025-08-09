#!/usr/bin/env node

// scripts/test-database-setup.js
// Test script to verify PostgreSQL migration and models setup
import sequelize from '../src/config/database.js';
import '../src/models/index.js';

async function testDatabaseSetup() {
  console.log('🔧 Testing PostgreSQL Database Setup...\n');
  
  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Test 2: Check if all models are loaded
    console.log('2. Checking loaded models...');
    const models = Object.keys(sequelize.models);
    console.log(`✅ Loaded ${models.length} models:`);
    models.forEach(model => console.log(`   - ${model}`));
    console.log('');
    
    // Test 3: Check if database exists (by trying to list tables)
    console.log('3. Checking database tables...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Found ${tables.length} tables in database:`);
    tables.forEach(table => console.log(`   - ${table}`));
    console.log('');
    
    // Test 4: Check if essential tables exist
    console.log('4. Verifying essential tables exist...');
    const essentialTables = [
      'organizations',
      'users', 
      'healthcare_providers',
      'patients',
      'care_plans',
      'vital_types',
      'scheduled_events',
      'adherence_records',
      'notifications'
    ];
    
    const missingTables = essentialTables.filter(table => !tables.includes(table));
    if (missingTables.length === 0) {
      console.log('✅ All essential tables exist');
    } else {
      console.log('❌ Missing essential tables:', missingTables);
    }
    console.log('');
    
    // Test 5: Check if PostgreSQL extensions are available
    console.log('5. Checking PostgreSQL extensions...');
    try {
      const extensions = await sequelize.query(
        "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');",
        { type: (sequelize as any).QueryTypes.SELECT }
      );
      console.log(`✅ PostgreSQL extensions available: ${extensions.map(e => (e as any).extname).join(', ')}`);
    } catch (error) {
      console.log('⚠️  Could not check extensions (might need to run migrations first)');
    }
    console.log('');
    
    // Test 6: Check if ENUM types exist
    console.log('6. Checking custom ENUM types...');
    try {
      const enums = await sequelize.query(
        `SELECT typname FROM pg_type WHERE typtype = 'e' AND typname IN 
         ('user_role', 'account_status', 'gender', 'appointment_status', 'care_plan_status', 
          'priority_level', 'event_status', 'event_type', 'notification_channel', 'subscription_status');`,
        { type: (sequelize as any).QueryTypes.SELECT }
      );
      console.log(`✅ Custom ENUM types: ${enums.map(e => (e as any).typname).join(', ')}`);
    } catch (error) {
      console.log('⚠️  Could not check ENUM types (might need to run migrations first)');
    }
    console.log('');
    
    // Test 7: Sample data operations
    console.log('7. Testing sample data operations...');
    try {
      // Test creating a sample organization (will fail if tables don't exist)
      const { Organization } = sequelize.models;
      if (Organization) {
        const sampleOrg = await Organization.findOrCreate({
          where: { name: 'Test Healthcare System' },
          defaults: {
            type: 'hospital',
            contact_info: { phone: '555-0123' },
            address: { city: 'Test City' }
          }
        });
        console.log('✅ Sample organization created/found');
        
        // Clean up
        if (sampleOrg[1]) { // Only delete if we created it
          await sampleOrg[0].destroy();
          console.log('✅ Sample data cleaned up');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not test data operations:', (error as any).message);
    }
    console.log('');
    
    console.log('🎉 Database setup test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Database: ${sequelize.config.database}`);
    console.log(`   - Host: ${sequelize.config.host}:${sequelize.config.port}`);
    console.log(`   - Dialect: ${(sequelize.config as any).dialect}`);
    console.log(`   - Models loaded: ${models.length}`);
    console.log(`   - Tables found: ${tables.length}`);
    
  } catch (error) {
    console.error('❌ Database setup test failed:', (error as any).message);
    console.error('\n🛠️  Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check database connection parameters in .env');
    console.error('   3. Run migrations: npm run migrate');
    console.error('   4. Check if database exists and user has permissions');
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testDatabaseSetup().catch(console.error);