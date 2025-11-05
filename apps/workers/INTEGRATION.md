# Workers App - API Integration Guide

This guide explains how to integrate the Workers app with the API app to offload long-running tasks to background queues.

## Overview

The Workers app uses **BullMQ** (Redis-based queue) to process background jobs. The API app enqueues jobs, and the Workers app processes them asynchronously.

```
API App                    Redis Queue                Workers App
   │                           │                          │
   │──(1) Add job to queue────▶│                          │
   │                           │                          │
   │◀─(2) Return job ID────────│                          │
   │                           │                          │
   │                           │◀────(3) Pull job─────────│
   │                           │                          │
   │                           │                          │
   │                           │──(4) Process job────────▶│
   │                           │                          │
   │◀──(5) Webhook/callback────────────────────────────────│
```

## Step 1: Install BullMQ in API App

```bash
cd apps/api
npm install bullmq ioredis
```

## Step 2: Create Queue Service in API

Create a new file: `apps/api/services/queues.ts`

```typescript
/**
 * Queue Service for API
 * Allows API to enqueue jobs for background processing
 */

import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

// AI Processing Queue
export const aiProcessingQueue = new Queue('ai-processing', {
  connection: redisConfig,
});

// Document Processing Queue
export const documentProcessingQueue = new Queue('document-processing', {
  connection: redisConfig,
});

// Webhook Delivery Queue
export const webhookDeliveryQueue = new Queue('webhook-delivery', {
  connection: redisConfig,
});

export default {
  aiProcessingQueue,
  documentProcessingQueue,
  webhookDeliveryQueue,
};
```

## Step 3: Update API Endpoints

### Before (Synchronous - Blocks for 5-10 seconds)

```typescript
// apps/api/routes/chat/sendMessage.ts
import { generateAIResponse } from '../../services/ai-service.js';

app.post('/api/chat/send', async (req, res) => {
  const { conversationId, message } = req.body;

  // ❌ This blocks the request for 5-10 seconds
  const aiResponse = await generateAIResponse(message, conversationHistory);

  await saveMessage(conversationId, aiResponse);

  res.json({ response: aiResponse });
});
```

### After (Asynchronous - Returns immediately)

```typescript
// apps/api/routes/chat/sendMessage.ts
import { aiProcessingQueue } from '../../services/queues.js';

app.post('/api/chat/send', async (req, res) => {
  const { conversationId, message, userId } = req.body;

  // Save user message first
  await saveUserMessage(conversationId, message);

  // ✅ Enqueue AI processing job (returns immediately)
  const job = await aiProcessingQueue.add('generate-response', {
    conversationId,
    userId,
    prompt: message,
    context: {
      previousMessages: await getConversationHistory(conversationId),
      assessmentData: await getUserAssessment(userId),
    },
  });

  // Return immediately with job ID
  res.json({
    status: 'processing',
    jobId: job.id,
    message: 'AI response is being generated',
  });
});
```

## Step 4: Implement Job Status Endpoint

Allow clients to check job status:

```typescript
// apps/api/routes/chat/jobStatus.ts
import { aiProcessingQueue } from '../../services/queues.js';

app.get('/api/chat/job/:jobId', async (req, res) => {
  const { jobId } = req.params;

  const job = await aiProcessingQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const state = await job.getState();
  const progress = job.progress;

  if (state === 'completed') {
    const result = job.returnvalue;
    return res.json({
      status: 'completed',
      result,
    });
  }

  if (state === 'failed') {
    return res.json({
      status: 'failed',
      error: job.failedReason,
    });
  }

  res.json({
    status: state, // 'waiting', 'active', 'delayed'
    progress,
  });
});
```

## Step 5: WebSocket or Polling

### Option A: Polling (Simple)

Client polls the job status endpoint:

```typescript
// Frontend code
async function sendMessage(message) {
  // Send message
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ conversationId, message }),
  });

  const { jobId } = await response.json();

  // Poll for completion
  const result = await pollJobStatus(jobId);
  return result;
}

async function pollJobStatus(jobId) {
  while (true) {
    const response = await fetch(`/api/chat/job/${jobId}`);
    const data = await response.json();

    if (data.status === 'completed') {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error(data.error);
    }

    // Wait 1 second before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
```

