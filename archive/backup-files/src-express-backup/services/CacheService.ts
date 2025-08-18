// src/services/CacheService.ts
// Minimal working version for build compatibility

class CacheService {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    // Simple in-memory cache implementation
    this.cache.set(key, {
      value,
      expires: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
    });
    return true;
  }

  async get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async del(key: string) {
    return this.cache.delete(key);
  }

  async exists(key: string) {
    return this.cache.has(key);
  }

  async flushall() {
    this.cache.clear();
    return true;
  }

  async keys(pattern: string = '*') {
    // Simple pattern matching (only supports * wildcard)
    if (pattern === '*') {
      return Array.from(this.cache.keys());
    }
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async hset(hash: string, field: string, value: any) {
    const hashKey = `${hash}:${field}`;
    return this.set(hashKey, value);
  }

  async hget(hash: string, field: string) {
    const hashKey = `${hash}:${field}`;
    return this.get(hashKey);
  }

  async hdel(hash: string, field: string) {
    const hashKey = `${hash}:${field}`;
    return this.del(hashKey);
  }

  async incr(key: string) {
    const current = await this.get(key) || 0;
    const newValue = Number(current) + 1;
    await this.set(key, newValue);
    return newValue;
  }

  async expire(key: string, seconds: number) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    item.expires = Date.now() + (seconds * 1000);
    return true;
  }

  isConnected() {
    return true; // Always connected for in-memory cache
  }

  async disconnect() {
    this.cache.clear();
  }

  // User-specific cache methods for auth middleware compatibility
  async getCachedUser(userId: string) {
    return this.get(`user:${userId}`);
  }

  async cacheUser(userId: string, user: any, ttlSeconds?: number) {
    return this.set(`user:${userId}`, user, ttlSeconds);
  }

  // API response cache methods for middleware compatibility
  async getCachedApiResponse(key: string) {
    return this.get(`api:${key}`);
  }

  async cacheApiResponse(key: string, response: any, ttlSeconds?: number) {
    return this.set(`api:${key}`, response, ttlSeconds);
  }
}

export default new CacheService();