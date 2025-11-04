/**
 * Gemini Client Utility for PDF Processing
 * Provides simple interface for processing PDFs with Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import { geminiRateLimiter } from '../services/geminiRateLimiter.js';

/**
 * Gemini client configuration
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
 * Initialize Gemini AI client
 */
export const initGemini = (apiKey?: string): GoogleGenerativeAI => {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('GEMINI_API_KEY not found. Get one at https://ai.google.dev/');
  }

  return new GoogleGenerativeAI(key);
};

/**
 * Process a PDF file with Gemini
 * @param pdfPath - Path to the PDF file
 * @param prompt - Question or instruction for Gemini
 * @param config - Optional Gemini configuration
 * @returns Processing result
 */
export const processPDF = async (
  pdfPath: string,
  prompt: string,
  config?: GeminiConfig
): Promise<PDFProcessingResult> => {
  const startTime = Date.now();

  try {
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return {
        success: false,
        error: `PDF file not found: ${pdfPath}`,
        metadata: {
          model: config?.model || 'gemini-2.5-flash',
          responseTime: Date.now() - startTime
        }
      };
    }

    // Check rate limit
    if (!geminiRateLimiter.canMakeCall()) {
      const stats = geminiRateLimiter.getUsageStats();
      return {
        success: false,
        error: `Rate limit exceeded: ${stats.callsToday}/${stats.dailyLimit} calls used today`,
        metadata: {
          model: config?.model || 'gemini-2.5-flash',
          responseTime: Date.now() - startTime
        }
      };
    }

    // Initialize Gemini
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({
      model: config?.model || 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: config?.maxOutputTokens || 2048,
        temperature: config?.temperature || 0.7,
        topP: config?.topP || 0.8,
      }
    });

    // Read and encode PDF
    const pdfData = fs.readFileSync(pdfPath);
    const base64Pdf = pdfData.toString('base64');

    // Generate content
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Pdf
        }
      },
      prompt
    ]);

    const response = result.response;
    const content = response.text();

    // Increment rate limiter
    geminiRateLimiter.incrementCallCount();

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      content,
      metadata: {
        model: config?.model || 'gemini-2.5-flash',
        tokensUsed: response.usageMetadata?.totalTokenCount,
        responseTime
      }
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        model: config?.model || 'gemini-2.5-flash',
        responseTime
      }
    };
  }
};

/**
 * Process multiple prompts on the same PDF
 * @param pdfPath - Path to the PDF file
 * @param prompts - Array of prompts to process
 * @param config - Optional Gemini configuration
 * @returns Array of processing results
 */
export const processPDFBatch = async (
  pdfPath: string,
  prompts: string[],
  config?: GeminiConfig
): Promise<PDFProcessingResult[]> => {
  const results: PDFProcessingResult[] = [];

  for (const prompt of prompts) {
    const result = await processPDF(pdfPath, prompt, config);
    results.push(result);

    // If any request fails with rate limit, stop
    if (!result.success && result.error?.includes('Rate limit')) {
      break;
    }
  }

  return results;
};
