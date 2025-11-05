/**
 * AI Processing Worker
 *
 * Processes AI generation jobs from the queue
 * Handles both initial and follow-up conversation responses
 */

import { Worker, Job } from 'bullmq';
import {
  QueueName,
  AIProcessingJobData,
  AIProcessingJobResult,
} from '../types/queue-types.js';
import { aiProcessingWorkerConfig } from '../config/queue-config.js';
import { generateAIResponse, buildMenstrualHealthSystemPrompt } from '../services/ai-service.js';
import { db } from '../services/database.js';
import { webhookDeliveryQueue } from '../queues/index.js';

/**
 * Process AI generation job
 */
async function processAIJob(job: Job<AIProcessingJobData>): Promise<AIProcessingJobResult> {
  const startTime = Date.now();
  const { conversationId, userId, prompt, context, options, webhookUrl } = job.data;

  console.log(`📝 Processing AI job for conversation ${conversationId}`);

  try {
    // Prepare context for AI generation
    const systemPrompt = buildMenstrualHealthSystemPrompt(context?.assessmentData);

    const previousMessages = context?.previousMessages?.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Generate AI response
    const aiResult = await generateAIResponse(
      prompt,
      {
        previousMessages,
        systemPrompt,
      },
      options
    );

    const processingTime = Date.now() - startTime;

    // Save response to database
    await saveAIResponse(conversationId, aiResult.content, {
      tokensUsed: aiResult.tokensUsed,
      processingTime,
      model: aiResult.model,
    });

    console.log(`✅ AI job completed for conversation ${conversationId} in ${processingTime}ms`);

    const result: AIProcessingJobResult = {
      conversationId,
      response: aiResult.content,
      tokensUsed: aiResult.tokensUsed,
      processingTime,
      timestamp: new Date().toISOString(),
    };

    // Send webhook notification if requested
    if (webhookUrl) {
      await webhookDeliveryQueue.add('ai-completion', {
        url: webhookUrl,
        method: 'POST',
        payload: {
          conversationId,
          status: 'completed',
          result,
        },
      });
    }

    return result;
  } catch (error) {
    console.error(`❌ Error processing AI job for conversation ${conversationId}:`, error);

    // Log error to database
    await logAIError(conversationId, error);

    throw error; // BullMQ will handle retry logic
  }
}

/**
 * Save AI response to database
 */
async function saveAIResponse(
  conversationId: string,
  content: string,
  metadata: {
    tokensUsed?: number;
    processingTime: number;
    model: string;
  }
): Promise<void> {
  try {
    // Insert message into conversations table
    await db('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
      metadata: JSON.stringify({
        tokens_used: metadata.tokensUsed,
        response_time: metadata.processingTime,
        model: metadata.model,
        generated_at: new Date().toISOString(),
        processed_by_worker: true,
      }),
      created_at: new Date().toISOString(),
    });

    console.log(`💾 AI response saved to database for conversation ${conversationId}`);
  } catch (error) {
    console.error('Error saving AI response to database:', error);
    throw error;
  }
}

/**
 * Log AI processing error to database
 */
async function logAIError(conversationId: string, error: any): Promise<void> {
  try {
    await db('job_logs').insert({
      job_type: 'ai-processing',
      conversation_id: conversationId,
      status: 'failed',
      error_message: error?.message || 'Unknown error',
      error_stack: error?.stack,
      created_at: new Date().toISOString(),
    });
  } catch (dbError) {
    console.error('Error logging AI error to database:', dbError);
  }
}

/**
 * Create and start the AI processing worker
 */
export function createAIWorker(): Worker {
  const worker = new Worker<AIProcessingJobData, AIProcessingJobResult>(
    QueueName.AI_PROCESSING,
    processAIJob,
    aiProcessingWorkerConfig
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error);
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  worker.on('active', (job) => {
    console.log(`🔄 Processing job ${job.id}...`);
  });

  console.log('🚀 AI Processing Worker started');

  return worker;
}

// Start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAIWorker();
}

export default createAIWorker;
