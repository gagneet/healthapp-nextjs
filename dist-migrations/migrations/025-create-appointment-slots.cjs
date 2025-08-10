'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        // Check if table already exists
        const tableExists = await queryInterface.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointment_slots'", { type: Sequelize.QueryTypes.SELECT });
        if (tableExists.length > 0) {
            console.log('ℹ️ Table "appointment_slots" already exists, skipping creation');
            return;
        }
        await queryInterface.createTable('appointment_slots', {
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
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            start_time: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            end_time: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            max_appointments: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            booked_appointments: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            is_available: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            slot_type: {
                type: Sequelize.ENUM('regular', 'emergency', 'consultation', 'follow_up'),
                defaultValue: 'regular',
            },
            notes: {
                type: Sequelize.TEXT,
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
        await queryInterface.addIndex('appointment_slots', ['doctor_id', 'date', 'start_time']);
        await queryInterface.addIndex('appointment_slots', ['doctor_id', 'is_available']);
        await queryInterface.addIndex('appointment_slots', ['date', 'is_available']);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('appointment_slots');
    }
};
//# sourceMappingURL=025-create-appointment-slots.js.map