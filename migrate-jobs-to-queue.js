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

async function migrateJobsToQueue() {
  console.log('🔄 Migrating jobs from jobs table to autobolt_processing_queue...');

  try {
    // 1. Get all jobs that are pending or in_progress
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        customer_id,
        package_size,
        priority_level,
        status,
        created_at,
        started_at,
        completed_at,
        error_message,
        metadata
      `)
      .in('status', ['pending', 'in_progress']);

    if (jobsError) {
      console.error('❌ Failed to fetch jobs:', jobsError);
      return;
    }

    console.log(`📋 Found ${jobs?.length || 0} jobs to migrate`);

    if (!jobs || jobs.length === 0) {
      console.log('✅ No jobs to migrate');
      return;
    }

    // 2. Get customer data for business names
    const customerIds = [...new Set(jobs.map(j => j.customer_id))];
    const { data: customers } = await supabase
      .from('customers')
      .select('id, business_name, email, phone, website, address, city, state, zip')
      .in('id', customerIds);

    const customerById = {};
    for (const c of customers || []) {
      customerById[c.id] = c;
    }

    // 3. Create autobolt_processing_queue entries (only core columns)
    const queueEntries = jobs.map(job => {
      const customer = customerById[job.customer_id] || {};
      const status = job.status === 'pending' ? 'pending' : 
                   job.status === 'in_progress' ? 'processing' : 'queued';
      
      return {
        customer_id: job.customer_id,
        directory_limit: job.package_size || 50,
        priority_level: job.priority_level || 3,
        status: status === 'processing' ? 'queued' : 'pending'  // Use valid statuses
      };
    });

    // 4. Insert into autobolt_processing_queue
    const { data: inserted, error: insertError } = await supabase
      .from('autobolt_processing_queue')
      .insert(queueEntries)
      .select('id, customer_id, business_name, status');

    if (insertError) {
      console.error('❌ Failed to insert into autobolt_processing_queue:', insertError);
      return;
    }

    console.log(`✅ Migrated ${inserted?.length || 0} jobs to autobolt_processing_queue`);
    
    // 5. Show what was created
    for (const entry of inserted || []) {
      console.log(`   - ${entry.business_name} (${entry.customer_id}) -> ${entry.status}`);
    }

    console.log('\n🎉 Migration completed! Worker should now be able to process jobs.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateJobsToQueue();
