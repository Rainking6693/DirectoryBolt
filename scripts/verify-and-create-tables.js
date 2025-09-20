// Verify and create AutoBolt tables
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

async function testAutoBoltAPIs() {
  console.log('🧪 Testing AutoBolt APIs...')
  
  try {
    // Test get-next-customer API
    const response = await fetch('http://localhost:3000/api/autobolt/get-next-customer?extension_id=TEST-EXT-001')
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ AutoBolt get-next-customer API working')
      console.log(`📊 Has customer: ${data.has_customer}`)
    } else {
      console.log('❌ AutoBolt get-next-customer API failed:', response.status)
    }

    // Test update-progress API
    const progressResponse = await fetch('http://localhost:3000/api/autobolt/update-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        extension_id: 'TEST-EXT-001',
        queue_id: 'test-queue-id',
        customer_id: 'TEST-001',
        directory_name: 'Test Directory',
        submission_status: 'submitted'
      })
    })
    
    if (progressResponse.ok) {
      const progressData = await progressResponse.json()
      console.log('✅ AutoBolt update-progress API working')
    } else {
      console.log('❌ AutoBolt update-progress API failed:', progressResponse.status)
    }

    // Test heartbeat API
    const heartbeatResponse = await fetch('http://localhost:3000/api/autobolt/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        extension_id: 'TEST-EXT-001',
        status: 'online'
      })
    })
    
    if (heartbeatResponse.ok) {
      const heartbeatData = await heartbeatResponse.json()
      console.log('✅ AutoBolt heartbeat API working')
    } else {
      console.log('❌ AutoBolt heartbeat API failed:', heartbeatResponse.status)
    }

  } catch (error) {
    console.log('❌ AutoBolt API test failed:', error.message)
  }
}

async function testPushToAutoBolt() {
  console.log('🧪 Testing Push to AutoBolt...')
  
  try {
    const response = await fetch('http://localhost:3000/api/staff/push-to-autobolt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer DirectoryBolt-Staff-2025-SecureKey'
      },
      body: JSON.stringify({
        customer_id: 'DIR-20250918-700000'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Push to AutoBolt working')
      console.log(`📊 Customer pushed: ${data.customer_id}`)
    } else {
      const errorData = await response.json()
      console.log('❌ Push to AutoBolt failed:', errorData.message)
    }

  } catch (error) {
    console.log('❌ Push to AutoBolt test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting AutoBolt integration verification...')
  
  const tablesExist = await verifyTables()
  
  if (!tablesExist) {
    console.log('')
    console.log('📋 MANUAL STEPS REQUIRED:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase-autobolt-simple.sql')
    console.log('4. Click "Run" to execute the SQL')
    console.log('5. Verify tables are created successfully')
    console.log('')
    console.log('📄 SQL file location: supabase-autobolt-simple.sql')
  } else {
    console.log('✅ All AutoBolt tables exist!')
  }

  console.log('')
  await testAutoBoltAPIs()
  
  console.log('')
  await testPushToAutoBolt()
  
  console.log('')
  console.log('🎯 NEXT STEPS:')
  if (!tablesExist) {
    console.log('1. Create missing tables in Supabase (if any)')
  }
  console.log('2. Test the Chrome extension integration')
  console.log('3. Test end-to-end AutoBolt processing')
}

main().catch(console.error)
