#!/usr/bin/env node

/**
 * MySQL to PostgreSQL Migration Script
 * Healthcare Adherence Management Platform
 * 
 * This script handles the complete migration from MySQL to PostgreSQL
 * including data transformation, UUID generation, and HIPAA compliance setup.
 */

import mysql from 'mysql2/promise';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Database connections
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'healthapp_mysql',
  port: process.env.MYSQL_PORT || 3306
};

const pgConfig = {
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'healthapp_user',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'healthapp_postgres',
  port: process.env.PG_PORT || 5432
};

class DatabaseMigrator {
  constructor() {
    this.mysqlConnection = null;
    this.pgConnection = null;
    this.uuidMap = new Map();
    this.migrationLog = [];
    this.startTime = new Date();
  }

  async initialize() {
    console.log('🚀 Initializing database connections...');
    
    // Connect to MySQL
    this.mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL');
    
    // Connect to PostgreSQL
    this.pgConnection = new Client(pgConfig);
    await this.pgConnection.connect();
    console.log('✅ Connected to PostgreSQL');
  }

  async generateUUIDs() {
    console.log('🔑 Generating UUID mappings for existing data...');
    
    const tables = [
      'users', 'doctors', 'patients', 'providers', 'appointments',
      'care_plans', 'medications', 'vitals', 'specialities', 'user_roles'
    ];

    for (const table of tables) {
      try {
        const [rows] = await this.mysqlConnection.execute(`SELECT id FROM ${table}`);
        
        rows.forEach(row => {
          this.uuidMap.set(`${table}_${row.id}`, uuidv4());
        });
        
        console.log(`   Generated ${rows.length} UUIDs for ${table}`);
      } catch (error) {
        console.warn(`   ⚠️  Table ${table} not found or empty: ${error.message}`);
      }
    }

    console.log(`✅ Generated ${this.uuidMap.size} UUID mappings`);
  }

  async createPostgreSQLSchema() {
    console.log('📋 Creating PostgreSQL schema...');

    const schemaSQL = `
      -- Create extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      -- Create ENUMs
      CREATE TYPE user_role AS ENUM ('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP', 'PATIENT', 'CAREGIVER');
      CREATE TYPE account_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED');
      CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
      CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
      CREATE TYPE care_plan_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
      CREATE TYPE event_status AS ENUM ('SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED', 'EXPIRED');
      CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      CREATE TYPE notification_channel AS ENUM ('PUSH', 'SMS', 'EMAIL', 'VOICE_CALL');
    `;

    await this.pgConnection.query(schemaSQL);
    console.log('✅ PostgreSQL schema created');
  }

