// src/migrations/004-create-patients.js
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.tableExists('patients');
        if (tableExists) {
            console.log('Table patients already exists, skipping creation');
            return;
        }
        // Create patients table
        await queryInterface.createTable('patients', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE',
            },
            organization_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'organizations',
                    key: 'id'
                },
            },
            // Medical information
            medical_record_number: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            emergency_contacts: {
                type: Sequelize.JSONB,
                defaultValue: [],
            },
            insurance_information: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            medical_history: {
                type: Sequelize.JSONB,
                defaultValue: [],
            },
            allergies: {
                type: Sequelize.JSONB,
                defaultValue: [],
            },
            current_medications: {
                type: Sequelize.JSONB,
                defaultValue: [],
            },
            // Physical measurements with constraints
            height_cm: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                validate: {
                    min: 0,
                    max: 300
                }
            },
            weight_kg: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                validate: {
                    min: 0,
                    max: 1000
                }
            },
            // Settings
            communication_preferences: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            privacy_settings: {
                type: Sequelize.JSONB,
                defaultValue: {},
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
        // Add constraints for height and weight with error handling
        try {
            await queryInterface.sequelize.query(`
        ALTER TABLE patients ADD CONSTRAINT check_height_range 
        CHECK (height_cm > 0 AND height_cm < 300);
      `);
        }
        catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
                throw error;
            }
            console.log('Constraint check_height_range already exists, skipping');
        }
        try {
            await queryInterface.sequelize.query(`
        ALTER TABLE patients ADD CONSTRAINT check_weight_range 
        CHECK (weight_kg > 0 AND weight_kg < 1000);
      `);
        }
        catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
                throw error;
            }
            console.log('Constraint check_weight_range already exists, skipping');
        }
        // Add indexes with error handling
        try {
            await queryInterface.addIndex('patients', ['user_id'], {
                name: 'idx_patients_user_id'
            });
        }
        catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
            console.log('Index idx_patients_user_id already exists, skipping');
        }
        try {
            await queryInterface.addIndex('patients', ['organization_id'], {
                where: { deleted_at: null },
                name: 'idx_patients_org'
            });
        }
        catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
            console.log('Index idx_patients_org already exists, skipping');
        }
        try {
            await queryInterface.addIndex('patients', ['medical_record_number'], {
                where: { deleted_at: null },
                name: 'idx_patients_mrn'
            });
        }
        catch (error) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
            console.log('Index idx_patients_mrn already exists, skipping');
        }
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('patients');
    }
};
//# sourceMappingURL=004-create-patients.js.map