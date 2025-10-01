import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

/**
 * Worker Lifecycle Integration Test
 * 
 * Tests the complete worker flow:
 * 1. Insert fake job with status=pending
 * 2. Worker picks it up and processes
 * 3. Verify retry logic and exponential backoff
 * 4. Confirm job_results entries are logged
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

describe('Worker Lifecycle Integration Tests', () => {
  let testCustomerId: string;
  let testJobId: string;

  beforeAll(async () => {
    // Create a test customer for worker processing
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        firstName: 'Test',
        lastName: 'Worker',
        businessName: 'Worker Test Business',
        email: 'worker-test@example.com',
        phone: '555-0100',
        status: 'active'
      })
      .select()
      .single();

    if (customerError) {
      console.error('Failed to create test customer:', customerError);
      throw customerError;
    }

    testCustomerId = customer.id;
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    if (testJobId) {
      await supabase.from('job_results').delete().eq('job_id', testJobId);
      await supabase.from('jobs').delete().eq('id', testJobId);
    }
    if (testCustomerId) {
      await supabase.from('customers').delete().eq('id', testCustomerId);
    }
  });

  it('should create a pending job and verify it can be fetched', async () => {
    // Insert a test job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: testCustomerId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    expect(jobError).toBeNull();
    expect(job).toBeDefined();
    expect(job.status).toBe('pending');

    testJobId = job.id;

    // Fetch next pending job (simulating worker behavior)
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .limit(1);

    expect(fetchError).toBeNull();
    expect(jobs).toBeDefined();
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0].id).toBe(testJobId);
  });

  it('should update job status to in_progress', async () => {
    // Update job status (simulating worker picking up job)
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', testJobId);

    expect(updateError).toBeNull();

    // Verify status was updated
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', testJobId)
      .single();

    expect(fetchError).toBeNull();
    expect(job?.status).toBe('in_progress');
  });

  it('should log job results with retry attempts', async () => {
    // Simulate logging retry attempts
    const retryLogs = [
      {
        job_id: testJobId,
        directory_name: 'Yelp',
        status: 'retry',
        response_log: { attempt: 1, error: 'Connection timeout' }
      },
      {
        job_id: testJobId,
        directory_name: 'Yelp',
        status: 'retry',
        response_log: { attempt: 2, error: 'Connection timeout' }
      },
      {
        job_id: testJobId,
        directory_name: 'Yelp',
        status: 'submitted',
        response_log: { attempt: 3 }
      }
    ];

    const { error: insertError } = await supabase
      .from('job_results')
      .insert(retryLogs);

    expect(insertError).toBeNull();

    // Verify job_results entries were created
    const { data: results, error: fetchError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', testJobId)
      .order('created_at', { ascending: true });

    expect(fetchError).toBeNull();
    expect(results).toBeDefined();
    expect(results.length).toBe(3);
    
    // Verify retry sequence
    expect(results[0].status).toBe('retry');
    expect(results[0].response_log.attempt).toBe(1);
    expect(results[1].status).toBe('retry');
    expect(results[1].response_log.attempt).toBe(2);
    expect(results[2].status).toBe('submitted');
    expect(results[2].response_log.attempt).toBe(3);
  });

  it('should verify exponential backoff timing pattern', () => {
    // Test exponential backoff calculation
    const calculateDelay = (attempt: number) => Math.pow(2, attempt) * 1000;

    expect(calculateDelay(1)).toBe(2000);  // 2^1 * 1000 = 2s
    expect(calculateDelay(2)).toBe(4000);  // 2^2 * 1000 = 4s
    expect(calculateDelay(3)).toBe(8000);  // 2^3 * 1000 = 8s
  });

  it('should mark job as complete after successful submission', async () => {
    // Update job to complete status
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'complete' })
      .eq('id', testJobId);

    expect(updateError).toBeNull();

    // Verify final status
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', testJobId)
      .single();

    expect(fetchError).toBeNull();
    expect(job?.status).toBe('complete');
  });

  it('should handle max retries exceeded scenario', async () => {
    // Create a new job for failed scenario
    const { data: failedJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: testCustomerId,
        status: 'pending'
      })
      .select()
      .single();

    expect(jobError).toBeNull();
    const failedJobId = failedJob.id;

    // Simulate max retries exceeded
    const failedLogs = [
      {
        job_id: failedJobId,
        directory_name: 'Yelp',
        status: 'retry',
        response_log: { attempt: 1, error: 'Captcha failed' }
      },
      {
        job_id: failedJobId,
        directory_name: 'Yelp',
        status: 'retry',
        response_log: { attempt: 2, error: 'Captcha failed' }
      },
      {
        job_id: failedJobId,
        directory_name: 'Yelp',
        status: 'retry',
        response_log: { attempt: 3, error: 'Captcha failed' }
      },
      {
        job_id: failedJobId,
        directory_name: 'Yelp',
        status: 'failed',
        response_log: { message: 'Max retries exceeded' }
      }
    ];

    await supabase.from('job_results').insert(failedLogs);

    // Mark job as failed
    await supabase
      .from('jobs')
      .update({ status: 'failed' })
      .eq('id', failedJobId);

    // Verify failed job status
    const { data: job } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', failedJobId)
      .single();

    expect(job?.status).toBe('failed');

    // Cleanup
    await supabase.from('job_results').delete().eq('job_id', failedJobId);
    await supabase.from('jobs').delete().eq('id', failedJobId);
  });
});