  async migrateUsers() {
    console.log('👥 Migrating users...');

    const [mysqlUsers] = await this.mysqlConnection.execute(`
      SELECT u.*, ur.role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_identity
    `);

    const pgUsers = mysqlUsers.map(user => ({
      id: this.uuidMap.get(`users_${user.id}`),
      email: user.email,
      password_hash: user.password, // Already hashed in MySQL
      role: this.mapUserRole(user.role_name || 'PATIENT'),
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      phone: user.phone,
      date_of_birth: user.date_of_birth,
      gender: user.gender ? user.gender.toUpperCase() : null,
      email_verified: user.email_verified || false,
      account_status: 'ACTIVE',
      timezone: 'UTC',
      locale: 'en',
      preferences: JSON.stringify({
        notifications: { email: true, push: true, sms: false },
        privacy: { profile_visible: true, share_data_for_research: false },
        accessibility: { high_contrast: false, large_text: false }
      }),
      // HIPAA compliance fields - will need to be collected from users
      terms_accepted_at: user.created_at,
      privacy_policy_accepted_at: user.created_at,
      hipaa_consent_date: null,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    // Insert users in batches
    await this.batchInsert('users', pgUsers, [
      'id', 'email', 'password_hash', 'role', 'first_name', 'last_name', 'middle_name',
      'phone', 'date_of_birth', 'gender', 'email_verified', 'account_status',
      'timezone', 'locale', 'preferences', 'terms_accepted_at', 'privacy_policy_accepted_at',
      'hipaa_consent_date', 'created_at', 'updated_at'
    ]);

    console.log(`✅ Migrated ${pgUsers.length} users`);
    this.migrationLog.push(`Users: ${pgUsers.length} records migrated`);
  }

  async migrateOrganizations() {
    console.log('🏥 Creating default organization...');

    // Create a default organization for existing data
    const defaultOrgId = uuidv4();
    const organization = {
      id: defaultOrgId,
      name: 'Default Healthcare Organization',
      type: 'clinic',
      contact_info: JSON.stringify({}),
      address: JSON.stringify({}),
      settings: JSON.stringify({
        timezone: 'UTC',
        working_hours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '09:00', end: '13:00' },
          sunday: { closed: true }
        }
      }),
      is_active: true,
      hipaa_covered_entity: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.pgConnection.query(`
      INSERT INTO organizations (id, name, type, contact_info, address, settings, is_active, hipaa_covered_entity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      organization.id, organization.name, organization.type, organization.contact_info,
      organization.address, organization.settings, organization.is_active,
      organization.hipaa_covered_entity, organization.created_at, organization.updated_at
    ]);

    // Store default org ID for use in other migrations
    this.defaultOrgId = defaultOrgId;
    console.log('✅ Default organization created');
  }

  async migrateDoctorsAndProviders() {
    console.log('👨‍⚕️ Migrating doctors and separating providers...');

    // Get all providers and doctors
    const [mysqlProviders] = await this.mysqlConnection.execute(`
      SELECT p.*, u.*, s.name as specialty_name,
             CASE 
               WHEN p.license_type IN ('MD', 'DO') OR p.credentials LIKE '%MD%' OR p.credentials LIKE '%DO%' THEN 'doctor'
               ELSE 'hsp'
             END as provider_category
      FROM providers p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN specialities s ON p.speciality_id = s.id
    `);

    // Also get direct doctor records
    const [mysqlDoctors] = await this.mysqlConnection.execute(`
      SELECT d.*, u.*, s.name as specialty_name, 'doctor' as provider_category
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN specialities s ON d.speciality_id = s.id
      WHERE d.user_id NOT IN (SELECT user_id FROM providers)
    `);

    const allProviders = [...mysqlProviders, ...mysqlDoctors];
    const doctors = [];
    const hsps = [];

    allProviders.forEach(provider => {
      const baseData = {
        id: uuidv4(),
        user_id: this.uuidMap.get(`users_${provider.user_id}`),
        organization_id: this.defaultOrgId,
        years_of_experience: provider.years_of_experience,
        is_verified: provider.is_verified || false,
        verification_documents: JSON.stringify([]),
        consultation_fee: provider.consultation_fee,
        availability_schedule: JSON.stringify({
          monday: { available: true, start: '09:00', end: '17:00' },
          tuesday: { available: true, start: '09:00', end: '17:00' },
          wednesday: { available: true, start: '09:00', end: '17:00' },
          thursday: { available: true, start: '09:00', end: '17:00' },
          friday: { available: true, start: '09:00', end: '17:00' },
          saturday: { available: false },
          sunday: { available: false }
        }),
        languages_spoken: JSON.stringify(['en']),
        notification_preferences: JSON.stringify({
          appointment_reminders: true,
          patient_updates: true,
          system_notifications: true
        }),
        practice_name: provider.practice_name,
        practice_address: JSON.stringify({}),
        practice_phone: provider.practice_phone,
        total_patients: 0,
        average_rating: null,
        total_reviews: 0,
        is_available_online: provider.is_available_online !== false,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      };

      if (provider.provider_category === 'doctor') {
        doctors.push({
          ...baseData,
          medical_license_number: provider.license_number || `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          npi_number: provider.npi_number,
          board_certifications: JSON.stringify(provider.credentials ? [provider.credentials] : []),
          medical_school: provider.medical_school,
          residency_programs: JSON.stringify([]),
          specialties: JSON.stringify(provider.specialty_name ? [provider.specialty_name.toLowerCase()] : ['general practice']),
          sub_specialties: JSON.stringify([]),
          capabilities: JSON.stringify([
            'prescribe_medications', 'order_tests', 'diagnose', 
            'create_treatment_plans', 'create_care_plans', 'modify_medications',
            'monitor_vitals', 'patient_education', 'care_coordination', 'emergency_response'
          ]),
          signature_pic: provider.signature_pic,
          razorpay_account_id: provider.razorpay_account_id,
          active_treatment_plans: 0,
          active_care_plans: 0
        });
      } else {
        hsps.push({
          ...baseData,
          hsp_type: this.mapHSPType(provider.credentials || provider.license_type),
          license_number: provider.license_number,
          certification_number: provider.certification_number,
          certifications: JSON.stringify(provider.credentials ? [provider.credentials] : []),
          education: JSON.stringify([]),
          specializations: JSON.stringify(provider.specialty_name ? [provider.specialty_name.toLowerCase()] : []),
          capabilities: JSON.stringify([
            'monitor_vitals', 'patient_education', 'care_coordination'
          ]),
          requires_supervision: true,
          supervision_level: 'direct',
          departments: JSON.stringify([]),
          shift_preferences: JSON.stringify({
            preferred_shifts: ['day'],
            weekend_availability: false,
            night_shift_available: false
          }),
          total_patients_assisted: 0,
          tasks_completed: 0,
          is_available: true
        });
      }
    });

    // Insert doctors
    if (doctors.length > 0) {
      await this.batchInsertDoctors(doctors);
      console.log(`✅ Migrated ${doctors.length} doctors`);
    }

    // Insert HSPs
    if (hsps.length > 0) {
      await this.batchInsertHSPs(hsps);
      console.log(`✅ Migrated ${hsps.length} HSPs`);
    }

    this.migrationLog.push(`Doctors: ${doctors.length} records migrated`);
    this.migrationLog.push(`HSPs: ${hsps.length} records migrated`);
  }

  async migratePatients() {
    console.log('🤒 Migrating patients...');

    const [mysqlPatients] = await this.mysqlConnection.execute(`
      SELECT p.*, u.*
      FROM patients p
      JOIN users u ON p.user_id = u.id
    `);

    const pgPatients = mysqlPatients.map(patient => ({
      id: this.uuidMap.get(`patients_${patient.id}`) || uuidv4(),
      user_id: this.uuidMap.get(`users_${patient.user_id}`),
      organization_id: this.defaultOrgId,
      medical_record_number: patient.medical_record_number,
      emergency_contacts: JSON.stringify(patient.emergency_contacts || []),
      insurance_information: JSON.stringify(patient.insurance_information || {}),
      medical_history: JSON.stringify(patient.medical_history || []),
      allergies: JSON.stringify(patient.allergies || []),
      current_medications: JSON.stringify(patient.current_medications || []),
      height_cm: patient.height_cm,
      weight_kg: patient.weight_kg,
      blood_type: patient.blood_type,
      primary_language: patient.primary_language || 'en',
      risk_level: patient.risk_level || 'low',
      risk_factors: JSON.stringify(patient.risk_factors || []),
      communication_preferences: JSON.stringify({
        preferred_contact_method: 'email',
        appointment_reminders: true,
        medication_reminders: true,
        health_tips: false,
        research_participation: false,
        language: 'en',
        time_zone: 'UTC'
      }),
      privacy_settings: JSON.stringify({
        share_with_family: false,
        share_for_research: false,
        marketing_communications: false,
        data_sharing_consent: false,
        provider_directory_listing: true
      }),
      primary_care_doctor_id: patient.assigned_doctor_id ? this.uuidMap.get(`users_${patient.assigned_doctor_id}`) : null,
      overall_adherence_score: patient.overall_adherence_score,
      total_appointments: patient.total_appointments || 0,
      missed_appointments: patient.missed_appointments || 0,
      last_visit_date: patient.last_visit_date,
      next_appointment_date: patient.next_appointment_date,
      is_active: patient.is_active !== false,
      requires_interpreter: patient.requires_interpreter || false,
      has_mobility_issues: patient.has_mobility_issues || false,
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }));

    await this.batchInsertPatients(pgPatients);

    console.log(`✅ Migrated ${pgPatients.length} patients`);
    this.migrationLog.push(`Patients: ${pgPatients.length} records migrated`);
  }

  async migrateCarePlans() {
    console.log('📋 Migrating care plans...');

    const [mysqlCarePlans] = await this.mysqlConnection.execute(`
      SELECT cp.*, p.user_id as patient_user_id
      FROM care_plans cp
      JOIN patients p ON cp.patient_id = p.id
    `);

    const pgCarePlans = mysqlCarePlans.map(plan => ({
      id: this.uuidMap.get(`care_plans_${plan.id}`) || uuidv4(),
      patient_id: this.uuidMap.get(`patients_${plan.patient_id}`),
      created_by_doctor_id: plan.doctor_id ? this.uuidMap.get(`users_${plan.doctor_id}`) : null,
      organization_id: this.defaultOrgId,
      title: plan.details?.diagnosis || 'Care Plan',
      plan_type: 'care_plan',
      chronic_conditions: JSON.stringify([plan.details?.diagnosis].filter(Boolean)),
      long_term_goals: JSON.stringify([]),
      interventions: JSON.stringify([]),
      monitoring_parameters: JSON.stringify([]),
      medications: JSON.stringify([]),
      start_date: plan.activated_on || plan.created_at,
      end_date: plan.expired_on,
      review_frequency_months: 3,
      status: plan.expired_on && new Date(plan.expired_on) < new Date() ? 'COMPLETED' : 'ACTIVE',
      priority: plan.details?.priority || 'MEDIUM',
      care_team_members: JSON.stringify([]),
      patient_education_materials: JSON.stringify([]),
      progress_notes: JSON.stringify([]),
      outcome_measures: JSON.stringify({}),
      emergency_action_plan: JSON.stringify({}),
      warning_signs: JSON.stringify([]),
      emergency_contacts: JSON.stringify([]),
      details: JSON.stringify(plan.details || {}), // Legacy field
      channel_id: plan.channel_id,
      created_at: plan.created_at,
      updated_at: plan.updated_at
    }));

    await this.batchInsertCarePlans(pgCarePlans);

    console.log(`✅ Migrated ${pgCarePlans.length} care plans`);
    this.migrationLog.push(`Care Plans: ${pgCarePlans.length} records migrated`);
  }

  // Helper methods for batch inserts
  async batchInsert(tableName, data, columns) {
    if (data.length === 0) return;

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const placeholders = batch.map((_, index) => 
        `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
      ).join(', ');

      const values = batch.flatMap(row => columns.map(col => row[col]));
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;

      await this.pgConnection.query(query, values);
    }
  }

  async batchInsertDoctors(doctors) {
    const columns = [
      'id', 'user_id', 'organization_id', 'medical_license_number', 'npi_number',
      'board_certifications', 'medical_school', 'residency_programs', 'specialties',
      'sub_specialties', 'years_of_experience', 'capabilities', 'is_verified',
      'verification_documents', 'consultation_fee', 'availability_schedule',
      'languages_spoken', 'notification_preferences', 'practice_name',
      'practice_address', 'practice_phone', 'signature_pic', 'razorpay_account_id',
      'total_patients', 'active_treatment_plans', 'active_care_plans',
      'average_rating', 'total_reviews', 'is_available_online',
      'created_at', 'updated_at'
    ];

    await this.batchInsert('doctors', doctors, columns);
  }

  async batchInsertHSPs(hsps) {
    const columns = [
      'id', 'user_id', 'organization_id', 'hsp_type', 'license_number',
      'certification_number', 'certifications', 'education', 'specializations',
      'years_of_experience', 'capabilities', 'requires_supervision',
      'supervision_level', 'is_verified', 'verification_documents',
      'hourly_rate', 'availability_schedule', 'languages_spoken',
      'notification_preferences', 'departments', 'shift_preferences',
      'total_patients_assisted', 'tasks_completed', 'average_rating',
      'total_reviews', 'is_available', 'created_at', 'updated_at'
    ];

    await this.batchInsert('hsps', hsps, columns);
  }

  async batchInsertPatients(patients) {
    const columns = [
      'id', 'user_id', 'organization_id', 'medical_record_number',
      'emergency_contacts', 'insurance_information', 'medical_history',
      'allergies', 'current_medications', 'height_cm', 'weight_kg',
      'blood_type', 'primary_language', 'risk_level', 'risk_factors',
      'communication_preferences', 'privacy_settings', 'primary_care_doctor_id',
      'overall_adherence_score', 'total_appointments', 'missed_appointments',
      'last_visit_date', 'next_appointment_date', 'is_active',
      'requires_interpreter', 'has_mobility_issues', 'created_at', 'updated_at'
    ];

    await this.batchInsert('patients', patients, columns);
  }

  async batchInsertCarePlans(carePlans) {
    const columns = [
      'id', 'patient_id', 'created_by_doctor_id', 'organization_id', 'title',
      'plan_type', 'chronic_conditions', 'long_term_goals', 'interventions',
      'monitoring_parameters', 'medications', 'start_date', 'end_date',
      'review_frequency_months', 'status', 'priority', 'care_team_members',
      'patient_education_materials', 'progress_notes', 'outcome_measures',
      'emergency_action_plan', 'warning_signs', 'emergency_contacts',
      'details', 'channel_id', 'created_at', 'updated_at'
    ];

    await this.batchInsert('care_plans', carePlans, columns);
  }

  // Mapping helper functions
  mapUserRole(mysqlRole) {
    const roleMap = {
      'admin': 'SYSTEM_ADMIN',
      'hospital_admin': 'HOSPITAL_ADMIN',
      'doctor': 'DOCTOR',
      'nurse': 'HSP',
      'patient': 'PATIENT',
      'caregiver': 'CAREGIVER'
    };
    return roleMap[mysqlRole?.toLowerCase()] || 'PATIENT';
  }

  mapHSPType(credentials) {
    if (!credentials) return 'other';
    
    const cred = credentials.toLowerCase();
    if (cred.includes('rn') || cred.includes('registered nurse')) return 'registered_nurse';
    if (cred.includes('lpn') || cred.includes('licensed practical')) return 'licensed_practical_nurse';
    if (cred.includes('np') || cred.includes('nurse practitioner')) return 'nurse_practitioner';
    if (cred.includes('pa') || cred.includes('physician assistant')) return 'physician_assistant';
    if (cred.includes('pharmacist')) return 'clinical_pharmacist';
    if (cred.includes('social worker')) return 'social_worker';
    if (cred.includes('dietitian')) return 'dietitian';
    if (cred.includes('therapist')) return 'physical_therapist';
    
    return 'other';
  }

  async createIndexes() {
    console.log('🔍 Creating database indexes...');

    const indexQueries = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_user_id ON patients(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_organization ON patients(organization_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_organization ON doctors(organization_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_user_id ON hsps(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_organization ON hsps(organization_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_patient ON care_plans(patient_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_doctor ON care_plans(created_by_doctor_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_status ON care_plans(status)'
    ];

    for (const query of indexQueries) {
      try {
        await this.pgConnection.query(query);
      } catch (error) {
        console.warn(`   ⚠️  Index creation warning: ${error.message}`);
      }
    }

    console.log('✅ Database indexes created');
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration...');

    const verificationQueries = [
      { name: 'Users', mysql: 'SELECT COUNT(*) as count FROM users', postgres: 'SELECT COUNT(*) as count FROM users' },
      { name: 'Patients', mysql: 'SELECT COUNT(*) as count FROM patients', postgres: 'SELECT COUNT(*) as count FROM patients' },
      { name: 'Doctors', mysql: 'SELECT COUNT(*) as count FROM doctors', postgres: 'SELECT COUNT(*) as count FROM doctors' },
      { name: 'Care Plans', mysql: 'SELECT COUNT(*) as count FROM care_plans', postgres: 'SELECT COUNT(*) as count FROM care_plans' }
    ];

    const verificationResults = [];

    for (const query of verificationQueries) {
      try {
        const [mysqlResult] = await this.mysqlConnection.execute(query.mysql);
        const pgResult = await this.pgConnection.query(query.postgres);

        const mysqlCount = mysqlResult[0].count;
        const pgCount = parseInt(pgResult.rows[0].count);

        if (mysqlCount === pgCount) {
          console.log(`✅ ${query.name}: ${mysqlCount} records (verified)`);
          verificationResults.push({ table: query.name, status: 'success', count: pgCount });
        } else {
          console.error(`❌ ${query.name} mismatch: MySQL=${mysqlCount}, PostgreSQL=${pgCount}`);
          verificationResults.push({ table: query.name, status: 'error', mysql: mysqlCount, postgres: pgCount });
        }
      } catch (error) {
        console.warn(`⚠️  ${query.name} verification failed: ${error.message}`);
        verificationResults.push({ table: query.name, status: 'warning', error: error.message });
      }
    }

    return verificationResults;
  }

  async generateMigrationReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);

    const report = {
      migration_date: this.startTime,
      duration_seconds: duration,
      tables_migrated: this.migrationLog,
      uuid_mappings_generated: this.uuidMap.size,
      status: 'completed',
      verification_results: await this.verifyMigration()
    };

    // Save report to file
    await fs.writeFile(
      path.join(process.cwd(), 'migration-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Migration Report:');
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Tables migrated: ${this.migrationLog.length}`);
    console.log(`   UUID mappings: ${this.uuidMap.size}`);
    console.log(`   Report saved to: migration-report.json`);

    return report;
  }

  async cleanup() {
    console.log('🧹 Cleaning up connections...');
    
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
    }
    
    if (this.pgConnection) {
      await this.pgConnection.end();
    }
    
    console.log('✅ Cleanup completed');
  }

  async migrate() {
    try {
      console.log('🚀 Starting MySQL to PostgreSQL migration...');
      console.log(`   Start time: ${this.startTime}`);

      await this.initialize();
      await this.generateUUIDs();
      await this.createPostgreSQLSchema();
      await this.migrateOrganizations();
      await this.migrateUsers();
      await this.migrateDoctorsAndProviders();
      await this.migratePatients();
      await this.migrateCarePlans();
      await this.createIndexes();

      const report = await this.generateMigrationReport();
      
      console.log('\n🎉 Migration completed successfully!');
      console.log('   Next steps:');
      console.log('   1. Update application configuration to use PostgreSQL');
      console.log('   2. Run application tests');
      console.log('   3. Deploy to staging environment for testing');
      console.log('   4. Schedule production deployment');

      return report;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DatabaseMigrator();
  
  migrator.migrate()
    .then(report => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default DatabaseMigrator;