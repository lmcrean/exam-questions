/**
 * Async Send Message Route
 * POST /api/chat/send-async
 */

import express from 'express';
import { authenticateToken } from '../../../middleware/auth.js';
import { sendMessageAsync } from './controller-async.js';

const router = express.Router();

router.post('/', authenticateToken, sendMessageAsync);

export default router;
