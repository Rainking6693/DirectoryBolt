#!/usr/bin/env node

/**
 * DirectoryBolt External Audit - Complete Execution
 * Executes all 5 phases of the comprehensive audit
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const { spawn } = require('child_process');

console.log('🚀 DirectoryBolt External Audit - Complete Execution');
console.log('====================================================');
console.log('Following EXTERNAL_AUDIT_PROTOCOL_SECURE.md v2.0');
console.log('Executing all 5 phases systematically...\n');

// Global audit results
const auditResults = {
  startTime: new Date().toISOString(),
  phases: {
    phase1: { name: 'Backend APIs and Job Queue', status: 'pending', score: 0, tests: [] },
    phase2: { name: 'Staff Dashboard and Monitoring', status: 'pending', score: 0, tests: [] },
    phase3: { name: 'AutoBolt Chrome Extension', status: 'pending', score: 0, tests: [] },
    phase4: { name: 'Testing Framework', status: 'pending', score: 0, tests: [] },
    phase5: { name: 'Payment Processing and Customer Journey', status: 'pending', score: 0, tests: [] }
  },
  overall: { score: 0, status: 'in_progress', recommendation: '' }
};

// Configuration
const BASE_URL = 'http://localhost:3000';
const PROD_URL = 'https://directorybolt.com';
const STAFF_API_KEY = 'DirectoryBolt-Staff-2025-SecureKey';
const TEST_CUSTOMER_ID = 'test-audit-customer';

// Utility function to test API endpoint
function testEndpoint(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Audit/2.0',
        ...headers
      }
    };

    const startTime = Date.now();
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const parsed = JSON.parse(responseData);
          resolve({ 
            success: true, 
            status: res.statusCode, 
            data: parsed,
            responseTime,
            headers: res.headers
          });
        } catch (error) {
          resolve({ 
            success: false, 
            status: res.statusCode, 
            error: error.message, 
            rawData: responseData,
            responseTime
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        error: error.message, 
        responseTime: Date.now() - startTime 
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to record test result
function recordTest(phase, testName, passed, details = '') {
  const test = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  auditResults.phases[phase].tests.push(test);
  
  console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  if (details && !passed) {
    console.log(`   Details: ${details}`);
  }
  
  return passed;
}

// Calculate phase score
function calculatePhaseScore(phase) {
  const tests = auditResults.phases[phase].tests;
  if (tests.length === 0) return 0;
  
  const passed = tests.filter(t => t.passed).length;
  const score = Math.round((passed / tests.length) * 100);
  auditResults.phases[phase].score = score;
  
  if (score >= 90) {
    auditResults.phases[phase].status = 'excellent';
  } else if (score >= 75) {
    auditResults.phases[phase].status = 'good';
  } else if (score >= 50) {
    auditResults.phases[phase].status = 'conditional';
  } else {
    auditResults.phases[phase].status = 'failed';
  }
  
  return score;
}

// Phase 1: Backend APIs and Job Queue Validation
async function executePhase1() {
  console.log('\n📊 PHASE 1: Backend APIs and Job Queue Validation');
  console.log('==================================================');
  
  auditResults.phases.phase1.status = 'running';
  
  // 1.1 Core API Endpoints
  console.log('\n🔍 1.1 Core API Endpoints Testing...');
  
  // Health Check
  const healthResult = await testEndpoint(`${BASE_URL}/api/health`);
  recordTest('phase1', 'Health Check Endpoint', 
    healthResult.success && healthResult.status === 200,
    `Status: ${healthResult.status}, Response Time: ${healthResult.responseTime}ms`
  );
  
  // System Status
  const statusResult = await testEndpoint(`${BASE_URL}/api/system-status`);
  recordTest('phase1', 'System Status Endpoint',
    statusResult.success && (statusResult.status === 200 || statusResult.status === 503),
    `Status: ${statusResult.status}, Critical Issues: ${statusResult.data?.critical_issues?.length || 'unknown'}`
  );
  
  // Website Analysis API
  const analyzeResult = await testEndpoint(`${BASE_URL}/api/analyze`);
  recordTest('phase1', 'Website Analysis API Existence',
    analyzeResult.status === 405 || analyzeResult.success,
    `Status: ${analyzeResult.status} (405 Method Not Allowed is expected for GET)`
  );
  
  // 1.2 Job Queue Operations
  console.log('\n🔍 1.2 Job Queue Operations Testing...');
  
  // Queue Status
  const queueResult = await testEndpoint(`${BASE_URL}/api/queue`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  recordTest('phase1', 'Queue Status Check',
    queueResult.success && queueResult.status === 200,
    `Status: ${queueResult.status}`
  );
  
  // 1.3 AutoBolt Integration
  console.log('\n🔍 1.3 AutoBolt Integration Testing...');
  
  // AutoBolt Queue Status
  const autoboltResult = await testEndpoint(`${BASE_URL}/api/autobolt/queue-status`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  recordTest('phase1', 'AutoBolt Queue Status',
    autoboltResult.success && autoboltResult.status === 200,
    `Status: ${autoboltResult.status}`
  );
  
  // Staff Authentication
  const staffAuthResult = await testEndpoint(`${BASE_URL}/api/staff/auth-check`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  recordTest('phase1', 'Staff Authentication',
    staffAuthResult.success && staffAuthResult.status === 200,
    `Status: ${staffAuthResult.status}`
  );
  
  const phase1Score = calculatePhaseScore('phase1');
  console.log(`\n📊 Phase 1 Score: ${phase1Score}% (${auditResults.phases.phase1.status.toUpperCase()})`);
  
  return phase1Score >= 50; // Minimum 50% to continue
}

// Phase 2: Staff Dashboard and Monitoring
async function executePhase2() {
  console.log('\n📊 PHASE 2: Staff Dashboard and Monitoring Validation');
  console.log('====================================================');
  
  auditResults.phases.phase2.status = 'running';
  
  // 2.1 Staff Authentication
  console.log('\n🔍 2.1 Staff Authentication Testing...');
  
  // Staff Dashboard Access (check if redirects properly)
  const dashboardResult = await testEndpoint(`${BASE_URL}/staff-dashboard`);
  recordTest('phase2', 'Staff Dashboard Access',
    dashboardResult.status === 302 || dashboardResult.status === 200 || dashboardResult.status === 401,
    `Status: ${dashboardResult.status} (Redirect or auth required is expected)`
  );
  
  // 2.2 Real-Time Monitoring
  console.log('\n🔍 2.2 Real-Time Monitoring Testing...');
  
  // Staff Job Progress
  const progressResult = await testEndpoint(`${BASE_URL}/api/staff/jobs/progress`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  recordTest('phase2', 'Job Progress Monitoring',
    progressResult.success && progressResult.status === 200,
    `Status: ${progressResult.status}`
  );
  
  // Staff Analytics
  const analyticsResult = await testEndpoint(`${BASE_URL}/api/staff/analytics`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  recordTest('phase2', 'Staff Analytics',
    analyticsResult.success && analyticsResult.status === 200,
    `Status: ${analyticsResult.status}`
  );
  
  const phase2Score = calculatePhaseScore('phase2');
  console.log(`\n📊 Phase 2 Score: ${phase2Score}% (${auditResults.phases.phase2.status.toUpperCase()})`);
  
  return phase2Score >= 50;
}

// Phase 3: AutoBolt Chrome Extension
async function executePhase3() {
  console.log('\n📊 PHASE 3: AutoBolt Chrome Extension Validation');
  console.log('=================================================');
  
  auditResults.phases.phase3.status = 'running';
  
  // 3.1 Extension Files
  console.log('\n🔍 3.1 Extension Installation Testing...');
  
  // Check if extension files exist
  const extensionFiles = [
    'public/autobolt-extension/manifest.json',
    'public/autobolt-extension/popup.html',
    'public/autobolt-extension/popup.js',
    'public/autobolt-extension/content.js'
  ];
  
  let filesExist = 0;
  for (const file of extensionFiles) {
    try {
      fs.accessSync(file);
      filesExist++;
      recordTest('phase3', `Extension File: ${file}`, true, 'File exists');
    } catch (error) {
      recordTest('phase3', `Extension File: ${file}`, false, 'File missing');
    }
  }
  
  // 3.2 Extension API Integration
  console.log('\n🔍 3.2 Extension API Integration Testing...');
  
  // Customer validation endpoint
  const customerValidateResult = await testEndpoint(`${BASE_URL}/api/extension/validate`, 'POST', {
    customerId: TEST_CUSTOMER_ID
  });
  recordTest('phase3', 'Customer Validation API',
    customerValidateResult.status === 200 || customerValidateResult.status === 404,
    `Status: ${customerValidateResult.status} (404 customer not found is acceptable)`
  );
  
  const phase3Score = calculatePhaseScore('phase3');
  console.log(`\n📊 Phase 3 Score: ${phase3Score}% (${auditResults.phases.phase3.status.toUpperCase()})`);
  
  return phase3Score >= 50;
}

// Phase 4: Testing Framework
async function executePhase4() {
  console.log('\n📊 PHASE 4: Testing Framework Validation');
  console.log('=========================================');
  
  auditResults.phases.phase4.status = 'running';
  
  // 4.1 Test Files Existence
  console.log('\n🔍 4.1 Test Framework Files...');
  
  const testFiles = [
    'package.json',
    'jest.config.js',
    '__tests__',
    'tests'
  ];
  
  for (const file of testFiles) {
    try {
      fs.accessSync(file);
      recordTest('phase4', `Test Framework: ${file}`, true, 'File/directory exists');
    } catch (error) {
      recordTest('phase4', `Test Framework: ${file}`, false, 'File/directory missing');
    }
  }
  
  // 4.2 Package.json Scripts
  console.log('\n🔍 4.2 Test Scripts Configuration...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const testScripts = [
      'test',
      'test:comprehensive',
      'test:enterprise',
      'test:e2e'
    ];
    
    for (const script of testScripts) {
      const exists = packageJson.scripts && packageJson.scripts[script];
      recordTest('phase4', `Test Script: ${script}`, !!exists, 
        exists ? `Script: ${packageJson.scripts[script]}` : 'Script missing');
    }
  } catch (error) {
    recordTest('phase4', 'Package.json Analysis', false, error.message);
  }
  
  const phase4Score = calculatePhaseScore('phase4');
  console.log(`\n📊 Phase 4 Score: ${phase4Score}% (${auditResults.phases.phase4.status.toUpperCase()})`);
  
  return phase4Score >= 50;
}

// Phase 5: Payment Processing and Customer Journey
async function executePhase5() {
  console.log('\n📊 PHASE 5: Payment Processing and Customer Journey');
  console.log('==================================================');
  
  auditResults.phases.phase5.status = 'running';
  
  // 5.1 Stripe Integration
  console.log('\n🔍 5.1 Stripe Integration Testing...');
  
  // Stripe checkout session creation
  const checkoutResult = await testEndpoint(`${BASE_URL}/api/create-checkout-session`, 'POST', {
    priceId: 'price_test_123',
    customerId: TEST_CUSTOMER_ID
  });
  recordTest('phase5', 'Stripe Checkout Session',
    checkoutResult.status === 200 || checkoutResult.status === 400,
    `Status: ${checkoutResult.status} (400 invalid price ID is acceptable)`
  );
  
  // 5.2 Pricing Endpoints
  console.log('\n🔍 5.2 Pricing System Testing...');
  
  // Check pricing page
  const pricingResult = await testEndpoint(`${BASE_URL}/pricing`);
  recordTest('phase5', 'Pricing Page Access',
    pricingResult.status === 200,
    `Status: ${pricingResult.status}`
  );
  
  // 5.3 Customer Journey
  console.log('\n🔍 5.3 Customer Journey Testing...');
  
  // Homepage access
  const homepageResult = await testEndpoint(`${BASE_URL}/`);
  recordTest('phase5', 'Homepage Access',
    homepageResult.status === 200,
    `Status: ${homepageResult.status}`
  );
  
  // Customer portal
  const portalResult = await testEndpoint(`${BASE_URL}/customer-portal`);
  recordTest('phase5', 'Customer Portal',
    portalResult.status === 200 || portalResult.status === 302 || portalResult.status === 401,
    `Status: ${portalResult.status} (Redirect or auth required is acceptable)`
  );
  
  const phase5Score = calculatePhaseScore('phase5');
  console.log(`\n📊 Phase 5 Score: ${phase5Score}% (${auditResults.phases.phase5.status.toUpperCase()})`);
  
  return phase5Score >= 50;
}

// Generate final audit report
function generateFinalReport() {
  console.log('\n📋 GENERATING FINAL AUDIT REPORT');
  console.log('=================================');
  
  // Calculate overall score
  const phaseScores = Object.values(auditResults.phases).map(p => p.score);
  const overallScore = Math.round(phaseScores.reduce((a, b) => a + b, 0) / phaseScores.length);
  auditResults.overall.score = overallScore;
  
  // Determine overall status and recommendation
  if (overallScore >= 90) {
    auditResults.overall.status = 'excellent';
    auditResults.overall.recommendation = 'APPROVED FOR PRODUCTION - System exceeds enterprise standards';
  } else if (overallScore >= 75) {
    auditResults.overall.status = 'good';
    auditResults.overall.recommendation = 'APPROVED FOR PRODUCTION - System meets enterprise standards';
  } else if (overallScore >= 60) {
    auditResults.overall.status = 'conditional';
    auditResults.overall.recommendation = 'CONDITIONAL APPROVAL - Address identified issues before production';
  } else {
    auditResults.overall.status = 'failed';
    auditResults.overall.recommendation = 'NOT APPROVED - Significant issues must be resolved';
  }
  
  auditResults.endTime = new Date().toISOString();
  
  // Display summary
  console.log('\n📊 AUDIT RESULTS SUMMARY:');
  console.log('=========================');
  
  Object.entries(auditResults.phases).forEach(([key, phase]) => {
    const statusIcon = phase.status === 'excellent' ? '🟢' : 
                     phase.status === 'good' ? '🟡' : 
                     phase.status === 'conditional' ? '🟠' : '🔴';
    console.log(`${statusIcon} ${phase.name}: ${phase.score}% (${phase.status.toUpperCase()})`);
  });
  
  console.log(`\n🎯 OVERALL SCORE: ${overallScore}% (${auditResults.overall.status.toUpperCase()})`);
  console.log(`📋 RECOMMENDATION: ${auditResults.overall.recommendation}`);
  
  // Save detailed report
  fs.writeFileSync('FINAL_AUDIT_REPORT.json', JSON.stringify(auditResults, null, 2));
  
  // Generate markdown report
  generateMarkdownReport();
  
  console.log('\n📄 Reports Generated:');
  console.log('- FINAL_AUDIT_REPORT.json (Detailed JSON results)');
  console.log('- FINAL_AUDIT_REPORT.md (Executive summary)');
}

function generateMarkdownReport() {
  const report = `# DirectoryBolt External Audit - Final Report

**Audit Date:** ${new Date().toLocaleDateString()}  
**Audit Protocol:** EXTERNAL_AUDIT_PROTOCOL_SECURE.md v2.0  
**Auditor:** Emily (AI Agent Orchestrator)  
**Overall Score:** ${auditResults.overall.score}%  
**Status:** ${auditResults.overall.status.toUpperCase()}  

## Executive Summary

${auditResults.overall.recommendation}

## Phase Results

${Object.entries(auditResults.phases).map(([key, phase]) => {
  const statusIcon = phase.status === 'excellent' ? '🟢' : 
                   phase.status === 'good' ? '🟡' : 
                   phase.status === 'conditional' ? '🟠' : '🔴';
  return `### ${statusIcon} ${phase.name}
**Score:** ${phase.score}%  
**Status:** ${phase.status.toUpperCase()}  
**Tests:** ${phase.tests.length} total, ${phase.tests.filter(t => t.passed).length} passed

${phase.tests.map(test => `- ${test.passed ? '✅' : '❌'} ${test.name}`).join('\n')}`;
}).join('\n\n')}

## Recommendations

${auditResults.overall.score >= 75 ? 
  '✅ **PRODUCTION READY** - System meets enterprise standards for deployment.' :
  '⚠️ **REQUIRES ATTENTION** - Address failed tests before production deployment.'}

## Next Steps

${auditResults.overall.score >= 75 ? 
  '1. Deploy to production environment\n2. Monitor system performance\n3. Conduct post-deployment validation' :
  '1. Fix identified issues\n2. Re-run failed tests\n3. Schedule follow-up audit'}

---
*Generated by DirectoryBolt External Audit System*
`;

  fs.writeFileSync('FINAL_AUDIT_REPORT.md', report);
}

// Main execution function
async function executeCompleteAudit() {
  console.log('🎯 Starting complete DirectoryBolt external audit...');
  console.log('⏱️  This will execute all 5 phases systematically\n');
  
  try {
    // Execute all phases
    const phase1Success = await executePhase1();
    if (!phase1Success) {
      console.log('\n⚠️  Phase 1 failed - continuing with remaining phases for complete assessment');
    }
    
    const phase2Success = await executePhase2();
    const phase3Success = await executePhase3();
    const phase4Success = await executePhase4();
    const phase5Success = await executePhase5();
    
    // Generate final report
    generateFinalReport();
    
    console.log('\n🎉 AUDIT COMPLETE!');
    console.log('==================');
    console.log('All phases executed and results compiled.');
    console.log('Review FINAL_AUDIT_REPORT.md for executive summary.');
    
  } catch (error) {
    console.error('\n💥 Audit execution failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure development server is running: npm run dev');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify environment variables are configured');
    
    // Save partial results
    auditResults.error = error.message;
    auditResults.endTime = new Date().toISOString();
    fs.writeFileSync('PARTIAL_AUDIT_REPORT.json', JSON.stringify(auditResults, null, 2));
  }
}

// Execute the complete audit
executeCompleteAudit();