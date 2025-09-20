// Manual table creation instructions and verification
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

async function verifyTables() {
  console.log('🔍 Verifying AutoBolt tables...')
  
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

  return allTablesExist
}

async function testExistingFunctionality() {
  console.log('🧪 Testing existing functionality...')
  
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
      
      if (data.data?.queue) {
        data.data.queue.forEach(customer => {
          console.log(`   - ${customer.customer_id}: ${customer.status} (${customer.directories_submitted}/${customer.directories_allocated})`)
        })
      }
    } else {
      console.log('❌ Staff queue API failed:', response.status)
    }

    // Test staff analytics API
    const analyticsResponse = await fetch('http://localhost:3000/api/staff/analytics', {
      headers: {
        'Authorization': 'Bearer DirectoryBolt-Staff-2025-SecureKey'
      }
    })
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json()
      console.log('✅ Staff analytics API working')
      console.log(`📊 Total customers: ${analyticsData.data?.overview?.total_customers || 0}`)
    } else {
      console.log('❌ Staff analytics API failed:', analyticsResponse.status)
    }

  } catch (error) {
    console.log('❌ API test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Verifying AutoBolt setup...')
  
  const tablesExist = await verifyTables()
  
  if (!tablesExist) {
    console.log('')
    console.log('📋 MANUAL STEPS REQUIRED:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase-autobolt-tables.sql')
    console.log('4. Click "Run" to execute the SQL')
    console.log('5. Verify tables are created successfully')
    console.log('')
    console.log('📄 SQL file location: supabase-autobolt-tables.sql')
  } else {
    console.log('✅ All AutoBolt tables exist!')
  }

  console.log('')
  await testExistingFunctionality()
  
  console.log('')
  console.log('🎯 NEXT STEPS:')
  console.log('1. Create missing tables in Supabase (if any)')
  console.log('2. Restart development server: npm run dev')
  console.log('3. Test dashboard authentication')
  console.log('4. Test Push to AutoBolt functionality')
}

main().catch(console.error)
