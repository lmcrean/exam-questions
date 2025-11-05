/**
 * Webhook Delivery Worker
 *
 * Processes webhook delivery jobs with retry logic
 * Phase 4 implementation - basic implementation
 */

import { Worker, Job } from 'bullmq';
import {
  QueueName,
  WebhookDeliveryJobData,
  WebhookDeliveryJobResult,
} from '../types/queue-types.js';
import { webhookDeliveryWorkerConfig } from '../config/queue-config.js';

/**
 * Process webhook delivery job
 */
async function processWebhookJob(
  job: Job<WebhookDeliveryJobData>
): Promise<WebhookDeliveryJobResult> {
  const { url, method, payload, headers } = job.data;

  console.log(`📡 Sending webhook to ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    const success = response.ok;
    const statusCode = response.status;
    let responseBody;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    console.log(`${success ? '✅' : '❌'} Webhook ${url} responded with ${statusCode}`);

    return {
      webhookId: job.data.webhookId,
      statusCode,
      success,
      attempts: job.attemptsMade,
      responseBody,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Error delivering webhook to ${url}:`, error);

    return {
      webhookId: job.data.webhookId,
      statusCode: 0,
      success: false,
      attempts: job.attemptsMade,
      responseBody: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create and start the webhook delivery worker
 */
export function createWebhookWorker(): Worker {
  const worker = new Worker<WebhookDeliveryJobData, WebhookDeliveryJobResult>(
    QueueName.WEBHOOK_DELIVERY,
    processWebhookJob,
    webhookDeliveryWorkerConfig
  );

  worker.on('completed', (job) => {
    console.log(`✅ Webhook job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ Webhook job ${job?.id} failed after retries:`, error);
  });

  console.log('🚀 Webhook Delivery Worker started');

  return worker;
}

// Start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createWebhookWorker();
}

export default createWebhookWorker;
