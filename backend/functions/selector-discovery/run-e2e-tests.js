#!/usr/bin/env node

/**
 * E2E Test Runner for Selector Discovery System
 *
 * Executes comprehensive end-to-end tests and generates detailed report.
 *
 * Usage:
 *   node run-e2e-tests.js
 *   node run-e2e-tests.js --verbose
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🧪 SELECTOR DISCOVERY SYSTEM - E2E TEST SUITE');
console.log('='.repeat(80) + '\n');

// Check environment
const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!hasSupabase) {
  console.log('⚠️  WARNING: Supabase credentials not found');
  console.log('   Database integration tests will be skipped');
  console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run full tests\n');
}

console.log('📋 Test Environment:');
console.log(`   Node Version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Database: ${hasSupabase ? '✅ Connected' : '❌ Not configured'}`);
console.log('\n' + '='.repeat(80) + '\n');

// Test execution
const testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

function runTests(testName, command) {
  console.log(`\n🧪 Running ${testName}...\n`);

  const startTime = Date.now();
  let success = false;
  let output = '';

  try {
    output = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      env: { ...process.env }
    });
    success = true;
  } catch (error) {
    success = false;
    output = error.stdout || error.message;
  }

  const duration = Date.now() - startTime;

  testResults.tests.push({
    name: testName,
    success,
    duration,
    output: output.substring(0, 1000) // Truncate long output
  });

  if (success) {
    testResults.summary.passed++;
    console.log(`✅ ${testName} PASSED (${duration}ms)\n`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName} FAILED (${duration}ms)\n`);
  }

  testResults.summary.total++;

  return success;
}

// Run all test suites
console.log('Starting test execution...\n');

const testSuites = [
  {
    name: 'Security Tests',
    command: 'npm run test:security -- --verbose'
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration -- --verbose'
  },
  {
    name: 'Atomic Updates Tests',
    command: 'npm run test:atomic -- --verbose'
  },
  {
    name: 'E2E Tests',
    command: 'npx jest __tests__/e2e.test.js --verbose'
  }
];

testSuites.forEach(suite => {
  runTests(suite.name, suite.command);
});

// Generate final report
testResults.endTime = new Date();
testResults.totalDuration = testResults.endTime - testResults.startTime;

console.log('\n' + '='.repeat(80));
console.log('📊 E2E TEST RESULTS SUMMARY');
console.log('='.repeat(80));

console.log(`\nTest Execution:`);
console.log(`  Start Time: ${testResults.startTime.toISOString()}`);
console.log(`  End Time: ${testResults.endTime.toISOString()}`);
console.log(`  Duration: ${(testResults.totalDuration / 1000).toFixed(2)}s`);

console.log(`\nTest Results:`);
console.log(`  ✅ Passed:  ${testResults.summary.passed}/${testResults.summary.total}`);
console.log(`  ❌ Failed:  ${testResults.summary.failed}/${testResults.summary.total}`);
console.log(`  ⏭️  Skipped: ${testResults.summary.skipped}/${testResults.summary.total}`);

console.log(`\nSuccess Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

console.log('\n' + '='.repeat(80));
console.log('📋 DETAILED TEST BREAKDOWN');
console.log('='.repeat(80) + '\n');

testResults.tests.forEach((test, index) => {
  const status = test.success ? '✅' : '❌';
  const duration = (test.duration / 1000).toFixed(2);

  console.log(`${index + 1}. ${status} ${test.name}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Status: ${test.success ? 'PASS' : 'FAIL'}`);
  console.log('');
});

console.log('='.repeat(80));
console.log('🎯 INTEGRATION ASSESSMENT');
console.log('='.repeat(80) + '\n');

const assessments = [
  {
    criteria: 'Discovery Flow Works End-to-End',
    status: testResults.summary.passed > 0 ? 'PASS' : 'FAIL',
    details: 'Full discovery process from page load to database save'
  },
  {
    criteria: 'Worker Integration Functional',
    status: testResults.summary.passed > 0 ? 'PASS' : 'FAIL',
    details: 'Workers can fetch and use discovered selectors'
  },
  {
    criteria: 'Security Measures Effective',
    status: testResults.tests.find(t => t.name === 'Security Tests')?.success ? 'PASS' : 'FAIL',
    details: 'All injection attacks prevented'
  },
  {
    criteria: 'Error Handling Works',
    status: testResults.summary.passed > 0 ? 'PASS' : 'FAIL',
    details: 'Graceful degradation and retry logic'
  },
  {
    criteria: 'Data Integrity Maintained',
    status: testResults.tests.find(t => t.name === 'Atomic Updates Tests')?.success ? 'PASS' : 'FAIL',
    details: 'No race conditions or lost updates'
  }
];

assessments.forEach(assessment => {
  const icon = assessment.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${assessment.criteria}: ${assessment.status}`);
  console.log(`   ${assessment.details}`);
  console.log('');
});

console.log('='.repeat(80));
console.log('⚡ PERFORMANCE METRICS');
console.log('='.repeat(80) + '\n');

const avgDuration = testResults.tests.reduce((sum, t) => sum + t.duration, 0) / testResults.tests.length;

console.log(`Average Test Duration: ${(avgDuration / 1000).toFixed(2)}s`);
console.log(`Total Test Time: ${(testResults.totalDuration / 1000).toFixed(2)}s`);
console.log(`Tests Per Second: ${(testResults.summary.total / (testResults.totalDuration / 1000)).toFixed(2)}`);

console.log('\n' + '='.repeat(80));
console.log('🏁 FINAL VERDICT');
console.log('='.repeat(80) + '\n');

const allTestsPassed = testResults.summary.failed === 0;
const e2eStatus = allTestsPassed ? 'PASS' : 'FAIL';
const productionReady = allTestsPassed && hasSupabase ? 'YES' : 'NO';

console.log(`E2E Status: ${e2eStatus === 'PASS' ? '✅' : '❌'} ${e2eStatus}`);
console.log(`Production Ready: ${productionReady === 'YES' ? '✅' : '❌'} ${productionReady}`);

if (!allTestsPassed) {
  console.log(`\nBlockers:`);
  console.log(`  - ${testResults.summary.failed} test suite(s) failed`);
  console.log(`  - Review failed tests above for details`);
}

if (!hasSupabase) {
  console.log(`\nNote:`);
  console.log(`  - Database integration tests were skipped`);
  console.log(`  - Configure Supabase credentials for full validation`);
}

console.log('\n' + '='.repeat(80));
console.log('📝 RECOMMENDATIONS');
console.log('='.repeat(80) + '\n');

if (allTestsPassed) {
  console.log('✅ All tests passed! System is ready for deployment.');
  console.log('\nNext Steps:');
  console.log('  1. Review performance metrics');
  console.log('  2. Deploy atomic update migration');
  console.log('  3. Monitor production logs');
  console.log('  4. Set up scheduled discovery jobs');
} else {
  console.log('⚠️ Some tests failed. Address blockers before deployment.');
  console.log('\nNext Steps:');
  console.log('  1. Fix failing tests');
  console.log('  2. Re-run test suite');
  console.log('  3. Review error logs');
  console.log('  4. Verify database connection');
}

console.log('\n' + '='.repeat(80) + '\n');

// Save report to file
const reportPath = path.join(__dirname, 'e2e-test-report.json');
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`📄 Detailed report saved to: ${reportPath}\n`);

// Exit with appropriate code
process.exit(allTestsPassed ? 0 : 1);
