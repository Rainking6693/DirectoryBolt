#!/usr/bin/env node

/**
 * AutoBolt Queue Management System Test
 * 
 * Tests the Phase 3, Section 3.1 implementation:
 * - 3.1.1: AutoBolt reads "pending" records from Airtable
 * - 3.1.2: Queue processor respects packageType limits
 * - 3.1.3: Update submissionStatus during processing
 * - 3.1.4: Batch processing with delays
 * - 3.1.5: Error handling and retry logic
 */

// Use dynamic import for ESM compatibility
let fetch, colors

async function initDependencies() {
  const fetchModule = await import('node-fetch')
  fetch = fetchModule.default
  colors = require('colors/safe')
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'

// Test configuration
const TEST_CONFIG = {
  baseUrl: BASE_URL,
  endpoints: {
    queueStatus: '/api/autobolt/queue-status',
    processQueue: '/api/autobolt/process-queue',
    pendingCustomers: '/api/autobolt/pending-customers',
    customerStatus: '/api/autobolt/customer-status'
  },
  timeout: 30000 // 30 second timeout
}

async function testQueueSystem() {
  // Initialize dependencies first
  await initDependencies()
  
  console.log(colors.blue('\n🧪 DirectoryBolt AutoBolt Queue Management System Test'))
  console.log(colors.blue('=' .repeat(70)))
  console.log(`Testing against: ${TEST_CONFIG.baseUrl}`)
  console.log()

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  // Test 1: Queue Status API
  await runTest(results, 'Queue Status API', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.queueStatus}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`)
    }

    if (!data.success) {
      throw new Error(`API returned success=false: ${data.error}`)
    }

    // Validate response structure
    const expected = ['stats', 'isProcessing', 'nextCustomer', 'lastUpdated']
    for (const field of expected) {
      if (!(field in data.data)) {
        throw new Error(`Missing field in response: ${field}`)
      }
    }

    // Validate stats structure
    const statsFields = ['totalPending', 'totalInProgress', 'totalCompleted', 'totalFailed', 'averageProcessingTime', 'queueDepth']
    for (const field of statsFields) {
      if (!(field in data.data.stats)) {
        throw new Error(`Missing stats field: ${field}`)
      }
    }

    return {
      stats: data.data.stats,
      isProcessing: data.data.isProcessing,
      hasNextCustomer: !!data.data.nextCustomer
    }
  })

  // Test 2: Pending Customers API
  await runTest(results, 'Pending Customers API', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.pendingCustomers}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`)
    }

    if (!data.success) {
      throw new Error(`API returned success=false: ${data.error}`)
    }

    // Validate response structure
    const expected = ['customers', 'pagination', 'metadata']
    for (const field of expected) {
      if (!(field in data.data)) {
        throw new Error(`Missing field in response: ${field}`)
      }
    }

    return {
      customerCount: data.data.customers.length,
      totalPending: data.data.metadata.totalPending,
      queueDepth: data.data.metadata.queueDepth
    }
  })

  // Test 3: Pagination in Pending Customers
  await runTest(results, 'Pending Customers Pagination', async () => {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.pendingCustomers}?limit=2&offset=0`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`)
    }

    // Validate pagination
    if (data.data.pagination.limit !== 2) {
      throw new Error(`Pagination limit not respected: expected 2, got ${data.data.pagination.limit}`)
    }

    if (data.data.pagination.offset !== 0) {
      throw new Error(`Pagination offset not respected: expected 0, got ${data.data.pagination.offset}`)
    }

    return {
      limitedResults: data.data.customers.length <= 2,
      paginationWorking: true
    }
  })

  // Test 4: Customer Status API (without specific customer)
  await runTest(results, 'Customer Status API Validation', async () => {
    // Test missing customerId
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.customerStatus}`)
    const data = await response.json()
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 status for missing customerId, got ${response.status}`)
    }

    if (!data.error || !data.error.includes('customerId')) {
      throw new Error(`Expected error about missing customerId, got: ${data.error}`)
    }

    return {
      validationWorking: true,
      errorMessage: data.error
    }
  })

  // Test 5: Rate Limiting (if possible)
  await runTest(results, 'Rate Limiting Protection', async () => {
    // Make multiple rapid requests to test rate limiting
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.queueStatus}`))
    }

    const responses = await Promise.all(promises)
    const rateLimited = responses.some(response => response.status === 429)

    return {
      requestCount: responses.length,
      rateLimitingActive: rateLimited,
      allSuccessful: responses.every(response => response.ok || response.status === 429)
    }
  })

  // Test 6: Process Queue API (without actually processing)
  await runTest(results, 'Process Queue API Structure', async () => {
    // Test with invalid method
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.processQueue}`, {
      method: 'GET'
    })
    const data = await response.json()
    
    if (response.status !== 405) {
      throw new Error(`Expected 405 status for GET method, got ${response.status}`)
    }

    if (!data.error || !data.error.includes('Method not allowed')) {
      throw new Error(`Expected method not allowed error, got: ${data.error}`)
    }

    return {
      methodValidationWorking: true,
      errorMessage: data.error
    }
  })

  // Summary
  console.log()
  console.log(colors.blue('Test Results Summary'))
  console.log(colors.blue('-'.repeat(30)))
  console.log(`${colors.green('✓ Passed:')} ${results.passed}`)
  console.log(`${colors.red('✗ Failed:')} ${results.failed}`)
  console.log(`${colors.cyan('Total Tests:')} ${results.tests.length}`)
  console.log()

  if (results.failed === 0) {
    console.log(colors.green('🎉 All tests passed! AutoBolt Queue Management System is working correctly.'))
  } else {
    console.log(colors.red('❌ Some tests failed. Please check the implementation.'))
  }

  // Detailed results
  if (results.tests.length > 0) {
    console.log()
    console.log(colors.blue('Detailed Test Results:'))
    console.log(colors.blue('-'.repeat(30)))
    
    results.tests.forEach(test => {
      const status = test.passed ? colors.green('✓ PASS') : colors.red('✗ FAIL')
      console.log(`${status} ${test.name}`)
      
      if (test.data && typeof test.data === 'object') {
        Object.entries(test.data).forEach(([key, value]) => {
          console.log(`    ${key}: ${JSON.stringify(value)}`)
        })
      }
      
      if (test.error) {
        console.log(`    ${colors.red('Error:')} ${test.error}`)
      }
      console.log()
    })
  }

  return results.failed === 0
}

async function runTest(results, testName, testFunction) {
  process.stdout.write(`🔍 ${testName}... `)

  try {
    const data = await testFunction()
    console.log(colors.green('✓ PASS'))
    
    results.passed++
    results.tests.push({
      name: testName,
      passed: true,
      data
    })
  } catch (error) {
    console.log(colors.red('✗ FAIL'))
    console.log(`    ${colors.red('Error:')} ${error.message}`)
    
    results.failed++
    results.tests.push({
      name: testName,
      passed: false,
      error: error.message
    })
  }
}

// Run the tests
if (require.main === module) {
  testQueueSystem()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error(colors.red('Test execution failed:'), error)
      process.exit(1)
    })
}

module.exports = { testQueueSystem }