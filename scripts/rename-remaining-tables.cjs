// fix-remaining-tables.cjs - Fix tables that weren't renamed yet
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRemainingTables() {
  console.log('🔧 Checking and fixing remaining table name mismatches...');
  
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
    
    console.log('\n📋 Current tables:', allTables.map(t => t.table_name).join(', '));
    
    // Define the expected mappings (lowercase -> PascalCase)
    const tableMappings = {
      'providers': 'Providers',
      'healthcare_providers': 'HealthcareProviders',
      'patient_doctor_assignments': 'PatientDoctorAssignments',
      'patient_provider_assignments': 'PatientProviderAssignments',
      'patient_provider_consent_history': 'PatientProviderConsentHistory',
      'secondary_doctor_assignments': 'SecondaryDoctorAssignments',
      'provider_change_history': 'ProviderChangeHistory',
      'service_plans': 'ServicePlans',
      'patient_subscriptions': 'PatientSubscriptions',
      'payment_methods': 'PaymentMethods',
      'payments': 'Payments',
      'care_plan_templates': 'CarePlanTemplates',
      'treatment_plans': 'TreatmentPlans',
      'dashboard_metrics': 'DashboardMetrics',
      'symptoms_database': 'SymptomsDatabase',
      'treatment_database': 'TreatmentDatabase',
      'user_devices': 'UserDevices',
      'user_roles': 'UserRoles',
      'scheduled_events': 'ScheduledEvents',
      'schedule_events': 'ScheduleEvents',
      'patient_alerts': 'PatientAlerts',
      'patient_consent_otp': 'PatientConsentOtp',
      'doctor_availability': 'DoctorAvailability',
      'appointment_slots': 'AppointmentSlots',
      'vital_requirements': 'VitalRequirements',
      'drug_interactions': 'DrugInteractions',
      'patient_allergies': 'PatientAllergies',
      'medication_safety_alerts': 'MedicationSafetyAlerts',
      'emergency_alerts': 'EmergencyAlerts',
      'vital_alert_rules': 'VitalAlertRules',
      'emergency_contacts': 'EmergencyContacts',
      'video_consultations': 'VideoConsultations',
      'consultation_prescriptions': 'ConsultationPrescriptions',
      'consultation_notes': 'ConsultationNotes',
      'lab_orders': 'LabOrders',
      'lab_results': 'LabResults',
      'patient_game_profiles': 'PatientGameProfiles',
      'game_badge_awards': 'GameBadgeAwards',
      'game_challenge_progress': 'GameChallengeProgress',
      'connected_devices': 'ConnectedDevices',
      'device_readings': 'DeviceReadings',
      'device_plugins': 'DevicePlugins'
    };
    
    const currentTableNames = allTables.map(t => t.table_name);
    let renamedCount = 0;
    
    console.log('\n🔄 Renaming tables...');
    
    for (const [oldName, newName] of Object.entries(tableMappings)) {
      if (currentTableNames.includes(oldName)) {
        if (!isSafeTableName(oldName) || !isSafeTableName(newName)) {
          console.log(`  ❌ Unsafe table name detected: ${oldName} or ${newName}`);
          continue;
        }
        try {
          const renameCommand = `ALTER TABLE "${oldName}" RENAME TO "${newName}"`;
          // Table names are validated above, so this is safe
          await prisma.$executeRawUnsafe(renameCommand);
          console.log(`  ✅ ${oldName} → ${newName}`);
          renamedCount++;
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ⚠️  ${oldName} → ${newName} (target already exists)`);
          } else {
            console.log(`  ❌ Failed to rename ${oldName}: ${error.message}`);
          }
        }
      } else if (currentTableNames.includes(newName)) {
        console.log(`  ✅ ${newName} (already correct)`);
      }
    }
    
    console.log(`\n🎉 Renamed ${renamedCount} tables`);
    
    if (renamedCount > 0) {
      console.log('\n✅ Next steps:');
      console.log('1. Run: npx prisma generate');
      console.log('2. Run: npm run seed');
    } else {
      console.log('\n✅ All tables appear to be correctly named');
      console.log('Run: npm run seed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing table names:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingTables();
