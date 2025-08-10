// src/migrations/018-create-service-plans.js
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.tableExists('service_plans');
        if (tableExists) {
            console.log('Table service_plans already exists, skipping creation');
            return;
        }
        // Create service_plans table
        await queryInterface.createTable('service_plans', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            provider_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'healthcare_providers',
                    key: 'id'
                },
            },
            // Plan details
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            service_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            // Pricing
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(3),
                defaultValue: 'USD',
            },
            billing_cycle: {
                type: Sequelize.STRING(50), // monthly, yearly, one-time
                allowNull: true,
            },
            // Features
            features: {
                type: Sequelize.JSON,
                defaultValue: [],
            },
            trial_period_days: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            setup_fee: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00,
            },
            stripe_price_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            patient_limit: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            // Status
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
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
            { fields: ['provider_id'], name: 'idx_service_plans_provider' },
            { fields: ['name'], name: 'idx_service_plans_name' },
            { fields: ['service_type'], name: 'idx_service_plans_type' },
            { fields: ['is_active'], name: 'idx_service_plans_active' },
            { fields: ['price'], name: 'idx_service_plans_price' }
        ];
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('service_plans', index.fields, { name: index.name });
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
                console.log(`Index ${index.name} already exists, skipping`);
            }
        }
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('service_plans');
    }
};
//# sourceMappingURL=018-create-service-plans.js.map