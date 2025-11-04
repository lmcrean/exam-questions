/**
 * Redis Connection Configuration
 *
 * Manages Redis connection for BullMQ queues
 * Supports both development (local Redis) and production (Redis hosting service)
 */

import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Redis connection configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,     // Required for BullMQ
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis connection
export const createRedisConnection = (): Redis => {
  const redis = new Redis(redisConfig);

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redis.on('ready', () => {
    console.log('🚀 Redis ready to accept commands');
  });

  return redis;
};

// Export a default connection
export const redis = createRedisConnection();

export default redis;
