import { supabase, handleSupabaseError, handleSuccess, validateWorkerAuth, getCorsHeaders } from './_supabaseClient.js';

// /api/jobs-update - AutoBolt worker endpoint to update job progress
// Replaces background-batch.js status update logic

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
      status,
      progress,
      currentDirectory,
      directoriesCompleted = 0,
      directoriesTotal,
      errorMessage,
      lastActivity
    } = requestBody;
    
    const actualJobId = jobId || queueId; // Use jobId if available, fallback to queueId

    // Validate required fields
    if (!actualJobId || !status) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: jobId (or queueId) and status'
        })
      };
    }

    // Validate status values (new schema uses different status names)
    const validStatuses = ['pending', 'in_progress', 'complete', 'failed'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        })
      };
    }

    console.log(`Worker ${workerId} updating job ${actualJobId} to status: ${status}`);

    // Prepare update data for new schema
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Prepare metadata updates
    const metadataUpdates = {
      processed_by: workerId
    };
    
    if (progress !== undefined) metadataUpdates.progress_percentage = Math.min(100, Math.max(0, progress));
    if (currentDirectory) metadataUpdates.current_directory = currentDirectory;
    if (directoriesCompleted !== undefined) metadataUpdates.directories_completed = directoriesCompleted;
    if (directoriesTotal !== undefined) metadataUpdates.directories_total = directoriesTotal;
    if (lastActivity) metadataUpdates.last_activity = lastActivity;
    
    updateData.metadata = metadataUpdates;

    // Special handling for completion/failure
    if (status === 'complete') {
      updateData.completed_at = new Date().toISOString();
      metadataUpdates.progress_percentage = 100;
    } else if (status === 'failed') {
      updateData.error_message = errorMessage || 'Job failed without specific error message';
    }
    
    updateData.metadata = metadataUpdates;

    // Update the job record
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', actualJobId)
      .select('id, status, metadata, customer_id')
      .single();

    if (error) {
      return handleSupabaseError(error, 'update-job-status');
    }

    if (!data) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Job not found or not owned by this worker'
        })
      };
    }

    // Log significant status changes
    if (status === 'complete' || status === 'failed') {
      console.log(`Job ${actualJobId} ${status} by worker ${workerId} for customer ${data.customer_id}`);
    }

    return handleSuccess({
      jobId: data.id,
      queueId: data.id, // Legacy compatibility
      status: data.status,
      progress: data.metadata?.progress_percentage,
      customerId: data.customer_id,
      updatedAt: updateData.updated_at
    }, `Job status updated to: ${status}`);

  } catch (error) {
    console.error('Unexpected error in jobs-update:', error);
    return handleSupabaseError(error, 'jobs-update-handler');
  }
}

// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY