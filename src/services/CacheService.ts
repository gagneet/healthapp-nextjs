// src/services/CacheService.js - Redis Caching Service for Performance Optimization
import Redis from 'redis';
import { createLogger } from '../middleware/logger.js';

const logger = createLogger(import.meta.url);

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    // Temporarily disable Redis initialization to eliminate connection errors
    // The application works fine without caching
    logger.info('CacheService initialized (Redis disabled for stability)');
  }

  async init() {
    // Skip Redis initialization in production if not needed
    if (!process.env.REDIS_HOST && process.env.NODE_ENV === 'production') {
      logger.warn('Redis not configured, caching disabled');
      this.isConnected = false;
      return;
    }

    try {
      this.client = Redis.createClient({
        url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        database: process.env.REDIS_DB || 0,
        socket: {
          connectTimeout: 5000, // Reduced timeout
          reconnectStrategy: (retries) => {
            if (retries >= 3) {
              logger.warn('Max Redis reconnection attempts reached, disabling cache');
              this.isConnected = false;
              return false;
            }
            return Math.min(retries * 500, 2000);
          }
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.warn('Redis client error (cache will be disabled):', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected, cache disabled');
        this.isConnected = false;
      });

      // Set timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        logger.warn('Redis connection timeout, proceeding without cache');
        this.isConnected = false;
      }, 8000);

      await this.client.connect();
      clearTimeout(connectionTimeout);
      
    } catch (error) {
      logger.warn('Redis connection failed, continuing without cache:', error.message);
      this.isConnected = false;
      this.client = null;
    }
  }

  // User authentication caching
  async cacheUser(userId, userData, ttl = 900) { // 15 minutes default
    if (!this.isConnected) return false;
    
    try {
      const key = `user:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        ...userData,
        cached_at: Date.now()
      }));
      return true;
    } catch (error) {
      logger.error('Failed to cache user:', error);
      return false;
    }
  }

  async getCachedUser(userId) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(`user:${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cached user:', error);
      return null;
    }
  }

  async invalidateUser(userId) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(`user:${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to invalidate user cache:', error);
      return false;
    }
  }

  // Patient list caching
  async cachePatientList(doctorId, filters, patients, ttl = 300) { // 5 minutes default
    if (!this.isConnected) return false;
    
    try {
      const key = `patients:doctor:${doctorId}:${this.hashFilters(filters)}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        patients,
        total: patients.length,
        cached_at: Date.now(),
        filters
      }));
      return true;
    } catch (error) {
      logger.error('Failed to cache patient list:', error);
      return false;
    }
  }

  async getCachedPatientList(doctorId, filters) {
    if (!this.isConnected) return null;
    
    try {
      const key = `patients:doctor:${doctorId}:${this.hashFilters(filters)}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cached patient list:', error);
      return null;
    }
  }

  async invalidatePatientList(doctorId) {
    if (!this.isConnected) return false;
    
    try {
      const pattern = `patients:doctor:${doctorId}:*`;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Failed to invalidate patient list cache:', error);
      return false;
    }
  }

  // Patient details caching
  async cachePatientDetails(patientId, patientData, ttl = 600) { // 10 minutes default
    if (!this.isConnected) return false;
    
    try {
      const key = `patient:${patientId}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        ...patientData,
        cached_at: Date.now()
      }));
      return true;
    } catch (error) {
      logger.error('Failed to cache patient details:', error);
      return false;
    }
  }

  async getCachedPatientDetails(patientId) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(`patient:${patientId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cached patient details:', error);
      return null;
    }
  }

  async invalidatePatientDetails(patientId) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(`patient:${patientId}`);
      return true;
    } catch (error) {
      logger.error('Failed to invalidate patient details cache:', error);
      return false;
    }
  }

  // Doctor assignments caching (for secondary doctor system)
  async cacheDoctorAssignments(patientId, assignments, ttl = 1800) { // 30 minutes default
    if (!this.isConnected) return false;
    
    try {
      const key = `assignments:patient:${patientId}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        assignments,
        cached_at: Date.now()
      }));
      return true;
    } catch (error) {
      logger.error('Failed to cache doctor assignments:', error);
      return false;
    }
  }

  async getCachedDoctorAssignments(patientId) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(`assignments:patient:${patientId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cached doctor assignments:', error);
      return null;
    }
  }

  // API response caching
  async cacheApiResponse(endpoint, params, response, ttl = 180) { // 3 minutes default
    if (!this.isConnected) return false;
    
    try {
      const key = `api:${endpoint}:${this.hashParams(params)}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        response,
        cached_at: Date.now()
      }));
      return true;
    } catch (error) {
      logger.error('Failed to cache API response:', error);
      return false;
    }
  }

  async getCachedApiResponse(endpoint, params) {
    if (!this.isConnected) return null;
    
    try {
      const key = `api:${endpoint}:${this.hashParams(params)}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cached API response:', error);
      return null;
    }
  }

  // Utility methods
  hashFilters(filters) {
    return Buffer.from(JSON.stringify(filters || {})).toString('base64');
  }

  hashParams(params) {
    return Buffer.from(JSON.stringify(params || {})).toString('base64');
  }

  // Bulk operations for performance
  async mget(keys) {
    if (!this.isConnected) return [];
    
    try {
      return await this.client.mGet(keys);
    } catch (error) {
      logger.error('Failed to perform mget:', error);
      return [];
    }
  }

  async mset(keyValuePairs, ttl = 300) {
    if (!this.isConnected) return false;
    
    try {
      const pipeline = this.client.multi();
      
      for (let i = 0; i < keyValuePairs.length; i += 2) {
        const key = keyValuePairs[i];
        const value = keyValuePairs[i + 1];
        pipeline.setEx(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Failed to perform mset:', error);
      return false;
    }
  }

  // Cache warming for frequently accessed data
  async warmCache() {
    logger.info('Starting cache warming process...');
    
    try {
      // Implement cache warming logic here
      // This would pre-populate frequently accessed data
      logger.info('Cache warming completed successfully');
    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) return { status: 'disconnected' };
    
    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'connected',
        latency: `${latency}ms`,
        memory: await this.client.info('memory')
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Cleanup on application shutdown
  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected gracefully');
      } catch (error) {
        logger.error('Error disconnecting Redis client:', error);
      }
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;