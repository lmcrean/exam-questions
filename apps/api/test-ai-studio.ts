#!/usr/bin/env tsx
/**
 * Test Google AI Studio API access
 */

async function testAIStudioAccess() {
  console.log('Testing Google AI Studio API access...\n');

  // The key you provided
  const apiKey = 'AQ.Ab8RN6IkTCB7_JLqlKTMtNRtqrvn-cpfZw9uBS1LvvXrXlJ9oQ';

  try {
    // Try to list models available
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.log(`Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 500));
      throw new Error('Failed to access API');
    }

    const data = await response.json();
    console.log('✅ Success! Available models:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\nThe key format looks unusual. Did you get it from:');
    console.log('1. https://aistudio.google.com/app/apikey (correct)');
    console.log('2. GCP Console API credentials (might be wrong type)');
  }
}

testAIStudioAccess();
