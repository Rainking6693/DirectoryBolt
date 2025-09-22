#!/usr/bin/env node
/**
 * Fix table structure to add missing queue_id column
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixTableStructure() {
  console.log('🔧 Fixing table structure...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if queue_id column exists
    console.log('🔍 Checking for queue_id column...');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'directory_submissions' AND column_name = 'queue_id'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('⚡ Adding queue_id column...');
      await client.query(`
        ALTER TABLE directory_submissions 
        ADD COLUMN queue_id UUID REFERENCES autobolt_processing_queue(id)
      `);
      console.log('✅ queue_id column added');
    } else {
      console.log('✅ queue_id column already exists');
    }

    // Now create a simplified function that works with the current data
    console.log('⚡ Creating simplified staff progress function...');
    
    const simpleFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_job_progress_for_staff()
      RETURNS JSON AS $$
      DECLARE
          result JSON;
      BEGIN
          -- Just return the queue data for now, without directory submissions
          SELECT json_agg(
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
              )
          ) INTO result
          FROM autobolt_processing_queue
          WHERE status IN ('queued', 'processing', 'completed', 'failed')
          ORDER BY priority_level DESC, created_at ASC;
          
          RETURN COALESCE(result, '[]'::json);
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(simpleFunctionSQL);
    console.log('✅ Simplified function created');

    // Test the function
    console.log('🧪 Testing function...');
    const testResult = await client.query('SELECT get_job_progress_for_staff()');
    console.log('✅ Function works! Found jobs:', testResult.rows[0].get_job_progress_for_staff?.length || 0);

    await client.end();
    console.log('🎉 Table structure and function fixed!');

  } catch (error) {
    console.error('💥 Error fixing structure:', error.message);
    if (client) await client.end();
  }
}

fixTableStructure().catch(console.error);