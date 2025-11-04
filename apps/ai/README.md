# AI Services Module

Centralized AI functionality for document processing and interpretation using Google Gemini.

## Overview

This module provides a clean, reusable interface for processing PDFs and other documents with Google's Gemini AI. It includes:

- **PDF Processing**: Extract and analyze content from PDF documents
- **Rate Limiting**: Built-in rate limiter to stay within free tier limits
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Simplified API**: Easy-to-use utilities for common AI tasks

## Features

### 🤖 PDF Processing
- Process PDFs with natural language queries
- Batch processing for multiple prompts
- Automatic error handling and fallbacks

### 🚦 Rate Limiting
- Automatic tracking of daily API usage
- Configurable daily limits (default: 1,333 calls/day)
- Prevents exceeding free tier quotas

### 📦 Clean Architecture
- Separated from API logic for better maintainability
- Can be imported by any app in the monorepo
- Well-organized, scalable structure

## Directory Structure

```
apps/ai/
├── src/
│   ├── services/
│   │   └── geminiRateLimiter.ts    # Rate limiting service
│   ├── utils/
│   │   └── geminiClient.ts         # PDF processing utilities
│   ├── types/
│   │   └── index.ts                # Type definitions
│   └── index.ts                    # Main exports
├── scripts/
│   └── test-gemini-pdf.ts          # Test script for PDF processing
├── tests/                          # Unit tests (TODO)
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

From the `apps/ai` directory:

```bash
npm install
```

## Configuration

The module uses environment variables from the root `.env` file:

```env
# Required
GEMINI_API_KEY=your_api_key_here

# Optional (defaults shown)
GEMINI_DAILY_LIMIT=1333  # Daily API call limit
```

Get your free API key at: https://ai.google.dev/

## Usage

### Basic PDF Processing

```typescript
import { processPDF } from '@exam-questions/ai';

const result = await processPDF(
  './path/to/document.pdf',
  'What is this document about?'
);

if (result.success) {
  console.log(result.content);
  console.log(`Used ${result.metadata?.tokensUsed} tokens`);
} else {
  console.error(result.error);
}
```

### Batch Processing

```typescript
import { processPDFBatch } from '@exam-questions/ai';

const prompts = [
  'Summarize this document',
  'Extract the main topics',
  'List any questions or exercises'
];

const results = await processPDFBatch('./document.pdf', prompts);

results.forEach((result, i) => {
  console.log(`Prompt ${i + 1}:`, result.content);
});
```

### Check Rate Limit Status

```typescript
import { geminiRateLimiter } from '@exam-questions/ai';

const stats = geminiRateLimiter.getUsageStats();
console.log(`Used: ${stats.callsToday}/${stats.dailyLimit}`);
console.log(`Remaining: ${stats.remaining}`);
console.log(`Resets: ${stats.resetDate}`);
```

### Custom Configuration

```typescript
import { processPDF, type GeminiConfig } from '@exam-questions/ai';

const config: GeminiConfig = {
  model: 'gemini-2.5-flash',
  maxOutputTokens: 4096,
  temperature: 0.9,
  topP: 0.95
};

const result = await processPDF(
  './document.pdf',
  'Analyze this in detail',
  config
);
```

## Scripts

### Test PDF Processing

```bash
# Test with default PDF
npm run test:pdf

# Test with specific PDF
npm run test:pdf path/to/your.pdf
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## API Reference

### `processPDF(pdfPath, prompt, config?)`

Process a single PDF with a prompt.

**Parameters:**
- `pdfPath` (string): Path to the PDF file
- `prompt` (string): Question or instruction for Gemini
- `config` (GeminiConfig, optional): Custom configuration

**Returns:** `Promise<PDFProcessingResult>`

### `processPDFBatch(pdfPath, prompts, config?)`

Process multiple prompts on the same PDF.

**Parameters:**
- `pdfPath` (string): Path to the PDF file
- `prompts` (string[]): Array of prompts to process
- `config` (GeminiConfig, optional): Custom configuration

**Returns:** `Promise<PDFProcessingResult[]>`

### `geminiRateLimiter`

Singleton instance for managing API rate limits.

**Methods:**
- `canMakeCall()`: Check if a call can be made
- `incrementCallCount()`: Increment the call counter
- `getUsageStats()`: Get current usage statistics
- `getLimitExceededMessage()`: Get error message when limit exceeded

## Integration with Other Apps

To use this module in other apps:

```typescript
// In apps/api or apps/web
import { processPDF, geminiRateLimiter } from '../ai/src/index.js';

// Use the utilities
const result = await processPDF('./file.pdf', 'Summarize this');
```

## Rate Limiting

The module includes built-in rate limiting to stay within Gemini's free tier:

- **Free Tier**: 45,000 requests/month
- **Daily Limit**: 1,333 calls/day (40K/30 days with buffer)
- **Automatic Reset**: Resets daily at midnight
- **Warnings**: Alerts at 80% capacity

## Best Practices

1. **Always check rate limits** before batch operations
2. **Handle errors gracefully** with the provided error messages
3. **Use batch processing** when analyzing the same document multiple times
4. **Monitor token usage** via the metadata in results
5. **Configure appropriately** based on your use case (temperature, tokens, etc.)

## Roadmap

- [ ] Add support for other document types (DOCX, TXT, etc.)
- [ ] Implement caching for repeated queries
- [ ] Add streaming support for long responses
- [ ] Create comprehensive test suite
- [ ] Add support for image analysis
- [ ] Implement conversation history management

## Contributing

This module is part of the exam-questions monorepo. When adding features:

1. Keep PDF processing separate from chatbot functionality
2. Maintain backward compatibility
3. Add types for all new functions
4. Update this README with new features
5. Keep rate limiting in mind

## License

ISC
