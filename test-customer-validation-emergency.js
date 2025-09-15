/**
 * JASON - EMERGENCY CUSTOMER VALIDATION TEST
 * 
 * Tests the exact customer validation flow that's failing in production
 * Simulates the extension validation API call
 */

const { createGoogleSheetsService } = require('./lib/services/google-sheets.js');

async function testCustomerValidation() {
  console.log('🚨 JASON - EMERGENCY CUSTOMER VALIDATION TEST');
  console.log('=' .repeat(60));

  // Test customer IDs that are failing
  const testCustomerIds = [
    'DIR-2025-001234',
    'DIR-2025-005678',
    'DIR-2025-009012',
    'TEST-CUSTOMER-123'
  ];

  for (const customerId of testCustomerIds) {
    console.log(`\n🔍 Testing customer ID: ${customerId}`);
    console.log('-' .repeat(40));

    try {
      // Step 1: Create service (same as API)
      console.log('1. Creating Google Sheets service...');
      const googleSheetsService = createGoogleSheetsService();
      console.log('   ✅ Service created');

      // Step 2: Initialize service (same as API)
      console.log('2. Initializing service...');
      await googleSheetsService.initialize();
      console.log('   ✅ Service initialized');

      // Step 3: Find customer (same as API)
      console.log('3. Looking up customer...');
      const customer = await googleSheetsService.findByCustomerId(customerId);

      if (customer) {
        console.log('   ✅ CUSTOMER FOUND:', {
          customerId: customer.customerId || customer.customerID,
          businessName: customer.businessName,
          packageType: customer.packageType,
          submissionStatus: customer.submissionStatus
        });

        // Step 4: Validate customer status (same as API)
        const validStatuses = ['pending', 'in-progress', 'completed'];
        if (validStatuses.includes(customer.submissionStatus)) {
          console.log('   ✅ Customer status valid');
        } else {
          console.log('   ❌ Customer status invalid:', customer.submissionStatus);
        }

        // Step 5: Check package type (same as API)
        if (customer.packageType) {
          console.log('   ✅ Package type valid:', customer.packageType);
        } else {
          console.log('   ❌ No package type found');
        }

        console.log('   🎉 VALIDATION WOULD SUCCEED');

      } else {
        console.log('   ❌ CUSTOMER NOT FOUND - This is the issue!');
        
        // Try alternative search methods
        console.log('   🔄 Trying alternative search methods...');
        
        // Try health check
        const healthCheck = await googleSheetsService.healthCheck();
        console.log(`   Health check: ${healthCheck ? 'PASSED' : 'FAILED'}`);
        
        if (!healthCheck) {
          console.log('   💥 Google Sheets connection is broken!');
        }
      }

    } catch (error) {
      console.log('   💥 VALIDATION FAILED:', error.message);
      console.log('   Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 300)
      });

      // Check configuration
      const fs = require('fs');
      const path = require('path');
      const serviceAccountPath = path.join(process.cwd(), 'config', 'google-service-account.json');
      
      console.log('   🔧 Configuration check:', {
        serviceAccountFileExists: fs.existsSync(serviceAccountPath),
        hasGoogleSheetId: !!process.env.GOOGLE_SHEET_ID,
        hasServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY
      });
    }
  }

  console.log('\n🎯 EMERGENCY TEST COMPLETE');
  console.log('If customers are not found but service initializes, the issue is in the search logic.');
  console.log('If service fails to initialize, the issue is in the Google Sheets connection.');
}

// Simulate the exact API validation request
async function simulateAPIValidation(customerId) {
  console.log(`\n🌐 SIMULATING API VALIDATION FOR: ${customerId}`);
  console.log('-' .repeat(50));

  try {
    // This is exactly what the API does
    const googleSheetsService = createGoogleSheetsService();
    await googleSheetsService.initialize();
    const customer = await googleSheetsService.findByCustomerId(customerId);

    if (!customer) {
      console.log('❌ API WOULD RETURN: Customer not found');
      return {
        valid: false,
        error: 'Customer not found'
      };
    }

    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(customer.submissionStatus)) {
      console.log('❌ API WOULD RETURN: Customer account is not active');
      return {
        valid: false,
        error: 'Customer account is not active'
      };
    }

    if (!customer.packageType) {
      console.log('❌ API WOULD RETURN: No active package found');
      return {
        valid: false,
        error: 'No active package found'
      };
    }

    console.log('✅ API WOULD RETURN: Valid customer');
    return {
      valid: true,
      customerName: customer.businessName,
      packageType: customer.packageType
    };

  } catch (error) {
    console.log('❌ API WOULD RETURN: Internal server error');
    return {
      valid: false,
      error: 'Internal server error'
    };
  }
}

// Run tests
async function runEmergencyTests() {
  await testCustomerValidation();
  
  // Test specific customer ID that's failing
  await simulateAPIValidation('DIR-2025-001234');
}

runEmergencyTests();