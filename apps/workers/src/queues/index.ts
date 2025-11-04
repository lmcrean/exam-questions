/**
 * Queue Instances
 *
 * Creates and exports queue instances for different job types
 */

import { Queue } from 'bullmq';
import {
  aiProcessingQueueConfig,
  documentProcessingQueueConfig,
  webhookDeliveryQueueConfig,
  emailDeliveryQueueConfig,
  scheduledTasksQueueConfig,
} from '../config/queue-config.js';
import {
  QueueName,
  AIProcessingJobData,
  DocumentProcessingJobData,
  WebhookDeliveryJobData,
  EmailDeliveryJobData,
  ScheduledTaskJobData,
  TokenCleanupJobData,
} from '../types/queue-types.js';

// Create queue instances
export const aiProcessingQueue = new Queue<AIProcessingJobData>(
  QueueName.AI_PROCESSING,
  aiProcessingQueueConfig
);

export const documentProcessingQueue = new Queue<DocumentProcessingJobData>(
  QueueName.DOCUMENT_PROCESSING,
  documentProcessingQueueConfig
);

export const webhookDeliveryQueue = new Queue<WebhookDeliveryJobData>(
  QueueName.WEBHOOK_DELIVERY,
  webhookDeliveryQueueConfig
);

export const emailDeliveryQueue = new Queue<EmailDeliveryJobData>(
  QueueName.EMAIL_DELIVERY,
  emailDeliveryQueueConfig
);

export const scheduledTasksQueue = new Queue<ScheduledTaskJobData>(
  QueueName.SCHEDULED_TASKS,
  scheduledTasksQueueConfig
);

export const tokenCleanupQueue = new Queue<TokenCleanupJobData>(
  QueueName.TOKEN_CLEANUP,
  scheduledTasksQueueConfig
);

// Export all queues as a map for easier access
export const queues = {
  [QueueName.AI_PROCESSING]: aiProcessingQueue,
  [QueueName.DOCUMENT_PROCESSING]: documentProcessingQueue,
  [QueueName.WEBHOOK_DELIVERY]: webhookDeliveryQueue,
  [QueueName.EMAIL_DELIVERY]: emailDeliveryQueue,
  [QueueName.SCHEDULED_TASKS]: scheduledTasksQueue,
  [QueueName.TOKEN_CLEANUP]: tokenCleanupQueue,
};

// Graceful shutdown handler
export async function closeAllQueues(): Promise<void> {
  console.log('🔄 Closing all queues...');
  await Promise.all([
    aiProcessingQueue.close(),
    documentProcessingQueue.close(),
    webhookDeliveryQueue.close(),
    emailDeliveryQueue.close(),
    scheduledTasksQueue.close(),
    tokenCleanupQueue.close(),
  ]);
  console.log('✅ All queues closed');
}

// Handle process termination
process.on('SIGTERM', async () => {
  await closeAllQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeAllQueues();
  process.exit(0);
});

export default queues;
