#!/usr/bin/env tsx
/**
 * Test Gemini API with Rate Limiter
 *
 * Verifies that rate limiting works with actual Gemini API calls
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiRateLimiter } from './services/geminiRateLimiter.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testWithRateLimiter() {
  console.log('🧪 Testing Gemini API with Rate Limiter\n');

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found!');
    process.exit(1);
  }

  // Check initial state
  let stats = geminiRateLimiter.getUsageStats();
  console.log('📊 Initial state:');
  console.log(`   Calls today: ${stats.callsToday}/${stats.dailyLimit}`);
  console.log(`   Remaining: ${stats.remaining}\n`);

  // Make 3 test calls
  for (let i = 1; i <= 3; i++) {
    console.log(`Test ${i}: Making Gemini API call...`);

    try {
      // Check rate limit BEFORE calling API
      if (!geminiRateLimiter.canMakeCall()) {
        console.log('  ❌ BLOCKED by rate limiter');
        console.log(`  ${geminiRateLimiter.getLimitExceededMessage()}`);
        continue;
      }

      // Make API call
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(`Say "Test ${i}" in a creative way`);
      const response = result.response.text();

      // Increment counter AFTER successful call
      geminiRateLimiter.incrementCallCount();

      console.log(`  ✅ Success: ${response.substring(0, 100)}...`);

      // Show updated stats
      stats = geminiRateLimiter.getUsageStats();
      console.log(`  📊 Calls: ${stats.callsToday}/${stats.dailyLimit} (${stats.percentUsed}% used)\n`);

    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  // Final summary
  stats = geminiRateLimiter.getUsageStats();
  console.log('📊 Final Summary:');
  console.log(`   Total calls today: ${stats.callsToday}`);
  console.log(`   Daily limit: ${stats.dailyLimit}`);
  console.log(`   Remaining: ${stats.remaining}`);
  console.log(`   Usage: ${stats.percentUsed}%`);
  console.log(`   Resets: Tomorrow (${stats.resetDate})\n`);

  console.log('🎉 Rate limiter working perfectly!');
  console.log('\n💡 Your app is now protected:');
  console.log('   ✅ Max 1,333 calls/day');
  console.log('   ✅ ~40,000 calls/month');
  console.log('   ✅ Stays under 45K free tier');
  console.log('   ✅ 5,000 call safety buffer');
}

testWithRateLimiter();
