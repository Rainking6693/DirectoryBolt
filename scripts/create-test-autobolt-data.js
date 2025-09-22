#!/usr/bin/env node

/**
 * Create Test AutoBolt Data
 * Creates test data for AutoBolt API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestData() {
  console.log('🧪 Creating test AutoBolt data...');
  
  try {
    // Create test job in autobolt_processing_queue
    const testJob = {
      customer_id: 'TEST-CUSTOMER-001',
      business_name: 'Test Business Inc',
      email: 'test@testbusiness.com',
      package_type: 'growth',
      directory_limit: 25,
      priority_level: 1,
      status: 'queued',
      action: 'start_processing',
      metadata: {
        test_data: true,
        business_type: 'software',
        location: 'USA'
      }
    };

    const { data: insertedJob, error: insertError } = await supabase
      .from('autobolt_processing_queue')
      .insert(testJob)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create test job:', insertError);
      return;
    }

    console.log('✅ Test job created:', insertedJob.id);

    // Create some test directory submissions
    const testSubmissions = [
      {
        queue_id: insertedJob.id,
        customer_id: 'TEST-CUSTOMER-001',
        directory_name: 'Test Directory 1',
        directory_url: 'https://testdirectory1.com',
        directory_category: 'business',
        directory_tier: 'standard',
        submission_status: 'pending'
      },
      {
        queue_id: insertedJob.id,
        customer_id: 'TEST-CUSTOMER-001',
        directory_name: 'Test Directory 2',
        directory_url: 'https://testdirectory2.com',
        directory_category: 'tech',
        directory_tier: 'premium',
        submission_status: 'pending'
      }
    ];

    const { error: submissionError } = await supabase
      .from('directory_submissions')
      .insert(testSubmissions);

    if (submissionError) {
      console.error('❌ Failed to create test submissions:', submissionError);
    } else {
      console.log('✅ Test directory submissions created');
    }

    console.log('🎉 Test data creation completed!');
    console.log('📊 Test job ID:', insertedJob.id);

  } catch (error) {
    console.error('💥 Error creating test data:', error);
  }
}

createTestData();