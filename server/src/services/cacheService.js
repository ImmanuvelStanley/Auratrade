const EventEmitter = require('events');
const Redis = require('ioredis');
const config = require('../config');

class CacheService extends EventEmitter {
  constructor() {
    super();
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.memorySets = new Map();
    this.subscriptions = new Map();
    this.redisClient = null;
    this.redisSubscriber = null;

    this.init();
  }

  async init() {
    if (config.redisUrl) {
      try {
        this.redisClient = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: () => null // Don't hang if unavailable
        });

        this.redisSubscriber = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: () => null
        });

        this.redisClient.on('connect', () => {
          this.isRedisAvailable = true;
          console.log('[CacheService] Connected to Redis Cloud / local Redis successfully.');
        });

        this.redisClient.on('error', (err) => {
          if (this.isRedisAvailable) {
            console.warn('[CacheService] Redis connection lost, switching to in-memory fallback.');
          }
          this.isRedisAvailable = false;
        });

        this.redisSubscriber.on('message', (channel, message) => {
          this.emit(`channel:${channel}`, message);
        });
      } catch (err) {
        console.warn('[CacheService] Redis init failed. Using resilient in-memory cache.');
        this.isRedisAvailable = false;
      }
    } else {
      console.log('[CacheService] No REDIS_URL provided. Using resilient high-speed in-memory cache & pub/sub.');
    }
  }

  // Key-Value with TTL support
  async get(key) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.get(key);
      } catch (e) {
        // Fallback to memory
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, ttlSec) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        if (mode === 'EX' && ttlSec) {
          return await this.redisClient.set(key, value, 'EX', ttlSec);
        }
        return await this.redisClient.set(key, value);
      } catch (e) {
        // Fallback to memory
      }
    }

    const expiresAt = mode === 'EX' && ttlSec ? Date.now() + ttlSec * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.del(key);
      } catch (e) {}
    }
    this.memoryCache.delete(key);
    return 1;
  }

  // Set operations (for active symbols)
  async sadd(setKey, ...members) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.sadd(setKey, ...members);
      } catch (e) {}
    }

    if (!this.memorySets.has(setKey)) {
      this.memorySets.set(setKey, new Set());
    }
    const set = this.memorySets.get(setKey);
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(setKey, ...members) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.srem(setKey, ...members);
      } catch (e) {}
    }

    if (!this.memorySets.has(setKey)) return 0;
    const set = this.memorySets.get(setKey);
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(setKey) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.smembers(setKey);
      } catch (e) {}
    }

    if (!this.memorySets.has(setKey)) return [];
    return Array.from(this.memorySets.get(setKey));
  }

  // Pub/Sub operations
  async publish(channel, message) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.publish(channel, payload);
      } catch (e) {}
    }

    // Always emit on local event emitter for seamless in-process delivery
    this.emit(`channel:${channel}`, payload);
  }

  subscribe(channel, handler) {
    if (this.isRedisAvailable && this.redisSubscriber) {
      try {
        this.redisSubscriber.subscribe(channel);
      } catch (e) {}
    }
    this.on(`channel:${channel}`, handler);
  }
}

module.exports = new CacheService();
