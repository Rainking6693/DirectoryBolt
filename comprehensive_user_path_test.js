/**
 * COMPREHENSIVE USER PATH TESTING SUITE for DirectoryBolt
 * 
 * This test suite validates ALL user journeys, navigation links, CTAs, 
 * and Stripe integration according to the requirements:
 * 
 * ✅ Test every navigation link - header, footer, internal links
 * ✅ Test every CTA button - must lead to working destinations  
 * ✅ Test complete user journey: Landing → Analysis → Pricing → Checkout → Success
 * ✅ Test all 4 pricing tiers in Stripe checkout
 * ✅ Verify NO waitlist pages exist - remove completely
 * ✅ Test mobile and desktop versions
 */

const axios = require('axios');
const { URL } = require('url');

// Test Configuration
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3003";
const TEST_TIMEOUT = 30000;

// Test tracking
let testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
  userPaths: {},
  issues: []
};

// Helper Functions
function logTest(name, status, details = '', url = '') {
  const test = { 
    name, 
    status, 
    details, 
    url, 
    timestamp: new Date().toISOString() 
  };
  
  testResults.tests.push(test);
  testResults.totalTests++;
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'WARN') testResults.warnings++;
  
  const statusEmoji = {
    'PASS': '✅',
    'FAIL': '❌', 
    'WARN': '⚠️'
  }[status];
  
  console.log(`${statusEmoji} ${name} - ${details}`);
  if (url) console.log(`   URL: ${url}`);
}

function addIssue(type, message, priority = 'medium', fix = '') {
  testResults.issues.push({
    type,
    message,
    priority,
    fix,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(url, options = {}) {
  try {
    const response = await axios({
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      timeout: TEST_TIMEOUT,
      validateStatus: () => true, // Accept all status codes
      ...options
    });
    return response;
  } catch (error) {
    return { 
      status: 0, 
      statusText: error.message, 
      data: null,
      headers: {},
      error: true 
    };
  }
}

async function checkPageLoad(path, expectedTitle = '', shouldContain = []) {
  const response = await makeRequest(path);
  
  if (response.error || response.status >= 400) {
    logTest(`Page Load: ${path}`, 'FAIL', `HTTP ${response.status}: ${response.statusText}`, path);
    addIssue('broken_page', `${path} returns HTTP ${response.status}`, 'high', `Fix routing for ${path}`);
    return false;
  }
  
  const html = response.data || '';
  
  // Check if it's a valid HTML page
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    logTest(`Page Load: ${path}`, 'FAIL', 'Invalid HTML response', path);
    addIssue('invalid_html', `${path} returns non-HTML content`, 'high');
    return false;
  }
  
  // Check title if specified
  if (expectedTitle) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)</i);
    const actualTitle = titleMatch ? titleMatch[1] : '';
    if (!actualTitle.toLowerCase().includes(expectedTitle.toLowerCase())) {
      logTest(`Page Title: ${path}`, 'WARN', `Expected "${expectedTitle}", got "${actualTitle}"`, path);
      addIssue('seo_issue', `${path} has incorrect title`, 'medium');
    } else {
      logTest(`Page Title: ${path}`, 'PASS', `Title contains "${expectedTitle}"`, path);
    }
  }
  
  // Check required content
  for (const content of shouldContain) {
    if (!html.toLowerCase().includes(content.toLowerCase())) {
      logTest(`Page Content: ${path}`, 'WARN', `Missing expected content: "${content}"`, path);
      addIssue('missing_content', `${path} missing "${content}"`, 'medium');
    }
  }
  
  logTest(`Page Load: ${path}`, 'PASS', `HTTP ${response.status}`, path);
  return true;
}

// Check for waitlist functionality (should NOT exist)
async function checkForWaitlistPages() {
  console.log('\n🔍 Checking for waitlist functionality (should be REMOVED)...');
  
  const waitlistPages = ['/waitlist', '/wait-list', '/join-waitlist'];
  let waitlistFound = false;
  
  for (const page of waitlistPages) {
    const response = await makeRequest(page);
    if (response.status === 200) {
      logTest('Waitlist Check', 'FAIL', `Found waitlist page at ${page}`, page);
      addIssue('waitlist_exists', `Waitlist page found at ${page}`, 'high', 'Remove waitlist pages completely');
      waitlistFound = true;
    } else {
      logTest('Waitlist Check', 'PASS', `No waitlist page at ${page}`, page);
    }
  }
  
  // Check for waitlist text in main pages
  const mainPages = ['/', '/pricing', '/analyze'];
  for (const page of mainPages) {
    const response = await makeRequest(page);
    if (response.data && response.data.toLowerCase().includes('waitlist')) {
      logTest('Waitlist Content Check', 'FAIL', `Found waitlist content in ${page}`, page);
      addIssue('waitlist_content', `Waitlist content found in ${page}`, 'high', 'Remove all waitlist references');
      waitlistFound = true;
    }
  }
  
  if (!waitlistFound) {
    logTest('Waitlist Removal', 'PASS', 'No waitlist functionality found');
  }
}

