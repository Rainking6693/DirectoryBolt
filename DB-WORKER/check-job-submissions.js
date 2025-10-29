require('dotenv').config({ path: '.env.local' || '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJobSubmissions() {
  console.log('Checking submissions for job da527164-9225-48f2-bccc-9fda76cd3653...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // Check job status
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, customer_id')
      .eq('id', 'da527164-9225-48f2-bccc-9fda76cd3653')
      .single();

    if (jobError) throw jobError;
    console.log('Job:', job);

    // Check submissions for this job
    const { data: submissions, error: subError } = await supabase
      .from('directory_submissions')
      .select('id, status, directory_url, submission_queue_id, customer_id, created_at')
      .eq('submission_queue_id', 'da527164-9225-48f2-bccc-9fda76cd3653')
      .order('created_at', { ascending: true });

    if (subError) throw subError;
    console.log('Submissions for job:', submissions);

    // Check if any pending
    const pendingSubs = submissions.filter(s => s.status === 'pending');
    console.log('Pending submissions:', pendingSubs);

    if (pendingSubs.length === 0) {
      console.log('No pending submissions found. Checking all statuses...');
      console.log('All submission statuses:', submissions.map(s => ({ id: s.id, status: s.status })));
    }

  } catch (error) {
    console.error('Error checking submissions:', error.message);
  }
}

checkJobSubmissions();