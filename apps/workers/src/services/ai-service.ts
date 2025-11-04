/**
 * AI Service for Workers
 *
 * Handles AI generation using Google Gemini API
 * This is a worker-specific implementation that can be optimized independently
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIGenerationResult {
  content: string;
  tokensUsed?: number;
  model: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Initialize Gemini AI client
 */
const initGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate AI response for a conversation
 */
export async function generateAIResponse(
  prompt: string,
  context?: {
    previousMessages?: ConversationMessage[];
    systemPrompt?: string;
  },
  options: AIGenerationOptions = {}
): Promise<AIGenerationResult> {
  const {
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const genAI = initGemini();
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      topP: 0.8,
    },
  });

  let result;

  if (context?.previousMessages && context.previousMessages.length > 0) {
    // Multi-turn conversation
    const chatHistory = context.previousMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = geminiModel.startChat({
      history: chatHistory,
    });

    result = await chat.sendMessage(prompt);
  } else {
    // Single-turn generation
    let fullPrompt = prompt;
    if (context?.systemPrompt) {
      fullPrompt = `${context.systemPrompt}\n\n${prompt}`;
    }

    result = await geminiModel.generateContent(fullPrompt);
  }

  const response = result.response;
  const content = response.text();

  return {
    content,
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    model,
  };
}

/**
 * Build system prompt for menstrual health conversations
 */
export function buildMenstrualHealthSystemPrompt(assessmentData?: any): string {
  if (!assessmentData) {
    return `You are a helpful AI conversation partner specializing in health and wellness.
You should be empathetic, insightful, and encourage deeper exploration of health topics.
Always ask follow-up questions to keep the conversation engaging.`;
  }

  const { pattern, cycle_length, period_duration, pain_level, physical_symptoms, emotional_symptoms } = assessmentData;

  return `You are a helpful AI conversation partner specializing in menstrual health and wellness.
You should be empathetic, insightful, and encourage deeper exploration of health topics.
Always ask follow-up questions to keep the conversation engaging.

The user has completed a menstrual health assessment with the following results:
- Pattern: ${pattern || 'not specified'}
- Cycle length: ${cycle_length || 'not specified'} days
- Period duration: ${period_duration || 'not specified'} days
- Pain level: ${pain_level || 'not specified'}/10
- Physical symptoms: ${physical_symptoms?.join(', ') || 'none reported'}
- Emotional symptoms: ${emotional_symptoms?.join(', ') || 'none reported'}

Help them understand their results, provide appropriate guidance, and explore what these patterns mean for their health and wellbeing.`;
}

export default {
  generateAIResponse,
  buildMenstrualHealthSystemPrompt,
};
