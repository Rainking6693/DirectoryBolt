#!/usr/bin/env node

/**
 * DirectoryBolt Worker End-to-End Test
 * 
 * This script performs a complete end-to-end test of the worker system
 * without actually processing real jobs or making external submissions.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EndToEndTest {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runEndToEndTest() {
    console.log('🚀 DirectoryBolt Worker End-to-End Test');
    console.log('=======================================');
    console.log(`Started: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Test 1: Worker Initialization
      await this.testWorkerInitialization();
      
      // Test 2: Directory Configuration
      await this.testDirectoryConfiguration();
      
      // Test 3: Mock Job Processing
      await this.testMockJobProcessing();
      
      // Test 4: API Communication (if available)
      await this.testAPICommunication();
      
      this.printFinalResults();
      
    } catch (error) {
      console.error('❌ End-to-end test failed:', error);
      process.exit(1);
    }
  }

  async testWorkerInitialization() {
    console.log('🔧 Testing Worker Initialization');
    console.log('================================');

    try {
      // Import and create worker instance
      const DirectoryBoltWorker = require('./worker.js');
      const worker = new DirectoryBoltWorker();
      
      console.log('  ✅ Worker class imported successfully');
      
      // Test configuration
      if (!worker.config) {
        throw new Error('Worker config not initialized');
      }
      console.log('  ✅ Worker configuration loaded');
      
      // Test field mapper
      if (!worker.fieldMapper) {
        throw new Error('Field mapper not initialized');
      }
      console.log('  ✅ Field mapper initialized');
      
      // Test form detector
      if (!worker.formDetector) {
        throw new Error('Form detector not initialized');
      }
      console.log('  ✅ Form detector initialized');
      
      // Test fallback engine
      if (!worker.fallbackEngine) {
        throw new Error('Fallback engine not initialized');
      }
      console.log('  ✅ Fallback selector engine initialized');
      
      this.testResults.push({ test: 'Worker Initialization', status: 'PASS' });
      
    } catch (error) {
      console.log(`  ❌ Worker initialization failed: ${error.message}`);
      this.testResults.push({ test: 'Worker Initialization', status: 'FAIL', error: error.message });
    }
    
    console.log('');
  }

  async testDirectoryConfiguration() {
    console.log('📁 Testing Directory Configuration');
    console.log('==================================');

    try {
      const DirectoryConfiguration = require('./directory-config.js');
      const config = new DirectoryConfiguration();
      
      // Initialize configuration
      await config.initialize();
      console.log('  ✅ Directory configuration initialized');
      
      // Test directory loading
      const starterDirs = config.getAvailableDirectories('starter');
      if (!Array.isArray(starterDirs) || starterDirs.length === 0) {
        throw new Error('No starter directories available');
      }
      console.log(`  ✅ Loaded ${starterDirs.length} starter directories`);
      
      const growthDirs = config.getAvailableDirectories('growth');
      console.log(`  ✅ Loaded ${growthDirs.length} growth directories`);
      
      const professionalDirs = config.getAvailableDirectories('professional');
      console.log(`  ✅ Loaded ${professionalDirs.length} professional directories`);
      
      // Test field selectors
      const emailSelectors = config.getFieldSelectors('email');
      if (!Array.isArray(emailSelectors) || emailSelectors.length === 0) {
        throw new Error('No email field selectors found');
      }
      console.log(`  ✅ Email field selectors: ${emailSelectors.length}`);
      
      const businessSelectors = config.getFieldSelectors('businessName');
      if (!Array.isArray(businessSelectors) || businessSelectors.length === 0) {
        throw new Error('No business name field selectors found');
      }
      console.log(`  ✅ Business name field selectors: ${businessSelectors.length}`);
      
      this.testResults.push({ test: 'Directory Configuration', status: 'PASS' });
      
    } catch (error) {
      console.log(`  ❌ Directory configuration failed: ${error.message}`);
      this.testResults.push({ test: 'Directory Configuration', status: 'FAIL', error: error.message });
    }
    
    console.log('');
  }

  async testMockJobProcessing() {
    console.log('⚙️  Testing Mock Job Processing');
    console.log('===============================');

    try {
      // Create mock job data
      const mockJob = {
        id: 'test-job-123',
        customerId: 'test-customer-456',
        packageType: 'starter',
        directoryLimit: 50,
        businessData: {
          businessName: 'Test Company LLC',
          email: 'test@testcompany.com',
          phone: '555-0123',
          website: 'https://testcompany.com',
          description: 'A test company for validation purposes'
        }
      };
      
      console.log('  ✅ Mock job data created');
      
      // Test field mapping with mock data
      const DirectoryBoltWorker = require('./worker.js');
      const worker = new DirectoryBoltWorker();
      
      // Mock element for field mapping test
      const mockElement = {
        getAttribute: async (attr) => {
          const attributes = {
            'name': 'business_name',
            'id': 'company-name-input',
            'type': 'text',
            'placeholder': 'Enter your business name'
          };
          return attributes[attr] || null;
        }
      };
      
      const mapping = await worker.fieldMapper.mapToBusinessField(mockElement, mockJob.businessData);
      
      if (!mapping || !mapping.suggestedField) {
        throw new Error('Field mapping failed to return suggested field');
      }
      
      console.log(`  ✅ Field mapping successful: ${mapping.suggestedField} -> ${mapping.value}`);
      
      // Test cache buster
      const originalUrl = 'https://example.com/submit';
      const bustedUrl = worker.addCacheBuster(originalUrl);
      
      if (!bustedUrl.includes('_cb=') || !bustedUrl.includes('_r=')) {
        throw new Error('Cache buster not working correctly');
      }
      
      console.log('  ✅ Cache buster working correctly');
      
      // Test CSS to XPath conversion
      const xpath = worker.fallbackEngine.cssToXPath('#test-id');
      if (xpath !== `//*[@id='test-id']`) {
        throw new Error('CSS to XPath conversion failed');
      }
      
      console.log('  ✅ CSS to XPath conversion working');
      
      this.testResults.push({ test: 'Mock Job Processing', status: 'PASS' });
      
    } catch (error) {
      console.log(`  ❌ Mock job processing failed: ${error.message}`);
      this.testResults.push({ test: 'Mock Job Processing', status: 'FAIL', error: error.message });
    }
    
    console.log('');
  }

  async testAPICommunication() {
    console.log('🌐 Testing API Communication');
    console.log('============================');

    try {
      const axios = require('axios');
      const baseUrl = process.env.ORCHESTRATOR_URL;
      const authToken = process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN;
      
      if (!baseUrl || !authToken) {
        console.log('  ⚠️  Skipping API tests - missing configuration');
        this.testResults.push({ test: 'API Communication', status: 'SKIP', error: 'Missing configuration' });
        return;
      }
      
      // Test health endpoint
      try {
        const response = await axios.get(`${baseUrl}/health`, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        if (response.status < 500) {
          console.log(`  ✅ Health endpoint reachable (${response.status})`);
        } else {
          console.log(`  ⚠️  Health endpoint returned server error: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Health endpoint not reachable: ${error.message}`);
      }
      
      // Test jobs endpoint (without actually claiming a job)
      try {
        const response = await axios.get(`${baseUrl}/jobs/next`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-Worker-ID': 'test-worker',
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: () => true
        });
        
        if (response.status === 401) {
          console.log('  ❌ Authentication failed - check AUTOBOLT_API_KEY');
          this.testResults.push({ test: 'API Communication', status: 'FAIL', error: 'Authentication failed' });
        } else if (response.status === 200 || response.status === 204) {
          console.log('  ✅ Jobs endpoint accessible and authenticated');
          this.testResults.push({ test: 'API Communication', status: 'PASS' });
        } else {
          console.log(`  ⚠️  Unexpected response from jobs endpoint: ${response.status}`);
          this.testResults.push({ test: 'API Communication', status: 'WARN', error: `Status: ${response.status}` });
        }
      } catch (error) {
        console.log(`  ❌ Jobs endpoint test failed: ${error.message}`);
        this.testResults.push({ test: 'API Communication', status: 'FAIL', error: error.message });
      }
      
    } catch (error) {
      console.log(`  ❌ API communication test failed: ${error.message}`);
      this.testResults.push({ test: 'API Communication', status: 'FAIL', error: error.message });
    }
    
    console.log('');
  }

  printFinalResults() {
    const duration = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log('📊 End-to-End Test Results');
    console.log('==========================');
    console.log(`Duration: ${duration}ms`);
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Warnings: ${warnings} ⚠️`);
    console.log(`Skipped: ${skipped} ⏭️`);
    console.log('');
    
    // Show detailed results
    this.testResults.forEach(result => {
      const icon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️',
        'SKIP': '⏭️'
      }[result.status];
      
      console.log(`${icon} ${result.test}`);
      if (result.error) {
        console.log(`   ${result.error}`);
      }
    });
    
    console.log('');
    
    // Overall assessment
    if (failed === 0 && warnings === 0) {
      console.log('🎉 ALL END-TO-END TESTS PASSED!');
      console.log('Worker is ready for production deployment.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Start worker: npm start');
      console.log('2. Monitor logs for proper operation');
      console.log('3. Check system status: curl ${ORCHESTRATOR_URL}/autobolt-status');
    } else if (failed === 0) {
      console.log('✅ End-to-end tests completed with warnings');
      console.log('Worker should function correctly, review warnings above.');
    } else {
      console.log('❌ End-to-end tests failed');
      console.log('Please resolve failed tests before deploying to production.');
    }
    
    console.log('');
    console.log('For detailed validation, run: node comprehensive-validation-test.js');
  }
}

// Run end-to-end test
if (require.main === module) {
  const tester = new EndToEndTest();
  tester.runEndToEndTest().catch(error => {
    console.error('End-to-end test failed:', error);
    process.exit(1);
  });
}

module.exports = EndToEndTest;