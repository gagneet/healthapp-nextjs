'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods'", { type: Sequelize.QueryTypes.SELECT });
        if (tableExists.length > 0) {
            console.log('ℹ️ Table "payment_methods" already exists, skipping creation');
            return;
        }
        await queryInterface.createTable('payment_methods', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            patient_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'patients',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            stripe_payment_method_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.ENUM('card', 'bank_account', 'paypal'),
                allowNull: false,
            },
            card_brand: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            card_last4: {
                type: Sequelize.STRING(4),
                allowNull: true,
            },
            card_exp_month: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            card_exp_year: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            bank_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            bank_last4: {
                type: Sequelize.STRING(4),
                allowNull: true,
            },
            is_default: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            billing_address: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSON,
                defaultValue: {},
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
        await queryInterface.addIndex('payment_methods', ['patient_id']);
        await queryInterface.addIndex('payment_methods', ['stripe_payment_method_id']);
        await queryInterface.addIndex('payment_methods', ['type']);
        await queryInterface.addIndex('payment_methods', ['is_default']);
        await queryInterface.addIndex('payment_methods', ['is_active']);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('payment_methods');
    }
};
//# sourceMappingURL=028-create-payment-methods.js.map