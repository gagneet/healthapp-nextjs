// src/migrations/006-create-care-plan-templates.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create care_plan_templates table
    await queryInterface.createTable('care_plan_templates', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      // Categorization
      conditions: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      specialties: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      
      // Template content
      template_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      
      // Sharing and permissions
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'healthcare_providers',
          key: 'id'
        },
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      
      // Versioning
      version: {
        type: Sequelize.STRING(20),
        defaultValue: '1.0',
      },
      parent_template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'care_plan_templates',
          key: 'id'
        },
      },
      
      // Usage tracking
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      
      // Timestamps
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
    await queryInterface.addIndex('care_plan_templates', ['name']);
    await queryInterface.addIndex('care_plan_templates', ['created_by']);
    await queryInterface.addIndex('care_plan_templates', ['organization_id']);
    await queryInterface.addIndex('care_plan_templates', ['is_public']);
    await queryInterface.addIndex('care_plan_templates', ['is_approved']);

    // GIN indexes for array fields
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_templates_conditions ON care_plan_templates USING GIN(conditions);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_templates_specialties ON care_plan_templates USING GIN(specialties);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_templates_tags ON care_plan_templates USING GIN(tags);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('care_plan_templates');
  }
};