#!/usr/bin/env node

/**
 * Deployment Monitoring Script
 * Monitors DirectoryBolt.com deployment health and detects rendering issues
 */

const https = require('https');
const fs = require('fs');

// Configuration
const SITE_URL = 'https://directorybolt.com';
const ENDPOINTS_TO_MONITOR = [
  '/',
  '/pricing',
  '/onboarding',
  '/api/health',
  '/api/test',
  '/api/monitor/deployment',
  '/api/monitor/rendering'
];

// Alert thresholds
const MAX_RESPONSE_TIME = 10000; // 10 seconds
const MAX_CONSECUTIVE_FAILURES = 3;

class DeploymentMonitor {
  constructor() {
    this.results = [];
    this.errors = [];
    this.consecutiveFailures = 0;
  }

  async checkEndpoint(path) {
    const url = `${SITE_URL}${path}`;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const req = https.get(url, { timeout: MAX_RESPONSE_TIME }, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const result = {
            path,
            url,
            status: res.statusCode,
            responseTime,
            timestamp: new Date().toISOString(),
            success: res.statusCode >= 200 && res.statusCode < 400,
            contentLength: data.length,
            hasRawJavaScript: this.detectRawJavaScript(data),
            hasReactElements: this.detectReactElements(data),
            isHealthy: this.assessHealth(res.statusCode, data, responseTime)
          };
          
          resolve(result);
        });
      });

      req.on('error', (error) => {
        resolve({
          path,
          url,
          status: 0,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message,
          isHealthy: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          path,
          url,
          status: 0,
          responseTime: MAX_RESPONSE_TIME,
          timestamp: new Date().toISOString(),
          success: false,
          error: 'Timeout',
          isHealthy: false
        });
      });
    });
  }

  detectRawJavaScript(content) {
    // Check for common patterns that indicate raw JS serving instead of rendered HTML
    const rawJsPatterns = [
      /export\s+default\s+function/,
      /import\s+.*\s+from\s+['"`]/,
      /const\s+.*\s+=\s+require\(/,
      /module\.exports\s*=/,
      /__webpack_require__/,
      /\/_next\/static\/chunks\/.*\.js/
    ];
    
    return rawJsPatterns.some(pattern => pattern.test(content));
  }

  detectReactElements(content) {
    // Check for properly rendered React elements
    const reactPatterns = [
      /<[^>]*className\s*=/,
      /<div[^>]*data-reactroot/,
      /<html[^>]*data-/,
      /DirectoryBolt/i
    ];
    
    return reactPatterns.some(pattern => pattern.test(content));
  }

  assessHealth(statusCode, content, responseTime) {
    // Basic health assessment
    if (statusCode < 200 || statusCode >= 400) return false;
    if (responseTime > MAX_RESPONSE_TIME) return false;
    if (this.detectRawJavaScript(content)) return false;
    if (content.length < 100) return false; // Too short, likely error page
    
    return true;
  }

  async runHealthCheck() {
    console.log(`🔍 Starting deployment health check at ${new Date().toISOString()}`);
    console.log(`📍 Monitoring ${ENDPOINTS_TO_MONITOR.length} endpoints...`);
    
    for (const endpoint of ENDPOINTS_TO_MONITOR) {
      console.log(`   Checking ${endpoint}...`);
      const result = await this.checkEndpoint(endpoint);
      this.results.push(result);
      
      if (!result.success || !result.isHealthy) {
        this.errors.push(result);
        this.consecutiveFailures++;
        console.log(`   ❌ ${endpoint}: ${result.error || `Status ${result.status}`}`);
      } else {
        this.consecutiveFailures = 0;
        console.log(`   ✅ ${endpoint}: ${result.status} (${result.responseTime}ms)`);
      }
    }
    
    this.generateReport();
    return this.assessOverallHealth();
  }

  generateReport() {
    const healthyEndpoints = this.results.filter(r => r.isHealthy).length;
    const totalEndpoints = this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalEndpoints;
    
    const report = {
      timestamp: new Date().toISOString(),
      overall: {
        healthy: healthyEndpoints === totalEndpoints,
        healthyEndpoints,
        totalEndpoints,
        healthPercentage: Math.round((healthyEndpoints / totalEndpoints) * 100),
        avgResponseTime: Math.round(avgResponseTime)
      },
      endpoints: this.results,
      errors: this.errors,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportFile = `deployment-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Health Check Summary:`);
    console.log(`   Overall Health: ${report.overall.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Healthy Endpoints: ${healthyEndpoints}/${totalEndpoints} (${report.overall.healthPercentage}%)`);
    console.log(`   Average Response Time: ${report.overall.avgResponseTime}ms`);
    console.log(`   Report saved: ${reportFile}`);

    if (this.errors.length > 0) {
      console.log(`\n🚨 Issues Found:`);
      this.errors.forEach(error => {
        console.log(`   - ${error.path}: ${error.error || `Status ${error.status}`}`);
        if (error.hasRawJavaScript) {
          console.log(`     ⚠️  Raw JavaScript detected - possible rendering failure`);
        }
      });
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.errors.length > 0) {
      recommendations.push("Check Netlify deployment logs for build errors");
      
      if (this.errors.some(e => e.hasRawJavaScript)) {
        recommendations.push("Raw JavaScript detected - check Next.js configuration");
        recommendations.push("Verify @netlify/plugin-nextjs is properly configured");
      }
      
      if (this.errors.some(e => e.status === 502)) {
        recommendations.push("502 errors detected - check API routes and serverless functions");
      }
      
      if (this.errors.some(e => e.responseTime > MAX_RESPONSE_TIME)) {
        recommendations.push("High response times detected - investigate performance issues");
      }
    }
    
    return recommendations;
  }

  assessOverallHealth() {
    const healthyCount = this.results.filter(r => r.isHealthy).length;
    const totalCount = this.results.length;
    
    return {
      healthy: healthyCount === totalCount,
      score: Math.round((healthyCount / totalCount) * 100),
      consecutiveFailures: this.consecutiveFailures
    };
  }
}

// CLI execution
if (require.main === module) {
  const monitor = new DeploymentMonitor();
  
  monitor.runHealthCheck()
    .then(health => {
      if (!health.healthy) {
        console.log(`\n🚨 DEPLOYMENT HEALTH ISSUE DETECTED!`);
        console.log(`   Health Score: ${health.score}%`);
        console.log(`   Consecutive Failures: ${health.consecutiveFailures}`);
        process.exit(1);
      } else {
        console.log(`\n✅ All systems operational!`);
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}

module.exports = DeploymentMonitor;