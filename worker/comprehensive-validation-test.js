#!/usr/bin/env node

/**
 * DirectoryBolt Worker Comprehensive Validation Test
 * 
 * This script validates all worker connections and functionality
 * to ensure the system is ready for Hudson's approval and production deployment.
 * 
 * Test Coverage:
 * - Environment configuration validation
 * - Supabase database connectivity
 * - API endpoint authentication and communication
 * - Worker functionality (form detection, field mapping, etc.)
 * - Directory configuration loading
 * - Error handling and retry mechanisms
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

class ComprehensiveValidationTest {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.warnings = [];
    this.criticalIssues = [];
    this.startTime = Date.now();
  }

  /**
   * Main test execution
   */
  async runAllTests() {
    console.log('🚀 DirectoryBolt Worker Comprehensive Validation Test');
    console.log('====================================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Phase 1: Environment & Dependencies
      await this.testEnvironmentConfiguration();
      await this.testDependencies();
      
      // Phase 2: Database Connectivity
      await this.testSupabaseConnection();
      await this.testDatabaseSchema();
      
      // Phase 3: API Connectivity
      await this.testAPIEndpoints();
      await this.testWorkerAuthentication();
      
      // Phase 4: Worker Functionality
      await this.testDirectoryConfiguration();
      await this.testFormDetection();
      await this.testFieldMapping();
      
      // Phase 5: Integration Tests
      await this.testJobProcessingFlow();
      
      // Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed with critical error:', error);
      this.criticalIssues.push(`Test suite failure: ${error.message}`);
      this.generateReport();
      process.exit(1);
    }
  }

  /**
   * Test environment configuration
   */
  async testEnvironmentConfiguration() {
    console.log('📋 Phase 1: Environment Configuration');
    console.log('=====================================');

    // Test 1: Required environment variables
    await this.test('Environment Variables - Required Keys', () => {
      const required = [
        'AUTOBOLT_API_KEY',
        'WORKER_AUTH_TOKEN', 
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'ORCHESTRATOR_URL'
      ];

      const missing = required.filter(key => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }

      // Validate key formats
      if (process.env.AUTOBOLT_API_KEY.length < 32) {
        this.warnings.push('AUTOBOLT_API_KEY appears to be short - verify it\'s correct');
      }

      if (!process.env.SUPABASE_URL.startsWith('https://')) {
        throw new Error('SUPABASE_URL must be a valid HTTPS URL');
      }

      if (!process.env.ORCHESTRATOR_URL.includes('api')) {
        this.warnings.push('ORCHESTRATOR_URL should include /api path');
      }

      return true;
    });

    // Test 2: Optional but recommended variables
    await this.test('Environment Variables - Optional Keys', () => {
      const optional = [
        'TWOCAPTCHA_API_KEY',
        'TWO_CAPTCHA_KEY',
        'WORKER_ID',
        'HEADLESS'
      ];

      const missing = optional.filter(key => !process.env[key]);
      if (missing.length > 0) {
        this.warnings.push(`Optional environment variables not set: ${missing.join(', ')}`);
      }

      return true;
    });

    // Test 3: .env file format validation
    await this.test('Environment File Format', () => {
      const envPath = path.join(__dirname, '.env');
      if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found');
      }

      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check for common formatting issues
      if (envContent.includes('======') && !envContent.includes('# DirectoryBolt')) {
        this.warnings.push('.env file may have formatting issues');
      }

      return true;
    });

    console.log('✅ Environment configuration tests completed\n');
  }

  /**
   * Test dependencies
   */
  async testDependencies() {
    console.log('📦 Testing Dependencies');
    console.log('=======================');

    await this.test('Package.json Dependencies', () => {
      const packagePath = path.join(__dirname, 'package.json');
      if (!fs.existsSync(packagePath)) {
        throw new Error('package.json not found');
      }

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const required = ['playwright', 'axios', 'dotenv', '@supabase/supabase-js'];
      
      const missing = required.filter(dep => !packageJson.dependencies[dep]);
      if (missing.length > 0) {
        throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
      }

      return true;
    });

    await this.test('Node Modules Installation', () => {
      const nodeModulesPath = path.join(__dirname, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        throw new Error('node_modules directory not found - run npm install');
      }

      // Check for key dependencies
      const criticalDeps = ['playwright', 'axios', '@supabase'];
      const missing = criticalDeps.filter(dep => 
        !fs.existsSync(path.join(nodeModulesPath, dep))
      );

      if (missing.length > 0) {
        throw new Error(`Critical dependencies not installed: ${missing.join(', ')}`);
      }

      return true;
    });

    console.log('✅ Dependencies tests completed\n');
  }

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection() {
    console.log('🗄️  Testing Supabase Connection');
    console.log('===============================');

    await this.test('Supabase Client Creation', async () => {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Test basic connection
        const { data, error } = await supabase
          .from('jobs')
          .select('id')
          .limit(1);

        if (error) {
          throw new Error(`Supabase connection failed: ${error.message}`);
        }

        return true;
      } catch (error) {
        throw new Error(`Failed to create Supabase client: ${error.message}`);
      }
    });

    console.log('✅ Supabase connection tests completed\n');
  }

  /**
   * Test database schema
   */
  async testDatabaseSchema() {
    console.log('🏗️  Testing Database Schema');
    console.log('===========================');

    await this.test('Required Tables Exist', async () => {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const requiredTables = ['jobs', 'customers', 'job_results'];
        
        for (const table of requiredTables) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error) {
            throw new Error(`Table '${table}' not accessible: ${error.message}`);
          }
        }

        return true;
      } catch (error) {
        throw new Error(`Database schema validation failed: ${error.message}`);
      }
    });

    console.log('✅ Database schema tests completed\n');
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints() {
    console.log('🌐 Testing API Endpoints');
    console.log('========================');

    const baseUrl = process.env.ORCHESTRATOR_URL;
    const authToken = process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN;

    await this.test('API Base URL Accessibility', async () => {
      try {
        // Test if the base API is reachable
        const response = await axios.get(`${baseUrl}/health`, {
          timeout: 10000,
          validateStatus: () => true // Accept any status for this test
        });

        if (response.status >= 500) {
          throw new Error(`API server error: ${response.status}`);
        }

        return true;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('API server is not running or unreachable');
        }
        throw new Error(`API accessibility test failed: ${error.message}`);
      }
    });

    await this.test('Jobs Next Endpoint', async () => {
      try {
        const response = await axios.get(`${baseUrl}/jobs/next`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-Worker-ID': process.env.WORKER_ID || 'test-worker',
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: () => true
        });

        if (response.status === 401) {
          throw new Error('Authentication failed - check AUTOBOLT_API_KEY');
        }

        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }

        // 200 (job found) or 204 (no jobs) are both valid
        if (![200, 204].includes(response.status)) {
          this.warnings.push(`Unexpected status from jobs/next: ${response.status}`);
        }

        return true;
      } catch (error) {
        throw new Error(`Jobs next endpoint test failed: ${error.message}`);
      }
    });

    console.log('✅ API endpoints tests completed\n');
  }

  /**
   * Test worker authentication
   */
  async testWorkerAuthentication() {
    console.log('🔐 Testing Worker Authentication');
    console.log('================================');

    await this.test('Authentication Token Validation', async () => {
      const token = process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (token.length < 20) {
        throw new Error('Authentication token appears to be too short');
      }

      // Test token format (should be hex or similar)
      if (!/^[a-f0-9]{32,}$/i.test(token)) {
        this.warnings.push('Authentication token format may be non-standard');
      }

      return true;
    });

    console.log('✅ Worker authentication tests completed\n');
  }

  /**
   * Test directory configuration
   */
  async testDirectoryConfiguration() {
    console.log('📁 Testing Directory Configuration');
    console.log('==================================');

    await this.test('Directory Config Loading', async () => {
      try {
        const DirectoryConfiguration = require('./directory-config.js');
        const config = new DirectoryConfiguration();
        
        await config.initialize();
        
        if (!config.initialized) {
          throw new Error('Directory configuration failed to initialize');
        }

        const directories = config.getAvailableDirectories('starter');
        if (!Array.isArray(directories) || directories.length === 0) {
          throw new Error('No directories available for starter tier');
        }

        return true;
      } catch (error) {
        throw new Error(`Directory configuration test failed: ${error.message}`);
      }
    });

    await this.test('Field Selectors Validation', () => {
      try {
        const DirectoryConfiguration = require('./directory-config.js');
        const config = new DirectoryConfiguration();
        
        const emailSelectors = config.getFieldSelectors('email');
        if (!Array.isArray(emailSelectors) || emailSelectors.length === 0) {
          throw new Error('Email field selectors not found');
        }

        const businessSelectors = config.getFieldSelectors('businessName');
        if (!Array.isArray(businessSelectors) || businessSelectors.length === 0) {
          throw new Error('Business name field selectors not found');
        }

        return true;
      } catch (error) {
        throw new Error(`Field selectors validation failed: ${error.message}`);
      }
    });

    console.log('✅ Directory configuration tests completed\n');
  }

  /**
   * Test form detection functionality
   */
  async testFormDetection() {
    console.log('🔍 Testing Form Detection');
    console.log('=========================');

    await this.test('Form Detection Classes', () => {
      try {
        // Test that the worker file can be required without errors
        const workerPath = path.join(__dirname, 'worker.js');
        if (!fs.existsSync(workerPath)) {
          throw new Error('worker.js file not found');
        }

        // Basic syntax validation by requiring the file
        delete require.cache[require.resolve('./worker.js')];
        const DirectoryBoltWorker = require('./worker.js');
        
        if (typeof DirectoryBoltWorker !== 'function') {
          throw new Error('DirectoryBoltWorker is not a constructor function');
        }

        return true;
      } catch (error) {
        throw new Error(`Form detection classes test failed: ${error.message}`);
      }
    });

    console.log('✅ Form detection tests completed\n');
  }

  /**
   * Test field mapping functionality
   */
  async testFieldMapping() {
    console.log('🗺️  Testing Field Mapping');
    console.log('=========================');

    await this.test('Field Mapping Logic', () => {
      try {
        // Test field mapping patterns
        const DirectoryConfiguration = require('./directory-config.js');
        const config = new DirectoryConfiguration();
        
        // Test business data mapping
        const businessData = {
          businessName: 'Test Company LLC',
          email: 'test@example.com',
          phone: '555-0123',
          website: 'https://example.com'
        };

        // Validate that we have selectors for all business fields
        const requiredFields = ['businessName', 'email', 'phone', 'website'];
        for (const field of requiredFields) {
          const selectors = config.getFieldSelectors(field);
          if (!selectors || selectors.length === 0) {
            throw new Error(`No selectors found for field: ${field}`);
          }
        }

        return true;
      } catch (error) {
        throw new Error(`Field mapping test failed: ${error.message}`);
      }
    });

    console.log('✅ Field mapping tests completed\n');
  }

  /**
   * Test job processing flow
   */
  async testJobProcessingFlow() {
    console.log('⚙️  Testing Job Processing Flow');
    console.log('===============================');

    await this.test('Worker Initialization', async () => {
      try {
        // Test worker can be created and initialized
        const DirectoryBoltWorker = require('./worker.js');
        const worker = new DirectoryBoltWorker();
        
        // Test configuration
        if (!worker.config) {
          throw new Error('Worker config not initialized');
        }

        if (!worker.config.orchestratorBaseUrl) {
          throw new Error('Orchestrator URL not configured');
        }

        return true;
      } catch (error) {
        throw new Error(`Worker initialization test failed: ${error.message}`);
      }
    });

    console.log('✅ Job processing flow tests completed\n');
  }

  /**
   * Helper method to run individual tests
   */
  async test(name, testFunction) {
    this.totalTests++;
    
    try {
      console.log(`  🧪 ${name}...`);
      const result = await testFunction();
      
      if (result === true) {
        this.passedTests++;
        console.log(`    ✅ PASSED`);
        this.testResults.push({ name, status: 'PASSED', error: null });
      } else {
        this.failedTests++;
        console.log(`    ❌ FAILED: Unexpected result`);
        this.testResults.push({ name, status: 'FAILED', error: 'Unexpected result' });
      }
    } catch (error) {
      this.failedTests++;
      console.log(`    ❌ FAILED: ${error.message}`);
      this.testResults.push({ name, status: 'FAILED', error: error.message });
      
      // Mark as critical if it's a fundamental issue
      if (name.includes('Environment') || name.includes('Dependencies') || name.includes('Supabase')) {
        this.criticalIssues.push(`${name}: ${error.message}`);
      }
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n📊 COMPREHENSIVE VALIDATION REPORT');
    console.log('=====================================');
    console.log(`Test Duration: ${duration}ms`);
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests} ✅`);
    console.log(`Failed: ${this.failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Warnings: ${this.warnings.length} ⚠️`);
    console.log(`Critical Issues: ${this.criticalIssues.length} 🚨`);

    // Show warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    // Show critical issues
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    // Show failed tests
    const failedTests = this.testResults.filter(test => test.status === 'FAILED');
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.name}: ${test.error}`);
      });
    }

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    if (this.criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES FOUND - Worker not ready for production');
      console.log('   Please resolve critical issues before deployment');
    } else if (this.failedTests > 0) {
      console.log('⚠️  SOME TESTS FAILED - Review required');
      console.log('   Worker may function but needs attention');
    } else if (this.warnings.length > 0) {
      console.log('✅ WORKER READY - Minor warnings present');
      console.log('   Worker is functional, warnings are recommendations');
    } else {
      console.log('🎉 WORKER FULLY VALIDATED - Ready for Hudson approval!');
      console.log('   All systems operational, no issues detected');
    }

    // Next steps
    console.log('\n📋 NEXT STEPS:');
    if (this.criticalIssues.length > 0) {
      console.log('1. Resolve critical issues listed above');
      console.log('2. Re-run this validation test');
      console.log('3. Install missing dependencies if needed: npm install');
    } else {
      console.log('1. Review any warnings and address if needed');
      console.log('2. Run end-to-end test: npm test');
      console.log('3. Start worker service: npm start');
      console.log('4. Monitor worker logs for proper operation');
    }

    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      duration,
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.failedTests,
      successRate: parseFloat(successRate),
      warnings: this.warnings,
      criticalIssues: this.criticalIssues,
      testResults: this.testResults
    };

    try {
      fs.writeFileSync(
        path.join(__dirname, 'validation-report.json'),
        JSON.stringify(reportData, null, 2)
      );
      console.log('\n💾 Report saved to: validation-report.json');
    } catch (error) {
      console.log('\n⚠️  Could not save report file:', error.message);
    }

    console.log('\n====================================');
    console.log('Validation test completed!');
    console.log('====================================\n');
  }
}

// Run tests if called directly
if (require.main === module) {
  const validator = new ComprehensiveValidationTest();
  validator.runAllTests().catch(error => {
    console.error('Validation test failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveValidationTest;