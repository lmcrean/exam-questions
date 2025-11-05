/**
 * Queue Service for API
 *
 * Allows API to enqueue background jobs for processing by workers
 * This bridges the API app with the Workers app via Redis queues
 */

import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Queue names must match those in workers app
export enum QueueName {
  AI_PROCESSING = 'ai-processing',
  DOCUMENT_PROCESSING = 'document-processing',
  WEBHOOK_DELIVERY = 'webhook-delivery',
  EMAIL_DELIVERY = 'email-delivery',
  SCHEDULED_TASKS = 'scheduled-tasks',
  TOKEN_CLEANUP = 'token-cleanup',
}

// AI Processing Queue
export const aiProcessingQueue = new Queue(QueueName.AI_PROCESSING, {
  connection: redisConfig,
});

// Document Processing Queue
export const documentProcessingQueue = new Queue(QueueName.DOCUMENT_PROCESSING, {
  connection: redisConfig,
});

// Webhook Delivery Queue
export const webhookDeliveryQueue = new Queue(QueueName.WEBHOOK_DELIVERY, {
  connection: redisConfig,
});

// Email Delivery Queue
export const emailDeliveryQueue = new Queue(QueueName.EMAIL_DELIVERY, {
  connection: redisConfig,
});

// Scheduled Tasks Queue
export const scheduledTasksQueue = new Queue(QueueName.SCHEDULED_TASKS, {
  connection: redisConfig,
});

// Token Cleanup Queue
export const tokenCleanupQueue = new Queue(QueueName.TOKEN_CLEANUP, {
  connection: redisConfig,
});

// Export all queues as a map
export const queues = {
  [QueueName.AI_PROCESSING]: aiProcessingQueue,
  [QueueName.DOCUMENT_PROCESSING]: documentProcessingQueue,
  [QueueName.WEBHOOK_DELIVERY]: webhookDeliveryQueue,
  [QueueName.EMAIL_DELIVERY]: emailDeliveryQueue,
  [QueueName.SCHEDULED_TASKS]: scheduledTasksQueue,
  [QueueName.TOKEN_CLEANUP]: tokenCleanupQueue,
};

/**
 * Check if workers are enabled (Redis configured)
 */
export function areWorkersEnabled(): boolean {
  return !!(process.env.REDIS_HOST || process.env.ENABLE_WORKERS === 'true');
}

/**
 * Get job by ID from any queue
 */
export async function getJob(queueName: QueueName, jobId: string) {
  const queue = queues[queueName];
  return await queue.getJob(jobId);
}

/**
 * Close all queue connections
 */
export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    aiProcessingQueue.close(),
    documentProcessingQueue.close(),
    webhookDeliveryQueue.close(),
    emailDeliveryQueue.close(),
    scheduledTasksQueue.close(),
    tokenCleanupQueue.close(),
  ]);
}

export default queues;
