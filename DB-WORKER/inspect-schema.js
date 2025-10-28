require('dotenv').config({ path: '.env.local' || '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
  console.log('Inspecting Supabase schema...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // Query information_schema for tables
    const { data: tables, error: tableError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    if (tableError) {
      console.log('RPC execute_sql not available, trying direct query...');
      // Fallback to direct query if RPC not set up
      const { data: fallbackTables, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      if (fallbackError) throw fallbackError;
      console.log('Tables:', fallbackTables.map(t => t.table_name));
    } else {
      console.log('Tables:', tables.map(t => t.table_name));
    }

    // Query columns for customers table
    console.log('\nCustomers table columns:');
    const { data: customerColumns, error: customerColError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'customers' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (customerColError) {
      console.log('Trying fallback for customers columns...');
      const { data: fallbackCustomerCols, error: fallbackCError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'customers')
        .eq('table_schema', 'public')
        .order('ordinal_position');
      if (fallbackCError) {
        console.log('Customers table not found or error:', fallbackCError.message);
      } else {
        fallbackCustomerCols.forEach(col => console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
      }
    } else {
      customerColumns.forEach(col => console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
    }

    // Query columns for jobs table
    console.log('\nJobs table columns:');
    const { data: jobsColumns, error: jobsColError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (jobsColError) {
      console.log('Trying fallback for jobs columns...');
      const { data: fallbackJobsCols, error: fallbackJError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'jobs')
        .eq('table_schema', 'public')
        .order('ordinal_position');
      if (fallbackJError) {
        console.log('Jobs table not found or error:', fallbackJError.message);
      } else {
        fallbackJobsCols.forEach(col => console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
      }
    } else {
      jobsColumns.forEach(col => console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
    }

    // Check for pending jobs
    console.log('\nPending jobs count:');
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (countError) {
      console.log('Error counting pending jobs:', countError.message);
    } else {
      console.log(`Total pending jobs: ${count}`);
    }

  } catch (error) {
    console.error('Error inspecting schema:', error.message);
  }
}

inspectSchema();