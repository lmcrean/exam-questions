/**
 * Queue Type Definitions
 *
 * Defines all queue names and their corresponding job data types
 */

// Queue Names
export enum QueueName {
  AI_PROCESSING = 'ai-processing',
  DOCUMENT_PROCESSING = 'document-processing',
  WEBHOOK_DELIVERY = 'webhook-delivery',
  EMAIL_DELIVERY = 'email-delivery',
  SCHEDULED_TASKS = 'scheduled-tasks',
  TOKEN_CLEANUP = 'token-cleanup',
}

// AI Processing Job Data
export interface AIProcessingJobData {
  conversationId: string;
  userId: string;
  prompt: string;
  context?: {
    previousMessages?: Array<{ role: string; content: string }>;
    assessmentData?: any;
  };
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  webhookUrl?: string; // Optional webhook to notify on completion
}

// AI Processing Job Result
export interface AIProcessingJobResult {
  conversationId: string;
  response: string;
  tokensUsed?: number;
  processingTime: number;
  timestamp: string;
}

// Document Processing Job Data
export interface DocumentProcessingJobData {
  documentId: string;
  userId: string;
  sourceFormat: 'docx' | 'txt' | 'md';
  targetFormat: 'pdf' | 'html';
  sourceUrl?: string;
  sourcePath?: string;
  options?: {
    formatting?: any;
    watermark?: string;
  };
}

// Document Processing Job Result
export interface DocumentProcessingJobResult {
  documentId: string;
  outputUrl: string;
  outputPath: string;
  fileSize: number;
  processingTime: number;
  timestamp: string;
}

// Webhook Delivery Job Data
export interface WebhookDeliveryJobData {
  webhookId?: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: any;
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries?: number;
    backoff?: 'exponential' | 'fixed';
  };
}

// Webhook Delivery Job Result
export interface WebhookDeliveryJobResult {
  webhookId?: string;
  statusCode: number;
  success: boolean;
  attempts: number;
  responseBody?: any;
  timestamp: string;
}

// Email Delivery Job Data
export interface EmailDeliveryJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

// Email Delivery Job Result
export interface EmailDeliveryJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

// Scheduled Task Job Data
export interface ScheduledTaskJobData {
  taskType: 'cleanup' | 'report' | 'backup' | 'notification';
  taskData: any;
  scheduledFor?: string;
}

// Token Cleanup Job Data
export interface TokenCleanupJobData {
  olderThanHours: number;
  batchSize?: number;
}

// Token Cleanup Job Result
export interface TokenCleanupJobResult {
  deletedCount: number;
  processingTime: number;
  timestamp: string;
}

// Union type for all job data types
export type JobData =
  | AIProcessingJobData
  | DocumentProcessingJobData
  | WebhookDeliveryJobData
  | EmailDeliveryJobData
  | ScheduledTaskJobData
  | TokenCleanupJobData;

// Union type for all job result types
export type JobResult =
  | AIProcessingJobResult
  | DocumentProcessingJobResult
  | WebhookDeliveryJobResult
  | EmailDeliveryJobResult
  | TokenCleanupJobResult;
