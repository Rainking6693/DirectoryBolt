// Create AutoBolt tables using Supabase REST API
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

async function createAutoBoltTables() {
  console.log('🏗️ Creating AutoBolt tables...')
  
  try {
    // 1. Create autobolt_processing_queue table
    console.log('📝 Creating autobolt_processing_queue table...')
    
    // Try to insert a test record to see if table exists
    const { data: queueTest, error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .insert({
        customer_id: 'TEST-001',
        business_name: 'Test Business',
        email: 'test@example.com',
        package_type: 'starter',
        directory_limit: 50,
        priority_level: 4,
        status: 'queued'
      })
      .select()

    if (queueError && queueError.message.includes('Could not find the table')) {
      console.log('❌ autobolt_processing_queue table does not exist')
      console.log('📋 Creating table via SQL...')
      
      // Try to create table using a different approach
      const { error: createError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE autobolt_processing_queue (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              customer_id VARCHAR(50) NOT NULL,
              business_name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              package_type VARCHAR(50) NOT NULL,
              directory_limit INTEGER NOT NULL,
              priority_level INTEGER NOT NULL,
              status VARCHAR(50) DEFAULT 'queued',
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

      if (createError) {
        console.log('❌ Failed to create table via RPC:', createError.message)
        console.log('📋 Please create this table manually in Supabase SQL Editor')
        console.log('📄 Use the SQL from: supabase-autobolt-simple.sql')
      } else {
        console.log('✅ Created autobolt_processing_queue table')
      }
    } else if (queueError) {
      console.log('⚠️ autobolt_processing_queue table exists but has issues:', queueError.message)
    } else {
      console.log('✅ autobolt_processing_queue table exists and is accessible')
      // Clean up test record
      await supabase.from('autobolt_processing_queue').delete().eq('customer_id', 'TEST-001')
    }

    // 2. Create autobolt_extension_status table
    console.log('📝 Creating autobolt_extension_status table...')
    
    const { data: extensionTest, error: extensionError } = await supabase
      .from('autobolt_extension_status')
      .insert({
        extension_id: 'TEST-EXT-001',
        status: 'offline'
      })
      .select()

    if (extensionError && extensionError.message.includes('Could not find the table')) {
      console.log('❌ autobolt_extension_status table does not exist')
      console.log('📋 Creating table via SQL...')
      
      const { error: createError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE autobolt_extension_status (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              extension_id VARCHAR(100) UNIQUE NOT NULL,
              status VARCHAR(50) DEFAULT 'offline',
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

      if (createError) {
        console.log('❌ Failed to create table via RPC:', createError.message)
        console.log('📋 Please create this table manually in Supabase SQL Editor')
      } else {
        console.log('✅ Created autobolt_extension_status table')
      }
    } else if (extensionError) {
      console.log('⚠️ autobolt_extension_status table exists but has issues:', extensionError.message)
    } else {
      console.log('✅ autobolt_extension_status table exists and is accessible')
      // Clean up test record
      await supabase.from('autobolt_extension_status').delete().eq('extension_id', 'TEST-EXT-001')
    }

    // 3. Create autobolt_processing_history table
    console.log('📝 Creating autobolt_processing_history table...')
    
    const { data: historyTest, error: historyError } = await supabase
      .from('autobolt_processing_history')
      .insert({
        customer_id: 'TEST-001',
        session_started_at: new Date().toISOString(),
        total_directories: 50,
        status: 'in_progress'
      })
      .select()

    if (historyError && historyError.message.includes('Could not find the table')) {
      console.log('❌ autobolt_processing_history table does not exist')
      console.log('📋 Creating table via SQL...')
      
      const { error: createError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE autobolt_processing_history (
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
              status VARCHAR(50) DEFAULT 'in_progress',
              error_message TEXT,
              metadata JSONB DEFAULT '{}'::jsonb,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })

      if (createError) {
        console.log('❌ Failed to create table via RPC:', createError.message)
        console.log('📋 Please create this table manually in Supabase SQL Editor')
      } else {
        console.log('✅ Created autobolt_processing_history table')
      }
    } else if (historyError) {
      console.log('⚠️ autobolt_processing_history table exists but has issues:', historyError.message)
    } else {
      console.log('✅ autobolt_processing_history table exists and is accessible')
      // Clean up test record
      await supabase.from('autobolt_processing_history').delete().eq('customer_id', 'TEST-001')
    }

    // 4. Test all tables
    console.log('🧪 Testing all AutoBolt tables...')
    await testAllTables()

  } catch (error) {
    console.error('❌ Error creating AutoBolt tables:', error)
  }
}

async function testAllTables() {
  const tables = [
    'autobolt_processing_queue',
    'autobolt_extension_status', 
    'autobolt_processing_history'
  ]

  let allTablesExist = true

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error && error.message.includes('Could not find the table')) {
        console.log(`❌ ${tableName} - NOT FOUND`)
        allTablesExist = false
      } else if (error) {
        console.log(`⚠️ ${tableName} - EXISTS but has issues: ${error.message}`)
      } else {
        console.log(`✅ ${tableName} - EXISTS and accessible`)
      }
    } catch (err) {
      console.log(`❌ ${tableName} - ERROR: ${err.message}`)
      allTablesExist = false
    }
  }

  if (allTablesExist) {
    console.log('🎉 All AutoBolt tables are ready!')
  } else {
    console.log('📋 Some tables are missing - please create them manually in Supabase SQL Editor')
    console.log('📄 Use the SQL from: supabase-autobolt-simple.sql')
  }

  return allTablesExist
}

async function main() {
  console.log('🚀 Starting AutoBolt table creation...')
  await createAutoBoltTables()
  console.log('✅ AutoBolt table creation complete!')
}

main().catch(console.error)
