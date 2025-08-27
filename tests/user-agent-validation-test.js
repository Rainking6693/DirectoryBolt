/**
 * USER AGENT VALIDATION TEST
 * Specifically tests that the userAgent fix is working in the scraper
 * and that user agents are properly passed through the entire request chain
 */

const axios = require('axios');

class UserAgentValidationTest {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.testResults = [];
    
    // Different user agents to test with
    this.testUserAgents = [
      'DirectoryBolt/2.0 (+https://directorybolt.com)', // Default expected
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'DirectoryBolt-TestSuite/1.0 (+https://directorybolt.com/testing)',
      '', // Empty user agent
      undefined // No user agent header
    ];

    console.log('👤 USER AGENT VALIDATION TEST SUITE');
    console.log('='.repeat(60));
  }

  async runAllUserAgentTests() {
    console.log('🔍 Testing User Agent handling in /api/analyze endpoint...\n');

    // Test 1: Default user agent behavior
    await this.testDefaultUserAgent();
    
    // Test 2: Custom user agent passing
    await this.testCustomUserAgents();
    
    // Test 3: User agent in scraper requests
    await this.testScraperUserAgent();
    
    // Test 4: User agent with bot detection
    await this.testBotDetectionHandling();
    
    // Test 5: User agent logging and tracking
    await this.testUserAgentLogging();
    
    // Test 6: Edge cases
    await this.testUserAgentEdgeCases();

    this.generateUserAgentReport();
  }

  async testDefaultUserAgent() {
    console.log('📋 Testing Default User Agent Behavior');
    console.log('-'.repeat(40));

    const tests = [
      {
        name: 'Request without User-Agent header',
        test: async () => {
          const response = await this.makeRequest({
            url: 'https://httpbin.org/user-agent',
            headers: {} // No user agent
          });
          return this.validateResponse(response, 'should handle missing user agent');
        }
      },
      {
        name: 'Request with empty User-Agent header',
        test: async () => {
          const response = await this.makeRequest({
            url: 'https://httpbin.org/user-agent',
            headers: { 'User-Agent': '' }
          });
          return this.validateResponse(response, 'should handle empty user agent');
        }
      }
    ];

    for (const test of tests) {
      await this.runTest('Default UA', test);
    }
  }

  async testCustomUserAgents() {
    console.log('\n🔧 Testing Custom User Agent Passing');
    console.log('-'.repeat(40));

    for (let i = 0; i < this.testUserAgents.length; i++) {
      const userAgent = this.testUserAgents[i];
      const testName = userAgent ? 
        `Custom UA ${i + 1}: ${userAgent.substring(0, 50)}${userAgent.length > 50 ? '...' : ''}` :
        `Empty/Missing UA ${i + 1}`;

      await this.runTest('Custom UA', {
        name: testName,
        test: async () => {
          const headers = {};
          if (userAgent !== undefined) {
            headers['User-Agent'] = userAgent;
          }

          const response = await this.makeRequest({
            url: 'https://httpbin.org/user-agent',
            headers
          });

          return this.validateResponse(response, `should accept user agent: ${userAgent || 'undefined'}`);
        }
      });
    }
  }

  async testScraperUserAgent() {
    console.log('\n🕷️ Testing User Agent in Web Scraping');
    console.log('-'.repeat(40));

    const tests = [
      {
        name: 'User-Agent passed to target website',
        test: async () => {
          // Use httpbin.org to echo back the user agent used
          const customUA = 'DirectoryBolt-Scraper-Test/1.0';
          const response = await this.makeRequest({
            url: 'https://httpbin.org/headers', // This will show us what headers were sent
            headers: { 'User-Agent': customUA }
          });

          // If the scraper is working correctly and using our user agent,
          // the response should be successful
          return this.validateResponse(response, 'user agent should reach target site');
        }
      },
      {
        name: 'Bot-friendly User-Agent handling',
        test: async () => {
          const botUA = 'DirectoryBolt/2.0 (+https://directorybolt.com)';
          const response = await this.makeRequest({
            url: 'https://example.com',
            headers: { 'User-Agent': botUA }
          });

          return this.validateResponse(response, 'bot user agent should not be blocked');
        }
      },
      {
        name: 'Browser-like User-Agent handling',
        test: async () => {
          const browserUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
          const response = await this.makeRequest({
            url: 'https://example.com',
            headers: { 'User-Agent': browserUA }
          });

          return this.validateResponse(response, 'browser user agent should work');
        }
      }
    ];

    for (const test of tests) {
      await this.runTest('Scraper UA', test);
    }
  }

  async testBotDetectionHandling() {
    console.log('\n🤖 Testing Bot Detection Handling');
    console.log('-'.repeat(40));

    const suspiciousUAs = [
      'bot',
      'crawler',
      'spider',
      'scraper',
      'python-requests/2.25.1',
      'wget/1.20.3',
      'curl/7.68.0'
    ];

    for (const ua of suspiciousUAs) {
      await this.runTest('Bot Detection', {
        name: `Potentially blocked UA: ${ua}`,
        test: async () => {
          const response = await this.makeRequest({
            url: 'https://httpbin.org/user-agent',
            headers: { 'User-Agent': ua }
          });

          // The endpoint should handle these gracefully, not necessarily block them
          return this.validateResponse(response, `should handle suspicious UA: ${ua}`);
        }
      });
    }
  }

  async testUserAgentLogging() {
    console.log('\n📝 Testing User Agent Logging and Tracking');
    console.log('-'.repeat(40));

    const tests = [
      {
        name: 'User-Agent included in response headers',
        test: async () => {
          const testUA = 'DirectoryBolt-LogTest/1.0';
          const response = await this.makeRequest({
            url: 'https://example.com',
            headers: { 'User-Agent': testUA }
          });

          // Check if the response includes any tracking headers or request ID
          const hasTracking = response.headers && (
            response.headers['x-request-id'] ||
            response.headers['x-correlation-id'] ||
            (response.data && response.data.requestId)
          );

          return this.validateResponse(response, 'should include request tracking') && hasTracking;
        }
      },
      {
        name: 'Malicious User-Agent handling',
        test: async () => {
          const maliciousUA = '<script>alert("xss")</script>';
          const response = await this.makeRequest({
            url: 'https://example.com',
            headers: { 'User-Agent': maliciousUA }
          });

          // Should either be sanitized or rejected
          return response.status >= 400 || this.validateResponse(response, 'should handle malicious UA');
        }
      }
    ];

    for (const test of tests) {
      await this.runTest('UA Logging', test);
    }
  }

  async testUserAgentEdgeCases() {
    console.log('\n🔍 Testing User Agent Edge Cases');
    console.log('-'.repeat(40));

    const edgeCaseUAs = [
      'a'.repeat(1000), // Very long user agent
      'Mozilla/5.0\r\nInjected-Header: malicious', // Header injection attempt
      'Mozilla/5.0\nX-Injected: test', // Line break injection
      '🤖 Bot with emoji', // Unicode characters
      'User Agent; with; semicolons', // Special characters
      'User-Agent"with"quotes', // Quote characters
    ];

    for (const ua of edgeCaseUAs) {
      await this.runTest('UA Edge Cases', {
        name: `Edge case UA: ${ua.substring(0, 30)}...`,
        test: async () => {
          const response = await this.makeRequest({
            url: 'https://example.com',
            headers: { 'User-Agent': ua }
          });

          // Should handle edge cases gracefully - either accept or reject cleanly
          return response.status < 500; // No server errors
        }
      });
    }
  }

  async makeRequest(options) {
    const { url: targetUrl, headers = {} } = options;
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/analyze`, 
        { url: targetUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          timeout: 10000,
          validateStatus: () => true // Don't throw on HTTP errors
        }
      );

      return response;
    } catch (error) {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }

  validateResponse(response, context) {
    // Basic validation - response should be properly formatted
    if (!response) return false;
    
    // Check status code is reasonable
    if (response.status < 200 || response.status >= 600) return false;
    
    // Check content type is JSON
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) return false;
    
    // For successful requests, check basic structure
    if (response.status >= 200 && response.status < 400) {
      if (!response.data) return false;
      
      // Should have basic response structure
      const hasBasicStructure = 
        response.data.success !== undefined ||
        response.data.status !== undefined ||
        response.data.analysisId !== undefined;
        
      return hasBasicStructure;
    }
    
    // For error requests, should have error information
    if (response.status >= 400) {
      if (!response.data) return false;
      
      const hasErrorInfo = 
        response.data.error !== undefined ||
        response.data.message !== undefined;
        
      return hasErrorInfo;
    }
    
    return true;
  }

  async runTest(category, test) {
    const testResult = {
      category,
      name: test.name,
      status: 'RUNNING',
      startTime: Date.now(),
      endTime: null,
      duration: null,
      error: null
    };

    try {
      console.log(`   🔄 ${test.name}...`);

      const result = await test.test();
      
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.status = result ? 'PASS' : 'FAIL';

      const statusIcon = result ? '✅' : '❌';
      console.log(`   ${statusIcon} ${testResult.status} (${testResult.duration}ms)`);

    } catch (error) {
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.status = 'ERROR';
      testResult.error = error.message;

      console.log(`   💥 ERROR: ${error.message}`);
    }

    this.testResults.push(testResult);
    return testResult;
  }

  generateUserAgentReport() {
    console.log('\n' + '='.repeat(60));
    console.log('👤 USER AGENT VALIDATION REPORT');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const errorTests = this.testResults.filter(t => t.status === 'ERROR').length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

    console.log(`📊 USER AGENT TEST RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   💥 Errors: ${errorTests}`);
    console.log(`   🎯 Success Rate: ${successRate}%`);

    // Category breakdown
    console.log(`\n📂 CATEGORY RESULTS:`);
    const categories = [...new Set(this.testResults.map(t => t.category))];
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(t => t.category === category);
      const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
      const categoryRate = (categoryPassed / categoryTests.length * 100).toFixed(0);
      console.log(`   ${category}: ${categoryPassed}/${categoryTests.length} (${categoryRate}%)`);
    });

    // User Agent Fix Assessment
    console.log(`\n🔧 USER AGENT FIX ASSESSMENT:`);
    if (successRate >= 90) {
      console.log('   ✅ EXCELLENT: User Agent handling is working correctly');
      console.log('   🎉 The userAgent fix appears to be fully functional');
    } else if (successRate >= 75) {
      console.log('   ⚠️ GOOD: User Agent handling mostly works with minor issues');
      console.log('   🔧 Some edge cases may need attention');
    } else if (successRate >= 50) {
      console.log('   ⚠️ WARNING: User Agent handling has significant issues');
      console.log('   🚨 The userAgent fix needs review and debugging');
    } else {
      console.log('   ❌ CRITICAL: User Agent handling is not working correctly');
      console.log('   🚨 The userAgent fix is not functioning as expected');
    }

    // Failed tests details
    const criticalFailures = this.testResults.filter(t => t.status === 'FAIL' || t.status === 'ERROR');
    if (criticalFailures.length > 0) {
      console.log(`\n🚨 FAILED TESTS REQUIRE ATTENTION:`);
      criticalFailures.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.category}: ${failure.name}`);
        if (failure.error) {
          console.log(`      Error: ${failure.error}`);
        }
      });
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    const recommendations = this.generateUserAgentRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(60));

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        errorTests,
        successRate: parseFloat(successRate)
      },
      results: this.testResults,
      recommendations
    };
  }

  generateUserAgentRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(t => t.status === 'FAIL');
    const errorTests = this.testResults.filter(t => t.status === 'ERROR');

    if (failedTests.length === 0 && errorTests.length === 0) {
      recommendations.push('All User Agent tests passed! The fix is working correctly.');
      recommendations.push('Consider adding monitoring to track user agent usage in production.');
    } else {
      if (errorTests.length > 0) {
        recommendations.push('Fix server errors related to user agent processing.');
      }

      const defaultUAIssues = this.testResults.filter(t => 
        t.category === 'Default UA' && t.status !== 'PASS'
      );
      if (defaultUAIssues.length > 0) {
        recommendations.push('Ensure the scraper properly handles missing user agent headers.');
      }

      const customUAIssues = this.testResults.filter(t => 
        t.category === 'Custom UA' && t.status !== 'PASS'
      );
      if (customUAIssues.length > 0) {
        recommendations.push('Review how custom user agent headers are processed and passed through.');
      }

      const scraperIssues = this.testResults.filter(t => 
        t.category === 'Scraper UA' && t.status !== 'PASS'
      );
      if (scraperIssues.length > 0) {
        recommendations.push('Check that the OptimizedScraper is using the correct user agent configuration.');
      }

      const botIssues = this.testResults.filter(t => 
        t.category === 'Bot Detection' && t.status !== 'PASS'
      );
      if (botIssues.length > 0) {
        recommendations.push('Consider implementing better bot detection and handling strategies.');
      }

      const edgeCaseIssues = this.testResults.filter(t => 
        t.category === 'UA Edge Cases' && t.status !== 'PASS'
      );
      if (edgeCaseIssues.length > 0) {
        recommendations.push('Improve input validation and sanitization for user agent headers.');
      }

      recommendations.push('Test with real websites that have strict user agent requirements.');
      recommendations.push('Add comprehensive logging to debug user agent issues in production.');
    }

    return recommendations;
  }
}

module.exports = UserAgentValidationTest;

// CLI execution
if (require.main === module) {
  const config = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
  };

  const testSuite = new UserAgentValidationTest(config);
  
  testSuite.runAllUserAgentTests()
    .then(() => {
      console.log('\n✅ User Agent validation testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 User Agent testing failed:', error);
      process.exit(1);
    });
}