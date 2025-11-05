import type { MessageRecord } from '../../../../../types.js';
import logger from '../../../../../../../services/logger.js';
import { buildAIResponse, buildFallbackResponse } from '../../../../shared/utils/responseBuilders.js';
import { formatMessagesForAI } from '../../../../shared/utils/messageFormatters.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiRateLimiter } from '../../../../../../../services/geminiRateLimiter.js';

/**
 * Assessment data interface
 */
export interface AssessmentData {
  pattern?: string;
  cycle_length?: number;
  period_duration?: number;
  pain_level?: number;
  physical_symptoms?: string[];
  emotional_symptoms?: string[];
  [key: string]: any;
}

/**
 * AI response metadata
 */
export interface AIResponseMetadata {
  model: string;
  assessment_pattern?: string | null;
  assessment_data?: AssessmentData;
  is_initial?: boolean;
  is_follow_up?: boolean;
  system_prompt_used?: boolean;
  context_aware?: boolean;
  conversation_length?: number;
  generated_at: string;
  tokens_used?: number;
  response_time?: number;
  confidence?: number;
  context_used?: number;
  conversation_patterns?: ConversationPatterns;
  enhanced_context?: boolean;
}

/**
 * AI response interface
 */
export interface AIResponse {
  content: string;
  metadata?: Partial<AIResponseMetadata>;
}

/**
 * Conversation patterns analysis
 */
export interface ConversationPatterns {
  summary: string;
  topics: string[];
  sentiment: string;
  messageCount: number;
}

/**
 * Generate AI response for any conversation stage
 * @param messageText - User's message
 * @param conversationHistory - Previous messages in the conversation (empty for initial)
 * @param assessmentData - Full assessment data (for initial conversations)
 * @param assessmentPattern - Assessment pattern for context (for follow-ups)
 * @returns AI response object
 */
export const generateAIResponse = async (
  messageText: string,
  conversationHistory: MessageRecord[] = [],
  assessmentData: AssessmentData | null = null,
  assessmentPattern: string | null = null
): Promise<any> => {
  try {
    const isInitial = conversationHistory.length === 0;
    logger.info(`Generating ${isInitial ? 'initial' : 'follow-up'} AI response`);

    let aiResponse: AIResponse;
    let metadata: AIResponseMetadata;

    if (isInitial) {
      if (!assessmentData || typeof assessmentData !== 'object') {
        throw new Error('Assessment data is required for initial conversations');
      }
      aiResponse = await generateInitialAIResponse(messageText, assessmentData);
      metadata = {
        model: 'gemini-2.5-flash',
        assessment_pattern: assessmentData.pattern,
        assessment_data: assessmentData,
        is_initial: true,
        system_prompt_used: true,
        generated_at: new Date().toISOString()
      };
    } else {
      aiResponse = await generateFollowUpAIResponse(messageText, conversationHistory, assessmentPattern);
      metadata = {
        model: 'gemini-2.5-flash',
        assessment_pattern: assessmentPattern,
        conversation_length: conversationHistory.length,
        is_follow_up: true,
        context_aware: true,
        generated_at: new Date().toISOString(),
        ...aiResponse.metadata
      };
    }

    return buildAIResponse(aiResponse.content, metadata);

  } catch (error) {
    logger.error('Error generating AI response:', error);

    // Generate appropriate fallback
    const isInitial = conversationHistory.length === 0;
    const fallbackContent = isInitial
      ? generateFallbackInitialResponse(messageText, assessmentData)
      : generateFallbackFollowUpResponse(messageText, conversationHistory, assessmentPattern);

    return buildFallbackResponse(fallbackContent);
  }
};

/**
 * Generate initial AI response for new conversations
 * @param messageText - User's initial message
 * @param assessmentData - Full assessment data
 * @returns AI response
 */
