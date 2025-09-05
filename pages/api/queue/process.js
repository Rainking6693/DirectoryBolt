// DirectoryBolt Queue Processing API - Process Queue Endpoint
// POST /api/queue/process - Batch processing trigger for automation systems
// Handles queue priority management, browser automation integration, and error handling

const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Rate limiting for process triggers (more restrictive for system operations)
const processLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 process triggers per minute
  message: {
    error: 'Too many process requests, please try again later.',
    code: 'PROCESS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Validation schema for process requests
const processRequestSchema = Joi.object({
  batch_id: Joi.string().uuid(),
  submission_ids: Joi.array().items(Joi.string().uuid()).max(100),
  processing_options: Joi.object({
    priority_override: Joi.number().integer().min(1).max(5),
    force_restart: Joi.boolean().default(false),
    concurrent_limit: Joi.number().integer().min(1).max(50).default(5),
    automation_mode: Joi.string().valid('browser', 'api', 'hybrid').default('browser'),
    retry_failed: Joi.boolean().default(false),
    processing_speed: Joi.string().valid('slow', 'normal', 'fast').default('normal')
  }).default({}),
  automation_config: Joi.object({
    browser_settings: Joi.object({
      headless: Joi.boolean().default(true),
      user_agent: Joi.string(),
      viewport: Joi.object({
        width: Joi.number().integer().min(800).max(1920).default(1366),
        height: Joi.number().integer().min(600).max(1080).default(768)
      }),
      delay_between_actions: Joi.number().integer().min(1000).max(10000).default(3000),
      screenshot_on_error: Joi.boolean().default(true)
    }),
    api_settings: Joi.object({
      timeout: Joi.number().integer().min(5000).max(120000).default(30000),
      max_redirects: Joi.number().integer().min(0).max(10).default(5),
      verify_ssl: Joi.boolean().default(true)
    }),
    error_handling: Joi.object({
      max_retries: Joi.number().integer().min(0).max(10).default(3),
      retry_delay: Joi.number().integer().min(300).max(3600).default(900),
      escalate_failures: Joi.boolean().default(true),
      notify_on_failure: Joi.boolean().default(true)
    })
  }).default({}),
  system_context: Joi.object({
    triggered_by: Joi.string().valid('admin', 'scheduler', 'api', 'webhook').required(),
    system_id: Joi.string(),
    priority_reason: Joi.string(),
    maintenance_window: Joi.boolean().default(false)
  }).required()
}).or('batch_id', 'submission_ids');

// Processing speed configurations
const PROCESSING_SPEEDS = {
  slow: {
    delay_multiplier: 2.0,
    concurrent_limit: 2,
    timeout_multiplier: 1.5
  },
  normal: {
    delay_multiplier: 1.0,
    concurrent_limit: 5,
    timeout_multiplier: 1.0
  },
  fast: {
    delay_multiplier: 0.5,
    concurrent_limit: 10,
    timeout_multiplier: 0.8
  }
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Apply rate limiting
    await new Promise((resolve, reject) => {
      processLimiter(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    // Validate request body
    const { error, value } = processRequestSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    const { batch_id, submission_ids, processing_options, automation_config, system_context } = value;

    // Authenticate system request
    const authResult = await authenticateSystemRequest(system_context, req.headers);
    if (!authResult.valid) {
      return res.status(401).json({
        success: false,
        error: 'System authentication failed',
        code: 'AUTHENTICATION_FAILED'
      });
    }

    let targetSubmissions;

    if (batch_id) {
      targetSubmissions = await getSubmissionsFromBatch(batch_id);
    } else if (submission_ids) {
      targetSubmissions = await getSubmissionsByIds(submission_ids);
    }

    if (!targetSubmissions || targetSubmissions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No processable submissions found',
        code: 'NO_SUBMISSIONS_FOUND'
      });
    }

    // Filter submissions based on processing options
    const processableSubmissions = await filterProcessableSubmissions(
      targetSubmissions, 
      processing_options
    );

    if (processableSubmissions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No submissions are eligible for processing',
        code: 'NO_ELIGIBLE_SUBMISSIONS'
      });
    }

    // Check system capacity and constraints
    const capacityCheck = await checkSystemCapacity(processableSubmissions.length, processing_options);
    if (!capacityCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'System capacity exceeded',
        capacity_info: capacityCheck.info,
        code: 'CAPACITY_EXCEEDED'
      });
    }

    // Create processing job
    const processingJobId = uuidv4();
    const processingJob = await createProcessingJob({
      job_id: processingJobId,
      batch_id,
      submission_ids: processableSubmissions.map(s => s.id),
      processing_options,
      automation_config,
      system_context,
      total_submissions: processableSubmissions.length,
      estimated_duration: calculateEstimatedDuration(processableSubmissions, processing_options)
    });

    if (!processingJob) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create processing job',
        code: 'JOB_CREATION_FAILED'
      });
    }

    // Update submission statuses to processing
    await updateSubmissionStatuses(
      processableSubmissions.map(s => s.id), 
      'processing', 
      processingJobId
    );

    // Start asynchronous processing
    const processingResult = await initiateProcessing(
      processingJobId,
      processableSubmissions,
      { ...processing_options, ...automation_config }
    );

    if (!processingResult.success) {
      // Rollback submission statuses on failure
      await updateSubmissionStatuses(
        processableSubmissions.map(s => s.id),
        'queued',
        null
      );

      return res.status(500).json({
        success: false,
        error: 'Failed to initiate processing',
        error_details: processingResult.error,
        code: 'PROCESSING_INITIATION_FAILED'
      });
    }

    // Log processing activity
    await logProcessingActivity({
      job_id: processingJobId,
      batch_id,
      action: 'PROCESSING_STARTED',
      triggered_by: system_context.triggered_by,
      details: {
        submission_count: processableSubmissions.length,
        processing_speed: processing_options.processing_speed,
        automation_mode: processing_options.automation_mode,
        estimated_duration: processingJob.estimated_duration
      }
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        processing_job_id: processingJobId,
        batch_id,
        processing_summary: {
          total_submissions: processableSubmissions.length,
          estimated_duration_minutes: Math.ceil(processingJob.estimated_duration / 60),
          processing_speed: processing_options.processing_speed,
          automation_mode: processing_options.automation_mode,
          concurrent_limit: processing_options.concurrent_limit
        },
        submissions: processableSubmissions.map(submission => ({
          id: submission.id,
          directory_name: submission.directories.name,
          priority: submission.priority,
          status: 'processing',
          estimated_completion: calculateSubmissionETA(submission, processing_options)
        })),
        monitoring: {
          status_endpoint: `/api/queue/status?batch_id=${batch_id}`,
          job_status_endpoint: `/api/queue/job/${processingJobId}`,
          webhook_url: processingResult.webhook_url
        },
        system_info: {
          job_id: processingJobId,
          initiated_at: new Date().toISOString(),
          triggered_by: system_context.triggered_by,
          system_capacity: capacityCheck.info
        }
      },
      message: 'Processing initiated successfully'
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Queue process API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Authentication for system requests
async function authenticateSystemRequest(systemContext, headers) {
  // For admin/scheduler requests, validate API key
  if (['admin', 'scheduler'].includes(systemContext.triggered_by)) {
    const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== process.env.SYSTEM_API_KEY) {
      return { valid: false, reason: 'Invalid API key' };
    }
  }

  // For webhook requests, validate webhook signature
  if (systemContext.triggered_by === 'webhook') {
    const signature = headers['x-webhook-signature'];
    const payload = headers['x-webhook-payload'];
    
    if (!validateWebhookSignature(signature, payload)) {
      return { valid: false, reason: 'Invalid webhook signature' };
    }
  }

  return { valid: true };
}

