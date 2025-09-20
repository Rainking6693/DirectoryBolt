// Simple AutoBolt setup - create tables and fix customer status
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
    // Create autobolt_processing_queue table using direct SQL
    const { error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .select('*')
      .limit(1)

    if (queueError && queueError.message.includes('Could not find the table')) {
      console.log('📝 AutoBolt processing queue table does not exist - needs to be created manually in Supabase')
    } else {
      console.log('✅ AutoBolt processing queue table exists')
    }

    // Create directory_submissions table check
    const { error: submissionsError } = await supabase
      .from('directory_submissions')
      .select('*')
      .limit(1)

    if (submissionsError && submissionsError.message.includes('Could not find the table')) {
      console.log('📝 Directory submissions table does not exist - needs to be created manually in Supabase')
    } else {
      console.log('✅ Directory submissions table exists')
    }

    // Create autobolt_extension_status table check
    const { error: extensionError } = await supabase
      .from('autobolt_extension_status')
      .select('*')
      .limit(1)

    if (extensionError && extensionError.message.includes('Could not find the table')) {
      console.log('📝 AutoBolt extension status table does not exist - needs to be created manually in Supabase')
    } else {
      console.log('✅ AutoBolt extension status table exists')
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

async function fixCustomerStatus() {
  console.log('🔧 Fixing customer status...')
  
  try {
    // Get all customers
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('customer_id, status, directories_submitted')

    if (fetchError) {
      console.log('❌ Failed to fetch customers:', fetchError.message)
      return
    }

    console.log(`📊 Found ${customers.length} customers`)
    
    // Update customers with directories_submitted = 0 to status 'pending'
    const customersToUpdate = customers.filter(c => c.directories_submitted === 0)
    
    if (customersToUpdate.length > 0) {
      console.log(`🔄 Updating ${customersToUpdate.length} customers to 'pending' status`)
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .in('customer_id', customersToUpdate.map(c => c.customer_id))

      if (updateError) {
        console.log('❌ Failed to update customer status:', updateError.message)
      } else {
        console.log('✅ Updated customer status to pending')
      }
    } else {
      console.log('✅ No customers need status updates')
    }

  } catch (error) {
    console.error('❌ Error fixing customer status:', error)
  }
}

async function testAPIs() {
  console.log('🧪 Testing APIs...')
  
  try {
    // Test staff queue API
    const response = await fetch('http://localhost:3000/api/staff/queue', {
      headers: {
        'Authorization': 'Bearer DirectoryBolt-Staff-2025-SecureKey'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Staff queue API working')
      console.log(`📊 Found ${data.data?.queue?.length || 0} customers in queue`)
    } else {
      console.log('❌ Staff queue API failed:', response.status)
    }

  } catch (error) {
    console.log('❌ API test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting AutoBolt setup...')
  
  await createAutoBoltTables()
  await fixCustomerStatus()
  await testAPIs()
  
  console.log('✅ AutoBolt setup complete!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. Create AutoBolt tables manually in Supabase SQL editor')
  console.log('2. Fix authentication on dashboards')
  console.log('3. Test the push to AutoBolt functionality')
}

main().catch(console.error)
