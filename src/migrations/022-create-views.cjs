// src/migrations/022-create-views.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Active care plans with patient and provider info (with idempotent check)
    try {
      await queryInterface.sequelize.query(`
        CREATE VIEW v_active_care_plans AS
      SELECT 
          cp.id,
          cp.name,
          cp.status,
          cp.priority,
          cp.start_date,
          cp.end_date,
          
          -- Patient info
          p.id as patient_id,
          u_patient.first_name as patient_first_name,
          u_patient.last_name as patient_last_name,
          u_patient.email as patient_email,
          
          -- Provider info
          hp.id as provider_id,
          u_provider.first_name as provider_first_name,
          u_provider.last_name as provider_last_name,
          u_provider.email as provider_email,
          
          cp.created_at,
          cp.updated_at
      FROM care_plans cp
      JOIN patients p ON cp.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      JOIN healthcare_providers hp ON cp.provider_id = hp.id
      JOIN users u_provider ON hp.user_id = u_provider.id
      WHERE cp.deleted_at IS NULL 
          AND p.deleted_at IS NULL 
          AND u_patient.deleted_at IS NULL
          AND hp.deleted_at IS NULL 
          AND u_provider.deleted_at IS NULL
          AND cp.status = 'ACTIVE';
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('View v_active_care_plans already exists, skipping');
    }

    // Patient adherence summary (with idempotent check)
    try {
      await queryInterface.sequelize.query(`
        CREATE VIEW v_patient_adherence_summary AS
      SELECT 
          p.id as patient_id,
          u.first_name,
          u.last_name,
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
          MAX(ar.recorded_at) as last_activity,
          
          p.created_at,
          p.updated_at
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN adherence_records ar ON p.id = ar.patient_id 
          AND ar.due_at >= NOW() - INTERVAL '30 days'
      WHERE p.deleted_at IS NULL 
          AND u.deleted_at IS NULL
      GROUP BY p.id, u.first_name, u.last_name, u.email, p.created_at, p.updated_at;
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('View v_patient_adherence_summary already exists, skipping');
    }

    // Upcoming scheduled events (with idempotent check)
    try {
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
          p.id as patient_id,
          u_patient.first_name as patient_first_name,
          u_patient.last_name as patient_last_name,
          
          -- Provider info (from care plan)
          hp.id as provider_id,
          u_provider.first_name as provider_first_name,
          u_provider.last_name as provider_last_name,
          
          se.created_at
      FROM scheduled_events se
      JOIN patients p ON se.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      LEFT JOIN care_plans cp ON se.care_plan_id = cp.id
      LEFT JOIN healthcare_providers hp ON cp.provider_id = hp.id
      LEFT JOIN users u_provider ON hp.user_id = u_provider.id
      WHERE se.deleted_at IS NULL 
          AND p.deleted_at IS NULL 
          AND u_patient.deleted_at IS NULL
          AND se.scheduled_for >= NOW()
          AND se.status IN ('SCHEDULED', 'PENDING')
      ORDER BY se.scheduled_for ASC;
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('View v_upcoming_events already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_active_care_plans;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_patient_adherence_summary;');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_upcoming_events;');
  }
};