// Get submissions from batch
async function getSubmissionsFromBatch(batchId) {
  const { data: batch, error: batchError } = await supabase
    .from('batch_submissions')
    .select('id, user_id, status')
    .eq('id', batchId)
    .single();

  if (batchError || !batch) {
    return null;
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from('user_submissions')
    .select(`
      id,
      directory_id,
      submission_status,
      priority,
      retry_count,
      max_retries,
      business_name,
      submission_data,
      metadata,
      directories!inner(
        id,
        name,
        website,
        form_fields,
        submission_requirements,
        estimated_processing_time,
        automation_config
      )
    `)
    .eq('batch_id', batchId)
    .order('priority', { ascending: true });

  if (submissionsError) {
    console.error('Failed to fetch submissions:', submissionsError);
    return null;
  }

  return submissions;
}

// Get submissions by IDs
async function getSubmissionsByIds(submissionIds) {
  const { data: submissions, error } = await supabase
    .from('user_submissions')
    .select(`
      id,
      directory_id,
      submission_status,
      priority,
      retry_count,
      max_retries,
      business_name,
      submission_data,
      metadata,
      directories!inner(
        id,
        name,
        website,
        form_fields,
        submission_requirements,
        estimated_processing_time,
        automation_config
      )
    `)
    .in('id', submissionIds)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Failed to fetch submissions by IDs:', error);
    return null;
  }

  return submissions;
}

