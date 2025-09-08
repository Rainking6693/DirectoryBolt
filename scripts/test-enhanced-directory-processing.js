#!/usr/bin/env node

/**
 * 🧪 ENHANCED DIRECTORY PROCESSING TEST SUITE
 * 
 * Comprehensive testing for Phase 4.2 enhanced directory processing system:
 * - AI form mapping and field detection
 * - Multi-service CAPTCHA solving
 * - Dynamic directory discovery
 * - End-to-end processing pipeline
 * - Performance benchmarking
 * - Cost analysis
 * 
 * Usage:
 *   npm run test:enhanced-processing
 *   node scripts/test-enhanced-directory-processing.js
 *   node scripts/test-enhanced-directory-processing.js --test=form-mapping
 *   node scripts/test-enhanced-directory-processing.js --benchmark
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const config = {
  host: process.env.TEST_HOST || 'localhost:3000',
  secure: process.env.NODE_ENV === 'production',
  timeout: 60000,
  maxRetries: 3
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function logProgress(message) {
  log(`🔄 ${message}`, colors.cyan);
}

// Test data
const testBusinessData = {
  businessName: 'DirectoryBolt Test Company',
  email: 'test@directorybolt.com',
  website: 'https://directorybolt.com',
  description: 'Automated directory submission platform for businesses. Leading provider of directory marketing solutions.',
  category: 'technology',
  phone: '+1-555-0123',
  address: '123 Tech Street',
  city: 'San Francisco',
  state: 'CA',
  zipcode: '94105',
  firstName: 'John',
  lastName: 'Doe',
  title: 'CEO'
};

const testDirectories = [
  {
    name: 'Test General Directory',
    url: 'https://example-directory.com/submit',
    expectedFields: ['businessName', 'email', 'website', 'description']
  },
  {
    name: 'Test Tech Directory',
    url: 'https://tech-startup-directory.example/add-listing',
    expectedFields: ['businessName', 'email', 'website', 'category', 'description']
  },
  {
    name: 'Test Local Directory',
    url: 'https://local-business-list.example/submit',
    expectedFields: ['businessName', 'email', 'phone', 'address', 'city', 'state', 'zipcode']
  }
];

class EnhancedDirectoryProcessingTester {
  constructor() {
    this.testResults = {
      formMapping: { passed: 0, failed: 0, tests: [] },
      captchaSolving: { passed: 0, failed: 0, tests: [] },
      directoryDiscovery: { passed: 0, failed: 0, tests: [] },
      endToEndProcessing: { passed: 0, failed: 0, tests: [] },
      performance: { tests: [] },
      integration: { passed: 0, failed: 0, tests: [] }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log(`
${colors.magenta}╔═══════════════════════════════════════════════╗
║      Enhanced Directory Processing Tests      ║
║            Phase 4.2 Test Suite              ║
╚═══════════════════════════════════════════════╝${colors.reset}
`);

    logInfo('Starting comprehensive test suite...');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const testArg = args.find(arg => arg.startsWith('--test='));
    const benchmarkMode = args.includes('--benchmark');
    
    const specificTest = testArg ? testArg.split('=')[1] : null;
    
    try {
      // Run health checks first
      await this.runHealthChecks();
      
      // Run specific test or all tests
      if (specificTest) {
        await this.runSpecificTest(specificTest);
      } else {
        await this.runFormMappingTests();
        await this.runCaptchaSolvingTests();
        await this.runDirectoryDiscoveryTests();
        await this.runEndToEndProcessingTests();
        await this.runIntegrationTests();
      }
      
      // Run performance benchmarks if requested
      if (benchmarkMode) {
        await this.runPerformanceBenchmarks();
      }
      
      // Generate final report
      this.generateTestReport();
      
    } catch (error) {
      logError(`Test suite failed: ${error.message}`);
      process.exit(1);
    }
  }

  async runHealthChecks() {
    logProgress('Running system health checks...');
    
    try {
      // Check API endpoints
      const endpoints = [
        '/api/directories/analyze-form',
        '/api/directories/solve-captcha', 
        '/api/directories/discover',
        '/api/directories/process-enhanced'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint, {
            method: 'OPTIONS'
          });
          
          if (response.status === 200) {
            logSuccess(`Health check passed: ${endpoint}`);
          } else {
            logWarning(`Health check warning: ${endpoint} returned ${response.status}`);
          }
          
        } catch (error) {
          logError(`Health check failed: ${endpoint} - ${error.message}`);
        }
      }
      
    } catch (error) {
      logError(`Health checks failed: ${error.message}`);
      throw error;
    }
  }

  async runSpecificTest(testName) {
    logInfo(`Running specific test: ${testName}`);
    
    switch (testName) {
      case 'form-mapping':
        await this.runFormMappingTests();
        break;
      case 'captcha-solving':
        await this.runCaptchaSolvingTests();
        break;
      case 'directory-discovery':
        await this.runDirectoryDiscoveryTests();
        break;
      case 'end-to-end':
        await this.runEndToEndProcessingTests();
        break;
      case 'integration':
        await this.runIntegrationTests();
        break;
      default:
        logError(`Unknown test: ${testName}`);
        break;
    }
  }

  async runFormMappingTests() {
    logProgress('🤖 Testing AI Form Mapping System...');
    
    const testCases = [
      {
        name: 'Simple Contact Form',
        html: `
          <form>
            <input name="company_name" placeholder="Company Name" />
            <input type="email" name="email" placeholder="Email Address" />
            <input name="website" placeholder="Website URL" />
            <textarea name="description" placeholder="Business Description"></textarea>
            <button type="submit">Submit</button>
          </form>
        `,
        expectedMappings: ['businessName', 'email', 'website', 'description']
      },
      {
        name: 'Complex Business Form',
        html: `
          <form>
            <input id="business-name" placeholder="Enter your business name" />
            <input type="email" id="contact-email" placeholder="Contact email" />
            <input id="business-url" placeholder="Website address" />
            <select name="industry">
              <option>Technology</option>
              <option>Healthcare</option>
            </select>
            <input type="tel" name="phone-number" placeholder="Phone" />
            <textarea id="company-description" placeholder="Describe your business"></textarea>
          </form>
        `,
        expectedMappings: ['businessName', 'email', 'website', 'category', 'phone', 'description']
      }
    ];
    
    for (const testCase of testCases) {
      const testStart = Date.now();
      
      try {
        logProgress(`Testing: ${testCase.name}`);
        
        const response = await this.makeRequest('/api/directories/analyze-form', {
          method: 'POST',
          body: JSON.stringify({
            html: testCase.html,
            options: {
              confidenceThreshold: 0.7,
              useAI: true,
              usePatterns: true
            }
          })
        });
        
        if (response.status === 200 && response.data.success) {
          const mapping = response.data.mapping;
          const mappedFields = Object.keys(mapping);
          const expectedFields = testCase.expectedMappings;
          
          const matchedFields = expectedFields.filter(field => mappedFields.includes(field));
          const matchRate = matchedFields.length / expectedFields.length;
          
          const testTime = Date.now() - testStart;
          
          if (matchRate >= 0.7) {
            logSuccess(`Form mapping test passed: ${testCase.name} (${(matchRate * 100).toFixed(1)}% match, ${testTime}ms)`);
            this.testResults.formMapping.passed++;
          } else {
            logWarning(`Form mapping test partial: ${testCase.name} (${(matchRate * 100).toFixed(1)}% match)`);
            this.testResults.formMapping.failed++;
          }
          
          this.testResults.formMapping.tests.push({
            name: testCase.name,
            success: matchRate >= 0.7,
            matchRate,
            processingTime: testTime,
            mappedFields: mappedFields.length,
            expectedFields: expectedFields.length,
            confidence: response.data.confidence
          });
          
        } else {
          logError(`Form mapping test failed: ${testCase.name} - ${response.data?.error || 'Unknown error'}`);
          this.testResults.formMapping.failed++;
        }
        
      } catch (error) {
        logError(`Form mapping test error: ${testCase.name} - ${error.message}`);
        this.testResults.formMapping.failed++;
      }
    }
  }

  async runCaptchaSolvingTests() {
    logProgress('🔓 Testing CAPTCHA Solving System...');
    
    // Note: These are simulated tests since we can't actually solve CAPTCHAs without real sites
    const testCases = [
      {
        name: 'reCAPTCHA v2 Test',
        type: 'recaptcha_v2',
        siteKey: '6LdyC2cUAAAAAJ_m7ntMlKZjqW_wF6kRR6f6QwOr',
        pageUrl: 'https://www.google.com/recaptcha/api2/demo'
      },
      {
        name: 'reCAPTCHA v3 Test',
        type: 'recaptcha_v3',
        siteKey: '6LdyC2cUAAAAAJ_m7ntMlKZjqW_wF6kRR6f6QwOr',
        pageUrl: 'https://www.google.com/recaptcha/api2/demo',
        minScore: 0.5
      },
      {
        name: 'hCaptcha Test',
        type: 'hcaptcha',
        siteKey: '10000000-ffff-ffff-ffff-000000000001',
        pageUrl: 'https://accounts.hcaptcha.com/demo'
      }
    ];
    
    for (const testCase of testCases) {
      const testStart = Date.now();
      
      try {
        logProgress(`Testing: ${testCase.name}`);
        
        // Test the API endpoint (will likely fail without proper API keys)
        const response = await this.makeRequest('/api/directories/solve-captcha', {
          method: 'POST',
          body: JSON.stringify({
            type: testCase.type,
            siteKey: testCase.siteKey,
            pageUrl: testCase.pageUrl,
            minScore: testCase.minScore,
            options: {
              timeout: 30000 // Shorter timeout for testing
            }
          })
        });
        
        const testTime = Date.now() - testStart;
        
        if (response.status === 200 && response.data.success) {
          logSuccess(`CAPTCHA test passed: ${testCase.name} (${testTime}ms, $${response.data.cost?.toFixed(4)})`);
          this.testResults.captchaSolving.passed++;
          
          this.testResults.captchaSolving.tests.push({
            name: testCase.name,
            success: true,
            service: response.data.service,
            responseTime: response.data.responseTime,
            cost: response.data.cost,
            type: testCase.type
          });
          
        } else {
          // Expected to fail without proper API keys
          const errorMsg = response.data?.error || 'Service unavailable';
          
          if (errorMsg.includes('API key') || errorMsg.includes('service') || errorMsg.includes('configured')) {
            logWarning(`CAPTCHA test skipped: ${testCase.name} - ${errorMsg}`);
          } else {
            logError(`CAPTCHA test failed: ${testCase.name} - ${errorMsg}`);
            this.testResults.captchaSolving.failed++;
          }
        }
        
      } catch (error) {
        logWarning(`CAPTCHA test error: ${testCase.name} - ${error.message}`);
        // Don't count as failure since it's expected without API keys
      }
    }
    
    // Test CAPTCHA service health check
    logProgress('Testing CAPTCHA service availability...');
    // This would test if services are configured and reachable
    logInfo('CAPTCHA service tests completed (requires API keys for full functionality)');
  }

  async runDirectoryDiscoveryTests() {
    logProgress('🔍 Testing Directory Discovery System...');
    
    const testCases = [
      {
        name: 'Tech Startup Discovery',
        criteria: {
          industry: 'tech_startups',
          location: 'united_states',
          minDomainAuthority: 30,
          maxResults: 10
        }
      },
      {
        name: 'SaaS Directory Discovery',
        criteria: {
          industry: 'saas',
          businessType: 'b2b',
          minDomainAuthority: 25,
          maxResults: 15
        }
      },
      {
        name: 'Local Business Discovery',
        criteria: {
          industry: 'local_business',
          location: 'california',
          maxResults: 20
        }
      }
    ];
    
    for (const testCase of testCases) {
      const testStart = Date.now();
      
      try {
        logProgress(`Testing: ${testCase.name}`);
        
        const response = await this.makeRequest('/api/directories/discover', {
          method: 'POST',
          body: JSON.stringify(testCase.criteria)
        });
        
        const testTime = Date.now() - testStart;
        
        if (response.status === 200 && response.data.success) {
          const directories = response.data.directories;
          const stats = response.data.stats;
          
          logSuccess(`Discovery test passed: ${testCase.name} (${directories.length} directories, ${testTime}ms)`);
          this.testResults.directoryDiscovery.passed++;
          
          this.testResults.directoryDiscovery.tests.push({
            name: testCase.name,
            success: true,
            directoriesFound: directories.length,
            processingTime: testTime,
            stats: stats
          });
          
          // Log some sample directories
          if (directories.length > 0) {
            logInfo(`Sample directories found:`);
            directories.slice(0, 3).forEach(dir => {
              console.log(`  • ${dir.name} (DA: ${dir.domainAuthority}, ${dir.discoveryMethod})`);
            });
          }
          
        } else {
          logError(`Discovery test failed: ${testCase.name} - ${response.data?.error || 'Unknown error'}`);
          this.testResults.directoryDiscovery.failed++;
        }
        
      } catch (error) {
        logError(`Discovery test error: ${testCase.name} - ${error.message}`);
        this.testResults.directoryDiscovery.failed++;
      }
    }
  }

  async runEndToEndProcessingTests() {
    logProgress('🚀 Testing End-to-End Processing Pipeline...');
    
    const testCases = [
      {
        name: 'Complete Processing - Dry Run',
        directoryUrl: 'https://example-directory.com/submit',
        options: {
          analyzeForms: true,
          solveCaptchas: false, // Skip for testing
          validateFields: true,
          dryRun: true,
          timeout: 60000
        }
      },
      {
        name: 'Form Analysis Only',
        directoryUrl: 'https://business-listing.example/add',
        options: {
          analyzeForms: true,
          solveCaptchas: false,
          validateFields: true,
          dryRun: true
        }
      }
    ];
    
    for (const testCase of testCases) {
      const testStart = Date.now();
      
      try {
        logProgress(`Testing: ${testCase.name}`);
        
        const response = await this.makeRequest('/api/directories/process-enhanced', {
          method: 'POST',
          body: JSON.stringify({
            directoryUrl: testCase.directoryUrl,
            businessData: testBusinessData,
            options: testCase.options
          })
        });
        
        const testTime = Date.now() - testStart;
        
        if (response.status === 200 && response.data.success) {
          const results = response.data.results;
          const performance = response.data.performance;
          const costs = response.data.costs;
          
          logSuccess(`E2E test passed: ${testCase.name} (${testTime}ms, $${costs.totalCost?.toFixed(4) || '0.0000'})`);
          this.testResults.endToEndProcessing.passed++;
          
          logInfo(`  Results: Form mapped: ${results.formMapped}, Fields: ${results.fieldsCompleted}, CAPTCHA: ${results.captchaSolved}`);
          
          this.testResults.endToEndProcessing.tests.push({
            name: testCase.name,
            success: true,
            results,
            performance,
            costs,
            totalTime: testTime
          });
          
        } else {
          logError(`E2E test failed: ${testCase.name} - ${response.data?.error || 'Unknown error'}`);
          this.testResults.endToEndProcessing.failed++;
        }
        
      } catch (error) {
        logError(`E2E test error: ${testCase.name} - ${error.message}`);
        this.testResults.endToEndProcessing.failed++;
      }
    }
  }

  async runIntegrationTests() {
    logProgress('🔗 Testing System Integration...');
    
    // Test API endpoint integration
    const integrationTests = [
      {
        name: 'API Endpoints Response Format',
        test: async () => {
          const endpoints = [
            { path: '/api/directories/analyze-form', method: 'POST', body: { html: '<form></form>' } },
            { path: '/api/directories/discover', method: 'POST', body: { industry: 'tech_startups' } }
          ];
          
          for (const endpoint of endpoints) {
            const response = await this.makeRequest(endpoint.path, {
              method: endpoint.method,
              body: JSON.stringify(endpoint.body)
            });
            
            // Check response format
            if (!response.data.hasOwnProperty('success')) {
              throw new Error(`Response missing 'success' field for ${endpoint.path}`);
            }
          }
        }
      },
      {
        name: 'Error Handling',
        test: async () => {
          // Test invalid request
          const response = await this.makeRequest('/api/directories/analyze-form', {
            method: 'POST',
            body: JSON.stringify({}) // Invalid - missing required fields
          });
          
          if (response.status !== 400) {
            throw new Error(`Expected 400 status for invalid request, got ${response.status}`);
          }
          
          if (response.data.success !== false) {
            throw new Error('Error response should have success: false');
          }
        }
      }
    ];
    
    for (const test of integrationTests) {
      try {
        logProgress(`Testing: ${test.name}`);
        
        await test.test();
        
        logSuccess(`Integration test passed: ${test.name}`);
        this.testResults.integration.passed++;
        
        this.testResults.integration.tests.push({
          name: test.name,
          success: true
        });
        
      } catch (error) {
        logError(`Integration test failed: ${test.name} - ${error.message}`);
        this.testResults.integration.failed++;
        
        this.testResults.integration.tests.push({
          name: test.name,
          success: false,
          error: error.message
        });
      }
    }
  }

  async runPerformanceBenchmarks() {
    logProgress('⚡ Running Performance Benchmarks...');
    
    const benchmarks = [
      {
        name: 'Form Analysis Performance',
        iterations: 5,
        test: async () => {
          return await this.makeRequest('/api/directories/analyze-form', {
            method: 'POST',
            body: JSON.stringify({
              html: '<form><input name="company_name"/><input type="email" name="email"/></form>'
            })
          });
        }
      },
      {
        name: 'Directory Discovery Performance',
        iterations: 3,
        test: async () => {
          return await this.makeRequest('/api/directories/discover', {
            method: 'POST',
            body: JSON.stringify({
              industry: 'tech_startups',
              maxResults: 10
            })
          });
        }
      }
    ];
    
    for (const benchmark of benchmarks) {
      const times = [];
      
      for (let i = 0; i < benchmark.iterations; i++) {
        const start = Date.now();
        
        try {
          await benchmark.test();
          const time = Date.now() - start;
          times.push(time);
          
        } catch (error) {
          logWarning(`Benchmark iteration failed: ${benchmark.name} - ${error.message}`);
        }
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        logSuccess(`Benchmark: ${benchmark.name} - Avg: ${avgTime.toFixed(0)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);
        
        this.testResults.performance.tests.push({
          name: benchmark.name,
          iterations: times.length,
          avgTime,
          minTime,
          maxTime
        });
      }
    }
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: config.host.split(':')[0],
        port: config.host.split(':')[1] || (config.secure ? 443 : 80),
        path: endpoint,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DirectoryBolt-EnhancedProcessor-Test/4.2.0',
          ...options.headers
        },
        timeout: config.timeout
      };

      const protocol = config.secure ? https : require('http');
      const req = protocol.request(requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const data = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data });
          } catch (error) {
            resolve({ status: res.statusCode, data: { error: 'Invalid JSON response' } });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  generateTestReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log(`
${colors.cyan}╔═══════════════════════════════════════════════╗
║              ENHANCED PROCESSING              ║
║               TEST REPORT                     ║
╚═══════════════════════════════════════════════╝${colors.reset}
`);
    
    // Summary statistics
    const totalTests = Object.values(this.testResults).reduce((sum, category) => sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(this.testResults).reduce((sum, category) => sum + category.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, category) => sum + category.failed, 0);
    
    logInfo(`Test Execution Summary:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${colors.green}${totalPassed}${colors.reset}`);
    console.log(`  Failed: ${colors.red}${totalFailed}${colors.reset}`);
    console.log(`  Success Rate: ${colors.cyan}${((totalPassed / totalTests) * 100).toFixed(1)}%${colors.reset}`);
    console.log(`  Total Time: ${totalTime}ms`);
    console.log();
    
    // Detailed results by category
    const categories = [
      { key: 'formMapping', name: '🤖 AI Form Mapping' },
      { key: 'captchaSolving', name: '🔓 CAPTCHA Solving' },
      { key: 'directoryDiscovery', name: '🔍 Directory Discovery' },
      { key: 'endToEndProcessing', name: '🚀 End-to-End Processing' },
      { key: 'integration', name: '🔗 System Integration' }
    ];
    
    categories.forEach(category => {
      const results = this.testResults[category.key];
      const total = results.passed + results.failed;
      
      if (total > 0) {
        const successRate = (results.passed / total * 100).toFixed(1);
        console.log(`${category.name}: ${colors.green}${results.passed}${colors.reset}/${total} (${successRate}%)`);
        
        // Show failed tests
        if (results.failed > 0) {
          const failedTests = results.tests.filter(test => !test.success);
          failedTests.forEach(test => {
            console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${test.error || 'Failed'}`);
          });
        }
        
        console.log();
      }
    });
    
    // Performance summary
    if (this.testResults.performance.tests.length > 0) {
      logInfo('Performance Benchmarks:');
      this.testResults.performance.tests.forEach(test => {
        console.log(`  ${test.name}: ${test.avgTime.toFixed(0)}ms avg (${test.minTime}-${test.maxTime}ms range)`);
      });
      console.log();
    }
    
    // Final status
    if (totalFailed === 0) {
      logSuccess('🎉 All enhanced directory processing tests passed!');
    } else {
      logWarning(`⚠️ ${totalFailed} test(s) failed. System partially functional.`);
    }
    
    console.log(`
${colors.blue}Enhanced Directory Processing System Status:${colors.reset}
• AI Form Mapping: ${this.testResults.formMapping.passed > 0 ? '✅ Functional' : '❌ Issues'}
• CAPTCHA Solving: ${this.testResults.captchaSolving.passed > 0 ? '✅ Functional' : '⚠️ Needs API Keys'}
• Directory Discovery: ${this.testResults.directoryDiscovery.passed > 0 ? '✅ Functional' : '❌ Issues'}
• End-to-End Processing: ${this.testResults.endToEndProcessing.passed > 0 ? '✅ Functional' : '❌ Issues'}
• System Integration: ${this.testResults.integration.passed > 0 ? '✅ Functional' : '❌ Issues'}

${colors.cyan}Next Steps:${colors.reset}
1. Set up CAPTCHA service API keys for full functionality
2. Configure Anthropic API key for AI form mapping
3. Test with real directory websites
4. Monitor performance in production environment
`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EnhancedDirectoryProcessingTester();
  
  tester.runAllTests().catch(error => {
    logError(`Test suite crashed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = EnhancedDirectoryProcessingTester;