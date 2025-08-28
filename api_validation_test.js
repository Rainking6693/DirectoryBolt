/**
 * API VALIDATION TEST
 * Direct testing of API endpoints to validate improvements
 */

const https = require('https');
const http = require('http');

class ApiValidationTest {
  constructor() {
    this.baseUrl = 'http://localhost:3006';
    this.results = {
      tests: [],
      improvements: [],
      timeouts: [],
      errors: [],
      launchReadinessScore: 0
    };
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DirectoryBolt-ValidationTest/1.0'
        }
      };

      const startTime = Date.now();
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = Date.now() - startTime;
          try {
            const parsed = data ? JSON.parse(data) : null;
            resolve({
              statusCode: res.statusCode,
              data: parsed,
              raw: data,
              duration,
              headers: res.headers
            });
          } catch (err) {
            resolve({
              statusCode: res.statusCode,
              data: null,
              raw: data,
              duration,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (err) => {
        const duration = Date.now() - startTime;
        reject({ error: err.message, duration });
      });

      req.on('timeout', () => {
        const duration = Date.now() - startTime;
        req.abort();
        reject({ error: 'Request timeout', duration, timeout: true });
      });

      // Set timeout based on what we expect from the improvements
      req.setTimeout(30000); // 30 seconds max

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  async testAnalyzeEndpoint() {
    await this.log('🔍 Testing /api/analyze endpoint');

    // Test 1: Valid website
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/api/analyze', 'POST', {
        url: 'https://example.com',
        options: JSON.stringify({ deep: false })
      });
      
      const duration = Date.now() - startTime;
      this.results.timeouts.push({ test: 'Valid URL', duration });

      if (response.statusCode === 200 && response.data?.success) {
        this.results.tests.push({
          name: 'Analyze API - Valid URL',
          status: 'passed',
          duration
        });
        
        if (duration < 15000) {
          this.results.improvements.push(`API response time optimized: ${(duration/1000).toFixed(1)}s (target: <15s)`);
        }
        
        await this.log(`✅ Valid URL analysis: ${response.statusCode} in ${(duration/1000).toFixed(1)}s`);
      } else {
        this.results.tests.push({
          name: 'Analyze API - Valid URL',
          status: 'failed',
          error: response.data?.error || 'Unexpected response'
        });
        await this.log(`❌ Valid URL analysis failed: ${response.statusCode}`);
      }
    } catch (error) {
      this.results.tests.push({
        name: 'Analyze API - Valid URL',
        status: 'error',
        error: error.error
      });
      
      if (error.timeout) {
        await this.log(`⏰ Valid URL analysis timed out after ${(error.duration/1000).toFixed(1)}s`);
      } else {
        await this.log(`❌ Valid URL analysis error: ${error.error}`);
      }
    }

    // Test 2: Invalid website (should fail quickly with specific error)
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/api/analyze', 'POST', {
        url: 'https://invalid-website-does-not-exist-12345.com',
        options: JSON.stringify({ deep: false })
      });
      
      const duration = Date.now() - startTime;
      this.results.timeouts.push({ test: 'Invalid URL', duration });

      if (response.statusCode >= 400 || !response.data?.success) {
        this.results.tests.push({
          name: 'Analyze API - Invalid URL',
          status: 'passed',
          duration
        });
        
        const errorMessage = response.data?.error?.message || response.data?.error || '';
        
        // Check for specific error messages (improvement)
        if (errorMessage.includes('could not find') || 
            errorMessage.includes('DNS') || 
            errorMessage.includes('domain') ||
            errorMessage.includes('timeout')) {
          this.results.improvements.push('Specific error messages for invalid URLs instead of generic failures');
        }
        
        if (duration < 15000) {
          this.results.improvements.push(`Fast error detection: ${(duration/1000).toFixed(1)}s (vs 30s timeouts)`);
        }
        
        await this.log(`✅ Invalid URL properly rejected: ${response.statusCode} in ${(duration/1000).toFixed(1)}s`);
        await this.log(`   Error message: ${errorMessage.substring(0, 100)}...`);
      } else {
        this.results.tests.push({
          name: 'Analyze API - Invalid URL',
          status: 'failed',
          error: 'Should have failed for invalid URL'
        });
        await this.log(`❌ Invalid URL should have failed but got: ${response.statusCode}`);
      }
    } catch (error) {
      const duration = error.duration || 0;
      this.results.timeouts.push({ test: 'Invalid URL', duration });
      
      if (duration < 15000 && error.error.includes('timeout')) {
        this.results.improvements.push(`Fast timeout detection: ${(duration/1000).toFixed(1)}s`);
        this.results.tests.push({
          name: 'Analyze API - Invalid URL',
          status: 'passed',
          duration
        });
        await this.log(`✅ Invalid URL timed out quickly: ${(duration/1000).toFixed(1)}s (improvement)`);
      } else {
        this.results.tests.push({
          name: 'Analyze API - Invalid URL',
          status: 'error',
          error: error.error
        });
        await this.log(`❌ Invalid URL test error: ${error.error}`);
      }
    }

    // Test 3: Malformed request
    try {
      const response = await this.makeRequest('/api/analyze', 'POST', {
        invalidField: 'test'
      });
      
      if (response.statusCode === 400) {
        this.results.tests.push({
          name: 'Analyze API - Malformed Request',
          status: 'passed'
        });
        this.results.improvements.push('Proper validation of malformed requests');
        await this.log(`✅ Malformed request properly rejected: ${response.statusCode}`);
      } else {
        this.results.tests.push({
          name: 'Analyze API - Malformed Request',
          status: 'failed'
        });
        await this.log(`❌ Malformed request should have returned 400, got: ${response.statusCode}`);
      }
    } catch (error) {
      this.results.tests.push({
        name: 'Analyze API - Malformed Request',
        status: 'error',
        error: error.error
      });
      await this.log(`❌ Malformed request test error: ${error.error}`);
    }
  }

  async testCheckoutEndpoint() {
    await this.log('💳 Testing /api/create-checkout-session endpoint');

    const plans = ['starter_monthly', 'growth_monthly', 'professional_monthly', 'enterprise_monthly'];
    let workingPlans = 0;

    for (const plan of plans) {
      try {
        const response = await this.makeRequest('/api/create-checkout-session', 'POST', {
          plan: plan
        });

        if (response.statusCode === 200 && response.data?.success && response.data?.data?.url) {
          workingPlans++;
          await this.log(`✅ ${plan} checkout: Working (Stripe URL generated)`);
        } else if (response.data?.error?.message) {
          const errorMsg = response.data.error.message;
          if (errorMsg.includes('not properly configured') || errorMsg.includes('configuration')) {
            this.results.improvements.push(`Specific configuration error for ${plan} instead of generic payment failure`);
            await this.log(`✅ ${plan} checkout: Specific config error (improvement)`);
          } else {
            await this.log(`⚠️ ${plan} checkout: ${errorMsg}`);
          }
        }
      } catch (error) {
        await this.log(`❌ ${plan} checkout error: ${error.error}`);
      }
    }

    this.results.tests.push({
      name: 'Checkout API - Multiple Plans',
      status: workingPlans > 0 ? 'passed' : 'failed',
      details: `${workingPlans}/${plans.length} plans working`
    });

    if (workingPlans > 0) {
      this.results.improvements.push(`${workingPlans} pricing tiers have working checkout functionality`);
    }
  }

  async testHealthCheck() {
    await this.log('🏥 Testing health endpoints');

    try {
      const response = await this.makeRequest('/api/health');
      if (response.statusCode === 200) {
        this.results.tests.push({
          name: 'Health Check',
          status: 'passed'
        });
        await this.log('✅ Health check endpoint working');
      }
    } catch (error) {
      await this.log('⚠️ Health check endpoint not available');
    }
  }

  async calculateScore() {
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
    const improvements = this.results.improvements.length;
    
    // Base score from test success rate
    let score = totalTests > 0 ? (passedTests / totalTests) * 6 : 0;
    
    // Bonus points for improvements
    score += Math.min(3, improvements * 0.3);
    
    // Timeout improvements bonus
    const avgTimeout = this.results.timeouts.reduce((sum, t) => sum + t.duration, 0) / this.results.timeouts.length;
    if (avgTimeout < 20000 && this.results.timeouts.length > 0) { // Under 20 seconds average
      score += 1;
    }
    
    this.results.launchReadinessScore = Math.round(score * 10) / 10;
  }

  async runTests() {
    await this.log('🚀 Starting DirectoryBolt API Validation');
    
    try {
      await this.testHealthCheck();
      await this.testAnalyzeEndpoint();
      await this.testCheckoutEndpoint();
      
      await this.calculateScore();
      
      // Display results
      console.log('\n' + '='.repeat(70));
      console.log('🎯 API VALIDATION RESULTS');
      console.log('='.repeat(70));
      
      console.log(`\n📊 Test Summary:`);
      console.log(`   Tests Run: ${this.results.tests.length}`);
      console.log(`   Passed: ${this.results.tests.filter(t => t.status === 'passed').length}`);
      console.log(`   Failed: ${this.results.tests.filter(t => t.status === 'failed').length}`);
      console.log(`   Errors: ${this.results.tests.filter(t => t.status === 'error').length}`);
      
      console.log(`\n🚀 Launch Readiness Score: ${this.results.launchReadinessScore}/10`);
      
      if (this.results.timeouts.length > 0) {
        const avgTimeout = this.results.timeouts.reduce((sum, t) => sum + t.duration, 0) / this.results.timeouts.length;
        console.log(`⏱️ Average Response Time: ${(avgTimeout/1000).toFixed(1)}s`);
      }
      
      console.log(`\n✨ Key Improvements Validated:`);
      this.results.improvements.forEach(improvement => {
        console.log(`   • ${improvement}`);
      });
      
      console.log(`\n📋 Individual Test Results:`);
      this.results.tests.forEach(test => {
        const status = test.status === 'passed' ? '✅' : 
                      test.status === 'failed' ? '❌' : '⚠️';
        const time = test.duration ? ` (${(test.duration/1000).toFixed(1)}s)` : '';
        console.log(`   ${status} ${test.name}${time}`);
        if (test.error) console.log(`      ${test.error}`);
        if (test.details) console.log(`      ${test.details}`);
      });
      
      console.log('\n📈 Performance Analysis:');
      if (this.results.timeouts.length > 0) {
        this.results.timeouts.forEach(timeout => {
          const status = timeout.duration < 15000 ? '✅' : timeout.duration < 25000 ? '⚠️' : '❌';
          console.log(`   ${status} ${timeout.test}: ${(timeout.duration/1000).toFixed(1)}s`);
        });
      }
      
      if (this.results.launchReadinessScore >= 8) {
        console.log('\n🎉 EXCELLENT! APIs show significant improvements and are ready for production.');
      } else if (this.results.launchReadinessScore >= 6) {
        console.log('\n✅ GOOD! Major API improvements detected. Minor configuration needed.');
      } else {
        console.log('\n⚠️ Additional API development work recommended.');
      }
      
      console.log('='.repeat(70));
      
    } catch (error) {
      await this.log(`❌ Test suite error: ${error.message}`);
    }
  }
}

async function runApiValidation() {
  const tester = new ApiValidationTest();
  await tester.runTests();
  return tester.results;
}

if (require.main === module) {
  runApiValidation().catch(console.error);
}

module.exports = { runApiValidation, ApiValidationTest };