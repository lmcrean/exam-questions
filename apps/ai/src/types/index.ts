/**
 * Type definitions for AI services
 */

/**
 * Gemini API configuration
 */
export interface GeminiConfig {
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
}

/**
 * PDF processing result
 */
export interface PDFProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    responseTime: number;
  };
}

/**
 * Rate limiter usage statistics
 */
export interface RateLimitStats {
  callsToday: number;
  dailyLimit: number;
  remaining: number;
  percentUsed: number;
  resetDate: string;
}

/**
 * Test result for PDF processing
 */
export interface TestResult {
  success: boolean;
  testName: string;
  response?: string;
  error?: string;
}
