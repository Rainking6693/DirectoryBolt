const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkConstraints() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check if there's a foreign key constraint on jobs.customer_id
    const { data, error } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_name,
        constraint_type
      `)
      .eq('table_name', 'jobs')
      .eq('constraint_type', 'FOREIGN KEY');

    if (error) {
      console.log('Error checking constraints:', error);
      return;
    }

    console.log('Foreign key constraints on jobs table:', data);

    // Also check the jobs table structure
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);

    if (jobsError) {
      console.log('Error checking jobs table:', jobsError);
    } else {
      console.log('Jobs table sample data:', jobsData);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkConstraints();
