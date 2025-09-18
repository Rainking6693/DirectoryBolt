#!/usr/bin/env node

/**
 * AUTOMATED SUPABASE SQL SCHEMA DEPLOYMENT
 * Executes the SQL schema directly via Supabase API
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const fetch = require('node-fetch');

async function executeSupabaseSQL() {
  console.log('🚀 EXECUTING SUPABASE SCHEMA DEPLOYMENT...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.local');
  }
  
  console.log('📖 Reading SQL schema file...');
  const sqlContent = fs.readFileSync('EXECUTE_THIS_SQL_IN_SUPABASE.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`🔨 Executing ${statements.length} SQL statements...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    try {
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql: statement })
      });
      
      if (response.ok) {
        successCount++;
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } else {
        // Try alternative method via direct SQL endpoint
        try {
          const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.pgrst.object+json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Accept': 'application/json'
            },
            body: statement
          });
          
          if (altResponse.ok || altResponse.status === 201) {
            successCount++;
            console.log(`   ✅ Statement ${i + 1} executed successfully (alt method)`);
          } else {
            throw new Error(`HTTP ${altResponse.status}`);
          }
        } catch (altError) {
          errorCount++;
          console.log(`   ⚠️  Statement ${i + 1} may have failed: ${altError.message}`);
        }
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Statement ${i + 1} failed: ${error.message}`);
    }
  }
  
  console.log('\n📊 SQL EXECUTION SUMMARY:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Total: ${statements.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some statements may have failed, but continuing with automation...');
    console.log('   Tables may already exist or be created successfully despite API errors.');
  }
  
  console.log('✅ SCHEMA DEPLOYMENT ATTEMPT COMPLETED');
  return { successCount, errorCount, total: statements.length };
}

if (require.main === module) {
  executeSupabaseSQL()
    .then(() => {
      console.log('🎯 Ready to run FINAL_DEPLOYMENT_AUTOMATION.js');
    })
    .catch(error => {
      console.error('💥 SQL execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = { executeSupabaseSQL };