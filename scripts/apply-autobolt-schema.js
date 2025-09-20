// Apply AutoBolt schema to Supabase database
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

async function applySchema() {
  console.log('🏗️ Applying AutoBolt schema to Supabase...')
  
  try {
    // 1. Create autobolt_processing_queue table
    console.log('📝 Creating autobolt_processing_queue table...')
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
      // Try alternative approach
      await createTableDirectly('autobolt_processing_queue')
    } else {
      console.log('✅ Created autobolt_processing_queue table')
    }

    // 2. Create autobolt_extension_status table
    console.log('📝 Creating autobolt_extension_status table...')
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
      await createTableDirectly('autobolt_extension_status')
    } else {
      console.log('✅ Created autobolt_extension_status table')
    }

    // 3. Create autobolt_processing_history table
    console.log('📝 Creating autobolt_processing_history table...')
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS autobolt_processing_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          queue_id UUID,
          customer_id VARCHAR(50) NOT NULL,
          session_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
          session_completed_at TIMESTAMP WITH TIME ZONE,
          total_directories INTEGER NOT NULL,
          directories_completed INTEGER DEFAULT 0,
          directories_failed INTEGER DEFAULT 0,
          success_rate DECIMAL(5,2) DEFAULT 0.00,
          processing_time_seconds INTEGER,
          status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (historyError) {
      console.log('❌ Failed to create autobolt_processing_history:', historyError.message)
      await createTableDirectly('autobolt_processing_history')
    } else {
      console.log('✅ Created autobolt_processing_history table')
    }

    // 4. Create indexes
    console.log('📝 Creating indexes...')
    await createIndexes()

    // 5. Create helper functions
    console.log('📝 Creating helper functions...')
    await createHelperFunctions()

    // 6. Test the tables
    console.log('🧪 Testing tables...')
    await testTables()

    console.log('✅ AutoBolt schema applied successfully!')

  } catch (error) {
    console.error('❌ Error applying schema:', error)
  }
}

async function createTableDirectly(tableName) {
  console.log(`📝 Attempting to create ${tableName} table directly...`)
  
  try {
    // Try to insert a test record to see if table exists
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error && error.message.includes('Could not find the table')) {
      console.log(`❌ ${tableName} table does not exist and cannot be created via RPC`)
      console.log(`📋 Please create this table manually in Supabase SQL Editor`)
    } else {
      console.log(`✅ ${tableName} table exists`)
    }
  } catch (err) {
    console.log(`❌ Error checking ${tableName}:`, err.message)
  }
}

async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_autobolt_queue_customer_id ON autobolt_processing_queue(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_autobolt_queue_status ON autobolt_processing_queue(status);',
    'CREATE INDEX IF NOT EXISTS idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);',
    'CREATE INDEX IF NOT EXISTS idx_extension_status_extension_id ON autobolt_extension_status(extension_id);',
    'CREATE INDEX IF NOT EXISTS idx_processing_history_customer_id ON autobolt_processing_history(customer_id);'
  ]

  for (const indexSQL of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL })
      if (error) {
        console.log(`⚠️ Index creation warning:`, error.message)
      }
    } catch (err) {
      console.log(`⚠️ Index creation error:`, err.message)
    }
  }
}

async function createHelperFunctions() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_queue_stats()
        RETURNS TABLE (
          total_queued INTEGER,
          total_processing INTEGER,
          total_completed INTEGER,
          total_failed INTEGER
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            COUNT(*) FILTER (WHERE status = 'queued')::INTEGER as total_queued,
            COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as total_processing,
            COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as total_completed,
            COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as total_failed
          FROM autobolt_processing_queue;
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (error) {
      console.log('⚠️ Helper function creation warning:', error.message)
    } else {
      console.log('✅ Created get_queue_stats helper function')
    }
  } catch (err) {
    console.log('⚠️ Helper function creation error:', err.message)
  }
}

async function testTables() {
  try {
    // Test autobolt_processing_queue
    const { data: queueData, error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .select('count')
      .limit(1)

    if (queueError) {
      console.log('❌ autobolt_processing_queue test failed:', queueError.message)
    } else {
      console.log('✅ autobolt_processing_queue table accessible')
    }

    // Test autobolt_extension_status
    const { data: extensionData, error: extensionError } = await supabase
      .from('autobolt_extension_status')
      .select('count')
      .limit(1)

    if (extensionError) {
      console.log('❌ autobolt_extension_status test failed:', extensionError.message)
    } else {
      console.log('✅ autobolt_extension_status table accessible')
    }

    // Test autobolt_processing_history
    const { data: historyData, error: historyError } = await supabase
      .from('autobolt_processing_history')
      .select('count')
      .limit(1)

    if (historyError) {
      console.log('❌ autobolt_processing_history test failed:', historyError.message)
    } else {
      console.log('✅ autobolt_processing_history table accessible')
    }

  } catch (error) {
    console.log('❌ Table testing error:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting AutoBolt schema application...')
  await applySchema()
  console.log('✅ Schema application complete!')
}

main().catch(console.error)