// Filter submissions that can be processed
async function filterProcessableSubmissions(submissions, options) {
  return submissions.filter(submission => {
    // Skip if already processing/completed
    if (['processing', 'submitted', 'approved', 'rejected'].includes(submission.submission_status)) {
      if (!options.force_restart) {
        return false;
      }
    }

    // Skip failed submissions unless retry is requested
    if (submission.submission_status === 'failed' && !options.retry_failed) {
      return false;
    }

    // Check retry limits
    if (submission.retry_count >= submission.max_retries) {
      return false;
    }

    return true;
  });
}

// Check system processing capacity
async function checkSystemCapacity(submissionCount, options) {
  // Get current system load
  const { count: currentJobs } = await supabase
    .from('processing_jobs')
    .select('*', { count: 'exact', head: true })
    .in('status', ['running', 'queued']);

  const maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS) || 20;
  const maxSubmissionsPerJob = parseInt(process.env.MAX_SUBMISSIONS_PER_JOB) || 100;

  const violations = [];

  if (currentJobs >= maxConcurrentJobs) {
    violations.push({
      limit: 'concurrent_jobs',
      current: currentJobs,
      max: maxConcurrentJobs
    });
  }

  if (submissionCount > maxSubmissionsPerJob) {
    violations.push({
      limit: 'submissions_per_job',
      requested: submissionCount,
      max: maxSubmissionsPerJob
    });
  }

  return {
    allowed: violations.length === 0,
    info: {
      current_jobs: currentJobs,
      max_concurrent_jobs: maxConcurrentJobs,
      submissions_requested: submissionCount,
      max_submissions_per_job: maxSubmissionsPerJob,
      violations
    }
  };
}

