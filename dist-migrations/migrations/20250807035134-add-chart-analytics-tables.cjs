'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
exports.default = {
    async up(queryInterface, Sequelize) {
        console.log('🚀 Creating chart analytics tables (idempotent)...');
        // Helper function to check if table exists
        async function tableExists(tableName) {
            const result = await queryInterface.sequelize.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}');`, { type: queryInterface.sequelize.QueryTypes.SELECT });
            return result[0].exists;
        }
        // Helper function to check if index exists
        async function indexExists(indexName) {
            try {
                const result = await queryInterface.sequelize.query(`SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = '${indexName}');`, { type: queryInterface.sequelize.QueryTypes.SELECT });
                return result[0].exists;
            }
            catch (error) {
                return false;
            }
        }
        // Create medication_logs table for tracking medication adherence
        if (!(await tableExists('medication_logs'))) {
            await queryInterface.createTable('medication_logs', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                medication_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'medications',
                        key: 'id'
                    },
                    onDelete: 'CASCADE'
                },
                patient_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'patients',
                        key: 'id'
                    },
                    onDelete: 'CASCADE'
                },
                scheduled_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                taken_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                dosage_taken: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                notes: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                adherence_status: {
                    type: Sequelize.ENUM('taken', 'missed', 'late', 'partial'),
                    defaultValue: 'missed'
                },
                reminder_sent: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                created_at: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                },
                updated_at: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                }
            });
            console.log('✓ Created medication_logs table');
        }
        else {
            console.log('ℹ️ medication_logs table already exists, skipping creation');
        }
        // Create patient_alerts table for critical alerts and notifications
        if (!(await tableExists('patient_alerts'))) {
            await queryInterface.createTable('patient_alerts', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                patient_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'patients',
                        key: 'id'
                    },
                    onDelete: 'CASCADE'
                },
                alert_type: {
                    type: Sequelize.ENUM('medication', 'vital', 'appointment', 'symptom', 'system'),
                    allowNull: false
                },
                severity: {
                    type: Sequelize.ENUM('critical', 'high', 'medium', 'low'),
                    defaultValue: 'medium'
                },
                title: {
                    type: Sequelize.STRING(200),
                    allowNull: false
                },
                message: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },
                action_required: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                acknowledged: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                acknowledged_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                acknowledged_by: {
                    type: Sequelize.UUID,
                    allowNull: true
                },
                resolved: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                resolved_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                metadata: {
                    type: Sequelize.JSONB,
                    defaultValue: {}
                },
                created_at: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                },
                updated_at: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                }
            });
            console.log('✓ Created patient_alerts table');
        }
        else {
            console.log('ℹ️ patient_alerts table already exists, skipping creation');
        }
        // Create dashboard_metrics table for caching calculated metrics
        if (!(await tableExists('dashboard_metrics'))) {
            await queryInterface.createTable('dashboard_metrics', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                entity_type: {
                    type: Sequelize.ENUM('patient', 'doctor', 'organization', 'system'),
                    allowNull: false
                },
                entity_id: {
                    type: Sequelize.UUID,
                    allowNull: false
                },
                metric_type: {
                    type: Sequelize.STRING(100),
                    allowNull: false
                },
                metric_data: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: {}
                },
                calculated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.NOW
                },
                valid_until: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                created_at: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                },
                updated_at: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                }
            });
            console.log('✓ Created dashboard_metrics table');
        }
        else {
            console.log('ℹ️ dashboard_metrics table already exists, skipping creation');
        }
        // Add indexes for performance (only if they don't exist)
        const indexes = [
            { table: 'medication_logs', name: 'medication_logs_medication_id_scheduled_at', columns: ['medication_id', 'scheduled_at'] },
            { table: 'medication_logs', name: 'medication_logs_patient_id_scheduled_at', columns: ['patient_id', 'scheduled_at'] },
            { table: 'medication_logs', name: 'medication_logs_adherence_status_scheduled_at', columns: ['adherence_status', 'scheduled_at'] },
            { table: 'patient_alerts', name: 'patient_alerts_patient_id_alert_type_severity', columns: ['patient_id', 'alert_type', 'severity'] },
            { table: 'patient_alerts', name: 'patient_alerts_acknowledged_resolved', columns: ['acknowledged', 'resolved'] },
            { table: 'patient_alerts', name: 'patient_alerts_created_at', columns: ['created_at'] },
            { table: 'dashboard_metrics', name: 'dashboard_metrics_entity_type_entity_id_metric_type', columns: ['entity_type', 'entity_id', 'metric_type'] },
            { table: 'dashboard_metrics', name: 'dashboard_metrics_calculated_at_valid_until', columns: ['calculated_at', 'valid_until'] }
        ];
        for (const index of indexes) {
            if (!(await indexExists(index.name))) {
                try {
                    await queryInterface.addIndex(index.table, index.columns, { name: index.name });
                    console.log(`✓ Added index: ${index.name}`);
                }
                catch (error) {
                    console.log(`⚠️ Failed to add index ${index.name}: ${error.message}`);
                }
            }
            else {
                console.log(`ℹ️ Index ${index.name} already exists, skipping`);
            }
        }
        console.log('✅ Chart analytics tables setup completed');
    },
    async down(queryInterface, Sequelize) {
        console.log('Dropping chart analytics tables...');
        // Drop tables in reverse order
        const tables = ['dashboard_metrics', 'patient_alerts', 'medication_logs'];
        for (const table of tables) {
            try {
                await queryInterface.dropTable(table);
                console.log(`✓ Dropped table: ${table}`);
            }
            catch (error) {
                console.log(`⚠️ Failed to drop table ${table}: ${error.message}`);
            }
        }
        // Drop ENUMs
        const enums = [
            'enum_medication_logs_adherence_status',
            'enum_patient_alerts_alert_type',
            'enum_patient_alerts_severity',
            'enum_dashboard_metrics_entity_type'
        ];
        for (const enumName of enums) {
            try {
                await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
                console.log(`✓ Dropped enum: ${enumName}`);
            }
            catch (error) {
                console.log(`⚠️ Failed to drop enum ${enumName}: ${error.message}`);
            }
        }
        console.log('✅ Chart analytics tables cleanup completed');
    }
};
//# sourceMappingURL=20250807035134-add-chart-analytics-tables.js.map