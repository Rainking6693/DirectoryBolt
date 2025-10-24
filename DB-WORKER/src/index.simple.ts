import 'dotenv/config';
import { logger } from './logger'
import { getNextJob, updateProgress, completeJob } from './apiClient'
import type { JobPayload } from './types';
import { WorkerStatusReporter } from './workerStatusReporter';
import http from 'http';

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || '5000')
const PORT = process.env.PORT || 3000;
const statusReporter = new WorkerStatusReporter();

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
  await statusReporter.init('starting')

  while (true) {
    try {
      if (await statusReporter.shouldPause()) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        continue;
      }

      await statusReporter.updateStatus('idle')
      logger.info('Polling for jobs...', { component: 'poller' })
      const response = await getNextJob()

      if (response && response.success && response.data) {
        const job = response.data
        logger.info('Job received', { jobId: job.jobId, customerId: job.customerId })

        try {
          await statusReporter.updateStatus('running')
          await processJobSimple(job, { updateProgress, completeJob })
          logger.info('Job processed', { jobId: job.jobId })
        } catch (jobErr: any) {
          logger.error('Job processing failed', { jobId: job.jobId, error: jobErr?.message })
          await statusReporter.updateStatus('error')
          try {
            // First update to in_progress, then mark as failed
            await updateProgress(job.jobId, [], { status: 'in_progress' })
            await completeJob(job.jobId, { 
              finalStatus: 'failed', 
              summary: { 
                totalDirectories: 1, 
                successfulSubmissions: 0, 
                failedSubmissions: 1, 
                processingTimeSeconds: 0 
              }, 
              errorMessage: jobErr?.message 
            })
          } catch {}
        } finally {
          await statusReporter.updateStatus('idle')
        }
      } else {
        await statusReporter.updateStatus('idle')
      }
    } catch (err: any) {
      logger.error('Polling error', { error: err?.message })
      await statusReporter.updateStatus('error')
    } finally {
      await new Promise(r => setTimeout(r, POLL_INTERVAL))
    }
  }
}

main().catch(async (e) => {
  logger.error('Fatal worker error', { error: e?.message })
  await statusReporter.shutdown('error')
  process.exit(1)
})

const handleShutdown = async () => {
  logger.info('Worker shutting down...', { component: 'shutdown' })
  await statusReporter.shutdown('idle')
  process.exit(0)
}

process.on('SIGINT', handleShutdown)
process.on('SIGTERM', handleShutdown)
