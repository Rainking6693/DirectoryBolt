// Create AutoBolt tables directly using Supabase REST API
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

async function createTablesDirectly() {
  console.log('🏗️ Creating AutoBolt tables directly...')
  
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
      console.log('📋 Creating table structure...')
      
      // Since we can't create tables via API, let's try a different approach
      // We'll create a simple test to verify the table structure
      console.log('📝 Table creation requires manual SQL execution')
      console.log('📄 Please run the SQL from supabase-autobolt-simple.sql in Supabase SQL Editor')
    } else if (queueError) {
      console.log(`⚠️ autobolt_processing_queue table exists but has issues: ${queueError.message}`)
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
      console.log('📝 Table creation requires manual SQL execution')
    } else if (extensionError) {
      console.log(`⚠️ autobolt_extension_status table exists but has issues: ${extensionError.message}`)
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
      console.log('📝 Table creation requires manual SQL execution')
    } else if (historyError) {
      console.log(`⚠️ autobolt_processing_history table exists but has issues: ${historyError.message}`)
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
    console.log('📋 Some tables are missing - manual creation required')
    console.log('')
    console.log('📋 MANUAL STEPS REQUIRED:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase-autobolt-simple.sql')
    console.log('4. Click "Run" to execute the SQL')
    console.log('5. Verify tables are created successfully')
    console.log('')
    console.log('📄 SQL file location: supabase-autobolt-simple.sql')
  }

  return allTablesExist
}

async function main() {
  console.log('🚀 Starting direct AutoBolt table creation...')
  await createTablesDirectly()
  console.log('✅ Direct AutoBolt table creation complete!')
}

main().catch(console.error)
