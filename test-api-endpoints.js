#!/usr/bin/env node

/**
 * Test script to verify DirectoryBolt API endpoints are working correctly
 */

const testApiEndpoints = async () => {
  console.log('🧪 Testing DirectoryBolt API Endpoints...\n')

  // Test 1: Jobs Update Endpoint
  console.log('1. Testing /api/jobs/update endpoint...')
  try {
    const jobsUpdateResponse = await fetch('http://localhost:3000/api/jobs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: 'test-job-id',
        status: 'pending'
      })
    })
    
    console.log(`   Status: ${jobsUpdateResponse.status}`)
    console.log(`   Response: ${await jobsUpdateResponse.text()}\n`)
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }

  // Test 2: AutoBolt Queue Endpoint
  console.log('2. Testing /api/autobolt/queue endpoint...')
  try {
    const autoboltQueueResponse = await fetch('http://localhost:3000/api/autobolt/queue')
    console.log(`   Status: ${autoboltQueueResponse.status}`)
    const data = await autoboltQueueResponse.json()
    console.log(`   Success: ${data.success}`)
    console.log(`   Jobs Count: ${data.data?.queueItems?.length || 0}\n`)
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }

  // Test 3: Staff AutoBolt Queue Endpoint
  console.log('3. Testing /api/staff/autobolt-queue endpoint...')
  try {
    const staffAutoboltQueueResponse = await fetch('http://localhost:3000/api/staff/autobolt-queue')
    console.log(`   Status: ${staffAutoboltQueueResponse.status}`)
    const data = await staffAutoboltQueueResponse.json()
    console.log(`   Success: ${data.success}`)
    console.log(`   Jobs Count: ${data.data?.queueItems?.length || 0}\n`)
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }

  // Test 4: Submission Logs Endpoint
  console.log('4. Testing /api/staff/submission-logs endpoint...')
  try {
    const submissionLogsResponse = await fetch('http://localhost:3000/api/staff/submission-logs')
    console.log(`   Status: ${submissionLogsResponse.status}`)
    const data = await submissionLogsResponse.json()
    console.log(`   Success: ${data.success}`)
    console.log(`   Logs Count: ${data.data?.length || 0}\n`)
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }

  // Test 5: Staff Auth Check Endpoint
  console.log('5. Testing /api/staff/auth-check endpoint...')
  try {
    const authCheckResponse = await fetch('http://localhost:3000/api/staff/auth-check')
    console.log(`   Status: ${authCheckResponse.status}`)
    const data = await authCheckResponse.json()
    console.log(`   Authenticated: ${data.authenticated}\n`)
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }

  console.log('✅ API endpoint tests completed!')
}

// Run the tests
testApiEndpoints().catch(console.error)
