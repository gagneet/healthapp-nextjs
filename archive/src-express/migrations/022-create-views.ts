// src/migrations/022-create-views.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Drop existing views first to ensure clean recreation
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_active_care_plans CASCADE;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_patient_adherence_summary CASCADE;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_upcoming_events CASCADE;');

    // Active care plans with patient and provider info
    await queryInterface.sequelize.query(`
        CREATE VIEW v_active_care_plans AS
      SELECT 
          cp.id,
          cp.title as name,
          cp.status,
          cp.priority,
          cp.startDate,
          cp.endDate,
          
          -- Patient info
          p.id as patientId,
          u_patient.firstName as patient_first_name,
          u_patient.lastName as patient_last_name,
          u_patient.email as patient_email,
          
          -- Provider info
          COALESCE(hp.id, d.id) as provider_id,
          COALESCE(u_provider.firstName, u_doctor.firstName) as provider_first_name,
          COALESCE(u_provider.lastName, u_doctor.lastName) as provider_last_name,
          COALESCE(u_provider.email, u_doctor.email) as provider_email,
          
          cp.createdAt,
          cp.updatedAt
      FROM carePlans cp
      JOIN patients p ON cp.patientId = p.id
      JOIN users u_patient ON p.userId = u_patient.id
      LEFT JOIN healthcare_providers hp ON cp.created_by_hsp_id = hp.id
      LEFT JOIN users u_provider ON hp.userId = u_provider.id
      LEFT JOIN doctors d ON cp.created_by_doctor_id = d.id
      LEFT JOIN users u_doctor ON d.userId = u_doctor.id
      WHERE cp.deleted_at IS NULL 
          AND p.deleted_at IS NULL 
          AND u_patient.deleted_at IS NULL
          AND (hp.deleted_at IS NULL OR hp.id IS NULL)
          AND (u_provider.deleted_at IS NULL OR u_provider.id IS NULL)
          AND cp.status = 'ACTIVE';
      `);

    // Patient adherence summary
    await queryInterface.sequelize.query(`
        CREATE VIEW v_patient_adherence_summary AS
      SELECT 
          p.id as patientId,
          u.firstName,
          u.lastName,
          u.email,
          
          -- Adherence stats
          COUNT(ar.id) as total_events,
          COUNT(CASE WHEN ar.is_completed THEN 1 END) as completed_events,
          COUNT(CASE WHEN ar.is_missed THEN 1 END) as missed_events,
          ROUND(
              (COUNT(CASE WHEN ar.is_completed THEN 1 END)::DECIMAL / NULLIF(COUNT(ar.id), 0)) * 100, 
              2
          ) as adherence_percentage,
          
          -- Recent activity
          MAX(ar.recordedAt) as last_activity,
          
          p.createdAt,
          p.updatedAt
      FROM patients p
      JOIN users u ON p.userId = u.id
      LEFT JOIN adherence_records ar ON p.id = ar.patientId 
          AND ar.due_at >= NOW() - INTERVAL '30 days'
      WHERE p.deleted_at IS NULL 
          AND u.deleted_at IS NULL
      GROUP BY p.id, u.firstName, u.lastName, u.email, p.createdAt, p.updatedAt;
      `);

    // Upcoming scheduled events
    await queryInterface.sequelize.query(`
        CREATE VIEW v_upcoming_events AS
      SELECT 
          se.id,
          se.event_type,
          se.title,
          se.scheduled_for,
          se.priority,
          se.status,
          
          -- Patient info
          p.id as patientId,
          u_patient.firstName as patient_first_name,
          u_patient.lastName as patient_last_name,
          
          -- Provider info (from care plan)
          COALESCE(hp.id, d2.id) as provider_id,
          COALESCE(u_provider.firstName, u_doctor2.firstName) as provider_first_name,
          COALESCE(u_provider.lastName, u_doctor2.lastName) as provider_last_name,
          
          se.createdAt
      FROM scheduled_events se
      JOIN patients p ON se.patientId = p.id
      JOIN users u_patient ON p.userId = u_patient.id
      LEFT JOIN carePlans cp ON se.care_plan_id = cp.id
      LEFT JOIN healthcare_providers hp ON cp.created_by_hsp_id = hp.id
      LEFT JOIN users u_provider ON hp.userId = u_provider.id
      LEFT JOIN doctors d2 ON cp.created_by_doctor_id = d2.id
      LEFT JOIN users u_doctor2 ON d2.userId = u_doctor2.id
      WHERE se.deleted_at IS NULL 
          AND p.deleted_at IS NULL 
          AND u_patient.deleted_at IS NULL
          AND se.scheduled_for >= NOW()
          AND se.status IN ('SCHEDULED', 'PENDING')
      ORDER BY se.scheduled_for ASC;
      `);
    
    console.log('✅ All database views created successfully');
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_active_care_plans CASCADE;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_patient_adherence_summary CASCADE;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_upcoming_events CASCADE;');
    console.log('✅ All database views dropped successfully');
  }
};