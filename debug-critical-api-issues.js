// 🔧 CRITICAL API ENDPOINT DEBUGGING SCRIPT
// Comprehensive testing of /api/analyze and /api/create-checkout-session endpoints
// This script identifies and documents all the issues found in Cora's audit

const axios = require('axios');
const { performance } = require('perf_hooks');

class CriticalAPIDebugger {
  constructor(baseUrl = 'http://localhost:3005') {
    this.baseUrl = baseUrl;
    this.issues = [];
    this.fixes = [];
  }

  logIssue(component, severity, issue, details = {}) {
    const issueObj = {
      component,
      severity,
      issue,
      details,
      timestamp: new Date().toISOString()
    };
    this.issues.push(issueObj);
    console.log(`🔴 [${severity}] ${component}: ${issue}`);
    if (Object.keys(details).length > 0) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
  }

  logFix(component, fix, implementation = '') {
    const fixObj = {
      component,
      fix,
      implementation,
      timestamp: new Date().toISOString()
    };
    this.fixes.push(fixObj);
    console.log(`✅ [FIX] ${component}: ${fix}`);
    if (implementation) {
      console.log('   Implementation:', implementation);
    }
  }

  async testAnalyzeEndpoint() {
    console.log('\n🧪 TESTING /api/analyze ENDPOINT');
    console.log('=' .repeat(50));

    const testCases = [
      {
        name: 'Valid website analysis',
        payload: {
          url: 'https://example.com',
          options: JSON.stringify({ deep: false })
        }
      },
      {
        name: 'Problematic website (timeout risk)',
        payload: {
          url: 'https://httpstat.us/200?sleep=20000', // 20 second delay
          options: JSON.stringify({ deep: true })
        }
      },
      {
        name: 'Invalid URL',
        payload: {
          url: 'invalid-url',
          options: JSON.stringify({})
        }
      },
      {
        name: 'Missing parameters',
        payload: {}
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      
      try {
        const startTime = performance.now();
        const response = await axios.post(`${this.baseUrl}/api/analyze`, testCase.payload, {
          timeout: 35000, // 35 second timeout to catch 30-second delays
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        console.log(`   ✅ Response time: ${duration}ms`);
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   ✅ Response structure:`, {
          hasSuccess: 'success' in response.data,
          hasData: 'data' in response.data,
          hasError: 'error' in response.data,
          hasRequestId: 'requestId' in response.data
        });

        // Check for timeout issues
        if (duration > 30000) {
          this.logIssue('analyze-endpoint', 'CRITICAL', 'Response time exceeds 30 seconds', {
            duration: `${duration}ms`,
            testCase: testCase.name
          });
        }

        // Check response structure
        if (!response.data.success && !response.data.error) {
          this.logIssue('analyze-endpoint', 'CRITICAL', 'Inconsistent response structure', {
            response: response.data,
            testCase: testCase.name
          });
        }

      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - (error.config?.timeout || 0));
        
        console.log(`   ❌ Error: ${error.message}`);
        
        if (error.code === 'ECONNABORTED') {
          this.logIssue('analyze-endpoint', 'CRITICAL', '30-second timeout failure', {
            duration: `${duration}ms`,
            testCase: testCase.name,
            error: error.message
          });
        } else if (error.response) {
          console.log(`   ❌ Status: ${error.response.status}`);
          console.log(`   ❌ Response:`, error.response.data);
          
          if (error.response.status === 500) {
            this.logIssue('analyze-endpoint', 'CRITICAL', 'Internal server error', {
              status: error.response.status,
              response: error.response.data,
              testCase: testCase.name
            });
          }
        } else {
          this.logIssue('analyze-endpoint', 'CRITICAL', 'Network or connection error', {
            error: error.message,
            code: error.code,
            testCase: testCase.name
          });
        }
      }
    }
  }

  async testCheckoutEndpoint() {
    console.log('\n🧪 TESTING /api/create-checkout-session ENDPOINT');
    console.log('=' .repeat(50));

    const testCases = [
      {
        name: 'Valid starter plan checkout',
        payload: {
          plan: 'starter',
          user_email: 'test@example.com',
          user_id: 'test_user_123',
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel'
        }
      },
      {
        name: 'Valid growth plan checkout',
        payload: {
          plan: 'growth',
          user_email: 'test@example.com',
          user_id: 'test_user_123'
        }
      },
      {
        name: 'Invalid plan',
        payload: {
          plan: 'invalid_plan',
          user_email: 'test@example.com',
          user_id: 'test_user_123'
        }
      },
      {
        name: 'Missing required parameters',
        payload: {
          plan: 'starter'
        }
      },
      {
        name: 'Empty request body',
        payload: {}
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      
      try {
        const startTime = performance.now();
        const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, testCase.payload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        console.log(`   ✅ Response time: ${duration}ms`);
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   ✅ Response structure:`, {
          hasSuccess: 'success' in response.data,
          hasData: 'data' in response.data,
          hasError: 'error' in response.data,
          hasRequestId: 'requestId' in response.data,
          developmentMode: response.data.data?.development_mode
        });

        // Check Stripe integration
        if (response.data.success && response.data.data) {
          const checkoutSession = response.data.data.checkout_session;
          if (checkoutSession) {
            console.log(`   ✅ Checkout session created: ${checkoutSession.id}`);
            console.log(`   ✅ Checkout URL: ${checkoutSession.url?.substring(0, 50)}...`);
          }
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        
        if (error.response) {
          console.log(`   ❌ Status: ${error.response.status}`);
          console.log(`   ❌ Response:`, error.response.data);
          
          if (error.response.status === 500) {
            this.logIssue('checkout-endpoint', 'CRITICAL', 'Stripe authentication mismatch', {
              status: error.response.status,
              response: error.response.data,
              testCase: testCase.name
            });
          } else if (error.response.status === 400) {
            console.log(`   ℹ️  Expected validation error for: ${testCase.name}`);
          }
        } else {
          this.logIssue('checkout-endpoint', 'CRITICAL', 'Network or connection error', {
            error: error.message,
            code: error.code,
            testCase: testCase.name
          });
        }
      }
    }
  }

  async testApiResponseStructure() {
    console.log('\n🧪 TESTING API RESPONSE STRUCTURE CONSISTENCY');
    console.log('=' .repeat(50));

    // Test both endpoints with valid data to check response structure
    const tests = [
      {
        endpoint: '/api/analyze',
        payload: {
          url: 'https://example.com',
          options: '{}'
        }
      },
      {
        endpoint: '/api/create-checkout-session',
        payload: {
          plan: 'starter',
          user_email: 'test@example.com',
          user_id: 'test_user_123'
        }
      }
    ];

    for (const test of tests) {
      console.log(`\n🔍 Testing response structure: ${test.endpoint}`);
      
      try {
        const response = await axios.post(`${this.baseUrl}${test.endpoint}`, test.payload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const structure = {
          hasSuccess: 'success' in response.data,
          hasData: 'data' in response.data,
          hasError: 'error' in response.data,
          hasRequestId: 'requestId' in response.data,
          successValue: response.data.success,
          dataType: typeof response.data.data,
          statusCode: response.status
        };

        console.log(`   ✅ Response structure:`, structure);

        // Check for consistent structure
        if (!structure.hasSuccess || !structure.hasRequestId) {
          this.logIssue('response-structure', 'CRITICAL', 'Inconsistent API response format', {
            endpoint: test.endpoint,
            structure,
            missing: {
              success: !structure.hasSuccess,
              requestId: !structure.hasRequestId
            }
          });
        }

      } catch (error) {
        if (error.response) {
          const errorStructure = {
            hasSuccess: 'success' in error.response.data,
            hasError: 'error' in error.response.data,
            hasRequestId: 'requestId' in error.response.data,
            statusCode: error.response.status,
            errorMessage: error.response.data.error?.message || 'No message',
            errorCode: error.response.data.error?.code || 'No code'
          };

          console.log(`   ❌ Error response structure:`, errorStructure);

          if (!errorStructure.hasError || !errorStructure.hasRequestId) {
            this.logIssue('response-structure', 'CRITICAL', 'Inconsistent error response format', {
              endpoint: test.endpoint,
              structure: errorStructure
            });
          }
        }
      }
    }
  }

  generateReport() {
    console.log('\n📊 CRITICAL ISSUES SUMMARY');
    console.log('=' .repeat(50));

    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
    
    console.log(`Total Critical Issues Found: ${criticalIssues.length}`);
    
    if (criticalIssues.length === 0) {
      console.log('✅ No critical issues detected');
      return;
    }

    // Group issues by component
    const issuesByComponent = {};
    criticalIssues.forEach(issue => {
      if (!issuesByComponent[issue.component]) {
        issuesByComponent[issue.component] = [];
      }
      issuesByComponent[issue.component].push(issue);
    });

    Object.entries(issuesByComponent).forEach(([component, issues]) => {
      console.log(`\n🔴 ${component.toUpperCase()}`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.issue}`);
        if (Object.keys(issue.details).length > 0) {
          console.log(`      Details: ${JSON.stringify(issue.details, null, 6)}`);
        }
      });
    });

    console.log('\n💡 RECOMMENDED FIXES');
    console.log('=' .repeat(30));
    this.generateRecommendedFixes();
  }

  generateRecommendedFixes() {
    const recommendations = [
      {
        issue: 'analyze-endpoint timeout failures',
        fixes: [
          'Implement request timeout configuration (15s for free tier, 30s for paid)',
          'Add optimized scraping with early timeout detection',
          'Implement fallback to async processing for slow websites',
          'Add proper error handling for timeout scenarios'
        ]
      },
      {
        issue: 'checkout-endpoint Stripe authentication',
        fixes: [
          'Verify STRIPE_SECRET_KEY environment variable is set',
          'Check all STRIPE_*_PRICE_ID environment variables match dashboard',
          'Add better error messages for Stripe configuration issues',
          'Implement proper development/production key detection'
        ]
      },
      {
        issue: 'API response structure inconsistency',
        fixes: [
          'Standardize all responses to include: success, data/error, requestId',
          'Add proper HTTP status codes for all error types',
          'Implement structured error messages instead of generic ones',
          'Add request/response logging for debugging'
        ]
      }
    ];

    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. FIXING: ${rec.issue}`);
      rec.fixes.forEach((fix, fixIndex) => {
        console.log(`   ${String.fromCharCode(97 + fixIndex)}. ${fix}`);
      });
    });
  }

  async runFullDiagnostic() {
    console.log('🚀 STARTING CRITICAL API ENDPOINT DIAGNOSTIC');
    console.log('=' .repeat(60));
    console.log('This script will identify the root causes of API failures');
    console.log('reported in Cora\'s audit for DirectoryBolt');
    console.log('');

    try {
      // Test if server is running
      await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      console.log('✅ Server is running and responding');
    } catch (error) {
      console.log('❌ Server is not running or not responding');
      console.log('   Please start the development server: npm run dev');
      return;
    }

    await this.testAnalyzeEndpoint();
    await this.testCheckoutEndpoint();
    await this.testApiResponseStructure();
    
    this.generateReport();

    console.log('\n🎯 NEXT STEPS');
    console.log('=' .repeat(20));
    console.log('1. Review the critical issues identified above');
    console.log('2. Implement the recommended fixes');
    console.log('3. Test each endpoint after fixes are applied');
    console.log('4. Run this script again to verify fixes');
    console.log('5. Deploy and test in production environment');
  }
}

// Run the diagnostic
async function main() {
  const apiDebugger = new CriticalAPIDebugger();
  await apiDebugger.runFullDiagnostic();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CriticalAPIDebugger;