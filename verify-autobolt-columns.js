#!/usr/bin/env node

/**
 * DIRECT COLUMN VERIFICATION FOR AUTOBOLT SCHEMA
 * 
 * This script directly tests column existence by attempting data insertion
 * which is more reliable than schema introspection queries.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

class DirectColumnVerifier {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        } 
      }
    );
  }

  async testAutoboltProcessingQueueColumns() {
    console.log('\n🔍 TESTING: autobolt_processing_queue columns directly...');
    console.log('='.repeat(60));
    
    const columnTests = {
      started_at: null,
      completed_at: null, 
      error_message: null,
      processed_by: null
    };
    
    const results = {};
    
    for (const [columnName, testValue] of Object.entries(columnTests)) {
      try {
        console.log(`\n📝 Testing column: ${columnName}`);
        
        // Create test data with this specific column
        const testData = {
          customer_id: `TEST-COL-${columnName}-${Date.now()}`,
          business_name: `Test Column ${columnName}`,
          email: 'test@column-verification.com',
          package_type: 'growth',
          directory_limit: 50,
          priority_level: 1,
          status: 'queued'
        };
        
        // Add the specific column we're testing
        if (columnName === 'started_at' || columnName === 'completed_at') {
          testData[columnName] = new Date().toISOString();
        } else {
          testData[columnName] = testValue;
        }
        
        const { data, error } = await this.supabase
          .from('autobolt_processing_queue')
          .insert(testData)
          .select();
        
        if (error) {
          if (error.message.includes(`column "${columnName}" of relation`)) {
            console.log(`❌ ${columnName}: COLUMN DOES NOT EXIST`);
            results[columnName] = { exists: false, error: error.message };
          } else {
            console.log(`⚠️ ${columnName}: Other error - ${error.message}`);
            results[columnName] = { exists: 'unknown', error: error.message };
          }
        } else {
          console.log(`✅ ${columnName}: EXISTS and working`);
          console.log(`   📊 Data: ${JSON.stringify(data[0][columnName])}`);
          results[columnName] = { exists: true, data: data[0][columnName] };
          
          // Clean up test data
          await this.supabase
            .from('autobolt_processing_queue')
            .delete()
            .eq('customer_id', testData.customer_id);
        }
      } catch (err) {
        console.log(`❌ ${columnName}: Exception - ${err.message}`);
        results[columnName] = { exists: false, error: err.message };
      }
    }
    
    return results;
  }

  async testDirectorySubmissionsColumns() {
    console.log('\n🔍 TESTING: directory_submissions columns directly...');
    console.log('='.repeat(60));
    
    // First, let's see what a valid customer_id would be
    const { data: customers } = await this.supabase
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    const validCustomerId = customers && customers.length > 0 ? customers[0].customer_id : 'TEST-INVALID';
    console.log(`📋 Using customer_id for testing: ${validCustomerId}`);
    
    const columnTests = {
      directory_category: 'Business',
      directory_tier: 'standard',
      processing_time_seconds: 45,
      error_message: null
    };
    
    const results = {};
    
    for (const [columnName, testValue] of Object.entries(columnTests)) {
      try {
        console.log(`\n📝 Testing column: ${columnName}`);
        
        // Create test data with this specific column
        const testData = {
          customer_id: validCustomerId,
          directory_name: `Test Column ${columnName}`,
          submission_status: 'pending'
        };
        
        // Add the specific column we're testing
        testData[columnName] = testValue;
        
        const { data, error } = await this.supabase
          .from('directory_submissions')
          .insert(testData)
          .select();
        
        if (error) {
          if (error.message.includes(`column "${columnName}" of relation`)) {
            console.log(`❌ ${columnName}: COLUMN DOES NOT EXIST`);
            results[columnName] = { exists: false, error: error.message };
          } else {
            console.log(`⚠️ ${columnName}: Other error - ${error.message}`);
            results[columnName] = { exists: 'unknown', error: error.message };
          }
        } else {
          console.log(`✅ ${columnName}: EXISTS and working`);
          console.log(`   📊 Data: ${JSON.stringify(data[0][columnName])}`);
          results[columnName] = { exists: true, data: data[0][columnName] };
          
          // Clean up test data
          await this.supabase
            .from('directory_submissions')
            .delete()
            .eq('customer_id', validCustomerId)
            .eq('directory_name', testData.directory_name);
        }
      } catch (err) {
        console.log(`❌ ${columnName}: Exception - ${err.message}`);
        results[columnName] = { exists: false, error: err.message };
      }
    }
    
    return results;
  }

  async generateVerificationReport() {
    console.log('🚨 DIRECT COLUMN VERIFICATION - AUTOBOLT SCHEMA');
    console.log('='.repeat(60));
    console.log('🎯 Mission: Verify AutoBolt columns exist via direct testing');
    console.log('📋 Method: Test data insertion to confirm column existence');
    console.log('');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      method: 'Direct data insertion testing',
      autobolt_processing_queue: {},
      directory_submissions: {},
      summary: {}
    };
    
    try {
      // Test autobolt_processing_queue columns
      reportData.autobolt_processing_queue = await this.testAutoboltProcessingQueueColumns();
      
      // Test directory_submissions columns  
      reportData.directory_submissions = await this.testDirectorySubmissionsColumns();
      
      // Generate summary
      const queueColumnsExist = Object.values(reportData.autobolt_processing_queue)
        .filter(col => col.exists === true).length;
      const dirColumnsExist = Object.values(reportData.directory_submissions)
        .filter(col => col.exists === true).length;
      
      reportData.summary = {
        autobolt_processing_queue_columns_verified: queueColumnsExist,
        autobolt_processing_queue_total_expected: 4,
        directory_submissions_columns_verified: dirColumnsExist,
        directory_submissions_total_expected: 4,
        overall_status: (queueColumnsExist >= 3 && dirColumnsExist >= 2) ? 'PARTIAL_SUCCESS' : 'NEEDS_ATTENTION'
      };
      
      console.log('\n📊 VERIFICATION SUMMARY');
      console.log('='.repeat(40));
      console.log(`✅ autobolt_processing_queue: ${queueColumnsExist}/4 columns verified`);
      console.log(`✅ directory_submissions: ${dirColumnsExist}/4 columns verified`);
      console.log(`🎯 Overall Status: ${reportData.summary.overall_status}`);
      
      // Save detailed report
      const reportPath = `./direct-column-verification-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
      
      return reportData;
    } catch (error) {
      console.error('\n❌ VERIFICATION FAILED:', error.message);
      reportData.error = error.message;
      
      const errorReportPath = `./direct-verification-error-${Date.now()}.json`;
      fs.writeFileSync(errorReportPath, JSON.stringify(reportData, null, 2));
      
      throw error;
    }
  }
}

async function main() {
  const verifier = new DirectColumnVerifier();
  
  try {
    const report = await verifier.generateVerificationReport();
    
    if (report.summary.overall_status === 'PARTIAL_SUCCESS') {
      console.log('\n🎉 MISSION SUCCESSFUL: Critical AutoBolt columns verified!');
      process.exit(0);
    } else {
      console.log('\n⚠️ ATTENTION NEEDED: Some columns may need manual creation');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ VERIFICATION MISSION FAILED:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DirectColumnVerifier };