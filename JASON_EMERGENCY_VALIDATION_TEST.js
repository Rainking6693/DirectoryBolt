/**
 * JASON - EMERGENCY VALIDATION TEST
 * 
 * Tests the exact customer validation that's failing in production
 * This simulates the extension API call to identify the root cause
 */

console.log('🚨 JASON - EMERGENCY CUSTOMER VALIDATION TEST');
console.log('=' .repeat(70));

async function emergencyValidationTest() {
  try {
    // Test the exact same flow as the extension validation API
    console.log('🔍 Step 1: Testing Google Sheets service creation...');
    const { createGoogleSheetsService } = require('./lib/services/google-sheets.js');
    const googleSheetsService = createGoogleSheetsService();
    console.log('✅ Service created successfully');

    console.log('\n🔄 Step 2: Testing service initialization...');
    await googleSheetsService.initialize();
    console.log('✅ Service initialized successfully');

    console.log('\n🏥 Step 3: Testing health check...');
    const healthCheck = await googleSheetsService.healthCheck();
    console.log(`${healthCheck ? '✅' : '❌'} Health check: ${healthCheck ? 'PASSED' : 'FAILED'}`);

    if (!healthCheck) {
      throw new Error('Health check failed - Google Sheets connection is broken');
    }

    // Test customer lookup with the exact customer ID that's failing
    console.log('\n🔍 Step 4: Testing customer lookup...');
    const testCustomerIds = [
      'DIR-2025-001234',
      'DIR-2025-005678',
      'TEST-CUSTOMER-123'
    ];

    let foundAnyCustomer = false;

    for (const customerId of testCustomerIds) {
      console.log(`\n   Testing: ${customerId}`);
      try {
        const customer = await googleSheetsService.findByCustomerId(customerId);
        
        if (customer) {
          console.log('   ✅ CUSTOMER FOUND:', {
            customerId: customer.customerId || customer.customerID,
            businessName: customer.businessName,
            packageType: customer.packageType,
            submissionStatus: customer.submissionStatus
          });
          foundAnyCustomer = true;

          // Test validation logic
          const validStatuses = ['pending', 'in-progress', 'completed'];
          const statusValid = validStatuses.includes(customer.submissionStatus);
          const hasPackage = !!customer.packageType;

          console.log(`   Status valid: ${statusValid ? '✅' : '❌'} (${customer.submissionStatus})`);
          console.log(`   Has package: ${hasPackage ? '✅' : '❌'} (${customer.packageType})`);

          if (statusValid && hasPackage) {
            console.log('   🎉 VALIDATION WOULD SUCCEED FOR THIS CUSTOMER');
          } else {
            console.log('   ❌ VALIDATION WOULD FAIL - Status or package issue');
          }
        } else {
          console.log('   ❌ Customer not found');
        }
      } catch (lookupError) {
        console.log(`   💥 Lookup failed: ${lookupError.message}`);
      }
    }

    if (!foundAnyCustomer) {
      console.log('\n💥 CRITICAL ISSUE: NO CUSTOMERS FOUND IN GOOGLE SHEETS');
      console.log('This means either:');
      console.log('1. The Google Sheets is empty');
      console.log('2. The search logic is broken');
      console.log('3. The sheet structure is wrong');
      
      // Try to get sheet info
      console.log('\n🔍 Checking sheet structure...');
      const sheet = googleSheetsService.sheet;
      if (sheet) {
        console.log('Sheet info:', {
          title: sheet.title,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount
        });

        // Try to get header row
        try {
          await sheet.loadHeaderRow();
          console.log('Headers:', sheet.headerValues);
        } catch (headerError) {
          console.log('Failed to load headers:', headerError.message);
        }

        // Try to get first few rows
        try {
          const rows = await sheet.getRows({ limit: 5 });
          console.log(`Found ${rows.length} rows in sheet`);
          if (rows.length > 0) {
            console.log('First row data:', rows[0]._rawData);
          }
        } catch (rowError) {
          console.log('Failed to get rows:', rowError.message);
        }
      }
    } else {
      console.log('\n✅ CUSTOMERS FOUND - Google Sheets connection is working');
      console.log('The issue might be with specific customer IDs or validation logic');
    }

    console.log('\n🎯 EMERGENCY TEST COMPLETE');

  } catch (error) {
    console.log('\n💥 EMERGENCY TEST FAILED:', error.message);
    console.log('Full error:', error.stack);

    // Check configuration
    const fs = require('fs');
    const path = require('path');
    const serviceAccountPath = path.join(process.cwd(), 'config', 'google-service-account.json');
    
    console.log('\n🔧 Configuration Diagnostic:');
    console.log(`Service account file exists: ${fs.existsSync(serviceAccountPath)}`);
    console.log(`Service account path: ${serviceAccountPath}`);
    console.log('Environment variables:', {
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY
    });

    if (fs.existsSync(serviceAccountPath)) {
      try {
        const content = fs.readFileSync(serviceAccountPath, 'utf8');
        const parsed = JSON.parse(content);
        console.log('Service account file structure:', {
          type: parsed.type,
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          has_private_key: !!parsed.private_key,
          private_key_length: parsed.private_key?.length || 0
        });
      } catch (e) {
        console.log('Failed to read service account file:', e.message);
      }
    }
  }
}

// Simulate the exact API validation request
async function simulateExtensionAPICall() {
  console.log('\n🌐 SIMULATING EXTENSION API CALL');
  console.log('=' .repeat(50));

  const customerId = 'DIR-2025-001234'; // Use the failing customer ID
  
  try {
    console.log(`Testing validation for: ${customerId}`);
    
    // This is exactly what the extension validation API does
    const { createGoogleSheetsService } = require('./lib/services/google-sheets.js');
    const googleSheetsService = createGoogleSheetsService();
    
    // Initialize service (this is where it might be failing)
    await googleSheetsService.initialize();
    
    // Find customer (this is where the "not found" error comes from)
    const customer = await googleSheetsService.findByCustomerId(customerId);

    if (!customer) {
      console.log('❌ API WOULD RETURN: Customer not found');
      console.log('This is the exact error the user is seeing!');
      return;
    }

    // Validate customer
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(customer.submissionStatus)) {
      console.log('❌ API WOULD RETURN: Customer account is not active');
      return;
    }

    if (!customer.packageType) {
      console.log('❌ API WOULD RETURN: No active package found');
      return;
    }

    console.log('✅ API WOULD RETURN: Valid customer');
    console.log('Response:', {
      valid: true,
      customerName: customer.businessName,
      packageType: customer.packageType
    });

  } catch (error) {
    console.log('❌ API WOULD RETURN: Internal server error');
    console.log('Error:', error.message);
  }
}

// Run emergency tests
async function runAllTests() {
  await emergencyValidationTest();
  await simulateExtensionAPICall();
}

runAllTests();