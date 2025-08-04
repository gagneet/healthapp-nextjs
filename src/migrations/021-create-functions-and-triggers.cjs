// src/migrations/021-create-functions-and-triggers.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create extensions
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');

    // Function to update updated_at timestamp
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply updated_at trigger to relevant tables
    const tables = [
      'users',
      'healthcare_providers', 
      'patients',
      'care_plans',
      'medications',
      'appointments',
      'scheduled_events',
      'notifications'
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON ${table} 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop triggers
    const tables = [
      'users',
      'healthcare_providers', 
      'patients',
      'care_plans',
      'medications',
      'appointments',
      'scheduled_events',
      'notifications'
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};`);
    }

    // Drop function
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_updated_at_column();');
  }
};