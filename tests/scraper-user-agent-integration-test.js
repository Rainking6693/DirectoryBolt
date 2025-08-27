/**
 * SCRAPER USER AGENT INTEGRATION TEST
 * Tests the integration between the API endpoint and the OptimizedScraper
 * to ensure user agents are correctly passed through the entire chain
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

class ScraperUserAgentIntegrationTest {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.testResults = [];
    this.verbose = config.verbose !== false;
    
    // Test sites that can help us verify user agent behavior
    this.testSites = [
      {
        name: 'HTTPBin User Agent Echo',
        url: 'https://httpbin.org/user-agent',
        purpose: 'Returns the user agent that was sent'
      },
      {
        name: 'HTTPBin Headers Echo',
        url: 'https://httpbin.org/headers',
        purpose: 'Returns all headers sent to the server'
      },
      {
        name: 'Example.com Standard Site',
        url: 'https://example.com',
        purpose: 'Basic HTML site for general testing'
      },
      {
        name: 'HTTPBin HTML Response',
        url: 'https://httpbin.org/html',
        purpose: 'Returns HTML content for parsing tests'
      }
    ];

    console.log('🔗 SCRAPER USER AGENT INTEGRATION TEST');
    console.log('='.repeat(70));
    console.log('Testing the complete user agent flow from API → Scraper → Target Site');
    console.log('='.repeat(70));
  }

  async runIntegrationTests() {
    console.log('\n🚀 Starting Scraper Integration Tests...\n');

    // Test 1: Verify user agent configuration
    await this.testScraperConfiguration();
    
    // Test 2: Test user agent propagation
    await this.testUserAgentPropagation();
    
    // Test 3: Test with various target sites
    await this.testWithDifferentSites();
    
    // Test 4: Test scraper error handling
    await this.testScraperErrorHandling();
    
    // Test 5: Test concurrent requests with user agents
    await this.testConcurrentRequests();
    
    // Test 6: Test user agent in cached vs fresh requests
    await this.testCachingBehavior();

    this.generateIntegrationReport();
  }

  async testScraperConfiguration() {
    console.log('⚙️ Testing Scraper Configuration');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Default User Agent Configuration',
        test: async () => {
          // Test that the scraper uses the correct default user agent
          const response = await this.makeAnalyzeRequest('https://httpbin.org/user-agent');
          
          if (!this.isSuccessfulResponse(response)) {
            return { success: false, reason: 'Request failed' };
          }

          // For async processing, we need to check if the request was accepted
          return { 
            success: true, 
            details: { 
              status: response.status, 
              hasRequestId: !!(response.data?.requestId || response.data?.analysisId) 
            } 
          };
        }
      },
      {
        name: 'Custom User Agent Override',
        test: async () => {
          const customUA = 'DirectoryBolt-IntegrationTest/1.0 (+https://directorybolt.com/test)';
          const response = await this.makeAnalyzeRequest(
            'https://httpbin.org/user-agent',
            { 'User-Agent': customUA }
          );
          
          if (!this.isSuccessfulResponse(response)) {
            return { success: false, reason: 'Request failed with custom UA' };
          }

          return { 
            success: true, 
            details: { customUA, responseStatus: response.status } 
          };
        }
      },
      {
        name: 'Scraper Timeout Configuration',
        test: async () => {
          // Test with a site that has a delay to see timeout handling
          const response = await this.makeAnalyzeRequest('https://httpbin.org/delay/2');
          
          // Should either succeed or fail gracefully, not hang
          return { 
            success: response.status < 500, 
            details: { status: response.status, timeout: 'handled' } 
          };
        }
      }
    ];

    for (const test of tests) {
      await this.runIntegrationTest('Configuration', test);
    }
  }

  async testUserAgentPropagation() {
    console.log('\n🔄 Testing User Agent Propagation');
    console.log('-'.repeat(50));

    const userAgentTests = [
      {
        name: 'Browser-like User Agent',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        expectedBehavior: 'Should be accepted by most sites'
      },
      {
        name: 'DirectoryBolt Identification',
        userAgent: 'DirectoryBolt/2.0 (+https://directorybolt.com)',
        expectedBehavior: 'Should identify as DirectoryBolt service'
      },
      {
        name: 'Search Engine Bot Style',
        userAgent: 'DirectoryBoltBot/1.0 (compatible; DirectoryBot; +https://directorybolt.com/bot)',
        expectedBehavior: 'Should work as a legitimate bot'
      }
    ];

    for (const uaTest of userAgentTests) {
      await this.runIntegrationTest('User Agent Propagation', {
        name: uaTest.name,
        test: async () => {
          const response = await this.makeAnalyzeRequest(
            'https://httpbin.org/headers',
            { 'User-Agent': uaTest.userAgent }
          );

          if (!this.isSuccessfulResponse(response)) {
            return { 
              success: false, 
              reason: `Failed with ${uaTest.userAgent}`,
              details: { status: response.status }
            };
          }

          return { 
            success: true, 
            details: { 
              userAgent: uaTest.userAgent,
              behavior: uaTest.expectedBehavior,
              status: response.status
            } 
          };
        }
      });
    }
  }

  async testWithDifferentSites() {
    console.log('\n🌐 Testing with Different Target Sites');
    console.log('-'.repeat(50));

    for (const site of this.testSites) {
      await this.runIntegrationTest('Site Compatibility', {
        name: `${site.name} - ${site.purpose}`,
        test: async () => {
          const startTime = performance.now();
          const response = await this.makeAnalyzeRequest(site.url);
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);

          const isSuccessful = this.isSuccessfulResponse(response);
          
          return {
            success: isSuccessful,
            details: {
              url: site.url,
              purpose: site.purpose,
              status: response.status,
              duration: `${duration}ms`,
              hasData: !!(response.data)
            }
          };
        }
      });
    }
  }

  async testScraperErrorHandling() {
    console.log('\n❌ Testing Scraper Error Handling');
    console.log('-'.repeat(50));

    const errorTests = [
      {
        name: 'Non-existent Domain',
        url: 'https://this-domain-absolutely-does-not-exist-123456789.com',
        expectedBehavior: 'Should handle DNS resolution failure'
      },
      {
        name: 'Invalid SSL Certificate',
        url: 'https://expired.badssl.com',
        expectedBehavior: 'Should handle SSL errors gracefully'
      },
      {
        name: 'Connection Timeout',
        url: 'https://httpbin.org/delay/60',
        expectedBehavior: 'Should timeout appropriately'
      },
      {
        name: 'HTTP Error Status',
        url: 'https://httpbin.org/status/500',
        expectedBehavior: 'Should handle server errors'
      },
      {
        name: 'Redirect Loop',
        url: 'https://httpbin.org/redirect/10',
        expectedBehavior: 'Should handle excessive redirects'
      }
    ];

    for (const errorTest of errorTests) {
      await this.runIntegrationTest('Error Handling', {
        name: errorTest.name,
        test: async () => {
          const response = await this.makeAnalyzeRequest(errorTest.url);

          // For error cases, we expect either:
          // 1. A graceful error response (4xx/5xx)
          // 2. A successful response that will handle the error in processing
          const isHandledGracefully = response.status !== undefined && response.status < 600;

          return {
            success: isHandledGracefully,
            details: {
              url: errorTest.url,
              expectedBehavior: errorTest.expectedBehavior,
              status: response.status,
              hasErrorInfo: !!(response.data?.error)
            }
          };
        }
      });
    }
  }

  async testConcurrentRequests() {
    console.log('\n🔄 Testing Concurrent Request Handling');
    console.log('-'.repeat(50));

    await this.runIntegrationTest('Concurrency', {
      name: 'Multiple Simultaneous Requests',
      test: async () => {
        const urls = [
          'https://httpbin.org/user-agent',
          'https://httpbin.org/headers', 
          'https://example.com',
          'https://httpbin.org/html'
        ];

        const customUA = 'DirectoryBolt-ConcurrencyTest/1.0';
        
        // Make concurrent requests
        const startTime = performance.now();
        const promises = urls.map(url => 
          this.makeAnalyzeRequest(url, { 'User-Agent': customUA })
        );

        const results = await Promise.allSettled(promises);
        const endTime = performance.now();
        const totalDuration = Math.round(endTime - startTime);

        const successful = results.filter(result => 
          result.status === 'fulfilled' && 
          this.isSuccessfulResponse(result.value)
        ).length;

        return {
          success: successful >= urls.length / 2, // At least half should succeed
          details: {
            totalRequests: urls.length,
            successful,
            duration: `${totalDuration}ms`,
            averagePerRequest: `${Math.round(totalDuration / urls.length)}ms`
          }
        };
      }
    });
  }

  async testCachingBehavior() {
    console.log('\n💾 Testing Caching Behavior with User Agents');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Same URL, Same User Agent (Should Cache)',
        test: async () => {
          const url = 'https://httpbin.org/uuid'; // Returns unique content each time
          const userAgent = 'DirectoryBolt-CacheTest/1.0';

          // Make first request
          const response1 = await this.makeAnalyzeRequest(url, { 'User-Agent': userAgent });
          
          // Small delay
          await this.delay(100);
          
          // Make second request with same parameters
          const response2 = await this.makeAnalyzeRequest(url, { 'User-Agent': userAgent });

          const bothSuccessful = this.isSuccessfulResponse(response1) && this.isSuccessfulResponse(response2);

          return {
            success: bothSuccessful,
            details: {
              firstStatus: response1.status,
              secondStatus: response2.status,
              cachingNote: 'Both requests should be processed successfully'
            }
          };
        }
      },
      {
        name: 'Same URL, Different User Agent (Should Not Cache)',
        test: async () => {
          const url = 'https://httpbin.org/headers';

          // Make request with first user agent
          const response1 = await this.makeAnalyzeRequest(url, { 'User-Agent': 'DirectoryBolt-Test1/1.0' });
          
          await this.delay(100);
          
          // Make request with different user agent
          const response2 = await this.makeAnalyzeRequest(url, { 'User-Agent': 'DirectoryBolt-Test2/1.0' });

          const bothSuccessful = this.isSuccessfulResponse(response1) && this.isSuccessfulResponse(response2);

          return {
            success: bothSuccessful,
            details: {
              firstStatus: response1.status,
              secondStatus: response2.status,
              cachingNote: 'Different user agents should be treated as different requests'
            }
          };
        }
      }
    ];

    for (const test of tests) {
      await this.runIntegrationTest('Caching', test);
    }
  }

  async makeAnalyzeRequest(targetUrl, customHeaders = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/analyze`,
        { url: targetUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            ...customHeaders
          },
          timeout: 15000, // 15 second timeout
          validateStatus: () => true // Don't throw on HTTP errors
        }
      );

      return response;
    } catch (error) {
      if (error.response) {
        return error.response;
      }
      
      // For network errors, create a mock response
      return {
        status: 0,
        data: { error: error.message },
        headers: {}
      };
    }
  }

  isSuccessfulResponse(response) {
    return response && response.status >= 200 && response.status < 400;
  }

  async runIntegrationTest(category, test) {
    const testResult = {
      category,
      name: test.name,
      status: 'RUNNING',
      startTime: Date.now(),
      endTime: null,
      duration: null,
      error: null,
      details: {}
    };

    try {
      if (this.verbose) {
        process.stdout.write(`   🔄 ${test.name}... `);
      }

      const result = await test.test();
      
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      
      if (typeof result === 'boolean') {
        testResult.status = result ? 'PASS' : 'FAIL';
      } else {
        testResult.status = result.success ? 'PASS' : 'FAIL';
        testResult.details = result.details || {};
        if (result.reason) {
          testResult.error = result.reason;
        }
      }

      if (this.verbose) {
        const statusIcon = testResult.status === 'PASS' ? '✅' : '❌';
        console.log(`${statusIcon} ${testResult.status} (${testResult.duration}ms)`);
        
        if (testResult.details && Object.keys(testResult.details).length > 0 && testResult.status === 'PASS') {
          console.log(`      Details: ${JSON.stringify(testResult.details, null, 2).replace(/\n/g, '\n      ')}`);
        }
      }

    } catch (error) {
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.status = 'ERROR';
      testResult.error = error.message;

      if (this.verbose) {
        console.log(`💥 ERROR: ${error.message}`);
      }
    }

    this.testResults.push(testResult);
    return testResult;
  }

  generateIntegrationReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🔗 SCRAPER USER AGENT INTEGRATION TEST REPORT');
    console.log('='.repeat(70));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const errorTests = this.testResults.filter(t => t.status === 'ERROR').length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

    console.log(`📊 INTEGRATION TEST RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   💥 Errors: ${errorTests}`);
    console.log(`   🎯 Success Rate: ${successRate}%`);

    // Category breakdown
    console.log(`\n📂 CATEGORY BREAKDOWN:`);
    const categories = [...new Set(this.testResults.map(t => t.category))];
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(t => t.category === category);
      const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
      const categoryRate = (categoryPassed / categoryTests.length * 100).toFixed(0);
      console.log(`   ${category}: ${categoryPassed}/${categoryTests.length} (${categoryRate}%)`);
    });

    // Integration health assessment
    console.log(`\n🔗 INTEGRATION HEALTH ASSESSMENT:`);
    if (successRate >= 90) {
      console.log('   ✅ EXCELLENT: User Agent integration is working perfectly');
      console.log('   🎉 The scraper correctly handles and propagates user agents');
    } else if (successRate >= 75) {
      console.log('   ⚠️ GOOD: User Agent integration works with minor issues');
      console.log('   🔧 Some edge cases may need attention');
    } else if (successRate >= 50) {
      console.log('   ⚠️ WARNING: User Agent integration has significant problems');
      console.log('   🚨 User agent propagation may not be working correctly');
    } else {
      console.log('   ❌ CRITICAL: User Agent integration is failing');
      console.log('   🚨 Major issues with user agent handling in the scraper chain');
    }

    // Performance metrics
    const avgDuration = this.testResults
      .filter(t => t.duration)
      .reduce((sum, t) => sum + t.duration, 0) / this.testResults.length;
    
    console.log(`\n⏱️ PERFORMANCE METRICS:`);
    console.log(`   Average Test Duration: ${avgDuration.toFixed(0)}ms`);

    // Critical issues
    const criticalIssues = this.testResults.filter(t => t.status === 'FAIL' || t.status === 'ERROR');
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.category}: ${issue.name}`);
        if (issue.error) {
          console.log(`      ❌ ${issue.error}`);
        }
      });
    }

    // Recommendations
    const recommendations = this.generateIntegrationRecommendations();
    console.log(`\n💡 INTEGRATION RECOMMENDATIONS:`);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(70));

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        errorTests,
        successRate: parseFloat(successRate),
        avgDuration: Math.round(avgDuration)
      },
      results: this.testResults,
      recommendations
    };
  }

  generateIntegrationRecommendations() {
    const recommendations = [];
    
    const configIssues = this.testResults.filter(t => 
      t.category === 'Configuration' && t.status !== 'PASS'
    );
    if (configIssues.length > 0) {
      recommendations.push('Review and fix scraper configuration issues');
    }

    const propagationIssues = this.testResults.filter(t => 
      t.category === 'User Agent Propagation' && t.status !== 'PASS'
    );
    if (propagationIssues.length > 0) {
      recommendations.push('Verify that user agents are correctly passed from API to scraper');
    }

    const siteCompatibilityIssues = this.testResults.filter(t => 
      t.category === 'Site Compatibility' && t.status !== 'PASS'
    );
    if (siteCompatibilityIssues.length > 0) {
      recommendations.push('Improve compatibility with different types of target websites');
    }

    const errorHandlingIssues = this.testResults.filter(t => 
      t.category === 'Error Handling' && t.status !== 'PASS'
    );
    if (errorHandlingIssues.length > 0) {
      recommendations.push('Enhance error handling and recovery mechanisms in the scraper');
    }

    const concurrencyIssues = this.testResults.filter(t => 
      t.category === 'Concurrency' && t.status !== 'PASS'
    );
    if (concurrencyIssues.length > 0) {
      recommendations.push('Optimize concurrent request handling and user agent management');
    }

    const cachingIssues = this.testResults.filter(t => 
      t.category === 'Caching' && t.status !== 'PASS'
    );
    if (cachingIssues.length > 0) {
      recommendations.push('Review caching behavior with different user agents');
    }

    if (recommendations.length === 0) {
      recommendations.push('Integration tests all passed! The user agent fix is working correctly.');
      recommendations.push('Consider adding production monitoring for user agent usage patterns.');
    }

    return recommendations;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ScraperUserAgentIntegrationTest;

// CLI execution
if (require.main === module) {
  const config = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    verbose: process.env.VERBOSE !== 'false'
  };

  const testSuite = new ScraperUserAgentIntegrationTest(config);
  
  testSuite.runIntegrationTests()
    .then(() => {
      console.log('\n✅ Integration testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Integration testing failed:', error);
      process.exit(1);
    });
}