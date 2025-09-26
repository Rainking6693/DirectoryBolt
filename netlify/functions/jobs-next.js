import { supabase, handleSupabaseError, handleSuccess, validateWorkerAuth, getCorsHeaders } from './_supabaseClient.js';

// /api/jobs-next - AutoBolt worker endpoint to claim the next pending job
// Migrated from PackageTierEngine.js and background-batch.js logic

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
    console.log(`Worker ${workerId} requesting next job`);

    // 1. Start a transaction to atomically claim a job
    // Find the highest priority pending job (Enterprise = 1, Professional = 2, Growth = 3, Starter = 4)
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        customer_id,
        package_size,
        priority_level,
        created_at,
        metadata,
        customers!inner(
          business_name,
          email,
          business_data,
          status
        )
      `)
      .eq('status', 'pending')
      .eq('customers.status', 'active')
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      return handleSupabaseError(fetchError, 'fetch-next-job');
    }

    // No jobs available
    if (!jobs || jobs.length === 0) {
      return handleSuccess(null, 'No jobs available in queue');
    }

    const job = jobs[0];

    // 2. Atomically update job status to 'in_progress'
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          processed_by: workerId
        }
      })
      .eq('id', job.id)
      .eq('status', 'pending'); // Ensure it's still pending (race condition protection)

    if (updateError) {
      return handleSupabaseError(updateError, 'claim-job');
    }

    // 3. Return job details with customer information
    // This replaces the PackageTierEngine.js logic for determining processing limits
    const jobData = {
      jobId: job.id,
      customerId: job.customer_id,
      packageSize: job.package_size,
      priorityLevel: job.priority_level,
      directoryLimit: job.package_size,
      businessData: job.customers.business_data,
      businessName: job.customers.business_name,
      customerEmail: job.customers.email,
      metadata: job.metadata,
      claimedAt: new Date().toISOString(),
      workerId: workerId
    };

    console.log(`Job ${job.id} claimed by worker ${workerId} for customer ${job.customer_id}`);

    return handleSuccess(jobData, 'Job claimed successfully');

  } catch (error) {
    console.error('Unexpected error in jobs-next:', error);
    return handleSupabaseError(error, 'jobs-next-handler');
  }
}

// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY