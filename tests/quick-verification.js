#!/usr/bin/env node

/**
 * QUICK VERIFICATION SCRIPT
 * Simple script to quickly verify that the userAgent fix is working
 * This can be run immediately after applying the fix for quick validation
 */

const axios = require('axios');

class QuickVerification {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.testResults = [];
    
    console.log('⚡ QUICK USER AGENT FIX VERIFICATION');
    console.log('=' .repeat(60));
    console.log(`🌐 Testing endpoint: ${this.baseUrl}/api/analyze`);
    console.log('=' .repeat(60));
  }

  async runQuickVerification() {
    console.log('\n🔍 Running quick verification tests...\n');

    // Test 1: Basic functionality
    await this.test('Basic endpoint functionality', async () => {
      const response = await this.makeRequest({
        url: 'https://example.com'
      });
      return response.status >= 200 && response.status < 400;
    });

    // Test 2: Custom user agent
    await this.test('Custom User-Agent handling', async () => {
      const response = await this.makeRequest({
        url: 'https://httpbin.org/user-agent'
      }, {
        'User-Agent': 'DirectoryBolt-QuickTest/1.0'
      });
      return response.status >= 200 && response.status < 400;
    });

    // Test 3: Missing user agent  
    await this.test('Missing User-Agent handling', async () => {
      const response = await this.makeRequest({
        url: 'https://example.com'
      }, {
        // No user agent header
      });
      return response.status >= 200 && response.status < 400;
    });

    // Test 4: Invalid URL handling
    await this.test('Invalid URL rejection', async () => {
      const response = await this.makeRequest({
        url: 'not-a-valid-url'
      });
      return response.status === 400; // Should be rejected
    });

    // Test 5: HTTP method validation
    await this.test('HTTP method validation', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/api/analyze`, {
          timeout: 5000,
          validateStatus: () => true
        });
        return response.status === 405; // Method not allowed
      } catch (error) {
        return false;
      }
    });

    this.printSummary();
  }

  async test(name, testFn) {
    const result = {
      name,
      status: 'RUNNING',
      startTime: Date.now(),
      duration: null,
      error: null
    };

    process.stdout.write(`   🔄 ${name}... `);

    try {
      const success = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), 10000)
        )
      ]);

      result.duration = Date.now() - result.startTime;
      result.status = success ? 'PASS' : 'FAIL';

      const icon = success ? '✅' : '❌';
      console.log(`${icon} ${result.status} (${result.duration}ms)`);

    } catch (error) {
      result.duration = Date.now() - result.startTime;
      result.status = 'ERROR';
      result.error = error.message;

      console.log(`💥 ERROR: ${error.message}`);
    }

    this.testResults.push(result);
  }

  async makeRequest(payload, headers = {}) {
    return await axios.post(`${this.baseUrl}/api/analyze`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000,
      validateStatus: () => true // Don't throw on HTTP errors
    });
  }

  printSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const errors = this.testResults.filter(t => t.status === 'ERROR').length;
    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 QUICK VERIFICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`🎯 Success Rate: ${successRate}%`);

    // Assessment
    console.log('\n🔍 ASSESSMENT:');
    if (successRate >= 90) {
      console.log('✅ EXCELLENT: User Agent fix appears to be working correctly!');
      console.log('🎉 Ready for comprehensive testing');
    } else if (successRate >= 70) {
      console.log('⚠️ WARNING: Some issues detected');
      console.log('🔧 User Agent fix may need attention');
    } else {
      console.log('❌ CRITICAL: Major issues with User Agent fix');
      console.log('🚨 Requires immediate investigation');
    }

    // Show failed tests
    const failedTests = this.testResults.filter(t => t.status !== 'PASS');
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.name} - ${test.status}`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    }

    // Next steps
    console.log('\n💡 NEXT STEPS:');
    if (successRate >= 90) {
      console.log('   1. Run comprehensive tests: npm run test:user-agent');
      console.log('   2. Test with real websites in your use case');
      console.log('   3. Deploy to staging environment for integration testing');
    } else {
      console.log('   1. Check server logs for error details');
      console.log('   2. Verify the server is running and accessible');
      console.log('   3. Review the userAgent fix implementation');
      console.log('   4. Run again after making fixes');
    }

    console.log('\n='.repeat(60));

    // Exit with appropriate code
    if (errors > 0 || failed > total / 2) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Check if server is accessible first
async function checkServerAccess(baseUrl) {
  try {
    console.log(`🔍 Checking server accessibility at ${baseUrl}...`);
    
    // Try health endpoint first
    try {
      const response = await axios.get(`${baseUrl}/api/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ Server is accessible and healthy');
        return true;
      }
    } catch (healthError) {
      // Health endpoint might not exist, try analyze endpoint
    }
    
    // Try analyze endpoint with OPTIONS
    try {
      const response = await axios.options(`${baseUrl}/api/analyze`, { timeout: 5000 });
      if (response.status !== 404) {
        console.log('✅ Server is accessible, analyze endpoint found');
        return true;
      }
    } catch (analyzeError) {
      // Endpoint might not support OPTIONS, try a POST
    }

    // Try a simple POST to see if we get a method-related response
    try {
      const response = await axios.post(`${baseUrl}/api/analyze`, {}, { 
        timeout: 5000, 
        validateStatus: () => true 
      });
      if (response.status < 500) {
        console.log('✅ Server is accessible, analyze endpoint responds');
        return true;
      }
    } catch (postError) {
      // All attempts failed
    }

    console.log('❌ Server is not accessible or not responding correctly');
    console.log('💡 Make sure the DirectoryBolt server is running on the correct port');
    return false;

  } catch (error) {
    console.log(`❌ Cannot connect to server: ${error.message}`);
    console.log('💡 Check that the server is running and the URL is correct');
    return false;
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  // Quick server check first
  checkServerAccess(baseUrl)
    .then(accessible => {
      if (!accessible) {
        console.log('\n🛑 Cannot proceed with verification - server is not accessible');
        console.log('\nTo fix this:');
        console.log('1. Start the DirectoryBolt server: npm run dev');
        console.log('2. Wait for the server to fully start');
        console.log('3. Run this verification again');
        process.exit(1);
      }

      // Server is accessible, run verification
      const verification = new QuickVerification();
      return verification.runQuickVerification();
    })
    .catch(error => {
      console.error('\n💥 Quick verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = QuickVerification;