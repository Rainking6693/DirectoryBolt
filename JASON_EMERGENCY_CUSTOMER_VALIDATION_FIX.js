/**
 * JASON - EMERGENCY CUSTOMER VALIDATION DIAGNOSTIC & FIX
 * 
 * CRITICAL ISSUE: Extension validation failing with "Customer ID not found"
 * Even though customer exists in Google Sheets and ID format is correct
 * 
 * ROOT CAUSE: Google Sheets connection failing in production Netlify environment
 * LIKELY ISSUE: Service account file path/access in serverless environment
 */

const { createGoogleSheetsService } = require('./lib/services/google-sheets.js');
const fs = require('fs');
const path = require('path');

console.log('🚨 JASON - EMERGENCY CUSTOMER VALIDATION DIAGNOSTIC');
console.log('=' .repeat(70));

async function emergencyDiagnostic() {
  try {
    // 1. Check service account file accessibility
    console.log('📁 STEP 1: Checking service account file...');
    const serviceAccountPath = path.join(process.cwd(), 'config', 'google-service-account.json');
    console.log(`Service account path: ${serviceAccountPath}`);
    console.log(`File exists: ${fs.existsSync(serviceAccountPath)}`);
    
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const content = fs.readFileSync(serviceAccountPath, 'utf8');
        const parsed = JSON.parse(content);
        console.log('✅ Service account file readable:', {
          type: parsed.type,
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          has_private_key: !!parsed.private_key,
          private_key_length: parsed.private_key?.length || 0
        });
      } catch (error) {
        console.error('❌ Service account file parse error:', error.message);
      }
    } else {
      console.error('❌ Service account file not found!');
    }

    // 2. Test Google Sheets service creation
    console.log('\n📊 STEP 2: Testing Google Sheets service creation...');
    const service = createGoogleSheetsService();
    console.log('✅ Service created');

    // 3. Test service initialization
    console.log('\n🔄 STEP 3: Testing service initialization...');
    try {
      await service.initialize();
      console.log('✅ Service initialized successfully');
    } catch (initError) {
      console.error('❌ Service initialization failed:', initError.message);
      console.error('Full error:', initError.stack);
      
      // Try fallback to environment variables
      console.log('\n🔄 STEP 3b: Testing environment variable fallback...');
      console.log('Environment variables:', {
        GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
        GOOGLE_PRIVATE_KEY_LENGTH: (process.env.GOOGLE_PRIVATE_KEY || '').length
      });
      
      throw initError;
    }

    // 4. Test customer lookup with specific ID
    console.log('\n🔍 STEP 4: Testing customer lookup...');
    const testCustomerIds = [
      'DIR-2025-001234',
      'DIR-2025-005678',
      'TEST-CUSTOMER-123'
    ];

    for (const customerId of testCustomerIds) {
      try {
        console.log(`\nTesting customer ID: ${customerId}`);
        const customer = await service.findByCustomerId(customerId);
        
        if (customer) {
          console.log('✅ Customer found:', {
            customerId: customer.customerId || customer.customerID,
            businessName: customer.businessName,
            packageType: customer.packageType,
            submissionStatus: customer.submissionStatus
          });
        } else {
          console.log('❌ Customer not found');
        }
      } catch (lookupError) {
        console.error(`❌ Customer lookup failed for ${customerId}:`, lookupError.message);
      }
    }

    // 5. Test health check
    console.log('\n🏥 STEP 5: Testing health check...');
    const healthCheck = await service.healthCheck();
    console.log(`Health check result: ${healthCheck ? '✅ PASSED' : '❌ FAILED'}`);

    console.log('\n🎯 DIAGNOSTIC COMPLETE');
    
  } catch (error) {
    console.error('\n💥 EMERGENCY DIAGNOSTIC FAILED:', error.message);
    console.error('Full error:', error.stack);
    
    // Emergency fallback test
    console.log('\n🚨 EMERGENCY FALLBACK TEST...');
    testEmergencyFallback();
  }
}

function testEmergencyFallback() {
  console.log('Testing emergency fallback validation...');
  
  // Test customer ID patterns
  const testIds = ['DIR-2025-001234', 'DIR-2025-005678', 'TEST-CUSTOMER-123'];
  
  testIds.forEach(id => {
    const isValidFormat = id.match(/^(DIR-|TEST-|DB-)/);
    console.log(`${id}: ${isValidFormat ? '✅ Valid format' : '❌ Invalid format'}`);
  });
  
  // Check if we can create a mock response
  const mockCustomer = {
    customerId: 'DIR-2025-001234',
    businessName: 'Emergency Test Business',
    packageType: 'professional',
    submissionStatus: 'pending',
    fallback: true
  };
  
  console.log('Mock customer response:', mockCustomer);
}

// Run emergency diagnostic
emergencyDiagnostic();