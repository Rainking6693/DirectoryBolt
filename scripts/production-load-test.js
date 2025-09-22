#!/usr/bin/env node

/**
 * DirectoryBolt Production Load Testing & Performance Validation
 * Tests enterprise-grade performance under realistic load conditions
 * Designed for $149-799 customer expectations
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:8082',
  concurrentUsers: 10,
  totalRequests: 50,
  requestTimeout: 30000, // 30 seconds
  targetResponse: {
    p50: 500,   // 50th percentile < 500ms
    p95: 1000,  // 95th percentile < 1000ms
    p99: 2000   // 99th percentile < 2000ms
  },
  endpoints: [
    {
      name: 'Homepage',
      path: '/',
      method: 'GET',
      weight: 30
    },
    {
      name: 'Website Analysis',
      path: '/api/analyze',
      method: 'POST',
      data: { url: 'https://example.com', tier: 'free' },
      weight: 40,
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'System Status (Public)',
      path: '/api/status',
      method: 'GET',
      weight: 20
    },
    {
      name: 'Health Check',
      path: '/api/health',
      method: 'GET',
      weight: 10
    }
  ]
};

class LoadTester {
  constructor() {
    this.results = {
      startTime: Date.now(),
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      rateLimited: 0,
      responseTimes: [],
      errors: [],
      endpointStats: {},
      securityValidation: {
        rateLimitWorking: false,
        statusEndpointSecured: false,
        securityHeaders: false
      }
    };
    
    CONFIG.endpoints.forEach(endpoint => {
      this.results.endpointStats[endpoint.name] = {
        requests: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
        responseTimes: []
      };
    });
  }

  async makeRequest(endpoint, requestId) {
    const startTime = performance.now();
    const url = `${CONFIG.baseUrl}${endpoint.path}`;
    
    try {
      const requestConfig = {
        method: endpoint.method,
        url,
        timeout: CONFIG.requestTimeout,
        headers: endpoint.headers || {},
        data: endpoint.data,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      };

      const response = await axios(requestConfig);
      const responseTime = performance.now() - startTime;
      
      this.results.totalRequests++;
      this.results.endpointStats[endpoint.name].requests++;
      this.results.responseTimes.push(responseTime);
      this.results.endpointStats[endpoint.name].responseTimes.push(responseTime);

      // Validate security features
      this.validateSecurityFeatures(endpoint, response);

      if (response.status < 400) {
        this.results.successfulRequests++;
        this.results.endpointStats[endpoint.name].successes++;
      } else if (response.status === 429) {
        this.results.rateLimited++;
        this.results.securityValidation.rateLimitWorking = true;
        console.log(`⚡ Rate limiting working (${endpoint.name})`);
      } else {
        this.results.failedRequests++;
        this.results.endpointStats[endpoint.name].failures++;
        this.results.errors.push({
          requestId,
          endpoint: endpoint.name,
          status: response.status,
          error: response.statusText
        });
      }

      console.log(`✓ ${endpoint.name} [${requestId}]: ${response.status} (${responseTime.toFixed(2)}ms)`);
      
      return { success: true, responseTime, status: response.status };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.results.totalRequests++;
      this.results.endpointStats[endpoint.name].requests++;
      
      if (error.code === 'ECONNABORTED') {
        this.results.timeouts++;
        console.log(`⏱️ ${endpoint.name} [${requestId}]: TIMEOUT (${responseTime.toFixed(2)}ms)`);
      } else {
        this.results.failedRequests++;
        this.results.endpointStats[endpoint.name].failures++;
        console.log(`❌ ${endpoint.name} [${requestId}]: ERROR - ${error.message}`);
      }

      this.results.errors.push({
        requestId,
        endpoint: endpoint.name,
        error: error.message,
        code: error.code
      });

      return { success: false, responseTime, error: error.message };
    }
  }

  validateSecurityFeatures(endpoint, response) {
    // Check status endpoint security
    if (endpoint.path === '/api/status' && response.status === 200) {
      const data = response.data;
      if (!data.services && !data.metrics) {
        this.results.securityValidation.statusEndpointSecured = true;
      }
    }

    // Check security headers
    const headers = response.headers;
    if (headers['x-ratelimit-limit'] && headers['x-frame-options'] && headers['x-content-type-options']) {
      this.results.securityValidation.securityHeaders = true;
    }
  }

  getWeightedEndpoint() {
    const totalWeight = CONFIG.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of CONFIG.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return CONFIG.endpoints[0];
  }

  async runConcurrentRequests(userIndex, requestsPerUser) {
    const promises = [];
    
    for (let i = 0; i < requestsPerUser; i++) {
      const endpoint = this.getWeightedEndpoint();
      const requestId = `U${userIndex}-R${i}`;
      
      // Stagger requests slightly to simulate real user behavior
      const delay = Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      promises.push(this.makeRequest(endpoint, requestId));
    }
    
    return Promise.all(promises);
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  calculateStats() {
    // Calculate endpoint averages
    Object.keys(this.results.endpointStats).forEach(endpointName => {
      const stats = this.results.endpointStats[endpointName];
      if (stats.responseTimes.length > 0) {
        stats.avgResponseTime = stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length;
      }
    });

    // Calculate overall percentiles
    const responseTimes = this.results.responseTimes;
    const p50 = this.calculatePercentile(responseTimes, 50);
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const successRate = this.results.totalRequests > 0 
      ? (this.results.successfulRequests / this.results.totalRequests) * 100 
      : 0;

    return {
      p50,
      p95,
      p99,
      avgResponseTime,
      successRate,
      duration: this.results.endTime - this.results.startTime
    };
  }

  assessPerformance(stats) {
    const issues = [];
    const achievements = [];

    // Performance assessment
    if (stats.p50 <= CONFIG.targetResponse.p50) {
      achievements.push(`✓ P50 response time excellent: ${stats.p50.toFixed(2)}ms (target: <${CONFIG.targetResponse.p50}ms)`);
    } else {
      issues.push(`⚠️ P50 response time high: ${stats.p50.toFixed(2)}ms (target: <${CONFIG.targetResponse.p50}ms)`);
    }

    if (stats.p99 <= CONFIG.targetResponse.p99) {
      achievements.push(`✓ P99 response time excellent: ${stats.p99.toFixed(2)}ms (target: <${CONFIG.targetResponse.p99}ms)`);
    } else {
      issues.push(`⚠️ P99 response time high: ${stats.p99.toFixed(2)}ms (target: <${CONFIG.targetResponse.p99}ms)`);
    }

    // Success rate assessment
    if (stats.successRate >= 95) {
      achievements.push(`✓ Excellent success rate: ${stats.successRate.toFixed(2)}%`);
    } else if (stats.successRate >= 90) {
      achievements.push(`⚠️ Good success rate: ${stats.successRate.toFixed(2)}% (with rate limiting)`);
    } else {
      issues.push(`❌ Low success rate: ${stats.successRate.toFixed(2)}%`);
    }

    // Security assessment
    if (this.results.securityValidation.rateLimitWorking) {
      achievements.push('✓ Rate limiting is active and working');
    } else {
      issues.push('⚠️ Rate limiting not detected');
    }

    if (this.results.securityValidation.statusEndpointSecured) {
      achievements.push('✓ Status endpoint properly secured');
    } else {
      issues.push('⚠️ Status endpoint may be exposing sensitive data');
    }

    if (this.results.securityValidation.securityHeaders) {
      achievements.push('✓ Security headers are present');
    } else {
      issues.push('⚠️ Security headers missing');
    }

    return { issues, achievements };
  }

  async run() {
    console.log('🚀 Starting DirectoryBolt Production Load Test');
    console.log(`📊 Configuration: ${CONFIG.concurrentUsers} users, ${CONFIG.totalRequests} total requests`);
    console.log(`🎯 Target: P50 <${CONFIG.targetResponse.p50}ms, P99 <${CONFIG.targetResponse.p99}ms`);
    console.log('');

    const requestsPerUser = Math.ceil(CONFIG.totalRequests / CONFIG.concurrentUsers);
    const userPromises = [];

    // Start concurrent users
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
      userPromises.push(this.runConcurrentRequests(i + 1, requestsPerUser));
    }

    try {
      await Promise.all(userPromises);
    } catch (error) {
      console.error('Load test encountered an error:', error);
    }

    this.results.endTime = Date.now();
    const stats = this.calculateStats();
    const assessment = this.assessPerformance(stats);

    // Results summary
    console.log('\n📈 LOAD TEST RESULTS');
    console.log('==================');
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests}`);
    console.log(`Failed: ${this.results.failedRequests}`);
    console.log(`Rate Limited: ${this.results.rateLimited}`);
    console.log(`Timeouts: ${this.results.timeouts}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);

    console.log('\n⚡ PERFORMANCE METRICS');
    console.log('====================');
    console.log(`Average Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
    console.log(`P50 (Median): ${stats.p50.toFixed(2)}ms`);
    console.log(`P95: ${stats.p95.toFixed(2)}ms`);
    console.log(`P99: ${stats.p99.toFixed(2)}ms`);

    console.log('\n📊 ENDPOINT BREAKDOWN');
    console.log('===================');
    Object.entries(this.results.endpointStats).forEach(([name, stats]) => {
      const successRate = stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0;
      console.log(`${name}: ${stats.requests} req, ${successRate.toFixed(1)}% success, ${stats.avgResponseTime.toFixed(2)}ms avg`);
    });

    console.log('\n✅ ACHIEVEMENTS');
    console.log('==============');
    assessment.achievements.forEach(achievement => console.log(achievement));

    if (assessment.issues.length > 0) {
      console.log('\n⚠️ ISSUES TO ADDRESS');
      console.log('==================');
      assessment.issues.forEach(issue => console.log(issue));
    }

    // Overall grade
    const performanceGrade = this.calculateOverallGrade(stats, assessment);
    console.log(`\n🎯 OVERALL GRADE: ${performanceGrade.grade} (${performanceGrade.score}/100)`);
    console.log(`Production Readiness: ${performanceGrade.readiness}`);

    // Save results
    const resultsPath = 'production-load-test-results.json';
    require('fs').writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: CONFIG,
      results: this.results,
      stats,
      assessment,
      grade: performanceGrade
    }, null, 2));

    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

    return performanceGrade.score >= 80;
  }

  calculateOverallGrade(stats, assessment) {
    let score = 0;
    let grade = 'F';
    let readiness = 'NOT READY';

    // Performance scoring (40 points)
    if (stats.p50 <= CONFIG.targetResponse.p50) score += 15;
    else if (stats.p50 <= CONFIG.targetResponse.p50 * 1.5) score += 10;
    
    if (stats.p99 <= CONFIG.targetResponse.p99) score += 15;
    else if (stats.p99 <= CONFIG.targetResponse.p99 * 1.5) score += 10;
    
    if (stats.avgResponseTime <= 300) score += 10;
    else if (stats.avgResponseTime <= 600) score += 5;

    // Reliability scoring (30 points)
    if (stats.successRate >= 95) score += 30;
    else if (stats.successRate >= 90) score += 25;
    else if (stats.successRate >= 80) score += 15;
    else if (stats.successRate >= 70) score += 10;

    // Security scoring (30 points)
    if (this.results.securityValidation.rateLimitWorking) score += 15;
    if (this.results.securityValidation.statusEndpointSecured) score += 10;
    if (this.results.securityValidation.securityHeaders) score += 5;

    // Determine grade and readiness
    if (score >= 90) {
      grade = 'A+';
      readiness = 'ENTERPRISE READY';
    } else if (score >= 85) {
      grade = 'A';
      readiness = 'PRODUCTION READY';
    } else if (score >= 80) {
      grade = 'B+';
      readiness = 'READY WITH MONITORING';
    } else if (score >= 70) {
      grade = 'B';
      readiness = 'NEEDS OPTIMIZATION';
    } else if (score >= 60) {
      grade = 'C';
      readiness = 'MAJOR ISSUES';
    } else {
      grade = 'F';
      readiness = 'NOT READY';
    }

    return { score, grade, readiness };
  }
}

// Run the load test
async function main() {
  const tester = new LoadTester();
  const success = await tester.run();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = LoadTester;