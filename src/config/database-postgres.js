// src/config/database-postgres.js
import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const sequelize = new Sequelize({
  database: process.env.POSTGRES_DB || 'healthapp',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  dialect: 'postgres',
  
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    timezone: 'UTC',
  },
  
  timezone: 'UTC',
  
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 5,
    acquire: 30000,
    idle: 10000,
  },
  
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for database columns
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true, // Enable soft deletes
  },
  
  // HIPAA Compliance: Enable query logging for audit
  benchmark: true,
  logQueryParameters: process.env.NODE_ENV === 'development',
});

// Test connection and log status
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    
    // Log connection details for debugging (without sensitive info)
    console.log(`📊 Database: ${sequelize.config.database}`);
    console.log(`🌐 Host: ${sequelize.config.host}:${sequelize.config.port}`);
    console.log(`👤 User: ${sequelize.config.username}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error.message);
    throw error;
  }
};

// Export both sequelize instance and test function
export { testConnection };
export default sequelize;