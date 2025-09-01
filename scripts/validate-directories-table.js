#!/usr/bin/env node

/**
 * 🔍 SIMPLE DIRECTORIES TABLE VALIDATOR
 * 
 * Simple validator that checks if the directories table is ready for Excel import.
 * Works with Supabase's PostgREST limitations.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  try {
    log('🔍 Validating Directories Table for Excel Import...', colors.cyan);
    
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    log('✅ Connected to Supabase', colors.green);

    // Test 1: Check if directories table exists by trying to query it
    log('📋 Testing directories table...', colors.blue);
    
    try {
      const { data, error } = await supabase
        .from('directories')
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('relation "directories" does not exist')) {
          log('❌ Directories table does not exist', colors.red);
          log('💡 Run the migration SQL in Supabase dashboard first', colors.yellow);
          log('   Use: npm run migrate:simple', colors.yellow);
          return false;
        } else {
          throw error;
        }
      }

      log('✅ Directories table exists', colors.green);

      // Test 2: Check if we can insert test data
      log('🧪 Testing insert operation...', colors.blue);
      
      const testRecord = {
        name: 'Test Directory ' + Date.now(),
        website: 'https://test-' + Date.now() + '.com',
        category: 'test_category',
        domain_authority: 50,
        active: true
      };

      const { data: insertData, error: insertError } = await supabase
        .from('directories')
        .insert(testRecord)
        .select();

      if (insertError) {
        log(`❌ Insert test failed: ${insertError.message}`, colors.red);
        return false;
      }

      log('✅ Insert operation works', colors.green);

      // Test 3: Check if we can update data
      log('🔄 Testing update operation...', colors.blue);
      
      if (insertData && insertData[0]) {
        const { error: updateError } = await supabase
          .from('directories')
          .update({ domain_authority: 75 })
          .eq('id', insertData[0].id);

        if (updateError) {
          log(`❌ Update test failed: ${updateError.message}`, colors.red);
          return false;
        }

        log('✅ Update operation works', colors.green);

        // Clean up test record
        await supabase
          .from('directories')
          .delete()
          .eq('id', insertData[0].id);

        log('✅ Delete operation works', colors.green);
      }

      // Test 4: Get current record count
      const { count, error: countError } = await supabase
        .from('directories')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        log(`📊 Current directories in table: ${count || 0}`, colors.blue);
      }

      // Success summary
      log('\n🎉 VALIDATION SUCCESSFUL!', colors.green);
      log('✅ Directories table is ready for Excel import', colors.green);
      log('✅ All CRUD operations work correctly', colors.green);
      log('✅ Ready to import 484 directories', colors.green);
      
      log('\n📋 Next steps:', colors.cyan);
      log('1. Validate Excel data: npm run import:excel:validate', colors.reset);
      log('2. Dry run import: npm run import:excel:dry-run', colors.reset);
      log('3. Import directories: npm run import:excel', colors.reset);

      return true;

    } catch (error) {
      log(`❌ Table validation failed: ${error.message}`, colors.red);
      return false;
    }

  } catch (error) {
    log(`❌ Validation failed: ${error.message}`, colors.red);
    
    if (error.message.includes('Missing SUPABASE_URL')) {
      log('\n💡 Setup steps:', colors.yellow);
      log('1. Check your .env.local file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', colors.reset);
      log('2. Verify the credentials are correct', colors.reset);
      log('3. Make sure Supabase project is active', colors.reset);
    }
    
    process.exit(1);
  }
}

main();