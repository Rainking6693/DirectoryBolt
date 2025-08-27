#!/usr/bin/env node

/**
 * USER AGENT TEST RUNNER
 * Executes all user agent related tests and generates a comprehensive report
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import test suites
const AnalyzeEndpointTestSuite = require('./analyze-endpoint-comprehensive-test');
const UserAgentValidationTest = require('./user-agent-validation-test');
const ScraperUserAgentIntegrationTest = require('./scraper-user-agent-integration-test');

class UserAgentTestRunner {
  constructor(config = {}) {
    this.config = {
      baseUrl: process.env.TEST_BASE_URL || config.baseUrl || 'http://localhost:3000',
      realRequests: process.env.REAL_REQUESTS !== 'false',
      verbose: process.env.VERBOSE !== 'false',
      timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
      saveResults: process.env.SAVE_RESULTS !== 'false',
      ...config
    };

    this.testSuites = [];
    this.overallResults = {
      startTime: Date.now(),
      endTime: null,
      duration: null,
      suites: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        successRate: 0
      }
    };

    console.log('🚀 USER AGENT TEST RUNNER');
    console.log('='.repeat(80));
    console.log(`📍 Target Server: ${this.config.baseUrl}`);
    console.log(`🌐 Real Requests: ${this.config.realRequests ? 'ENABLED' : 'DISABLED (Mock Mode)'}`);
    console.log(`📝 Verbose Output: ${this.config.verbose ? 'ENABLED' : 'DISABLED'}`);
    console.log(`⏱️  Test Timeout: ${this.config.timeout}ms`);
    console.log('='.repeat(80));
  }

  async runAllUserAgentTests() {
    const startTime = performance.now();

    try {
      // Pre-flight check
      console.log('\n🔍 PRE-FLIGHT CHECKS');
      console.log('-'.repeat(50));
      await this.performPreflightChecks();

      console.log('\n🧪 EXECUTING TEST SUITES');
      console.log('='.repeat(80));

      // Test Suite 1: Comprehensive Endpoint Testing
      console.log('\n1️⃣ COMPREHENSIVE ENDPOINT TESTING');
      await this.runTestSuite('Comprehensive Analysis', () => {
        const suite = new AnalyzeEndpointTestSuite({
          baseUrl: this.config.baseUrl,
          realRequests: this.config.realRequests,
          verbose: this.config.verbose,
          timeout: this.config.timeout
        });
        return suite.runAllTests();
      });

      // Test Suite 2: User Agent Specific Testing  
      console.log('\n2️⃣ USER AGENT VALIDATION TESTING');
      await this.runTestSuite('User Agent Validation', () => {
        const suite = new UserAgentValidationTest({
          baseUrl: this.config.baseUrl,
          verbose: this.config.verbose
        });
        return suite.runAllUserAgentTests().then(() => suite.testResults);
      });

      // Test Suite 3: Integration Testing
      console.log('\n3️⃣ SCRAPER INTEGRATION TESTING');
      await this.runTestSuite('Scraper Integration', () => {
        const suite = new ScraperUserAgentIntegrationTest({
          baseUrl: this.config.baseUrl,
          verbose: this.config.verbose
        });
        return suite.runIntegrationTests().then(() => suite.testResults);
      });

      // Generate final comprehensive report
      await this.generateComprehensiveReport();

      // Save results if enabled
      if (this.config.saveResults) {
        await this.saveTestResults();
      }

      // Determine exit code based on results
      this.determineExitCode();

    } catch (error) {
      console.error('\n💥 TEST RUNNER FAILED:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }

    const endTime = performance.now();
    this.overallResults.endTime = Date.now();
    this.overallResults.duration = endTime - startTime;

    console.log(`\n⏱️ Total execution time: ${(this.overallResults.duration / 1000).toFixed(2)} seconds`);
  }

  async performPreflightChecks() {
    const checks = [
      {
        name: 'Server Accessibility',
        check: async () => {
          if (!this.config.realRequests) return true;
          
          try {
            const response = await axios.get(`${this.config.baseUrl}/api/health`, { timeout: 5000 });
            return response.status === 200;
          } catch (error) {
            console.error(`   ❌ Server not accessible: ${error.message}`);
            return false;
          }
        }
      },
      {
        name: 'Analyze Endpoint Available',
        check: async () => {
          if (!this.config.realRequests) return true;
          
          try {
            const response = await axios.options(`${this.config.baseUrl}/api/analyze`, { timeout: 5000 });
            return response.status !== 404;
          } catch (error) {
            if (error.response && error.response.status !== 404) {
              return true; // Endpoint exists but may not support OPTIONS
            }
            console.error(`   ❌ Analyze endpoint not found: ${error.message}`);
            return false;
          }
        }
      },
      {
        name: 'Network Connectivity',
        check: async () => {
          if (!this.config.realRequests) return true;
          
          try {
            await axios.get('https://httpbin.org/status/200', { timeout: 5000 });
            return true;
          } catch (error) {
            console.error(`   ❌ External network connectivity failed: ${error.message}`);
            return false;
          }
        }
      }
    ];

    let allChecksPassed = true;

    for (const check of checks) {
      process.stdout.write(`   🔄 ${check.name}... `);
      const result = await check.check();
      
      if (result) {
        console.log('✅ PASS');
      } else {
        console.log('❌ FAIL');
        allChecksPassed = false;
      }
    }

    if (!allChecksPassed && this.config.realRequests) {
      console.log('\n⚠️ Some pre-flight checks failed. Tests may not run correctly.');
      console.log('💡 Consider running with REAL_REQUESTS=false for mock testing.');
      
      // Give user a chance to abort
      if (process.env.INTERACTIVE !== 'false') {
        console.log('\nPress Ctrl+C to abort, or wait 5 seconds to continue...');
        await this.delay(5000);
      }
    }

    return allChecksPassed;
  }

  async runTestSuite(suiteName, suiteRunner) {
    const suiteResult = {
      name: suiteName,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      results: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        successRate: 0
      },
      error: null
    };

    try {
      console.log(`\n🏃‍♂️ Running ${suiteName}...`);
      
      const results = await suiteRunner();
      suiteResult.results = results;

      // Calculate summary
      if (Array.isArray(results)) {
        suiteResult.summary.totalTests = results.length;
        suiteResult.summary.passedTests = results.filter(r => r.status === 'PASS').length;
        suiteResult.summary.failedTests = results.filter(r => r.status === 'FAIL').length;
        suiteResult.summary.errorTests = results.filter(r => r.status === 'ERROR').length;
        suiteResult.summary.successRate = suiteResult.summary.totalTests > 0 
          ? (suiteResult.summary.passedTests / suiteResult.summary.totalTests * 100)
          : 0;
      }

      suiteResult.endTime = Date.now();
      suiteResult.duration = suiteResult.endTime - suiteResult.startTime;

      console.log(`✅ ${suiteName} completed: ${suiteResult.summary.passedTests}/${suiteResult.summary.totalTests} passed (${suiteResult.summary.successRate.toFixed(1)}%)`);

    } catch (error) {
      suiteResult.error = error.message;
      suiteResult.endTime = Date.now();
      suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
      
      console.log(`❌ ${suiteName} failed: ${error.message}`);
    }

    this.overallResults.suites.push(suiteResult);

    // Update overall summary
    this.overallResults.summary.totalTests += suiteResult.summary.totalTests;
    this.overallResults.summary.passedTests += suiteResult.summary.passedTests;
    this.overallResults.summary.failedTests += suiteResult.summary.failedTests;
    this.overallResults.summary.errorTests += suiteResult.summary.errorTests;
  }

  async generateComprehensiveReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 USER AGENT TEST RUNNER - COMPREHENSIVE REPORT');
    console.log('='.repeat(80));

    // Overall statistics
    const { summary } = this.overallResults;
    summary.successRate = summary.totalTests > 0 
      ? (summary.passedTests / summary.totalTests * 100)
      : 0;

    console.log(`\n📈 OVERALL TEST RESULTS:`);
    console.log(`   Total Test Suites: ${this.overallResults.suites.length}`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.passedTests}`);
    console.log(`   ❌ Failed: ${summary.failedTests}`);
    console.log(`   💥 Errors: ${summary.errorTests}`);
    console.log(`   🎯 Overall Success Rate: ${summary.successRate.toFixed(1)}%`);

    // Suite breakdown
    console.log(`\n📂 TEST SUITE BREAKDOWN:`);
    this.overallResults.suites.forEach(suite => {
      const status = suite.error ? '❌ ERROR' : 
                    suite.summary.successRate >= 90 ? '✅ EXCELLENT' :
                    suite.summary.successRate >= 75 ? '⚠️ GOOD' :
                    suite.summary.successRate >= 50 ? '⚠️ WARNING' : '❌ POOR';
      
      console.log(`   ${suite.name}: ${suite.summary.passedTests}/${suite.summary.totalTests} (${suite.summary.successRate.toFixed(1)}%) ${status}`);
      
      if (suite.error) {
        console.log(`     Error: ${suite.error}`);
      }
      
      if (suite.duration) {
        console.log(`     Duration: ${(suite.duration / 1000).toFixed(1)}s`);
      }
    });

    // User Agent Fix Assessment
    console.log(`\n👤 USER AGENT FIX ASSESSMENT:`);
    const userAgentScore = this.calculateUserAgentScore();
    
    if (userAgentScore >= 95) {
      console.log('   🎉 EXCELLENT: User Agent fix is working perfectly!');
      console.log('   ✅ All critical user agent functionality is operational');
      console.log('   💚 Ready for production deployment');
    } else if (userAgentScore >= 85) {
      console.log('   👍 GOOD: User Agent fix is mostly working correctly');
      console.log('   ⚠️ Minor issues detected that should be addressed');
      console.log('   💛 Consider fixing minor issues before production');
    } else if (userAgentScore >= 70) {
      console.log('   ⚠️ WARNING: User Agent fix has significant issues');
      console.log('   🔧 Several problems need to be resolved');
      console.log('   💛 Not recommended for production without fixes');
    } else if (userAgentScore >= 50) {
      console.log('   ❌ POOR: User Agent fix is not working correctly');
      console.log('   🚨 Major functionality problems detected');
      console.log('   💔 Requires immediate attention before deployment');
    } else {
      console.log('   💥 CRITICAL: User Agent fix is completely broken');
      console.log('   🚨 Fundamental issues with user agent handling');
      console.log('   🛑 Do not deploy until major issues are resolved');
    }

    console.log(`\n🎯 User Agent Fix Score: ${userAgentScore.toFixed(1)}/100`);

    // Critical issues
    const criticalIssues = this.identifyCriticalIssues();
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:`);
      criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.suite}: ${issue.description}`);
        if (issue.recommendation) {
          console.log(`      💡 Recommendation: ${issue.recommendation}`);
        }
      });
    }

    // Performance metrics
    console.log(`\n⚡ PERFORMANCE METRICS:`);
    const avgSuiteDuration = this.overallResults.suites.reduce((sum, suite) => sum + (suite.duration || 0), 0) / this.overallResults.suites.length;
    console.log(`   Average Suite Duration: ${(avgSuiteDuration / 1000).toFixed(1)}s`);
    console.log(`   Total Execution Time: ${(this.overallResults.duration / 1000).toFixed(1)}s`);

    // Configuration summary
    console.log(`\n⚙️ TEST CONFIGURATION:`);
    console.log(`   Base URL: ${this.config.baseUrl}`);
    console.log(`   Real Requests: ${this.config.realRequests ? 'Yes' : 'No (Mock Mode)'}`);
    console.log(`   Test Timeout: ${this.config.timeout}ms`);
    console.log(`   Verbose Output: ${this.config.verbose ? 'Yes' : 'No'}`);

    // Recommendations
    const recommendations = this.generateRecommendations();
    console.log(`\n💡 RECOMMENDATIONS:`);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(80));
  }

  calculateUserAgentScore() {
    // Weight different test categories
    const weights = {
      'User Agent Validation': 40,  // Most important
      'Scraper Integration': 35,    // Very important
      'Comprehensive Analysis': 25  // General functionality
    };

    let weightedScore = 0;
    let totalWeight = 0;

    this.overallResults.suites.forEach(suite => {
      const weight = weights[suite.name] || 10;
      weightedScore += suite.summary.successRate * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  identifyCriticalIssues() {
    const issues = [];

    this.overallResults.suites.forEach(suite => {
      if (suite.error) {
        issues.push({
          suite: suite.name,
          description: `Test suite failed to execute: ${suite.error}`,
          recommendation: 'Check server connectivity and test environment setup'
        });
      } else if (suite.summary.successRate < 50) {
        issues.push({
          suite: suite.name,
          description: `Very low success rate (${suite.summary.successRate.toFixed(1)}%)`,
          recommendation: 'Review failed tests and address underlying issues'
        });
      } else if (suite.summary.errorTests > suite.summary.totalTests * 0.2) {
        issues.push({
          suite: suite.name,
          description: `High error rate (${suite.summary.errorTests}/${suite.summary.totalTests} tests had errors)`,
          recommendation: 'Investigate test environment and server stability'
        });
      }
    });

    // Check for specific user agent issues
    const userAgentSuite = this.overallResults.suites.find(s => s.name === 'User Agent Validation');
    if (userAgentSuite && userAgentSuite.summary.successRate < 75) {
      issues.push({
        suite: 'User Agent Validation',
        description: 'User agent handling is not working correctly',
        recommendation: 'Check user agent extraction and propagation in the API endpoint'
      });
    }

    return issues;
  }

  generateRecommendations() {
    const recommendations = [];

    // Based on overall success rate
    if (this.overallResults.summary.successRate >= 95) {
      recommendations.push('All tests are passing! The user agent fix is working correctly.');
      recommendations.push('Consider deploying to production and monitoring user agent usage patterns.');
    } else if (this.overallResults.summary.successRate >= 85) {
      recommendations.push('Most tests are passing. Address the failing tests before production deployment.');
      recommendations.push('Review the specific failed test cases to identify improvement opportunities.');
    } else {
      recommendations.push('Significant test failures detected. Do not deploy until issues are resolved.');
      recommendations.push('Focus on the critical user agent handling functionality first.');
    }

    // Configuration recommendations
    if (!this.config.realRequests) {
      recommendations.push('Tests were run in mock mode. Run with REAL_REQUESTS=true for complete validation.');
    }

    // Performance recommendations
    const avgDuration = this.overallResults.duration / 1000;
    if (avgDuration > 300) {
      recommendations.push('Test execution time is quite long. Consider optimizing tests or server performance.');
    }

    // Suite-specific recommendations
    this.overallResults.suites.forEach(suite => {
      if (suite.name === 'User Agent Validation' && suite.summary.successRate < 90) {
        recommendations.push('User agent validation tests are failing. Check the userAgent parameter extraction in the API.');
      }
      
      if (suite.name === 'Scraper Integration' && suite.summary.successRate < 80) {
        recommendations.push('Scraper integration issues detected. Verify user agent is passed to OptimizedScraper correctly.');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations. All systems appear to be working correctly.');
    }

    return recommendations;
  }

  async saveTestResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user-agent-test-results-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      overallResults: this.overallResults,
      userAgentScore: this.calculateUserAgentScore(),
      criticalIssues: this.identifyCriticalIssues(),
      recommendations: this.generateRecommendations()
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
      console.log(`\n💾 Test results saved to: ${filepath}`);
    } catch (error) {
      console.warn(`\n⚠️ Could not save test results: ${error.message}`);
    }
  }

  determineExitCode() {
    const criticalIssues = this.identifyCriticalIssues();
    const userAgentScore = this.calculateUserAgentScore();

    if (criticalIssues.length > 0 || userAgentScore < 70) {
      console.log('\n❌ TESTS FAILED - Issues require attention before deployment');
      process.exit(1);
    } else if (userAgentScore < 85) {
      console.log('\n⚠️ TESTS PASSED WITH WARNINGS - Consider addressing minor issues');
      process.exit(0);
    } else {
      console.log('\n✅ ALL TESTS PASSED - User Agent fix is working correctly!');
      process.exit(0);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const config = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    realRequests: process.env.REAL_REQUESTS !== 'false',
    verbose: process.env.VERBOSE !== 'false',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    saveResults: process.env.SAVE_RESULTS !== 'false'
  };

  const testRunner = new UserAgentTestRunner(config);
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n⚠️ Test execution interrupted by user');
    console.log('📊 Partial results may be incomplete');
    process.exit(2);
  });

  testRunner.runAllUserAgentTests()
    .catch((error) => {
      console.error('\n💥 Test runner execution failed:', error);
      process.exit(1);
    });
}

module.exports = UserAgentTestRunner;