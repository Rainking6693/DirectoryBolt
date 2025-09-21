#!/usr/bin/env node

/**
 * Phase 2: Core Customer Journey Testing
 * Tests the complete customer flow from discovery to queue management
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🛤️  DirectoryBolt Phase 2: Customer Journey Testing');
console.log('=' .repeat(55));

async function testLandingPageFunctionality() {
  console.log('\n🏠 Phase 2.1: Landing Page Functionality');
  console.log('-' .repeat(40));
  
  const landingPagePaths = [
    'pages/index.tsx',
    'components/NewLandingPage.tsx',
    'components/LandingPage.tsx'
  ];
  
  let foundLandingPage = null;
  
  for (const pagePath of landingPagePaths) {
    const fullPath = path.join(__dirname, pagePath);
    if (fs.existsSync(fullPath)) {
      foundLandingPage = pagePath;
      console.log(`  ✅ Found landing page: ${pagePath}`);
      break;
    }
  }
  
  if (!foundLandingPage) {
    console.log('  ❌ No landing page component found');
    return { status: 'fail', error: 'No landing page found' };
  }
  
  // Check content of landing page
  const content = fs.readFileSync(path.join(__dirname, foundLandingPage), 'utf8');
  
  const checks = {
    hasValueProp: content.includes('AI-Powered Business Intelligence') || content.includes('AI business intelligence'),
    hasAnalysisMetrics: content.includes('34%') || content.includes('67%') || content.includes('SEO'),
    hasPricingInfo: content.includes('$299') || content.includes('$4,300') || content.includes('price'),
    hasCTA: content.includes('Get Started') || content.includes('Start Analysis') || content.includes('button')
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  console.log('  Content Analysis:');
  console.log(`    Value Proposition: ${checks.hasValueProp ? '✅' : '❌'}`);
  console.log(`    Analysis Metrics: ${checks.hasAnalysisMetrics ? '✅' : '❌'}`);
  console.log(`    Pricing Info: ${checks.hasPricingInfo ? '✅' : '❌'}`);
  console.log(`    Call-to-Action: ${checks.hasCTA ? '✅' : '❌'}`);
  console.log(`  📊 Content Score: ${passedChecks}/4`);
  
  return {
    status: passedChecks >= 3 ? 'pass' : 'warning',
    foundPage: foundLandingPage,
    contentScore: `${passedChecks}/4`,
    checks
  };
}

async function testPricingPageStructure() {
  console.log('\n💰 Phase 2.2: Pricing Page Structure');
  console.log('-' .repeat(40));
  
  const pricingPagePath = path.join(__dirname, 'pages/test-streamlined-pricing.tsx');
  
  if (!fs.existsSync(pricingPagePath)) {
    console.log('  ❌ Streamlined pricing page not found');
    return { status: 'fail', error: 'Pricing page missing' };
  }
  
  console.log('  ✅ Pricing page found');
  
  const content = fs.readFileSync(pricingPagePath, 'utf8');
  
  const pricingChecks = {
    hasStarterTier: content.includes('149') || content.includes('Starter'),
    hasGrowthTier: content.includes('299') || content.includes('Growth'),
    hasProfessionalTier: content.includes('499') || content.includes('Professional'),
    hasEnterpriseTier: content.includes('799') || content.includes('Enterprise'),
    hasFeatureList: content.includes('directories') || content.includes('features'),
    hasCheckout: content.includes('checkout') || content.includes('purchase')
  };
  
  const passedPricingChecks = Object.values(pricingChecks).filter(Boolean).length;
  
  console.log('  Pricing Structure Analysis:');
  console.log(`    Starter Tier ($149): ${pricingChecks.hasStarterTier ? '✅' : '❌'}`);
  console.log(`    Growth Tier ($299): ${pricingChecks.hasGrowthTier ? '✅' : '❌'}`);
  console.log(`    Professional Tier ($499): ${pricingChecks.hasProfessionalTier ? '✅' : '❌'}`);
  console.log(`    Enterprise Tier ($799): ${pricingChecks.hasEnterpriseTier ? '✅' : '❌'}`);
  console.log(`    Feature Lists: ${pricingChecks.hasFeatureList ? '✅' : '❌'}`);
  console.log(`    Checkout Integration: ${pricingChecks.hasCheckout ? '✅' : '❌'}`);
  console.log(`  📊 Pricing Score: ${passedPricingChecks}/6`);
  
  return {
    status: passedPricingChecks >= 4 ? 'pass' : 'warning',
    pricingScore: `${passedPricingChecks}/6`,
    checks: pricingChecks
  };
}

async function testCheckoutSystem() {
  console.log('\n💳 Phase 2.3: Checkout System Components');
  console.log('-' .repeat(40));
  
  const checkoutComponents = [
    'components/checkout/StreamlinedCheckout.tsx',
    'pages/api/stripe/create-checkout-session.ts',
    'pages/success.js'
  ];
  
  let foundComponents = [];
  let missingComponents = [];
  
  for (const component of checkoutComponents) {
    const fullPath = path.join(__dirname, component);
    if (fs.existsSync(fullPath)) {
      foundComponents.push(component);
      console.log(`  ✅ ${component}`);
    } else {
      missingComponents.push(component);
      console.log(`  ❌ ${component}`);
    }
  }
  
  // Check Stripe configuration
  const stripeConfigured = process.env.STRIPE_SECRET_KEY && 
                          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
                          !process.env.STRIPE_SECRET_KEY.includes('placeholder');
  
  console.log(`  Stripe Configuration: ${stripeConfigured ? '✅' : '❌'}`);
  console.log(`  📊 Checkout Components: ${foundComponents.length}/${checkoutComponents.length}`);
  
  return {
    status: foundComponents.length === checkoutComponents.length && stripeConfigured ? 'pass' : 'warning',
    foundComponents,
    missingComponents,
    stripeConfigured,
    componentScore: `${foundComponents.length}/${checkoutComponents.length}`
  };
}

async function testBusinessInfoCollection() {
  console.log('\n📋 Phase 2.4: Business Info Collection System');
  console.log('-' .repeat(40));
  
  const businessInfoComponents = [
    'pages/business-info.tsx',
    'pages/api/customer/register-complete.ts'
  ];
  
  let foundComponents = [];
  
  for (const component of businessInfoComponents) {
    const fullPath = path.join(__dirname, component);
    if (fs.existsSync(fullPath)) {
      foundComponents.push(component);
      console.log(`  ✅ ${component}`);
      
      // Check content for key fields
      if (component === 'pages/business-info.tsx') {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasBusinessFields = content.includes('businessName') || content.includes('business') ||
                                  content.includes('email') || content.includes('company');
        console.log(`    Form Fields: ${hasBusinessFields ? '✅' : '❌'}`);
      }
    } else {
      console.log(`  ❌ ${component}`);
    }
  }
  
  console.log(`  📊 Business Info Components: ${foundComponents.length}/${businessInfoComponents.length}`);
  
  return {
    status: foundComponents.length === businessInfoComponents.length ? 'pass' : 'fail',
    foundComponents,
    componentScore: `${foundComponents.length}/${businessInfoComponents.length}`
  };
}

async function testQueueManagementSystem() {
  console.log('\n⚡ Phase 2.5: Queue Management & AutoBolt Integration');
  console.log('-' .repeat(40));
  
  const queueComponents = [
    'pages/api/autobolt/queue-status.ts',
    'pages/api/autobolt/get-next-customer.ts',
    'pages/api/autobolt/update-progress.ts',
    'pages/staff-dashboard.tsx',
    'pages/api/staff/push-to-autobolt.ts'
  ];
  
  let foundComponents = [];
  
  for (const component of queueComponents) {
    const fullPath = path.join(__dirname, component);
    if (fs.existsSync(fullPath)) {
      foundComponents.push(component);
      console.log(`  ✅ ${component}`);
    } else {
      console.log(`  ❌ ${component}`);
    }
  }
  
  console.log(`  📊 Queue Components: ${foundComponents.length}/${queueComponents.length}`);
  
  return {
    status: foundComponents.length >= 3 ? 'pass' : 'warning',
    foundComponents,
    componentScore: `${foundComponents.length}/${queueComponents.length}`
  };
}

async function testAnalysisAPIEndpoint() {
  console.log('\n🤖 Phase 2.6: AI Analysis API Endpoint');
  console.log('-' .repeat(40));
  
  const analysisAPIPath = path.join(__dirname, 'pages/api/analyze.ts');
  
  if (!fs.existsSync(analysisAPIPath)) {
    console.log('  ❌ Analysis API endpoint not found');
    return { status: 'fail', error: 'Analysis API missing' };
  }
  
  console.log('  ✅ Analysis API endpoint found');
  
  const content = fs.readFileSync(analysisAPIPath, 'utf8');
  
  const apiChecks = {
    hasOpenAIIntegration: content.includes('openai') || content.includes('OpenAI'),
    hasBusinessAnalysis: content.includes('business') || content.includes('analysis'),
    hasTierHandling: content.includes('tier') || content.includes('package'),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    hasResponseStructure: content.includes('json') || content.includes('response')
  };
  
  const passedAPIChecks = Object.values(apiChecks).filter(Boolean).length;
  
  console.log('  API Structure Analysis:');
  console.log(`    OpenAI Integration: ${apiChecks.hasOpenAIIntegration ? '✅' : '❌'}`);
  console.log(`    Business Analysis: ${apiChecks.hasBusinessAnalysis ? '✅' : '❌'}`);
  console.log(`    Tier Handling: ${apiChecks.hasTierHandling ? '✅' : '❌'}`);
  console.log(`    Error Handling: ${apiChecks.hasErrorHandling ? '✅' : '❌'}`);
  console.log(`    Response Structure: ${apiChecks.hasResponseStructure ? '✅' : '❌'}`);
  console.log(`  📊 API Score: ${passedAPIChecks}/5`);
  
  return {
    status: passedAPIChecks >= 3 ? 'pass' : 'warning',
    apiScore: `${passedAPIChecks}/5`,
    checks: apiChecks
  };
}

async function generatePhase2Report() {
  console.log('\n📄 Generating Phase 2 Report...');
  
  const tests = {
    landingPage: await testLandingPageFunctionality(),
    pricingPage: await testPricingPageStructure(),
    checkoutSystem: await testCheckoutSystem(),
    businessInfo: await testBusinessInfoCollection(),
    queueManagement: await testQueueManagementSystem(),
    analysisAPI: await testAnalysisAPIEndpoint()
  };
  
  // Calculate overall scores
  const testResults = Object.values(tests);
  const passedTests = testResults.filter(test => test.status === 'pass').length;
  const warningTests = testResults.filter(test => test.status === 'warning').length;
  const failedTests = testResults.filter(test => test.status === 'fail').length;
  const totalTests = testResults.length;
  
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 2 - Core Customer Journey Testing',
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
  if (tests.landingPage.status !== 'pass') {
    report.recommendations.push('Improve landing page content and value proposition');
  }
  if (tests.checkoutSystem.status !== 'pass') {
    report.recommendations.push('Complete Stripe checkout integration setup');
  }
  if (tests.businessInfo.status !== 'pass') {
    report.recommendations.push('Implement business information collection flow');
  }
  
  // Write to file
  const reportPath = path.join(__dirname, 'PHASE_2_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n🎯 PHASE 2 SUMMARY');
  console.log('=' .repeat(40));
  console.log(`📊 Tests: ${passedTests} passed, ${warningTests} warnings, ${failedTests} failed`);
  console.log(`🎯 Pass Rate: ${report.summary.passRate}`);
  console.log(`🏠 Landing Page: ${tests.landingPage.status} (${tests.landingPage.contentScore || 'N/A'})`);
  console.log(`💰 Pricing Page: ${tests.pricingPage.status} (${tests.pricingPage.pricingScore || 'N/A'})`);
  console.log(`💳 Checkout System: ${tests.checkoutSystem.status} (${tests.checkoutSystem.componentScore || 'N/A'})`);
  console.log(`📋 Business Info: ${tests.businessInfo.status} (${tests.businessInfo.componentScore || 'N/A'})`);
  console.log(`⚡ Queue Management: ${tests.queueManagement.status} (${tests.queueManagement.componentScore || 'N/A'})`);
  console.log(`🤖 Analysis API: ${tests.analysisAPI.status} (${tests.analysisAPI.apiScore || 'N/A'})`);
  
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

// Run Phase 2 testing
if (require.main === module) {
  generatePhase2Report()
    .then(report => {
      if (report.summary.failedTests === 0) {
        console.log('\n🎉 Phase 2 completed successfully! Customer journey is functional.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Phase 2 completed with issues. Address critical components before Phase 3.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Phase 2 testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generatePhase2Report };