// Create processing job record
async function createProcessingJob(jobData) {
  const { data: job, error } = await supabase
    .from('processing_jobs')
    .insert([{
      id: jobData.job_id,
      batch_id: jobData.batch_id,
      submission_ids: jobData.submission_ids,
      status: 'queued',
      total_submissions: jobData.total_submissions,
      processed_submissions: 0,
      successful_submissions: 0,
      failed_submissions: 0,
      configuration: {
        processing_options: jobData.processing_options,
        automation_config: jobData.automation_config,
        system_context: jobData.system_context
      },
      estimated_duration: jobData.estimated_duration,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create processing job:', error);
    return null;
  }

  return job;
}

// Update submission statuses
async function updateSubmissionStatuses(submissionIds, status, processingJobId) {
  const updateData = {
    submission_status: status,
    updated_at: new Date().toISOString()
  };

  if (processingJobId) {
    updateData.metadata = { processing_job_id: processingJobId };
  }

  const { error } = await supabase
    .from('user_submissions')
    .update(updateData)
    .in('id', submissionIds);

  if (error) {
    console.error('Failed to update submission statuses:', error);
    throw error;
  }
}

// Initiate asynchronous processing
async function initiateProcessing(jobId, submissions, config) {
  try {
    // In production, this would trigger background job queue (Redis/Bull)
    // For now, we'll simulate with database updates and webhook calls

    // Update job status to running
    await supabase
      .from('processing_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Simulate processing initiation
    const processingPromises = submissions.map(submission => 
      initiateSubmissionProcessing(submission, config, jobId)
    );

    // Don't wait for all to complete, just verify they started
    const initialResults = await Promise.allSettled(processingPromises.slice(0, 3));
    
    const failedStartups = initialResults.filter(result => result.status === 'rejected');
    
    if (failedStartups.length === initialResults.length) {
      throw new Error('All processing startups failed');
    }

    return {
      success: true,
      webhook_url: `/api/webhooks/processing-updates/${jobId}`,
      started_submissions: initialResults.length - failedStartups.length
    };

  } catch (error) {
    console.error('Failed to initiate processing:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initiate processing for individual submission
async function initiateSubmissionProcessing(submission, config, jobId) {
  try {
    // Simulate browser automation or API call
    if (config.automation_mode === 'browser') {
      return await initiateBrowserAutomation(submission, config, jobId);
    } else if (config.automation_mode === 'api') {
      return await initiateApiSubmission(submission, config, jobId);
    } else {
      // Hybrid mode - try API first, fallback to browser
      try {
        return await initiateApiSubmission(submission, config, jobId);
      } catch (apiError) {
        console.warn('API submission failed, falling back to browser:', apiError);
        return await initiateBrowserAutomation(submission, config, jobId);
      }
    }
  } catch (error) {
    console.error('Failed to initiate submission processing:', error);
    
    // Update submission with error
    await supabase
      .from('user_submissions')
      .update({
        submission_status: 'failed',
        notes: `Processing initiation failed: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission.id);
    
    throw error;
  }
}

// Simulate browser automation
async function initiateBrowserAutomation(submission, config, jobId) {
  // This would integrate with Puppeteer or Playwright
  console.log(`Starting browser automation for submission ${submission.id}`);
  
  // Simulate async browser task
  setTimeout(async () => {
    try {
      // Simulate form filling and submission
      const success = Math.random() > 0.2; // 80% success rate simulation
      
      if (success) {
        await supabase
          .from('user_submissions')
          .update({
            submission_status: 'submitted',
            submitted_at: new Date().toISOString(),
            external_submission_id: `ext_${Date.now()}`,
            response_data: { automation_method: 'browser' }
          })
          .eq('id', submission.id);
      } else {
        throw new Error('Browser automation failed');
      }
    } catch (error) {
      await supabase
        .from('user_submissions')
        .update({
          submission_status: 'failed',
          notes: error.message,
          retry_count: submission.retry_count + 1
        })
        .eq('id', submission.id);
    }
  }, Math.random() * 10000 + 5000); // Random delay 5-15 seconds

  return { method: 'browser', initiated: true };
}

// Simulate API submission
async function initiateApiSubmission(submission, config, jobId) {
  console.log(`Starting API submission for submission ${submission.id}`);
  
  // Simulate async API call
  setTimeout(async () => {
    try {
      const success = Math.random() > 0.15; // 85% success rate simulation
      
      if (success) {
        await supabase
          .from('user_submissions')
          .update({
            submission_status: 'submitted',
            submitted_at: new Date().toISOString(),
            external_submission_id: `api_${Date.now()}`,
            response_data: { automation_method: 'api' }
          })
          .eq('id', submission.id);
      } else {
        throw new Error('API submission failed');
      }
    } catch (error) {
      await supabase
        .from('user_submissions')
        .update({
          submission_status: 'failed',
          notes: error.message,
          retry_count: submission.retry_count + 1
        })
        .eq('id', submission.id);
    }
  }, Math.random() * 5000 + 2000); // Random delay 2-7 seconds

  return { method: 'api', initiated: true };
}

// Calculate estimated duration for processing
function calculateEstimatedDuration(submissions, options) {
  const speedConfig = PROCESSING_SPEEDS[options.processing_speed] || PROCESSING_SPEEDS.normal;
  
  const totalEstimatedTime = submissions.reduce((sum, submission) => {
    const baseTime = submission.directories.estimated_processing_time || 300;
    return sum + (baseTime * speedConfig.delay_multiplier);
  }, 0);

  const concurrentProcessing = Math.min(submissions.length, options.concurrent_limit || speedConfig.concurrent_limit);
  
  return Math.ceil(totalEstimatedTime / concurrentProcessing);
}

// Calculate ETA for individual submission
function calculateSubmissionETA(submission, options) {
  const speedConfig = PROCESSING_SPEEDS[options.processing_speed] || PROCESSING_SPEEDS.normal;
  const estimatedTime = (submission.directories.estimated_processing_time || 300) * speedConfig.delay_multiplier;
  
  const eta = new Date();
  eta.setSeconds(eta.getSeconds() + estimatedTime);
  
  return eta.toISOString();
}

// Log processing activity
async function logProcessingActivity(activity) {
  try {
    await supabase
      .from('queue_activity_log')
      .insert([{
        ...activity,
        timestamp: new Date().toISOString()
      }]);
  } catch (error) {
    console.warn('Failed to log processing activity:', error);
  }
}

// Validate webhook signature (placeholder)
function validateWebhookSignature(signature, payload) {
  // Implement webhook signature validation
  return true;
}