/**
 * Job Status Endpoint
 *
 * Allows clients to check the status of background jobs
 */

import { Request, Response } from 'express';
import { getJobStatus } from '../../services/job-status.js';
import { QueueName } from '../../services/queues.js';
import logger from '../../services/logger.js';

/**
 * GET /api/jobs/:queueName/:jobId
 * Get the status of a specific job
 */
export const getJobStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { queueName, jobId } = req.params;

    // Validate queue name
    if (!Object.values(QueueName).includes(queueName as QueueName)) {
      res.status(400).json({ error: 'Invalid queue name' });
      return;
    }

    const status = await getJobStatus(queueName as QueueName, jobId);

    if (!status) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(status);
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
};
