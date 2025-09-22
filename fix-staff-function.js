#!/usr/bin/env node
/**
 * Fix the staff progress function
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixStaffFunction() {
  console.log('🔧 Fixing staff progress function...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Drop and recreate the function with correct format
    console.log('⚡ Creating improved get_job_progress_for_staff function...');
    
    const functionSQL = `
      CREATE OR REPLACE FUNCTION get_job_progress_for_staff()
      RETURNS JSON AS $$
      DECLARE
          result JSON;
      BEGIN
          SELECT json_agg(
              json_build_object(
                  'queue_id', apq.id,
                  'customer_id', apq.customer_id,
                  'business_name', apq.business_name,
                  'status', apq.status,
                  'priority_level', apq.priority_level,
                  'total_directories', apq.directory_limit,
                  'completed_directories', COALESCE(ds_stats.completed_count, 0),
                  'failed_directories', COALESCE(ds_stats.failed_count, 0),
                  'progress_percentage', CASE 
                      WHEN apq.directory_limit > 0 THEN
                          ROUND((COALESCE(ds_stats.completed_count, 0)::DECIMAL / apq.directory_limit) * 100, 2)
                      ELSE 0.00
                  END,
                  'estimated_completion', CASE 
                      WHEN apq.status = 'processing' AND ds_stats.completed_count > 0 THEN
                          NOW() + INTERVAL '1 minute' * ((apq.directory_limit - COALESCE(ds_stats.completed_count, 0)) * 2)
                      ELSE NULL
                  END,
                  'created_at', apq.created_at,
                  'updated_at', apq.updated_at
              )
          ) INTO result
          FROM autobolt_processing_queue apq
          LEFT JOIN (
              SELECT 
                  queue_id,
                  COUNT(*) FILTER (WHERE submission_status IN ('approved', 'submitted')) as completed_count,
                  COUNT(*) FILTER (WHERE submission_status = 'failed') as failed_count
              FROM directory_submissions
              GROUP BY queue_id
          ) ds_stats ON apq.id = ds_stats.queue_id
          WHERE apq.status IN ('queued', 'processing', 'completed', 'failed')
          ORDER BY apq.priority_level DESC, apq.created_at ASC;
          
          RETURN COALESCE(result, '[]'::json);
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(functionSQL);
    console.log('✅ Function created successfully');

    // Test the function
    console.log('🧪 Testing function...');
    const testResult = await client.query('SELECT get_job_progress_for_staff()');
    console.log('✅ Function test result:', testResult.rows[0]);

    await client.end();
    console.log('🎉 Staff progress function fixed!');

  } catch (error) {
    console.error('💥 Error fixing function:', error.message);
    if (client) await client.end();
  }
}

fixStaffFunction().catch(console.error);