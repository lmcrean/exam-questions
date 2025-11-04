#!/usr/bin/env tsx

/**
 * Test script for Vertex AI integration
 */

import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testVertexAI() {
  console.log('🧪 Testing Vertex AI integration...\n');

  try {
    // Initialize Vertex AI
    const projectId = process.env.GCP_PROJECT_ID || 'product-one-477118';
    const location = process.env.GCP_LOCATION || 'us-central1';

    console.log(`📍 Project: ${projectId}`);
    console.log(`📍 Location: ${location}`);
    console.log(`📍 Auth: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Using default credentials'}\n`);

    const vertexAI = new VertexAI({
      project: projectId,
      location: location
    });

    // Try different model versions
    const modelNames = [
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.0-pro',
      'gemini-pro'
    ];

    let model;
    let workingModel;

    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}...`);
        model = vertexAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        });

        // Try a quick test
        const testResult = await model.generateContent('Say hi');
        workingModel = modelName;
        console.log(`✅ SUCCESS! ${modelName} works!\n`);
        break;
      } catch (error: any) {
        console.log(`❌ ${modelName} failed: ${error.message?.substring(0, 80)}...`);
      }
    }

    if (!workingModel) {
      throw new Error('No working model found. Please check Vertex AI Studio console.');
    }

    // Test 1: Simple generation
    console.log('Test 1: Simple generation');
    console.log('Prompt: "Say hello in 10 words or less"');

    const result = await model.generateContent('Say hello in 10 words or less');
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    console.log(`Response: ${text}`);
    console.log(`Tokens used: ${response.usageMetadata?.totalTokenCount || 0}`);
    console.log(`✅ Test 1 passed!\n`);

    // Test 2: Chat history
    console.log('Test 2: Chat with history');

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'What is 2+2?' }]
        },
        {
          role: 'model',
          parts: [{ text: '2+2 equals 4.' }]
        }
      ]
    });

    const chatResult = await chat.sendMessage('What was my previous question?');
    const chatText = chatResult.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

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
    const assessmentText = assessmentResult.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    console.log(`Response (first 200 chars): ${assessmentText.substring(0, 200)}...`);
    console.log(`✅ Test 3 passed!\n`);

    console.log('🎉 All tests passed! Vertex AI is configured correctly.\n');
    console.log('💡 Next steps:');
    console.log('   1. Start your API server: npm run dev');
    console.log('   2. Test the chat endpoint with a conversation');
    console.log('   3. Monitor Cloud Console for usage and costs');

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      console.error('\nError details:');
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }

    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify GOOGLE_APPLICATION_CREDENTIALS is set correctly');
    console.error('   2. Check that the service account has aiplatform.user role');
    console.error('   3. Ensure Vertex AI API is enabled in GCP');
    console.error('   4. Verify the service account key file exists');

    process.exit(1);
  }
}

// Run the test
testVertexAI();
