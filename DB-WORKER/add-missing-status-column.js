require('dotenv').config({ path: '.env.local' || '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addMissingStatusColumn() {
  console.log('Adding missing status column to customers table...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // Add status column if not exists
    const { error: addError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'suspended'));
      `
    });

    if (addError) {
      console.log('RPC not available, trying direct ALTER...');
      // Fallback: Use raw SQL if RPC not set up
      const { error: directError } = await supabase
        .from('customers')
        .rpc('add_status_column'); // Assume a function or direct SQL if possible
      if (directError) throw directError;
    }

    // Update existing customers to active
    const { error: updateError } = await supabase
      .from('customers')
      .update({ status: 'active' })
      .is('status', null);

    if (updateError) throw updateError;

    console.log('Status column added and existing customers updated to active.');

    // Verify
    const { data: columns } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'status';
      `
    });

    if (columns && columns.length > 0) {
      console.log('Verification: Status column exists.');
    } else {
      console.log('Warning: Status column not found after addition.');
    }

  } catch (error) {
    console.error('Error adding status column:', error.message);
  }
}

addMissingStatusColumn();