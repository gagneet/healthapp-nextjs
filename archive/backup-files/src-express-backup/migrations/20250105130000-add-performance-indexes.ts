// Migration: Add performance indexes for scalability
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    console.log('🚀 Adding performance indexes for healthcare application scalability (idempotent)...');

    // Helper function to add index with idempotent check
    const addIndexSafely = async (tableName: any, indexConfig: any) => {
      try {
        await queryInterface.addIndex(tableName, indexConfig.fields || indexConfig[0], {
          name: indexConfig.name,
          concurrently: indexConfig.concurrently || false,
          where: indexConfig.where || undefined
        });
        console.log(`✓ Added index: ${indexConfig.name}`);
      } catch (error) {
        if ((error as any).message.includes('already exists')) {
          console.log(`ℹ️ Index already exists: ${indexConfig.name}`);
        } else {
          console.warn(`⚠️ Failed to add index ${indexConfig.name}: ${(error as any).message}`);
        }
      }
    };

    // 1. CRITICAL INDEXES for Patient Management (>10K patients per doctor)
    const patientIndexes = [
      {
        fields: ['primaryCareDoctorId', 'createdAt', 'isActive'],
        name: 'idx_patients_doctor_created_active',
        concurrently: true
      },
      {
        fields: ['patientId', 'createdAt'],
        name: 'idx_patients_id_created',
        concurrently: true
      },
      {
        fields: ['userId', 'primaryCareDoctorId'],
        name: 'idx_patients_user_doctor',
        concurrently: true
      }
    ];

    for (const index of patientIndexes) {
      await addIndexSafely('patients', index);
    }

    // 2. DOCTOR ASSIGNMENT INDEXES (Secondary Doctor Management)
    const assignmentIndexes = [
      {
        fields: ['patientId', 'assignment_type', 'isActive'],
        name: 'idx_assignments_patient_type_active',
        concurrently: true
      },
      {
        fields: ['doctorId', 'isActive', 'createdAt'],
        name: 'idx_assignments_doctor_active_created',
        concurrently: true
      },
      {
        fields: ['patient_consent_status', 'consent_otp_expires_at'],
        name: 'idx_assignments_consent_status_expires',
        concurrently: true,
        where: { patient_consent_required: true }
      }
    ];

    for (const index of assignmentIndexes) {
      await addIndexSafely('patientDoctorAssignments', index);
    }

    // 3. VITAL READINGS PERFORMANCE INDEXES (High-frequency data)
    const vitalIndexes = [
      {
        fields: ['patientId', 'readingTime', 'vital_type_id'],
        name: 'idx_vitals_patient_time_type',
        concurrently: true
      },
      {
        fields: ['patientId', 'vital_type_id', 'readingTime'],
        name: 'idx_vitals_patient_type_time_desc',
        concurrently: true
      },
      {
        fields: ['readingTime', 'patientId'],
        name: 'idx_vitals_time_patient',
        concurrently: true
      }
    ];

    for (const index of vitalIndexes) {
      await addIndexSafely('vital_readings', index);
    }

    // 4. ADHERENCE RECORDS INDEXES (Medication adherence tracking)
    const adherenceIndexes = [
      {
        fields: ['patientId', 'due_at', 'is_completed'],
        name: 'idx_adherence_patient_due_status',
        concurrently: true
      },
      {
        fields: ['scheduled_event_id', 'is_completed', 'recorded_at'],
        name: 'idx_adherence_event_status_completed',
        concurrently: true
      },
      {
        fields: ['due_at', 'is_completed'],
        name: 'idx_adherence_due_status',
        concurrently: true,
        where: { is_completed: false }
      }
    ];

    for (const index of adherenceIndexes) {
      await addIndexSafely('adherence_records', index);
    }

    // 5. APPOINTMENTS SCHEDULING INDEXES
    const appointmentIndexes = [
      {
        fields: ['provider_id', 'start_time'],
        name: 'idx_appointments_provider_time',
        concurrently: true
      },
      {
        fields: ['patientId', 'start_time'],
        name: 'idx_appointments_patient_time',
        concurrently: true
      },
      {
        fields: ['doctorId', 'start_time'],
        name: 'idx_appointments_doctor_time_enhanced',
        concurrently: true,
        where: { doctorId: { [Sequelize.Op.ne]: null } }
      },
      {
        fields: ['organizer_type', 'organizer_id', 'start_time'],
        name: 'idx_appointments_organizer_time',
        concurrently: true
      }
    ];

    for (const index of appointmentIndexes) {
      await addIndexSafely('appointments', index);
    }

    // 6. CARE PLANS INDEXES
    const carePlanIndexes = [
      {
        fields: ['patientId', 'status', 'start_date'],
        name: 'idx_careplans_patient_status_start_fixed',
        concurrently: true
      },
      {
        fields: ['created_by_doctor_id', 'createdAt'],
        name: 'idx_careplans_doctor_created',
        concurrently: true,
        where: { created_by_doctor_id: { [Sequelize.Op.ne]: null } }
      },
      {
        fields: ['organization_id', 'status'],
        name: 'idx_careplans_org_status',
        concurrently: true,
        where: { organization_id: { [Sequelize.Op.ne]: null } }
      }
    ];

    for (const index of carePlanIndexes) {
      await addIndexSafely('care_plans', index);
    }

    // 7. SCHEDULED EVENTS INDEXES (High-volume operations)
    const eventIndexes = [
      {
        fields: ['patientId', 'scheduled_for', 'status'],
        name: 'idx_events_patient_time_status',
        concurrently: true
      },
      {
        fields: ['care_plan_id', 'scheduled_for', 'event_type'],
        name: 'idx_events_careplan_time_type',
        concurrently: true
      },
      {
        fields: ['scheduled_for', 'status'],
        name: 'idx_events_time_status',
        concurrently: true,
        where: { status: 'SCHEDULED' }
      }
    ];

    for (const index of eventIndexes) {
      await addIndexSafely('scheduled_events', index);
    }

    // 8. SYMPTOMS TRACKING INDEXES
    const symptomIndexes = [
      {
        fields: ['patientId', 'onset_time', 'severity'],
        name: 'idx_symptoms_patient_onset_severity',
        concurrently: true
      },
      {
        fields: ['care_plan_id', 'onset_time'],
        name: 'idx_symptoms_careplan_onset',
        concurrently: true,
        where: { care_plan_id: { [Sequelize.Op.ne]: null } }
      }
    ];

    for (const index of symptomIndexes) {
      await addIndexSafely('symptoms', index);
    }

    // 9. USER MANAGEMENT INDEXES (Authentication optimization)
    const userIndexes = [
      {
        fields: ['email', 'account_status'],
        name: 'idx_users_email_status',
        concurrently: true
      },
      {
        fields: ['phone', 'account_status'],
        name: 'idx_users_mobile_status',
        concurrently: true,
        where: { phone: { [Sequelize.Op.ne]: null } }
      },
      {
        fields: ['role', 'account_status'],
        name: 'idx_users_role_status',
        concurrently: true
      }
    ];

    for (const index of userIndexes) {
      await addIndexSafely('users', index);
    }

    // 10. USER ROLES INDEXES
    const userRoleIndexes = [
      {
        fields: ['userIdentity', 'linked_with'],
        name: 'idx_userroles_identity_linked',
        concurrently: true
      }
    ];

    for (const index of userRoleIndexes) {
      await addIndexSafely('user_roles', index);
    }

    // 11. AUDIT LOGS INDEXES (Compliance and monitoring)
    const auditIndexes = [
      {
        fields: ['userId', 'createdAt', 'action'],
        name: 'idx_audit_user_created_action',
        concurrently: true
      },
      {
        fields: ['patientId', 'action', 'createdAt'],
        name: 'idx_audit_patient_action_created',
        concurrently: true,
        where: { patientId: { [Sequelize.Op.ne]: null } }
      }
    ];

    for (const index of auditIndexes) {
      await addIndexSafely('audit_logs', index);
    }

    // 12. NOTIFICATIONS INDEXES
    const notificationIndexes = [
      {
        fields: ['patientId', 'createdAt'],
        name: 'idx_notifications_patient_created',
        concurrently: true,
        where: { patientId: { [Sequelize.Op.ne]: null } }
      },
      {
        fields: ['type', 'priority', 'createdAt'],
        name: 'idx_notifications_type_priority_created',
        concurrently: true
      }
    ];

    for (const index of notificationIndexes) {
      await addIndexSafely('notifications', index);
    }

    // 13. HEALTHCARE PROVIDERS INDEXES (Multi-tenancy optimization)
    const providerIndexes = [
      {
        fields: ['organization_id', 'is_verified'],
        name: 'idx_providers_org_verified',
        concurrently: true
      }
    ];

    for (const index of providerIndexes) {
      await addIndexSafely('healthcare_providers', index);
    }

    console.log('✅ Performance indexes processing completed for enterprise scalability');
  },

  down: async (queryInterface: any, Sequelize: any) => {
    console.log('🗑️ Removing performance indexes...');

    // Helper function to remove index with idempotent check
    const removeIndexSafely = async (tableName: any, indexName: any) => {
      try {
        await queryInterface.removeIndex(tableName, indexName);
        console.log(`✓ Removed index: ${indexName}`);
      } catch (error) {
        if ((error as any).message.includes('does not exist')) {
          console.log(`ℹ️ Index does not exist: ${indexName}`);
        } else {
          console.warn(`⚠️ Failed to remove index ${indexName}: ${(error as any).message}`);
        }
      }
    };

    // Remove all indexes (table-specific for accuracy)
    const indexesToRemove = [
      { table: 'healthcare_providers', name: 'idx_providers_org_verified' },
      { table: 'notifications', name: 'idx_notifications_type_priority_created' },
      { table: 'notifications', name: 'idx_notifications_recipient_created_read' },
      { table: 'audit_logs', name: 'idx_audit_entity_type_id_created' },
      { table: 'audit_logs', name: 'idx_audit_user_created_action' },
      { table: 'user_roles', name: 'idx_userroles_identity_linked' },
      { table: 'users', name: 'idx_users_org_status' },
      { table: 'users', name: 'idx_users_mobile_status' },
      { table: 'users', name: 'idx_users_email_status' },
      { table: 'symptoms', name: 'idx_symptoms_careplan_onset' },
      { table: 'symptoms', name: 'idx_symptoms_patient_onset_severity' },
      { table: 'scheduled_events', name: 'idx_events_time_status' },
      { table: 'scheduled_events', name: 'idx_events_careplan_time_type' },
      { table: 'scheduled_events', name: 'idx_events_patient_time_status' },
      { table: 'care_plans', name: 'idx_careplans_template_status' },
      { table: 'care_plans', name: 'idx_careplans_provider_status_created' },
      { table: 'care_plans', name: 'idx_careplans_patient_status_start' },
      { table: 'appointments', name: 'idx_appointments_hsp_time' },
      { table: 'appointments', name: 'idx_appointments_doctor_time' },
      { table: 'appointments', name: 'idx_appointments_patient_time_status' },
      { table: 'appointments', name: 'idx_appointments_provider_time_status' },
      { table: 'adherence_records', name: 'idx_adherence_due_status' },
      { table: 'adherence_records', name: 'idx_adherence_event_status_completed' },
      { table: 'adherence_records', name: 'idx_adherence_patient_due_status' },
      { table: 'vital_readings', name: 'idx_vitals_time_patient' },
      { table: 'vital_readings', name: 'idx_vitals_patient_type_time_desc' },
      { table: 'vital_readings', name: 'idx_vitals_patient_time_type' },
      { table: 'patientDoctorAssignments', name: 'idx_assignments_consent_status_expires' },
      { table: 'patientDoctorAssignments', name: 'idx_assignments_doctor_active_created' },
      { table: 'patientDoctorAssignments', name: 'idx_assignments_patient_type_active' },
      { table: 'patients', name: 'idx_patients_user_doctor' },
      { table: 'patients', name: 'idx_patients_id_created' },
      { table: 'patients', name: 'idx_patients_doctor_created_active' }
    ];

    for (const { table, name } of indexesToRemove) {
      await removeIndexSafely(table, name);
    }

    console.log('✅ Performance indexes removal completed');
  }
};