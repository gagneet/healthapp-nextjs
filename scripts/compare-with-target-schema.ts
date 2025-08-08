#!/usr/bin/env node

// scripts/compare-with-target-schema.js
// Compare current database structure with target healthapp_schema.sql
import fs from 'fs/promises';
import path from 'path';
import sequelize from '../src/config/database.js';

async function compareWithTargetSchema() {
  console.log('🔍 Comparing current setup with target schema...\n');
  
  try {
    // Expected tables from healthapp_schema.sql
    const targetTables = [
      'organizations',
      'users',
      'healthcare_providers', 
      'patients',
      'patient_provider_assignments',
      'care_plan_templates',
      'care_plans',
      'medications',
      'vital_types',
      'vital_requirements',
      'appointments',
      'scheduled_events',
      'adherence_records',
      'vital_readings',
      'symptoms',
      'notifications',
      'user_devices',
      'service_plans',
      'patient_subscriptions',
      'audit_logs'
    ];
    
    // Expected ENUM types
    const targetEnums = [
      'user_role',
      'account_status', 
      'gender',
      'appointment_status',
      'care_plan_status',
      'priority_level',
      'event_status',
      'event_type',
      'notification_channel',
      'subscription_status'
    ];
    
    // Expected views
    const targetViews = [
      'v_active_care_plans',
      'v_patient_adherence_summary',
      'v_upcoming_events'
    ];
    
    // Expected functions
    const targetFunctions = [
      'update_updated_at_column'
    ];
    
    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // 1. Check Tables
    console.log('📊 TABLES COMPARISON:');
    const currentTables = await sequelize.getQueryInterface().showAllTables();
    
    const missingTables = targetTables.filter(table => !currentTables.includes(table));
    const extraTables = currentTables.filter(table => !targetTables.includes(table));
    
    console.log(`   Target tables: ${targetTables.length}`);
    console.log(`   Current tables: ${currentTables.length}`);
    console.log(`   ✅ Matching: ${targetTables.filter(t => currentTables.includes(t)).length}`);
    
    if (missingTables.length > 0) {
      console.log(`   ❌ Missing: ${missingTables.join(', ')}`);
    }
    
    if (extraTables.length > 0) {
      console.log(`   ⚠️  Extra: ${extraTables.join(', ')}`);
    }
    console.log('');
    
    // 2. Check ENUM Types
    console.log('🏷️  ENUM TYPES COMPARISON:');
    try {
      const currentEnums = await sequelize.query(
        "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;",
        { type: (sequelize as any).QueryTypes.SELECT }
      );
      const currentEnumNames = currentEnums.map(e => (e as any).typname);
      
      const missingEnums = targetEnums.filter(enumType => !currentEnumNames.includes(enumType));
      const extraEnums = currentEnumNames.filter(enumType => !targetEnums.includes(enumType));
      
      console.log(`   Target ENUMs: ${targetEnums.length}`);
      console.log(`   Current ENUMs: ${currentEnumNames.length}`);
      console.log(`   ✅ Matching: ${targetEnums.filter(e => currentEnumNames.includes(e)).length}`);
      
      if (missingEnums.length > 0) {
        console.log(`   ❌ Missing: ${missingEnums.join(', ')}`);
      }
      
      if (extraEnums.length > 0) {
        console.log(`   ⚠️  Extra: ${extraEnums.join(', ')}`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not check ENUM types');
    }
    console.log('');
    
    // 3. Check Views
    console.log('👁️  VIEWS COMPARISON:');
    try {
      const currentViews = await sequelize.query(
        "SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;",
        { type: (sequelize as any).QueryTypes.SELECT }
      );
      const currentViewNames = currentViews.map(v => (v as any).viewname);
      
      const missingViews = targetViews.filter(view => !currentViewNames.includes(view));
      const extraViews = currentViewNames.filter(view => !targetViews.includes(view));
      
      console.log(`   Target views: ${targetViews.length}`);
      console.log(`   Current views: ${currentViewNames.length}`);
      console.log(`   ✅ Matching: ${targetViews.filter(v => currentViewNames.includes(v)).length}`);
      
      if (missingViews.length > 0) {
        console.log(`   ❌ Missing: ${missingViews.join(', ')}`);
      }
      
      if (extraViews.length > 0) {
        console.log(`   ⚠️  Extra: ${extraViews.join(', ')}`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not check views');
    }
    console.log('');
    
    // 4. Check Functions
    console.log('⚙️  FUNCTIONS COMPARISON:');
    try {
      const currentFunctions = await sequelize.query(
        `SELECT proname FROM pg_proc 
         WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
         AND proname IN ('${targetFunctions.join("','")}')
         ORDER BY proname;`,
        { type: (sequelize as any).QueryTypes.SELECT }
      );
      const currentFunctionNames = currentFunctions.map(f => (f as any).proname);
      
      const missingFunctions = targetFunctions.filter(func => !currentFunctionNames.includes(func));
      
      console.log(`   Target functions: ${targetFunctions.length}`);
      console.log(`   Current functions: ${currentFunctionNames.length}`);
      console.log(`   ✅ Matching: ${targetFunctions.filter(f => currentFunctionNames.includes(f)).length}`);
      
      if (missingFunctions.length > 0) {
        console.log(`   ❌ Missing: ${missingFunctions.join(', ')}`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not check functions');
    }
    console.log('');
    
    // 5. Check Extensions
    console.log('🧩 EXTENSIONS COMPARISON:');
    try {
      const extensions = await sequelize.query(
        "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');",
        { type: (sequelize as any).QueryTypes.SELECT }
      );
      const extensionNames = extensions.map(e => (e as any).extname);
      const targetExtensions = ['uuid-ossp', 'pgcrypto', 'pg_trgm'];
      
      console.log(`   Target extensions: ${targetExtensions.length}`);
      console.log(`   Current extensions: ${extensionNames.length}`);
      console.log(`   ✅ Available: ${extensionNames.join(', ')}`);
      
      const missingExtensions = targetExtensions.filter(ext => !extensionNames.includes(ext));
      if (missingExtensions.length > 0) {
        console.log(`   ❌ Missing: ${missingExtensions.join(', ')}`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not check extensions');
    }
    console.log('');
    
    // 6. Overall Assessment
    console.log('📋 OVERALL ASSESSMENT:');
    const tablesMatch = missingTables.length === 0;
    const structureComplete = tablesMatch;
    
    if (structureComplete) {
      console.log('✅ Database structure matches target schema!');
      console.log('✅ Ready for production use');
    } else {
      console.log('⚠️  Database structure needs updates');
      console.log('🛠️  Run migrations to complete setup: npm run migrate');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    if (missingTables.length > 0) {
      console.log('   1. Run migrations: npm run migrate');
    }
    if (currentTables.length === 0) {
      console.log('   1. Create database if it doesn\'t exist');
      console.log('   2. Run migrations: npm run migrate');
    }
    console.log('   2. Run seeders: npm run seed');
    console.log('   3. Test the application: npm run dev');
    
  } catch (error) {
    console.error('❌ Comparison failed:', (error as any).message);
    
    if ((error as any).message.includes('database') && (error as any).message.includes('does not exist')) {
      console.log('\n🛠️  Database does not exist. Create it first:');
      console.log('   1. Connect to PostgreSQL: psql -U postgres');
      console.log('   2. Create database: CREATE DATABASE healthapp;');
      console.log('   3. Run migrations: npm run migrate');
    }
  } finally {
    await sequelize.close();
  }
}

// Run the comparison
compareWithTargetSchema().catch(console.error);