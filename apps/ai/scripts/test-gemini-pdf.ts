/**
 * Test script to verify Gemini API can read and process PDF files.
 * Reads GEMINI_API_KEY from .env file.
 *
 * Usage:
 *   tsx scripts/test-gemini-pdf.ts [pdf-path]
 */

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

interface TestResult {
  success: boolean;
  testName: string;
  response?: string;
  error?: string;
}

async function testGeminiPdfReading(pdfPath: string): Promise<boolean> {
  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable not set.');
    console.error('Check your .env file in the root directory.');
    return false;
  }

  // Check if PDF exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    return false;
  }

  console.log(`Testing Gemini API with PDF: ${path.basename(pdfPath)}`);
  console.log('='.repeat(60));

  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read the PDF file
    console.log(`\nReading file: ${path.basename(pdfPath)}...`);
    const pdfData = fs.readFileSync(pdfPath);
    const base64Pdf = pdfData.toString('base64');

    console.log('✓ File loaded successfully');
    console.log(`  Size: ${(pdfData.length / 1024).toFixed(2)} KB`);

    const results: TestResult[] = [];

    // Test 1: Basic content extraction
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: Extract and summarize content');
    console.log('='.repeat(60));

    try {
      const result1 = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf
          }
        },
        'Please analyze this document and provide:\n1. A brief summary of what this document contains\n2. The main topics covered\n3. Any key information or data you can extract'
      ]);

      const response1 = result1.response.text();
      console.log('\nGemini\'s Response:');
      console.log('-'.repeat(60));
      console.log(response1);

      results.push({
        success: true,
        testName: 'Content Extraction',
        response: response1
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Test 1 failed: ${errorMsg}`);
      results.push({
        success: false,
        testName: 'Content Extraction',
        error: errorMsg
      });
    }

    // Test 2: Specific question
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: Ask a specific question');
    console.log('='.repeat(60));

    try {
      const result2 = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf
          }
        },
        'What is this worksheet about? What subject and topic does it cover?'
      ]);

      const response2 = result2.response.text();
      console.log('\nGemini\'s Response:');
      console.log('-'.repeat(60));
      console.log(response2);

      results.push({
        success: true,
        testName: 'Specific Question',
        response: response2
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Test 2 failed: ${errorMsg}`);
      results.push({
        success: false,
        testName: 'Specific Question',
        error: errorMsg
      });
    }

    // Test 3: Extract questions/exercises
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: Extract specific text');
    console.log('='.repeat(60));

    try {
      const result3 = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf
          }
        },
        'Can you extract and list any questions or exercises from this document?'
      ]);

      const response3 = result3.response.text();
      console.log('\nGemini\'s Response:');
      console.log('-'.repeat(60));
      console.log(response3);

      results.push({
        success: true,
        testName: 'Question Extraction',
        response: response3
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Test 3 failed: ${errorMsg}`);
      results.push({
        success: false,
        testName: 'Question Extraction',
        error: errorMsg
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;

    results.forEach((result, index) => {
      const status = result.success ? '✓ PASSED' : '✗ FAILED';
      console.log(`${index + 1}. ${result.testName}: ${status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${successCount}/${totalTests} tests passed`);
    console.log('='.repeat(60));

    return successCount === totalTests;

  } catch (error) {
    console.error('\nError during testing:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Main execution
async function main() {
  // Default to the converted PDF (from root directory)
  const defaultPath = join(
    __dirname,
    '../../../.notes/Student1 - Database Worksheet 1b Gotcha!.pdf'
  );

  const pdfPath = process.argv[2] || defaultPath;

  const success = await testGeminiPdfReading(pdfPath);
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
