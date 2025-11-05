/**
 * Asynchronous Send Message Flow
 *
 * Uses background workers for AI processing instead of blocking requests
 * This provides <300ms response times instead of 5-10 second blocking calls
 */

import logger from '../../../../services/logger.js';
import { getConversationForUser } from '../../conversation/read-conversation/getConversation.js';
import { createConversation } from '../../conversation/create-new-conversation/database/conversationCreate.js';
import { addUserMessage, type UserMessageResult } from '../1-user-message/add-message/sendUserMessage.js';
import { aiProcessingQueue, areWorkersEnabled } from '../../../../services/queues.js';
import type { Job } from 'bullmq';

/**
 * Async send message flow result
 */
export interface SendMessageFlowAsyncResult {
  success: boolean;
  conversationId: string | number;
  userMessage: UserMessageResult['userMessage'];
  jobId: string;
  status: 'processing';
  timestamp: string;
}

/**
 * Complete send message workflow using background workers
 * @param userId - User ID
 * @param message - Message content
 * @param conversationId - Optional existing conversation ID
 * @param assessmentId - Optional assessment ID for new conversations
 * @returns Result with jobId for status checking
 */
export const sendMessageFlowAsync = async (
  userId: string | number,
  message: string,
  conversationId: string | number | null = null,
  assessmentId: string | number | null = null
): Promise<SendMessageFlowAsyncResult> => {
  try {
    logger.info(`Async send message flow starting for user ${userId}`, { conversationId, assessmentId });

    // Check if workers are enabled
    if (!areWorkersEnabled()) {
      throw new Error('Background workers are not configured. Set REDIS_HOST in environment variables.');
    }

    // Step 1: Handle conversation creation if needed
    let currentConversationId = conversationId;

    if (conversationId) {
      // Verify existing conversation ownership
      const result = await getConversationForUser(conversationId, userId);
      if (!result.success) {
        throw new Error('Conversation not found or access denied');
      }
    } else {
      // Create new conversation
      currentConversationId = await createConversation(userId, assessmentId);
    }

    // Step 2: Add user message to database
    const userResult = await addUserMessage(currentConversationId, userId, message);
    logger.info('✅ User message added to database');

    // Step 3: Get conversation history for context
    const conversationResult = await getConversationForUser(currentConversationId, userId);
    const conversationHistory = conversationResult.success ? conversationResult.messages : [];

    // Convert to format expected by workers
    const previousMessages = conversationHistory
      .filter((msg: any) => msg.id !== userResult.userMessage.id) // Exclude the message we just added
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Step 4: Enqueue AI processing job
    const job: Job = await aiProcessingQueue.add('generate-response', {
      conversationId: currentConversationId,
      userId: userId,
      prompt: message,
      userMessageId: userResult.userMessage.id,
      context: {
        previousMessages,
        assessmentData: null, // TODO: Fetch assessment data if needed
      },
      options: {
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTokens: 1024,
      },
    });

    logger.info(`✅ AI processing job enqueued: ${job.id}`);

    return {
      success: true,
      conversationId: currentConversationId,
      userMessage: userResult.userMessage,
      jobId: job.id!,
      status: 'processing',
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    logger.error('Error in sendMessageFlowAsync:', error);
    throw error;
  }
};
