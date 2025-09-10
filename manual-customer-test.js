/**
 * MANUAL CUSTOMER VALIDATION TEST
 * Quick test of the real customer ID without external dependencies
 */

const REAL_CUSTOMER_ID = 'DIR-202597-recwsFS91NG2O90xi';

async function testCustomerValidation() {
    console.log('🔍 MANUAL CUSTOMER VALIDATION TEST');
    console.log(`Testing Customer ID: ${REAL_CUSTOMER_ID}`);
    console.log('='.repeat(50));

    const findings = [];

    // Test 1: Customer ID Format Validation
    console.log('\n1. Testing Customer ID Format...');
    const customerIdPattern = /^DIR-\d{6}-[a-zA-Z0-9]+$/;
    if (customerIdPattern.test(REAL_CUSTOMER_ID)) {
        findings.push({ test: 'Customer ID Format', status: 'PASS', details: 'Format is valid' });
        console.log('✅ Customer ID format is valid');
    } else {
        findings.push({ test: 'Customer ID Format', status: 'FAIL', details: 'Invalid format' });
        console.log('❌ Customer ID format is invalid');
    }

    // Test 2: Environment Variables Check
    console.log('\n2. Checking Environment Variables...');
    const requiredEnvVars = [
        'AIRTABLE_ACCESS_TOKEN',
        'AIRTABLE_BASE_ID', 
        'AIRTABLE_TABLE_NAME'
    ];

    let envValid = true;
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (!value || value.includes('your_') || value.includes('here')) {
            findings.push({ test: `Environment - ${envVar}`, status: 'FAIL', details: 'Not configured or using placeholder' });
            console.log(`❌ ${envVar}: Not properly configured`);
            envValid = false;
        } else {
            findings.push({ test: `Environment - ${envVar}`, status: 'PASS', details: 'Configured' });
            console.log(`✅ ${envVar}: Configured`);
        }
    }

    // Test 3: Check if this appears to be test vs real data
    console.log('\n3. Analyzing Customer ID characteristics...');
    const customerIdParts = REAL_CUSTOMER_ID.split('-');
    const year = customerIdParts[1]?.substring(0, 4);
    const timestamp = customerIdParts[1]?.substring(4);
    const suffix = customerIdParts[2];

    findings.push({ 
        test: 'Customer ID Analysis', 
        status: 'INFO', 
        details: `Year: ${year}, Timestamp: ${timestamp}, Suffix: ${suffix}` 
    });

    console.log(`   Year component: ${year}`);
    console.log(`   Timestamp component: ${timestamp}`);
    console.log(`   Suffix: ${suffix}`);

    if (year === '2025' || year === '2024') {
        findings.push({ test: 'Customer ID Validity', status: 'PASS', details: 'Recent customer ID' });
        console.log('✅ Customer ID appears to be recent/valid');
    } else {
        findings.push({ test: 'Customer ID Validity', status: 'WARN', details: 'Unusual year component' });
        console.log('⚠️ Customer ID has unusual year component');
    }

    // Test 4: Field Mapping Check (static analysis)
    console.log('\n4. Checking Field Mapping in Code...');
    const fs = require('fs');
    try {
        const airtableService = fs.readFileSync('./lib/services/airtable.ts', 'utf8');
        
        if (airtableService.includes('businessName:')) {
            findings.push({ test: 'Field Mapping - businessName', status: 'PASS', details: 'businessName field found in schema' });
            console.log('✅ businessName field found in Airtable service');
        } else {
            findings.push({ test: 'Field Mapping - businessName', status: 'FAIL', details: 'businessName field not found' });
            console.log('❌ businessName field not found in Airtable service');
        }

        if (airtableService.includes('business_name:')) {
            findings.push({ test: 'Field Mapping - Old Format', status: 'WARN', details: 'Old business_name field still present' });
            console.log('⚠️ Old business_name field still present');
        } else {
            findings.push({ test: 'Field Mapping - Clean Schema', status: 'PASS', details: 'No old field mappings found' });
            console.log('✅ No old business_name field found');
        }

    } catch (error) {
        findings.push({ test: 'Field Mapping Check', status: 'FAIL', details: `Could not read Airtable service: ${error.message}` });
        console.log(`❌ Could not read Airtable service: ${error.message}`);
    }

    // Test 5: API Endpoint Structure Check
    console.log('\n5. Checking API Endpoint Structure...');
    try {
        const validateEndpoint = fs.readFileSync('./pages/api/extension/validate.ts', 'utf8');
        
        if (validateEndpoint.includes('findByCustomerId')) {
            findings.push({ test: 'API - Customer Lookup', status: 'PASS', details: 'Customer lookup function found' });
            console.log('✅ Customer lookup function found in validation endpoint');
        } else {
            findings.push({ test: 'API - Customer Lookup', status: 'FAIL', details: 'Customer lookup function not found' });
            console.log('❌ Customer lookup function not found');
        }

        if (validateEndpoint.includes('businessName')) {
            findings.push({ test: 'API - Field Usage', status: 'PASS', details: 'businessName field used in API' });
            console.log('✅ businessName field used in validation endpoint');
        } else {
            findings.push({ test: 'API - Field Usage', status: 'WARN', details: 'businessName field not used in API response' });
            console.log('⚠️ businessName field not found in API response');
        }

    } catch (error) {
        findings.push({ test: 'API Endpoint Check', status: 'FAIL', details: `Could not read validation endpoint: ${error.message}` });
        console.log(`❌ Could not read validation endpoint: ${error.message}`);
    }

    // Test 6: Security Issues from Static Analysis
    console.log('\n6. Basic Security Check...');
    
    // Check for debug endpoints
    const debugEndpoints = [
        './pages/api/debug.env.js',
        './pages/api/config.js',
        './pages/api/test.js'
    ];

    let debugIssues = 0;
    for (const endpoint of debugEndpoints) {
        if (fs.existsSync(endpoint)) {
            debugIssues++;
            findings.push({ test: `Security - Debug Endpoint`, status: 'FAIL', details: `Debug endpoint exists: ${endpoint}` });
            console.log(`❌ Debug endpoint found: ${endpoint}`);
        }
    }

    if (debugIssues === 0) {
        findings.push({ test: 'Security - Debug Endpoints', status: 'PASS', details: 'No debug endpoints found' });
        console.log('✅ No obvious debug endpoints found');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MANUAL TEST SUMMARY');
    console.log('='.repeat(50));

    const passed = findings.filter(f => f.status === 'PASS').length;
    const failed = findings.filter(f => f.status === 'FAIL').length;
    const warnings = findings.filter(f => f.status === 'WARN').length;

    console.log(`Total Tests: ${findings.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);

    console.log('\n🔍 KEY FINDINGS:');
    findings.forEach((finding, index) => {
        const emoji = finding.status === 'PASS' ? '✅' : finding.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${index + 1}. ${emoji} ${finding.test}: ${finding.details}`);
    });

    // Critical Issues Summary
    const criticalIssues = findings.filter(f => f.status === 'FAIL');
    if (criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES TO FIX:');
        criticalIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.test}: ${issue.details}`);
        });
    }

    // Recommendations
    console.log('\n📋 IMMEDIATE RECOMMENDATIONS:');
    
    if (!envValid) {
        console.log('1. Configure all required environment variables with real values');
    }
    
    if (debugIssues > 0) {
        console.log('2. Remove or secure debug endpoints before production');
    }
    
    console.log('3. Test with real Airtable connection to validate customer data');
    console.log('4. Verify authentication flow with the real customer ID');
    console.log('5. Check that extension returns correct business name and package type');

    // Blake Audit Readiness
    console.log('\n🎯 BLAKE AUDIT READINESS:');
    if (failed === 0 && envValid) {
        console.log('STATUS: READY for Blake\'s audit');
    } else if (failed <= 2) {
        console.log('STATUS: MOSTLY READY - minor fixes needed');
    } else {
        console.log('STATUS: NOT READY - multiple issues need resolution');
    }

    console.log(`Estimated fix time: ${failed === 0 ? '0-1 hours' : failed <= 2 ? '1-3 hours' : '3-6 hours'}`);

    return {
        summary: { total: findings.length, passed, failed, warnings },
        findings,
        criticalIssues,
        environmentValid: envValid,
        debugIssues,
        auditReady: failed === 0 && envValid
    };
}

// Run the test
if (require.main === module) {
    testCustomerValidation().then(result => {
        console.log('\n📄 Test completed. Check output above for detailed findings.');
        process.exit(result.auditReady ? 0 : 1);
    }).catch(error => {
        console.error('❌ Manual test failed:', error);
        process.exit(1);
    });
}

module.exports = testCustomerValidation;