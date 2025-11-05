import express from 'express';
import authRoutes from './auth/index.js';
import assessmentRoutes from './assessment/index.js';
import userRoutes from './user/index.js';
import setupRoutes from './setup/index.js';
import chatRoutes from './chat/index.js';
import adminGeminiUsage from './admin/gemini-usage.js';
import adminQueueMetrics from './admin/queue-metrics.js';
import jobRoutes from './jobs/index.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/user', userRoutes);
router.use('/setup', setupRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminGeminiUsage);
router.use('/admin', adminQueueMetrics); // Queue metrics and monitoring
router.use('/jobs', jobRoutes); // Job status endpoints

export default router;
