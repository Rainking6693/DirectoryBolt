#!/usr/bin/env node

/**
 * Customer Extension Testing Suite
 * Tests the customer-facing extension for critical issues
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 DirectoryBolt Customer Extension Testing Suite');
console.log('=' .repeat(60));

const EXTENSION_PATH = 'build/auto-bolt-extension';

// Test results storage
const testResults = {
  fileIntegrity: {},
  manifestValidation: {},
  authenticationFlow: {},
  uiComponents: {},
  apiEndpoints: {},
  recommendations: []
};

// 1. File Integrity Check
console.log('\n📁 1. FILE INTEGRITY CHECK');
console.log('-'.repeat(40));

const requiredFiles = [
  'manifest.json',
  'customer-popup.html',
  'customer-popup.js',
  'customer-auth.js',
  'background-batch.js',
  'content.js',
  'directory-form-filler.js',
  'popup.css'
];

requiredFiles.forEach(file => {
  const filePath = path.join(EXTENSION_PATH, file);
  const exists = fs.existsSync(filePath);
  testResults.fileIntegrity[file] = exists;
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  
  if (!exists) {
    testResults.recommendations.push(`🔴 CRITICAL: Missing file ${file}`);
  }
});

// 2. Manifest Validation
console.log('\n📋 2. MANIFEST VALIDATION');
console.log('-'.repeat(40));

try {
  const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Check critical manifest properties
  const checks = {
    'manifest_version': manifest.manifest_version === 3,
    'name': !!manifest.name,
    'version': !!manifest.version,
    'default_popup': manifest.action?.default_popup === 'customer-popup.html',
    'permissions': Array.isArray(manifest.permissions),
    'host_permissions': Array.isArray(manifest.host_permissions),
    'content_scripts': Array.isArray(manifest.content_scripts),
    'background_service_worker': !!manifest.background?.service_worker
  };
  
  Object.entries(checks).forEach(([check, passed]) => {
    testResults.manifestValidation[check] = passed;
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) {
      testResults.recommendations.push(`🔴 CRITICAL: Manifest ${check} issue`);
    }
  });
  
} catch (error) {
  console.log(`  ❌ Manifest parsing failed: ${error.message}`);
  testResults.recommendations.push('🔴 CRITICAL: Manifest.json is invalid');
}

// 3. Customer Popup HTML Analysis
console.log('\n🎨 3. CUSTOMER POPUP HTML ANALYSIS');
console.log('-'.repeat(40));

try {
  const htmlPath = path.join(EXTENSION_PATH, 'customer-popup.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Check for required UI elements
  const requiredElements = [
    'customerIdInput',
    'authenticateBtn', 
    'statusText',
    'statusDot',
    'authSection',
    'customerInfo',
    'actionsSection',
    'startProcessingBtn'
  ];
  
  requiredElements.forEach(elementId => {
    const hasElement = htmlContent.includes(`id="${elementId}"`);
    testResults.uiComponents[elementId] = hasElement;
    console.log(`  ${hasElement ? '✅' : '❌'} ${elementId} element`);
    if (!hasElement) {
      testResults.recommendations.push(`🟡 WARNING: Missing UI element ${elementId}`);
    }
  });
  
  // Check for CSS inclusion
  const hasCss = htmlContent.includes('popup.css');
  console.log(`  ${hasCss ? '✅' : '❌'} CSS stylesheet linked`);
  
  // Check for script inclusions
  const hasCustomerAuth = htmlContent.includes('customer-auth.js');
  const hasCustomerPopup = htmlContent.includes('customer-popup.js');
  console.log(`  ${hasCustomerAuth ? '✅' : '❌'} customer-auth.js included`);
  console.log(`  ${hasCustomerPopup ? '✅' : '❌'} customer-popup.js included`);
  
} catch (error) {
  console.log(`  ❌ HTML analysis failed: ${error.message}`);
  testResults.recommendations.push('🔴 CRITICAL: customer-popup.html is invalid');
}

// 4. JavaScript Code Analysis
console.log('\n⚙️ 4. JAVASCRIPT CODE ANALYSIS');
console.log('-'.repeat(40));

try {
  const jsPath = path.join(EXTENSION_PATH, 'customer-popup.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  
  // Check for critical functions and classes
  const codeChecks = {
    'CustomerInterface class': jsContent.includes('class CustomerInterface'),
    'checkAuthentication method': jsContent.includes('checkAuthentication'),
    'validateCustomer method': jsContent.includes('validateCustomer'),
    'handleAuthenticate method': jsContent.includes('handleAuthenticate'),
    'DIR- prefix support': jsContent.includes('DIR-'),
    'DB- prefix support': jsContent.includes('DB-'),
    'API endpoint': jsContent.includes('directorybolt.com/api/extension/validate'),
    'Chrome storage usage': jsContent.includes('chrome.storage'),
    'Error handling': jsContent.includes('try') && jsContent.includes('catch')
  };
  
  Object.entries(codeChecks).forEach(([check, passed]) => {
    testResults.authenticationFlow[check] = passed;
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) {
      testResults.recommendations.push(`🟡 WARNING: Missing ${check}`);
    }
  });
  
} catch (error) {
  console.log(`  ❌ JavaScript analysis failed: ${error.message}`);
  testResults.recommendations.push('🔴 CRITICAL: customer-popup.js is invalid');
}

// 5. API Endpoint Validation
console.log('\n🌐 5. API ENDPOINT VALIDATION');
console.log('-'.repeat(40));

// Note: We can't actually test HTTP requests from Node.js to the extension API
// But we can check if the endpoints are properly configured
console.log('  ℹ️  API endpoint testing requires browser environment');
console.log('  📝 Endpoints to test manually:');
console.log('     - https://directorybolt.com/api/extension/validate-fixed');
console.log('     - Customer authentication flow');
console.log('     - Dashboard integration links');

// 6. Generate Test Report
console.log('\n📊 6. TEST SUMMARY');
console.log('-'.repeat(40));

const totalChecks = Object.values(testResults.fileIntegrity).length +
                   Object.values(testResults.manifestValidation).length +
                   Object.values(testResults.uiComponents).length +
                   Object.values(testResults.authenticationFlow).length;

const passedChecks = Object.values(testResults.fileIntegrity).filter(Boolean).length +
                    Object.values(testResults.manifestValidation).filter(Boolean).length +
                    Object.values(testResults.uiComponents).filter(Boolean).length +
                    Object.values(testResults.authenticationFlow).filter(Boolean).length;

const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks (${successRate}%)`);
console.log(`❌ Failed: ${totalChecks - passedChecks} checks`);

// 7. Recommendations
if (testResults.recommendations.length > 0) {
  console.log('\n🔧 RECOMMENDATIONS');
  console.log('-'.repeat(40));
  testResults.recommendations.forEach(rec => console.log(`  ${rec}`));
}

// 8. Next Steps
console.log('\n🚀 NEXT STEPS');
console.log('-'.repeat(40));

if (successRate >= 90) {
  console.log(`
✅ Extension appears to be in good condition!

Immediate actions:
1. Load extension in Chrome for live testing
2. Test customer authentication with real Customer IDs
3. Verify directory automation functionality
4. Test error handling and edge cases
`);
} else if (successRate >= 70) {
  console.log(`
⚠️ Extension has some issues that need attention.

Priority fixes needed:
1. Address critical file and manifest issues
2. Fix missing UI components
3. Test authentication flow thoroughly
4. Verify API integrations
`);
} else {
  console.log(`
🚨 Extension has significant issues requiring immediate attention!

Critical actions required:
1. Fix all missing files and manifest issues
2. Repair broken UI components
3. Rebuild authentication system if necessary
4. Complete end-to-end testing before deployment
`);
}

console.log('\n📄 Detailed results saved to: customer-extension-test-results.json');

// Save detailed results
fs.writeFileSync('customer-extension-test-results.json', JSON.stringify(testResults, null, 2));

console.log('\n✅ Customer extension testing complete!');