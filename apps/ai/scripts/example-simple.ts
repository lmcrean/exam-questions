/**
 * Simple Example: Process a PDF with Gemini
 *
 * Usage: tsx scripts/example-simple.ts path/to/file.pdf
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { processPDF } from '../src/utils/geminiClient.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

async function main() {
  // Get PDF path from command line or use default
  const pdfPath = process.argv[2] || join(
    __dirname,
    '../../../.notes/Student1 - Database Worksheet 1b Gotcha!.pdf'
  );

  console.log('Processing PDF:', pdfPath);
  console.log('='.repeat(60));

  // Process the PDF with a simple question
  const result = await processPDF(
    pdfPath,
    'What is this document about? Provide a brief summary.'
  );

  console.log('\nResult:');
  console.log('='.repeat(60));

  if (result.success) {
    console.log(result.content);
    console.log('\nMetadata:');
    console.log(`- Model: ${result.metadata?.model}`);
    console.log(`- Tokens: ${result.metadata?.tokensUsed || 'N/A'}`);
    console.log(`- Time: ${result.metadata?.responseTime}ms`);
  } else {
    console.error('Error:', result.error);
  }
}

main().catch(console.error);
