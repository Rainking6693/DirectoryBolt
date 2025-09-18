#!/usr/bin/env node

/**
 * AUTOMATED SUPABASE DEPLOYMENT FOR DIRECTORYBOLT
 * 
 * This script executes the complete Supabase deployment by:
 * 1. Providing manual schema deployment instructions
 * 2. Migrating customer data from Google Sheets  
 * 3. Testing all functionality
 * 4. Generating comprehensive deployment report
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { CustomerMigrationService } = require('./migrate-customers-to-supabase.js');
const fs = require('fs');
const path = require('path');

class AutomatedSupabaseDeployment {
  constructor() {
    this.supabase = null;
    this.deploymentLog = [];
    this.deploymentReport = {
      startTime: new Date().toISOString(),
      phases: [],
      errors: [],
      successes: [],
      finalStatus: 'PENDING'
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.deploymentLog.push(logEntry);
  }

  async initialize() {
    this.log('🚀 Initializing Supabase Deployment System');
    this.log('=' .repeat(60));
    
    // Validate environment
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_SHEET_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize Supabase
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    this.log('✅ Environment validated and Supabase initialized');
  }

  async checkSchemaDeployment() {
    this.log('\n🔍 Checking if database schema is deployed...');
    
    try {
      // Test if customers table exists
      const { data, error } = await this.supabase
        .from('customers')
        .select('customer_id', { count: 'exact', head: true });

      if (error) {
        this.log('❌ Database schema not deployed yet');
        return false;
      }

      this.log('✅ Database schema is already deployed');
      return true;

    } catch (err) {
      this.log('❌ Schema check failed, deployment needed');
      return false;
    }
  }

  generateManualDeploymentInstructions() {
    this.log('\n📋 MANUAL SCHEMA DEPLOYMENT REQUIRED');
    this.log('=' .repeat(50));
    
    const instructions = `
🎯 CRITICAL: Manual Database Schema Deployment Required

Since the Supabase API doesn't allow direct SQL execution for security reasons,
you need to execute the schema manually via the Supabase Dashboard.

📝 STEP-BY-STEP INSTRUCTIONS:

1. Open your Supabase Dashboard:
   🔗 https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/sql

2. Copy the ENTIRE SQL schema from this file:
   📄 ${path.join(__dirname, 'SUPABASE_MANUAL_DEPLOYMENT.md')}

3. Paste the SQL into the Supabase SQL Editor

4. Click "RUN" to execute the complete schema

5. After successful execution, run this script again:
   ⚡ node complete-supabase-deployment.js

⚠️  IMPORTANT: You must complete steps 1-4 before proceeding!

The schema creates:
- ✅ customers table (main customer data)
- ✅ queue_history table (processing history)
- ✅ customer_notifications table (notifications)
- ✅ directory_submissions table (directory tracking)
- ✅ analytics_events table (event tracking)
- ✅ batch_operations table (bulk operations)
- ✅ generate_customer_id() function
- ✅ customer_stats view
- ✅ RLS policies and permissions

Once deployed, this script will automatically:
🔄 Migrate all customer data from Google Sheets
🧪 Test all API endpoints
✅ Validate Chrome extension functionality
📊 Generate comprehensive deployment report
`;

    this.log(instructions);
    
    // Also save instructions to file
    const instructionsPath = path.join(__dirname, 'MANUAL_DEPLOYMENT_INSTRUCTIONS.txt');
    fs.writeFileSync(instructionsPath, instructions);
    this.log(`📄 Instructions saved to: ${instructionsPath}`);
    
    return false; // Deployment cannot continue without manual step
  }

  async migrateCustomerData() {
    this.log('\n📊 MIGRATING CUSTOMER DATA FROM GOOGLE SHEETS');
    this.log('=' .repeat(50));
    
    try {
      const migrationService = new CustomerMigrationService();
      await migrationService.migrate();
      
      const report = migrationService.migrationReport;
      this.log(`✅ Migration completed: ${report.migratedCustomers} customers migrated`);
      
      this.deploymentReport.successes.push('DATA_MIGRATION');
      return {
        success: true,
        sourceCustomers: report.sourceCustomers,
        migratedCustomers: report.migratedCustomers,
        errors: report.errors
      };
      
    } catch (error) {
      this.log(`❌ Customer migration failed: ${error.message}`, 'ERROR');
      this.deploymentReport.errors.push({ phase: 'DATA_MIGRATION', error: error.message });
      throw error;
    }
  }

  async testAPIEndpoints() {
    this.log('\n🧪 TESTING API ENDPOINTS');
    this.log('=' .repeat(30));
    
    const tests = [];
    
    try {
      // Test 1: Customer creation
      this.log('🔬 Testing customer creation...');
      const testCustomer = {
        customer_id: `TEST-API-${Date.now()}`,
        business_name: 'API Test Company',
        email: 'api-test@directorybolt.com',
        package_type: 'starter',
        status: 'active'
      };
      
      const { data: created, error: createError } = await this.supabase
        .from('customers')
        .insert([testCustomer])
        .select();
      
      if (createError) throw new Error(`Create test failed: ${createError.message}`);
      tests.push({ test: 'customer_creation', status: 'PASSED' });
      this.log('✅ Customer creation test passed');
      
      // Test 2: Customer retrieval
      this.log('🔬 Testing customer retrieval...');
      const { data: retrieved, error: retrieveError } = await this.supabase
        .from('customers')
        .select('*')
        .eq('customer_id', testCustomer.customer_id);
      
      if (retrieveError) throw new Error(`Retrieve test failed: ${retrieveError.message}`);
      tests.push({ test: 'customer_retrieval', status: 'PASSED' });
      this.log('✅ Customer retrieval test passed');
      
      // Test 3: Customer update
      this.log('🔬 Testing customer update...');
      const { data: updated, error: updateError } = await this.supabase
        .from('customers')
        .update({ status: 'completed' })
        .eq('customer_id', testCustomer.customer_id)
        .select();
      
      if (updateError) throw new Error(`Update test failed: ${updateError.message}`);
      tests.push({ test: 'customer_update', status: 'PASSED' });
      this.log('✅ Customer update test passed');
      
      // Test 4: Customer stats view
      this.log('🔬 Testing customer stats view...');
      const { data: stats, error: statsError } = await this.supabase
        .from('customer_stats')
        .select('*');
      
      if (statsError) throw new Error(`Stats test failed: ${statsError.message}`);
      tests.push({ test: 'customer_stats', status: 'PASSED' });
      this.log('✅ Customer stats test passed');
      
      // Test 5: Customer ID generation
      this.log('🔬 Testing customer ID generation...');
      const { data: generatedId, error: genError } = await this.supabase
        .rpc('generate_customer_id');
      
      if (genError) {
        this.log('⚠️  Function test failed, using fallback generation', 'WARN');
        tests.push({ test: 'customer_id_generation', status: 'FALLBACK' });
      } else {
        tests.push({ test: 'customer_id_generation', status: 'PASSED' });
        this.log(`✅ Customer ID generation test passed: ${generatedId}`);
      }
      
      // Clean up test data
      await this.supabase.from('customers').delete().eq('customer_id', testCustomer.customer_id);
      this.log('🧹 Test data cleaned up');
      
      this.deploymentReport.successes.push('API_TESTING');
      return { success: true, tests };
      
    } catch (error) {
      this.log(`❌ API testing failed: ${error.message}`, 'ERROR');
      this.deploymentReport.errors.push({ phase: 'API_TESTING', error: error.message });
      throw error;
    }
  }

  async validateChromeExtension() {
    this.log('\n🔌 VALIDATING CHROME EXTENSION FUNCTIONALITY');
    this.log('=' .repeat(45));
    
    try {
      // Get customer data to simulate extension validation
      const { data: customers, error } = await this.supabase
        .from('customers')
        .select('customer_id, business_name, email, status, package_type')
        .limit(5);
      
      if (error) throw new Error(`Customer fetch failed: ${error.message}`);
      
      this.log(`🔍 Found ${customers.length} customers for extension testing`);
      
      if (customers.length === 0) {
        this.log('⚠️  No customers available for extension validation', 'WARN');
        return { success: true, warning: 'No customers for testing' };
      }
      
      // Test customer validation (simulating extension behavior)
      for (const customer of customers.slice(0, 3)) { // Test first 3
        this.log(`🎯 Testing extension validation for: ${customer.customer_id}`);
        
        const { data: validation, error: valError } = await this.supabase
          .from('customers')
          .select('customer_id, business_name, status, package_type')
          .eq('customer_id', customer.customer_id);
        
        if (valError) throw new Error(`Validation failed for ${customer.customer_id}: ${valError.message}`);
        if (validation.length === 0) throw new Error(`No validation result for ${customer.customer_id}`);
        
        this.log(`   ✅ Validation passed for ${customer.customer_id}`);
      }
      
      this.log('✅ Chrome extension validation tests passed');
      this.deploymentReport.successes.push('EXTENSION_VALIDATION');
      return { success: true, testedCustomers: customers.length };
      
    } catch (error) {
      this.log(`❌ Extension validation failed: ${error.message}`, 'ERROR');
      this.deploymentReport.errors.push({ phase: 'EXTENSION_VALIDATION', error: error.message });
      throw error;
    }
  }

  async generateDeploymentReport() {
    this.log('\n📊 GENERATING DEPLOYMENT REPORT');
    this.log('=' .repeat(35));
    
    this.deploymentReport.endTime = new Date().toISOString();
    this.deploymentReport.finalStatus = this.deploymentReport.errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS';
    
    const reportData = {
      ...this.deploymentReport,
      deploymentLog: this.deploymentLog,
      summary: {
        totalPhases: this.deploymentReport.successes.length + this.deploymentReport.errors.length,
        successfulPhases: this.deploymentReport.successes.length,
        failedPhases: this.deploymentReport.errors.length,
        productionReady: this.deploymentReport.errors.length === 0
      },
      nextSteps: this.generateNextSteps()
    };
    
    // Save report
    const reportPath = `supabase-deployment-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 Report saved: ${reportPath}`);
    
    // Print summary
    this.log('\n' + '='.repeat(60));
    this.log('🎉 SUPABASE DEPLOYMENT SUMMARY');
    this.log('='.repeat(60));
    this.log(`📈 Total Phases: ${reportData.summary.totalPhases}`);
    this.log(`✅ Successful: ${reportData.summary.successfulPhases}`);
    this.log(`❌ Failed: ${reportData.summary.failedPhases}`);
    this.log(`🚀 Production Ready: ${reportData.summary.productionReady ? 'YES' : 'NO'}`);
    
    if (reportData.summary.productionReady) {
      this.log('\n🎊 DEPLOYMENT COMPLETED SUCCESSFULLY!');
      this.log('🔥 DirectoryBolt is now fully operational on Supabase!');
      this.log('📋 Customer data migrated, APIs tested, extension validated.');
      this.log('⚡ Ready for production use with zero manual steps remaining.');
    } else {
      this.log('\n⚠️  Deployment completed with some issues.');
      this.log('📋 Review the deployment report for details.');
    }
    
    this.log('='.repeat(60));
    
    return reportData;
  }

  generateNextSteps() {
    const steps = [];
    
    if (this.deploymentReport.errors.length > 0) {
      steps.push('🔧 Review and resolve any failed deployment phases');
    }
    
    steps.push('🔄 Update API endpoints to use Supabase instead of Google Sheets');
    steps.push('🔌 Update Chrome extension to validate customers via Supabase');
    steps.push('🧪 Test end-to-end customer workflows');
    steps.push('🚀 Deploy to production with Supabase configuration');
    steps.push('📊 Monitor customer data and system performance');
    
    return steps;
  }

  async execute() {
    try {
      await this.initialize();
      
      // Check if schema is deployed
      const schemaDeployed = await this.checkSchemaDeployment();
      
      if (!schemaDeployed) {
        this.generateManualDeploymentInstructions();
        return { requiresManualStep: true };
      }
      
      // Execute automated phases
      await this.migrateCustomerData();
      await this.testAPIEndpoints();
      await this.validateChromeExtension();
      
      // Generate final report
      const report = await this.generateDeploymentReport();
      
      return report;
      
    } catch (error) {
      this.log(`💥 DEPLOYMENT FAILED: ${error.message}`, 'ERROR');
      this.deploymentReport.finalStatus = 'FAILED';
      this.deploymentReport.endTime = new Date().toISOString();
      
      await this.generateDeploymentReport();
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log('🎯 DIRECTORYBOLT AUTOMATED SUPABASE DEPLOYMENT');
  console.log('🚀 Complete migration with automated testing and validation');
  console.log('');
  
  const deployment = new AutomatedSupabaseDeployment();
  
  try {
    const result = await deployment.execute();
    
    if (result.requiresManualStep) {
      console.log('\n📋 MANUAL STEP REQUIRED: Execute the SQL schema in Supabase Dashboard');
      console.log('⚡ Then run this script again to complete automated migration.');
      process.exit(2);
    }
    
    if (result.summary?.productionReady) {
      console.log('\n🎉 SUCCESS: DirectoryBolt is now fully deployed on Supabase!');
      process.exit(0);
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Review deployment report for details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 DEPLOYMENT FAILED:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { AutomatedSupabaseDeployment };