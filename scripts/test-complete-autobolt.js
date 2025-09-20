// Test complete AutoBolt functionality after database setup
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

async function testDatabaseTables() {
  console.log('🔍 Testing AutoBolt database tables...')
  
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
      
      // Verify customer was added to queue
      const { data: queueData, error: queueError } = await supabase
        .from('autobolt_processing_queue')
        .select('*')
        .eq('customer_id', 'DIR-20250918-700000')
        .limit(1)
      
      if (queueError) {
        console.log('❌ Failed to verify customer in queue:', queueError.message)
      } else if (queueData && queueData.length > 0) {
        console.log('✅ Customer successfully added to AutoBolt queue')
        console.log(`📊 Queue ID: ${queueData[0].id}`)
        console.log(`📊 Status: ${queueData[0].status}`)
      } else {
        console.log('⚠️ Customer not found in queue')
      }
      
    } else {
      const errorData = await response.json()
      console.log('❌ Push to AutoBolt failed:', errorData.message)
    }

  } catch (error) {
    console.log('❌ Push to AutoBolt test failed:', error.message)
  }
}

async function testStaffDashboard() {
  console.log('🧪 Testing Staff Dashboard APIs...')
  
  try {
    // Test staff queue API
    const queueResponse = await fetch('http://localhost:3000/api/staff/queue', {
      headers: {
        'Authorization': 'Bearer DirectoryBolt-Staff-2025-SecureKey'
      }
    })
    
    if (queueResponse.ok) {
      const queueData = await queueResponse.json()
      console.log('✅ Staff queue API working')
      console.log(`📊 Found ${queueData.data?.queue?.length || 0} customers in queue`)
    } else {
      console.log('❌ Staff queue API failed:', queueResponse.status)
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

    // Test AutoBolt queue API
    const autoboltQueueResponse = await fetch('http://localhost:3000/api/staff/autobolt-queue', {
      headers: {
        'Authorization': 'Bearer DirectoryBolt-Staff-2025-SecureKey'
      }
    })
    
    if (autoboltQueueResponse.ok) {
      const autoboltQueueData = await autoboltQueueResponse.json()
      console.log('✅ AutoBolt queue API working')
      console.log(`📊 AutoBolt queue items: ${autoboltQueueData.data?.queue_items?.length || 0}`)
    } else {
      console.log('❌ AutoBolt queue API failed:', autoboltQueueResponse.status)
    }

    // Test AutoBolt extensions API
    const extensionsResponse = await fetch('http://localhost:3000/api/staff/autobolt-extensions', {
      headers: {
        'Authorization': 'Bearer DirectoryBolt-Staff-2025-SecureKey'
      }
    })
    
    if (extensionsResponse.ok) {
      const extensionsData = await extensionsResponse.json()
      console.log('✅ AutoBolt extensions API working')
      console.log(`📊 Active extensions: ${extensionsData.data?.length || 0}`)
    } else {
      console.log('❌ AutoBolt extensions API failed:', extensionsResponse.status)
    }

  } catch (error) {
    console.log('❌ Staff dashboard API test failed:', error.message)
  }
}

async function testEndToEndWorkflow() {
  console.log('🔄 Testing End-to-End Workflow...')
  
  try {
    // 1. Get a customer from the queue
    const customerResponse = await fetch('http://localhost:3000/api/autobolt/get-next-customer?extension_id=TEST-EXT-001')
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json()
      
      if (customerData.has_customer) {
        console.log('✅ Customer retrieved from queue')
        console.log(`📊 Customer ID: ${customerData.customer.customer_id}`)
        console.log(`📊 Business: ${customerData.customer.business_name}`)
        console.log(`📊 Package: ${customerData.customer.package_type}`)
        console.log(`📊 Directories: ${customerData.customer.directory_limit}`)
        
        // 2. Simulate processing a directory
        const progressResponse = await fetch('http://localhost:3000/api/autobolt/update-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            extension_id: 'TEST-EXT-001',
            queue_id: customerData.queue_id,
            customer_id: customerData.customer.customer_id,
            directory_name: 'Test Directory Submission',
            submission_status: 'approved',
            listing_url: 'https://test-directory.com/listing',
            processing_time_seconds: 30
          })
        })
        
        if (progressResponse.ok) {
          console.log('✅ Directory submission progress updated')
          
          // 3. Send heartbeat
          const heartbeatResponse = await fetch('http://localhost:3000/api/autobolt/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              extension_id: 'TEST-EXT-001',
              status: 'processing',
              current_customer_id: customerData.customer.customer_id,
              current_queue_id: customerData.queue_id,
              directories_processed: 1,
              directories_failed: 0
            })
          })
          
          if (heartbeatResponse.ok) {
            console.log('✅ Heartbeat sent successfully')
            console.log('🎉 End-to-end workflow test completed successfully!')
          } else {
            console.log('❌ Heartbeat failed:', heartbeatResponse.status)
          }
        } else {
          console.log('❌ Progress update failed:', progressResponse.status)
        }
      } else {
        console.log('📭 No customers in queue for end-to-end test')
      }
    } else {
      console.log('❌ Get next customer failed:', customerResponse.status)
    }

  } catch (error) {
    console.log('❌ End-to-end workflow test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting complete AutoBolt functionality test...')
  
  // Test 1: Database tables
  const tablesExist = await testDatabaseTables()
  
  if (!tablesExist) {
    console.log('')
    console.log('❌ AutoBolt tables are missing!')
    console.log('📋 Please create the tables first using the SQL script')
    console.log('📄 See: AUTOBOLT-DATABASE-SETUP-GUIDE.md')
    return
  }
  
  console.log('')
  
  // Test 2: AutoBolt APIs
  await testAutoBoltAPIs()
  
  console.log('')
  
  // Test 3: Push to AutoBolt
  await testPushToAutoBolt()
  
  console.log('')
  
  // Test 4: Staff Dashboard
  await testStaffDashboard()
  
  console.log('')
  
  // Test 5: End-to-end workflow
  await testEndToEndWorkflow()
  
  console.log('')
  console.log('🎉 AutoBolt functionality test complete!')
  console.log('')
  console.log('📋 NEXT STEPS:')
  console.log('1. Load the Chrome extension in your browser')
  console.log('2. Test the staff dashboard AutoBolt Monitor')
  console.log('3. Push customers to AutoBolt and monitor processing')
  console.log('4. Verify real-time updates in the dashboard')
}

main().catch(console.error)
