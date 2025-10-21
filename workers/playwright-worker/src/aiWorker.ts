// AI-Enhanced Playwright Worker - Full Implementation
// Complete worker with all AI services and Playwright automation

import 'dotenv/config';
import { logger } from './logger';
import { getNextJob, updateProgress, completeJob } from './apiClient';
import { AIJobProcessor } from './aiJobProcessor';
import type { JobPayload } from './types';
import http from 'http';
import { createClient } from '@supabase/supabase-js';

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || '5000');
const PORT = process.env.PORT || 3000;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Supabase client for queue management
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'ai-enhanced-playwright-worker',
      timestamp: new Date().toISOString(),
      aiServices: 'enabled'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  logger.info(`🤖 AI-Enhanced Worker health check server listening on port ${PORT}`, { component: 'health' });
});

// AI-Enhanced Job Processor
let aiProcessor: AIJobProcessor | null = null;
let jobsProcessedCount = 0;

// Check if queue is paused
async function isQueuePaused(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'queue_paused')
      .maybeSingle();
    
    return data?.value === true;
  } catch (error) {
    logger.warn('Failed to check queue pause status, assuming not paused', { 
      error: error instanceof Error ? error.message : String(error),
      component: 'queue-check'
    });
    return false; // Fail open - continue processing
  }
}

// Send worker heartbeat
async function sendWorkerHeartbeat(): Promise<void> {
  try {
    await supabase
      .from('worker_heartbeats')
      .upsert({
        worker_id: process.env.WORKER_ID || 'ai-enhanced-worker-1',
        status: 'online',
        last_seen: new Date().toISOString(),
        ai_services_enabled: true,
        jobs_processed: jobsProcessedCount,
        metadata: {
          poll_interval: POLL_INTERVAL,
          port: PORT,
          version: '2.0.0-ai-enhanced'
        }
      });
    
    logger.debug('💓 Worker heartbeat sent', { 
      jobsProcessed: jobsProcessedCount,
      component: 'heartbeat'
    });
  } catch (error) {
    logger.warn('Failed to send worker heartbeat', { 
      error: error instanceof Error ? error.message : String(error),
      component: 'heartbeat'
    });
  }
}

