#!/usr/bin/env node

/**
 * Quick Connection Test for DirectoryBolt Worker
 * Tests basic connectivity without requiring all dependencies
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();

class QuickConnectionTest {
  constructor() {
    this.results = [];
  }

  async runTests() {
    console.log('🔍 DirectoryBolt Worker Quick Connection Test');
    console.log('=============================================');
    console.log('');

    // Test 1: Environment Variables
    this.testEnvironmentVariables();
    
    // Test 2: File Structure
    this.testFileStructure();
    
    // Test 3: API Connectivity
    await this.testAPIConnectivity();
    
    // Test 4: Supabase URL
    await this.testSupabaseURL();
    
    this.printResults();
  }

  testEnvironmentVariables() {
    console.log('📋 Testing Environment Variables...');
    
    const required = [
      'AUTOBOLT_API_KEY',
      'WORKER_AUTH_TOKEN',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ORCHESTRATOR_URL'
    ];

    let allPresent = true;
    const missing = [];

    required.forEach(key => {
      if (!process.env[key]) {
        allPresent = false;
        missing.push(key);
      }
    });

    if (allPresent) {
      console.log('  ✅ All required environment variables present');
      this.results.push({ test: 'Environment Variables', status: 'PASS' });
    } else {
      console.log(`  ❌ Missing environment variables: ${missing.join(', ')}`);
      this.results.push({ test: 'Environment Variables', status: 'FAIL', details: `Missing: ${missing.join(', ')}` });
    }

    // Check token format
    const token = process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN;
    if (token && token.length >= 32) {
      console.log('  ✅ Authentication token format looks valid');
    } else {
      console.log('  ⚠️  Authentication token may be invalid or too short');
    }

    console.log('');
  }

  testFileStructure() {
    console.log('📁 Testing File Structure...');
    
    const requiredFiles = [
      'worker.js',
      'directory-config.js',
      'package.json',
      '.env'
    ];

    let allPresent = true;
    const missing = [];

    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        allPresent = false;
        missing.push(file);
      }
    });

    if (allPresent) {
      console.log('  ✅ All required files present');
      this.results.push({ test: 'File Structure', status: 'PASS' });
    } else {
      console.log(`  ❌ Missing files: ${missing.join(', ')}`);
      this.results.push({ test: 'File Structure', status: 'FAIL', details: `Missing: ${missing.join(', ')}` });
    }

    // Check package.json dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      const requiredDeps = ['playwright', 'axios', 'dotenv', '@supabase/supabase-js'];
      const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
      
      if (missingDeps.length === 0) {
        console.log('  ✅ All required dependencies listed in package.json');
      } else {
        console.log(`  ⚠️  Missing dependencies in package.json: ${missingDeps.join(', ')}`);
      }
    } catch (error) {
      console.log('  ❌ Could not read package.json');
    }

    console.log('');
  }

  async testAPIConnectivity() {
    console.log('🌐 Testing API Connectivity...');
    
    const orchestratorUrl = process.env.ORCHESTRATOR_URL;
    if (!orchestratorUrl) {
      console.log('  ❌ ORCHESTRATOR_URL not set');
      this.results.push({ test: 'API Connectivity', status: 'FAIL', details: 'ORCHESTRATOR_URL not set' });
      return;
    }

    try {
      const url = new URL(orchestratorUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const testUrl = `${orchestratorUrl}/health`;
      
      await new Promise((resolve, reject) => {
        const req = client.get(testUrl, { timeout: 10000 }, (res) => {
          if (res.statusCode < 500) {
            console.log(`  ✅ API endpoint reachable (status: ${res.statusCode})`);
            this.results.push({ test: 'API Connectivity', status: 'PASS', details: `Status: ${res.statusCode}` });
          } else {
            console.log(`  ⚠️  API endpoint returned server error: ${res.statusCode}`);
            this.results.push({ test: 'API Connectivity', status: 'WARN', details: `Server error: ${res.statusCode}` });
          }
          resolve();
        });

        req.on('error', (error) => {
          console.log(`  ❌ API endpoint not reachable: ${error.message}`);
          this.results.push({ test: 'API Connectivity', status: 'FAIL', details: error.message });
          resolve();
        });

        req.on('timeout', () => {
          console.log('  ❌ API endpoint timeout');
          this.results.push({ test: 'API Connectivity', status: 'FAIL', details: 'Timeout' });
          req.destroy();
          resolve();
        });
      });

    } catch (error) {
      console.log(`  ❌ Invalid ORCHESTRATOR_URL: ${error.message}`);
      this.results.push({ test: 'API Connectivity', status: 'FAIL', details: `Invalid URL: ${error.message}` });
    }

    console.log('');
  }

  async testSupabaseURL() {
    console.log('🗄️  Testing Supabase URL...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.log('  ❌ SUPABASE_URL not set');
      this.results.push({ test: 'Supabase URL', status: 'FAIL', details: 'SUPABASE_URL not set' });
      return;
    }

    try {
      const url = new URL(supabaseUrl);
      
      if (!url.hostname.includes('supabase.co')) {
        console.log('  ⚠️  URL doesn\'t appear to be a Supabase URL');
        this.results.push({ test: 'Supabase URL', status: 'WARN', details: 'Not a supabase.co URL' });
        return;
      }

      // Test basic connectivity
      await new Promise((resolve, reject) => {
        const req = https.get(`${supabaseUrl}/rest/v1/`, { timeout: 10000 }, (res) => {
          if (res.statusCode === 401 || res.statusCode === 200) {
            console.log('  ✅ Supabase endpoint reachable');
            this.results.push({ test: 'Supabase URL', status: 'PASS' });
          } else {
            console.log(`  ⚠️  Unexpected response from Supabase: ${res.statusCode}`);
            this.results.push({ test: 'Supabase URL', status: 'WARN', details: `Status: ${res.statusCode}` });
          }
          resolve();
        });

        req.on('error', (error) => {
          console.log(`  ❌ Supabase endpoint not reachable: ${error.message}`);
          this.results.push({ test: 'Supabase URL', status: 'FAIL', details: error.message });
          resolve();
        });

        req.on('timeout', () => {
          console.log('  ❌ Supabase endpoint timeout');
          this.results.push({ test: 'Supabase URL', status: 'FAIL', details: 'Timeout' });
          req.destroy();
          resolve();
        });
      });

    } catch (error) {
      console.log(`  ❌ Invalid SUPABASE_URL: ${error.message}`);
      this.results.push({ test: 'Supabase URL', status: 'FAIL', details: `Invalid URL: ${error.message}` });
    }

    console.log('');
  }

  printResults() {
    console.log('📊 Test Results Summary');
    console.log('=======================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Warnings: ${warnings} ⚠️`);
    console.log('');

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  - ${result.test}: ${result.details || 'Failed'}`);
      });
      console.log('');
    }

    if (warnings > 0) {
      console.log('⚠️  Warnings:');
      this.results.filter(r => r.status === 'WARN').forEach(result => {
        console.log(`  - ${result.test}: ${result.details || 'Warning'}`);
      });
      console.log('');
    }

    // Overall assessment
    if (failed === 0 && warnings === 0) {
      console.log('🎉 All basic connectivity tests passed!');
      console.log('Next steps:');
      console.log('1. Install dependencies: npm install');
      console.log('2. Run full validation: node comprehensive-validation-test.js');
      console.log('3. Start worker: npm start');
    } else if (failed === 0) {
      console.log('✅ Basic connectivity looks good with some warnings');
      console.log('Review warnings above and proceed with full validation');
    } else {
      console.log('❌ Critical connectivity issues found');
      console.log('Please resolve failed tests before proceeding');
    }

    console.log('');
    console.log('For detailed testing, run: node comprehensive-validation-test.js');
    console.log('For worker testing, run: npm test');
  }
}

// Run tests
const tester = new QuickConnectionTest();
tester.runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});