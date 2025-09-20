// COMPREHENSIVE LOAD TESTING SCRIPT
// Tests all new features under realistic load conditions

const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

// Load testing configuration
const LOAD_TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  concurrentUsers: 50,
  testDuration: 300000, // 5 minutes
  endpoints: [
    { path: '/api/customer/dashboard-data', method: 'GET', weight: 40 },
    { path: '/api/ai/content-gap-analysis', method: 'POST', weight: 20 },
    { path: '/api/ai/competitive-benchmarking', method: 'POST', weight: 20 },
    { path: '/api/create-checkout-session-secure', method: 'POST', weight: 15 },
    { path: '/api/user/tier-status', method: 'GET', weight: 30 }
  ],
  thresholds: {
    responseTime: 2000, // 2 seconds max
    errorRate: 0.01, // 1% max error rate
    throughput: 100 // requests per second minimum
  }
};

class LoadTester {
  constructor() {
    this.results = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      startTime: null,
      endTime: null,
      endpoints: {}
    };
  }

  async runLoadTest() {
    console.log('🚀 Starting comprehensive load testing...');
    console.log(`Configuration: ${LOAD_TEST_CONFIG.concurrentUsers} users, ${LOAD_TEST_CONFIG.testDuration/1000}s duration`);
    
    this.results.startTime = performance.now();
    
    // Create concurrent user simulations
    const userPromises = [];
    for (let i = 0; i < LOAD_TEST_CONFIG.concurrentUsers; i++) {
      userPromises.push(this.simulateUser(i));
    }
    
    // Run load test for specified duration
    await Promise.race([
      Promise.all(userPromises),
      new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.testDuration))
    ]);
    
    this.results.endTime = performance.now();
    
    return this.generateReport();
  }

  async simulateUser(userId) {
    const userStartTime = performance.now();
    
    while (performance.now() - userStartTime < LOAD_TEST_CONFIG.testDuration) {
      // Select random endpoint based on weight
      const endpoint = this.selectWeightedEndpoint();
      
      try {
        const requestStart = performance.now();
        const response = await this.makeRequest(endpoint);
        const requestEnd = performance.now();
        
        const responseTime = requestEnd - requestStart;
        this.recordSuccess(endpoint.path, responseTime);
        
        // Simulate user think time (1-3 seconds)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
      } catch (error) {
        this.recordError(endpoint.path, error);
      }
    }
  }

  selectWeightedEndpoint() {
    const totalWeight = LOAD_TEST_CONFIG.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of LOAD_TEST_CONFIG.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return LOAD_TEST_CONFIG.endpoints[0]; // fallback
  }

  async makeRequest(endpoint) {
    const url = `${LOAD_TEST_CONFIG.baseUrl}${endpoint.path}`;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bear test-token'
      },
      timeout: 10000
    };

    // Add request body for POST requests
    if (endpoint.method === 'POST') {
      if (endpoint.path.includes('content-gap-analysis')) {
        options.body = JSON.stringify({
          targetWebsite: 'https://example.com',
          userTier: 'professional'
        });
      } else if (endpoint.path.includes('competitive-benchmarking')) {
        options.body = JSON.stringify({
          targetWebsite: 'https://example.com',
          industry: 'technology',
          userTier: 'enterprise'
        });
      } else if (endpoint.path.includes('checkout-session')) {
        options.body = JSON.stringify({
          plan: 'growth',
          customerEmail: 'test@example.com'
        });
      }
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  recordSuccess(endpoint, responseTime) {
    this.results.requests++;
    this.results.responseTimes.push(responseTime);
    
    if (!this.results.endpoints[endpoint]) {
      this.results.endpoints[endpoint] = { requests: 0, errors: 0, responseTimes: [] };
    }
    
    this.results.endpoints[endpoint].requests++;
    this.results.endpoints[endpoint].responseTimes.push(responseTime);
  }

  recordError(endpoint, error) {
    this.results.errors++;
    
    if (!this.results.endpoints[endpoint]) {
      this.results.endpoints[endpoint] = { requests: 0, errors: 0, responseTimes: [] };
    }
    
    this.results.endpoints[endpoint].errors++;
    console.error(`❌ Error on ${endpoint}:`, error.message);
  }

  generateReport() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const throughput = this.results.requests / duration;
    const errorRate = this.results.errors / this.results.requests;
    
    const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    const p95ResponseTime = this.getPercentile(this.results.responseTimes, 95);
    const p99ResponseTime = this.getPercentile(this.results.responseTimes, 99);
    
    const report = {
      summary: {
        duration: Math.round(duration),
        totalRequests: this.results.requests,
        totalErrors: this.results.errors,
        throughput: Math.round(throughput * 100) / 100,
        errorRate: Math.round(errorRate * 10000) / 100, // percentage
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime)
      },
      thresholds: {
        responseTime: avgResponseTime <= LOAD_TEST_CONFIG.thresholds.responseTime ? '✅ PASS' : '❌ FAIL',
        errorRate: errorRate <= LOAD_TEST_CONFIG.thresholds.errorRate ? '✅ PASS' : '❌ FAIL',
        throughput: throughput >= LOAD_TEST_CONFIG.thresholds.throughput ? '✅ PASS' : '❌ FAIL'
      },
      endpoints: {}
    };

    // Generate per-endpoint statistics
    Object.entries(this.results.endpoints).forEach(([endpoint, stats]) => {
      const endpointAvgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
      const endpointErrorRate = stats.errors / stats.requests;
      
      report.endpoints[endpoint] = {
        requests: stats.requests,
        errors: stats.errors,
        errorRate: Math.round(endpointErrorRate * 10000) / 100,
        avgResponseTime: Math.round(endpointAvgResponseTime),
        p95ResponseTime: Math.round(this.getPercentile(stats.responseTimes, 95))
      };
    });

    return report;
  }

  getPercentile(arr, percentile) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

