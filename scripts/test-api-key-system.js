// 🔒 JORDAN'S API KEY SYSTEM TESTS - Comprehensive testing for database-backed API key management
// Run this script to test all API key functionality

const { createClient } = require('@supabase/supabase-js')
const { createHash } = require('crypto')
require('dotenv').config()

// Test configuration
const TEST_CONFIG = {
  TEST_USER_ID: 'test_user_' + Date.now(),
  TEST_API_KEY_ID: 'ak_test_' + Date.now(),
  TEST_KEY_HASH: '',
  BASE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

class ApiKeySystemTester {
  constructor() {
    if (!TEST_CONFIG.SUPABASE_URL || !TEST_CONFIG.SUPABASE_KEY) {
      throw new Error('Missing Supabase configuration')
    }
    
    this.supabase = createClient(
      TEST_CONFIG.SUPABASE_URL,
      TEST_CONFIG.SUPABASE_KEY
    )
    
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋'
    
    console.log(\`[\${timestamp}] \${prefix} \${message}\`)
  }

  async test(testName, testFunction) {
    try {
      this.log(\`Testing: \${testName}\`)
      await testFunction()
      this.testResults.passed++
      this.log(\`✅ \${testName} - PASSED\`, 'success')
    } catch (error) {
      this.testResults.failed++
      this.testResults.errors.push(\`\${testName}: \${error.message}\`)
      this.log(\`❌ \${testName} - FAILED: \${error.message}\`, 'error')
    }
  }

  async setupTestData() {
    this.log('Setting up test data...')
    
    try {
      // Create a test user (if users table exists)
      const testUser = {
        id: TEST_CONFIG.TEST_USER_ID,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        subscription_tier: 'professional',
        credits_remaining: 50,
        is_verified: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date(),
        directories_used_this_period: 10,
        directory_limit: 100
      }

      // Try to insert test user (may fail if users table doesn't exist, that's OK)
      try {
        await this.supabase.from('users').insert(testUser)
        this.log('Test user created')
      } catch (error) {
        this.log('Could not create test user (users table may not exist)', 'warning')
      }

      // Generate test API key hash
      const plainKey = 'db_test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 32)
      TEST_CONFIG.TEST_KEY_HASH = createHash('sha256').update(plainKey).digest('hex')
      
      this.log('Test data setup completed')
      
    } catch (error) {
      this.log(\`Failed to setup test data: \${error.message}\`, 'error')
      throw error
    }
  }

  async testDatabaseSchema() {
    await this.test('Database Schema Validation', async () => {
      // Test api_keys table exists and has correct structure
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .limit(0)

      if (error) throw new Error(\`api_keys table not accessible: \${error.message}\`)

      // Test other tables exist
      const tables = [
        'api_key_ip_whitelist',
        'api_key_referrer_whitelist', 
        'api_key_usage',
        'api_key_security_log'
      ]

      for (const table of tables) {
        const { error: tableError } = await this.supabase
          .from(table)
          .select('*')
          .limit(0)
        
        if (tableError) throw new Error(\`\${table} table not accessible: \${tableError.message}\`)
      }
    })
  }

  async testApiKeyCreation() {
    await this.test('API Key Creation', async () => {
      const testApiKey = {
        id: TEST_CONFIG.TEST_API_KEY_ID,
        user_id: TEST_CONFIG.TEST_USER_ID,
        key_hash: TEST_CONFIG.TEST_KEY_HASH,
        name: 'Test API Key',
        description: 'Test key for validation',
        permissions: ['read_directories', 'create_submissions'],
        is_active: true,
        rate_limit_per_hour: 100,
        requests_made_today: 0,
        created_from_ip: '127.0.0.1',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }

      const { error } = await this.supabase
        .from('api_keys')
        .insert(testApiKey)

      if (error) throw new Error(\`Failed to create API key: \${error.message}\`)
    })
  }

  async testApiKeyRetrieval() {
    await this.test('API Key Retrieval by Hash', async () => {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', TEST_CONFIG.TEST_KEY_HASH)
        .single()

      if (error) throw new Error(\`Failed to retrieve API key: \${error.message}\`)
      if (!data) throw new Error('API key not found')
      if (data.id !== TEST_CONFIG.TEST_API_KEY_ID) throw new Error('Retrieved wrong API key')
    })

    await this.test('API Key Retrieval by ID', async () => {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('id', TEST_CONFIG.TEST_API_KEY_ID)
        .single()

      if (error) throw new Error(\`Failed to retrieve API key by ID: \${error.message}\`)
      if (!data) throw new Error('API key not found by ID')
    })

    await this.test('API Key Retrieval by User ID', async () => {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', TEST_CONFIG.TEST_USER_ID)

      if (error) throw new Error(\`Failed to retrieve API keys by user: \${error.message}\`)
      if (!data || data.length === 0) throw new Error('No API keys found for user')
    })
  }

  async testWhitelistFunctionality() {
    await this.test('IP Whitelist Creation', async () => {
      const ipWhitelist = [
        {
          id: 'ip_test_' + Date.now(),
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          ip_address: '192.168.1.100',
          created_at: new Date()
        },
        {
          id: 'ip_test_' + Date.now() + '_2',
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          ip_address: '10.0.0.0/8',
          created_at: new Date()
        }
      ]

      const { error } = await this.supabase
        .from('api_key_ip_whitelist')
        .insert(ipWhitelist)

      if (error) throw new Error(\`Failed to create IP whitelist: \${error.message}\`)
    })

    await this.test('Referrer Whitelist Creation', async () => {
      const referrerWhitelist = [
        {
          id: 'ref_test_' + Date.now(),
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          referrer_domain: 'example.com',
          created_at: new Date()
        },
        {
          id: 'ref_test_' + Date.now() + '_2',
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          referrer_domain: 'trusted-domain.org',
          created_at: new Date()
        }
      ]

      const { error } = await this.supabase
        .from('api_key_referrer_whitelist')
        .insert(referrerWhitelist)

      if (error) throw new Error(\`Failed to create referrer whitelist: \${error.message}\`)
    })

    await this.test('Whitelist Retrieval', async () => {
      const { data: ipData, error: ipError } = await this.supabase
        .from('api_key_ip_whitelist')
        .select('ip_address')
        .eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)

      if (ipError) throw new Error(\`Failed to retrieve IP whitelist: \${ipError.message}\`)
      if (!ipData || ipData.length === 0) throw new Error('No IP whitelist entries found')

      const { data: refData, error: refError } = await this.supabase
        .from('api_key_referrer_whitelist')
        .select('referrer_domain')
        .eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)

      if (refError) throw new Error(\`Failed to retrieve referrer whitelist: \${refError.message}\`)
      if (!refData || refData.length === 0) throw new Error('No referrer whitelist entries found')
    })
  }

  async testUsageTracking() {
    await this.test('Usage Record Creation', async () => {
      const usageRecords = [
        {
          id: 'usage_test_' + Date.now(),
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          timestamp: new Date(),
          endpoint: '/api/directories',
          method: 'GET',
          ip_address: '192.168.1.100',
          user_agent: 'Test User Agent',
          response_status: 200,
          processing_time_ms: 150,
          rate_limit_hit: false,
          created_at: new Date()
        },
        {
          id: 'usage_test_' + Date.now() + '_2',
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          timestamp: new Date(),
          endpoint: '/api/submissions',
          method: 'POST',
          ip_address: '192.168.1.100',
          response_status: 201,
          processing_time_ms: 300,
          rate_limit_hit: false,
          created_at: new Date()
        }
      ]

      const { error } = await this.supabase
        .from('api_key_usage')
        .insert(usageRecords)

      if (error) throw new Error(\`Failed to create usage records: \${error.message}\`)
    })

    await this.test('Usage Statistics Calculation', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await this.supabase
        .from('api_key_usage')
        .select('id', { count: 'exact' })
        .eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)
        .gte('timestamp', today.toISOString())

      if (error) throw new Error(\`Failed to calculate usage statistics: \${error.message}\`)
      if (!data || data.length < 2) throw new Error('Usage statistics calculation failed')
    })
  }

  async testSecurityLogging() {
    await this.test('Security Event Logging', async () => {
      const securityEvents = [
        {
          id: 'sec_test_' + Date.now(),
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          event_type: 'creation',
          ip_address: '127.0.0.1',
          metadata: { test: true, created_by: 'test_script' },
          created_at: new Date()
        },
        {
          id: 'sec_test_' + Date.now() + '_2',
          api_key_id: TEST_CONFIG.TEST_API_KEY_ID,
          event_type: 'violation',
          violation_type: 'rate_limit',
          ip_address: '192.168.1.100',
          metadata: { limit_exceeded: true, requests: 150 },
          created_at: new Date()
        }
      ]

      const { error } = await this.supabase
        .from('api_key_security_log')
        .insert(securityEvents)

      if (error) throw new Error(\`Failed to create security logs: \${error.message}\`)
    })

    await this.test('Security Log Retrieval', async () => {
      const { data, error } = await this.supabase
        .from('api_key_security_log')
        .select('*')
        .eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)
        .order('created_at', { ascending: false })

      if (error) throw new Error(\`Failed to retrieve security logs: \${error.message}\`)
      if (!data || data.length === 0) throw new Error('No security logs found')
    })
  }

  async testApiKeyUpdates() {
    await this.test('API Key Updates', async () => {
      const { error } = await this.supabase
        .from('api_keys')
        .update({ 
          last_used_at: new Date(),
          requests_made_today: 5,
          updated_at: new Date()
        })
        .eq('id', TEST_CONFIG.TEST_API_KEY_ID)

      if (error) throw new Error(\`Failed to update API key: \${error.message}\`)

      // Verify update
      const { data, error: fetchError } = await this.supabase
        .from('api_keys')
        .select('requests_made_today')
        .eq('id', TEST_CONFIG.TEST_API_KEY_ID)
        .single()

      if (fetchError) throw new Error(\`Failed to verify update: \${fetchError.message}\`)
      if (data.requests_made_today !== 5) throw new Error('Update verification failed')
    })
  }

  async testApiKeyDeactivation() {
    await this.test('API Key Deactivation', async () => {
      const { error } = await this.supabase
        .from('api_keys')
        .update({ 
          is_active: false,
          updated_at: new Date()
        })
        .eq('id', TEST_CONFIG.TEST_API_KEY_ID)

      if (error) throw new Error(\`Failed to deactivate API key: \${error.message}\`)

      // Verify deactivation
      const { data, error: fetchError } = await this.supabase
        .from('api_keys')
        .select('is_active')
        .eq('id', TEST_CONFIG.TEST_API_KEY_ID)
        .single()

      if (fetchError) throw new Error(\`Failed to verify deactivation: \${fetchError.message}\`)
      if (data.is_active !== false) throw new Error('Deactivation verification failed')
    })
  }

  async testIndexPerformance() {
    await this.test('Index Performance Check', async () => {
      // Test that indexes are working by doing fast lookups
      const start = Date.now()
      
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('id')
        .eq('key_hash', TEST_CONFIG.TEST_KEY_HASH)
        .single()

      const queryTime = Date.now() - start
      
      if (error && !error.message.includes('multiple')) {
        throw new Error(\`Index performance test failed: \${error.message}\`)
      }
      
      if (queryTime > 1000) {
        throw new Error(\`Query too slow (\${queryTime}ms) - indexes may not be working\`)
      }
    })
  }

  async cleanupTestData() {
    this.log('Cleaning up test data...')
    
    try {
      // Delete in reverse order due to foreign key constraints
      await this.supabase.from('api_key_security_log').delete().eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)
      await this.supabase.from('api_key_usage').delete().eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)
      await this.supabase.from('api_key_referrer_whitelist').delete().eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)
      await this.supabase.from('api_key_ip_whitelist').delete().eq('api_key_id', TEST_CONFIG.TEST_API_KEY_ID)
      await this.supabase.from('api_keys').delete().eq('id', TEST_CONFIG.TEST_API_KEY_ID)
      
      // Try to delete test user (may fail if foreign key constraints exist)
      try {
        await this.supabase.from('users').delete().eq('id', TEST_CONFIG.TEST_USER_ID)
      } catch (error) {
        this.log('Could not delete test user (may have foreign key constraints)', 'warning')
      }
      
      this.log('Test data cleanup completed')
      
    } catch (error) {
      this.log(\`Failed to cleanup test data: \${error.message}\`, 'warning')
    }
  }

  async runAllTests() {
    this.log('🚀 Starting API Key System Tests', 'info')
    this.log(\`Test Configuration:
      - Test User ID: \${TEST_CONFIG.TEST_USER_ID}
      - Test API Key ID: \${TEST_CONFIG.TEST_API_KEY_ID}
      - Supabase URL: \${TEST_CONFIG.SUPABASE_URL}\`)

    try {
      await this.setupTestData()
      
      // Run all tests
      await this.testDatabaseSchema()
      await this.testApiKeyCreation()
      await this.testApiKeyRetrieval()
      await this.testWhitelistFunctionality()
      await this.testUsageTracking()
      await this.testSecurityLogging()
      await this.testApiKeyUpdates()
      await this.testApiKeyDeactivation()
      await this.testIndexPerformance()
      
    } finally {
      await this.cleanupTestData()
    }

    // Print results
    this.log('', 'info')
    this.log('🎯 TEST RESULTS', 'info')
    this.log(\`✅ Passed: \${this.testResults.passed}\`, 'success')
    this.log(\`❌ Failed: \${this.testResults.failed}\`, this.testResults.failed > 0 ? 'error' : 'info')
    
    if (this.testResults.errors.length > 0) {
      this.log('', 'info')
      this.log('📋 FAILED TESTS:', 'error')
      this.testResults.errors.forEach(error => this.log(\`   - \${error}\`, 'error'))
    }

    if (this.testResults.failed === 0) {
      this.log('', 'info')
      this.log('🎉 ALL TESTS PASSED! API Key system is ready for production.', 'success')
    } else {
      this.log('', 'info')
      this.log('⚠️  Some tests failed. Please review and fix issues before deploying.', 'error')
      process.exit(1)
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new ApiKeySystemTester()
  tester.runAllTests().catch(error => {
    console.error('❌ Fatal error during testing:', error.message)
    process.exit(1)
  })
}

module.exports = { ApiKeySystemTester, TEST_CONFIG }