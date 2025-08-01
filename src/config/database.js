// src/config/database.js
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'adhere',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timezone: '+00:00',
  },
  timezone: '+00:00',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

export default sequelize;
