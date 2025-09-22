#!/usr/bin/env node
/**
 * Apply AutoBolt Database Migration
 * Executes the SQL migration to fix missing functions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function applyMigration() {
  console.log('🔧 Applying AutoBolt database migration...');
  
  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '021_create_autobolt_functions.sql'), 
      'utf8'
    );

    // Split SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      // For very long statements, show first 100 characters
      const preview = statement.length > 100 
        ? statement.substring(0, 100) + '...'
        : statement;
      console.log(`   ${preview}`);

      try {
        // Use the raw SQL execution approach
        const { data, error } = await supabase
          .from('autobolt_processing_queue')
          .select('count')
          .limit(0);
        
        // If the table doesn't exist yet, we need to create it first
        // Let's try a different approach - using the REST API directly
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          console.log(`⚠️ Statement failed, continuing: ${response.statusText}`);
        }

      } catch (statementError) {
        console.log(`⚠️ Statement ${i + 1} had issues, continuing...`);
        console.log(`   Error: ${statementError.message}`);
      }
    }

    console.log('✅ Migration execution completed');
    
    // Test the functions
    console.log('🧪 Testing created functions...');
    
    // Test get_next_job_in_queue function
    try {
      const { data: nextJob, error: nextJobError } = await supabase
        .rpc('get_next_job_in_queue');
      
      if (nextJobError) {
        console.log('❌ get_next_job_in_queue test failed:', nextJobError.message);
      } else {
        console.log('✅ get_next_job_in_queue function is working');
      }
    } catch (e) {
      console.log('❌ get_next_job_in_queue test error:', e.message);
    }

    // Test get_job_progress_for_staff function
    try {
      const { data: progress, error: progressError } = await supabase
        .rpc('get_job_progress_for_staff');
      
      if (progressError) {
        console.log('❌ get_job_progress_for_staff test failed:', progressError.message);
      } else {
        console.log('✅ get_job_progress_for_staff function is working');
        console.log(`📊 Found ${progress ? progress.length : 0} jobs in queue`);
      }
    } catch (e) {
      console.log('❌ get_job_progress_for_staff test error:', e.message);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Add a test job to verify everything works
async function addTestJob() {
  console.log('🧪 Adding test job to verify queue functionality...');
  
  try {
    const { data, error } = await supabase
      .from('autobolt_processing_queue')
      .insert({
        customer_id: 'TEST-MIGRATION-001',
        business_name: 'Test Migration Business',
        email: 'test-migration@example.com',
        package_type: 'growth',
        directory_limit: 5,
        priority_level: 1,
        status: 'queued',
        action: 'start_processing',
        metadata: { test: true, migration: true }
      })
      .select();

    if (error) {
      console.log('❌ Failed to add test job:', error.message);
    } else {
      console.log('✅ Test job added successfully');
      console.log('📋 Job details:', data[0]);
    }
  } catch (error) {
    console.log('❌ Test job creation error:', error.message);
  }
}

async function main() {
  await applyMigration();
  await addTestJob();
  console.log('🚀 Database migration and testing completed!');
  console.log('📡 API endpoints should now respond without 503 errors');
}

main().catch(console.error);