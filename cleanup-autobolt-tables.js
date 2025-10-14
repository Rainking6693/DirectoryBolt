#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function cleanupAutoboltTables() {
  console.log('🧹 Cleaning up autobolt_processing_queue table...');

  try {
    // 1. Check if table exists and has data
    const { data: existingJobs, error: checkError } = await supabase
      .from('autobolt_processing_queue')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log('ℹ️  autobolt_processing_queue table does not exist or is empty');
      console.log('✅ No cleanup needed');
      return;
    }

    // 2. Count entries before deletion
    const { count } = await supabase
      .from('autobolt_processing_queue')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Found ${count} entries in autobolt_processing_queue`);

    // 3. Delete all entries from autobolt_processing_queue
    const { error: deleteError } = await supabase
      .from('autobolt_processing_queue')
      .delete()
      .gte('id', 0); // Delete all (id is integer)

    if (deleteError) {
      console.error('❌ Failed to delete from autobolt_processing_queue:', deleteError);
      throw deleteError;
    }

    console.log('✅ Successfully cleaned up autobolt_processing_queue table');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. The worker will now use the jobs table directly');
    console.log('   2. You can drop the autobolt_processing_queue table in Supabase dashboard if desired');
    console.log('   3. All job processing will use the jobs table');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupAutoboltTables();

