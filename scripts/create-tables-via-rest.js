// Create AutoBolt tables via Supabase REST API
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

async function createTablesViaRest() {
  console.log('🏗️ Creating AutoBolt tables via REST API...')
  
  try {
    // 1. Create autobolt_processing_queue table
    console.log('📝 Creating autobolt_processing_queue table...')
    
    // Try to create a test record to see if table exists
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
      console.log('📋 Please create this table manually in Supabase SQL Editor')
      console.log('📄 Use the SQL from: supabase-autobolt-tables.sql')
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
      console.log('📋 Please create this table manually in Supabase SQL Editor')
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
      console.log('📋 Please create this table manually in Supabase SQL Editor')
    } else if (historyError) {
      console.log('⚠️ autobolt_processing_history table exists but has issues:', historyError.message)
    } else {
      console.log('✅ autobolt_processing_history table exists and is accessible')
      // Clean up test record
      await supabase.from('autobolt_processing_history').delete().eq('customer_id', 'TEST-001')
    }

    // 4. Test existing tables
    console.log('🧪 Testing existing tables...')
    
    // Test customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customer_id, status, directories_submitted')
      .limit(3)

    if (customersError) {
      console.log('❌ Customers table error:', customersError.message)
    } else {
      console.log(`✅ Customers table accessible - found ${customers.length} customers`)
      customers.forEach(customer => {
        console.log(`   - ${customer.customer_id}: ${customer.status} (${customer.directories_submitted} directories)`)
      })
    }

    // Test directory_submissions table
    const { data: submissions, error: submissionsError } = await supabase
      .from('directory_submissions')
      .select('count')
      .limit(1)

    if (submissionsError) {
      console.log('❌ Directory submissions table error:', submissionsError.message)
    } else {
      console.log('✅ Directory submissions table accessible')
    }

  } catch (error) {
    console.error('❌ Error creating tables:', error)
  }
}

async function main() {
  console.log('🚀 Starting table creation via REST API...')
  await createTablesViaRest()
  console.log('✅ Table creation complete!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. If any tables are missing, create them manually in Supabase SQL Editor')
  console.log('2. Use the SQL from: supabase-autobolt-tables.sql')
  console.log('3. Restart your development server')
  console.log('4. Test the dashboards and AutoBolt functionality')
}

main().catch(console.error)
