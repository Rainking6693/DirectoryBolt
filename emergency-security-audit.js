// 🚨 EMERGENCY SECURITY AND PERFORMANCE AUDIT
// Comprehensive security vulnerability scanning and performance testing suite
// For DirectoryBolt production system audit

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://directorybolt.com',
  localUrl: 'http://localhost:3000',
  testEnvironment: process.env.NODE_ENV === 'production' ? 'production' : 'local',
  maxConcurrentRequests: 10,
  loadTestDuration: 30000, // 30 seconds
  securityTestTimeout: 5000,
  reportPath: './security-audit-report.json'
};

// Test results storage
const auditResults = {
  timestamp: new Date().toISOString(),
  environment: CONFIG.testEnvironment,
  baseUrl: CONFIG.testEnvironment === 'production' ? CONFIG.baseUrl : CONFIG.localUrl,
  securityTests: [],
  performanceTests: [],
  vulnerabilities: [],
  criticalIssues: [],
  summary: {}
};

console.log('🚨 EMERGENCY SECURITY AUDIT INITIATED');
console.log(`Target: ${auditResults.baseUrl}`);
console.log(`Environment: ${CONFIG.testEnvironment}`);

// Security Test Suite
const SECURITY_TESTS = [
  {
    name: 'XSS_INPUT_VALIDATION',
    description: 'Test for Cross-Site Scripting vulnerabilities',
    severity: 'HIGH',
    test: async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        '\';alert("XSS");//',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>'
      ];

      for (const payload of xssPayloads) {
        try {
          const response = await axios.post(`${auditResults.baseUrl}/api/analyze`, {
            url: payload,
            timeout: CONFIG.securityTestTimeout
          });
          
          if (response.data && response.data.includes(payload)) {
            return {
              vulnerable: true,
              payload: payload,
              response: response.data.substring(0, 200)
            };
          }
        } catch (error) {
          // Expected for malformed requests
        }
      }
      return { vulnerable: false };
    }
  },
  {
    name: 'SQL_INJECTION',
    description: 'Test for SQL injection vulnerabilities',
    severity: 'CRITICAL',
    test: async () => {
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1#"
      ];

      for (const payload of sqlPayloads) {
        try {
          const response = await axios.post(`${auditResults.baseUrl}/api/auth/login`, {
            email: `test${payload}@test.com`,
            password: `password${payload}`,
            timeout: CONFIG.securityTestTimeout
          });
          
          if (response.status === 200 && response.data.success) {
            return {
              vulnerable: true,
              payload: payload,
              response: 'Successful login with SQL injection payload'
            };
          }
        } catch (error) {
          // Check for database error messages
          if (error.response && error.response.data && 
              typeof error.response.data === 'string' && 
              /sql|database|mysql|postgres/i.test(error.response.data)) {
            return {
              vulnerable: true,
              payload: payload,
              response: 'Database error exposed'
            };
          }
        }
      }
      return { vulnerable: false };
    }
  },
  {
    name: 'CSRF_PROTECTION',
    description: 'Test for CSRF protection on sensitive endpoints',
    severity: 'HIGH',
    test: async () => {
      try {
        // Test payment endpoint without CSRF token
        const response = await axios.post(`${auditResults.baseUrl}/api/create-checkout-session`, {
          plan: 'professional',
          timeout: CONFIG.securityTestTimeout
        }, {
          headers: {
            'Origin': 'https://malicious-site.com'
          }
        });
        
        if (response.status === 200) {
          return {
            vulnerable: true,
            payload: 'Cross-origin request without CSRF token',
            response: 'Request succeeded without CSRF protection'
          };
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          return { vulnerable: false, message: 'CSRF protection working' };
        }
      }
      return { vulnerable: false };
    }
  },
  {
    name: 'RATE_LIMITING',
    description: 'Test rate limiting on API endpoints',
    severity: 'MEDIUM',
    test: async () => {
      const requests = [];
      const endpoint = `${auditResults.baseUrl}/api/analyze`;
      
      // Send 20 rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          axios.post(endpoint, { url: 'https://example.com' }, {
            timeout: CONFIG.securityTestTimeout
          }).catch(err => err.response)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedRequests = responses.filter(res => 
        res && res.status === 429
      );
      
      if (rateLimitedRequests.length === 0) {
        return {
          vulnerable: true,
          payload: '20 rapid requests',
          response: 'No rate limiting detected'
        };
      }
      
      return { 
        vulnerable: false, 
        message: `Rate limiting triggered after ${20 - rateLimitedRequests.length} requests`
      };
    }
  },
  {
    name: 'AUTHENTICATION_BYPASS',
    description: 'Test for authentication bypass vulnerabilities',
    severity: 'CRITICAL',
    test: async () => {
      const bypassAttempts = [
        // Admin endpoint access
        `${auditResults.baseUrl}/api/admin/users`,
        `${auditResults.baseUrl}/api/staff/dashboard`,
        `${auditResults.baseUrl}/api/queue/operations`,
        // Parameter manipulation
        `${auditResults.baseUrl}/api/customer/data?user_id=admin`,
        `${auditResults.baseUrl}/api/analytics?admin=true`
      ];

      for (const url of bypassAttempts) {
        try {
          const response = await axios.get(url, {
            timeout: CONFIG.securityTestTimeout
          });
          
          if (response.status === 200 && response.data) {
            return {
              vulnerable: true,
              payload: url,
              response: 'Unauthorized access granted'
            };
          }
        } catch (error) {
          // Expected for protected endpoints
        }
      }
      return { vulnerable: false };
    }
  },
  {
    name: 'INFORMATION_DISCLOSURE',
    description: 'Test for sensitive information disclosure',
    severity: 'MEDIUM',
    test: async () => {
      const sensitiveEndpoints = [
        `${auditResults.baseUrl}/.env`,
        `${auditResults.baseUrl}/api/config`,
        `${auditResults.baseUrl}/api/debug`,
        `${auditResults.baseUrl}/api/status`,
        `${auditResults.baseUrl}/package.json`
      ];

      for (const url of sensitiveEndpoints) {
        try {
          const response = await axios.get(url, {
            timeout: CONFIG.securityTestTimeout
          });
          
          if (response.status === 200 && response.data) {
            // Check for sensitive data patterns
            const dataString = JSON.stringify(response.data).toLowerCase();
            const sensitivePatterns = [
              'password', 'secret', 'key', 'token', 'api_key',
              'database', 'connection', 'stripe', 'private'
            ];
            
            const foundPatterns = sensitivePatterns.filter(pattern => 
              dataString.includes(pattern)
            );
            
            if (foundPatterns.length > 0) {
              return {
                vulnerable: true,
                payload: url,
                response: `Exposed sensitive data: ${foundPatterns.join(', ')}`
              };
            }
          }
        } catch (error) {
          // Expected for protected endpoints
        }
      }
      return { vulnerable: false };
    }
  }
];

