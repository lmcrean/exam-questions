/**
 * AI Services Module
 * Exports utilities for PDF processing with Google Gemini
 */

// Export utilities
export { initGemini, processPDF, processPDFBatch } from './utils/geminiClient.js';

// Export services
export { geminiRateLimiter } from './services/geminiRateLimiter.js';

// Export types
export type {
  GeminiConfig,
  PDFProcessingResult,
  RateLimitStats,
  TestResult
} from './types/index.js';
