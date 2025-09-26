import { supabase, handleSupabaseError, handleSuccess, getCorsHeaders } from './_supabaseClient.js';

// /api/jobs-retry - Requeue failed jobs or manually retry specific jobs
// Staff dashboard endpoint for handling job failures

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders()
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // TODO: Add staff authentication validation here
    // const staffToken = event.headers['x-staff-token'];
    // const isValidStaff = await validateStaffAccess(staffToken);
    // if (!isValidStaff) return unauthorized response

    const requestBody = JSON.parse(event.body || '{}');
    const {
      queueId,        // Specific job ID to retry
      retryAll,       // Boolean: retry all failed jobs
      maxRetries = 3, // Maximum retry attempts
      resetProgress = true // Reset progress to 0
    } = requestBody;

    console.log('Processing retry request:', { queueId, retryAll, maxRetries });

    let updatedJobs = [];

    if (queueId) {
      // Retry specific job
      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', queueId)
        .single();

      if (fetchError) {
        return handleSupabaseError(fetchError, 'fetch-job-for-retry');
      }

      if (!job) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
          body: JSON.stringify({
            success: false,
            error: 'Job not found'
          })
        };
      }

      // Check retry limits from metadata
      const currentRetries = job.metadata?.retry_count || 0;
      if (currentRetries >= maxRetries) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
          body: JSON.stringify({
            success: false,
            error: `Job has exceeded maximum retry attempts (${maxRetries})`
          })
        };
      }

      // Prepare retry data for new schema
      const updatedMetadata = {
        ...job.metadata,
        retry_count: currentRetries + 1,
        processed_by: null,
        error_message: null
      };

      if (resetProgress) {
        updatedMetadata.progress_percentage = 0;
        updatedMetadata.directories_completed = 0;
        updatedMetadata.current_directory = null;
      }

      const retryData = {
        status: 'pending',
        updated_at: new Date().toISOString(),
        started_at: null,
        error_message: null,
        metadata: updatedMetadata
      };

      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update(retryData)
        .eq('id', queueId)
        .select('id, customer_id, metadata, status')
        .single();

      if (updateError) {
        return handleSupabaseError(updateError, 'retry-job');
      }

      updatedJobs = [updatedJob];

    } else if (retryAll) {
      // Retry all failed jobs that haven't exceeded retry limit
      const { data: failedJobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id, metadata, customer_id')
        .eq('status', 'failed')
        .order('priority_level', { ascending: true });

      if (fetchError) {
        return handleSupabaseError(fetchError, 'fetch-failed-jobs');
      }

      if (!failedJobs || failedJobs.length === 0) {
        return handleSuccess([], 'No failed jobs available for retry');
      }

      // Filter jobs that haven't exceeded retry limit
      const eligibleJobs = failedJobs.filter(job => {
        const retryCount = job.metadata?.retry_count || 0;
        return retryCount < maxRetries;
      });

      if (eligibleJobs.length === 0) {
        return handleSuccess([], 'No failed jobs available for retry (all have exceeded retry limit)');
      }

      // Bulk retry eligible failed jobs
      const updates = eligibleJobs.map(job => ({
        id: job.id,
        status: 'pending',
        updated_at: new Date().toISOString(),
        started_at: null,
        error_message: null,
        metadata: {
          ...job.metadata,
          retry_count: (job.metadata?.retry_count || 0) + 1,
          processed_by: null,
          error_message: null
        }
      }));

      // Update each job individually due to metadata changes
      const updatePromises = updates.map(update => 
        supabase
          .from('jobs')
          .update({
            status: update.status,
            updated_at: update.updated_at,
            started_at: update.started_at,
            error_message: update.error_message,
            metadata: update.metadata
          })
          .eq('id', update.id)
      );

      const updateResults = await Promise.all(updatePromises);
      const updateError = updateResults.find(result => result.error)?.error;
      
      if (updateError) {
        return handleSupabaseError(updateError, 'bulk-retry-jobs');
      }

      if (updateError) {
        return handleSupabaseError(updateError, 'bulk-retry-jobs');
      }

      // Fetch updated jobs for response
      const jobIds = eligibleJobs.map(job => job.id);
      const { data: updatedJobsData, error: fetchUpdatedError } = await supabase
        .from('jobs')
        .select('id, customer_id, metadata, status')
        .in('id', jobIds);

      if (fetchUpdatedError) {
        return handleSupabaseError(fetchUpdatedError, 'fetch-updated-jobs');
      }

      updatedJobs = updatedJobsData;

    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
        body: JSON.stringify({
          success: false,
          error: 'Must specify either queueId for specific retry or retryAll=true for bulk retry'
        })
      };
    }

    // Log retry operations in job_results table
    const retryLogEntries = updatedJobs.map(job => ({
      job_id: job.id,
      directory_name: 'RETRY_LOG',
      status: 'pending',
      response_log: {
        customer_id: job.customer_id,
        retry_count: job.metadata?.retry_count || 1,
        retried_at: new Date().toISOString(),
        retry_reason: 'manual_staff_retry'
      }
    }));

    if (retryLogEntries.length > 0) {
      const { error: logError } = await supabase
        .from('job_results')
        .insert(retryLogEntries);

      if (logError) {
        console.error('Failed to create retry log entries:', logError);
        // Don't fail the request, just log the error
      }
    }

    const responseMessage = queueId 
      ? `Job ${queueId} queued for retry (attempt ${updatedJobs[0]?.metadata?.retry_count || 'unknown'})`
      : `${updatedJobs.length} failed jobs queued for retry`;

    console.log(responseMessage);

    return handleSuccess({
      retriedJobs: updatedJobs.length,
      jobs: updatedJobs.map(job => ({
        jobId: job.id,
        queueId: job.id, // Legacy compatibility
        customerId: job.customer_id,
        retryCount: job.metadata?.retry_count || 1,
        status: job.status
      }))
    }, responseMessage);

  } catch (error) {
    console.error('Unexpected error in jobs-retry:', error);
    return handleSupabaseError(error, 'jobs-retry-handler');
  }
}

// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY