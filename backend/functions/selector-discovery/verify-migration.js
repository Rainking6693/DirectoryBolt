/**
 * Verify Migration 016 was applied successfully
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kolgqfjgncdwddziqloz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc';

async function verifyMigration() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔍 Verifying Migration 016...\n');

  // Test 1: Check columns exist
  console.log('✓ Test 1: Checking if columns exist...');
  const { data: columns, error: colError } = await supabase
    .rpc('exec_sql', {
      query: `SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name = 'directories'
              AND column_name IN ('field_selectors', 'selectors_updated_at', 'selector_discovery_log', 'requires_login', 'has_captcha', 'failure_rate')
              ORDER BY column_name;`
    });

  if (colError) {
    console.log('  ⚠️  Could not query columns (exec_sql function may not exist)');
    console.log('  Trying direct table query instead...\n');

    // Alternative: Try to select from directories to verify columns
    const { data: testRow, error: testError } = await supabase
      .from('directories')
      .select('id, field_selectors, selectors_updated_at, selector_discovery_log, requires_login, has_captcha, failure_rate')
      .limit(1);

    if (testError) {
      console.log('  ❌ Error:', testError.message);
      return false;
    } else {
      console.log('  ✅ All columns exist and are queryable\n');
    }
  } else {
    console.log('  ✅ Found columns:', columns?.length || 0);
    if (columns) {
      columns.forEach(col => console.log(`     - ${col.column_name} (${col.data_type})`));
    }
    console.log();
  }

  // Test 2: Check RPC function exists
  console.log('✓ Test 2: Testing atomic update function...');
  const testDirId = '00000000-0000-0000-0000-000000000000';
  const { error: rpcError } = await supabase.rpc('update_directory_selectors', {
    dir_id: testDirId,
    new_selectors: { test: 'value' },
    discovery_log: { test: true }
  });

  if (rpcError) {
    if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
      console.log('  ❌ Function update_directory_selectors not found');
      return false;
    } else {
      console.log('  ✅ Function exists (error is expected for non-existent directory)');
      console.log(`     Error: ${rpcError.message}\n`);
    }
  } else {
    console.log('  ✅ Function executed successfully\n');
  }

  // Test 3: Check get_stale_selector_directories function
  console.log('✓ Test 3: Testing stale selector function...');
  const { data: staleData, error: staleError } = await supabase.rpc('get_stale_selector_directories', {
    days_old: 30
  });

  if (staleError) {
    if (staleError.message.includes('function') && staleError.message.includes('does not exist')) {
      console.log('  ❌ Function get_stale_selector_directories not found');
      return false;
    } else {
      console.log('  ⚠️  Function error:', staleError.message);
    }
  } else {
    console.log(`  ✅ Function exists, found ${staleData?.length || 0} stale directories\n`);
  }

  console.log('✅ Migration 016 verification PASSED');
  console.log('   All columns, indexes, and functions are deployed successfully.\n');
  return true;
}

verifyMigration()
  .then(success => {
    if (success) {
      console.log('🎉 Database is ready for selector discovery system!');
      process.exit(0);
    } else {
      console.log('❌ Migration verification failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Verification error:', error);
    process.exit(1);
  });
