import { supabase, handleSupabaseError, handleSuccess, validateWorkerAuth, getCorsHeaders } from './_supabaseClient.js';

// /api/jobs-complete - AutoBolt worker endpoint to mark job as completed with results
// Migrated from background-batch.js completion logic

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
  
  // Validate worker authentication
  const authResult = validateWorkerAuth(event);
  if (!authResult.isValid) {
    return {
      ...authResult,
      headers: { ...authResult.headers, ...getCorsHeaders() }
    };
  }
  
  const workerId = authResult.workerId;

  try {
    const requestBody = JSON.parse(event.body || '{}');

    const {
      jobId,
      queueId, // Support legacy field name for compatibility
      results,
      directoriesCompleted,
      directoriesTotal,
      successfulSubmissions,
      failedSubmissions,
      processingTimeMs,
      completionSummary
    } = requestBody;
    
    const actualJobId = jobId || queueId; // Use jobId if available, fallback to queueId

    // Validate required fields
    if (!actualJobId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing required field: jobId (or queueId)'
        })
      };
    }

    console.log(`Worker ${workerId} completing job ${actualJobId}`);

    // Prepare completion data for new schema
    const completionData = {
      status: 'complete',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Prepare metadata for results
    const metadataUpdates = {
      processed_by: workerId,
      progress_percentage: 100
    };

    // Add results data if provided
    if (directoriesCompleted !== undefined) metadataUpdates.directories_completed = directoriesCompleted;
    if (directoriesTotal !== undefined) metadataUpdates.directories_total = directoriesTotal;
    if (successfulSubmissions !== undefined) metadataUpdates.successful_submissions = successfulSubmissions;
    if (failedSubmissions !== undefined) metadataUpdates.failed_submissions = failedSubmissions;
    if (processingTimeMs !== undefined) metadataUpdates.processing_time_ms = processingTimeMs;
    if (completionSummary) metadataUpdates.completion_summary = completionSummary;

    // Store detailed results if provided
    if (results) {
      metadataUpdates.processing_results = typeof results === 'string' ? results : JSON.stringify(results);
    }
    
    completionData.metadata = metadataUpdates;

    // Begin transaction: Update job record and create completion log
    const { data: jobData, error: updateError } = await supabase
      .from('jobs')
      .update(completionData)
      .eq('id', actualJobId)
      .select(`
        id, 
        customer_id, 
        package_size,
        metadata,
        customers!inner(business_name, email)
      `)
      .single();

    if (updateError) {
      return handleSupabaseError(updateError, 'complete-job');
    }

    if (!jobData) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Job not found'
        })
      };
    }

    // Create completion log entry for tracking (if table exists)
    const logEntry = {
      job_id: actualJobId,
      customer_id: jobData.customer_id,
      package_size: jobData.package_size,
      worker_id: workerId,
      completion_status: 'success',
      directories_processed: jobData.metadata?.directories_completed || 0,
      successful_submissions: jobData.metadata?.successful_submissions || 0,
      failed_submissions: jobData.metadata?.failed_submissions || 0,
      processing_duration_ms: jobData.metadata?.processing_time_ms,
      completed_at: new Date().toISOString()
    };

    // Try to insert into job_results table for tracking
    try {
      const { error: logError } = await supabase
        .from('job_results')
        .insert({
          job_id: actualJobId,
          directory_name: 'COMPLETION_LOG',
          status: 'submitted',
          response_log: logEntry
        });
      
      if (logError) {
        console.error('Failed to create completion log:', logError);
      }
    } catch (err) {
      console.error('Failed to create completion log:', err);
    }

    if (logError) {
      console.error('Failed to create completion log:', logError);
      // Don't fail the request, just log the error
    }

    // TODO: Consider triggering customer notification email here
    // await notifyCustomerCompletion(queueData.customer_id, queueData.customers.email);

    console.log(`Job ${actualJobId} completed successfully by worker ${workerId} for customer ${jobData.customer_id}`);
    console.log(`Results: ${jobData.metadata?.successful_submissions || 0} successful, ${jobData.metadata?.failed_submissions || 0} failed submissions`);

    return handleSuccess({
      jobId: jobData.id,
      queueId: jobData.id, // Legacy compatibility
      customerId: jobData.customer_id,
      packageSize: jobData.package_size,
      businessName: jobData.customers.business_name,
      directoriesCompleted: jobData.metadata?.directories_completed || 0,
      successfulSubmissions: jobData.metadata?.successful_submissions || 0,
      failedSubmissions: jobData.metadata?.failed_submissions || 0,
      processingTimeMs: jobData.metadata?.processing_time_ms,
      completedAt: completionData.completed_at,
      workerId: workerId
    }, 'Job completed successfully');

  } catch (error) {
    console.error('Unexpected error in jobs-complete:', error);
    return handleSupabaseError(error, 'jobs-complete-handler');
  }
}

// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY