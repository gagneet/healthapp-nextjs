// src/migrations/011-enhance-doctor-profile-fields.js
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        console.log('👨‍⚕️ Enhancing doctor profile fields...');
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Check if columns already exist to make migration idempotent
            const doctorsTable = await queryInterface.describeTable('doctors');
            const usersTable = await queryInterface.describeTable('users');
            // Add new fields to doctors table if they don't exist
            if (!doctorsTable.profile_picture_url) {
                await queryInterface.addColumn('doctors', 'profile_picture_url', {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'URL to doctor profile picture'
                }, { transaction });
                console.log('Added profile_picture_url to doctors table');
            }
            if (!doctorsTable.banner_image_url) {
                await queryInterface.addColumn('doctors', 'banner_image_url', {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'URL to clinic/practice banner image'
                }, { transaction });
                console.log('Added banner_image_url to doctors table');
            }
            if (!doctorsTable.qualification_details) {
                await queryInterface.addColumn('doctors', 'qualification_details', {
                    type: Sequelize.JSONB,
                    defaultValue: [],
                    allowNull: true,
                    comment: 'Detailed qualification information including degrees, universities, years'
                }, { transaction });
                console.log('Added qualification_details to doctors table');
            }
            if (!doctorsTable.registration_details) {
                await queryInterface.addColumn('doctors', 'registration_details', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true,
                    comment: 'Medical registration details with councils and authorities'
                }, { transaction });
                console.log('Added registration_details to doctors table');
            }
            if (!doctorsTable.subscription_details) {
                await queryInterface.addColumn('doctors', 'subscription_details', {
                    type: Sequelize.JSONB,
                    defaultValue: {},
                    allowNull: true,
                    comment: 'Payment gateway and subscription account details'
                }, { transaction });
                console.log('Added subscription_details to doctors table');
            }
            if (!doctorsTable.signature_image_url) {
                await queryInterface.addColumn('doctors', 'signature_image_url', {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'URL to uploaded signature image'
                }, { transaction });
                console.log('Added signature_image_url to doctors table');
            }
            if (!doctorsTable.signature_data) {
                await queryInterface.addColumn('doctors', 'signature_data', {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Digital signature data (base64 encoded)'
                }, { transaction });
                console.log('Added signature_data to doctors table');
            }
            if (!doctorsTable.gender) {
                await queryInterface.addColumn('doctors', 'gender', {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    comment: 'Doctor gender for profile display'
                }, { transaction });
                console.log('Added gender to doctors table');
            }
            if (!doctorsTable.mobile_number) {
                await queryInterface.addColumn('doctors', 'mobile_number', {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    comment: 'Doctor mobile number (can be different from user phone)'
                }, { transaction });
                console.log('Added mobile_number to doctors table');
            }
            // Enhance users table for better name handling
            if (!usersTable.full_name) {
                await queryInterface.addColumn('users', 'full_name', {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    comment: 'Complete name as entered by user'
                }, { transaction });
                console.log('Added full_name to users table');
            }
            // Add indexes for better performance
            await queryInterface.addIndex('doctors', ['gender'], { transaction });
            await queryInterface.addIndex('doctors', ['is_verified', 'gender'], { transaction });
            await queryInterface.addIndex('users', ['full_name'], { transaction });
            await transaction.commit();
            console.log('✅ Doctor profile enhancements completed successfully');
        }
        catch (error) {
            await transaction.rollback();
            console.error('❌ Error enhancing doctor profile fields:', error);
            throw error;
        }
    },
    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Remove added columns
            await queryInterface.removeColumn('doctors', 'profile_picture_url', { transaction });
            await queryInterface.removeColumn('doctors', 'banner_image_url', { transaction });
            await queryInterface.removeColumn('doctors', 'qualification_details', { transaction });
            await queryInterface.removeColumn('doctors', 'registration_details', { transaction });
            await queryInterface.removeColumn('doctors', 'subscription_details', { transaction });
            await queryInterface.removeColumn('doctors', 'signature_image_url', { transaction });
            await queryInterface.removeColumn('doctors', 'signature_data', { transaction });
            await queryInterface.removeColumn('doctors', 'gender', { transaction });
            await queryInterface.removeColumn('doctors', 'mobile_number', { transaction });
            await queryInterface.removeColumn('users', 'full_name', { transaction });
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
//# sourceMappingURL=011-enhance-doctor-profile-fields.js.map