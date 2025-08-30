#!/usr/bin/env node
/**
 * 🔍 STATIC CODE ANALYSIS: DirectoryBolt Stripe Checkout Flow
 * 
 * This script analyzes the codebase for potential issues in the Stripe checkout
 * implementation without requiring the server to be running.
 * 
 * Author: Claude QA Engineer
 * Date: 2025-08-30
 */

const fs = require('fs');
const path = require('path');

// Test Results Storage
const analysisResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  issues: {
    critical: [],
    major: [],
    minor: []
  },
  tests: []
};

/**
 * Utility Functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${prefix[type]} [${timestamp}] ${message}`);
}

function addResult(testName, status, details = '', issues = []) {
  analysisResults.summary.total++;
  analysisResults.summary[status]++;
  
  const result = {
    test: testName,
    status,
    details,
    issues,
    timestamp: new Date().toISOString()
  };
  
  analysisResults.tests.push(result);
  
  issues.forEach(issue => {
    if (issue.severity) {
      analysisResults.issues[issue.severity].push({
        test: testName,
        ...issue
      });
    }
  });
  
  log(`${testName}: ${status.toUpperCase()}${details ? ' - ' + details : ''}`, 
      status === 'passed' ? 'success' : status === 'failed' ? 'error' : 'warning');
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Analysis: Pricing Configuration Validation
 */
function analyzePricingConfiguration() {
  log('Analyzing pricing configuration...', 'info');
  
  const apiContent = readFile('./pages/api/create-checkout-session-v3.js');
  const pricingComponent = readFile('./components/PricingPage.tsx');
  
  if (!apiContent) {
    addResult('Pricing API File', 'failed', 'API file not found', [{
      severity: 'critical',
      message: 'create-checkout-session-v3.js missing',
      impact: 'Checkout completely broken'
    }]);
    return;
  }
  
  if (!pricingComponent) {
    addResult('Pricing Component', 'failed', 'Pricing component not found', [{
      severity: 'critical',
      message: 'PricingPage.tsx missing',
      impact: 'Pricing page completely broken'
    }]);
    return;
  }
  
  // Extract pricing from API
  const pricingRegex = /const PRICING = {([\s\S]*?)};/;
  const pricingMatch = apiContent.match(pricingRegex);
  
  if (!pricingMatch) {
    addResult('API Pricing Configuration', 'failed', 'No pricing configuration found in API', [{
      severity: 'critical',
      message: 'PRICING object missing from API',
      impact: 'Checkout will fail - no prices defined'
    }]);
    return;
  }
  
  // Validate pricing structure
  const issues = [];
  
  // Check for required plans
  const requiredPlans = ['starter', 'growth', 'pro', 'subscription'];
  const requiredAddons = ['fasttrack', 'premium', 'qa', 'csv'];
  
  requiredPlans.forEach(plan => {
    if (!apiContent.includes(`${plan}:`)) {
      issues.push({
        severity: 'major',
        message: `Missing ${plan} plan in API pricing`,
        impact: `${plan} checkout will fail`
      });
    }
  });
  
  requiredAddons.forEach(addon => {
    if (!apiContent.includes(`${addon}:`)) {
      issues.push({
        severity: 'major',
        message: `Missing ${addon} addon in API pricing`,
        impact: `${addon} addon cannot be purchased`
      });
    }
  });
  
  // Check pricing consistency between requirements and implementation
  const expectedPrices = {
    starter: '4900', // $49
    growth: '8900',  // $89
    pro: '15900',    // $159
    subscription: '4900', // $49
    fasttrack: '2500', // $25
    premium: '1500',   // $15
    qa: '1000',        // $10
    csv: '900'         // $9
  };
  
  // MAJOR ISSUE: Requirements say Growth is $89 but I see discrepancy
  if (apiContent.includes('amount: 8900')) {
    // Growth plan price matches
  } else {
    issues.push({
      severity: 'major',
      message: 'Growth plan price mismatch in API',
      impact: 'Incorrect pricing for most popular plan'
    });
  }
  
  // Check frontend pricing display
  const frontendPrices = {
    starter: pricingComponent.includes('price: 49'),
    growth: pricingComponent.includes('price: 89'),
    pro: pricingComponent.includes('price: 159'),
    subscription: pricingComponent.includes('price: 49')
  };
  
  Object.entries(frontendPrices).forEach(([plan, found]) => {
    if (!found) {
      issues.push({
        severity: 'major',
        message: `${plan} plan price not found in frontend`,
        impact: 'Price display inconsistency'
      });
    }
  });
  
  if (issues.length === 0) {
    addResult('Pricing Configuration Analysis', 'passed', 'All pricing configurations valid');
  } else {
    addResult('Pricing Configuration Analysis', 'failed', `${issues.length} pricing issues found`, issues);
  }
}