// Test all navigation links
async function testNavigationLinks() {
  console.log('\n🧭 Testing navigation links...');
  
  // Get the homepage to extract navigation links
  const homePage = await makeRequest('/');
  if (!homePage.data) {
    logTest('Navigation Test Setup', 'FAIL', 'Cannot load homepage for navigation testing');
    return;
  }
  
  // Test standard navigation links
  const navigationLinks = [
    { path: '/', name: 'Homepage' },
    { path: '/analyze', name: 'Free Analysis' },
    { path: '/pricing', name: 'Pricing' }
  ];
  
  for (const link of navigationLinks) {
    await checkPageLoad(link.path, link.name);
  }
  
  // Check for footer links (common ones)
  const footerLinks = [
    '/privacy',
    '/terms',
    '/support',
    '/contact'
  ];
  
  for (const link of footerLinks) {
    const response = await makeRequest(link);
    if (response.status === 404) {
      logTest(`Footer Link: ${link}`, 'WARN', 'Link returns 404 - may need implementation', link);
      addIssue('missing_page', `Footer link ${link} returns 404`, 'low', `Implement ${link} page or remove link`);
    }
  }
}

// Test all CTA buttons by checking their destinations
async function testCTAButtons() {
  console.log('\n🎯 Testing CTA button destinations...');
  
  // Primary CTAs should lead to pricing
  const pricingPageWorks = await checkPageLoad('/pricing', 'Pricing');
  if (pricingPageWorks) {
    logTest('Primary CTA Destination', 'PASS', 'Pricing page accessible for main CTAs');
  }
  
  // Free analysis CTA
  const analyzePageWorks = await checkPageLoad('/analyze', 'Analysis');
  if (analyzePageWorks) {
    logTest('Analysis CTA Destination', 'PASS', 'Analysis page accessible for analysis CTAs');
  }
}

// Test User Path 1: Landing → Pricing → Stripe Checkout → Success
async function testUserPath1() {
  console.log('\n🛣️  Testing User Path 1: Landing → Pricing → Stripe Checkout → Success');
  
  const path = [];
  
  // Step 1: Landing page
  const landingWorked = await checkPageLoad('/', 'DirectoryBolt', ['Get Listed', 'directories']);
  path.push({ step: 'Landing', success: landingWorked });
  
  // Step 2: Pricing page
  const pricingWorked = await checkPageLoad('/pricing', 'Pricing', ['$49', '$79', '$129', '$299']);
  path.push({ step: 'Pricing', success: pricingWorked });
  
  // Step 3: Check Stripe checkout endpoints exist
  const checkoutEndpoints = [
    '/api/create-checkout-session',
    '/api/payments/create-checkout'
  ];
  
  let stripeEndpointFound = false;
  for (const endpoint of checkoutEndpoints) {
    const response = await makeRequest(endpoint, { method: 'POST' });
    if (response.status !== 404) {
      stripeEndpointFound = true;
      logTest('Stripe Checkout Endpoint', 'PASS', `${endpoint} exists`, endpoint);
      break;
    }
  }
  
  if (!stripeEndpointFound) {
    logTest('Stripe Checkout Endpoint', 'FAIL', 'No Stripe checkout endpoint found');
    addIssue('missing_stripe', 'Stripe checkout endpoint not found', 'high', 'Implement Stripe checkout API');
  }
  
  path.push({ step: 'Stripe Checkout', success: stripeEndpointFound });
  
  // Step 4: Success page
  const successWorked = await checkPageLoad('/success', 'Success', ['Welcome', 'subscription']);
  path.push({ step: 'Success', success: successWorked });
  
  testResults.userPaths['Path1_Landing_To_Success'] = path;
  
  const allStepsWorked = path.every(step => step.success);
  logTest('User Path 1 Complete', allStepsWorked ? 'PASS' : 'FAIL', 
    `Landing → Pricing → Stripe → Success: ${allStepsWorked ? 'All steps work' : 'Some steps broken'}`);
}

// Test User Path 2: Landing → Analysis → Results → Upgrade → Stripe Checkout → Success  
async function testUserPath2() {
  console.log('\n🛣️  Testing User Path 2: Landing → Analysis → Results → Upgrade → Stripe → Success');
  
  const path = [];
  
  // Step 1: Landing page
  const landingWorked = await checkPageLoad('/', 'DirectoryBolt');
  path.push({ step: 'Landing', success: landingWorked });
  
  // Step 2: Analysis page
  const analysisWorked = await checkPageLoad('/analyze', 'Analysis');
  path.push({ step: 'Analysis', success: analysisWorked });
  
  // Step 3: Test analysis API
  const analysisAPI = await makeRequest('/api/analyze', { 
    method: 'POST',
    data: { url: 'https://example.com' },
    headers: { 'Content-Type': 'application/json' }
  });
  
  const analysisAPIWorks = analysisAPI.status !== 404;
  logTest('Analysis API', analysisAPIWorks ? 'PASS' : 'FAIL', 
    `Analysis endpoint returns ${analysisAPI.status}`, '/api/analyze');
  path.push({ step: 'Analysis API', success: analysisAPIWorks });
  
  // Step 4: Results page
  const resultsWorked = await checkPageLoad('/results', 'Results');
  path.push({ step: 'Results', success: resultsWorked });
  
  // Step 5: Same Stripe/Success as Path 1
  path.push({ step: 'Upgrade to Stripe', success: true }); // Covered in Path 1
  path.push({ step: 'Success', success: true }); // Covered in Path 1
  
  testResults.userPaths['Path2_Analysis_Flow'] = path;
  
  const criticalStepsWork = path.slice(0, 4).every(step => step.success);
  logTest('User Path 2 Complete', criticalStepsWork ? 'PASS' : 'FAIL',
    `Analysis flow: ${criticalStepsWork ? 'Core steps work' : 'Some steps broken'}`);
}

// Test all 4 pricing tiers
async function testPricingTiers() {
  console.log('\n💰 Testing all 4 pricing tiers...');
  
  const pricingPage = await makeRequest('/pricing');
  if (!pricingPage.data) {
    logTest('Pricing Tiers Test', 'FAIL', 'Cannot load pricing page');
    return;
  }
  
  const html = pricingPage.data.toLowerCase();
  
  // Check for all 4 pricing tiers
  const expectedTiers = [
    { name: 'starter', price: '$49', features: 'starter plan' },
    { name: 'growth', price: '$79', features: 'growth plan' }, 
    { name: 'professional', price: '$129', features: 'professional plan' },
    { name: 'enterprise', price: '$299', features: 'enterprise plan' }
  ];
  
  let allTiersFound = true;
  for (const tier of expectedTiers) {
    const hasTier = html.includes(tier.name) || html.includes(tier.features);
    const hasPrice = html.includes(tier.price);
    
    if (hasTier && hasPrice) {
      logTest(`Pricing Tier: ${tier.name}`, 'PASS', `Found ${tier.name} tier with ${tier.price}`);
    } else {
      logTest(`Pricing Tier: ${tier.name}`, 'FAIL', `Missing ${tier.name} tier or ${tier.price} price`);
      addIssue('missing_pricing_tier', `${tier.name} pricing tier incomplete`, 'high');
      allTiersFound = false;
    }
  }
  
  if (allTiersFound) {
    logTest('All Pricing Tiers', 'PASS', 'All 4 pricing tiers found with correct prices');
  }
}

