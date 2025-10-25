require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Has Service Key:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log('\n=== DATABASE DEBUG INFO ===\n');
  
  // Check customers table structure
  console.log('1. Checking customers table structure...');
  const { data: customersColumns, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
  
  if (customersError) {
    console.log('Customers table error:', customersError.message);
  } else if (customersColumns && customersColumns.length > 0) {
    console.log('Customers table sample row:', JSON.stringify(customersColumns[0], null, 2));
  } else {
    console.log('Customers table is empty');
  }
  
  // Check jobs table structure
  console.log('\n2. Checking jobs table structure...');
  const { data: jobsColumns, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .limit(1);
  
  if (jobsError) {
    console.log('Jobs table error:', jobsError.message);
  } else if (jobsColumns && jobsColumns.length > 0) {
    console.log('Jobs table sample row:', JSON.stringify(jobsColumns[0], null, 2));
  } else {
    console.log('Jobs table is empty');
  }
  
  // Check directory_submissions table structure
  console.log('\n3. Checking directory_submissions table structure...');
  const { data: submissionsColumns, error: submissionsError } = await supabase
    .from('directory_submissions')
    .select('*')
    .limit(1);
  
  if (submissionsError) {
    console.log('Directory submissions table error:', submissionsError.message);
  } else if (submissionsColumns && submissionsColumns.length > 0) {
    console.log('Directory submissions table sample row:', JSON.stringify(submissionsColumns[0], null, 2));
  } else {
    console.log('Directory submissions table is empty');
  }
  
  // Check table relationships
  console.log('\n4. Checking table relationships...');
  
  // Get a customer and see if it has related jobs
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('customer_id, business_name')
    .limit(1)
    .single();
  
  if (customerError) {
    console.log('Error fetching customer:', customerError.message);
  } else if (customer) {
    console.log('Sample customer:', JSON.stringify(customer, null, 2));
    
    // Check if this customer has any jobs
    const { data: customerJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, customer_id, status')
      .eq('customer_id', customer.customer_id);
    
    if (jobsError) {
      console.log('Error fetching customer jobs:', jobsError.message);
    } else {
      console.log(`Customer has ${customerJobs.length} jobs:`, JSON.stringify(customerJobs, null, 2));
    }
  }
  
  // Check current job statuses
  console.log('\n5. Current job statuses:');
  const { data: allJobs, error: allJobsError } = await supabase
    .from('jobs')
    .select('status');
  
  if (allJobsError) {
    console.log('Error fetching jobs:', allJobsError.message);
  } else {
    const statusCounts = {};
    allJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    console.log('Job statuses:', JSON.stringify(statusCounts, null, 2));
  }
  
  // Check for pending jobs with no submissions
  console.log('\n6. Checking pending jobs with no submissions:');
  const { data: pendingJobs, error: pendingError } = await supabase
    .from('jobs')
    .select('id, customer_id, status')
    .eq('status', 'pending');
  
  if (pendingError) {
    console.log('Error fetching pending jobs:', pendingError.message);
  } else {
    console.log(`Found ${pendingJobs.length} pending jobs`);
    for (const job of pendingJobs) {
      const { data: submissions, error: subsError } = await supabase
        .from('directory_submissions')
        .select('id, status')
        .eq('submission_queue_id', job.id);
      
      if (subsError) {
        console.log(`Error checking submissions for job ${job.id}:`, subsError.message);
      } else {
        console.log(`Job ${job.id} has ${submissions.length} submissions`);
        if (submissions.length > 0) {
          console.log(`  Submission statuses:`, submissions.map(s => s.status));
        }
      }
    }
  }
  
  // Check the failed job in detail
  console.log('\n7. Checking failed job in detail:');
  const { data: failedJob, error: failedJobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', '0cdc233e-78ea-4032-9b65-52932a84835e')
    .single();
  
  if (failedJobError) {
    console.log('Error fetching failed job:', failedJobError.message);
  } else {
    console.log('Failed job details:', JSON.stringify(failedJob, null, 2));
    
    // Check submissions for this failed job
    const { data: failedSubmissions, error: failedSubsError } = await supabase
      .from('directory_submissions')
      .select('*')
      .eq('submission_queue_id', failedJob.id);
    
    if (failedSubsError) {
      console.log('Error fetching failed job submissions:', failedSubsError.message);
    } else {
      console.log(`Failed job has ${failedSubmissions.length} submissions:`);
      failedSubmissions.forEach(sub => {
        console.log(`  Submission ${sub.id}: status=${sub.status}, message=${sub.result_message}`);
      });
    }
  }
  
  console.log('\n=== END DATABASE DEBUG ===\n');
}

debugDatabase().catch(console.error);