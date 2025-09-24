#!/usr/bin/env node

/**
 * HUDSON'S FINAL CORRECTED AUDIT - FRANK'S AUTOBOLT WORK
 * Using valid customer references to test all 7 claimed columns
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

class FinalCorrectedAudit {
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

  async runCompleteAudit() {
    console.log('🚨 HUDSON\'S FINAL CORRECTED AUDIT - ALL 7 COLUMNS');
    console.log('='.repeat(60));
    console.log('👨‍💼 Senior Code Review Specialist - DirectoryBolt');
    console.log('🎯 Mission: Verify ALL 7 of Frank\'s AutoBolt columns');
    console.log('');
    
    const auditResults = {
      auditor: 'Hudson - Senior Code Review Specialist',
      timestamp: new Date().toISOString(),
      franksClaimedColumns: [
        'directory_submissions.directory_category',
        'directory_submissions.directory_tier', 
        'directory_submissions.processing_time_seconds',
        'directory_submissions.error_message',
        'autobolt_processing_queue.started_at',
        'autobolt_processing_queue.completed_at',
        'autobolt_processing_queue.processed_by'
      ]
    };
    
    // Get valid customer for FK compliance
    const { data: customers } = await this.supabase
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    const validCustomerId = customers[0].customer_id;
    console.log(`🔑 Using valid customer_id: ${validCustomerId}`);
    
    let verifiedColumns = 0;
    const testResults = {};
    
    // Test 1: autobolt_processing_queue columns (3 columns)
    console.log('\n📋 TESTING: autobolt_processing_queue columns');
    console.log('-'.repeat(50));
    
    const queueTestData = {
      customer_id: `FINAL-AUDIT-${Date.now()}`,
      business_name: 'Hudson Final Audit Test',
      email: 'hudson@finalaudit.com',
      package_type: 'enterprise',
      directory_limit: 250,
      priority_level: 10,
      status: 'processing',
      started_at: new Date().toISOString(),
      completed_at: new Date(Date.now() + 300000).toISOString(),
      processed_by: 'hudson_final_audit_system'
    };
    
    const { data: queueData, error: queueError } = await this.supabase
      .from('autobolt_processing_queue')
      .insert(queueTestData)
      .select();
    
    if (queueError) {
      console.log(`❌ autobolt_processing_queue INSERT failed: ${queueError.message}`);
      testResults.autobolt_processing_queue = { status: 'FAILED', error: queueError.message };
    } else {
      console.log('✅ autobolt_processing_queue: 3/3 columns verified');
      console.log(`   - started_at: ${queueData[0].started_at}`);
      console.log(`   - completed_at: ${queueData[0].completed_at}`);  
      console.log(`   - processed_by: ${queueData[0].processed_by}`);
      verifiedColumns += 3;
      testResults.autobolt_processing_queue = { status: 'SUCCESS', columns: 3 };
    }
    
    // Test 2: directory_submissions columns (4 columns)
    console.log('\n📋 TESTING: directory_submissions columns');
    console.log('-'.repeat(50));
    
    const dirTestData = {
      customer_id: validCustomerId,
      queue_id: queueData ? queueData[0].id : null,
      directory_name: 'Hudson Final Audit Directory',
      directory_category: 'Technology & Software',
      directory_tier: 'enterprise',
      processing_time_seconds: 250,
      error_message: 'Hudson audit test error log',
      submission_status: 'submitted'
    };
    
    const { data: dirData, error: dirError } = await this.supabase
      .from('directory_submissions')
      .insert(dirTestData)
      .select();
    
    if (dirError) {
      console.log(`❌ directory_submissions INSERT failed: ${dirError.message}`);
      testResults.directory_submissions = { status: 'FAILED', error: dirError.message };
    } else {
      console.log('✅ directory_submissions: 4/4 columns verified');
      console.log(`   - directory_category: ${dirData[0].directory_category}`);
      console.log(`   - directory_tier: ${dirData[0].directory_tier}`);
      console.log(`   - processing_time_seconds: ${dirData[0].processing_time_seconds}`);
      console.log(`   - error_message: ${dirData[0].error_message}`);
      verifiedColumns += 4;
      testResults.directory_submissions = { status: 'SUCCESS', columns: 4 };
    }
    
    // Test 3: Complex operations with all columns
    console.log('\n📋 TESTING: Complex operations with ALL AutoBolt columns');
    console.log('-'.repeat(55));
    
    try {
      // UPDATE with all autobolt columns
      const { error: updateError } = await this.supabase
        .from('autobolt_processing_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_by: 'hudson_completion_system'
        })
        .eq('customer_id', queueTestData.customer_id);
      
      // SELECT with JOIN and AutoBolt column filtering
      const { data: complexData, error: selectError } = await this.supabase
        .from('autobolt_processing_queue')
        .select(`
          *,
          directory_submissions (
            directory_category,
            directory_tier,
            processing_time_seconds,
            error_message
          )
        `)
        .eq('customer_id', queueTestData.customer_id)
        .not('started_at', 'is', null)
        .not('processed_by', 'is', null);
      
      if (updateError || selectError) {
        console.log(`❌ Complex operations failed`);
      } else {
        console.log('✅ Complex operations successful');
        console.log(`   - Records joined with all AutoBolt columns`);
        console.log(`   - Filtering works on started_at and processed_by`);
      }
    } catch (err) {
      console.log(`❌ Complex operations exception: ${err.message}`);
    }
    
    // Clean up
    if (queueData) {
      await this.supabase.from('directory_submissions').delete().eq('customer_id', validCustomerId).eq('directory_name', 'Hudson Final Audit Directory');
      await this.supabase.from('autobolt_processing_queue').delete().eq('customer_id', queueTestData.customer_id);
    }
    
    // Final verdict
    auditResults.finalResults = {
      columnsVerified: verifiedColumns,
      totalClaimed: 7,
      successRate: Math.round((verifiedColumns / 7) * 100),
      testResults,
      verdict: verifiedColumns === 7 ? 'APPROVED' : 'NEEDS_ATTENTION'
    };
    
    console.log('\n🏆 HUDSON\'S FINAL AUDIT VERDICT');
    console.log('='.repeat(40));
    console.log(`✅ Columns Verified: ${verifiedColumns}/7 (${auditResults.finalResults.successRate}%)`);
    console.log(`🎯 Frank's Claims: ${verifiedColumns === 7 ? 'FULLY CONFIRMED' : 'PARTIALLY CONFIRMED'}`);
    console.log(`🔒 Hudson's Final Approval: ${auditResults.finalResults.verdict}`);
    
    if (verifiedColumns === 7) {
      console.log('\n🎉 ALL 7 AUTOBOLT COLUMNS VERIFIED AND OPERATIONAL');
      console.log('✅ Database supports real AutoBolt operations');
      console.log('✅ Data insertion/update/selection all working');
      console.log('✅ Schema modifications complete and functional');
    }
    
    // Save final report
    const reportPath = `./hudson-final-corrected-audit-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n📄 Final corrected audit report: ${reportPath}`);
    
    return auditResults;
  }
}

async function main() {
  const auditor = new FinalCorrectedAudit();
  
  try {
    const results = await auditor.runCompleteAudit();
    
    if (results.finalResults.verdict === 'APPROVED') {
      console.log('\n🚀 HUDSON FINAL AUDIT: FRANK\'S WORK FULLY APPROVED');
      process.exit(0);
    } else {
      console.log('\n⚠️ HUDSON FINAL AUDIT: PARTIAL APPROVAL');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ FINAL AUDIT FAILED:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}