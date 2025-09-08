/**
 * DirectoryBolt Extension Authentication Debug Script
 * 
 * This script helps debug extension authentication issues by:
 * 1. Creating test customers in the database
 * 2. Testing the validation API with different customer ID formats
 * 3. Providing detailed error information
 * 
 * Run this in the browser console on directorybolt.com
 */

class ExtensionAuthDebugger {
  constructor() {
    this.baseUrl = 'https://directorybolt.com'
    this.testCustomers = [
      'DB-2025-TEST01',
      'db-2025-test01',
      ' DB-2025-TEST01 ',
      'DB-2025-TEST02',
      'DIR-2025-TEST03'
    ]
  }

  async log(message, data = null) {
    console.log(`🔍 ${message}`, data || '')
    if (data) {
      console.table(data)
    }
  }

  async createTestCustomers() {
    this.log('Creating test customers...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/extension/create-test-customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        this.log('✅ Test customers created successfully', data.summary)
        return data
      } else {
        this.log('❌ Failed to create test customers', data)
        return data
      }
    } catch (error) {
      this.log('❌ Error creating test customers', error.message)
      return { error: error.message }
    }
  }

  async testValidation(customerId) {
    this.log(`Testing validation for: ${customerId}`)
    
    try {
      const response = await fetch(`${this.baseUrl}/api/extension/validate-fixed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          extensionVersion: '1.0.0',
          timestamp: Date.now()
        })
      })
      
      const data = await response.json()
      
      if (data.valid) {
        this.log(`✅ Validation successful for ${customerId}`, {
          customerName: data.customerName,
          packageType: data.packageType
        })
      } else {
        this.log(`❌ Validation failed for ${customerId}`, {
          error: data.error,
          debug: data.debug
        })
      }
      
      return data
    } catch (error) {
      this.log(`❌ Error validating ${customerId}`, error.message)
      return { error: error.message }
    }
  }

  async testDebug(customerId) {
    this.log(`Getting debug info for: ${customerId}`)
    
    try {
      const response = await fetch(`${this.baseUrl}/api/extension/debug-validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerId })
      })
      
      const data = await response.json()
      this.log(`Debug info for ${customerId}`, data)
      return data
    } catch (error) {
      this.log(`❌ Error getting debug info for ${customerId}`, error.message)
      return { error: error.message }
    }
  }

  async runFullTest() {
    this.log('🚀 Starting full extension authentication test...')
    
    // Step 1: Create test customers
    const createResult = await this.createTestCustomers()
    
    // Step 2: Test validation for each customer ID variation
    const validationResults = []
    
    for (const customerId of this.testCustomers) {
      const result = await this.testValidation(customerId)
      validationResults.push({
        customerId,
        valid: result.valid,
        error: result.error,
        customerName: result.customerName,
        packageType: result.packageType
      })
    }
    
    // Step 3: Get debug info for the main test customer
    const debugResult = await this.testDebug('DB-2025-TEST01')
    
    // Summary
    const successCount = validationResults.filter(r => r.valid).length
    
    this.log('📊 Test Summary', {
      totalTests: this.testCustomers.length,
      successful: successCount,
      failed: this.testCustomers.length - successCount,
      successRate: `${Math.round((successCount / this.testCustomers.length) * 100)}%`
    })
    
    this.log('📋 Detailed Results')
    console.table(validationResults)
    
    if (successCount === 0) {
      this.log('🚨 ALL TESTS FAILED - Extension authentication is broken')
      this.log('Debug information:', debugResult)
    } else if (successCount < this.testCustomers.length) {
      this.log('⚠️ SOME TESTS FAILED - Extension authentication has issues')
    } else {
      this.log('✅ ALL TESTS PASSED - Extension authentication is working')
    }
    
    return {
      createResult,
      validationResults,
      debugResult,
      summary: {
        totalTests: this.testCustomers.length,
        successful: successCount,
        failed: this.testCustomers.length - successCount
      }
    }
  }

  // Quick test method for immediate debugging
  async quickTest() {
    this.log('⚡ Running quick test...')
    
    // Test the main customer ID
    const result = await this.testValidation('DB-2025-TEST01')
    
    if (result.valid) {
      this.log('✅ Quick test PASSED - Extension should work')
    } else {
      this.log('❌ Quick test FAILED - Extension authentication broken')
      this.log('Error details:', result)
      
      // Get debug info
      const debug = await this.testDebug('DB-2025-TEST01')
      this.log('Debug info:', debug)
    }
    
    return result
  }
}

// Create global debugger instance
window.extensionDebugger = new ExtensionAuthDebugger()

// Auto-run quick test
console.log('🔧 DirectoryBolt Extension Authentication Debugger loaded!')
console.log('Available commands:')
console.log('  extensionDebugger.quickTest() - Run quick authentication test')
console.log('  extensionDebugger.runFullTest() - Run comprehensive test suite')
console.log('  extensionDebugger.createTestCustomers() - Create test customers')
console.log('  extensionDebugger.testValidation("DB-2025-TEST01") - Test specific customer ID')

// Run quick test automatically
window.extensionDebugger.quickTest().then(result => {
  if (!result.valid) {
    console.log('🚨 Extension authentication is currently broken. Run extensionDebugger.runFullTest() for detailed analysis.')
  }
})