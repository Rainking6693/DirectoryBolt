// Check existing tables and setup AutoBolt schema
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTables() {
  console.log('🔍 Checking existing tables...')
  
  try {
    // Check if customers table exists
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('count')
      .limit(1)
    
    if (customersError) {
      console.log('❌ Customers table error:', customersError.message)
    } else {
      console.log('✅ Customers table exists')
    }

    // Check if autobolt_processing_queue exists
    const { data: queue, error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .select('count')
      .limit(1)
    
    if (queueError) {
      console.log('❌ AutoBolt processing queue table does not exist:', queueError.message)
    } else {
      console.log('✅ AutoBolt processing queue table exists')
    }

    // Check if directory_submissions exists
    const { data: submissions, error: submissionsError } = await supabase
      .from('directory_submissions')
      .select('count')
      .limit(1)
    
    if (submissionsError) {
      console.log('❌ Directory submissions table does not exist:', submissionsError.message)
    } else {
      console.log('✅ Directory submissions table exists')
    }

    // Check if autobolt_extension_status exists
    const { data: extension, error: extensionError } = await supabase
      .from('autobolt_extension_status')
      .select('count')
      .limit(1)
    
    if (extensionError) {
      console.log('❌ AutoBolt extension status table does not exist:', extensionError.message)
    } else {
      console.log('✅ AutoBolt extension status table exists')
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

async function createAutoBoltTables() {
  console.log('🏗️ Creating AutoBolt tables...')
  
  try {
    // Create autobolt_processing_queue table
    const { error: queueError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS autobolt_processing_queue (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id VARCHAR(50) NOT NULL,
          business_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          package_type VARCHAR(50) NOT NULL,
          directory_limit INTEGER NOT NULL,
          priority_level INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'paused')),
          action VARCHAR(50) DEFAULT 'start_processing',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by VARCHAR(100) DEFAULT 'staff_dashboard',
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `
    })

    if (queueError) {
      console.log('❌ Failed to create autobolt_processing_queue:', queueError.message)
    } else {
      console.log('✅ Created autobolt_processing_queue table')
    }

    // Create directory_submissions table
    const { error: submissionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS directory_submissions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id VARCHAR(50) NOT NULL,
          queue_id UUID,
          directory_name VARCHAR(255) NOT NULL,
          directory_url VARCHAR(500),
          directory_category VARCHAR(100),
          directory_tier VARCHAR(50) DEFAULT 'standard' CHECK (directory_tier IN ('standard', 'premium', 'enterprise')),
          submission_status VARCHAR(50) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'submitted', 'approved', 'rejected', 'processing', 'failed')),
          submitted_at TIMESTAMP WITH TIME ZONE,
          approved_at TIMESTAMP WITH TIME ZONE,
          listing_url VARCHAR(500),
          rejection_reason TEXT,
          domain_authority INTEGER,
          estimated_traffic INTEGER,
          processing_time_seconds INTEGER,
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (submissionsError) {
      console.log('❌ Failed to create directory_submissions:', submissionsError.message)
    } else {
      console.log('✅ Created directory_submissions table')
    }

    // Create autobolt_extension_status table
    const { error: extensionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS autobolt_extension_status (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          extension_id VARCHAR(100) UNIQUE NOT NULL,
          status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'processing', 'error')),
          last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          current_customer_id VARCHAR(50),
          current_queue_id UUID,
          processing_started_at TIMESTAMP WITH TIME ZONE,
          directories_processed INTEGER DEFAULT 0,
          directories_failed INTEGER DEFAULT 0,
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (extensionError) {
      console.log('❌ Failed to create autobolt_extension_status:', extensionError.message)
    } else {
      console.log('✅ Created autobolt_extension_status table')
    }

  } catch (error) {
    console.error('❌ Error creating tables:', error)
  }
}

async function fixCustomerStatus() {
  console.log('🔧 Fixing customer status...')
  
  try {
    // Update customers with directories_submitted = 0 to status 'queued'
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        status: 'queued',
        updated_at: new Date().toISOString()
      })
      .eq('directories_submitted', 0)

    if (updateError) {
      console.log('❌ Failed to update customer status:', updateError.message)
    } else {
      console.log('✅ Updated customer status to queued')
    }

  } catch (error) {
    console.error('❌ Error fixing customer status:', error)
  }
}

async function main() {
  console.log('🚀 Starting AutoBolt setup...')
  
  await checkTables()
  await createAutoBoltTables()
  await fixCustomerStatus()
  
  console.log('✅ AutoBolt setup complete!')
}

main().catch(console.error)