const generateInitialAIResponse = async (
  messageText: string,
  assessmentData: AssessmentData
): Promise<AIResponse> => {
  const systemPrompt = buildInitialSystemPrompt(assessmentData);
  const userPrompt = `Initial message: ${messageText}`;

  return await callGeminiAPI(systemPrompt, userPrompt);
};

/**
 * Generate follow-up AI response for ongoing conversations
 * @param messageText - User's follow-up message
 * @param conversationHistory - Previous messages
 * @param assessmentPattern - Assessment pattern
 * @returns AI response
 */
const generateFollowUpAIResponse = async (
  messageText: string,
  conversationHistory: MessageRecord[],
  assessmentPattern: string | null
): Promise<AIResponse> => {
  // Format conversation history for AI
  const formattedHistory = formatMessagesForAI(conversationHistory, {
    includeSystemMessage: true,
    systemMessage: buildFollowUpSystemPrompt(assessmentPattern),
    maxHistory: 20
  });

  // Add current user message
  formattedHistory.push({
    role: 'user',
    content: messageText
  });

  return await callGeminiAPI(formattedHistory, assessmentPattern);
};

/**
 * Build system prompt for initial conversations
 * @param assessmentData - Full assessment data
 * @returns System prompt
 */
const buildInitialSystemPrompt = (assessmentData: AssessmentData): string => {
  const { pattern, cycle_length, period_duration, pain_level, physical_symptoms, emotional_symptoms } = assessmentData;

  return `You are a helpful AI conversation partner specializing in menstrual health and wellness.
You should be empathetic, insightful, and encourage deeper exploration of health topics.
Always ask follow-up questions to keep the conversation engaging.

The user has completed a menstrual health assessment with the following results:
- Pattern: ${pattern}
- Cycle length: ${cycle_length} days
- Period duration: ${period_duration} days
- Pain level: ${pain_level}/10
- Physical symptoms: ${physical_symptoms?.join(', ') || 'none reported'}
- Emotional symptoms: ${emotional_symptoms?.join(', ') || 'none reported'}

Help them understand their results, provide appropriate guidance, and explore what these patterns mean for their health and wellbeing.`;
};

/**
 * Build system prompt for follow-up conversations
 * @param assessmentPattern - Assessment pattern
 * @returns System prompt
 */
const buildFollowUpSystemPrompt = (assessmentPattern: string | null = null): string => {
  let basePrompt = `You are a helpful AI conversation partner continuing an ongoing discussion.
Be contextually aware of the conversation history and build upon previous exchanges.
Provide thoughtful, relevant responses that advance the conversation meaningfully.
Ask insightful follow-up questions to deepen understanding.`;

  if (assessmentPattern) {
    basePrompt += `\n\nThis conversation involves the user's ${assessmentPattern} assessment results.
Continue to help them explore and understand their results in the context of our ongoing discussion.`;
  }

  return basePrompt;
};

/**
 * Initialize Gemini AI client
 */
const initGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables. Get one at https://ai.google.dev/');
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Call Google Gemini API (via Google AI Studio)
 * @param prompt - System prompt or formatted conversation history
 * @param userPrompt - User prompt for initial conversations
 * @returns AI response
 */
