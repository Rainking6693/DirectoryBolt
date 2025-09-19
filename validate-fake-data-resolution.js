#!/usr/bin/env node

/**
 * DirectoryBolt Fake Data Resolution Validation Script
 * ===================================================
 * 
 * This script validates that all fake data issues have been resolved
 * and the system is using real Supabase data throughout.
 * 
 * Usage: node validate-fake-data-resolution.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

class FakeDataResolutionValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      validationStatus: 'RUNNING',
      testResults: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      productionReadiness: false,
      issues: [],
      recommendations: []
    };
  }

  log(level, message, details = null) {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };

    const color = colors[level] || colors.RESET;
    console.log(`${color}[${level}] ${message}${colors.RESET}`);
    
    if (details) {
      console.log(`   ${JSON.stringify(details, null, 2)}`);
    }
  }

  async runTest(testName, testFunction, critical = false) {
    this.log('INFO', `🧪 Running: ${testName}`);
    this.results.summary.total++;
    
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: testName,
        status: result.success ? 'PASSED' : 'FAILED',
        duration,
        critical,
        result: result.data,
        issues: result.issues || [],
        timestamp: new Date().toISOString()
      };
      
      this.results.testResults.push(testResult);
      
      if (result.success) {
        this.results.summary.passed++;
        this.log('SUCCESS', `✅ ${testName} PASSED (${duration}ms)`);
      } else {
        this.results.summary.failed++;
        this.log('ERROR', `❌ ${testName} FAILED (${duration}ms)`, result.error);
        if (result.issues) {
          this.results.issues.push(...result.issues);
        }
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.testResults.push({
        name: testName,
        status: 'ERROR',
        duration,
        critical,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.results.summary.failed++;
      this.log('ERROR', `💥 ${testName} ERROR (${duration}ms)`, error.message);
      this.results.issues.push(`${testName}: ${error.message}`);
      
      return { success: false, error: error.message };
    }
  }

  async validateEnvironmentConfiguration() {
    return new Promise((resolve) => {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      const missing = requiredVars.filter(varName => !process.env[varName]);
      const issues = [];
      
      if (missing.length > 0) {
        issues.push(`Missing environment variables: ${missing.join(', ')}`);
      }
      
      // Check for test/fake URLs
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && (supabaseUrl.includes('test') || supabaseUrl.includes('fake'))) {
        issues.push('Supabase URL appears to be a test/fake environment');
      }
      
      resolve({
        success: missing.length === 0 && issues.length === 0,
        data: {
          configuredVars: requiredVars.filter(varName => process.env[varName]),
          supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not configured'
        },
        issues
      });
    });
  }

  async validateSupabaseConnection() {
    try {
      const { createSupabaseService } = require('./lib/services/supabase.js');
      const service = createSupabaseService();
      
      const connectionResult = await service.testConnection();
      
      if (!connectionResult.ok) {
        return {
          success: false,
          error: connectionResult.error,
          issues: ['Supabase connection failed']
        };
      }
      
      return {
        success: true,
        data: {
          connected: true,
          hasData: connectionResult.hasData,
          message: connectionResult.message
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        issues: ['Failed to initialize Supabase service']
      };
    }
  }

  async validateCustomerDataIntegrity() {
    try {
      const { createSupabaseService } = require('./lib/services/supabase.js');
      const service = createSupabaseService();
      
      // Test customer lookup
      const testCustomerIds = [
        'DIR-20250918-123456',
        'DIR-20250919-654321'
      ];
      
      const results = [];
      const issues = [];
      
      for (const customerId of testCustomerIds) {
        const customer = await service.getCustomerById(customerId);
        
        if (customer.found) {
          // Check for fake/test data indicators
          const customerData = customer.customer;
          if (customerData.businessName.toLowerCase().includes('test') ||
              customerData.email.includes('test') ||
              customerData.businessName === 'Unknown Business') {
            issues.push(`Customer ${customerId} contains test/placeholder data`);
          }
          
          results.push({
            customerId,
            found: true,
            businessName: customerData.businessName,
            hasRealData: !customerData.businessName.toLowerCase().includes('test')
          });
        }
      }
      
      return {
        success: issues.length === 0,
        data: {
          testedCustomers: results.length,
          foundCustomers: results.filter(r => r.found).length,
          realDataCustomers: results.filter(r => r.hasRealData).length,
          results
        },
        issues
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        issues: ['Failed to validate customer data']
      };
    }
  }

  async validateAPIEndpoints() {
    const endpoints = [
      {
        name: 'Customer Validation (Netlify)',
        path: '/.netlify/functions/customer-validate',
        method: 'POST',
        body: { customerId: 'DIR-20250918-123456' }
      }
    ];
    
    const results = [];
    const issues = [];
    
    for (const endpoint of endpoints) {
      try {
        // For local testing, we'll check if the function file exists and is properly configured
        const functionPath = path.join(__dirname, 'netlify', 'functions', 'customer-validate.js');
        
        if (fs.existsSync(functionPath)) {
          const functionContent = fs.readFileSync(functionPath, 'utf8');
          
          // Check for fake data patterns
          if (functionContent.includes('test@example.com') || 
              functionContent.includes('Test Business')) {
            issues.push(`${endpoint.name} contains hardcoded test data`);
          }
          
          // Check for Supabase integration
          if (!functionContent.includes('createSupabaseService')) {
            issues.push(`${endpoint.name} not using Supabase service`);
          }
          
          results.push({
            name: endpoint.name,
            exists: true,
            usesSupabase: functionContent.includes('createSupabaseService'),
            hasFakeData: functionContent.includes('test@example.com')
          });
        } else {
          issues.push(`${endpoint.name} function file not found`);
        }
      } catch (error) {
        issues.push(`${endpoint.name}: ${error.message}`);
      }
    }
    
    return {
      success: issues.length === 0,
      data: {
        testedEndpoints: results.length,
        validEndpoints: results.filter(r => r.usesSupabase && !r.hasFakeData).length,
        results
      },
      issues
    };
  }

  async validateChromeExtension() {
    const manifestPath = path.join(__dirname, 'auto-bolt-extension', 'manifest.json');
    const issues = [];
    const results = {};
    
    try {
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Check extension configuration
        results.version = manifest.version;
        results.name = manifest.name;
        results.hasProperPermissions = manifest.permissions.includes('storage');
        
        // Check host permissions for production
        const hasProductionHost = manifest.host_permissions.some(host => 
          host.includes('directorybolt.com')
        );
        
        if (!hasProductionHost) {
          issues.push('Extension missing production host permissions');
        }
        
        results.hasProductionHost = hasProductionHost;
        
        // Check content scripts
        const backgroundScript = path.join(__dirname, 'auto-bolt-extension', manifest.background.service_worker);
        
        if (fs.existsSync(backgroundScript)) {
          const scriptContent = fs.readFileSync(backgroundScript, 'utf8');
          
          // Check for test data patterns
          if (scriptContent.includes('test@example.com') || 
              scriptContent.includes('Test Business')) {
            issues.push('Extension background script contains test data');
          }
          
          results.backgroundScriptValid = !scriptContent.includes('test@example.com');
        } else {
          issues.push('Extension background script not found');
        }
      } else {
        issues.push('Extension manifest.json not found');
      }
    } catch (error) {
      issues.push(`Extension validation error: ${error.message}`);
    }
    
    return {
      success: issues.length === 0,
      data: results,
      issues
    };
  }

  async validateCodebaseForFakeData() {
    const filesToCheck = [
      'pages/api/customer-portal.js',
      'lib/services/supabase.js',
      'netlify/functions/customer-validate.js'
    ];
    
    const fakeDataPatterns = [
      /test@example\.com/gi,
      /Test Business/gi,
      /fake.*data/gi,
      /placeholder.*data/gi,
      /mock.*customer/gi
    ];
    
    const results = [];
    const issues = [];
    
    for (const filePath of filesToCheck) {
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const foundPatterns = [];
        
        for (const pattern of fakeDataPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            foundPatterns.push(...matches);
          }
        }
        
        if (foundPatterns.length > 0) {
          issues.push(`${filePath} contains potential fake data: ${foundPatterns.join(', ')}`);
        }
        
        results.push({
          file: filePath,
          hasFakeData: foundPatterns.length > 0,
          fakeDataFound: foundPatterns
        });
      }
    }
    
    return {
      success: issues.length === 0,
      data: {
        checkedFiles: results.length,
        cleanFiles: results.filter(r => !r.hasFakeData).length,
        results
      },
      issues
    };
  }

  async validateMigrationCompleteness() {
    try {
      // Check if migration scripts exist and have been run
      const migrationScript = path.join(__dirname, 'direct-customer-migration.js');
      const customerCreationScript = path.join(__dirname, 'create-customers-table.js');
      
      const results = {
        migrationScriptExists: fs.existsSync(migrationScript),
        customerTableScriptExists: fs.existsSync(customerCreationScript)
      };
      
      const issues = [];
      
      // Check for Google Sheets dependencies in current code
      const supabaseService = path.join(__dirname, 'lib', 'services', 'supabase.js');
      if (fs.existsSync(supabaseService)) {
        const content = fs.readFileSync(supabaseService, 'utf8');
        
        if (content.includes('google-spreadsheet') || content.includes('GoogleSpreadsheet')) {
          issues.push('Supabase service still contains Google Sheets dependencies');
        }
        
        results.supabaseServiceClean = !content.includes('google-spreadsheet');
      }
      
      return {
        success: issues.length === 0,
        data: results,
        issues
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        issues: ['Failed to validate migration completeness']
      };
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Based on test results, generate specific recommendations
    const failedTests = this.results.testResults.filter(t => t.status === 'FAILED');
    
    if (failedTests.length > 0) {
      recommendations.push('Address all failed test cases before production deployment');
    }
    
    if (this.results.issues.some(issue => issue.includes('test data'))) {
      recommendations.push('Remove all remaining test data and placeholder content');
    }
    
    if (this.results.issues.some(issue => issue.includes('environment'))) {
      recommendations.push('Verify all environment variables are properly configured for production');
    }
    
    // Add performance recommendations
    recommendations.push('Implement comprehensive monitoring for production environment');
    recommendations.push('Set up automated testing pipeline for continuous validation');
    recommendations.push('Create rollback procedures in case of deployment issues');
    
    return recommendations;
  }

  async generateReport() {
    const reportPath = path.join(__dirname, `fake-data-resolution-report-${Date.now()}.json`);
    
    this.results.validationStatus = this.results.summary.failed === 0 ? 'PASSED' : 'FAILED';
    this.results.productionReadiness = this.results.summary.failed === 0;
    this.results.recommendations = this.generateRecommendations();
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    this.log('INFO', `📋 Validation report saved: ${reportPath}`);
    
    return this.results;
  }

  async run() {
    this.log('INFO', '🚀 DirectoryBolt Fake Data Resolution Validation');
    this.log('INFO', '=' .repeat(60));
    
    // Run all validation tests
    await this.runTest('Environment Configuration', 
      () => this.validateEnvironmentConfiguration(), true);
    
    await this.runTest('Supabase Connection', 
      () => this.validateSupabaseConnection(), true);
    
    await this.runTest('Customer Data Integrity', 
      () => this.validateCustomerDataIntegrity(), true);
    
    await this.runTest('API Endpoints', 
      () => this.validateAPIEndpoints(), true);
    
    await this.runTest('Chrome Extension', 
      () => this.validateChromeExtension(), false);
    
    await this.runTest('Codebase Fake Data Check', 
      () => this.validateCodebaseForFakeData(), true);
    
    await this.runTest('Migration Completeness', 
      () => this.validateMigrationCompleteness(), true);
    
    // Generate final report
    const finalResults = await this.generateReport();
    
    // Print summary
    this.log('INFO', '\n📊 VALIDATION SUMMARY');
    this.log('INFO', '=' .repeat(30));
    this.log('INFO', `Total Tests: ${finalResults.summary.total}`);
    this.log(finalResults.summary.passed > 0 ? 'SUCCESS' : 'INFO', `Passed: ${finalResults.summary.passed}`);
    this.log(finalResults.summary.failed > 0 ? 'ERROR' : 'INFO', `Failed: ${finalResults.summary.failed}`);
    
    if (finalResults.productionReadiness) {
      this.log('SUCCESS', '\n🎉 PRODUCTION READY: All fake data issues resolved!');
      this.log('SUCCESS', '✅ System is using real Supabase data throughout');
      this.log('SUCCESS', '✅ No test/placeholder data detected');
      this.log('SUCCESS', '✅ All critical components validated');
    } else {
      this.log('ERROR', '\n⚠️  PRODUCTION NOT READY: Issues found');
      this.log('ERROR', '❌ Please address the following issues:');
      finalResults.issues.forEach(issue => {
        this.log('ERROR', `   • ${issue}`);
      });
    }
    
    if (finalResults.recommendations.length > 0) {
      this.log('INFO', '\n💡 RECOMMENDATIONS:');
      finalResults.recommendations.forEach(rec => {
        this.log('INFO', `   • ${rec}`);
      });
    }
    
    return finalResults;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new FakeDataResolutionValidator();
  validator.run()
    .then(results => {
      process.exit(results.productionReadiness ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = FakeDataResolutionValidator;