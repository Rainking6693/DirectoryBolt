/**
 * Check the status of jobs in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJobs() {
  try {
    console.log('🔍 Checking job statuses in database...');
    console.log();

    // Get all jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, customer_id, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    console.log(`📊 Found ${jobs.length} jobs in database:`);
    console.log();

    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   Customer: ${job.customer_id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${job.created_at}`);
      console.log(`   Updated: ${job.updated_at}`);
      console.log();
    });

    // Count by status
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} jobs`);
    });

    // Check which jobs should be available for processing
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    console.log();
    console.log(`🎯 Jobs available for processing (status='pending'): ${pendingJobs.length}`);
    
    if (pendingJobs.length > 0) {
      console.log('Available jobs:');
      pendingJobs.forEach(job => {
        console.log(`   - ${job.id} (${job.customer_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkJobs();
