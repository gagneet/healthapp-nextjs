// src/config/database.js
// Import PostgreSQL configuration
import sequelize, { testConnection } from './database-postgres.js';

export { testConnection };
export default sequelize;
