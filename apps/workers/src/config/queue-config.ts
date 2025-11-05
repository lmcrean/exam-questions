/**
 * Queue Configuration
 *
 * Configures BullMQ queues with appropriate settings for different job types
 */

import { QueueOptions, WorkerOptions } from 'bullmq';
import { redisConfig } from './redis.js';

// Base queue configuration
const baseQueueConfig: QueueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second delay
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000, // Keep max 5000 failed jobs
    },
  },
};

// AI Processing Queue Config - High priority, longer timeout
export const aiProcessingQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 2, // AI calls are expensive, retry only once
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Document Processing Queue Config - Medium priority
export const documentProcessingQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 3,
  },
};

// Webhook Delivery Queue Config - High retry count
export const webhookDeliveryQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 5, // Retry webhooks multiple times
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
};

// Email Delivery Queue Config
export const emailDeliveryQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 3,
  },
};

// Scheduled Tasks Queue Config
export const scheduledTasksQueueConfig: QueueOptions = {
  ...baseQueueConfig,
  defaultJobOptions: {
    ...baseQueueConfig.defaultJobOptions,
    attempts: 2,
  },
};

// Base worker configuration
export const baseWorkerConfig: WorkerOptions = {
  connection: redisConfig,
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 100, // Max 100 jobs
    duration: 60000, // per minute
  },
};

// AI Processing Worker Config - Lower concurrency to manage API rate limits
export const aiProcessingWorkerConfig: WorkerOptions = {
  ...baseWorkerConfig,
  concurrency: 3, // Process 3 AI jobs concurrently
  limiter: {
    max: 60, // Max 60 AI jobs
    duration: 60000, // per minute (to stay within Gemini rate limits)
  },
};

// Document Processing Worker Config
export const documentProcessingWorkerConfig: WorkerOptions = {
  ...baseWorkerConfig,
  concurrency: 2, // Document processing is CPU intensive
};

// Webhook Delivery Worker Config - Higher concurrency
export const webhookDeliveryWorkerConfig: WorkerOptions = {
  ...baseWorkerConfig,
  concurrency: 10, // Can handle more concurrent webhooks
};

// Email Delivery Worker Config
export const emailDeliveryWorkerConfig: WorkerOptions = {
  ...baseWorkerConfig,
  concurrency: 5,
};

// Scheduled Tasks Worker Config
export const scheduledTasksWorkerConfig: WorkerOptions = {
  ...baseWorkerConfig,
  concurrency: 2,
};
