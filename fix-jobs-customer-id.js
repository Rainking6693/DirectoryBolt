#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixCustomerIdColumn() {
  console.log('🔧 Fixing jobs.customer_id column type from UUID to TEXT...\n');

  try {
    // Step 1: Drop the foreign key constraint
    console.log('1. Dropping foreign key constraint...');
    const { error: dropConstraintError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE IF EXISTS jobs DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;'
    });

    if (dropConstraintError) {
      console.warn('⚠️  Could not drop constraint (might not exist):', dropConstraintError.message);
    } else {
      console.log('✅ Foreign key constraint dropped');
    }

    // Step 2: Change column type to TEXT
    console.log('\n2. Changing customer_id column type to TEXT...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE IF EXISTS jobs ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;'
    });

    if (alterError) {
      console.error('❌ Failed to change column type:', alterError.message);
      throw alterError;
    }
    console.log('✅ Column type changed to TEXT');

    // Step 3: Re-add foreign key constraint
    console.log('\n3. Re-adding foreign key constraint...');
    const { error: addConstraintError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE IF EXISTS jobs ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;'
    });

    if (addConstraintError) {
      console.warn('⚠️  Could not add constraint:', addConstraintError.message);
    } else {
      console.log('✅ Foreign key constraint added');
    }

    // Step 4: Verify the change
    console.log('\n4. Verifying the change...');
    const { data: columnInfo, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'jobs')
      .eq('column_name', 'customer_id')
      .single();

    if (verifyError) {
      console.warn('⚠️  Could not verify column type:', verifyError.message);
    } else {
      console.log('✅ Column type verified:', columnInfo);
    }

    console.log('\n🎉 Successfully changed jobs.customer_id to TEXT!');
    console.log('\nYou can now create customers and jobs will be created correctly.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease run this SQL manually in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(`
-- Drop the foreign key constraint
ALTER TABLE IF EXISTS jobs DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE IF EXISTS jobs ALTER COLUMN customer_id TYPE TEXT;

-- Re-add the foreign key constraint
ALTER TABLE IF EXISTS jobs ADD CONSTRAINT jobs_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
`);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

fixCustomerIdColumn();

