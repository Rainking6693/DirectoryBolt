#!/usr/bin/env node

/**
 * Production Deployment Test System
 * Tests deployment strategies with ACTUAL production environment simulation
 * Implements cutting-edge deployment validation from 2025 research
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class ProductionDeploymentTester {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      environment: 'production-simulation',
      platform: this.detectPlatform(),
      deploymentUrl: process.env.DEPLOY_URL || 'localhost:3000',
      tests: [],
      performance: {},
      security: {},
      healthChecks: {},
      loadTesting: {},
      overall: {
        ready: false,
        score: 0,
        criticalFailures: [],
        warnings: [],
        recommendations: []
      }
    };
  }

  detectPlatform() {
    if (process.env.NETLIFY) return 'netlify';
    if (process.env.VERCEL) return 'vercel';
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws';
    return 'local-production-sim';
  }

  async runTest(name, testFn, critical = false) {
    const startTime = performance.now();
    const test = {
      name,
      critical,
      status: 'running',
      startTime: new Date().toISOString(),
      duration: 0,
      result: null,
      error: null,
      metadata: {}
    };

    try {
      console.log(`🔍 ${critical ? '[CRITICAL]' : '[INFO]'} Testing: ${name}`);
      test.result = await testFn();
      test.status = 'passed';
      console.log(`✅ ${name}: PASSED`);
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      console.log(`❌ ${name}: FAILED - ${error.message}`);
      
      if (critical) {
        this.testResults.overall.criticalFailures.push({
          test: name,
          error: error.message,
          impact: 'deployment-blocking'
        });
      } else {
        this.testResults.overall.warnings.push({
          test: name,
          error: error.message,
          impact: 'performance'
        });
      }
    }

    test.duration = performance.now() - startTime;
    test.endTime = new Date().toISOString();
    this.testResults.tests.push(test);
    return test;
  }

  async simulateProductionBuild() {
    console.log('🏗️ Simulating production build...');
    
    const buildMetrics = {
      buildTime: 0,
      bundleSize: 0,
      optimizations: [],
      errors: []
    };

    try {
      const startTime = performance.now();
      
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_TELEMETRY_DISABLED = '1';
      
      // Run production build with optimizations
      console.log('🔧 Running optimized production build...');
      const buildOutput = execSync(
        'npm run build:optimized 2>&1',
        { 
          encoding: 'utf8', 
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        }
      );
      
      buildMetrics.buildTime = performance.now() - startTime;
      
      // Analyze build output
      if (buildOutput.includes('Build completed')) {
        buildMetrics.optimizations.push('Build completed successfully');
      }
      
      if (buildOutput.includes('optimized')) {
        buildMetrics.optimizations.push('Bundle optimization applied');
      }
      
      // Check for Next.js build artifacts
      const buildDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(buildDir)) {
        buildMetrics.bundleSize = this.calculateDirectorySize(buildDir);
      }
      
      // Validate critical build artifacts exist
      const requiredArtifacts = [
        '.next/BUILD_ID',
        '.next/static',
        '.next/server'
      ];
      
      for (const artifact of requiredArtifacts) {
        const artifactPath = path.join(process.cwd(), artifact);
        if (!fs.existsSync(artifactPath)) {
          throw new Error(`Critical build artifact missing: ${artifact}`);
        }
      }
      
      console.log(`✅ Production build completed in ${(buildMetrics.buildTime / 1000).toFixed(2)}s`);
      console.log(`📦 Bundle size: ${(buildMetrics.bundleSize / 1024 / 1024).toFixed(1)}MB`);
      
    } catch (error) {
      buildMetrics.errors.push(error.message);
      throw new Error(`Production build failed: ${error.message}`);
    }

    return buildMetrics;
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Handle permission errors gracefully
    }
    return totalSize;
  }

  async testProductionServer() {
    console.log('🚀 Testing production server startup...');
    
    const serverMetrics = {
      startupTime: 0,
      memoryUsage: {},
      healthStatus: 'unknown',
      endpoints: []
    };

    try {
      const startTime = performance.now();
      
      // Start production server in background
      console.log('Starting Next.js production server...');
      const serverProcess = execSync(
        'timeout 30 npm start 2>&1 &',
        { 
          encoding: 'utf8',
          timeout: 5000 // 5 second startup timeout
        }
      );
      
      serverMetrics.startupTime = performance.now() - startTime;
      
      // Give server time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test critical endpoints
      const endpoints = [
        { path: '/', name: 'Home Page' },
        { path: '/api/health', name: 'API Health Check' },
        { path: '/api/ai/health', name: 'AI Health Check' }
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeHttpRequest(`http://localhost:3000${endpoint.path}`);
          serverMetrics.endpoints.push({
            ...endpoint,
            status: 'healthy',
            responseTime: response.duration,
            statusCode: response.statusCode
          });
        } catch (error) {
          serverMetrics.endpoints.push({
            ...endpoint,
            status: 'error',
            error: error.message
          });
        }
      }
      
      // Get memory usage after startup
      serverMetrics.memoryUsage = process.memoryUsage();
      
      const healthyEndpoints = serverMetrics.endpoints.filter(e => e.status === 'healthy');
      if (healthyEndpoints.length === 0) {
        throw new Error('No endpoints responding - server failed to start properly');
      }
      
      serverMetrics.healthStatus = healthyEndpoints.length === endpoints.length ? 'healthy' : 'partial';
      
    } catch (error) {
      throw new Error(`Production server test failed: ${error.message}`);
    }

    return serverMetrics;
  }

  async makeHttpRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const request = https.get(url.replace('http:', 'https:'), { timeout }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            data,
            duration: performance.now() - startTime
          });
        });
      });
      
      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testNetlifyFunctions() {
    console.log('🔧 Testing Netlify Functions deployment...');
    
    const functionMetrics = {
      totalFunctions: 0,
      healthyFunctions: 0,
      functions: []
    };

    try {
      const functionsDir = path.join(process.cwd(), 'netlify', 'functions');
      
      if (!fs.existsSync(functionsDir)) {
        throw new Error('Netlify functions directory not found');
      }
      
      const functionFiles = fs.readdirSync(functionsDir).filter(f => f.endsWith('.js'));
      functionMetrics.totalFunctions = functionFiles.length;
      
      for (const functionFile of functionFiles) {
        const functionName = path.basename(functionFile, '.js');
        const functionPath = path.join(functionsDir, functionFile);
        
        try {
          // Basic syntax validation
          require(functionPath);
          
          functionMetrics.functions.push({
            name: functionName,
            status: 'valid',
            size: fs.statSync(functionPath).size
          });
          
          functionMetrics.healthyFunctions++;
          
        } catch (error) {
          functionMetrics.functions.push({
            name: functionName,
            status: 'error',
            error: error.message
          });
        }
      }
      
      if (functionMetrics.healthyFunctions === 0) {
        throw new Error('No valid Netlify functions found');
      }
      
    } catch (error) {
      throw new Error(`Netlify functions test failed: ${error.message}`);
    }

    return functionMetrics;
  }

  async testEdgeFunctions() {
    console.log('⚡ Testing Edge Functions deployment...');
    
    const edgeMetrics = {
      totalEdgeFunctions: 0,
      validEdgeFunctions: 0,
      functions: []
    };

    try {
      const edgeFunctionsDir = path.join(process.cwd(), 'netlify', 'edge-functions');
      
      if (!fs.existsSync(edgeFunctionsDir)) {
        console.log('⚠️ Edge functions directory not found - creating...');
        return { warning: 'No edge functions deployed yet' };
      }
      
      const edgeFunctionFiles = fs.readdirSync(edgeFunctionsDir).filter(f => f.endsWith('.js'));
      edgeMetrics.totalEdgeFunctions = edgeFunctionFiles.length;
      
      for (const edgeFile of edgeFunctionFiles) {
        const functionName = path.basename(edgeFile, '.js');
        const functionPath = path.join(edgeFunctionsDir, edgeFile);
        
        try {
          const content = fs.readFileSync(functionPath, 'utf8');
          
          // Check for modern edge function patterns
          const hasExportDefault = content.includes('export default');
          const hasConfig = content.includes('export const config');
          const hasEdgeFeatures = content.includes('context.geo') || content.includes('context.cache');
          
          edgeMetrics.functions.push({
            name: functionName,
            status: 'valid',
            size: fs.statSync(functionPath).size,
            hasConfig,
            hasEdgeFeatures,
            isModern: hasExportDefault && hasEdgeFeatures
          });
          
          edgeMetrics.validEdgeFunctions++;
          
        } catch (error) {
          edgeMetrics.functions.push({
            name: functionName,
            status: 'error',
            error: error.message
          });
        }
      }
      
    } catch (error) {
      throw new Error(`Edge functions test failed: ${error.message}`);
    }

    return edgeMetrics;
  }

  async performLoadTesting() {
    console.log('🚀 Performing basic load testing...');
    
    const loadMetrics = {
      concurrentRequests: 10,
      totalRequests: 50,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errors: []
    };

    try {
      const baseUrl = this.testResults.deploymentUrl.startsWith('http') ? 
        this.testResults.deploymentUrl : `http://${this.testResults.deploymentUrl}`;
      
      const requestPromises = [];
      const responseTimes = [];
      
      // Create concurrent requests
      for (let i = 0; i < loadMetrics.totalRequests; i++) {
        const requestPromise = this.makeHttpRequest(`${baseUrl}/`)
          .then(response => {
            loadMetrics.successfulRequests++;
            responseTimes.push(response.duration);
            return response;
          })
          .catch(error => {
            loadMetrics.failedRequests++;
            loadMetrics.errors.push(error.message);
            return null;
          });
        
        requestPromises.push(requestPromise);
        
        // Add slight delay between request batches
        if (i % loadMetrics.concurrentRequests === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Wait for all requests to complete
      await Promise.all(requestPromises);
      
      // Calculate metrics
      if (responseTimes.length > 0) {
        loadMetrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        loadMetrics.minResponseTime = Math.min(...responseTimes);
        loadMetrics.maxResponseTime = Math.max(...responseTimes);
      }
      
      // Performance thresholds
      if (loadMetrics.averageResponseTime > 2000) {
        this.testResults.overall.warnings.push({
          test: 'Load Testing',
          error: `High average response time: ${loadMetrics.averageResponseTime.toFixed(0)}ms`,
          impact: 'performance'
        });
      }
      
      if (loadMetrics.failedRequests > loadMetrics.totalRequests * 0.1) {
        throw new Error(`High failure rate: ${loadMetrics.failedRequests}/${loadMetrics.totalRequests} requests failed`);
      }
      
    } catch (error) {
      throw new Error(`Load testing failed: ${error.message}`);
    }

    return loadMetrics;
  }

  async validateSecurityHeaders() {
    console.log('🔒 Validating security configuration...');
    
    const securityMetrics = {
      headers: {},
      score: 0,
      issues: [],
      recommendations: []
    };

    try {
      const baseUrl = this.testResults.deploymentUrl.startsWith('http') ? 
        this.testResults.deploymentUrl : `http://${this.testResults.deploymentUrl}`;
      
      const response = await this.makeHttpRequest(`${baseUrl}/`);
      securityMetrics.headers = response.headers;
      
      // Check critical security headers
      const requiredHeaders = [
        { name: 'x-frame-options', weight: 20 },
        { name: 'x-content-type-options', weight: 15 },
        { name: 'x-xss-protection', weight: 15 },
        { name: 'strict-transport-security', weight: 25 },
        { name: 'content-security-policy', weight: 25 }
      ];
      
      for (const header of requiredHeaders) {
        if (response.headers[header.name]) {
          securityMetrics.score += header.weight;
        } else {
          securityMetrics.issues.push(`Missing security header: ${header.name}`);
          securityMetrics.recommendations.push(`Add ${header.name} header to improve security`);
        }
      }
      
      // Check for secure values
      if (response.headers['x-frame-options'] !== 'DENY') {
        securityMetrics.issues.push('X-Frame-Options should be set to DENY');
      }
      
      if (response.headers['x-content-type-options'] !== 'nosniff') {
        securityMetrics.issues.push('X-Content-Type-Options should be set to nosniff');
      }
      
      if (securityMetrics.score < 70) {
        this.testResults.overall.warnings.push({
          test: 'Security Headers',
          error: `Low security score: ${securityMetrics.score}/100`,
          impact: 'security'
        });
      }
      
    } catch (error) {
      throw new Error(`Security validation failed: ${error.message}`);
    }

    return securityMetrics;
  }

  async generateDeploymentReport() {
    console.log('📋 Generating deployment readiness report...');
    
    const report = {
      summary: {
        deploymentReady: this.testResults.overall.criticalFailures.length === 0,
        readinessScore: this.calculateReadinessScore(),
        criticalFailures: this.testResults.overall.criticalFailures.length,
        warnings: this.testResults.overall.warnings.length,
        recommendedActions: []
      },
      testResults: this.testResults.tests,
      performance: this.testResults.performance,
      security: this.testResults.security,
      nextSteps: this.generateDeploymentNextSteps()
    };

    // Generate deployment recommendations
    if (report.summary.readinessScore < 80) {
      report.summary.recommendedActions.push('Address performance and security issues before deployment');
    }
    
    if (this.testResults.overall.criticalFailures.length > 0) {
      report.summary.recommendedActions.push('Fix critical failures before proceeding with deployment');
    }

    return report;
  }

  calculateReadinessScore() {
    let score = 100;

    // Critical failures block deployment
    score -= this.testResults.overall.criticalFailures.length * 30;
    
    // Warnings reduce readiness
    score -= this.testResults.overall.warnings.length * 10;
    
    // Performance penalties
    if (this.testResults.loadTesting?.averageResponseTime > 2000) {
      score -= 15;
    }
    
    // Security penalties
    if (this.testResults.security?.score < 70) {
      score -= 20;
    }

    return Math.max(score, 0);
  }

  generateDeploymentNextSteps() {
    const steps = [];

    if (this.testResults.overall.criticalFailures.length > 0) {
      steps.push({
        priority: 'critical',
        action: 'Fix deployment-blocking issues',
        items: this.testResults.overall.criticalFailures.map(f => f.error)
      });
    }

    if (this.testResults.overall.warnings.length > 0) {
      steps.push({
        priority: 'high',
        action: 'Address performance and security warnings',
        items: this.testResults.overall.warnings.slice(0, 3).map(w => w.error)
      });
    }

    steps.push({
      priority: 'medium',
      action: 'Optimize for production',
      items: [
        'Enable compression and caching',
        'Optimize images and assets',
        'Monitor deployment metrics'
      ]
    });

    return steps;
  }

  async run() {
    console.log('🚀 Starting Production Deployment Testing...');
    console.log(`Platform: ${this.testResults.platform}`);
    console.log(`Target: ${this.testResults.deploymentUrl}`);
    console.log('');

    try {
      // Core deployment tests
      await this.runTest('Production Build', () => this.simulateProductionBuild(), true);
      await this.runTest('Server Startup', () => this.testProductionServer(), true);
      await this.runTest('Netlify Functions', () => this.testNetlifyFunctions(), false);
      await this.runTest('Edge Functions', () => this.testEdgeFunctions(), false);
      
      // Performance and security tests
      const loadTest = await this.runTest('Load Testing', () => this.performLoadTesting(), false);
      this.testResults.loadTesting = loadTest.result;
      
      const securityTest = await this.runTest('Security Headers', () => this.validateSecurityHeaders(), false);
      this.testResults.security = securityTest.result;

      // Generate final report
      const report = await this.generateDeploymentReport();

      // Output results
      console.log('\n📊 PRODUCTION DEPLOYMENT RESULTS');
      console.log('=================================');
      console.log(`Deployment Ready: ${report.summary.deploymentReady ? '✅ YES' : '❌ NO'}`);
      console.log(`Readiness Score: ${report.summary.readinessScore}/100`);
      console.log(`Critical Failures: ${report.summary.criticalFailures}`);
      console.log(`Warnings: ${report.summary.warnings}`);

      if (this.testResults.loadTesting?.averageResponseTime) {
        console.log(`Average Response Time: ${this.testResults.loadTesting.averageResponseTime.toFixed(0)}ms`);
        console.log(`Load Test Success Rate: ${((this.testResults.loadTesting.successfulRequests / this.testResults.loadTesting.totalRequests) * 100).toFixed(1)}%`);
      }

      if (this.testResults.security?.score) {
        console.log(`Security Score: ${this.testResults.security.score}/100`);
      }

      if (report.summary.recommendedActions.length > 0) {
        console.log('\n⚠️ RECOMMENDED ACTIONS:');
        report.summary.recommendedActions.forEach(action => {
          console.log(`  - ${action}`);
        });
      }

      if (report.nextSteps.length > 0) {
        console.log('\n📋 NEXT STEPS:');
        report.nextSteps.forEach(step => {
          console.log(`  ${step.priority.toUpperCase()}: ${step.action}`);
          step.items.slice(0, 2).forEach(item => console.log(`    - ${item}`));
        });
      }

      // Save detailed report
      const reportPath = path.join(process.cwd(), 'production-deployment-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      // Exit with appropriate code
      if (!report.summary.deploymentReady) {
        console.log('\n❌ Deployment NOT ready - critical issues must be resolved');
        process.exit(1);
      } else {
        console.log('\n✅ Deployment ready for production');
        process.exit(0);
      }

    } catch (error) {
      console.error('\n🚨 Production deployment test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new ProductionDeploymentTester();
  tester.run().catch(error => {
    console.error('🚨 Production testing system error:', error.message);
    process.exit(1);
  });
}

module.exports = ProductionDeploymentTester;