// Performance Test Suite
const PERFORMANCE_TESTS = [
  {
    name: 'HOMEPAGE_LOAD_TEST',
    description: 'Load test homepage under concurrent traffic',
    test: async () => {
      const startTime = Date.now();
      const requests = [];
      
      for (let i = 0; i < CONFIG.maxConcurrentRequests; i++) {
        requests.push(
          axios.get(`${auditResults.baseUrl}`, {
            timeout: 10000
          }).then(response => ({
            status: response.status,
            responseTime: Date.now() - startTime,
            size: JSON.stringify(response.data).length
          })).catch(error => ({
            status: error.response?.status || 'ERROR',
            responseTime: Date.now() - startTime,
            error: error.message
          }))
        );
      }
      
      const results = await Promise.all(requests);
      const successfulRequests = results.filter(r => r.status === 200);
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
      
      return {
        totalRequests: CONFIG.maxConcurrentRequests,
        successfulRequests: successfulRequests.length,
        failedRequests: CONFIG.maxConcurrentRequests - successfulRequests.length,
        averageResponseTime: Math.round(avgResponseTime),
        maxResponseTime: Math.max(...successfulRequests.map(r => r.responseTime)),
        passThreshold: avgResponseTime < 2000 // 2 second threshold
      };
    }
  },
  {
    name: 'API_ENDPOINT_STRESS_TEST',
    description: 'Stress test critical API endpoints',
    test: async () => {
      const endpoints = [
        '/api/analyze',
        '/api/create-checkout-session',
        '/api/auth/login'
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const requests = [];
        
        for (let i = 0; i < 5; i++) { // Reduced for safety
          let requestData = {};
          
          if (endpoint === '/api/analyze') {
            requestData = { url: 'https://example.com' };
          } else if (endpoint === '/api/create-checkout-session') {
            requestData = { plan: 'starter' };
          } else if (endpoint === '/api/auth/login') {
            requestData = { email: 'test@example.com', password: 'testpass' };
          }
          
          requests.push(
            axios.post(`${auditResults.baseUrl}${endpoint}`, requestData, {
              timeout: 10000
            }).then(response => ({
              status: response.status,
              responseTime: Date.now() - startTime
            })).catch(error => ({
              status: error.response?.status || 'ERROR',
              responseTime: Date.now() - startTime,
              error: error.message
            }))
          );
        }
        
        const endpointResults = await Promise.all(requests);
        const successfulRequests = endpointResults.filter(r => r.status === 200 || r.status === 400 || r.status === 401);
        const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
        
        results[endpoint] = {
          totalRequests: 5,
          successfulRequests: successfulRequests.length,
          averageResponseTime: Math.round(avgResponseTime),
          passThreshold: avgResponseTime < 3000 // 3 second threshold for API
        };
      }
      
      return results;
    }
  },
  {
    name: 'PAYMENT_PROCESSING_PERFORMANCE',
    description: 'Test payment processing performance under load',
    test: async () => {
      const startTime = Date.now();
      const requests = [];
      
      // Test checkout session creation (safe - just creates sessions)
      for (let i = 0; i < 3; i++) { // Very limited for payment testing
        requests.push(
          axios.post(`${auditResults.baseUrl}/api/create-checkout-session`, {
            plan: 'starter'
          }, {
            timeout: 10000
          }).then(response => ({
            status: response.status,
            responseTime: Date.now() - startTime,
            sessionCreated: !!response.data.sessionId
          })).catch(error => ({
            status: error.response?.status || 'ERROR',
            responseTime: Date.now() - startTime,
            error: error.message
          }))
        );
      }
      
      const results = await Promise.all(requests);
      const successfulRequests = results.filter(r => r.status === 200);
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
      
      return {
        totalRequests: 3,
        successfulRequests: successfulRequests.length,
        averageResponseTime: Math.round(avgResponseTime),
        allSessionsCreated: successfulRequests.every(r => r.sessionCreated),
        passThreshold: avgResponseTime < 5000 && successfulRequests.length === 3
      };
    }
  }
];

