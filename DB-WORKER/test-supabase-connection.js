const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' || '.env' });

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env');
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Test basic connection
    const { data, error } = await supabase.from('jobs').select('id').limit(1);
    if (error) throw error;
    console.log('Connection successful. Jobs table accessible.');

    // Check jobs table columns
    console.log('\nChecking jobs table schema:');
    const { data: columns, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'jobs' });
    if (colError) {
      console.log('Could not fetch columns, trying alternative query...');
      // Alternative: Use raw SQL if RPC not available
      const { data: altColumns, error: altError } = await supabase.rpc('execute_sql', {
        query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs' AND table_schema = 'public' ORDER BY ordinal_position;"
      });
      if (altError) throw altError;
      console.log(altColumns);
    } else {
      console.log(columns);
    }

    // Check directory_submissions table
    console.log('\nChecking directory_submissions table schema:');
    const { data: subColumns, error: subError } = await supabase.rpc('get_table_columns', { table_name: 'directory_submissions' });
    if (subError) {
      console.log('Could not fetch columns for directory_submissions...');
    } else {
      console.log(subColumns);
    }

    // Check if there are pending jobs
    const { data: pendingJobs } = await supabase.from('jobs').select('id, status').eq('status', 'pending').limit(5);
    console.log('\nPending jobs:', pendingJobs || 'None found');

  } catch (error) {
    console.error('Connection or query failed:', error.message);
  }
}

testConnection();