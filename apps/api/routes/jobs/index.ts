/**
 * Jobs Routes
 *
 * Endpoints for checking background job status
 */

import express from 'express';
import { getJobStatusHandler } from './get-job-status.js';

const router = express.Router();

// GET /api/jobs/:queueName/:jobId - Get job status
router.get('/:queueName/:jobId', getJobStatusHandler);

export default router;
