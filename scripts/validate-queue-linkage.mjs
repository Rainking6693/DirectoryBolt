import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateQueueLinkage() {
  console.log('\n--- Latest 10 jobs with customers ---\n');
  
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return;
    }

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
          customer_name: customer?.business_name,
          customer_email: customer?.email,
          created_at: job.created_at
        };
      })
    );

    console.table(jobsWithCustomers);

    console.log('\n--- Latest 20 submissions with customer data ---\n');

    const { data: submissions, error: submissionsError } = await supabase
      .from('directory_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return;
    }

    if (submissions.length === 0) {
      console.log('No submissions yet.');
      return;
    }

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('customer_id', submission.customer_id)
          .single();

        return {
          submission_id: submission.id,
          directory: submission.directory_url,
          status: submission.status,
          customer_id: submission.customer_id,
          customer_name: customer?.business_name,
          customer_email: customer?.email,
          created_at: submission.created_at
        };
      })
    );

    console.table(enrichedSubmissions);

    console.log('\n--- Summary ---\n');
    const withCustomers = enrichedSubmissions.filter(s => s.customer_name).length;
    console.log(`Total submissions: ${enrichedSubmissions.length}`);
    console.log(`With customer data: ${withCustomers}`);
    console.log(`Success rate: ${((withCustomers / enrichedSubmissions.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Error:', error);
  }
}

validateQueueLinkage();