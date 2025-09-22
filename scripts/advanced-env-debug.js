#!/usr/bin/env node

/**
 * Advanced Environment Debugging System
 * Production-grade environment validation with real-time monitoring
 * Implements cutting-edge deployment practices from Vercel/Netlify 2025
 */

// Load environment variables first
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');
const { performance } = require('perf_hooks');

class AdvancedEnvironmentDebugger {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: this.detectPlatform(),
      buildId: process.env.BUILD_ID || 'local',
      deployUrl: process.env.DEPLOY_URL || 'localhost',
      tests: [],
      performance: {},
      security: {},
      dependencies: {},
      overall: {
        healthy: false,
        score: 0,
        criticalIssues: [],
        warnings: [],
        recommendations: []
      }
    };
  }

  detectPlatform() {
    if (process.env.NETLIFY) return 'netlify';
    if (process.env.VERCEL) return 'vercel';
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws-lambda';
    return 'local';
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
        this.results.overall.criticalIssues.push({
          test: name,
          error: error.message,
          impact: 'high'
        });
      } else {
        this.results.overall.warnings.push({
          test: name,
          error: error.message,
          impact: 'medium'
        });
      }
    }

    test.duration = performance.now() - startTime;
    test.endTime = new Date().toISOString();
    this.results.tests.push(test);
    return test;
  }

  async validateEnvironmentVariables() {
    const requiredVars = [
      { name: 'OPENAI_API_KEY', critical: true, validate: (val) => val && val.startsWith('sk-') },
      { name: 'ANTHROPIC_API_KEY', critical: false, validate: (val) => val && val.startsWith('sk-ant-') },
      { name: 'NEXT_PUBLIC_SUPABASE_URL', critical: true, validate: (val) => val && val.includes('supabase.co') },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true, validate: (val) => val && val.length > 100 },
      { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', critical: true, validate: (val) => val && val.startsWith('pk_') },
      { name: 'STRIPE_SECRET_KEY', critical: true, validate: (val) => val && val.startsWith('sk_') }
    ];

    const results = {
      configured: 0,
      missing: [],
      invalid: [],
      security_issues: []
    };

    for (const envVar of requiredVars) {
      const value = process.env[envVar.name];
      
      if (!value) {
        results.missing.push(envVar.name);
        if (envVar.critical) {
          throw new Error(`Critical environment variable missing: ${envVar.name}`);
        }
      } else if (!envVar.validate(value)) {
        results.invalid.push(envVar.name);
        if (envVar.critical) {
          throw new Error(`Invalid format for critical variable: ${envVar.name}`);
        }
      } else {
        results.configured++;
        
        // Security checks
        if (value.length < 20 && envVar.name.includes('KEY')) {
          results.security_issues.push(`${envVar.name} appears to be too short`);
        }
        
        if (value.includes('test') || value.includes('demo')) {
          results.security_issues.push(`${envVar.name} appears to be a test/demo key`);
        }
      }
    }

    return results;
  }

  async validateAPIConnectivity() {
    const apis = [];
    
    // Test OpenAI API
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const startTime = performance.now();
        await openai.models.list();
        apis.push({
          service: 'OpenAI',
          status: 'healthy',
          latency: performance.now() - startTime
        });
      } catch (error) {
        apis.push({
          service: 'OpenAI',
          status: 'error',
          error: error.message
        });
      }
    }

    // Test Supabase connectivity
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL, 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const startTime = performance.now();
        const { data, error } = await supabase.from('customers').select('count').limit(1);
        if (error) throw error;
        apis.push({
          service: 'Supabase',
          status: 'healthy',
          latency: performance.now() - startTime
        });
      } catch (error) {
        apis.push({
          service: 'Supabase',
          status: 'error',
          error: error.message
        });
      }
    }

    if (apis.length === 0) {
      throw new Error('No API services configured for testing');
    }

    const healthyServices = apis.filter(api => api.status === 'healthy');
    if (healthyServices.length === 0) {
      throw new Error('No API services are responding');
    }

    return {
      tested: apis.length,
      healthy: healthyServices.length,
      services: apis,
      averageLatency: healthyServices.reduce((sum, api) => sum + (api.latency || 0), 0) / healthyServices.length
    };
  }

  async validateBuildArtifacts() {
    const artifacts = {
      nextBuild: path.join(process.cwd(), '.next'),
      publicAssets: path.join(process.cwd(), 'public'),
      serverFunctions: path.join(process.cwd(), 'netlify', 'functions'),
      packageJson: path.join(process.cwd(), 'package.json'),
      nextConfig: path.join(process.cwd(), 'next.config.js')
    };

    const results = {
      present: [],
      missing: [],
      sizes: {},
      integrity: {}
    };

    for (const [name, artifactPath] of Object.entries(artifacts)) {
      if (fs.existsSync(artifactPath)) {
        results.present.push(name);
        
        const stats = fs.statSync(artifactPath);
        results.sizes[name] = stats.isDirectory() ? 
          this.calculateDirectorySize(artifactPath) : stats.size;
          
        // Integrity checks
        if (name === 'packageJson') {
          try {
            const pkg = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            results.integrity[name] = {
              hasScripts: Object.keys(pkg.scripts || {}).length > 0,
              hasDependencies: Object.keys(pkg.dependencies || {}).length > 0,
              version: pkg.version
            };
          } catch (error) {
            results.integrity[name] = { error: error.message };
          }
        }
      } else {
        results.missing.push(name);
      }
    }

    if (results.missing.includes('nextBuild') && process.env.NODE_ENV === 'production') {
      throw new Error('Next.js build artifacts missing in production environment');
    }

    return results;
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

  async validatePerformanceMetrics() {
    const startMemory = process.memoryUsage();
    const startTime = performance.now();

    // Simulate application load
    await new Promise(resolve => setTimeout(resolve, 100));

    const endMemory = process.memoryUsage();
    const endTime = performance.now();

    const metrics = {
      memoryUsage: {
        heapUsed: endMemory.heapUsed,
        heapTotal: endMemory.heapTotal,
        external: endMemory.external,
        rss: endMemory.rss,
        heapUtilization: (endMemory.heapUsed / endMemory.heapTotal) * 100
      },
      timing: {
        applicationStartup: endTime - startTime,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      limits: {
        maxOldSpaceSize: this.getV8MaxOldSpaceSize(),
        memoryLimitApproaching: endMemory.heapUsed > (endMemory.heapTotal * 0.8)
      }
    };

    // Performance warnings
    if (metrics.memoryUsage.heapUtilization > 80) {
      this.results.overall.warnings.push({
        test: 'Performance Metrics',
        error: `High memory utilization: ${metrics.memoryUsage.heapUtilization.toFixed(1)}%`,
        impact: 'medium'
      });
    }

    return metrics;
  }

  getV8MaxOldSpaceSize() {
    try {
      const v8 = require('v8');
      return v8.getHeapStatistics().heap_size_limit;
    } catch {
      return 'unknown';
    }
  }

  async validateSecurityConfiguration() {
    const security = {
      headers: {},
      environment: {},
      dependencies: {},
      score: 0
    };

    // Check for security-related environment variables
    const securityEnvVars = [
      'NODE_ENV',
      'NEXT_TELEMETRY_DISABLED',
      'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD'
    ];

    security.environment = {
      nodeEnv: process.env.NODE_ENV,
      telemetryDisabled: process.env.NEXT_TELEMETRY_DISABLED === '1',
      productionMode: process.env.NODE_ENV === 'production'
    };

    // Security score calculation
    let score = 0;
    if (security.environment.productionMode) score += 20;
    if (security.environment.telemetryDisabled) score += 10;
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('test')) score += 20;
    
    security.score = Math.min(score, 100);

    if (security.score < 50) {
      this.results.overall.warnings.push({
        test: 'Security Configuration',
        error: `Low security score: ${security.score}/100`,
        impact: 'high'
      });
    }

    return security;
  }

  async generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    if (this.results.performance.memoryUsage?.heapUtilization > 60) {
      recommendations.push({
        category: 'Performance',
        priority: 'medium',
        recommendation: 'Consider optimizing memory usage or increasing heap size',
        implementation: 'Add NODE_OPTIONS="--max-old-space-size=4096" to environment'
      });
    }

    // Security recommendations
    if (this.results.security.score < 70) {
      recommendations.push({
        category: 'Security',
        priority: 'high',
        recommendation: 'Improve security configuration',
        implementation: 'Ensure NODE_ENV=production, disable telemetry, use production API keys'
      });
    }

    // Platform-specific recommendations
    if (this.results.platform === 'netlify') {
      recommendations.push({
        category: 'Platform',
        priority: 'medium',
        recommendation: 'Consider implementing Netlify Edge Functions for better performance',
        implementation: 'Move lightweight API endpoints to edge functions'
      });
    }

    // Build optimization recommendations
    const nextBuildSize = this.results.dependencies.sizes?.nextBuild;
    if (nextBuildSize && nextBuildSize > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        category: 'Build',
        priority: 'medium',
        recommendation: 'Large build size detected, consider optimization',
        implementation: 'Enable bundle analysis and implement code splitting'
      });
    }

    return recommendations;
  }

  async run() {
    console.log('🚀 Starting Advanced Environment Debugging...');
    console.log(`Platform: ${this.results.platform}`);
    console.log(`Environment: ${this.results.environment}`);
    console.log('');

    // Run all tests
    await this.runTest('Environment Variables', () => this.validateEnvironmentVariables(), true);
    await this.runTest('API Connectivity', () => this.validateAPIConnectivity(), true);
    await this.runTest('Build Artifacts', () => this.validateBuildArtifacts(), false);
    
    // Store performance and security results
    const performanceTest = await this.runTest('Performance Metrics', () => this.validatePerformanceMetrics(), false);
    this.results.performance = performanceTest.result;
    
    const securityTest = await this.runTest('Security Configuration', () => this.validateSecurityConfiguration(), false);
    this.results.security = securityTest.result;

    // Generate recommendations
    this.results.overall.recommendations = await this.generateRecommendations();

    // Calculate overall health score
    const passedTests = this.results.tests.filter(test => test.status === 'passed').length;
    const totalTests = this.results.tests.length;
    const criticalPassed = this.results.tests.filter(test => test.critical && test.status === 'passed').length;
    const totalCritical = this.results.tests.filter(test => test.critical).length;

    this.results.overall.score = Math.round((passedTests / totalTests) * 100);
    this.results.overall.healthy = (criticalPassed === totalCritical) && (this.results.overall.score >= 70);

    // Output results
    console.log('\n📊 DEBUGGING RESULTS');
    console.log('==================');
    console.log(`Overall Health: ${this.results.overall.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`Overall Score: ${this.results.overall.score}/100`);
    console.log(`Critical Issues: ${this.results.overall.criticalIssues.length}`);
    console.log(`Warnings: ${this.results.overall.warnings.length}`);
    console.log(`Recommendations: ${this.results.overall.recommendations.length}`);

    if (this.results.overall.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.results.overall.criticalIssues.forEach(issue => {
        console.log(`  - ${issue.test}: ${issue.error}`);
      });
    }

    if (this.results.overall.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.overall.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  - ${rec.category}: ${rec.recommendation}`);
      });
    }

    // Save detailed results
    const resultsPath = path.join(process.cwd(), 'debug-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

    // Exit with appropriate code
    if (!this.results.overall.healthy) {
      console.log('\n❌ Environment debugging failed - critical issues detected');
      process.exit(1);
    } else {
      console.log('\n✅ Environment debugging completed successfully');
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const envDebugger = new AdvancedEnvironmentDebugger();
  envDebugger.run().catch(error => {
    console.error('🚨 Debugging system error:', error.message);
    process.exit(1);
  });
}

module.exports = AdvancedEnvironmentDebugger;