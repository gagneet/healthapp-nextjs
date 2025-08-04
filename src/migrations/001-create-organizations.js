// src/migrations/001-create-organizations.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create organizations table
    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(100),
        defaultValue: 'clinic',
      },
      license_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      contact_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      address: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('organizations', ['name']);
    await queryInterface.addIndex('organizations', ['type']);
    await queryInterface.addIndex('organizations', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('organizations');
  }
};