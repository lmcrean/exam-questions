# Workers App - Background Job Processing

A dedicated background job processing application for the ed-tech platform. Handles asynchronous tasks to improve API responsiveness and enable independent scaling.

## 🎯 Purpose

Moves long-running operations away from synchronous HTTP requests to background workers:

- **AI Generation** (5-10 seconds) → Background queue
- **Document Conversion** (5-30 seconds) → Background queue
- **Webhook Delivery** (15+ seconds) → Background queue
- **Scheduled Tasks** (token cleanup, reports) → Cron-based queue

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   API App   │────────▶│    Redis    │────────▶│   Workers   │
│             │  Enqueue│   (Queues)  │  Process│     App     │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  Database   │
                                                 │  Services   │
                                                 └─────────────┘
```

### Technology Stack

- **BullMQ**: Redis-based queue system with advanced features
- **Redis**: Message broker and queue storage
- **TypeScript**: Type-safe job processing
- **Knex**: Database access (shared with API)
- **Google Gemini API**: AI generation

## 📋 Queue Types

### 1. AI Processing Queue (Phase 2 - Implemented)
**Priority: HIGH**

Handles AI response generation for conversations.

**Job Data:**
```typescript
{
  conversationId: string;
  userId: string;
  prompt: string;
  context?: {
    previousMessages?: Array<{ role: string; content: string }>;
    assessmentData?: any;
  };
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  webhookUrl?: string;
}
```

**Configuration:**
- Concurrency: 3 workers
- Rate Limit: 60 jobs/minute
- Timeout: 30 seconds
- Retries: 2 attempts

### 2. Document Processing Queue (Phase 3 - Placeholder)
**Priority: MEDIUM**

Converts documents between formats (DOCX → PDF, etc.)

### 3. Webhook Delivery Queue (Phase 4 - Implemented)
**Priority: HIGH**

Delivers webhooks with retry logic.

**Configuration:**
- Concurrency: 10 workers
- Retries: 5 attempts (exponential backoff)
- Timeout: 15 seconds

### 4. Email Delivery Queue (Phase 4 - Placeholder)
**Priority: MEDIUM**

Sends emails asynchronously.

### 5. Scheduled Tasks Queue (Phase 5 - Partial)
**Priority: LOW**

Runs cron-based jobs like token cleanup.

**Implemented Tasks:**
- ✅ Token cleanup
- 🚧 Report generation (placeholder)
- 🚧 Database backups (placeholder)
- 🚧 Notification batching (placeholder)

## 🚀 Getting Started

### Prerequisites

1. **Redis Server**

   Development (using Docker):
   ```bash
   docker run -d -p 6379:6379 redis
   ```

   Production: Use Redis Cloud (free tier) or Upstash (~$15/month)

2. **Node.js** 18+ and npm

3. **Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Installation

```bash
cd apps/workers
npm install
```

### Running Workers

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

**Run individual workers:**
```bash
npm run worker:ai          # AI processing only
npm run worker:document    # Document processing only
npm run worker:webhook     # Webhook delivery only
npm run worker:scheduler   # Scheduled tasks only
```

## 🔧 Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Database
NEON_DATABASE_URL=postgresql://user:pass@host/db

# AI Service
GEMINI_API_KEY=your-api-key
GEMINI_DAILY_LIMIT=1333

# Worker Settings (Optional)
AI_WORKER_CONCURRENCY=3
DOCUMENT_WORKER_CONCURRENCY=2
WEBHOOK_WORKER_CONCURRENCY=10
```

### Queue Configuration

Queue settings are configured in `src/config/queue-config.ts`:

- **Job retries**: Automatic retry with exponential backoff
- **Job timeout**: Per-queue timeout settings
- **Concurrency**: Worker-specific concurrency limits
- **Rate limiting**: Global rate limits per queue

## 📊 Monitoring

### Queue Dashboard

BullMQ provides a web dashboard for monitoring queues:

```bash
# Install BullMQ dashboard
npm install -g bull-board

# Run dashboard (development)
npx bull-board
```

Access at: http://localhost:3000

### Logs

Workers log job processing events:
- ✅ Job completed
- ❌ Job failed
- 🔄 Job processing
- ⏰ Scheduled task executed

