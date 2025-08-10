// src/migrations/006-create-care-plan-templates.js
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.tableExists('care_plan_templates');
        if (tableExists) {
            console.log('Table care_plan_templates already exists, skipping creation');
            return;
        }
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
        // Add indexes with error handling
        const indexes = [
            { fields: ['name'], name: 'idx_templates_name' },
            { fields: ['created_by'], name: 'idx_templates_created_by' },
            { fields: ['organization_id'], name: 'idx_templates_organization_id' },
            { fields: ['is_public'], name: 'idx_templates_is_public' },
            { fields: ['is_approved'], name: 'idx_templates_is_approved' }
        ];
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('care_plan_templates', index.fields, { name: index.name });
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
                console.log(`Index ${index.name} already exists, skipping`);
            }
        }
        // GIN indexes for array fields with error handling
        const ginIndexes = [
            { name: 'idx_templates_conditions', field: 'conditions' },
            { name: 'idx_templates_specialties', field: 'specialties' },
            { name: 'idx_templates_tags', field: 'tags' }
        ];
        for (const ginIndex of ginIndexes) {
            try {
                await queryInterface.sequelize.query(`
          CREATE INDEX ${ginIndex.name} ON care_plan_templates USING GIN(${ginIndex.field});
        `);
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
                console.log(`GIN Index ${ginIndex.name} already exists, skipping`);
            }
        }
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('care_plan_templates');
    }
};
//# sourceMappingURL=006-create-care-plan-templates.js.map