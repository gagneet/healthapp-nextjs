// quick-rename-tables.cjs - Rename tables directly via Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function renameTablesQuick() {
  console.log('🔧 Renaming database tables to PascalCase...');
  
  try {
    const renameCommands = [
      // Core tables
      'ALTER TABLE "users" RENAME TO "Users"',
      'ALTER TABLE "organizations" RENAME TO "Organizations"', 
      'ALTER TABLE "patients" RENAME TO "Patients"',
      'ALTER TABLE "doctors" RENAME TO "Doctors"',
      'ALTER TABLE "hsps" RENAME TO "HSPs"',
      'ALTER TABLE "specialities" RENAME TO "Specialities"',
      
      // Key medical tables
      'ALTER TABLE "medicines" RENAME TO "Medicines"',
      'ALTER TABLE "medications" RENAME TO "Medications"',
      'ALTER TABLE "medication_logs" RENAME TO "MedicationLogs"',
      'ALTER TABLE "care_plans" RENAME TO "CarePlans"',
      'ALTER TABLE "appointments" RENAME TO "Appointments"',
      
      // Support tables
      'ALTER TABLE "notifications" RENAME TO "Notifications"',
      'ALTER TABLE "audit_logs" RENAME TO "AuditLogs"',
      'ALTER TABLE "clinics" RENAME TO "Clinics"',
      'ALTER TABLE "appointment_slots" RENAME TO "AppointmentSlots"',
      
      // Vital monitoring
      'ALTER TABLE "vital_types" RENAME TO "VitalTypes"',
      'ALTER TABLE "vital_readings" RENAME TO "VitalReadings"',
      'ALTER TABLE "vital_templates" RENAME TO "VitalTemplates"',
      'ALTER TABLE "vitals" RENAME TO "Vitals"',
      'ALTER TABLE "symptoms" RENAME TO "Symptoms"',
      'ALTER TABLE "adherence_records" RENAME TO "AdherenceRecords"',
      
      // Auth tables
      'ALTER TABLE "accounts" RENAME TO "Accounts"',
      'ALTER TABLE "sessions" RENAME TO "Sessions"',
      'ALTER TABLE "verificationtokens" RENAME TO "VerificationTokens"',
      'ALTER TABLE "account_links" RENAME TO "AccountLinks"'
    ];
    
    for (const command of renameCommands) {
      try {
        await prisma.$executeRawUnsafe(command);
        console.log(`   ✅ ${command}`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠️  Skipped: ${command} (table may already be renamed)`);
        } else {
          console.log(`   ❌ Failed: ${command} - ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Table renaming completed!');
    console.log('✅ Now run: npx prisma generate');
    console.log('✅ Then run: npm run seed');
    
  } catch (error) {
    console.error('❌ Error during table renaming:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

renameTablesQuick();
