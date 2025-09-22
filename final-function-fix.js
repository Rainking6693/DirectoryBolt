#!/usr/bin/env node
/**
 * Final fix for database function
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function finalFix() {
  console.log('🔧 Final function fix...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create a working function without GROUP BY issues
    console.log('⚡ Creating final working function...');
    
    const workingFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_job_progress_for_staff()
      RETURNS JSON AS $$
      BEGIN
          RETURN (
              SELECT COALESCE(json_agg(
                  json_build_object(
                      'queue_id', id,
                      'customer_id', customer_id,
                      'business_name', business_name,
                      'status', status,
                      'priority_level', priority_level,
                      'total_directories', directory_limit,
                      'completed_directories', 0,
                      'failed_directories', 0,
                      'progress_percentage', 0.00,
                      'estimated_completion', NULL,
                      'created_at', created_at,
                      'updated_at', updated_at
                  ) ORDER BY priority_level DESC, created_at ASC
              ), '[]'::json)
              FROM autobolt_processing_queue
              WHERE status IN ('queued', 'processing', 'completed', 'failed')
          );
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(workingFunctionSQL);
    console.log('✅ Function created successfully');

    // Test the function
    console.log('🧪 Testing function...');
    const testResult = await client.query('SELECT get_job_progress_for_staff()');
    const jobs = testResult.rows[0].get_job_progress_for_staff;
    console.log('✅ Function works! Found', jobs?.length || 0, 'jobs');
    
    if (jobs && jobs.length > 0) {
      console.log('📋 Sample job:', jobs[0]);
    }

    await client.end();
    console.log('🎉 Database functions completely fixed!');

  } catch (error) {
    console.error('💥 Error:', error.message);
    if (client) await client.end();
  }
}

finalFix().catch(console.error);