/**
 * Analysis: Checkout Button Implementation
 */
function analyzeCheckoutButton() {
  log('Analyzing checkout button implementation...', 'info');
  
  const checkoutButtonContent = readFile('./components/CheckoutButton.jsx');
  
  if (!checkoutButtonContent) {
    addResult('Checkout Button File', 'failed', 'CheckoutButton.jsx not found', [{
      severity: 'critical',
      message: 'Checkout button component missing',
      impact: 'No way to initiate checkout'
    }]);
    return;
  }
  
  const issues = [];
  
  // Check for essential functions
  const essentialFunctions = [
    'handleCheckout',
    'createCheckoutSession',
    'getSuccessUrl',
    'getCancelUrl'
  ];
  
  essentialFunctions.forEach(func => {
    if (!checkoutButtonContent.includes(func)) {
      issues.push({
        severity: 'major',
        message: `Missing ${func} function`,
        impact: 'Checkout flow may be incomplete'
      });
    }
  });
  
  // Check for proper error handling
  if (!checkoutButtonContent.includes('try {') || !checkoutButtonContent.includes('catch')) {
    issues.push({
      severity: 'major',
      message: 'No error handling in checkout process',
      impact: 'Users will see unhandled errors'
    });
  }
  
  // Check for loading states
  if (!checkoutButtonContent.includes('isLoading') && !checkoutButtonContent.includes('loading')) {
    issues.push({
      severity: 'minor',
      message: 'No loading state indicator',
      impact: 'Poor user experience during checkout'
    });
  }
  
  // Check for success URL configuration
  if (!checkoutButtonContent.includes('session_id={CHECKOUT_SESSION_ID}')) {
    issues.push({
      severity: 'major',
      message: 'Success URL missing session ID placeholder',
      impact: 'Success page cannot retrieve order details'
    });
  }
  
  // Check for addon support
  if (!checkoutButtonContent.includes('addons')) {
    issues.push({
      severity: 'major',
      message: 'No addon support in checkout button',
      impact: 'Add-ons cannot be purchased'
    });
  }
  
  if (issues.length === 0) {
    addResult('Checkout Button Analysis', 'passed', 'Checkout button implementation looks good');
  } else {
    addResult('Checkout Button Analysis', 'failed', `${issues.length} issues found`, issues);
  }
}

/**
 * Analysis: Success Page Implementation
 */
function analyzeSuccessPage() {
  log('Analyzing success page implementation...', 'info');
  
  const successPageContent = readFile('./pages/success.js');
  
  if (!successPageContent) {
    addResult('Success Page File', 'failed', 'success.js not found', [{
      severity: 'critical',
      message: 'Success page missing',
      impact: 'Users see error after successful payment'
    }]);
    return;
  }
  
  const issues = [];
  
  // Check for session ID handling
  if (!successPageContent.includes('session_id')) {
    issues.push({
      severity: 'major',
      message: 'Success page does not handle session ID',
      impact: 'Cannot show order details to customer'
    });
  }
  
  // Check for session details API call
  if (!successPageContent.includes('checkout-session-details')) {
    issues.push({
      severity: 'major',
      message: 'No API call to fetch session details',
      impact: 'Order summary not displayed'
    });
  }
  
  // Check for error handling
  if (!successPageContent.includes('catch') || !successPageContent.includes('error')) {
    issues.push({
      severity: 'minor',
      message: 'Limited error handling on success page',
      impact: 'Poor UX if session details fail to load'
    });
  }
  
  // Check for next steps information
  if (!successPageContent.includes('What happens next') || !successPageContent.includes('timeline')) {
    issues.push({
      severity: 'minor',
      message: 'No clear next steps for customers',
      impact: 'Customers unsure what happens after payment'
    });
  }
  
  // Check for support contact information
  if (!successPageContent.includes('@directorybolt.com')) {
    issues.push({
      severity: 'minor',
      message: 'No support contact on success page',
      impact: 'Customers cannot get help if needed'
    });
  }
  
  if (issues.length === 0) {
    addResult('Success Page Analysis', 'passed', 'Success page implementation complete');
  } else {
    addResult('Success Page Analysis', issues.some(i => i.severity === 'major') ? 'failed' : 'warning', 
             `${issues.length} issues found`, issues);
  }
}

