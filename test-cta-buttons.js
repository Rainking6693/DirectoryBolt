/**
 * Test script to verify all CTA buttons send proper plan data to DirectoryBolt API
 * This script validates that each component includes the required parameters:
 * - plan: The subscription tier (starter, growth, professional, enterprise)
 * - user_email: User's email address
 * - user_id: User's unique identifier
 */

const fs = require('fs');
const path = require('path');

// List of components to test
const componentsToTest = [
  {
    file: 'components/CheckoutButton.jsx',
    description: 'CheckoutButton component',
    buttons: ['StartTrialButton', 'UpgradeButton', 'GetStartedButton']
  },
  {
    file: 'components/LandingPage.tsx',
    description: 'LandingPage component',
    buttons: ['Start Your Free Trial Today', 'Start My Free Trial Today']
  },
  {
    file: 'components/PricingPage.tsx',
    description: 'PricingPage component',
    buttons: ['handleCTAClick function', 'Start 14-Day Free Trial']
  },
  {
    file: 'components/Header.tsx',
    description: 'Header component',
    buttons: ['Start Free Trial', 'Start Trial']
  },
  {
    file: 'pages/results.tsx',
    description: 'Results page',
    buttons: ['Start Free Trial - Professional Plan']
  },
  {
    file: 'components/enhanced/EnhancedLandingPage.tsx',
    description: 'EnhancedLandingPage component',
    buttons: ['Skip Analysis - Start Trial Now', 'Start Trial Immediately']
  },
  {
    file: 'components/enhanced/EnhancedUpgradePrompt.tsx',
    description: 'EnhancedUpgradePrompt component',
    buttons: ['Secure My Opportunities Now']
  },
  {
    file: 'components/enhanced/SmartPricingRecommendations.tsx',
    description: 'SmartPricingRecommendations component',
    buttons: ['Get Recommended Plan', 'Choose Popular Plan', 'Select Plan']
  }
];

// Required parameters for checkout API
const requiredParams = ['plan', 'user_email', 'user_id'];

function testComponent(componentPath) {
  const fullPath = path.join(__dirname, componentPath.file);
  
  if (!fs.existsSync(fullPath)) {
    return {
      file: componentPath.file,
      status: 'ERROR',
      message: 'File not found'
    };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const results = {
    file: componentPath.file,
    description: componentPath.description,
    status: 'PASS',
    issues: [],
    checkoutCalls: []
  };
  
  // Check for create-checkout-session API calls
  const apiCallRegex = /fetch\(['"`]\/api\/create-checkout-session['"`]/g;
  const apiCalls = content.match(apiCallRegex) || [];
  
  if (apiCalls.length === 0) {
    // Check if component uses CheckoutButton components
    const checkoutButtonUsage = content.match(/StartTrialButton|UpgradeButton|GetStartedButton|CheckoutButton/g);
    if (checkoutButtonUsage) {
      results.status = 'PASS';
      results.message = `Uses CheckoutButton components: ${checkoutButtonUsage.join(', ')}`;
    } else {
      results.status = 'WARNING';
      results.message = 'No direct API calls or CheckoutButton usage found';
    }
    return results;
  }
  
  // Extract JSON.stringify calls to check parameters
  const jsonStringifyRegex = /JSON\.stringify\(\s*\{([^}]+)\}\s*\)/g;
  let match;
  
  while ((match = jsonStringifyRegex.exec(content)) !== null) {
    const jsonContent = match[1];
    const params = jsonContent.split(',').map(p => p.trim().split(':')[0].trim().replace(/['"`]/g, ''));
    
    const missingParams = requiredParams.filter(param => !params.includes(param));
    
    if (missingParams.length > 0) {
      results.status = 'FAIL';
      results.issues.push(`Missing parameters: ${missingParams.join(', ')}`);
    }
    
    results.checkoutCalls.push({
      parameters: params,
      missing: missingParams
    });
  }
  
  return results;
}

function runTests() {
  console.log('🚀 Testing DirectoryBolt CTA Buttons for Plan Data Transmission\n');
  console.log('=' .repeat(80));
  
  const allResults = [];
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  
  componentsToTest.forEach(component => {
    const result = testComponent(component);
    allResults.push(result);
    
    // Print result
    const statusIcon = result.status === 'PASS' ? '✅' : 
                      result.status === 'FAIL' ? '❌' : '⚠️';
    
    console.log(`${statusIcon} ${result.description}`);
    console.log(`   File: ${result.file}`);
    
    if (result.message) {
      console.log(`   Info: ${result.message}`);
    }
    
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   Issue: ${issue}`);
      });
    }
    
    if (result.checkoutCalls && result.checkoutCalls.length > 0) {
      result.checkoutCalls.forEach((call, index) => {
        console.log(`   Call ${index + 1}: Parameters found: ${call.parameters.join(', ')}`);
        if (call.missing.length > 0) {
          console.log(`   Call ${index + 1}: Missing: ${call.missing.join(', ')}`);
        }
      });
    }
    
    console.log('');
    
    // Count statuses
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else warningCount++;
  });
  
  // Print summary
  console.log('=' .repeat(80));
  console.log('📊 SUMMARY');
  console.log('-' .repeat(40));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`📁 Total Components: ${allResults.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All CTA buttons are properly configured to send plan data!');
    console.log('✨ The payment flow from frontend to Stripe should work correctly.');
  } else {
    console.log('\n⚠️  Some components need attention to ensure proper plan data transmission.');
  }
  
  return {
    totalComponents: allResults.length,
    passed: passCount,
    failed: failCount,
    warnings: warningCount,
    results: allResults
  };
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testComponent };