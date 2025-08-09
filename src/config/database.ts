// src/config/database.js
// Import PostgreSQL configuration
import sequelize, { testConnection } from './database-postgres.ts';

export { testConnection };
export default sequelize;