## 🔄 Integration with API

### From API App

To enqueue a job from the API app, you'll need to:

1. **Install BullMQ in API app:**
   ```bash
   cd apps/api
   npm install bullmq ioredis
   ```

2. **Create queue client in API:**
   ```typescript
   // apps/api/services/queues.ts
   import { Queue } from 'bullmq';

   const aiQueue = new Queue('ai-processing', {
     connection: {
       host: process.env.REDIS_HOST,
       port: parseInt(process.env.REDIS_PORT),
     }
   });

   // Enqueue AI job
   await aiQueue.add('generate-response', {
     conversationId: '123',
     userId: 'user-456',
     prompt: 'User message',
     context: { assessmentData: {...} }
   });
   ```

3. **Update API endpoints to use queues:**
   ```typescript
   // Before: Synchronous (blocks for 5-10s)
   const aiResponse = await generateAIResponse(prompt);
   res.json({ response: aiResponse });

   // After: Asynchronous (returns immediately)
   await aiQueue.add('generate', { conversationId, prompt });
   res.json({ status: 'processing', jobId: job.id });
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📈 Performance & Scaling

### Expected Improvements

- **API response time**: 10+ seconds → <300ms
- **Timeout errors**: Eliminated
- **Scalability**: Independent worker scaling
- **Job failure rate**: <1%

### Scaling Workers

**Horizontal Scaling:**
```bash
# Run multiple worker instances
PM2_INSTANCES=3 npm start
```

**Vertical Scaling:**
Adjust concurrency in `.env`:
```bash
AI_WORKER_CONCURRENCY=5  # Increase for more parallel processing
```

### Rate Limiting

Gemini API limits are enforced:
- Free tier: 45,000 requests/month
- Daily limit: ~1,333 requests/day
- Workers respect rate limits automatically

## 🗂️ Project Structure

```
apps/workers/
├── src/
│   ├── config/
│   │   ├── redis.ts              # Redis connection
│   │   └── queue-config.ts       # Queue configurations
│   ├── queues/
│   │   └── index.ts              # Queue instances
│   ├── workers/
│   │   ├── ai-worker.ts          # AI processing worker
│   │   ├── document-worker.ts    # Document processing worker
│   │   ├── webhook-worker.ts     # Webhook delivery worker
│   │   └── scheduler-worker.ts   # Scheduled tasks worker
│   ├── services/
│   │   ├── ai-service.ts         # AI generation service
│   │   └── database.ts           # Database connection
│   ├── types/
│   │   └── queue-types.ts        # TypeScript type definitions
│   └── index.ts                  # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🚦 Implementation Phases

- ✅ **Phase 1**: Infrastructure setup
- ✅ **Phase 2**: AI processing queue (Priority)
- 🚧 **Phase 3**: Document processing queue
- ✅ **Phase 4**: Webhook and email queues (webhook implemented)
- 🚧 **Phase 5**: Cron-based scheduled tasks (partial)
- 🚧 **Phase 6**: Monitoring dashboard and optimization

## 📝 Development Guidelines

### Adding a New Queue

1. Define job data type in `src/types/queue-types.ts`
2. Create queue instance in `src/queues/index.ts`
3. Create worker in `src/workers/[name]-worker.ts`
4. Add worker to `src/index.ts`
5. Update documentation

### Error Handling

Workers automatically retry failed jobs with exponential backoff. Critical errors are logged to the database.

## 🤝 Contributing

See main repository [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

See main repository [LICENSE](../../LICENSE)

## 🆘 Troubleshooting

### Redis Connection Errors

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis logs
docker logs [container-id]
```

### Worker Not Processing Jobs

1. Verify Redis connection in logs
2. Check queue has jobs: `redis-cli LLEN bull:ai-processing:wait`
3. Verify environment variables are loaded
4. Check worker logs for errors

### High Memory Usage

- Reduce worker concurrency
- Implement job result cleanup
- Monitor Redis memory usage

## 📞 Support

For issues specific to workers, check:
- BullMQ documentation: https://docs.bullmq.io/
- Redis documentation: https://redis.io/docs/

For project issues, see GitHub Issues.
