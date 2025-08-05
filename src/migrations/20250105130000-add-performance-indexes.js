// Migration: Add performance indexes for scalability
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding performance indexes for healthcare application scalability...');

    // 1. CRITICAL INDEXES for Patient Management (>10K patients per doctor)
    
    // Composite index for patient-doctor relationship queries
    await queryInterface.addIndex('patients', 
      ['primary_care_doctor_id', 'created_at', 'is_active'], {
      name: 'idx_patients_doctor_created_active',
      concurrently: true
    });

    // Index for patient search by multiple criteria
    await queryInterface.addIndex('patients', 
      ['patient_id', 'created_at'], {
      name: 'idx_patients_id_created',
      concurrently: true
    });

    // User-patient relationship optimization
    await queryInterface.addIndex('patients', 
      ['user_id', 'primary_care_doctor_id'], {
      name: 'idx_patients_user_doctor',
      concurrently: true
    });

    // 2. DOCTOR ASSIGNMENT INDEXES (Secondary Doctor Management)
    
    // Patient-doctor assignments for secondary doctor system
    await queryInterface.addIndex('patient_doctor_assignments', 
      ['patient_id', 'assignment_type', 'is_active'], {
      name: 'idx_assignments_patient_type_active',
      concurrently: true
    });

    // Doctor assignments lookup
    await queryInterface.addIndex('patient_doctor_assignments', 
      ['doctor_id', 'is_active', 'created_at'], {
      name: 'idx_assignments_doctor_active_created',
      concurrently: true
    });

    // Consent status tracking
    await queryInterface.addIndex('patient_doctor_assignments', 
      ['patient_consent_status', 'consent_otp_expires_at'], {
      name: 'idx_assignments_consent_status_expires',
      concurrently: true,
      where: {
        patient_consent_required: true
      }
    });

    // 3. VITAL READINGS PERFORMANCE INDEXES (High-frequency data)
    
    // Time-series data optimization for vital readings
    await queryInterface.addIndex('vital_readings', 
      ['patient_id', 'reading_time', 'vital_type_id'], {
      name: 'idx_vitals_patient_time_type',
      concurrently: true
    });

    // Latest vitals lookup
    await queryInterface.addIndex('vital_readings', 
      ['patient_id', 'vital_type_id', 'reading_time'], {
      name: 'idx_vitals_patient_type_time_desc',
      concurrently: true
    });

    // Vital readings by date range
    await queryInterface.addIndex('vital_readings', 
      ['reading_time', 'patient_id'], {
      name: 'idx_vitals_time_patient',
      concurrently: true
    });

    // 4. ADHERENCE RECORDS INDEXES (Medication adherence tracking)
    
    // Primary adherence tracking index
    await queryInterface.addIndex('adherence_records', 
      ['patient_id', 'due_at', 'completion_status'], {
      name: 'idx_adherence_patient_due_status',
      concurrently: true
    });

    // Scheduled events adherence
    await queryInterface.addIndex('adherence_records', 
      ['scheduled_event_id', 'completion_status', 'completed_at'], {
      name: 'idx_adherence_event_status_completed',
      concurrently: true
    });

    // Overdue adherence tracking
    await queryInterface.addIndex('adherence_records', 
      ['due_at', 'completion_status'], {
      name: 'idx_adherence_due_status',
      concurrently: true,
      where: {
        completion_status: ['pending', 'missed']
      }
    });

    // 5. APPOINTMENTS SCHEDULING INDEXES
    
    // Provider scheduling optimization
    await queryInterface.addIndex('appointments', 
      ['provider_id', 'start_time', 'status'], {
      name: 'idx_appointments_provider_time_status',
      concurrently: true
    });

    // Patient appointments lookup
    await queryInterface.addIndex('appointments', 
      ['patient_id', 'start_time', 'status'], {
      name: 'idx_appointments_patient_time_status',
      concurrently: true
    });

    // Doctor appointments (for both doctor_id and hsp_id)
    await queryInterface.addIndex('appointments', 
      ['doctor_id', 'start_time'], {
      name: 'idx_appointments_doctor_time',
      concurrently: true,
      where: {
        doctor_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addIndex('appointments', 
      ['hsp_id', 'start_time'], {
      name: 'idx_appointments_hsp_time',
      concurrently: true,
      where: {
        hsp_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // 6. CARE PLANS INDEXES
    
    // Active care plans lookup
    await queryInterface.addIndex('care_plans', 
      ['patient_id', 'status', 'start_date'], {
      name: 'idx_careplans_patient_status_start',
      concurrently: true
    });

    // Provider care plans
    await queryInterface.addIndex('care_plans', 
      ['provider_id', 'status', 'created_at'], {
      name: 'idx_careplans_provider_status_created',
      concurrently: true
    });

    // Template-based care plans
    await queryInterface.addIndex('care_plans', 
      ['template_id', 'status'], {
      name: 'idx_careplans_template_status',
      concurrently: true,
      where: {
        template_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // 7. SCHEDULED EVENTS INDEXES (High-volume operations)
    
    // Patient scheduled events
    await queryInterface.addIndex('scheduled_events', 
      ['patient_id', 'scheduled_time', 'completion_status'], {
      name: 'idx_events_patient_time_status',
      concurrently: true
    });

    // Care plan events
    await queryInterface.addIndex('scheduled_events', 
      ['care_plan_id', 'scheduled_time', 'event_type'], {
      name: 'idx_events_careplan_time_type',
      concurrently: true
    });

    // Due events lookup
    await queryInterface.addIndex('scheduled_events', 
      ['scheduled_time', 'completion_status'], {
      name: 'idx_events_time_status',
      concurrently: true,
      where: {
        completion_status: ['pending', 'due']
      }
    });

    // 8. SYMPTOMS TRACKING INDEXES
    
    // Patient symptoms timeline
    await queryInterface.addIndex('symptoms', 
      ['patient_id', 'onset_time', 'severity'], {
      name: 'idx_symptoms_patient_onset_severity',
      concurrently: true
    });

    // Care plan symptoms
    await queryInterface.addIndex('symptoms', 
      ['care_plan_id', 'onset_time'], {
      name: 'idx_symptoms_careplan_onset',
      concurrently: true,
      where: {
        care_plan_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // 9. USER MANAGEMENT INDEXES (Authentication optimization)
    
    // User authentication lookup
    await queryInterface.addIndex('users', 
      ['email', 'account_status'], {
      name: 'idx_users_email_status',
      concurrently: true
    });

    // Mobile number lookup
    await queryInterface.addIndex('users', 
      ['mobile_number', 'account_status'], {
      name: 'idx_users_mobile_status',
      concurrently: true
    });

    // User roles lookup
    await queryInterface.addIndex('user_roles', 
      ['user_identity', 'linked_with'], {
      name: 'idx_userroles_identity_linked',
      concurrently: true
    });

    // 10. AUDIT LOGS INDEXES (Compliance and monitoring)
    
    // Audit trail by user and date
    await queryInterface.addIndex('audit_logs', 
      ['user_id', 'created_at', 'action'], {
      name: 'idx_audit_user_created_action',
      concurrently: true
    });

    // Entity audit trail
    await queryInterface.addIndex('audit_logs', 
      ['entity_type', 'entity_id', 'created_at'], {
      name: 'idx_audit_entity_type_id_created',
      concurrently: true
    });

    // 11. NOTIFICATIONS INDEXES
    
    // User notifications
    await queryInterface.addIndex('notifications', 
      ['recipient_id', 'created_at', 'is_read'], {
      name: 'idx_notifications_recipient_created_read',
      concurrently: true
    });

    // Notification type and priority
    await queryInterface.addIndex('notifications', 
      ['notification_type', 'priority', 'created_at'], {
      name: 'idx_notifications_type_priority_created',
      concurrently: true
    });

    // 12. ORGANIZATIONS INDEXES (Multi-tenancy optimization)
    
    // Organization users
    await queryInterface.addIndex('users', 
      ['organization_id', 'account_status'], {
      name: 'idx_users_org_status',
      concurrently: true,
      where: {
        organization_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // Organization providers
    await queryInterface.addIndex('healthcare_providers', 
      ['organization_id', 'is_verified'], {
      name: 'idx_providers_org_verified',
      concurrently: true
    });

    console.log('Performance indexes created successfully for enterprise scalability');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing performance indexes...');

    // Remove all indexes in reverse order
    const indexesToRemove = [
      'idx_providers_org_verified',
      'idx_users_org_status',
      'idx_notifications_type_priority_created',
      'idx_notifications_recipient_created_read',
      'idx_audit_entity_type_id_created',
      'idx_audit_user_created_action',
      'idx_userroles_identity_linked',
      'idx_users_mobile_status',
      'idx_users_email_status',
      'idx_symptoms_careplan_onset',
      'idx_symptoms_patient_onset_severity',
      'idx_events_time_status',
      'idx_events_careplan_time_type',
      'idx_events_patient_time_status',
      'idx_careplans_template_status',
      'idx_careplans_provider_status_created',
      'idx_careplans_patient_status_start',
      'idx_appointments_hsp_time',
      'idx_appointments_doctor_time',
      'idx_appointments_patient_time_status',
      'idx_appointments_provider_time_status',
      'idx_adherence_due_status',
      'idx_adherence_event_status_completed',
      'idx_adherence_patient_due_status',
      'idx_vitals_time_patient',
      'idx_vitals_patient_type_time_desc',
      'idx_vitals_patient_time_type',
      'idx_assignments_consent_status_expires',
      'idx_assignments_doctor_active_created',
      'idx_assignments_patient_type_active',
      'idx_patients_user_doctor',
      'idx_patients_id_created',
      'idx_patients_doctor_created_active'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('patients', indexName);
      } catch (error) {
        // Try other tables if not found in patients
        const tables = [
          'patient_doctor_assignments', 'vital_readings', 'adherence_records',
          'appointments', 'care_plans', 'scheduled_events', 'symptoms',
          'users', 'user_roles', 'audit_logs', 'notifications', 'healthcare_providers'
        ];
        
        for (const table of tables) {
          try {
            await queryInterface.removeIndex(table, indexName);
            break;
          } catch (tableError) {
            // Continue to next table
          }
        }
      }
    }

    console.log('Performance indexes removed successfully');
  }
};