async function initializeAIProcessor(): Promise<void> {
  try {
    logger.info('🚀 Initializing AI-Enhanced Job Processor...', { component: 'main' });
    
    aiProcessor = new AIJobProcessor({
      enableAIPrioritization: true,
      enableTimingOptimization: true,
      enableDynamicCustomization: true,
      batchSize: 10,
      maxRetryAttempts: 3,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      twoCaptchaApiKey: process.env.TWO_CAPTCHA_API_KEY
    });
    
    await aiProcessor.initialize();
    
    logger.info('✅ AI-Enhanced Job Processor initialized successfully', { component: 'main' });
  } catch (error) {
    logger.error('❌ Failed to initialize AI-Enhanced Job Processor', { 
      component: 'main', 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

async function processJobWithAI(job: JobPayload): Promise<void> {
  if (!aiProcessor) {
    throw new Error('AI Processor not initialized');
  }

  const startTime = Date.now();
  logger.info('🎯 Starting AI-enhanced job processing', { 
    jobId: job.id, 
    customerId: job.customer_id,
    businessName: job.business_name,
    component: 'ai-processor'
  });

  try {
    // Step 1: Update job status to in_progress
    logger.info('📝 Updating job status to in_progress', { jobId: job.id });
    await updateProgress(job.id, [], { status: 'in_progress' });
    
    // Step 2: Process job with full AI enhancement
    logger.info('🤖 Processing job with AI services', { jobId: job.id });
    const results = await aiProcessor.processJob(job);
    
    // Step 3: Calculate final statistics
    const successfulSubmissions = results.filter(r => r.status === 'submitted').length;
    const failedSubmissions = results.filter(r => r.status === 'failed').length;
    const totalDirectories = results.length;
    const processingTime = Date.now() - startTime;
    const successRate = totalDirectories > 0 ? (successfulSubmissions / totalDirectories) : 0;
    
    // Step 4: Complete the job with AI-enhanced results
    logger.info('✅ Completing job with AI-enhanced results', { 
      jobId: job.id,
      successfulSubmissions,
      failedSubmissions,
      successRate: Math.round(successRate * 100) + '%'
    });
    
    await completeJob(job.id, {
      finalStatus: 'complete',
      summary: {
        totalDirectories,
        successfulSubmissions,
        failedSubmissions,
        processingTimeSeconds: Math.round(processingTime / 1000)
      }
    });
    
    logger.info('🎉 AI-enhanced job processing completed successfully', { 
      jobId: job.id,
      processingTime: Math.round(processingTime / 1000) + 's',
      successRate: Math.round(successRate * 100) + '%',
      component: 'ai-processor'
    });
    
  } catch (error) {
    logger.error('❌ AI-enhanced job processing failed', { 
      jobId: job.id, 
      error: error instanceof Error ? error.message : String(error),
      component: 'ai-processor'
    });
    
    // Mark job as failed with error details
    try {
      await completeJob(job.id, {
        finalStatus: 'failed',
        summary: {
          totalDirectories: 0,
          successfulSubmissions: 0,
          failedSubmissions: 0,
          processingTimeSeconds: Math.round((Date.now() - startTime) / 1000)
        },
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    } catch (completeError) {
      logger.error('❌ Failed to mark job as failed', { 
        jobId: job.id, 
        error: completeError instanceof Error ? completeError.message : String(completeError),
        component: 'ai-processor'
      });
    }
    
    throw error;
  }
}

async function main(): Promise<void> {
  logger.info('🚀 AI-Enhanced Playwright Worker starting...', { component: 'main' });

  try {
    // Initialize AI services
    await initializeAIProcessor();
    
    // Start heartbeat interval
    setInterval(sendWorkerHeartbeat, HEARTBEAT_INTERVAL);
    await sendWorkerHeartbeat(); // Send initial heartbeat
    
    logger.info('🔄 Starting job polling loop...', { component: 'main' });
    
    // Main polling loop
    while (true) {
      try {
        // Check if queue is paused
        if (await isQueuePaused()) {
          logger.info('⏸️ Queue is paused, waiting...', { component: 'poller' });
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          continue;
        }
        
        logger.info('🔍 Polling for jobs...', { component: 'poller' });
        
        const response = await getNextJob();
        
        if (response && response.success && response.data) {
          const job: JobPayload = response.data;
          logger.info('📋 Job received', { 
            jobId: job.id, 
            customerId: job.customer_id,
            businessName: job.business_name,
            component: 'poller'
          });

          try {
            await processJobWithAI(job);
            jobsProcessedCount++; // Increment job counter
            logger.info('✅ Job processed successfully', { jobId: job.id, totalProcessed: jobsProcessedCount });
          } catch (jobError) {
            logger.error('❌ Job processing failed', { 
              jobId: job.id, 
              error: jobError instanceof Error ? jobError.message : String(jobError),
              component: 'job-processor'
            });
          }
        } else {
          logger.info('⏳ No jobs available, waiting...', { component: 'poller' });
        }
        
      } catch (pollingError) {
        logger.error('❌ Polling error', { 
          error: pollingError instanceof Error ? pollingError.message : String(pollingError),
          component: 'poller'
        });
      } finally {
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    }
    
  } catch (error) {
    logger.error('💥 Fatal AI-Enhanced Worker error', { 
      error: error instanceof Error ? error.message : String(error),
      component: 'main'
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 AI-Enhanced Worker shutting down...', { component: 'shutdown' });
  
  if (aiProcessor) {
    await aiProcessor.cleanup();
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 AI-Enhanced Worker shutting down...', { component: 'shutdown' });
  
  if (aiProcessor) {
    await aiProcessor.cleanup();
  }
  
  process.exit(0);
});

// Start the AI-Enhanced Worker
main().catch((error) => {
  logger.error('💥 Fatal error starting AI-Enhanced Worker', { 
    error: error instanceof Error ? error.message : String(error),
    component: 'main'
  });
  process.exit(1);
});