/**
 * Analysis: Mobile Responsiveness
 */
function analyzeMobileResponsiveness() {
  log('Analyzing mobile responsiveness...', 'info');
  
  const pricingComponent = readFile('./components/PricingPage.tsx');
  const checkoutButton = readFile('./components/CheckoutButton.jsx');
  
  const issues = [];
  
  if (pricingComponent) {
    // Check for responsive classes
    const responsiveClasses = [
      'sm:', 'md:', 'lg:', 'xl:',
      'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-',
      'flex-col', 'sm:flex-row'
    ];
    
    let responsiveClassFound = false;
    responsiveClasses.forEach(className => {
      if (pricingComponent.includes(className)) {
        responsiveClassFound = true;
      }
    });
    
    if (!responsiveClassFound) {
      issues.push({
        severity: 'major',
        message: 'No responsive design classes found in pricing component',
        impact: 'Poor mobile experience'
      });
    }
    
    // Check for mobile-specific considerations
    if (!pricingComponent.includes('touch')) {
      issues.push({
        severity: 'minor',
        message: 'No touch-specific optimizations',
        impact: 'Buttons may be hard to tap on mobile'
      });
    }
  }
  
  if (checkoutButton) {
    // Check button sizing for mobile
    if (!checkoutButton.includes('py-3') && !checkoutButton.includes('py-4')) {
      issues.push({
        severity: 'minor',
        message: 'Checkout buttons may be too small for mobile',
        impact: 'Hard to tap on mobile devices'
      });
    }
  }
  
  if (issues.length === 0) {
    addResult('Mobile Responsiveness Analysis', 'passed', 'Responsive design patterns detected');
  } else {
    addResult('Mobile Responsiveness Analysis', 'warning', `${issues.length} mobile issues found`, issues);
  }
}

/**
 * Analysis: Security and Configuration
 */
function analyzeSecurityConfiguration() {
  log('Analyzing security configuration...', 'info');
  
  const apiContent = readFile('./pages/api/create-checkout-session-v3.js');
  const envExample = readFile('./.env.example');
  
  const issues = [];
  
  if (apiContent) {
    // Check for hardcoded secrets (this is a security issue)
    if (apiContent.includes('sk_live_')) {
      issues.push({
        severity: 'critical',
        message: 'Hardcoded Stripe secret key in source code',
        impact: 'Major security vulnerability - API key exposed'
      });
    }
    
    // Check for proper environment variable usage
    if (!apiContent.includes('process.env.STRIPE_SECRET_KEY')) {
      issues.push({
        severity: 'major',
        message: 'Not using environment variable for Stripe key',
        impact: 'Configuration not flexible/secure'
      });
    }
    
    // Check for input validation
    if (!apiContent.includes('validation') && !apiContent.includes('validate')) {
      issues.push({
        severity: 'major',
        message: 'Limited input validation in API',
        impact: 'Potential for invalid requests to cause errors'
      });
    }
    
    // Check for request method validation
    if (!apiContent.includes('POST')) {
      issues.push({
        severity: 'minor',
        message: 'No explicit request method validation',
        impact: 'API may accept incorrect HTTP methods'
      });
    }
  }
  
  if (!envExample) {
    issues.push({
      severity: 'minor',
      message: 'No .env.example file found',
      impact: 'Developers may not know required environment variables'
    });
  }
  
  if (issues.length === 0) {
    addResult('Security Configuration Analysis', 'passed', 'Basic security practices followed');
  } else {
    addResult('Security Configuration Analysis', 'failed', `${issues.length} security issues found`, issues);
  }
}

/**
 * Analysis: Error Handling Implementation
 */
