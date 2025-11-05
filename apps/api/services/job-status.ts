/**
 * Job Status Service
 *
 * Tracks and retrieves status of background jobs
 */

import { Job } from 'bullmq';
import { getJob, QueueName } from './queues.js';
import logger from './logger.js';

export interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';
  progress?: number;
  result?: any;
  error?: string;
  createdAt?: number;
  processedAt?: number;
  finishedAt?: number;
  attemptsMade?: number;
  failedReason?: string;
}

/**
 * Get job status by job ID and queue name
 */
export async function getJobStatus(queueName: QueueName, jobId: string): Promise<JobStatus | null> {
  try {
    const job = await getJob(queueName, jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress as number | undefined;

    const status: JobStatus = {
      id: job.id!,
      status: state as any,
      progress,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      attemptsMade: job.attemptsMade,
    };

    if (state === 'completed') {
      status.result = job.returnvalue;
    }

    if (state === 'failed') {
      status.error = job.failedReason;
      status.failedReason = job.failedReason;
    }

    return status;
  } catch (error) {
    logger.error('Error getting job status:', error);
    return null;
  }
}

/**
 * Wait for job completion (with timeout)
 */
export async function waitForJobCompletion(
  queueName: QueueName,
  jobId: string,
  timeoutMs: number = 30000
): Promise<JobStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getJobStatus(queueName, jobId);

    if (!status) {
      throw new Error('Job not found');
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('Job timeout - exceeded maximum wait time');
}

export default {
  getJobStatus,
  waitForJobCompletion,
};
