// 🧪 STRIPE TEST SUITE - Comprehensive testing with error categorization
// This script runs all debugging tools and provides a unified analysis

// Load environment variables
require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });

const StripeEnvironmentValidator = require('./stripe-environment-validator');
const StripeApiDebugger = require('./stripe-api-debugger');
const StripeProductValidator = require('./stripe-product-validator');
const fs = require('fs');
const path = require('path');

class StripeTestSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl,
      overall_score: 0,
      max_score: 100,
      environment_validation: null,
      product_validation: null,
      api_debugging: null,
      categorized_issues: {
        critical: [],
        high: [],
        medium: [],
        low: []
      },
      root_causes: [],
      launch_readiness: {
        ready: false,
        score: 0,
        blockers: []
      },
      recommendations: []
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    
    switch (level) {
      case 'SUCCESS':
        console.log(`✅ ${message}`);
        break;
      case 'ERROR':
        console.error(`❌ ${message}`);
        break;
      case 'WARNING':
        console.warn(`⚠️  ${message}`);
        break;
      case 'INFO':
        console.log(`ℹ️  ${message}`);
        break;
      case 'HEADER':
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔧 ${message}`);
        console.log(`${'='.repeat(60)}`);
        break;
    }

    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async runEnvironmentValidation() {
    this.log('HEADER', 'STEP 1: ENVIRONMENT VALIDATION');
    
    try {
      const validator = new StripeEnvironmentValidator();
      const envResults = await validator.runValidation();
      
      this.results.environment_validation = envResults;
      this.results.overall_score += (envResults.summary.success_rate * 0.3); // 30% weight
      
      // Categorize environment issues
      this.categorizeIssues(envResults.details.errors, 'ENVIRONMENT');
      this.categorizeIssues(envResults.details.warnings, 'ENVIRONMENT', 'warning');
      
      this.log('SUCCESS', `Environment validation completed: ${envResults.summary.success_rate}% success rate`);
      return envResults;
    } catch (error) {
      this.log('ERROR', 'Environment validation failed', { error: error.message });
      this.results.categorized_issues.critical.push({
        category: 'ENVIRONMENT',
        issue: 'Environment validation completely failed',
        error: error.message
      });
      return null;
    }
  }

  async runProductValidation() {
    this.log('HEADER', 'STEP 2: PRODUCT VALIDATION');
    
    try {
      const validator = new StripeProductValidator();
      const productResults = await validator.runValidation();
      
      this.results.product_validation = productResults;
      this.results.overall_score += (productResults.summary.success_rate * 0.3); // 30% weight
      
      // Categorize product issues
      productResults.plan_status.forEach(plan => {
        if (!plan.configured) {
          this.results.categorized_issues.high.push({
            category: 'PRODUCT_CONFIG',
            issue: `${plan.plan} plan not configured`,
            price_id: plan.price_id
          });
        } else if (!plan.valid) {
          this.results.categorized_issues.critical.push({
            category: 'PRODUCT_VALIDATION',
            issue: `${plan.plan} plan price ID invalid`,
            price_id: plan.price_id
          });
        }
      });
      
      this.log('SUCCESS', `Product validation completed: ${productResults.summary.success_rate}% success rate`);
      return productResults;
    } catch (error) {
      this.log('ERROR', 'Product validation failed', { error: error.message });
      this.results.categorized_issues.critical.push({
        category: 'PRODUCT_VALIDATION',
        issue: 'Product validation completely failed',
        error: error.message
      });
      return null;
    }
  }

  async runApiDebugging() {
    this.log('HEADER', 'STEP 3: API DEBUGGING');
    
    try {
      const apiDebugger = new StripeApiDebugger(this.baseUrl);
      const apiResults = await apiDebugger.runAllTests();
      
      this.results.api_debugging = apiResults;
      this.results.overall_score += (apiResults.summary.success_rate * 0.4); // 40% weight
      
      // Categorize API issues
      apiResults.tests.forEach(test => {
        if (test.status === 'FAILED') {
          const priority = this.categorizeApiError(test.error);
          this.results.categorized_issues[priority].push({
            category: 'API_TESTING',
            issue: `API test failed: ${test.name}`,
            error: test.error?.message,
            status_code: test.error?.status
          });
        }
      });
      
      this.log('SUCCESS', `API debugging completed: ${apiResults.summary.success_rate}% success rate`);
      return apiResults;
    } catch (error) {
      this.log('ERROR', 'API debugging failed', { error: error.message });
      this.results.categorized_issues.critical.push({
        category: 'API_TESTING',
        issue: 'API debugging completely failed',
        error: error.message
      });
      return null;
    }
  }

  categorizeIssues(issues, category, type = 'error') {
    if (!issues || !Array.isArray(issues)) return;
    
    issues.forEach(issue => {
      let priority = 'medium';
      
      // Determine priority based on category and content
      if (type === 'error') {
        if (issue.category === 'SECRET_KEY' || issue.category === 'CONNECTION') {
          priority = 'critical';
        } else if (issue.category === 'PRICE_IDS' || issue.category === 'KEY_CONSISTENCY') {
          priority = 'high';
        }
      } else if (type === 'warning') {
        priority = 'low';
      }
      
      this.results.categorized_issues[priority].push({
        category: category,
        subcategory: issue.category,
        issue: issue.message,
        data: issue.data
      });
    });
  }

  categorizeApiError(error) {
    if (!error) return 'medium';
    
    const statusCode = error.status;
    const message = error.message?.toLowerCase() || '';
    
    // Critical errors
    if (statusCode >= 500 || message.includes('stripe') || message.includes('payment')) {
      return 'critical';
    }
    
    // High priority errors
    if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
      return 'high';
    }
    
    // Medium priority errors
    if (statusCode >= 400) {
      return 'medium';
    }
    
    return 'low';
  }

  analyzeRootCauses() {
    this.log('INFO', 'Analyzing root causes...');
    
    const rootCauses = [];
    
    // Check for environment configuration issues
    const envIssues = this.results.categorized_issues.critical
      .concat(this.results.categorized_issues.high)
      .filter(issue => issue.category === 'ENVIRONMENT');
      
    if (envIssues.length > 0) {
      rootCauses.push({
        cause: 'Environment Configuration Issues',
        description: 'Stripe environment variables are not properly configured',
        impact: 'HIGH',
        affected_areas: ['Authentication', 'API Calls', 'Checkout Sessions'],
        issues: envIssues
      });
    }
    
    // Check for product configuration issues
    const productIssues = this.results.categorized_issues.critical
      .concat(this.results.categorized_issues.high)
      .filter(issue => issue.category.includes('PRODUCT'));
      
    if (productIssues.length > 0) {
      rootCauses.push({
        cause: 'Stripe Product Configuration Issues',
        description: 'Products or prices are not properly set up in Stripe',
        impact: 'HIGH',
        affected_areas: ['Checkout Creation', 'Price Validation', 'Subscription Plans'],
        issues: productIssues
      });
    }
    
    // Check for API connectivity issues
    const apiIssues = this.results.categorized_issues.critical
      .filter(issue => issue.category === 'API_TESTING');
      
    if (apiIssues.length > 0) {
      rootCauses.push({
        cause: 'API Connectivity Issues',
        description: 'API endpoint is not responding correctly',
        impact: 'CRITICAL',
        affected_areas: ['User Experience', 'Payment Flow', 'Frontend Integration'],
        issues: apiIssues
      });
    }
    
    this.results.root_causes = rootCauses;
    return rootCauses;
  }

  assessLaunchReadiness() {
    this.log('INFO', 'Assessing launch readiness...');
    
    let score = this.results.overall_score;
    const blockers = [];
    
    // Check for critical blockers
    if (this.results.categorized_issues.critical.length > 0) {
      blockers.push({
        type: 'CRITICAL_ISSUES',
        count: this.results.categorized_issues.critical.length,
        message: `${this.results.categorized_issues.critical.length} critical issues must be resolved`
      });
      score *= 0.5; // Halve score for critical issues
    }
    
    // Check environment validation
    if (!this.results.environment_validation || this.results.environment_validation.summary.success_rate < 80) {
      blockers.push({
        type: 'ENVIRONMENT_CONFIG',
        message: 'Environment configuration is incomplete or invalid'
      });
    }
    
    // Check product validation
    if (!this.results.product_validation || this.results.product_validation.summary.success_rate < 80) {
      blockers.push({
        type: 'PRODUCT_CONFIG',
        message: 'Stripe products/prices are not properly configured'
      });
    }
    
    // Check API functionality
    if (!this.results.api_debugging || this.results.api_debugging.summary.success_rate < 70) {
      blockers.push({
        type: 'API_FUNCTIONALITY',
        message: 'API endpoints are not functioning correctly'
      });
    }
    
    this.results.launch_readiness = {
      ready: blockers.length === 0 && score >= 80,
      score: Math.round(score),
      blockers: blockers,
      recommendation: blockers.length === 0 ? 'READY_TO_LAUNCH' : 'NEEDS_FIXES'
    };
    
    return this.results.launch_readiness;
  }

  generateRecommendations() {
    this.log('INFO', 'Generating recommendations...');
    
    const recommendations = [];
    
    // Priority 1: Critical Issues
    if (this.results.categorized_issues.critical.length > 0) {
      recommendations.push({
        priority: 1,
        title: 'Fix Critical Issues Immediately',
        description: 'These issues will completely prevent Stripe integration from working',
        actions: this.results.categorized_issues.critical.map(issue => ({
          action: `Fix ${issue.category}: ${issue.issue}`,
          category: issue.category
        }))
      });
    }
    
    // Priority 2: High Priority Issues
    if (this.results.categorized_issues.high.length > 0) {
      recommendations.push({
        priority: 2,
        title: 'Address High Priority Configuration Issues',
        description: 'These issues will cause payment failures or degraded functionality',
        actions: this.results.categorized_issues.high.map(issue => ({
          action: `Address ${issue.category}: ${issue.issue}`,
          category: issue.category
        }))
      });
    }
    
    // Priority 3: Environment Setup
    if (this.results.environment_validation && this.results.environment_validation.summary.success_rate < 100) {
      recommendations.push({
        priority: 3,
        title: 'Complete Environment Configuration',
        description: 'Ensure all Stripe environment variables are properly set',
        actions: [
          'Verify STRIPE_SECRET_KEY is set and valid',
          'Verify STRIPE_PUBLISHABLE_KEY is set and matches secret key',
          'Set all STRIPE_*_PRICE_ID environment variables',
          'Configure STRIPE_WEBHOOK_SECRET if using webhooks'
        ]
      });
    }
    
    // Priority 4: Testing and Monitoring
    recommendations.push({
      priority: 4,
      title: 'Implement Continuous Testing',
      description: 'Set up monitoring to catch issues early',
      actions: [
        'Run these debugging scripts regularly',
        'Set up health checks for Stripe connectivity',
        'Monitor API error rates',
        'Test payment flows in staging environment'
      ]
    });
    
    this.results.recommendations = recommendations;
    return recommendations;
  }

  generateFinalReport() {
    const report = {
      ...this.results,
      test_summary: {
        total_score: `${this.results.launch_readiness.score}/100`,
        launch_ready: this.results.launch_readiness.ready,
        critical_issues: this.results.categorized_issues.critical.length,
        high_priority_issues: this.results.categorized_issues.high.length,
        total_blockers: this.results.launch_readiness.blockers.length
      },
      next_steps: this.results.launch_readiness.ready ? 
        ['Deploy to production', 'Monitor payment flows', 'Set up alerts'] :
        ['Fix critical issues', 'Re-run test suite', 'Verify all tests pass']
    };
    
    return report;
  }

  async runFullTestSuite() {
    console.log('🧪 Starting Comprehensive Stripe Test Suite...\n');
    console.log(`Testing environment: ${this.baseUrl}\n`);
    
    try {
      // Run all validations
      await this.runEnvironmentValidation();
      await this.runProductValidation();
      await this.runApiDebugging();
      
      // Analyze results
      this.analyzeRootCauses();
      this.assessLaunchReadiness();
      this.generateRecommendations();
      
      // Generate final report
      const report = this.generateFinalReport();
      
      // Display summary
      this.log('HEADER', 'FINAL RESULTS');
      console.log(`🎯 Overall Score: ${report.test_summary.total_score}`);
      console.log(`🚀 Launch Ready: ${report.test_summary.launch_ready ? 'YES' : 'NO'}`);
      console.log(`🚨 Critical Issues: ${report.test_summary.critical_issues}`);
      console.log(`⚠️  High Priority Issues: ${report.test_summary.high_priority_issues}`);
      console.log(`🛑 Total Blockers: ${report.test_summary.total_blockers}`);
      
      if (report.root_causes.length > 0) {
        console.log('\n🔍 ROOT CAUSES:');
        report.root_causes.forEach((cause, index) => {
          console.log(`${index + 1}. ${cause.cause} (Impact: ${cause.impact})`);
          console.log(`   ${cause.description}`);
        });
      }
      
      if (report.recommendations.length > 0) {
        console.log('\n📋 PRIORITY ACTIONS:');
        report.recommendations.forEach(rec => {
          console.log(`${rec.priority}. ${rec.title}`);
          console.log(`   ${rec.description}`);
        });
      }
      
      // Save comprehensive report
      const reportPath = path.join(process.cwd(), 'stripe-comprehensive-test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);
      
      return report;
      
    } catch (error) {
      this.log('ERROR', 'Test suite execution failed', { error: error.message });
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const testSuite = new StripeTestSuite(baseUrl);
  
  testSuite.runFullTestSuite()
    .then(results => {
      process.exit(results.test_summary.launch_ready ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = StripeTestSuite;