function analyzeErrorHandling() {
  log('Analyzing error handling implementation...', 'info');
  
  const apiContent = readFile('./pages/api/create-checkout-session-v3.js');
  const checkoutButton = readFile('./components/CheckoutButton.jsx');
  
  const issues = [];
  
  if (apiContent) {
    // Check for comprehensive error handling
    if (!apiContent.includes('try {') || !apiContent.includes('catch')) {
      issues.push({
        severity: 'major',
        message: 'No error handling in API endpoint',
        impact: 'Unhandled errors will crash the API'
      });
    }
    
    // Check for specific Stripe error handling
    if (!apiContent.includes('stripe') && !apiContent.includes('error')) {
      issues.push({
        severity: 'major',
        message: 'No Stripe-specific error handling',
        impact: 'Stripe errors not properly handled'
      });
    }
    
    // Check for user-friendly error messages
    if (!apiContent.includes('error:') || !apiContent.includes('message:')) {
      issues.push({
        severity: 'minor',
        message: 'No user-friendly error messages',
        impact: 'Users see technical errors'
      });
    }
  }
  
  if (checkoutButton) {
    // Check for error state handling
    if (!checkoutButton.includes('error') || !checkoutButton.includes('ErrorDisplay')) {
      issues.push({
        severity: 'major',
        message: 'No error display in checkout button',
        impact: 'Users cannot see checkout errors'
      });
    }
    
    // Check for retry functionality
    if (!checkoutButton.includes('retry') && !checkoutButton.includes('Retry')) {
      issues.push({
        severity: 'minor',
        message: 'No retry functionality for failed checkouts',
        impact: 'Users must refresh page after errors'
      });
    }
  }
  
  if (issues.length === 0) {
    addResult('Error Handling Analysis', 'passed', 'Error handling implementation complete');
  } else {
    addResult('Error Handling Analysis', 'failed', `${issues.length} error handling issues found`, issues);
  }
}

/**
 * Generate Final Report
 */
function generateFinalReport() {
  const successRate = analysisResults.summary.total > 0 
    ? Math.round((analysisResults.summary.passed / analysisResults.summary.total) * 100) 
    : 0;
  
  const report = {
    summary: {
      timestamp: analysisResults.timestamp,
      totalTests: analysisResults.summary.total,
      passed: analysisResults.summary.passed,
      failed: analysisResults.summary.failed,
      warnings: analysisResults.summary.warnings,
      successRate: `${successRate}%`,
      criticalIssues: analysisResults.issues.critical.length,
      majorIssues: analysisResults.issues.major.length,
      minorIssues: analysisResults.issues.minor.length
    },
    detailedResults: analysisResults,
    recommendations: []
  };
  
  // Generate recommendations
  if (analysisResults.issues.critical.length > 0) {
    report.recommendations.push('🚨 CRITICAL: Fix all critical security and functionality issues immediately');
  }
  
  if (analysisResults.issues.major.length > 5) {
    report.recommendations.push('⚠️ HIGH PRIORITY: Multiple major issues detected - comprehensive review needed');
  }
  
  if (successRate < 70) {
    report.recommendations.push('📊 QUALITY: Overall quality score below 70% - significant improvements needed');
  }
  
  report.recommendations.push('🔧 TESTING: Run end-to-end tests with actual Stripe integration before deployment');
  report.recommendations.push('📱 MOBILE: Test checkout flow on various mobile devices and screen sizes');
  report.recommendations.push('🔒 SECURITY: Ensure all API keys are properly secured and not in source code');
  
  // Save report
  try {
    fs.writeFileSync('static_code_analysis_report.json', JSON.stringify(report, null, 2));
    log('Static analysis report saved to static_code_analysis_report.json', 'success');
  } catch (error) {
    log(`Failed to save report: ${error.message}`, 'error');
  }
  
  return report;
}

/**
 * Main Analysis Runner
 */
async function runStaticAnalysis() {
  log('🚀 Starting Static Code Analysis for DirectoryBolt Stripe Checkout', 'info');
  
  const startTime = Date.now();
  
  // Run all analyses
  analyzePricingConfiguration();
  analyzeCheckoutButton();
  analyzeSuccessPage();
  analyzeMobileResponsiveness();
  analyzeSecurityConfiguration();
  analyzeErrorHandling();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  log(`Analysis completed in ${duration}ms`, 'info');
  
  const report = generateFinalReport();
  
  // Display summary
  console.log('\n' + '='.repeat(80));
  console.log('🎯 DIRECTORYBOLТ STRIPE CHECKOUT - STATIC CODE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`📊 Tests Run: ${report.summary.totalTests}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`⚠️ Warnings: ${report.summary.warnings}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}`);
  console.log(`⏱️ Duration: ${duration}ms`);
  console.log('');
  console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`⚠️ Major Issues: ${report.summary.majorIssues}`);
  console.log(`ℹ️ Minor Issues: ${report.summary.minorIssues}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n📄 Detailed report saved to: static_code_analysis_report.json');
  console.log('='.repeat(80));
  
  return report;
}

// Run analysis if this file is executed directly
if (require.main === module) {
  runStaticAnalysis();
}

module.exports = { runStaticAnalysis };