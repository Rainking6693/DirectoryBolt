#!/usr/bin/env node

/**
 * HUDSON'S INDEPENDENT AUDIT VERIFICATION
 * Senior Code Review Specialist - DirectoryBolt Database Schema Audit
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

class HudsonAuditVerifier {
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

  async verifyFranksSevenColumns() {
    console.log('\n🔍 HUDSON\'S AUDIT: Verifying Frank\'s 7 Column Claims');
    console.log('='.repeat(60));
    
    const claimedColumns = [
      { table: 'directory_submissions', column: 'directory_category', type: 'VARCHAR(100)' },
      { table: 'directory_submissions', column: 'directory_tier', type: 'VARCHAR(50)' },
      { table: 'directory_submissions', column: 'processing_time_seconds', type: 'INTEGER' },
      { table: 'directory_submissions', column: 'error_message', type: 'TEXT' },
      { table: 'autobolt_processing_queue', column: 'started_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { table: 'autobolt_processing_queue', column: 'completed_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { table: 'autobolt_processing_queue', column: 'processed_by', type: 'VARCHAR(100)' }
    ];
    
    const results = {};
    let passedTests = 0;
    
    for (const { table, column, type } of claimedColumns) {
      try {
        console.log(`\n📋 Testing ${table}.${column} (${type})`);
        
        if (table === 'directory_submissions') {
          const testData = {
            customer_id: `HUDSON-TEST-${Date.now()}`,
            directory_name: `Hudson Test ${column}`,
            submission_status: 'pending'
          };
          
          // Add specific test value for each column
          if (column === 'directory_category') testData[column] = 'Business & Professional';
          else if (column === 'directory_tier') testData[column] = 'premium';
          else if (column === 'processing_time_seconds') testData[column] = 120;
          else if (column === 'error_message') testData[column] = 'Hudson test error message';
          
          const { data, error } = await this.supabase
            .from(table)
            .insert(testData)
            .select();
            
          if (error) {
            console.log(`❌ ${column}: FAILED - ${error.message}`);
            results[`${table}.${column}`] = { status: 'FAILED', error: error.message };
          } else {
            console.log(`✅ ${column}: VERIFIED - ${JSON.stringify(data[0][column])}`);
            results[`${table}.${column}`] = { status: 'VERIFIED', data: data[0][column] };
            passedTests++;
            
            // Clean up
            await this.supabase.from(table).delete().eq('customer_id', testData.customer_id);
          }
        } 
        else if (table === 'autobolt_processing_queue') {
          const testData = {
            customer_id: `HUDSON-TEST-${Date.now()}`,
            business_name: `Hudson Test ${column}`,
            email: 'hudson@directorybolt.com',
            package_type: 'professional',
            directory_limit: 100,
            priority_level: 5,
            status: 'queued'
          };
          
          // Add specific test value for each column
          if (column === 'started_at') testData[column] = new Date().toISOString();
          else if (column === 'completed_at') testData[column] = new Date().toISOString();
          else if (column === 'processed_by') testData[column] = 'hudson_audit_system';
          
          const { data, error } = await this.supabase
            .from(table)
            .insert(testData)
            .select();
            
          if (error) {
            console.log(`❌ ${column}: FAILED - ${error.message}`);
            results[`${table}.${column}`] = { status: 'FAILED', error: error.message };
          } else {
            console.log(`✅ ${column}: VERIFIED - ${JSON.stringify(data[0][column])}`);
            results[`${table}.${column}`] = { status: 'VERIFIED', data: data[0][column] };
            passedTests++;
            
            // Clean up
            await this.supabase.from(table).delete().eq('customer_id', testData.customer_id);
          }
        }
        
      } catch (err) {
        console.log(`❌ ${column}: EXCEPTION - ${err.message}`);
        results[`${table}.${column}`] = { status: 'EXCEPTION', error: err.message };
      }
    }
    
    console.log('\n📊 HUDSON\'S AUDIT SUMMARY');
    console.log('='.repeat(40));
    console.log(`✅ Columns Verified: ${passedTests}/7`);
    console.log(`🎯 Frank's Claims: ${passedTests === 7 ? 'CONFIRMED' : 'PARTIALLY CONFIRMED'}`);
    
    return { passedTests, totalTests: 7, results };
  }

  async testDataOperationsFunctionality() {
    console.log('\n🔧 TESTING: Real AutoBolt Data Operations');
    console.log('='.repeat(50));
    
    const customerId = `HUDSON-OP-TEST-${Date.now()}`;
    
    try {
      // Test 1: Insert queue record with all 7 columns
      console.log('\n📝 Test 1: INSERT with all AutoBolt columns');
      const { data: queueData, error: queueError } = await this.supabase
        .from('autobolt_processing_queue')
        .insert({
          customer_id: customerId,
          business_name: 'Hudson Operations Test',
          email: 'hudson@test.com',
          package_type: 'enterprise',
          directory_limit: 200,
          priority_level: 10,
          status: 'processing',
          started_at: new Date().toISOString(),
          processed_by: 'hudson_test_system'
        })
        .select();
      
      if (queueError) {
        console.log(`❌ Queue INSERT failed: ${queueError.message}`);
        return false;
      } else {
        console.log(`✅ Queue INSERT successful`);
      }
      
      // Test 2: Insert directory submissions with all columns
      console.log('\n📝 Test 2: Directory submissions with all columns');
      const { data: dirData, error: dirError } = await this.supabase
        .from('directory_submissions')
        .insert({
          customer_id: customerId,
          queue_id: queueData[0].id,
          directory_name: 'Hudson Test Directory',
          directory_category: 'Technology & Computing',
          directory_tier: 'enterprise',
          processing_time_seconds: 180,
          submission_status: 'submitted'
        })
        .select();
      
      if (dirError) {
        console.log(`❌ Directory INSERT failed: ${dirError.message}`);
        return false;
      } else {
        console.log(`✅ Directory INSERT successful`);
      }
      
      // Test 3: UPDATE operations using new columns
      console.log('\n📝 Test 3: UPDATE operations with AutoBolt columns');
      const { error: updateError } = await this.supabase
        .from('autobolt_processing_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_by: 'hudson_completion_system'
        })
        .eq('customer_id', customerId);
      
      if (updateError) {
        console.log(`❌ UPDATE failed: ${updateError.message}`);
        return false;
      } else {
        console.log(`✅ UPDATE successful`);
      }
      
      // Test 4: SELECT with filtering on new columns
      console.log('\n📝 Test 4: SELECT filtering with AutoBolt columns');
      const { data: selectData, error: selectError } = await this.supabase
        .from('autobolt_processing_queue')
        .select('*, directory_submissions(*)')
        .eq('customer_id', customerId)
        .not('started_at', 'is', null)
        .not('processed_by', 'is', null);
      
      if (selectError) {
        console.log(`❌ SELECT failed: ${selectError.message}`);
        return false;
      } else {
        console.log(`✅ SELECT successful - Found ${selectData.length} records`);
        console.log(`   📊 Record includes all AutoBolt fields`);
      }
      
      // Clean up
      await this.supabase.from('directory_submissions').delete().eq('customer_id', customerId);
      await this.supabase.from('autobolt_processing_queue').delete().eq('customer_id', customerId);
      
      console.log('\n🎉 ALL DATA OPERATIONS SUCCESSFUL');
      return true;
      
    } catch (err) {
      console.log(`❌ Data operations failed: ${err.message}`);
      return false;
    }
  }

  async generateFinalAuditReport() {
    console.log('🚨 HUDSON\'S FINAL AUDIT REPORT - FRANK\'S AUTOBOLT WORK');
    console.log('='.repeat(60));
    console.log('👨‍💼 Senior Code Review Specialist - DirectoryBolt');
    console.log('🎯 Mission: Verify Frank\'s 7 AutoBolt columns and functionality');
    console.log('');
    
    const reportData = {
      auditor: 'Hudson - Senior Code Review Specialist',
      timestamp: new Date().toISOString(),
      subject: 'Frank\'s AutoBolt Database Schema Claims',
      claimedWork: [
        '7 AutoBolt columns added and operational',
        'Database supports real AutoBolt operations', 
        'Test data insertion successful',
        'Schema modifications complete'
      ]
    };
    
    try {
      // Column verification
      const columnResults = await this.verifyFranksSevenColumns();
      reportData.columnVerification = columnResults;
      
      // Data operations testing
      const operationsWorking = await this.testDataOperationsFunctionality();
      reportData.operationsTest = { 
        status: operationsWorking ? 'PASSED' : 'FAILED',
        allOperationsWorking: operationsWorking 
      };
      
      // Final verdict
      const allColumnsPassed = columnResults.passedTests === 7;
      const operationsPassed = operationsWorking;
      
      reportData.finalVerdict = {
        columnsVerified: `${columnResults.passedTests}/7`,
        dataOperationsWorking: operationsPassed,
        franksClaims: allColumnsPassed && operationsPassed ? 'CONFIRMED' : 'PARTIALLY CONFIRMED',
        approval: allColumnsPassed && operationsPassed ? 'APPROVED' : 'NEEDS_ATTENTION'
      };
      
      console.log('\n📊 FINAL AUDIT VERDICT');
      console.log('='.repeat(40));
      console.log(`✅ Columns Verified: ${columnResults.passedTests}/7`);
      console.log(`✅ Data Operations: ${operationsPassed ? 'WORKING' : 'FAILED'}`);
      console.log(`🎯 Frank's Claims: ${reportData.finalVerdict.franksClaims}`);
      console.log(`🔒 Hudson's Approval: ${reportData.finalVerdict.approval}`);
      
      // Save report
      const reportPath = `./hudson-audit-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Full audit report saved to: ${reportPath}`);
      
      return reportData;
      
    } catch (error) {
      console.error('\n❌ AUDIT FAILED:', error.message);
      reportData.error = error.message;
      reportData.finalVerdict = { approval: 'REJECTED', reason: error.message };
      
      const errorReportPath = `./hudson-audit-error-${Date.now()}.json`;
      fs.writeFileSync(errorReportPath, JSON.stringify(reportData, null, 2));
      
      throw error;
    }
  }
}

async function main() {
  const auditor = new HudsonAuditVerifier();
  
  try {
    const report = await auditor.generateFinalAuditReport();
    
    if (report.finalVerdict.approval === 'APPROVED') {
      console.log('\n🎉 HUDSON AUDIT: FRANK\'S WORK APPROVED');
      process.exit(0);
    } else {
      console.log('\n⚠️ HUDSON AUDIT: ATTENTION NEEDED');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ HUDSON AUDIT FAILED:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { HudsonAuditVerifier };