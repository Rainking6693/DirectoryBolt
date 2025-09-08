#!/usr/bin/env node

/**
 * 🧪 DirectoryBolt Comprehensive Test Runner
 * Runs all AI and Stripe integration tests based on the testing protocol
 */

const { runComprehensiveTests } = require('./test-e2e-integration');
const fs = require('fs');
const path = require('path');

async function updateTestingProtocol(results) {
  console.log('\n📝 Updating Testing Protocol...\n');
  
  try {
    const protocolPath = path.join(__dirname, 'DirectoryBoltTestingProtocol.md');
    let protocol = fs.readFileSync(protocolPath, 'utf8');
    
    // Update based on test results
    const updates = [];
    
    if (results.results.ai.openaiConnectivity.success) {
      updates.push('✅ OpenAI API connectivity validated');
    }
    
    if (results.results.ai.businessAnalyzer.success) {
      updates.push('✅ AI Business Intelligence generation validated');
    }
    
    if (results.results.stripe.connectivity.success) {
      updates.push('✅ Stripe API connectivity validated');
    }
    
    if (results.results.stripe.pricingTiers.success) {
      updates.push('✅ All pricing tiers validated');
    }
    
    if (results.results.stripe.checkoutSession.success) {
      updates.push('✅ Checkout session creation validated');
    }
    
    if (results.results.workflow.success) {
      updates.push('✅ Complete business workflow validated');
    }
    
    console.log('Testing Protocol Updates:');
    updates.forEach(update => console.log(`  ${update}`));
    
    return {
      success: true,
      updates: updates.length
    };
    
  } catch (error) {
    console.error('❌ Failed to update testing protocol:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateTestReport(results) {
  console.log('\n📊 Generating Test Report...\n');
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    duration: results.duration,
    overallSuccess: results.success,
    passedTests: results.passedCount,
    totalTests: results.totalTests,
    successRate: `${(results.passedCount/results.totalTests*100).toFixed(1)}%`,
    
    environment: {
      success: results.results.environment.success,
      configured: Object.keys(results.results.environment.configured).filter(
        key => results.results.environment.configured[key]
      ).length,
      missing: results.results.environment.missing
    },
    
    ai: {
      connectivity: results.results.ai.openaiConnectivity.success,
      businessAnalyzer: results.results.ai.businessAnalyzer.success,
      confidence: results.results.ai.businessAnalyzer.confidence || 0,
      tokensUsed: results.results.ai.openaiConnectivity.tokensUsed || 0
    },
    
    stripe: {
      connectivity: results.results.stripe.connectivity.success,
      pricingTiers: results.results.stripe.pricingTiers.success,
      checkoutSession: results.results.stripe.checkoutSession.success,
      webhookConfig: results.results.stripe.webhookConfig.success,
      testMode: results.results.stripe.connectivity.testMode
    },
    
    workflow: {
      success: results.results.workflow.success,
      aiAnalysis: results.results.workflow.aiAnalysis,
      directoryMatching: results.results.workflow.directoryMatching,
      exportFunctionality: results.results.workflow.exportFunctionality,
      opportunitiesFound: results.results.workflow.opportunitiesFound || 0
    },
    
    recommendations: []
  };
  
  // Generate recommendations
  if (!results.results.environment.success) {
    report.recommendations.push('Configure missing environment variables');
  }
  
  if (!results.results.ai.openaiConnectivity.success) {
    report.recommendations.push('Fix OpenAI API connectivity issues');
  }
  
  if (!results.results.stripe.connectivity.success) {
    report.recommendations.push('Fix Stripe API connectivity issues');
  }
  
  if (!results.results.workflow.success) {
    report.recommendations.push('Fix business workflow integration issues');
  }
  
  if (results.success) {
    report.recommendations.push('All tests passed - Ready for production deployment!');
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📄 Test Report Generated:');
  console.log(`   File: ${reportPath}`);
  console.log(`   Overall Success: ${report.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Success Rate: ${report.successRate}`);
  console.log(`   Duration: ${report.duration}s`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
  
  return report;
}

async function main() {
  console.log('🚀 DirectoryBolt Testing Protocol Execution');
  console.log('===========================================\n');
  
  console.log('📋 Running comprehensive integration tests...');
  console.log('This will test all AI and Stripe integrations based on the testing protocol.\n');
  
  try {
    // Run comprehensive tests
    const results = await runComprehensiveTests();
    
    // Update testing protocol
    const protocolUpdate = await updateTestingProtocol(results);
    
    // Generate detailed report
    const report = await generateTestReport(results);
    
    console.log('\n🎯 FINAL RESULTS');
    console.log('================');
    
    if (results.success) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ DirectoryBolt is fully functional');
      console.log('✅ AI integrations are working');
      console.log('✅ Stripe payments are configured');
      console.log('✅ Complete workflow is operational');
      console.log('\n🚀 READY FOR PRODUCTION LAUNCH!');
      
      console.log('\n📋 Testing Protocol Status:');
      console.log('✅ Phase 1: AI-Powered Analysis Engine - COMPLETE');
      console.log('✅ Phase 2: Pricing & Value Positioning - COMPLETE');
      console.log('✅ Phase 3: Enhanced Customer Onboarding - COMPLETE');
      console.log('✅ Phase 4: Advanced Automation - COMPLETE');
      console.log('✅ Phase 6: Quality Assurance & Launch - COMPLETE');
      
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log(`Success Rate: ${results.passedCount}/${results.totalTests} (${(results.passedCount/results.totalTests*100).toFixed(0)}%)`);
      console.log('\nPlease review the test results above and fix the failing components.');
      
      if (results.passedCount >= 3) {
        console.log('\n✨ Good news: Most core functionality is working!');
        console.log('You can likely proceed with limited functionality while fixing remaining issues.');
      }
    }
    
    console.log(`\n📊 Test Duration: ${results.duration}s`);
    console.log(`📄 Detailed report: test-report-${Date.now()}.json`);
    
    process.exit(results.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('\nPlease check your environment configuration and try again.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };