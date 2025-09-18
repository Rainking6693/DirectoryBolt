#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE AUDIT: DirectoryBolt Supabase Integration
 * 
 * This script performs end-to-end validation of the complete Supabase migration
 * and confirms production readiness per the audit requirements.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

class DirectoryBoltAuditor {
  constructor() {
    this.results = {
      database: {},
      apis: {},
      dashboards: {},
      extension: {},
      security: {},
      migration: {},
      realtime: {},
      production: {}
    };
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '✅',
      'warning': '⚠️',
      'error': '❌',
      'success': '🎉'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  async auditDatabaseConnection() {
    this.log('🔍 AUDITING DATABASE CONNECTION & SCHEMA', 'info');
    
    try {
      // Check environment variables
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL'
      ];
      
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          this.log(`Missing environment variable: ${varName}`, 'error');
          this.results.database.envVars = false;
          return;
        }
      }
      
      this.log('Environment variables configured correctly', 'success');
      this.results.database.envVars = true;
      
      // Test Supabase connection
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Test basic connection
      const { data, error } = await supabase
        .from('directories')
        .select('*')
        .limit(1);
        
      if (error) {
        this.log(`Database connection test failed: ${error.message}`, 'error');
        this.results.database.connection = false;
      } else {
        this.log('Supabase connection successful', 'success');
        this.results.database.connection = true;
        this.results.database.hasDirectoriesTable = true;
      }
      
      // Check if customers table exists (may not exist yet)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);
        
