'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
exports.default = {
    async up(queryInterface, Sequelize) {
        console.log('🩺 Enhancing vital_readings table with medical standards (idempotent)...');
        // Helper function to check if column exists
        async function columnExists(tableName, columnName) {
            try {
                const result = await queryInterface.sequelize.query(`SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}' 
            AND column_name = '${columnName}'
          );`, { type: queryInterface.sequelize.QueryTypes.SELECT });
                return result[0].exists;
            }
            catch (error) {
                return false;
            }
        }
        // 1. Make value field nullable (idempotent)
        try {
            const valueIsNullable = await queryInterface.sequelize.query(`SELECT is_nullable FROM information_schema.columns 
         WHERE table_name = 'vital_readings' AND column_name = 'value';`, { type: queryInterface.sequelize.QueryTypes.SELECT });
            if (valueIsNullable.length > 0 && valueIsNullable[0].is_nullable === 'NO') {
                console.log('  Making value field nullable...');
                await queryInterface.changeColumn('vital_readings', 'value', {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    validate: {
                        isDecimal: true,
                        min: 0
                    },
                    comment: 'General vital sign value (nullable for composite readings)'
                });
            }
            else {
                console.log('  Value field already nullable, skipping...');
            }
        }
        catch (error) {
            console.log('  Warning: Could not check value field nullability, continuing...');
        }
        // 2. Add blood pressure specific fields (idempotent)
        if (!(await columnExists('vital_readings', 'systolic_value'))) {
            console.log('  Adding systolic_value field...');
            await queryInterface.addColumn('vital_readings', 'systolic_value', {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                validate: {
                    isDecimal: true,
                    min: 40,
                    max: 250
                },
                comment: 'Systolic blood pressure in mmHg (medical standard: 90-180 normal)'
            });
        }
        else {
            console.log('  systolic_value field already exists, skipping...');
        }
        if (!(await columnExists('vital_readings', 'diastolic_value'))) {
            console.log('  Adding diastolic_value field...');
            await queryInterface.addColumn('vital_readings', 'diastolic_value', {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                validate: {
                    isDecimal: true,
                    min: 30,
                    max: 150
                },
                comment: 'Diastolic blood pressure in mmHg (medical standard: 60-110 normal)'
            });
        }
        else {
            console.log('  diastolic_value field already exists, skipping...');
        }
        // 3. Add pulse rate field (idempotent)
        if (!(await columnExists('vital_readings', 'pulse_rate'))) {
            console.log('  Adding pulse_rate field...');
            await queryInterface.addColumn('vital_readings', 'pulse_rate', {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 20,
                    max: 250
                },
                comment: 'Heart rate in beats per minute (medical standard: 60-100 normal)'
            });
        }
        else {
            console.log('  pulse_rate field already exists, skipping...');
        }
        // 4. Add respiratory rate field (idempotent)
        if (!(await columnExists('vital_readings', 'respiratory_rate'))) {
            console.log('  Adding respiratory_rate field...');
            await queryInterface.addColumn('vital_readings', 'respiratory_rate', {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 5,
                    max: 50
                },
                comment: 'Respiratory rate in breaths per minute (medical standard: 12-20 normal)'
            });
        }
        else {
            console.log('  respiratory_rate field already exists, skipping...');
        }
        // 5. Add oxygen saturation field (idempotent)
        if (!(await columnExists('vital_readings', 'oxygen_saturation'))) {
            console.log('  Adding oxygen_saturation field...');
            await queryInterface.addColumn('vital_readings', 'oxygen_saturation', {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                validate: {
                    min: 0,
                    max: 100
                },
                comment: 'Oxygen saturation percentage (medical standard: 95-100% normal)'
            });
        }
        else {
            console.log('  oxygen_saturation field already exists, skipping...');
        }
        // 6. Add alert severity levels (idempotent)
        if (!(await columnExists('vital_readings', 'alert_level'))) {
            console.log('  Adding alert_level field...');
            await queryInterface.addColumn('vital_readings', 'alert_level', {
                type: Sequelize.ENUM('normal', 'warning', 'critical', 'emergency'),
                allowNull: true,
                defaultValue: 'normal',
                comment: 'Medical alert level based on vital sign values'
            });
        }
        else {
            console.log('  alert_level field already exists, skipping...');
        }
        // 7. Add alert reasons for medical tracking (idempotent)
        if (!(await columnExists('vital_readings', 'alert_reasons'))) {
            console.log('  Adding alert_reasons field...');
            await queryInterface.addColumn('vital_readings', 'alert_reasons', {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: 'Array of medical alert reasons (e.g., ["hypertension", "tachycardia"])'
            });
        }
        else {
            console.log('  alert_reasons field already exists, skipping...');
        }
        // 8. Add indexes for performance (idempotent)
        async function indexExists(indexName) {
            try {
                const result = await queryInterface.sequelize.query(`SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = '${indexName}');`, { type: queryInterface.sequelize.QueryTypes.SELECT });
                return result[0].exists;
            }
            catch (error) {
                return false;
            }
        }
        if (!(await indexExists('vital_readings_alert_level_idx'))) {
            console.log('  Adding alert_level index...');
            await queryInterface.addIndex('vital_readings', ['alert_level'], {
                name: 'vital_readings_alert_level_idx'
            });
        }
        else {
            console.log('  alert_level index already exists, skipping...');
        }
        if (!(await indexExists('vital_readings_blood_pressure_idx'))) {
            console.log('  Adding blood pressure composite index...');
            await queryInterface.addIndex('vital_readings', ['systolic_value', 'diastolic_value'], {
                name: 'vital_readings_blood_pressure_idx'
            });
        }
        else {
            console.log('  blood pressure index already exists, skipping...');
        }
        console.log('✅ Vital readings table enhanced with medical standards!');
        console.log('📋 Medical Alert Ranges:');
        console.log('   🔴 CRITICAL: Systolic >180 or <90, Diastolic >120 or <60');
        console.log('   🟡 WARNING: Pulse <60 or >100, Temp <35°C or >38°C');
        console.log('   🟢 NORMAL: Within standard medical ranges');
    },
    async down(queryInterface, Sequelize) {
        console.log('Removing medical enhancements from vital_readings table...');
        // Remove columns in reverse order
        const columnsToRemove = [
            'alert_reasons',
            'alert_level',
            'oxygen_saturation',
            'respiratory_rate',
            'pulse_rate',
            'diastolic_value',
            'systolic_value'
        ];
        for (const column of columnsToRemove) {
            try {
                await queryInterface.removeColumn('vital_readings', column);
                console.log(`  Removed ${column} column`);
            }
            catch (error) {
                console.log(`  Warning: Could not remove ${column}, may not exist`);
            }
        }
        // Remove indexes
        const indexesToRemove = [
            'vital_readings_alert_level_idx',
            'vital_readings_blood_pressure_idx'
        ];
        for (const index of indexesToRemove) {
            try {
                await queryInterface.removeIndex('vital_readings', index);
                console.log(`  Removed ${index} index`);
            }
            catch (error) {
                console.log(`  Warning: Could not remove ${index}, may not exist`);
            }
        }
        // Restore value field to non-nullable
        await queryInterface.changeColumn('vital_readings', 'value', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: true,
                min: 0
            }
        });
        console.log('✅ Medical enhancements removed from vital_readings table');
    }
};
//# sourceMappingURL=20250810000000-enhance-vital-readings-medical-standards.js.map