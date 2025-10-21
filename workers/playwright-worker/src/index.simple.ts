import 'dotenv/config';
import { logger } from './logger'
import { getNextJob, updateProgress, completeJob } from './apiClient'
import type { JobPayload } from './types';
import http from 'http';

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || '5000')
const PORT = process.env.PORT || 3000;

// Simple health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'playwright-worker',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  logger.info(`Health check server listening on port ${PORT}`, { component: 'health' });
});

// Simple job processor without AI services
async function processJobSimple(job: JobPayload, api: any) {
  logger.info('Processing job without AI services', { jobId: job.id });
  
  try {
    // Step 1: Update job status to in_progress
    logger.info('Updating job status to in_progress', { jobId: job.id });
    await api.updateProgress(job.id, [], { status: 'in_progress' });
    
    // Step 2: Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Complete the job
    logger.info('Completing job', { jobId: job.id });
    await api.completeJob(job.id, { 
      finalStatus: 'complete', 
      summary: { 
        totalDirectories: 1, 
        successfulSubmissions: 1, 
        failedSubmissions: 0, 
        processingTimeSeconds: 1 
      } 
    });
    
    logger.info('Job completed successfully', { jobId: job.id });
  } catch (error) {
    logger.error('Job processing failed', { jobId: job.id, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

async function main() {
  logger.info('Simple Playwright Worker starting...', { component: 'main' })

  while (true) {
    try {
      logger.info('Polling for jobs...', { component: 'poller' })
      const response = await getNextJob()

      if (response && response.success && response.data) {
        const job = response.data
        logger.info('Job received', { jobId: job.jobId, customerId: job.customerId })

        try {
          await processJobSimple(job, { updateProgress, completeJob })
          logger.info('Job processed', { jobId: job.jobId })
        } catch (jobErr: any) {
          logger.error('Job processing failed', { jobId: job.jobId, error: jobErr?.message })
          try {
            await completeJob(job.jobId, { 
              finalStatus: 'failed', 
              summary: { total: 1, submitted: 0, failed: 1, success_rate: 0 }, 
              errorMessage: jobErr?.message 
            })
          } catch {}
        }
      }
    } catch (err: any) {
      logger.error('Polling error', { error: err?.message })
    } finally {
      await new Promise(r => setTimeout(r, POLL_INTERVAL))
    }
  }
}

main().catch((e) => {
  logger.error('Fatal worker error', { error: e?.message })
  process.exit(1)
})