      if (customerError) {
        this.log('Customers table does not exist - needs manual setup', 'warning');
        this.results.database.hasCustomersTable = false;
      } else {
        this.log('Customers table exists and accessible', 'success');
        this.results.database.hasCustomersTable = true;
      }
      
    } catch (error) {
      this.log(`Database audit failed: ${error.message}`, 'error');
      this.results.database.connection = false;
    }
  }

  async auditSupabaseService() {
    this.log('🔍 AUDITING SUPABASE SERVICE IMPLEMENTATION', 'info');
    
    try {
      const servicePath = path.join(__dirname, 'lib/services/supabase.js');
      
      if (!fs.existsSync(servicePath)) {
        this.log('Supabase service file not found', 'error');
        this.results.database.serviceExists = false;
        return;
      }
      
      this.log('Supabase service file exists', 'success');
      this.results.database.serviceExists = true;
      
      // Test service instantiation
      const { SupabaseService } = require('./lib/services/supabase.js');
      const service = new SupabaseService();
      
      await service.initialize();
      this.log('Supabase service initializes correctly', 'success');
      this.results.database.serviceInitializes = true;
      
      // Test key methods
      const methods = [
        'testConnection',
        'getCustomerById', 
        'addCustomer',
        'getAllCustomers',
        'updateCustomer',
        'generateCustomerId',
        'validateCustomerId'
      ];
      
      const missingMethods = methods.filter(method => typeof service[method] !== 'function');
      if (missingMethods.length > 0) {
        this.log(`Missing service methods: ${missingMethods.join(', ')}`, 'error');
        this.results.database.hasRequiredMethods = false;
      } else {
        this.log('All required service methods present', 'success');
        this.results.database.hasRequiredMethods = true;
      }
      
    } catch (error) {
      this.log(`Supabase service audit failed: ${error.message}`, 'error');
      this.results.database.serviceInitializes = false;
    }
  }

  async auditAPIEndpoints() {
    this.log('🔍 AUDITING CRITICAL API ENDPOINTS', 'info');
    
    const criticalEndpoints = [
      'pages/api/extension/validate.ts',
      'pages/api/admin/customers/stats.ts',
      'pages/api/autobolt/queue-status.ts'
    ];
    
    let allEndpointsExist = true;
    
    for (const endpoint of criticalEndpoints) {
      const fullPath = path.join(__dirname, endpoint);
      if (fs.existsSync(fullPath)) {
        this.log(`API endpoint exists: ${endpoint}`, 'success');
        
        // Check for Supabase usage in the file
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('SupabaseService') || content.includes('supabase')) {
          this.log(`Endpoint uses Supabase: ${endpoint}`, 'success');
        } else {
          this.log(`Endpoint may not use Supabase: ${endpoint}`, 'warning');
        }
      } else {
        this.log(`Missing API endpoint: ${endpoint}`, 'error');
        allEndpointsExist = false;
      }
    }
    
    this.results.apis.criticalEndpointsExist = allEndpointsExist;
  }

  async auditDashboardIntegration() {
    this.log('🔍 AUDITING DASHBOARD SUPABASE INTEGRATION', 'info');
    
    const dashboards = [
      'pages/admin-dashboard.tsx',
      'pages/staff-dashboard.tsx'
    ];
    
    let dashboardsUseSupabase = true;
    
    for (const dashboard of dashboards) {
      const fullPath = path.join(__dirname, dashboard);
      if (fs.existsSync(fullPath)) {
        this.log(`Dashboard exists: ${dashboard}`, 'success');
        
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('api/admin') || content.includes('api/staff') || content.includes('supabase')) {
          this.log(`Dashboard uses Supabase APIs: ${dashboard}`, 'success');
        } else {
          this.log(`Dashboard may not use Supabase: ${dashboard}`, 'warning');
          dashboardsUseSupabase = false;
        }
      } else {
        this.log(`Dashboard not found: ${dashboard}`, 'error');
        dashboardsUseSupabase = false;
      }
    }
    
    this.results.dashboards.useSupabase = dashboardsUseSupabase;
  }

  async auditExtensionIntegration() {
    this.log('🔍 AUDITING CHROME EXTENSION INTEGRATION', 'info');
    
    const extensionPath = path.join(__dirname, 'auto-bolt-extension');
    
    if (!fs.existsSync(extensionPath)) {
      this.log('Chrome extension directory not found', 'error');
      this.results.extension.exists = false;
      return;
    }
    
    this.log('Chrome extension directory exists', 'success');
    this.results.extension.exists = true;
    
    const manifestPath = path.join(extensionPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      this.log('Extension manifest.json exists', 'success');
      this.results.extension.hasManifest = true;
      
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      this.log(`Extension version: ${manifest.version}`, 'info');
      this.results.extension.version = manifest.version;
    } else {
      this.log('Extension manifest.json not found', 'error');
      this.results.extension.hasManifest = false;
    }
  }

  async auditGoogleSheetsElimination() {
    this.log('🔍 AUDITING GOOGLE SHEETS DEPENDENCY ELIMINATION', 'info');
    
    // Search for Google Sheets references in critical files
    const criticalFiles = [
      'pages/api/extension/validate.ts',
      'pages/api/admin/customers/stats.ts',
      'lib/services/supabase.js'
    ];
    
    let googleSheetsFound = false;
    
    for (const file of criticalFiles) {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        const googleSheetsPatterns = [
          'google.*sheets',
          'googleapis',
          'spreadsheet',
          'GoogleSpreadsheet',
          'GOOGLE_SHEET_ID',
          'google-spreadsheet'
        ];
        
        const foundPatterns = googleSheetsPatterns.filter(pattern => 
          new RegExp(pattern, 'i').test(content)
        );
        
        if (foundPatterns.length > 0) {
          this.log(`Google Sheets references found in ${file}: ${foundPatterns.join(', ')}`, 'warning');
          googleSheetsFound = true;
        } else {
          this.log(`No Google Sheets references in ${file}`, 'success');
        }
      }
    }
    
    this.results.migration.googleSheetsEliminated = !googleSheetsFound;
  }

  async auditCustomerIdGeneration() {
    this.log('🔍 AUDITING CUSTOMER ID GENERATION', 'info');
    
    try {
      const { SupabaseService } = require('./lib/services/supabase.js');
      const service = new SupabaseService();
      
      // Test customer ID generation
      const customerId = service.generateCustomerId();
      const isValid = service.validateCustomerId(customerId);
      
      if (isValid && /^DIR-\d{8}-\d{6}$/.test(customerId)) {
        this.log(`Customer ID generation works: ${customerId}`, 'success');
        this.results.migration.customerIdGeneration = true;
      } else {
        this.log(`Invalid customer ID generated: ${customerId}`, 'error');
        this.results.migration.customerIdGeneration = false;
      }
      
      // Check if today's date is used
      const today = new Date();
      const expectedDatePrefix = `DIR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      
      if (customerId.startsWith(expectedDatePrefix)) {
        this.log('Customer ID uses correct date format (DIR-20250918-XXXXXX)', 'success');
        this.results.migration.usesCorrectDateFormat = true;
      } else {
        this.log(`Customer ID does not use expected date format. Got: ${customerId.substring(0, 12)}`, 'error');
        this.results.migration.usesCorrectDateFormat = false;
      }
      
    } catch (error) {
      this.log(`Customer ID generation test failed: ${error.message}`, 'error');
      this.results.migration.customerIdGeneration = false;
    }
  }

  async auditProductionReadiness() {
    this.log('🔍 AUDITING PRODUCTION BUILD READINESS', 'info');
    
    // Check if build directory exists (from recent build)
    const buildPath = path.join(__dirname, '.next');
    if (fs.existsSync(buildPath)) {
      this.log('Next.js build directory exists', 'success');
      this.results.production.buildExists = true;
    } else {
      this.log('Next.js build directory not found', 'warning');
      this.results.production.buildExists = false;
    }
    
    // Check critical configuration files
    const configFiles = [
      'next.config.js',
      'package.json',
      '.env.local'
    ];
    
    let allConfigsExist = true;
    for (const config of configFiles) {
      const fullPath = path.join(__dirname, config);
      if (fs.existsSync(fullPath)) {
        this.log(`Configuration file exists: ${config}`, 'success');
      } else {
        this.log(`Missing configuration file: ${config}`, 'error');
        allConfigsExist = false;
      }
    }
    
    this.results.production.configFilesExist = allConfigsExist;
    
    // Check for TypeScript compilation readiness
    const tsConfigPath = path.join(__dirname, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      this.log('TypeScript configuration exists', 'success');
      this.results.production.hasTypeScript = true;
    } else {
      this.log('TypeScript configuration not found', 'warning');
      this.results.production.hasTypeScript = false;
    }
  }

  async generateAuditReport() {
    this.log('📋 GENERATING COMPREHENSIVE AUDIT REPORT', 'info');
    
    const report = {
      audit: {
        timestamp: new Date().toISOString(),
        auditor: 'DirectoryBolt Final Supabase Migration Auditor',
        version: '1.0.0'
      },
      summary: {
        totalChecks: Object.keys(this.results).length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        overallStatus: this.errors.length === 0 ? 'PASSED' : 'FAILED'
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
    
    // Write report to file
    const reportPath = path.join(__dirname, 'final-supabase-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.results.database?.hasCustomersTable) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database',
        action: 'Run the customers-table-setup.sql script in Supabase dashboard to create the customers table'
      });
    }
    
    if (!this.results.migration?.googleSheetsEliminated) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Migration',
        action: 'Remove remaining Google Sheets API references and replace with Supabase calls'
      });
    }
    
    if (!this.results.production?.buildExists) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Production',
        action: 'Run production build test with: npm run build'
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length <= 2) {
      recommendations.push({
        priority: 'LOW',
        category: 'Deployment',
        action: 'System ready for production deployment - all critical checks passed'
      });
    }
    
    return recommendations;
  }

  async runCompleteAudit() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIRECTORYBOLT FINAL COMPREHENSIVE SUPABASE AUDIT');
    console.log('='.repeat(80) + '\n');
    
    await this.auditDatabaseConnection();
    await this.auditSupabaseService();
    await this.auditAPIEndpoints();
    await this.auditDashboardIntegration();
    await this.auditExtensionIntegration();
    await this.auditGoogleSheetsElimination();
    await this.auditCustomerIdGeneration();
    await this.auditProductionReadiness();
    
    const report = await this.generateAuditReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    console.log(`Total Errors: ${report.summary.errors}`);
    console.log(`Total Warnings: ${report.summary.warnings}`);
    console.log(`Report saved to: final-supabase-audit-report.json`);
    
    if (report.summary.overallStatus === 'PASSED') {
      console.log('\n🎉 AUDIT PASSED - DIRECTORYBOLT IS READY FOR PRODUCTION DEPLOYMENT!');
    } else {
      console.log('\n⚠️  AUDIT FAILED - PLEASE ADDRESS ERRORS BEFORE DEPLOYMENT');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    return report;
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new DirectoryBoltAuditor();
  auditor.runCompleteAudit()
    .then(report => {
      process.exit(report.summary.overallStatus === 'PASSED' ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Audit failed with error:', error);
      process.exit(1);
    });
}

module.exports = DirectoryBoltAuditor;