### Option B: WebSocket (Better UX)

Use WebSocket to push updates:

```typescript
// API app - WebSocket handler
import { Server } from 'socket.io';

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('subscribe-job', async (jobId) => {
    const job = await aiProcessingQueue.getJob(jobId);

    job.on('completed', (result) => {
      socket.emit('job-completed', { jobId, result });
    });

    job.on('failed', (error) => {
      socket.emit('job-failed', { jobId, error });
    });

    job.on('progress', (progress) => {
      socket.emit('job-progress', { jobId, progress });
    });
  });
});
```

### Option C: Webhook Callback (Recommended)

Workers notify API when job completes:

```typescript
// API endpoint to receive completion webhook
app.post('/api/webhooks/job-completed', async (req, res) => {
  const { conversationId, result } = req.body;

  // Save AI response to database
  await saveAIResponse(conversationId, result.response);

  // Notify connected clients via WebSocket
  io.to(conversationId).emit('ai-response', result);

  res.json({ status: 'received' });
});

// When enqueuing job, specify webhook URL
await aiProcessingQueue.add('generate-response', {
  conversationId,
  userId,
  prompt: message,
  webhookUrl: 'https://api.example.com/api/webhooks/job-completed',
});
```

## Step 6: Database Schema Updates

Add a job_logs table to track job processing:

```sql
CREATE TABLE job_logs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  conversation_id VARCHAR(255),
  status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_logs_conversation ON job_logs(conversation_id);
CREATE INDEX idx_job_logs_status ON job_logs(status);
```

## Step 7: Error Handling

Handle job failures gracefully:

```typescript
app.post('/api/chat/send', async (req, res) => {
  try {
    const job = await aiProcessingQueue.add('generate-response', jobData, {
      attempts: 3, // Retry 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
    });

    res.json({ jobId: job.id });
  } catch (error) {
    console.error('Failed to enqueue job:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});
```

## Step 8: Testing

### Test Job Enqueuing

```bash
# Start Redis
docker run -d -p 6379:6379 redis

# Start Workers app
cd apps/workers
npm run dev

# Start API app
cd apps/api
npm run dev

# Test API endpoint
curl -X POST http://localhost:5000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "123", "message": "Hello", "userId": "user-1"}'
```

### Monitor Queue

```bash
# Install Redis CLI
redis-cli

# Check queue length
LLEN bull:ai-processing:wait

# View jobs
LRANGE bull:ai-processing:wait 0 -1
```

## Performance Comparison

### Before (Synchronous)
- Request time: **10+ seconds**
- Concurrent users: Limited by blocking operations
- Timeout errors: Frequent on slow networks

### After (Asynchronous with Workers)
- Request time: **<300ms** (just enqueue)
- Concurrent users: Unlimited (API doesn't block)
- Timeout errors: Eliminated
- Scalability: Workers scale independently

## Best Practices

1. **Always validate jobs before enqueuing**
   ```typescript
   if (!conversationId || !message) {
     return res.status(400).json({ error: 'Invalid request' });
   }
   ```

2. **Set appropriate timeouts**
   ```typescript
   await aiProcessingQueue.add(data, {
     timeout: 30000, // 30 seconds
   });
   ```

3. **Use job IDs for tracking**
   ```typescript
   const job = await queue.add(data);
   await db('jobs').insert({ jobId: job.id, userId, status: 'pending' });
   ```

4. **Implement dead letter queues** for failed jobs
   ```typescript
   worker.on('failed', async (job, error) => {
     await deadLetterQueue.add(job.data);
   });
   ```

5. **Monitor queue metrics**
   - Queue length
   - Processing time
   - Failure rate
   - Worker utilization

## Troubleshooting

### Jobs Not Processing

1. Verify Workers app is running
2. Check Redis connection
3. Verify queue names match between API and Workers
4. Check worker logs for errors

### High Latency

1. Increase worker concurrency
2. Add more worker instances
3. Optimize job processing logic
4. Check Redis performance

## Next Steps

- Implement WebSocket for real-time updates
- Add job prioritization
- Implement job cancellation
- Add monitoring dashboard (BullMQ Board)
- Set up alerts for failed jobs

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Workers App README](./README.md)
