// Fixed: Manual joins using ACTUAL table names
// jobs (not autobolt_processing_queue)
// directory_submissions (not directory_submissions)

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateQueueLinkage() {
  console.log('\n--- Latest 10 jobs with customers (MANUAL JOIN) ---\n');
  
  try {
    // Get latest jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return;
    }

    // For each job, fetch customer data separately
    const jobsWithCustomers = await Promise.all(
      jobs.map(async (job) => {
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('customer_id', job.customer_id)
          .single();

        return {
          id: job.id,
          status: job.status,
          customer_id: job.customer_id,
          customer_uuid: customer?.id,
          customer_name: customer?.['business-name'] || customer?.business_name,
          customer_email: customer?.email,
          created_at: job.created_at
        };
      })
    );

    console.table(jobsWithCustomers);

    // Now get directory submissions with manual joins
    console.log('\n--- Latest 20 submissions with customer data (MANUAL JOINS) ---\n');

    const { data: submissions, error: submissionsError } = await supabase
      .from('directory_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return;
    }

    // Enrich submissions with customer and job data
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        // Get job info first
        const { data: job } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', submission.submission_queue_id)
          .single();

        // Get customer info
        const customerId = submission.customer_id || job?.customer_id;
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('customer_id', customerId)
          .single();

        return {
          submission_id: submission.id,
          directory: submission.directory_url,
          status: submission.status,
          queue_id: submission.submission_queue_id,
          customer_id: customerId,
          customer_name: customer?.['business-name'] || customer?.business_name,
          customer_email: customer?.email,
          error: submission.result_message,
          processed_at: submission.updated_at,
          created_at: submission.created_at
        };
      })
    );

    console.table(enrichedSubmissions);

    // Summary statistics
    console.log('\n--- Mapping Quality Report ---\n');
    const totalSubmissions = enrichedSubmissions.length;
    const withCustomers = enrichedSubmissions.filter(s => s.customer_name).length;
    const mappingRate = ((withCustomers / totalSubmissions) * 100).toFixed(1);

    console.log(`Total submissions checked: ${totalSubmissions}`);
    console.log(`Submissions with customer data: ${withCustomers}`);
    console.log(`Mapping success rate: ${mappingRate}%`);

    if (mappingRate < 100) {
      console.log('\n⚠️ WARNING: Some submissions missing customer data');
      console.log('This usually means:');
      console.log('  1. customer_id is NULL in directory_submissions');
      console.log('  2. submission_queue_id reference is broken');
      console.log('  3. Customer record was deleted');
    } else {
      console.log('\n✅ All mappings successful!');
    }

  } catch (error) {
    console.error('Validation error:', error);
  }
}

validateQueueLinkage().catch(console.error);