// Performance monitoring setup
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      resourceUsage: []
    };
  }

  async startMonitoring() {
    console.log('📊 Starting performance monitoring...');
    
    // Monitor every 30 seconds
    setInterval(async () => {
      await this.collectMetrics();
    }, 30000);
    
    // Generate reports every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);
  }

  async collectMetrics() {
    try {
      const healthCheck = await fetch(`${LOAD_TEST_CONFIG.baseUrl}/api/health`);
      const responseTime = performance.now();
      
      // Simulate resource usage collection
      const resourceUsage = {
        timestamp: new Date().toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        responseTime: responseTime
      };
      
      this.metrics.resourceUsage.push(resourceUsage);
      
      // Keep only last 100 measurements
      if (this.metrics.resourceUsage.length > 100) {
        this.metrics.resourceUsage.shift();
      }
      
    } catch (error) {
      console.error('Failed to collect metrics:', error.message);
    }
  }

  generatePerformanceReport() {
    const recentMetrics = this.metrics.resourceUsage.slice(-20); // Last 20 measurements
    
    if (recentMetrics.length === 0) return;
    
    const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    
    console.log('📈 Performance Report:', {
      timestamp: new Date().toISOString(),
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      status: this.getHealthStatus(avgCpu, avgMemory, avgResponseTime)
    });
  }

  getHealthStatus(cpu, memory, responseTime) {
    if (cpu > 80 || memory > 85 || responseTime > 2000) {
      return '🔴 CRITICAL';
    } else if (cpu > 60 || memory > 70 || responseTime > 1000) {
      return '🟡 WARNING';
    } else {
      return '🟢 HEALTHY';
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'load-test') {
    const tester = new LoadTester();
    const report = await tester.runLoadTest();
    
    console.log('\n📊 LOAD TEST RESULTS:');
    console.log('='.repeat(50));
    console.log('Summary:', report.summary);
    console.log('Thresholds:', report.thresholds);
    console.log('Endpoints:', report.endpoints);
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `load-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);
    
  } else if (command === 'monitor') {
    const monitor = new PerformanceMonitor();
    await monitor.startMonitoring();
    console.log('🔄 Performance monitoring started. Press Ctrl+C to stop.');
    
  } else {
    console.log('Usage:');
    console.log('  node load-testing.js load-test    # Run comprehensive load test');
    console.log('  node load-testing.js monitor      # Start performance monitoring');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LoadTester, PerformanceMonitor };