const callGeminiAPI = async (
  prompt: string | any[],
  userPrompt: string | null = null
): Promise<AIResponse> => {
  const startTime = Date.now();

  try {
    logger.info('Calling Gemini API');

    // Check rate limit BEFORE making API call
    if (!geminiRateLimiter.canMakeCall()) {
      const stats = geminiRateLimiter.getUsageStats();
      logger.warn(`Gemini daily rate limit exceeded: ${stats.callsToday}/${stats.dailyLimit} calls used`);
      throw new Error(geminiRateLimiter.getLimitExceededMessage());
    }

    // Initialize Gemini
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash', // Best free tier: 45K requests/month
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
      }
    });

    let result;
    let fullPrompt: string;

    if (userPrompt) {
      // Initial conversation - combine system and user prompts
      fullPrompt = `${prompt}\n\nUser: ${userPrompt}`;
      result = await model.generateContent(fullPrompt);
    } else if (Array.isArray(prompt)) {
      // Follow-up conversation - format as chat history
      const chatHistory = prompt.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Start chat with history
      const chat = model.startChat({
        history: chatHistory.slice(0, -1) // All but last message
      });

      // Send last message
      const lastMessage = chatHistory[chatHistory.length - 1];
      result = await chat.sendMessage(lastMessage.parts[0].text);
    } else {
      throw new Error('Invalid prompt format');
    }

    const response = result.response;
    const responseContent = response.text() ||
      'I apologize, but I was unable to generate a response. Please try again.';

    const responseTime = Date.now() - startTime;

    logger.info('Gemini response generated successfully', {
      responseTime,
      tokenCount: response.usageMetadata?.totalTokenCount || 0
    });

    // Increment rate limiter counter AFTER successful API call
    geminiRateLimiter.incrementCallCount();

    return {
      content: responseContent,
      metadata: {
        tokens_used: response.usageMetadata?.totalTokenCount || 0,
        response_time: responseTime,
        confidence: 0.9, // Gemini is reliable
        context_used: Array.isArray(prompt) ? prompt.length : 1
      }
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.warn('Gemini API unavailable, using fallback response:', error);

    // Fallback for when API key is missing or quota exceeded
    let fallbackContent: string;

    if (userPrompt) {
      // Initial conversation fallback
      fallbackContent = "Thank you for starting this conversation! I'm here to help you explore your health journey. Based on your assessment results, I'd love to hear more about what aspects are most important to you right now.";
    } else {
      // Follow-up conversation - analyze context
      const lastUserMessage = Array.isArray(prompt)
        ? prompt.filter(msg => msg.role === 'user').slice(-1)[0]?.content || ''
        : '';

      fallbackContent = "That's a really interesting point. ";

      if (lastUserMessage.toLowerCase().includes('question') || lastUserMessage.includes('?')) {
        fallbackContent += "Let me help address your question. Based on what we've discussed, ";
      } else if (lastUserMessage.toLowerCase().includes('concern') || lastUserMessage.toLowerCase().includes('worried')) {
        fallbackContent += "I understand your concern. It's completely normal to have questions about your health. ";
      } else {
        fallbackContent += "Building on what you've shared, I'm curious to learn more about your experience. ";
      }

      fallbackContent += "What would you like to explore further?";
    }

    return {
      content: fallbackContent,
      metadata: {
        tokens_used: 50,
        response_time: responseTime,
        confidence: 0.7,
        context_used: Array.isArray(prompt) ? prompt.length : 0
      }
    };
  }
};

/**
 * Generate fallback initial response when AI fails
 * @param messageText - User message
 * @param assessmentData - Assessment data
 * @returns Fallback response content
 */
const generateFallbackInitialResponse = (
  messageText: string,
  assessmentData: AssessmentData | null
): string => {
  if (!assessmentData) {
    return "Hello! I'm here to have a conversation with you. How can I help you today?";
  }

  const { pattern, pain_level, cycle_length } = assessmentData;
  return `Hello! I see you've shared your menstrual health assessment results showing a ${pattern} pattern. With a ${pain_level}/10 pain level and ${cycle_length}-day cycles, there's definitely valuable information we can explore together. What aspects of your results would you like to discuss first?`;
};

/**
 * Generate fallback follow-up response when AI fails
 * @param messageText - User message
 * @param conversationHistory - Conversation history
 * @param assessmentPattern - Assessment pattern
 * @returns Fallback response content
 */
const generateFallbackFollowUpResponse = (
  messageText: string,
  conversationHistory: MessageRecord[],
  assessmentPattern: string | null
): string => {
  const messageCount = conversationHistory.length;

  if (assessmentPattern) {
    return `I appreciate you continuing our discussion about your ${assessmentPattern} assessment. Based on what you've shared, I'd like to explore this further with you. What aspects would you like to dive deeper into?`;
  }

  if (messageCount < 5) {
    return "Thank you for sharing that with me. I'm interested to learn more about your perspective on this. Can you tell me more about what you're thinking?";
  } else {
    return "Our conversation has been really insightful so far. Building on what we've discussed, I'm curious to hear more about your thoughts on this topic.";
  }
};

