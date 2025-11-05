/**
 * Workers Application Entry Point
 *
 * Starts all background job workers
 */

import { Worker } from 'bullmq';
import { createAIWorker } from './workers/ai-worker.js';
import { createDocumentWorker } from './workers/document-worker.js';
import { createWebhookWorker } from './workers/webhook-worker.js';
import { createSchedulerWorker } from './workers/scheduler-worker.js';
import { closeAllQueues } from './queues/index.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Array to hold all active workers
const workers: Worker[] = [];

/**
 * Start all workers
 */
async function startWorkers() {
  console.log('🚀 Starting Workers Application...');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
  console.log('');

  try {
    // Start AI Processing Worker (Priority - Phase 2)
    console.log('Starting AI Processing Worker...');
    workers.push(createAIWorker());

    // Start Webhook Worker (Phase 4)
    console.log('Starting Webhook Delivery Worker...');
    workers.push(createWebhookWorker());

    // Start Document Worker (Phase 3 - placeholder)
    console.log('Starting Document Processing Worker...');
    workers.push(createDocumentWorker());

    // Start Scheduler Worker (Phase 5 - placeholder)
    console.log('Starting Scheduler Worker...');
    workers.push(createSchedulerWorker());

    console.log('');
    console.log('✅ All workers started successfully!');
    console.log('📊 Workers are now processing jobs from queues...');
    console.log('');
    console.log('Press Ctrl+C to gracefully shutdown');
  } catch (error) {
    console.error('❌ Error starting workers:', error);
    await shutdown();
    process.exit(1);
  }
}

/**
 * Gracefully shutdown all workers
 */
async function shutdown() {
  console.log('');
  console.log('🔄 Shutting down workers...');

  try {
    // Close all workers
    await Promise.all(workers.map((worker) => worker.close()));
    console.log('✅ All workers closed');

    // Close all queue connections
    await closeAllQueues();

    console.log('👋 Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the workers
startWorkers();
