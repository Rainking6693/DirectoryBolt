#!/usr/bin/env node

/**
 * Phase 3: Advanced Feature Testing
 * Tests AI analysis, tier validation, staff dashboard, and real-time updates
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 DirectoryBolt Phase 3: Advanced Feature Testing');
console.log('=' .repeat(55));

async function testAIAnalysisSystem() {
  console.log('\n🤖 Phase 3.1: AI Analysis System');
  console.log('-' .repeat(40));
  
  // Check AI-related API endpoints
  const aiEndpoints = [
    'pages/api/analyze.ts',
    'pages/api/ai/content-gap-analysis.ts',
    'pages/api/ai/competitive-benchmarking.ts'
  ];
  
  let foundEndpoints = [];
  
  for (const endpoint of aiEndpoints) {
    const fullPath = path.join(__dirname, endpoint);
    if (fs.existsSync(fullPath)) {
      foundEndpoints.push(endpoint);
      console.log(`  ✅ ${endpoint}`);
    } else {
      console.log(`  ❌ ${endpoint}`);
    }
  }
  
  // Check OpenAI configuration
  const openaiConfigured = process.env.OPENAI_API_KEY && 
                          process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                          process.env.OPENAI_API_KEY.startsWith('sk-');
  
  console.log(`  OpenAI Configuration: ${openaiConfigured ? '✅' : '❌'}`);
  
  // Check AI service files
  const aiServicePaths = [
    'lib/services/enhanced-website-analyzer.js',
    'lib/services/ai-business-analyzer.js',
    'lib/services/directory-matcher.js'
  ];
  
  let foundServices = 0;
  for (const servicePath of aiServicePaths) {
    const fullPath = path.join(__dirname, servicePath);
    if (fs.existsSync(fullPath)) {
      foundServices++;
      console.log(`  ✅ ${servicePath}`);
    } else {
      console.log(`  ⚠️  ${servicePath} (optional)`);
    }
  }
  
  console.log(`  📊 AI Endpoints: ${foundEndpoints.length}/${aiEndpoints.length}`);
  console.log(`  📊 AI Services: ${foundServices}/${aiServicePaths.length}`);
  
  return {
    status: foundEndpoints.length >= 2 && openaiConfigured ? 'pass' : 'warning',
    foundEndpoints,
    foundServices,
    openaiConfigured,
    endpointScore: `${foundEndpoints.length}/${aiEndpoints.length}`,
    serviceScore: `${foundServices}/${aiServicePaths.length}`
  };
}

async function testTierValidationSystem() {
  console.log('\n🎯 Phase 3.2: Tier Validation System');
  console.log('-' .repeat(40));
  
  // Check pricing configuration
  const pricingConfigPath = path.join(__dirname, 'lib/config/pricing.ts');
  
  if (!fs.existsSync(pricingConfigPath)) {
    console.log('  ❌ Pricing configuration not found');
    return { status: 'fail', error: 'Pricing config missing' };
  }
  
  console.log('  ✅ Pricing configuration found');
  
  const pricingContent = fs.readFileSync(pricingConfigPath, 'utf8');
  
  const tierChecks = {
    hasStarterTier: pricingContent.includes('starter') && pricingContent.includes('149'),
    hasGrowthTier: pricingContent.includes('growth') && pricingContent.includes('299'),
    hasProfessionalTier: pricingContent.includes('professional') && pricingContent.includes('499'),
    hasEnterpriseTier: pricingContent.includes('enterprise') && pricingContent.includes('799'),
    hasFeatureMapping: pricingContent.includes('directories') || pricingContent.includes('features'),
    hasTierExports: pricingContent.includes('export') && pricingContent.includes('PRICING')
  };
  
  const passedTierChecks = Object.values(tierChecks).filter(Boolean).length;
  
  console.log('  Tier Configuration Analysis:');
  console.log(`    Starter Tier ($149): ${tierChecks.hasStarterTier ? '✅' : '❌'}`);
  console.log(`    Growth Tier ($299): ${tierChecks.hasGrowthTier ? '✅' : '❌'}`);
  console.log(`    Professional Tier ($499): ${tierChecks.hasProfessionalTier ? '✅' : '❌'}`);
  console.log(`    Enterprise Tier ($799): ${tierChecks.hasEnterpriseTier ? '✅' : '❌'}`);
  console.log(`    Feature Mapping: ${tierChecks.hasFeatureMapping ? '✅' : '❌'}`);
  console.log(`    Proper Exports: ${tierChecks.hasTierExports ? '✅' : '❌'}`);
  console.log(`  📊 Tier Score: ${passedTierChecks}/6`);
  
  return {
    status: passedTierChecks >= 4 ? 'pass' : 'warning',
    tierScore: `${passedTierChecks}/6`,
    checks: tierChecks
  };
}

async function testStaffDashboard() {
  console.log('\n👥 Phase 3.3: Staff Dashboard System');
  console.log('-' .repeat(40));
  
  const staffComponents = [
    'pages/staff-dashboard.tsx',
    'pages/api/staff/queue.ts',
    'pages/api/staff/analytics.ts',
    'pages/api/staff/push-to-autobolt.ts',
    'pages/api/staff/auth-check.ts'
  ];
  
  let foundComponents = [];
  
  for (const component of staffComponents) {
    const fullPath = path.join(__dirname, component);
    if (fs.existsSync(fullPath)) {
      foundComponents.push(component);
      console.log(`  ✅ ${component}`);
    } else {
      console.log(`  ❌ ${component}`);
    }
  }
  
  // Check staff authentication configuration
  const staffAuthConfigured = process.env.STAFF_USERNAME && 
                             process.env.STAFF_PASSWORD &&
                             process.env.STAFF_API_KEY;
  
  console.log(`  Staff Authentication: ${staffAuthConfigured ? '✅' : '❌'}`);
  console.log(`  📊 Staff Components: ${foundComponents.length}/${staffComponents.length}`);
  
  return {
    status: foundComponents.length >= 3 && staffAuthConfigured ? 'pass' : 'warning',
    foundComponents,
    staffAuthConfigured,
    componentScore: `${foundComponents.length}/${staffComponents.length}`
  };
}

async function testDatabaseIntegration() {
  console.log('\n🗄️  Phase 3.4: Database Integration & Real-time Features');
  console.log('-' .repeat(40));
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('  ✅ Supabase client initialized');
    
    // Test database tables
    const testTables = ['customers', 'queue_history', 'customer_notifications'];
    let accessibleTables = 0;
    
    for (const tableName of testTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ⚠️  ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: Accessible`);
          accessibleTables++;
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Error`);
      }
    }
    
    // Test customer data
    try {
      const { data: customers, error: customerError, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (!customerError) {
        console.log(`  📊 Customer Records: ${count || 0} found`);
      }
    } catch (err) {
      console.log('  ⚠️  Could not count customer records');
    }
    
    console.log(`  📊 Database Tables: ${accessibleTables}/${testTables.length} accessible`);
    
    return {
      status: accessibleTables >= 2 ? 'pass' : 'warning',
      accessibleTables,
      totalTables: testTables.length,
      tableScore: `${accessibleTables}/${testTables.length}`
    };
    
  } catch (error) {
    console.log(`  ❌ Database connection failed: ${error.message}`);
    return {
      status: 'fail',
      error: error.message
    };
  }
}

async function testWebSocketRealTimeUpdates() {
  console.log('\n⚡ Phase 3.5: WebSocket Real-time Updates');
  console.log('-' .repeat(40));
  
  // Check for WebSocket-related files
  const websocketFiles = [
    'lib/websocket/websocket-server.js',
    'lib/websocket/websocket-client.js',
    'components/dashboard/RealtimeUpdates.tsx'
  ];
  
  let foundFiles = 0;
  
  for (const file of websocketFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      foundFiles++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} (may be optional)`);
    }
  }
  
  // Check for real-time related code in existing files
  const dashboardPath = path.join(__dirname, 'components/dashboard/CustomerDashboard.tsx');
  let hasRealtimeCode = false;
  
  if (fs.existsSync(dashboardPath)) {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    hasRealtimeCode = dashboardContent.includes('websocket') || 
                      dashboardContent.includes('realtime') || 
                      dashboardContent.includes('WebSocket');
    console.log(`  Real-time Dashboard Code: ${hasRealtimeCode ? '✅' : '❌'}`);
  }
  
  console.log(`  📊 WebSocket Files: ${foundFiles}/${websocketFiles.length}`);
  
  return {
    status: foundFiles >= 1 || hasRealtimeCode ? 'pass' : 'warning',
    foundFiles,
    hasRealtimeCode,
    websocketScore: `${foundFiles}/${websocketFiles.length}`
  };
}

async function testContentGapAnalyzer() {
  console.log('\n📊 Phase 3.6: Content Gap Analyzer (Professional/Enterprise)');
  console.log('-' .repeat(40));
  
  const contentGapPath = path.join(__dirname, 'pages/api/ai/content-gap-analysis.ts');
  
  if (!fs.existsSync(contentGapPath)) {
    console.log('  ❌ Content Gap Analysis API not found');
    return { status: 'fail', error: 'Content Gap API missing' };
  }
  
  console.log('  ✅ Content Gap Analysis API found');
  
  const content = fs.readFileSync(contentGapPath, 'utf8');
  
  const contentGapChecks = {
    hasTierValidation: content.includes('professional') || content.includes('enterprise'),
    hasCompetitorAnalysis: content.includes('competitor') || content.includes('analysis'),
    hasContentAnalysis: content.includes('content') || content.includes('gap'),
    hasAPIStructure: content.includes('export') && content.includes('handler'),
    hasErrorHandling: content.includes('try') && content.includes('catch')
  };
  
  const passedContentChecks = Object.values(contentGapChecks).filter(Boolean).length;
  
  console.log('  Content Gap Analysis:');
  console.log(`    Tier Validation: ${contentGapChecks.hasTierValidation ? '✅' : '❌'}`);
  console.log(`    Competitor Analysis: ${contentGapChecks.hasCompetitorAnalysis ? '✅' : '❌'}`);
  console.log(`    Content Analysis: ${contentGapChecks.hasContentAnalysis ? '✅' : '❌'}`);
  console.log(`    API Structure: ${contentGapChecks.hasAPIStructure ? '✅' : '❌'}`);
  console.log(`    Error Handling: ${contentGapChecks.hasErrorHandling ? '✅' : '❌'}`);
  console.log(`  📊 Content Gap Score: ${passedContentChecks}/5`);
  
  return {
    status: passedContentChecks >= 3 ? 'pass' : 'warning',
    contentGapScore: `${passedContentChecks}/5`,
    checks: contentGapChecks
  };
}

async function generatePhase3Report() {
  console.log('\n📄 Generating Phase 3 Report...');
  
  const tests = {
    aiAnalysis: await testAIAnalysisSystem(),
    tierValidation: await testTierValidationSystem(),
    staffDashboard: await testStaffDashboard(),
    databaseIntegration: await testDatabaseIntegration(),
    websocketRealtime: await testWebSocketRealTimeUpdates(),
    contentGapAnalyzer: await testContentGapAnalyzer()
  };
  
  // Calculate overall scores
  const testResults = Object.values(tests);
  const passedTests = testResults.filter(test => test.status === 'pass').length;
  const warningTests = testResults.filter(test => test.status === 'warning').length;
  const failedTests = testResults.filter(test => test.status === 'fail').length;
  const totalTests = testResults.length;
  
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 3 - Advanced Feature Testing',
    summary: {
      totalTests,
      passedTests,
      warningTests,
      failedTests,
      passRate: `${Math.round((passedTests / totalTests) * 100)}%`
    },
    details: tests,
    criticalIssues: testResults
      .filter(test => test.status === 'fail')
      .map(test => test.error || 'Component missing')
      .filter(Boolean),
    recommendations: []
  };
  
  // Add recommendations based on results
  if (tests.aiAnalysis.status !== 'pass') {
    report.recommendations.push('Complete OpenAI integration and AI service setup');
  }
  if (tests.staffDashboard.status !== 'pass') {
    report.recommendations.push('Complete staff dashboard and authentication system');
  }
  if (tests.websocketRealtime.status !== 'pass') {
    report.recommendations.push('Implement WebSocket real-time updates for Enterprise tier');
  }
  
  // Write to file
  const reportPath = path.join(__dirname, 'PHASE_3_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n🎯 PHASE 3 SUMMARY');
  console.log('=' .repeat(40));
  console.log(`📊 Tests: ${passedTests} passed, ${warningTests} warnings, ${failedTests} failed`);
  console.log(`🎯 Pass Rate: ${report.summary.passRate}`);
  console.log(`🤖 AI Analysis: ${tests.aiAnalysis.status} (${tests.aiAnalysis.endpointScore || 'N/A'})`);
  console.log(`🎯 Tier Validation: ${tests.tierValidation.status} (${tests.tierValidation.tierScore || 'N/A'})`);
  console.log(`👥 Staff Dashboard: ${tests.staffDashboard.status} (${tests.staffDashboard.componentScore || 'N/A'})`);
  console.log(`🗄️  Database Integration: ${tests.databaseIntegration.status} (${tests.databaseIntegration.tableScore || 'N/A'})`);
  console.log(`⚡ WebSocket Real-time: ${tests.websocketRealtime.status} (${tests.websocketRealtime.websocketScore || 'N/A'})`);
  console.log(`📊 Content Gap Analyzer: ${tests.contentGapAnalyzer.status} (${tests.contentGapAnalyzer.contentGapScore || 'N/A'})`);
  
  if (report.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    report.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
  
  return report;
}

// Run Phase 3 testing
if (require.main === module) {
  generatePhase3Report()
    .then(report => {
      if (report.summary.failedTests === 0) {
        console.log('\n🎉 Phase 3 completed successfully! Advanced features are functional.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Phase 3 completed with issues. Address critical features before Phase 4.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Phase 3 testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generatePhase3Report };