/**
 * Generate contextual AI response with enhanced analysis
 * @param messageText - Current user message
 * @param conversationHistory - Previous messages
 * @param assessmentData - Assessment data for initial conversations
 * @param assessmentPattern - Assessment pattern for follow-ups
 * @returns Enhanced AI response
 */
export const generateContextualAIResponse = async (
  messageText: string,
  conversationHistory: MessageRecord[],
  assessmentData: AssessmentData | null = null,
  assessmentPattern: string | null = null
): Promise<any> => {
  try {
    const isInitial = conversationHistory.length === 0;

    if (isInitial) {
      return await generateAIResponse(messageText, conversationHistory, assessmentData);
    }

    // Analyze conversation for patterns and context
    const patterns = analyzeConversationPatterns(conversationHistory);

    const enhancedSystemPrompt = buildFollowUpSystemPrompt(assessmentPattern) +
      `\n\nConversation context: ${patterns.summary}`;

    const formattedHistory = formatMessagesForAI(conversationHistory, {
      includeSystemMessage: true,
      systemMessage: enhancedSystemPrompt,
      maxHistory: 15
    });

    formattedHistory.push({
      role: 'user',
      content: messageText
    });

    const aiResponse = await callGeminiAPI(formattedHistory);

    const metadata: AIResponseMetadata = {
      model: 'gemini-2.5-flash',
      conversation_patterns: patterns,
      enhanced_context: true,
      assessment_pattern: assessmentPattern,
      conversation_length: conversationHistory.length,
      is_follow_up: true,
      generated_at: new Date().toISOString(),
      ...aiResponse.metadata
    };

    return buildAIResponse(aiResponse.content, metadata);

  } catch (error) {
    logger.error('Error generating contextual AI response:', error);
    throw error;
  }
};

/**
 * Analyze conversation for patterns and context
 * @param conversationHistory - Previous messages
 * @returns Analysis results
 */
const analyzeConversationPatterns = (conversationHistory: MessageRecord[]): ConversationPatterns => {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const topics = extractTopics(userMessages);
  const sentiment = analyzeSentiment(userMessages);

  return {
    summary: `${userMessages.length} user messages, topics: ${topics.join(', ')}, sentiment: ${sentiment}`,
    topics,
    sentiment,
    messageCount: userMessages.length
  };
};

/**
 * Extract topics from user messages
 * @param userMessages - User messages
 * @returns Detected topics
 */
const extractTopics = (userMessages: MessageRecord[]): string[] => {
  const topicKeywords: Record<string, string[]> = {
    'career': ['career', 'job', 'work', 'profession'],
    'assessment': ['assessment', 'test', 'result', 'score'],
    'personal': ['personal', 'myself', 'identity', 'who am i'],
    'skills': ['skill', 'ability', 'talent', 'strength']
  };

  const allText = userMessages.map(msg => msg.content).join(' ').toLowerCase();
  const detectedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      detectedTopics.push(topic);
    }
  }

  return detectedTopics.length > 0 ? detectedTopics : ['general'];
};

/**
 * Analyze overall sentiment of user messages
 * @param userMessages - User messages
 * @returns Overall sentiment
 */
const analyzeSentiment = (userMessages: MessageRecord[]): string => {
  const positive = ['good', 'great', 'love', 'like', 'awesome', 'helpful'];
  const negative = ['bad', 'confused', 'frustrated', 'difficult', 'unclear'];

  const allText = userMessages.map(msg => msg.content).join(' ').toLowerCase();
  const hasPositive = positive.some(word => allText.includes(word));
  const hasNegative = negative.some(word => allText.includes(word));

  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  return 'neutral';
};
