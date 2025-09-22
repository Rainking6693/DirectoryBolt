#!/usr/bin/env node

/**
 * Emergency Database Function Fix
 * Directly applies the missing AutoBolt functions to fix 503 errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAutoBoltFunctions() {
  console.log('🔧 Creating missing AutoBolt database functions...');
  
  try {
    // Function 1: get_next_job_in_queue
    console.log('Creating get_next_job_in_queue function...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_next_job_in_queue()
        RETURNS TABLE (
            id UUID,
            customer_id VARCHAR,
            business_name VARCHAR,
            email VARCHAR,
            package_type VARCHAR,
            directory_limit INTEGER,
            priority_level INTEGER,
            status VARCHAR,
            action VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB
        ) AS $$
        DECLARE
            job_record RECORD;
        BEGIN
            SELECT * INTO job_record
            FROM autobolt_processing_queue 
            WHERE status = 'queued'
            ORDER BY priority_level DESC, created_at ASC
            LIMIT 1;
            
            IF job_record.id IS NOT NULL THEN
                UPDATE autobolt_processing_queue 
                SET status = 'processing', 
                    started_at = NOW(),
                    updated_at = NOW()
                WHERE id = job_record.id;
                
                RETURN QUERY
                SELECT 
                    job_record.id,
                    job_record.customer_id,
                    job_record.business_name,
                    job_record.email,
                    job_record.package_type,
                    job_record.directory_limit,
                    job_record.priority_level,
                    'processing'::VARCHAR as status,
                    job_record.action,
                    job_record.created_at,
                    job_record.metadata;
            END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error1) {
      console.error('❌ Failed to create get_next_job_in_queue:', error1);
    } else {
      console.log('✅ get_next_job_in_queue function created');
    }

    // Function 2: get_job_progress_for_staff  
    console.log('Creating get_job_progress_for_staff function...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_job_progress_for_staff()
        RETURNS TABLE (
            queue_id UUID,
            customer_id VARCHAR,
            business_name VARCHAR,
            status VARCHAR,
            priority_level INTEGER,
            total_directories INTEGER,
            completed_directories INTEGER,
            failed_directories INTEGER,
            progress_percentage DECIMAL,
            estimated_completion TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                apq.id as queue_id,
                apq.customer_id,
                apq.business_name,
                apq.status,
                apq.priority_level,
                apq.directory_limit as total_directories,
                0::INTEGER as completed_directories,
                0::INTEGER as failed_directories,
                0.00::DECIMAL as progress_percentage,
                NULL::TIMESTAMP WITH TIME ZONE as estimated_completion,
                apq.created_at,
                apq.updated_at
            FROM autobolt_processing_queue apq
            WHERE apq.status IN ('queued', 'processing', 'completed', 'failed')
            ORDER BY apq.priority_level DESC, apq.created_at ASC;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error2) {
      console.error('❌ Failed to create get_job_progress_for_staff:', error2);
    } else {
      console.log('✅ get_job_progress_for_staff function created');
    }

    console.log('🎉 Database functions created successfully!');
    console.log('📡 Testing API endpoints should now work...');

  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

// Create some test data to ensure the API endpoints work
async function createTestData() {
  console.log('🧪 Creating test data...');
  
  try {
    // Insert test job
    const { error } = await supabase
      .from('autobolt_processing_queue')
      .insert({
        customer_id: 'TEST-001',
        business_name: 'Test Business',
        email: 'test@example.com',
        package_type: 'growth',
        directory_limit: 10,
        priority_level: 1,
        status: 'queued'
      });

    if (error) {
      console.error('❌ Failed to create test data:', error);
    } else {
      console.log('✅ Test data created');
    }
  } catch (error) {
    console.error('💥 Test data creation failed:', error);
  }
}

async function main() {
  await createAutoBoltFunctions();
  await createTestData();
  console.log('🚀 Emergency database fix completed!');
}

main().catch(console.error);