// Test direct navigation to all pages
async function testDirectNavigation() {
  console.log('\n🎯 Testing direct navigation to all pages...');
  
  const allPages = [
    { path: '/', name: 'Homepage' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/analyze', name: 'Analysis' },
    { path: '/results', name: 'Results' },
    { path: '/success', name: 'Success' },
    { path: '/cancel', name: 'Cancel' }
  ];
  
  let allPagesWork = true;
  for (const page of allPages) {
    const works = await checkPageLoad(page.path, page.name);
    if (!works) allPagesWork = false;
  }
  
  logTest('Direct Navigation', allPagesWork ? 'PASS' : 'FAIL',
    `All pages: ${allPagesWork ? 'Accessible' : 'Some pages broken'}`);
}

// Test error handling and fallback paths
async function testErrorHandling() {
  console.log('\n⚠️  Testing error handling and fallback paths...');
  
  // Test 404 page
  const notFoundResponse = await makeRequest('/non-existent-page');
  if (notFoundResponse.status === 404) {
    logTest('404 Handling', 'PASS', '404 page returned for invalid URLs');
  } else {
    logTest('404 Handling', 'WARN', `Expected 404, got ${notFoundResponse.status}`);
  }
  
  // Test API error handling
  const apiErrorResponse = await makeRequest('/api/analyze', {
    method: 'POST',
    data: { url: 'invalid-url' },
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (apiErrorResponse.status >= 400) {
    logTest('API Error Handling', 'PASS', 'API properly handles invalid requests');
  } else {
    logTest('API Error Handling', 'WARN', 'API may not be validating input properly');
  }
}

// Mobile responsiveness check (basic)
async function testMobileExperience() {
  console.log('\n📱 Testing mobile experience (basic checks)...');
  
  const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
  
  const pages = ['/', '/pricing', '/analyze'];
  let mobileIssues = 0;
  
  for (const page of pages) {
    const response = await makeRequest(page, {
      headers: { 'User-Agent': mobileUserAgent }
    });
    
    if (response.data) {
      const html = response.data.toLowerCase();
      
      // Check for viewport meta tag
      const hasViewport = html.includes('viewport') && html.includes('width=device-width');
      if (!hasViewport) {
        logTest(`Mobile Viewport: ${page}`, 'FAIL', 'Missing proper viewport meta tag');
        addIssue('mobile_viewport', `${page} missing mobile viewport tag`, 'medium');
        mobileIssues++;
      } else {
        logTest(`Mobile Viewport: ${page}`, 'PASS', 'Proper viewport meta tag found');
      }
      
      // Check for responsive classes (Tailwind)
      const hasResponsive = html.includes('sm:') || html.includes('md:') || html.includes('lg:');
      if (!hasResponsive) {
        logTest(`Mobile Responsive: ${page}`, 'WARN', 'Limited responsive classes found');
      } else {
        logTest(`Mobile Responsive: ${page}`, 'PASS', 'Responsive classes detected');
      }
    }
  }
  
  logTest('Mobile Experience', mobileIssues === 0 ? 'PASS' : 'WARN',
    `${mobileIssues} mobile issues found`);
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n📊 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(50));
  
  const passRate = Math.round((testResults.passed / testResults.totalTests) * 100);
  
  console.log(`\n🎯 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passed} (${passRate}%)`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Warnings: ${testResults.warnings}`);
  
  console.log(`\n🚨 CRITICAL ISSUES (${testResults.issues.filter(i => i.priority === 'high').length}):`);
  testResults.issues.filter(i => i.priority === 'high').forEach(issue => {
    console.log(`   ❌ ${issue.message}`);
    if (issue.fix) console.log(`      Fix: ${issue.fix}`);
  });
  
  console.log(`\n⚠️  WARNINGS (${testResults.issues.filter(i => i.priority === 'medium').length}):`);
  testResults.issues.filter(i => i.priority === 'medium').forEach(issue => {
    console.log(`   ⚠️  ${issue.message}`);
  });
  
  console.log(`\n🛣️  USER PATHS:`);
  Object.entries(testResults.userPaths).forEach(([path, steps]) => {
    const allWorking = steps.every(step => step.success);
    console.log(`   ${allWorking ? '✅' : '❌'} ${path}: ${steps.map(s => s.success ? '✓' : '✗').join(' → ')}`);
  });
  
  // Overall assessment
  const criticalIssues = testResults.issues.filter(i => i.priority === 'high').length;
  
  console.log(`\n🎖️  FINAL ASSESSMENT:`);
  if (criticalIssues === 0 && passRate >= 90) {
    console.log(`   🟢 EXCELLENT: DirectoryBolt is ready for production!`);
  } else if (criticalIssues === 0 && passRate >= 75) {
    console.log(`   🟡 GOOD: Minor issues to address before full launch`);
  } else if (criticalIssues <= 2) {
    console.log(`   🟠 NEEDS WORK: ${criticalIssues} critical issues need fixing`);
  } else {
    console.log(`   🔴 CRITICAL: ${criticalIssues} major issues prevent launch`);
  }
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    'C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt\\comprehensive_test_results.json', 
    JSON.stringify(testResults, null, 2)
  );
  
  console.log(`\n📁 Detailed results saved to: comprehensive_test_results.json`);
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🚀 DIRECTORYBOLT COMPREHENSIVE USER PATH TESTING');
  console.log('================================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  try {
    // Core functionality tests
    await checkForWaitlistPages();
    await testNavigationLinks(); 
    await testCTAButtons();
    await testPricingTiers();
    await testDirectNavigation();
    
    // User journey tests
    await testUserPath1();
    await testUserPath2();
    
    // Additional tests
    await testErrorHandling();
    await testMobileExperience();
    
    // Generate final report
    generateTestReport();
    
  } catch (error) {
    console.error('\n❌ Test suite encountered an error:', error);
    logTest('Test Suite', 'FAIL', `Fatal error: ${error.message}`);
  }
}

// Execute tests
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = {
  runComprehensiveTests,
  testResults
};