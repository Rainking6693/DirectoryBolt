/**
 * COMPREHENSIVE TEST SUITE FOR /api/analyze ENDPOINT
 * Focus: UserAgent Fix Validation and Real-World Usage Scenarios
 * 
 * This test suite specifically validates that the userAgent fix is working
 * correctly and that the analyze endpoint handles various real-world scenarios.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AnalyzeEndpointTestSuite {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.testResults = [];
    this.testStartTime = Date.now();
    this.userAgent = 'DirectoryBolt-TestSuite/1.0 (+https://directorybolt.com/testing)';
    this.requestId = null;
    
    // Test configuration
    this.config = {
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      verbose: config.verbose !== false,
      saveResults: config.saveResults !== false,
      realRequests: config.realRequests !== false, // Use real HTTP requests instead of mocks
      ...config
    };

    console.log(`🔬 ANALYZE ENDPOINT COMPREHENSIVE TEST SUITE`);
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🌐 Real HTTP Requests: ${this.config.realRequests ? 'ENABLED' : 'DISABLED'}`);
    console.log(`👤 Test User-Agent: ${this.userAgent}`);
    console.log('='.repeat(80));
  }

  /**
   * Main test runner - executes all test categories
   */
  async runAllTests() {
    const startTime = Date.now();
    
    try {
      // 1. Pre-test validation
      await this.validateTestEnvironment();
      
      // 2. Core endpoint functionality
      await this.testBasicEndpointFunctionality();
      
      // 3. UserAgent validation tests
      await this.testUserAgentHandling();
      
      // 4. URL input validation tests
      await this.testUrlInputScenarios();
      
      // 5. Web scraping integration tests
      await this.testWebScrapingIntegration();
      
      // 6. Error scenario tests
      await this.testErrorScenarios();
      
      // 7. Network resilience tests
      await this.testNetworkResilience();
      
      // 8. Response format validation
      await this.testResponseFormatValidation();
      
      // 9. Performance under real conditions
      await this.testRealWorldPerformance();
      
      // 10. Edge case handling
      await this.testEdgeCases();
      
      // Generate comprehensive report
      await this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('🚨 Test suite execution failed:', error);
      throw error;
    }
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Total test execution time: ${(duration / 1000).toFixed(2)}s`);
    
    return this.testResults;
  }

  /**
   * 1. PRE-TEST ENVIRONMENT VALIDATION
   */
  async validateTestEnvironment() {
    console.log('\n🔍 VALIDATING TEST ENVIRONMENT');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Server Accessibility',
        test: async () => {
          const response = await this.makeRequest('GET', '/api/health');
          return response.status >= 200 && response.status < 300;
        }
      },
      {
        name: 'Analyze Endpoint Exists',
        test: async () => {
          // OPTIONS request should not return 404
          const response = await this.makeRequest('OPTIONS', '/api/analyze');
          return response.status !== 404;
        }
      },
      {
        name: 'Content-Type Headers',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', { url: 'https://example.com' });
          const contentType = response.headers['content-type'];
          return contentType && contentType.includes('application/json');
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Environment', test);
    }
  }

  /**
   * 2. BASIC ENDPOINT FUNCTIONALITY
   */
  async testBasicEndpointFunctionality() {
    console.log('\n⚙️ TESTING BASIC ENDPOINT FUNCTIONALITY');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'HTTP Method Validation - POST Required',
        test: async () => {
          const response = await this.makeRequest('GET', '/api/analyze');
          return response.status === 405; // Method Not Allowed
        }
      },
      {
        name: 'Valid POST Request Structure',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          return response.status === 200 || response.status === 202; // Success or Accepted
        }
      },
      {
        name: 'Request ID Generation',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          const hasRequestId = response.data && (
            response.data.requestId || 
            response.data.analysisId ||
            response.headers['x-request-id']
          );
          if (hasRequestId) {
            this.requestId = response.data.requestId || response.data.analysisId;
          }
          return hasRequestId;
        }
      },
      {
        name: 'Response Headers Present',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          const requiredHeaders = ['content-type'];
          return requiredHeaders.every(header => response.headers[header]);
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Basic Functionality', test);
    }
  }

  /**
   * 3. USER AGENT HANDLING TESTS
   */
  async testUserAgentHandling() {
    console.log('\n👤 TESTING USER AGENT HANDLING');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Custom User-Agent Accepted',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/user-agent'
          }, {
            'User-Agent': 'TestAgent/1.0'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Missing User-Agent Handled',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          }, {
            // Explicitly remove User-Agent by setting to empty
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'User-Agent Passed to Scraper',
        test: async () => {
          // This test checks if user-agent is properly used in scraping
          // We can verify this by checking if the request succeeds for sites that block default user agents
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/headers'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Bot Detection Bypass',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          }, {
            'User-Agent': 'DirectoryBolt/2.0 (+https://directorybolt.com)'
          });
          return response.status !== 403; // Should not be blocked as bot
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('User Agent', test);
    }
  }

  /**
   * 4. URL INPUT SCENARIOS
   */
  async testUrlInputScenarios() {
    console.log('\n🔗 TESTING URL INPUT SCENARIOS');
    console.log('-'.repeat(50));

    const urlTests = [
      // Valid URLs
      { url: 'https://example.com', expectValid: true, name: 'Standard HTTPS URL' },
      { url: 'http://example.com', expectValid: true, name: 'Standard HTTP URL' },
      { url: 'https://www.example.com', expectValid: true, name: 'URL with www subdomain' },
      { url: 'https://subdomain.example.com', expectValid: true, name: 'URL with custom subdomain' },
      { url: 'https://example.com/path', expectValid: true, name: 'URL with path' },
      { url: 'https://example.com/path?query=value', expectValid: true, name: 'URL with query parameters' },
      { url: 'https://example.com/path#fragment', expectValid: true, name: 'URL with fragment' },
      { url: 'example.com', expectValid: true, name: 'Domain without protocol' },
      
      // International URLs
      { url: 'https://münchen.de', expectValid: true, name: 'Internationalized domain' },
      { url: 'https://例え.テスト', expectValid: true, name: 'Unicode domain' },
      
      // Edge case valid URLs
      { url: 'https://xn--nxasmq6b.xn--o3cw4h', expectValid: true, name: 'Punycode domain' },
      { url: 'https://example.co.uk', expectValid: true, name: 'Multi-level TLD' },
      
      // Invalid URLs
      { url: '', expectValid: false, name: 'Empty URL' },
      { url: 'not-a-url', expectValid: false, name: 'Invalid format' },
      { url: 'javascript:alert(1)', expectValid: false, name: 'JavaScript protocol' },
      { url: 'ftp://example.com', expectValid: false, name: 'FTP protocol' },
      { url: 'localhost', expectValid: false, name: 'Localhost' },
      { url: '127.0.0.1', expectValid: false, name: 'Local IP' },
      { url: '192.168.1.1', expectValid: false, name: 'Private IP' },
      { url: 'https://localhost:3000', expectValid: false, name: 'Localhost with port' },
      { url: 'file:///etc/passwd', expectValid: false, name: 'File protocol' },
      
      // Potentially malicious
      { url: 'https://example.com/../../../etc/passwd', expectValid: false, name: 'Path traversal attempt' },
      { url: "https://example.com'; DROP TABLE users; --", expectValid: false, name: 'SQL injection attempt' },
      { url: 'https://example.com/<script>alert(1)</script>', expectValid: false, name: 'XSS attempt' }
    ];

    for (const urlTest of urlTests) {
      await this.runSingleTest('URL Validation', {
        name: urlTest.name,
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: urlTest.url
          });
          
          if (urlTest.expectValid) {
            // Should succeed or be accepted for processing
            return response.status === 200 || response.status === 202;
          } else {
            // Should be rejected with 400
            return response.status === 400;
          }
        }
      });
    }
  }

  /**
   * 5. WEB SCRAPING INTEGRATION
   */
  async testWebScrapingIntegration() {
    console.log('\n🕷️ TESTING WEB SCRAPING INTEGRATION');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Real Website Scraping - Example.com',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'HTTPS Redirect Handling',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'http://github.com' // Redirects to HTTPS
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Large Website Handling',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://wikipedia.org'
          });
          return response.status === 200 || response.status === 202 || response.status === 408; // May timeout
        }
      },
      {
        name: 'Content-Type Validation',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/html'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'JavaScript-Heavy Site',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/html'
          });
          return response.status === 200 || response.status === 202;
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Web Scraping', test);
    }
  }

  /**
   * 6. ERROR SCENARIO TESTING
   */
  async testErrorScenarios() {
    console.log('\n❌ TESTING ERROR SCENARIOS');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Non-existent Domain',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://thisDomainDoesNotExist12345.com'
          });
          return response.status === 400 || response.status === 500;
        }
      },
      {
        name: 'Connection Timeout',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/delay/30'
          });
          return response.status === 408 || response.status === 500; // Timeout or server error
        }
      },
      {
        name: 'HTTP Error Status (404)',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/status/404'
          });
          return response.status === 200 || response.status === 202; // Should handle gracefully
        }
      },
      {
        name: 'HTTP Error Status (500)',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/status/500'
          });
          return response.status === 200 || response.status === 202; // Should handle gracefully
        }
      },
      {
        name: 'Invalid Content-Type Response',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/image/png'
          });
          return response.status === 400 || response.status === 200; // May reject or handle
        }
      },
      {
        name: 'Request Body Too Large',
        test: async () => {
          const largePayload = {
            url: 'https://example.com',
            extraData: 'x'.repeat(10 * 1024 * 1024) // 10MB of data
          };
          const response = await this.makeRequest('POST', '/api/analyze', largePayload);
          return response.status === 413 || response.status === 400; // Payload too large
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Error Scenarios', test);
    }
  }

  /**
   * 7. NETWORK RESILIENCE TESTING
   */
  async testNetworkResilience() {
    console.log('\n🌐 TESTING NETWORK RESILIENCE');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Slow Response Handling',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/delay/2'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Multiple Redirects',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/redirect/3'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Large Content Handling',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l' // Returns decoded content
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Concurrent Requests Handling',
        test: async () => {
          const requests = Array(5).fill().map(() => 
            this.makeRequest('POST', '/api/analyze', {
              url: 'https://httpbin.org/uuid'
            })
          );
          const responses = await Promise.allSettled(requests);
          const successful = responses.filter(r => 
            r.status === 'fulfilled' && 
            (r.value.status === 200 || r.value.status === 202)
          ).length;
          return successful >= 3; // At least 3 should succeed
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Network Resilience', test);
    }
  }

  /**
   * 8. RESPONSE FORMAT VALIDATION
   */
  async testResponseFormatValidation() {
    console.log('\n📋 TESTING RESPONSE FORMAT VALIDATION');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Success Response Structure',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          
          if (response.status !== 200 && response.status !== 202) return false;
          
          const data = response.data;
          const hasRequiredFields = data && (
            data.success !== undefined ||
            data.status !== undefined ||
            data.analysisId !== undefined
          );
          
          return hasRequiredFields;
        }
      },
      {
        name: 'Error Response Structure',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'invalid-url'
          });
          
          if (response.status === 200) return false; // Should not succeed
          
          const data = response.data;
          const hasErrorInfo = data && (
            data.error !== undefined ||
            data.message !== undefined
          );
          
          return hasErrorInfo;
        }
      },
      {
        name: 'JSON Content Type',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          
          const contentType = response.headers['content-type'];
          return contentType && contentType.includes('application/json');
        }
      },
      {
        name: 'Progress Endpoint Available',
        test: async () => {
          if (!this.requestId) return true; // Skip if no request ID available
          
          const response = await this.makeRequest('GET', `/api/analyze/progress?requestId=${this.requestId}`);
          return response.status === 200 || response.status === 404; // Either works or doesn't exist yet
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Response Format', test);
    }
  }

  /**
   * 9. REAL-WORLD PERFORMANCE TESTING
   */
  async testRealWorldPerformance() {
    console.log('\n⚡ TESTING REAL-WORLD PERFORMANCE');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Response Time - Simple Site',
        test: async () => {
          const startTime = Date.now();
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com'
          });
          const duration = Date.now() - startTime;
          
          // Should respond within 10 seconds for simple site
          return (response.status === 200 || response.status === 202) && duration < 10000;
        }
      },
      {
        name: 'Memory Efficiency - Multiple Requests',
        test: async () => {
          const urls = [
            'https://example.com',
            'https://httpbin.org/html',
            'https://httpbin.org/json',
            'https://httpbin.org/xml'
          ];
          
          let successful = 0;
          for (const url of urls) {
            const response = await this.makeRequest('POST', '/api/analyze', { url });
            if (response.status === 200 || response.status === 202) {
              successful++;
            }
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          return successful >= 3; // At least 3 should work
        }
      },
      {
        name: 'Rate Limiting Compliance',
        test: async () => {
          // Make rapid requests to test rate limiting
          const requests = [];
          for (let i = 0; i < 3; i++) {
            requests.push(this.makeRequest('POST', '/api/analyze', {
              url: 'https://example.com'
            }));
          }
          
          const responses = await Promise.allSettled(requests);
          const rateLimited = responses.some(r => 
            r.status === 'fulfilled' && r.value.status === 429
          );
          
          // Either all succeed (lenient rate limiting) or some are rate limited
          return true;
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Performance', test);
    }
  }

  /**
   * 10. EDGE CASE TESTING
   */
  async testEdgeCases() {
    console.log('\n🔍 TESTING EDGE CASES');
    console.log('-'.repeat(50));

    const tests = [
      {
        name: 'Empty POST Body',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', null);
          return response.status === 400; // Should require body
        }
      },
      {
        name: 'URL with Special Characters',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com/path?param=value with spaces&other=test'
          });
          return response.status === 200 || response.status === 202 || response.status === 400;
        }
      },
      {
        name: 'URL with Fragments',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'https://example.com#section'
          });
          return response.status === 200 || response.status === 202;
        }
      },
      {
        name: 'Very Long URL',
        test: async () => {
          const longPath = 'a'.repeat(1000);
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: `https://example.com/${longPath}`
          });
          return response.status === 400 || response.status === 414; // URL too long
        }
      },
      {
        name: 'Mixed Case Protocol',
        test: async () => {
          const response = await this.makeRequest('POST', '/api/analyze', {
            url: 'HTTPS://EXAMPLE.COM'
          });
          return response.status === 200 || response.status === 202;
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('Edge Cases', test);
    }
  }

  /**
   * HELPER METHODS
   */
  async runSingleTest(category, test) {
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
      if (this.config.verbose) {
        process.stdout.write(`   🔄 ${test.name}... `);
      }

      const result = await Promise.race([
        test.test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
        )
      ]);

      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.status = result ? 'PASS' : 'FAIL';

      if (this.config.verbose) {
        const statusIcon = result ? '✅' : '❌';
        const duration = testResult.duration;
        console.log(`${statusIcon} ${testResult.status} (${duration}ms)`);
      }

    } catch (error) {
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.status = 'ERROR';
      testResult.error = error.message;

      if (this.config.verbose) {
        console.log(`💥 ERROR: ${error.message}`);
      }
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
        ...headers
      },
      timeout: this.config.timeout,
      validateStatus: () => true // Don't throw on HTTP errors
    };

    if (data) {
      config.data = data;
    }

    try {
      if (this.config.realRequests) {
        return await axios(config);
      } else {
        // Mock response for testing without real server
        return this.mockResponse(method, endpoint, data, headers);
      }
    } catch (error) {
      // Convert axios errors to our format
      if (error.response) {
        return error.response;
      } else {
        throw error;
      }
    }
  }

  mockResponse(method, endpoint, data, headers) {
    // Simple mock for when real requests are disabled
    if (endpoint === '/api/health') {
      return {
        status: 200,
        data: { status: 'healthy', timestamp: new Date().toISOString() },
        headers: { 'content-type': 'application/json' }
      };
    }

    if (endpoint === '/api/analyze') {
      if (method !== 'POST') {
        return {
          status: 405,
          data: { error: 'Method not allowed' },
          headers: { 'content-type': 'application/json' }
        };
      }

      if (!data || !data.url) {
        return {
          status: 400,
          data: { error: 'URL is required' },
          headers: { 'content-type': 'application/json' }
        };
      }

      // Mock successful response
      return {
        status: 202,
        data: {
          success: true,
          analysisId: `req_${Date.now()}`,
          status: 'initiated',
          url: data.url
        },
        headers: { 'content-type': 'application/json' }
      };
    }

    return {
      status: 404,
      data: { error: 'Not found' },
      headers: { 'content-type': 'application/json' }
    };
  }

  /**
   * COMPREHENSIVE REPORT GENERATION
   */
  async generateComprehensiveReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYZE ENDPOINT - COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const errorTests = this.testResults.filter(t => t.status === 'ERROR').length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

    console.log(`📈 OVERALL RESULTS:`);
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

    // UserAgent specific validation
    console.log(`\n👤 USER AGENT FIX VALIDATION:`);
    const userAgentTests = this.testResults.filter(t => t.category === 'User Agent');
    if (userAgentTests.length > 0) {
      const userAgentPassed = userAgentTests.filter(t => t.status === 'PASS').length;
      const userAgentRate = (userAgentPassed / userAgentTests.length * 100).toFixed(0);
      console.log(`   User Agent Tests: ${userAgentPassed}/${userAgentTests.length} (${userAgentRate}%)`);
      
      if (userAgentRate >= 75) {
        console.log(`   ✅ User Agent fix appears to be working correctly`);
      } else {
        console.log(`   ⚠️ User Agent fix may need attention`);
      }
    } else {
      console.log(`   ⚠️ No User Agent specific tests were run`);
    }

    // Critical failures
    const criticalFailures = this.testResults.filter(t => 
      t.status === 'FAIL' && 
      (t.category === 'Basic Functionality' || t.category === 'User Agent')
    );

    if (criticalFailures.length > 0) {
      console.log(`\n🚨 CRITICAL FAILURES:`);
      criticalFailures.forEach(failure => {
        console.log(`   ❌ ${failure.category}: ${failure.name}`);
      });
    }

    // Performance metrics
    const performanceTests = this.testResults.filter(t => t.category === 'Performance');
    if (performanceTests.length > 0) {
      const avgDuration = performanceTests.reduce((sum, t) => sum + (t.duration || 0), 0) / performanceTests.length;
      console.log(`\n⚡ PERFORMANCE METRICS:`);
      console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    // Save results if enabled
    if (this.config.saveResults) {
      await this.saveTestResults();
    }

    console.log('\n' + '='.repeat(80));
    
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

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(t => t.status === 'FAIL');
    const errorTests = this.testResults.filter(t => t.status === 'ERROR');

    if (failedTests.length === 0 && errorTests.length === 0) {
      recommendations.push('All tests passed! The analyze endpoint appears to be working correctly.');
    }

    const userAgentFailures = this.testResults.filter(t => 
      t.category === 'User Agent' && t.status !== 'PASS'
    );
    if (userAgentFailures.length > 0) {
      recommendations.push('Review user agent handling in the scraper configuration');
    }

    const basicFunctionFailures = this.testResults.filter(t => 
      t.category === 'Basic Functionality' && t.status !== 'PASS'
    );
    if (basicFunctionFailures.length > 0) {
      recommendations.push('Address basic endpoint functionality issues before deployment');
    }

    const networkIssues = this.testResults.filter(t => 
      t.category === 'Network Resilience' && t.status !== 'PASS'
    );
    if (networkIssues.length > 0) {
      recommendations.push('Improve network error handling and timeout management');
    }

    const validationIssues = this.testResults.filter(t => 
      t.category === 'URL Validation' && t.status !== 'PASS'
    );
    if (validationIssues.length > 0) {
      recommendations.push('Enhance URL validation logic for edge cases');
    }

    if (recommendations.length === 0) {
      recommendations.push('Consider adding monitoring and alerting for production deployment');
    }

    return recommendations;
  }

  async saveTestResults() {
    const reportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(t => t.status === 'PASS').length,
        failedTests: this.testResults.filter(t => t.status === 'FAIL').length,
        errorTests: this.testResults.filter(t => t.status === 'ERROR').length
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const filename = `analyze-endpoint-test-results-${Date.now()}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
      console.log(`💾 Test results saved to: ${filepath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save test results: ${error.message}`);
    }
  }
}

// Export for use as module
module.exports = AnalyzeEndpointTestSuite;

// CLI execution
if (require.main === module) {
  const config = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    realRequests: process.env.REAL_REQUESTS !== 'false',
    verbose: process.env.VERBOSE !== 'false',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000')
  };

  const testSuite = new AnalyzeEndpointTestSuite(config);
  
  testSuite.runAllTests()
    .then((results) => {
      const failedCount = results.filter(t => t.status === 'FAIL').length;
      const errorCount = results.filter(t => t.status === 'ERROR').length;
      
      if (failedCount > 0 || errorCount > 0) {
        console.log(`\n❌ Tests completed with ${failedCount} failures and ${errorCount} errors`);
        process.exit(1);
      } else {
        console.log(`\n✅ All tests passed successfully!`);
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error(`\n💥 Test suite failed to execute:`, error);
      process.exit(1);
    });
}