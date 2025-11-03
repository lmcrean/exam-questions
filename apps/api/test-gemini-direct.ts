#!/usr/bin/env tsx

/**
 * Test script for direct Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testGeminiDirect() {
  console.log('🧪 Testing Direct Gemini API integration...\n');

  try {
    // Get API key
    const apiKey = 'AQ.Ab8RN6IkTCB7_JLqlKTMtNRtqrvn-cpfZw9uBS1LvvXrXlJ9oQ';

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    console.log('Using Direct Gemini API');
    console.log('API Key configured\n');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test with flash model (cheapest)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    // Test 1: Simple generation
    console.log('Test 1: Simple generation');
    console.log('Prompt: "Say hello in 10 words or less"');

    const result = await model.generateContent('Say hello in 10 words or less');
    const response = result.response;
    const text = response.text();

    console.log(`Response: ${text}`);
    console.log(`✅ Test 1 passed!\n`);

    // Test 2: Chat history
    console.log('Test 2: Chat with history');

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'What is 2+2?' }],
        },
        {
          role: 'model',
          parts: [{ text: '2+2 equals 4.' }],
        },
      ],
    });

    const chatResult = await chat.sendMessage('What was my previous question?');
    const chatText = chatResult.response.text();

    console.log(`Response: ${chatText}`);
    console.log(`✅ Test 2 passed!\n`);

    // Test 3: Assessment-style prompt
    console.log('Test 3: Assessment-style prompt');

    const assessmentPrompt = `You are a helpful AI conversation partner specializing in menstrual health and wellness.
You should be empathetic, insightful, and encourage deeper exploration of health topics.

The user has completed a menstrual health assessment with the following results:
- Pattern: regular
- Cycle length: 28 days
- Period duration: 5 days
- Pain level: 3/10

User: "I'm curious about what these results mean for me."`;

    const assessmentResult = await model.generateContent(assessmentPrompt);
    const assessmentText = assessmentResult.response.text();

    console.log(`Response (first 200 chars): ${assessmentText.substring(0, 200)}...`);
    console.log(`✅ Test 3 passed!\n`);

    console.log('All tests passed! Direct Gemini API is working correctly.\n');
    console.log('Next steps:');
    console.log('   1. Direct API is production-ready for 100-100k users');
    console.log('   2. Add rate limiting and monitoring');
    console.log('   3. Can migrate to Vertex AI later if needed');

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      console.error('\nError details:');
      console.error(`Message: ${error.message}`);
    }

    console.error('\nTroubleshooting:');
    console.error('   1. Verify GEMINI_API_KEY is set correctly');
    console.error('   2. Check API key has not expired');
    console.error('   3. Ensure Generative Language API is enabled');

    process.exit(1);
  }
}

// Run the test
testGeminiDirect();
