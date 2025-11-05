/**
 * Queue Metrics Endpoint
 *
 * Provides monitoring and metrics for background job queues
 */

import express, { Request, Response } from 'express';
import { queues, QueueName, areWorkersEnabled } from '../../services/queues.js';
import logger from '../../services/logger.js';

const router = express.Router();

/**
 * GET /api/admin/queue-metrics
 * Get metrics for all queues
 */
router.get('/queue-metrics', async (req: Request, res: Response) => {
  try {
    if (!areWorkersEnabled()) {
      res.json({
        enabled: false,
        message: 'Workers are not configured',
      });
      return;
    }

    const metrics: any = {};

    for (const [name, queue] of Object.entries(queues)) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);

        metrics[name] = {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + completed + failed + delayed,
        };
      } catch (error) {
        logger.error(`Error getting metrics for queue ${name}:`, error);
        metrics[name] = { error: 'Failed to get metrics' };
      }
    }

    res.json({
      enabled: true,
      timestamp: new Date().toISOString(),
      queues: metrics,
    });
  } catch (error) {
    logger.error('Error getting queue metrics:', error);
    res.status(500).json({ error: 'Failed to get queue metrics' });
  }
});

/**
 * GET /api/admin/queue-metrics/:queueName
 * Get detailed metrics for a specific queue
 */
router.get('/queue-metrics/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    if (!Object.values(QueueName).includes(queueName as QueueName)) {
      res.status(400).json({ error: 'Invalid queue name' });
      return;
    }

    if (!areWorkersEnabled()) {
      res.json({
        enabled: false,
        message: 'Workers are not configured',
      });
      return;
    }

    const queue = queues[queueName as QueueName];

    const [waiting, active, completed, failed, delayed, waitingJobs, activeJobs, failedJobs] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getWaiting(0, 10), // Get first 10 waiting jobs
      queue.getActive(0, 10),   // Get first 10 active jobs
      queue.getFailed(0, 10),   // Get first 10 failed jobs
    ]);

    res.json({
      enabled: true,
      queueName,
      timestamp: new Date().toISOString(),
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      },
      recentJobs: {
        waiting: waitingJobs.map(j => ({ id: j.id, name: j.name, timestamp: j.timestamp })),
        active: activeJobs.map(j => ({ id: j.id, name: j.name, timestamp: j.timestamp, processedOn: j.processedOn })),
        failed: failedJobs.map(j => ({ id: j.id, name: j.name, failedReason: j.failedReason, finishedOn: j.finishedOn })),
      },
    });
  } catch (error) {
    logger.error('Error getting queue metrics:', error);
    res.status(500).json({ error: 'Failed to get queue metrics' });
  }
});

export default router;
