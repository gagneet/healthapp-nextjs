// src/migrations/008-create-medications.js
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.tableExists('medications');
        if (tableExists) {
            console.log('Table medications already exists, skipping creation');
            return;
        }
        // Create medications table
        await queryInterface.createTable('medications', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            care_plan_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'care_plans',
                    key: 'id'
                },
            },
            // Medication details
            medication_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            generic_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            ndc_code: {
                type: Sequelize.STRING(20), // National Drug Code
                allowNull: true,
            },
            dosage: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            route: {
                type: Sequelize.STRING(50), // oral, IV, topical, etc.
                allowNull: true,
            },
            frequency: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            instructions: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            // Timing
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            // Metadata
            is_critical: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            requires_monitoring: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            side_effects_to_monitor: {
                type: Sequelize.ARRAY(Sequelize.TEXT),
                defaultValue: [],
            },
            drug_interactions: {
                type: Sequelize.JSONB,
                defaultValue: [],
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
            { fields: ['care_plan_id'], options: { where: { deleted_at: null }, name: 'idx_medications_care_plan' } },
            { fields: ['medication_name'], options: { where: { deleted_at: null }, name: 'idx_medications_name' } },
            { fields: ['start_date', 'end_date'], options: { where: { deleted_at: null }, name: 'idx_medications_dates' } },
            { fields: ['is_critical'], options: { where: { deleted_at: null }, name: 'idx_medications_critical' } }
        ];
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('medications', index.fields, index.options);
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
                console.log(`Index ${index.options.name} already exists, skipping`);
            }
        }
        // Full-text search index for medication names with error handling
        try {
            await queryInterface.sequelize.query(`
        CREATE INDEX idx_medications_name_search ON medications 
        USING GIN(to_tsvector('english', medication_name));
      `);
        }
        catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
            console.log('Index idx_medications_name_search already exists, skipping');
        }
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('medications');
    }
};
//# sourceMappingURL=008-create-medications.js.map