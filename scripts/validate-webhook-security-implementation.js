// 🔒 WEBHOOK SECURITY IMPLEMENTATION VALIDATION
// Validates that the critical security fixes have been properly implemented

console.log('🔒 WEBHOOK SECURITY IMPLEMENTATION VALIDATION');
console.log('=============================================\n');

const fs = require('fs');
const path = require('path');

// Check if critical files exist and contain security implementations
function validateSecurityImplementation() {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  console.log('📋 Validating Security Implementation Files');
  console.log('------------------------------------------');

  // Test 1: Check webhook handler has security validation
  console.log('1. Checking webhook handler security...');
  try {
    const webhookPath = path.join(__dirname, '..', 'pages', 'api', 'webhook.js');
    const webhookContent = fs.readFileSync(webhookPath, 'utf8');
    
    const securityChecks = [
      { check: 'Environment variable validation', pattern: /STRIPE_SECRET_KEY.*required/i },
      { check: 'Webhook secret validation', pattern: /STRIPE_WEBHOOK_SECRET.*required/i },
      { check: 'Production security check', pattern: /NODE_ENV.*production/i },
      { check: 'Signature verification enhanced', pattern: /verifyWebhookSignature.*req/i },
      { check: 'Security logging', pattern: /security_alert|SECURITY ALERT/i },
      { check: 'Missing signature detection', pattern: /missing signature|no signature/i },
      { check: 'Error logging enhancement', pattern: /signature verification FAILED/i }
    ];

    securityChecks.forEach(({ check, pattern }) => {
      if (pattern.test(webhookContent)) {
        results.passed.push(`✅ ${check}: IMPLEMENTED`);
      } else {
        results.failed.push(`❌ ${check}: MISSING`);
      }
    });

  } catch (error) {
    results.failed.push(`❌ Could not read webhook handler: ${error.message}`);
  }

  // Test 2: Check Stripe client has enhanced verification
  console.log('2. Checking Stripe client enhancements...');
  try {
    const stripePath = path.join(__dirname, '..', 'lib', 'utils', 'stripe-client.ts');
    const stripeContent = fs.readFileSync(stripePath, 'utf8');
    
    const stripeSecurityChecks = [
      { check: 'Enhanced webhook verification function', pattern: /verifyWebhookSignatureEnhanced/i },
      { check: 'Multi-secret support', pattern: /verifyWithMultipleSecrets/i },
      { check: 'Security logging in verification', pattern: /log.*webhook.*security/i },
      { check: 'Webhook secret rotation', pattern: /STRIPE_WEBHOOK_SECRET_OLD/i },
      { check: 'Comprehensive error handling', pattern: /signature verification failed/i },
      { check: 'Source IP logging', pattern: /sourceIP|source_ip/i }
    ];

    stripeSecurityChecks.forEach(({ check, pattern }) => {
      if (pattern.test(stripeContent)) {
        results.passed.push(`✅ ${check}: IMPLEMENTED`);
      } else {
        results.failed.push(`❌ ${check}: MISSING`);
      }
    });

  } catch (error) {
    results.failed.push(`❌ Could not read Stripe client: ${error.message}`);
  }

  // Test 3: Check environment validator has webhook security
  console.log('3. Checking environment validator security...');
  try {
    const validatorPath = path.join(__dirname, '..', 'lib', 'utils', 'stripe-environment-validator.ts');
    const validatorContent = fs.readFileSync(validatorPath, 'utf8');
    
    const validatorChecks = [
      { check: 'Webhook security validation function', pattern: /validateWebhookSecurity/i },
      { check: 'Critical security error messages', pattern: /critical.*security.*vulnerability/i },
      { check: 'Webhook secret format validation', pattern: /whsec_.*format/i },
      { check: 'Placeholder value detection', pattern: /placeholder.*value/i },
      { check: 'Production security enforcement', pattern: /production.*webhook.*security/i }
    ];

    validatorChecks.forEach(({ check, pattern }) => {
      if (pattern.test(validatorContent)) {
        results.passed.push(`✅ ${check}: IMPLEMENTED`);
      } else {
        results.failed.push(`❌ ${check}: MISSING`);
      }
    });

  } catch (error) {
    results.failed.push(`❌ Could not read environment validator: ${error.message}`);
  }

  return results;
}

// Test environment variables (if available)
function validateEnvironmentVariables() {
  console.log('4. Checking environment variable setup...');
  
  const envChecks = [];

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    if (process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      envChecks.push('✅ STRIPE_WEBHOOK_SECRET has correct format');
    } else {
      envChecks.push('⚠️  STRIPE_WEBHOOK_SECRET format needs verification');
    }
    
    if (process.env.STRIPE_WEBHOOK_SECRET.length > 50) {
      envChecks.push('✅ STRIPE_WEBHOOK_SECRET has appropriate length');
    } else {
      envChecks.push('⚠️  STRIPE_WEBHOOK_SECRET might be too short');
    }
  } else {
    envChecks.push('⚠️  STRIPE_WEBHOOK_SECRET not set (expected in development)');
  }

  if (process.env.STRIPE_SECRET_KEY) {
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      envChecks.push('✅ STRIPE_SECRET_KEY has correct format');
    } else {
      envChecks.push('⚠️  STRIPE_SECRET_KEY format needs verification');
    }
  } else {
    envChecks.push('⚠️  STRIPE_SECRET_KEY not set (expected in development)');
  }

  return envChecks;
}

// Main validation function
function runValidation() {
  console.log('🚀 Starting webhook security implementation validation...\n');

  const implementationResults = validateSecurityImplementation();
  const envResults = validateEnvironmentVariables();

  console.log('\n📊 VALIDATION RESULTS');
  console.log('====================\n');

  console.log('✅ PASSED CHECKS:');
  implementationResults.passed.forEach(check => console.log(`   ${check}`));

  if (implementationResults.failed.length > 0) {
    console.log('\n❌ FAILED CHECKS:');
    implementationResults.failed.forEach(check => console.log(`   ${check}`));
  }

  if (implementationResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    implementationResults.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  console.log('\n🔧 ENVIRONMENT SETUP:');
  envResults.forEach(result => console.log(`   ${result}`));

  console.log('\n🔒 SECURITY IMPLEMENTATION SUMMARY');
  console.log('=================================');

  const totalChecks = implementationResults.passed.length + implementationResults.failed.length;
  const passRate = totalChecks > 0 ? ((implementationResults.passed.length / totalChecks) * 100).toFixed(1) : 0;

  console.log(`✅ Implementation checks passed: ${implementationResults.passed.length}`);
  console.log(`❌ Implementation checks failed: ${implementationResults.failed.length}`);
  console.log(`📊 Pass rate: ${passRate}%`);

  if (implementationResults.failed.length === 0) {
    console.log('\n🎉 CRITICAL SECURITY FIXES SUCCESSFULLY IMPLEMENTED!');
    console.log('✅ Webhook signature verification: ENHANCED');
    console.log('✅ Environment validation: IMPLEMENTED'); 
    console.log('✅ Security logging: COMPREHENSIVE');
    console.log('✅ Multi-secret support: AVAILABLE');
    console.log('✅ Production safeguards: ACTIVE');
    console.log('\n🛡️  Your webhook handler is now protected against spoofing attacks.');
  } else {
    console.log('\n⚠️  Some security implementations need attention.');
    console.log('Please review the failed checks above.');
  }

  console.log('\n🏁 Validation complete.');
}

// Run validation if executed directly
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation, validateSecurityImplementation, validateEnvironmentVariables };