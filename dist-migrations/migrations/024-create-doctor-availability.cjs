'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctor_availability'", { type: Sequelize.QueryTypes.SELECT });
        if (tableExists.length > 0) {
            console.log('ℹ️ Table "doctor_availability" already exists, skipping creation');
            return;
        }
        await queryInterface.createTable('doctor_availability', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            doctor_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            day_of_week: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 6
                }
            },
            start_time: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            end_time: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            is_available: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            slot_duration: {
                type: Sequelize.INTEGER,
                defaultValue: 30,
            },
            max_appointments_per_slot: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            break_start_time: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            break_end_time: {
                type: Sequelize.TIME,
                allowNull: true,
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
        });
        // Add indexes
        await queryInterface.addIndex('doctor_availability', ['doctor_id', 'day_of_week']);
        await queryInterface.addIndex('doctor_availability', ['doctor_id', 'is_available']);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('doctor_availability');
    }
};
//# sourceMappingURL=024-create-doctor-availability.js.map