// Execute Security Tests
async function runSecurityTests() {
  console.log('\n🔒 RUNNING SECURITY VULNERABILITY TESTS');
  console.log('=' * 50);
  
  for (const test of SECURITY_TESTS) {
    console.log(`\nTesting: ${test.name} (${test.severity})`);
    console.log(`Description: ${test.description}`);
    
    try {
      const result = await test.test();
      
      const testResult = {
        name: test.name,
        description: test.description,
        severity: test.severity,
        timestamp: new Date().toISOString(),
        result: result,
        passed: !result.vulnerable
      };
      
      auditResults.securityTests.push(testResult);
      
      if (result.vulnerable) {
        console.log(`❌ VULNERABILITY FOUND: ${result.payload || 'N/A'}`);
        console.log(`   Response: ${result.response || 'N/A'}`);
        
        auditResults.vulnerabilities.push({
          severity: test.severity,
          name: test.name,
          description: test.description,
          payload: result.payload,
          response: result.response
        });
        
        if (test.severity === 'CRITICAL') {
          auditResults.criticalIssues.push(testResult);
        }
      } else {
        console.log(`✅ SECURE: ${result.message || 'No vulnerabilities detected'}`);
      }
      
    } catch (error) {
      console.log(`⚠️  TEST ERROR: ${error.message}`);
      testResult = {
        name: test.name,
        description: test.description,
        severity: test.severity,
        timestamp: new Date().toISOString(),
        error: error.message,
        passed: false
      };
      auditResults.securityTests.push(testResult);
    }
  }
}

