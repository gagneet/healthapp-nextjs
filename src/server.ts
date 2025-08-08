// Modern ES Module Server Example
// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';

import { sequelize } from './models/index.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';
import { createLogger } from './middleware/logger.js';

config();

const logger = createLogger(import.meta.url);
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: (logger as any).stream }));

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Routes
app.use('/api', routes);
app.use('/m-api', routes); // Mobile API using same routes

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: false,
    statusCode: 404,
    payload: {
      error: {
        status: 'NOT_FOUND',
        message: 'Route not found'
      }
    }
  });
});

// Database connection with retry logic
const connectWithRetry = async () => {
  const maxRetries = parseInt(process.env.DB_CONNECT_MAX_RETRIES || '10') || 10;
  const retryDelay = parseInt(process.env.DB_CONNECT_RETRY_DELAY || '5000') || 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully');
      return;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${(error as any).message}`);
      
      if (attempt === maxRetries) {
        logger.error('Max database connection retries reached');
        throw error;
      }
      
      logger.info(`Retrying database connection in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database with retry logic
    await connectWithRetry();
    
    // Sync database (use with caution in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      logger.info('Database synchronized');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;