/**
 * Async Send Message Controller
 *
 * Returns immediately with job ID instead of blocking for AI response
 * Provides <300ms response times vs 5-10 second blocking calls
 */

import { Response } from 'express';
import logger from '../../../services/logger.js';
import { sendMessageFlowAsync } from '../../../models/chat/message/send-message-flow/sendMessageFlowAsync.js';
import { AuthenticatedRequest } from '../../types.js';
import { areWorkersEnabled } from '../../../services/queues.js';

interface SendMessageBody {
  message: string;
  conversationId?: string | number;
  assessment_id?: string | number;
}

/**
 * Send a message asynchronously using background workers
 * POST /api/chat/send-async
 */
export const sendMessageAsync = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, conversationId, assessment_id } = req.body as SendMessageBody;
    const userId = req.user?.id;

    logger.info(`Processing async message for user: ${userId}`, { conversationId, assessment_id });

    // Validate required parameters
    if (!userId) {
      logger.error('User ID is missing in the request');
      res.status(400).json({ error: 'User identification is required' });
      return;
    }

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Check if workers are enabled
    if (!areWorkersEnabled()) {
      res.status(503).json({
        error: 'Background workers not configured',
        message: 'Use /api/chat/send for synchronous processing',
      });
      return;
    }

    // Delegate to async model layer
    const result = await sendMessageFlowAsync(userId, message, conversationId, assessment_id);

    if (!result.success) {
      res.status(400).json({ error: 'Failed to process message' });
      return;
    }

    // Return immediately with job ID
    res.status(202).json({
      status: 'processing',
      jobId: result.jobId,
      conversationId: result.conversationId,
      userMessage: result.userMessage,
      message: 'AI response is being generated in the background',
      statusUrl: `/api/jobs/ai-processing/${result.jobId}`,
    });

  } catch (error: any) {
    logger.error('Error in sendMessageAsync controller:', error);

    // Handle specific error types
    if (error.message.includes('Conversation not found')) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (error.message.includes('workers are not configured')) {
      res.status(503).json({
        error: 'Background workers not configured',
        message: 'Use /api/chat/send for synchronous processing',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to process message',
      details: error.message,
    });
  }
};
