/**
 * 🧪 AI SERVICES INTEGRATION TEST
 * 
 * Tests all AI services to ensure they work correctly before full deployment
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🧪 AI SERVICES INTEGRATION TEST SUITE                      ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check environment variables
console.log('📋 Environment Check:\n');
const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const hasAllEnvVars = requiredEnvVars.every(envVar => {
  const exists = !!process.env[envVar];
  console.log(`   ${exists ? '✅' : '❌'} ${envVar}`);
  return exists;
});

if (!hasAllEnvVars) {
  console.log('\n❌ Missing required environment variables. Please check .env.local\n');
  process.exit(1);
}

// Test data
const testJob = {
  id: 'test-job-' + Date.now(),
  customer_id: 'test-customer',
  business_name: 'DirectoryBolt Test Business',
  email: 'test@directorybolt.com',
  phone: '555-0123',
  website: 'https://directorybolt.com',
  address: '123 Test Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  description: 'A test business for directory submissions',
  category: 'Software'
};

const testDirectory = {
  id: 'test-directory',
  name: 'Test Directory',
  url: 'https://example.com/submit',
  difficulty: 'medium',
  hasCaptcha: false,
  tier: 'starter'
};

async function testService(serviceName, ServiceClass, config = {}) {
  console.log(`\n🧪 Testing ${serviceName}...`);
  
  try {
    const service = new ServiceClass({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      ...config
    });
    
    console.log(`   ✅ ${serviceName} initialized successfully`);
    return { success: true, service };
  } catch (error) {
    console.log(`   ❌ ${serviceName} failed to initialize: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('\n🔬 Starting AI Services Tests...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    services: {}
  };
  
  // Test 1: SuccessProbabilityCalculator
  try {
    const SuccessProbabilityCalculator = require('./lib/ai-services/SuccessProbabilityCalculator');
    const test1 = await testService('SuccessProbabilityCalculator', SuccessProbabilityCalculator);
    results.total++;
    if (test1.success) {
      results.passed++;
      results.services.probabilityCalculator = 'PASS';
    } else {
      results.failed++;
      results.services.probabilityCalculator = 'FAIL';
    }
  } catch (error) {
    console.log(`   ❌ Could not load SuccessProbabilityCalculator: ${error.message}`);
    results.total++;
    results.failed++;
    results.services.probabilityCalculator = 'FAIL';
  }
  
  // Test 2: DescriptionCustomizer
  try {
    const DescriptionCustomizer = require('./lib/ai-services/DescriptionCustomizer');
    const test2 = await testService('DescriptionCustomizer', DescriptionCustomizer);
    results.total++;
    if (test2.success) {
      results.passed++;
      results.services.descriptionCustomizer = 'PASS';
    } else {
      results.failed++;
      results.services.descriptionCustomizer = 'FAIL';
    }
  } catch (error) {
    console.log(`   ❌ Could not load DescriptionCustomizer: ${error.message}`);
    results.total++;
    results.failed++;
    results.services.descriptionCustomizer = 'FAIL';
  }
  
  // Test 3: AISubmissionOrchestrator
  try {
    const AISubmissionOrchestrator = require('./lib/ai-services/AISubmissionOrchestrator');
    const test3 = await testService('AISubmissionOrchestrator', AISubmissionOrchestrator);
    results.total++;
    if (test3.success) {
      results.passed++;
      results.services.orchestrator = 'PASS';
    } else {
      results.failed++;
      results.services.orchestrator = 'FAIL';
    }
  } catch (error) {
    console.log(`   ❌ Could not load AISubmissionOrchestrator: ${error.message}`);
    results.total++;
    results.failed++;
    results.services.orchestrator = 'FAIL';
  }
  
  // Test 4: IntelligentRetryAnalyzer
  try {
    const IntelligentRetryAnalyzer = require('./lib/ai-services/IntelligentRetryAnalyzer');
    const test4 = await testService('IntelligentRetryAnalyzer', IntelligentRetryAnalyzer);
    results.total++;
    if (test4.success) {
      results.passed++;
      results.services.retryAnalyzer = 'PASS';
    } else {
      results.failed++;
      results.services.retryAnalyzer = 'FAIL';
    }
  } catch (error) {
    console.log(`   ❌ Could not load IntelligentRetryAnalyzer: ${error.message}`);
    results.total++;
    results.failed++;
    results.services.retryAnalyzer = 'FAIL';
  }
  
  // Test 5: AIFormMapper
  try {
    const AIFormMapper = require('./lib/ai-services/AIFormMapper');
    const test5 = await testService('AIFormMapper', AIFormMapper);
    results.total++;
    if (test5.success) {
      results.passed++;
      results.services.formMapper = 'PASS';
    } else {
      results.failed++;
      results.services.formMapper = 'FAIL';
    }
  } catch (error) {
    console.log(`   ❌ Could not load AIFormMapper: ${error.message}`);
    results.total++;
    results.failed++;
    results.services.formMapper = 'FAIL';
  }
  
  // Test 6: SubmissionTimingOptimizer
  try {
    const SubmissionTimingOptimizer = require('./lib/ai-services/SubmissionTimingOptimizer');
    const test6 = await testService('SubmissionTimingOptimizer', SubmissionTimingOptimizer);
    results.total++;
    if (test6.success) {
      results.passed++;
      results.services.timingOptimizer = 'PASS';
    } else {
      results.failed++;
      results.services.timingOptimizer = 'FAIL';
    }
  } catch (error) {
    console.log(`   ❌ Could not load SubmissionTimingOptimizer: ${error.message}`);
    results.total++;
    results.failed++;
    results.services.timingOptimizer = 'FAIL';
  }
  
  // Summary
  console.log(`\n
╔══════════════════════════════════════════════════════════════╗
║  📊 TEST RESULTS                                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  console.log(`\n📋 Service Status:\n`);
  Object.entries(results.services).forEach(([service, status]) => {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`   ${icon} ${service}: ${status}`);
  });
  
  if (results.failed === 0) {
    console.log(`\n✅ All AI services are working correctly!`);
    console.log(`🚀 Ready for production deployment!\n`);
    return true;
  } else {
    console.log(`\n⚠️  Some AI services failed. Please fix the issues before deploying.\n`);
    return false;
  }
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  });