// Execute Performance Tests
async function runPerformanceTests() {
  console.log('\n⚡ RUNNING PERFORMANCE TESTS');
  console.log('=' * 40);
  
  for (const test of PERFORMANCE_TESTS) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Description: ${test.description}`);
    
    try {
      const result = await test.test();
      
      const testResult = {
        name: test.name,
        description: test.description,
        timestamp: new Date().toISOString(),
        result: result,
        passed: result.passThreshold || Object.values(result).every(r => r.passThreshold)
      };
      
      auditResults.performanceTests.push(testResult);
      
      if (test.name === 'HOMEPAGE_LOAD_TEST') {
        console.log(`📊 Results: ${result.successfulRequests}/${result.totalRequests} requests successful`);
        console.log(`   Average Response Time: ${result.averageResponseTime}ms`);
        console.log(`   Max Response Time: ${result.maxResponseTime}ms`);
        console.log(`   Status: ${result.passThreshold ? '✅ PASS' : '❌ FAIL (>2s)'}`);
      } else if (test.name === 'API_ENDPOINT_STRESS_TEST') {
        console.log(`📊 API Endpoint Results:`);
        Object.entries(result).forEach(([endpoint, data]) => {
          console.log(`   ${endpoint}: ${data.averageResponseTime}ms avg, ${data.successfulRequests}/${data.totalRequests} success - ${data.passThreshold ? '✅' : '❌'}`);
        });
      } else if (test.name === 'PAYMENT_PROCESSING_PERFORMANCE') {
        console.log(`💳 Payment Results: ${result.successfulRequests}/${result.totalRequests} successful`);
        console.log(`   Average Response Time: ${result.averageResponseTime}ms`);
        console.log(`   All Sessions Created: ${result.allSessionsCreated ? '✅' : '❌'}`);
        console.log(`   Status: ${result.passThreshold ? '✅ PASS' : '❌ FAIL'}`);
      }
      
    } catch (error) {
      console.log(`⚠️  TEST ERROR: ${error.message}`);
      const testResult = {
        name: test.name,
        description: test.description,
        timestamp: new Date().toISOString(),
        error: error.message,
        passed: false
      };
      auditResults.performanceTests.push(testResult);
    }
  }
}

// Generate Summary Report
function generateSummary() {
  const totalSecurityTests = auditResults.securityTests.length;
  const passedSecurityTests = auditResults.securityTests.filter(t => t.passed).length;
  const totalPerformanceTests = auditResults.performanceTests.length;
  const passedPerformanceTests = auditResults.performanceTests.filter(t => t.passed).length;
  const criticalVulnerabilities = auditResults.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
  const highVulnerabilities = auditResults.vulnerabilities.filter(v => v.severity === 'HIGH').length;
  
  auditResults.summary = {
    totalTests: totalSecurityTests + totalPerformanceTests,
    passedTests: passedSecurityTests + passedPerformanceTests,
    failedTests: (totalSecurityTests + totalPerformanceTests) - (passedSecurityTests + passedPerformanceTests),
    securityTestResults: {
      total: totalSecurityTests,
      passed: passedSecurityTests,
      failed: totalSecurityTests - passedSecurityTests
    },
    performanceTestResults: {
      total: totalPerformanceTests,
      passed: passedPerformanceTests,
      failed: totalPerformanceTests - passedPerformanceTests
    },
    vulnerabilitySummary: {
      critical: criticalVulnerabilities,
      high: highVulnerabilities,
      medium: auditResults.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: auditResults.vulnerabilities.filter(v => v.severity === 'LOW').length
    },
    overallSecurityRating: criticalVulnerabilities === 0 && highVulnerabilities === 0 ? 'GOOD' : 
                          criticalVulnerabilities === 0 && highVulnerabilities <= 2 ? 'FAIR' : 'POOR',
    overallPerformanceRating: passedPerformanceTests === totalPerformanceTests ? 'GOOD' :
                             passedPerformanceTests >= totalPerformanceTests * 0.7 ? 'FAIR' : 'POOR',
    recommendations: []
  };
  
  // Generate recommendations
  if (criticalVulnerabilities > 0) {
    auditResults.summary.recommendations.push('🚨 CRITICAL: Fix critical security vulnerabilities immediately');
  }
  if (highVulnerabilities > 0) {
    auditResults.summary.recommendations.push('⚠️ HIGH: Address high-severity security issues');
  }
  if (passedPerformanceTests < totalPerformanceTests) {
    auditResults.summary.recommendations.push('⚡ PERFORMANCE: Optimize slow endpoints');
  }
  if (auditResults.summary.recommendations.length === 0) {
    auditResults.summary.recommendations.push('✅ System appears secure and performant');
  }
}

// Main execution
async function runEmergencyAudit() {
  const startTime = Date.now();
  
  try {
    // Run all tests
    await runSecurityTests();
    await runPerformanceTests();
    
    // Generate summary
    generateSummary();
    
    // Save detailed report
    await fs.writeFile(CONFIG.reportPath, JSON.stringify(auditResults, null, 2));
    
    const duration = Date.now() - startTime;
    
    // Print final summary
    console.log('\n' + '=' * 60);
    console.log('🚨 EMERGENCY SECURITY AUDIT COMPLETE');
    console.log('=' * 60);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Environment: ${CONFIG.testEnvironment.toUpperCase()}`);
    console.log(`Target: ${auditResults.baseUrl}`);
    console.log();
    console.log('📊 SUMMARY RESULTS:');
    console.log(`Total Tests: ${auditResults.summary.totalTests}`);
    console.log(`Passed: ${auditResults.summary.passedTests}`);
    console.log(`Failed: ${auditResults.summary.failedTests}`);
    console.log();
    console.log('🔒 SECURITY RESULTS:');
    console.log(`Critical Vulnerabilities: ${auditResults.summary.vulnerabilitySummary.critical}`);
    console.log(`High Vulnerabilities: ${auditResults.summary.vulnerabilitySummary.high}`);
    console.log(`Medium Vulnerabilities: ${auditResults.summary.vulnerabilitySummary.medium}`);
    console.log(`Security Rating: ${auditResults.summary.overallSecurityRating}`);
    console.log();
    console.log('⚡ PERFORMANCE RESULTS:');
    console.log(`Performance Tests Passed: ${auditResults.summary.performanceTestResults.passed}/${auditResults.summary.performanceTestResults.total}`);
    console.log(`Performance Rating: ${auditResults.summary.overallPerformanceRating}`);
    console.log();
    console.log('💡 RECOMMENDATIONS:');
    auditResults.summary.recommendations.forEach(rec => console.log(`   ${rec}`));
    console.log();
    console.log(`📄 Detailed report saved to: ${CONFIG.reportPath}`);
    
    // Alert if critical issues found
    if (auditResults.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES DETECTED - IMMEDIATE ACTION REQUIRED!');
      auditResults.criticalIssues.forEach(issue => {
        console.log(`   - ${issue.name}: ${issue.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ AUDIT FAILED:', error.message);
    process.exit(1);
  }
}

// Execute the audit
runEmergencyAudit().catch(console.error);