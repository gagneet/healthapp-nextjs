import { Prisma } from "@prisma/client";

// src/config/database-postgres.ts
import { Sequelize, Options } from 'sequelize';
import { config } from 'dotenv';
import { createLogger } from '../middleware/logger.js';

type EmergencyAlertWithRelations = Prisma.EmergencyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type MedicationSafetyAlertWithRelations = Prisma.MedicationSafetyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: { patient: true; user: true }
}>;

type AdherenceRecordWithRelations = Prisma.AdherenceRecordGetPayload<{
  include: { patient: true; user: true }
}>;

const logger = createLogger(import.meta.url);

config();

const databaseConfig: Options = {
  database: process.env.POSTGRES_DB || 'healthapp',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  dialect: 'postgres',
  
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    timezone: 'UTC',
  },
  
  timezone: 'UTC',
  
  logging: process.env.NODE_ENV === 'development' ? (msg: any) => logger.debug(msg: any) : false,
  
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '150'),     // Increased for 500+ concurrent doctors
    min: parseInt(process.env.DB_POOL_MIN || '30'),      // Higher baseline for consistent performance
    acquire: 60000,                                      // Longer timeout for complex healthcare queries
    idle: 120000,                                        // Extended idle time for healthcare workflows
    evict: 10000,                                        // Connection health check interval
    maxUses: 1000,                                       // Max uses before connection refresh
  },
  
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for database columns
    freezeTableName: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deleted_at',
    paranoid: true, // Enable soft deletes
  },
  
  // HIPAA Compliance: Enable query logging for audit
  benchmark: true,
  logQueryParameters: process.env.NODE_ENV === 'development',
};

const sequelize = new Sequelize(databaseConfig);

// Test connection and log status
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connection established successfully');
    
    // Log connection details for debugging (without sensitive info)
    logger.info(`📊 Database: ${sequelize.config.database}`);
    logger.info(`🌐 Host: ${sequelize.config.host}:${sequelize.config.port}`);
    logger.info(`👤 User: ${sequelize.config.username}`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database connection error';
    logger.error('❌ Unable to connect to PostgreSQL database:', errorMessage);
    throw error;
  }
};

// Export both sequelize instance and test function
export { testConnection };
export default sequelize;