/**
 * Cron Scheduler Service
 *
 * Schedules recurring jobs like token cleanup, reports, etc.
 * Replaces setInterval with proper cron-based scheduling
 */

import { CronJob } from 'cron';
import { tokenCleanupQueue, scheduledTasksQueue } from '../queues/index.js';

const jobs: CronJob[] = [];

/**
 * Schedule token cleanup job
 * Runs every 6 hours to clean up expired tokens
 */
export function scheduleTokenCleanup() {
  const job = new CronJob(
    '0 */6 * * *', // Every 6 hours
    async () => {
      console.log('⏰ Running scheduled token cleanup...');
      try {
        await tokenCleanupQueue.add('cleanup', {
          olderThanHours: 24,
          batchSize: 1000,
        });
        console.log('✅ Token cleanup job enqueued');
      } catch (error) {
        console.error('❌ Failed to enqueue token cleanup:', error);
      }
    },
    null, // onComplete
    true, // start
    'America/New_York' // timezone
  );

  jobs.push(job);
  console.log('📅 Token cleanup scheduled: every 6 hours');
  return job;
}

/**
 * Schedule daily analytics aggregation
 * Runs every day at 2 AM
 */
export function scheduleAnalyticsAggregation() {
  const job = new CronJob(
    '0 2 * * *', // Every day at 2 AM
    async () => {
      console.log('⏰ Running analytics aggregation...');
      try {
        await scheduledTasksQueue.add('analytics', {
          taskType: 'report',
          taskData: {
            type: 'daily-analytics',
            date: new Date().toISOString().split('T')[0],
          },
        });
        console.log('✅ Analytics aggregation job enqueued');
      } catch (error) {
        console.error('❌ Failed to enqueue analytics aggregation:', error);
      }
    },
    null,
    true,
    'America/New_York'
  );

  jobs.push(job);
  console.log('📅 Analytics aggregation scheduled: daily at 2 AM');
  return job;
}

/**
 * Schedule weekly database backup
 * Runs every Sunday at 3 AM
 */
export function scheduleWeeklyBackup() {
  const job = new CronJob(
    '0 3 * * 0', // Every Sunday at 3 AM
    async () => {
      console.log('⏰ Running weekly backup...');
      try {
        await scheduledTasksQueue.add('backup', {
          taskType: 'backup',
          taskData: {
            type: 'weekly-full',
            timestamp: new Date().toISOString(),
          },
        });
        console.log('✅ Weekly backup job enqueued');
      } catch (error) {
        console.error('❌ Failed to enqueue weekly backup:', error);
      }
    },
    null,
    true,
    'America/New_York'
  );

  jobs.push(job);
  console.log('📅 Weekly backup scheduled: Sundays at 3 AM');
  return job;
}

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log('🕐 Initializing cron scheduler...');

  scheduleTokenCleanup();
  scheduleAnalyticsAggregation();
  scheduleWeeklyBackup();

  console.log(`✅ Scheduler initialized with ${jobs.length} jobs`);
}

/**
 * Stop all scheduled jobs
 */
export function stopAllJobs() {
  console.log('🛑 Stopping all scheduled jobs...');
  jobs.forEach(job => job.stop());
  console.log('✅ All scheduled jobs stopped');
}

export default {
  initializeScheduler,
  stopAllJobs,
  scheduleTokenCleanup,
  scheduleAnalyticsAggregation,
  scheduleWeeklyBackup,
};
