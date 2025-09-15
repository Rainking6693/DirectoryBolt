/**
 * ELITE API - Google Sheets Connection Test
 * 
 * Tests the Google Sheets service to ensure it can connect and find customers
 */

const { createGoogleSheetsService } = require('./lib/services/google-sheets.js');

console.log('🔍 ELITE API - Testing Google Sheets Connection');
console.log('='.repeat(50));

async function testGoogleSheetsConnection() {
  try {
    // Step 1: Create service
    console.log('\n📊 Step 1: Creating Google Sheets service...');
    const service = createGoogleSheetsService();
    console.log('✅ Service created successfully');
    
    // Step 2: Test initialization
    console.log('\n🔄 Step 2: Initializing service...');
    await service.initialize();
    console.log('✅ Service initialized successfully');
    
    // Step 3: Test health check
    console.log('\n🏥 Step 3: Running health check...');
    const healthCheck = await service.healthCheck();
    console.log(`${healthCheck ? '✅' : '❌'} Health check: ${healthCheck ? 'PASSED' : 'FAILED'}`);
    
    if (!healthCheck) {
      throw new Error('Health check failed - cannot proceed with customer tests');
    }
    
    // Step 4: Test customer lookup
    console.log('\n🔍 Step 4: Testing customer lookup...');
    const testCustomerIds = [
      'DIR-20250914-000001',  // Target customer from requirements
      'DIR-2025-001234',      // Test customer
      'TEST-CUSTOMER-123'     // Development customer
    ];
    
    let foundCustomers = 0;
    
    for (const customerId of testCustomerIds) {
      try {
        console.log(`\n   Testing: ${customerId}`);
        const customer = await service.findByCustomerId(customerId);
        
        if (customer) {
          foundCustomers++;
          console.log('   ✅ FOUND:', {
            customerId: customer.customerId || customer.customerID,
            businessName: customer.businessName,
            packageType: customer.packageType,
            submissionStatus: customer.submissionStatus
          });
        } else {
          console.log('   ❌ NOT FOUND');
        }
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
      }
    }
    
    // Step 5: Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Found ${foundCustomers} out of ${testCustomerIds.length} test customers`);
    
    if (foundCustomers > 0) {
      console.log('✅ Google Sheets connection is working!');
      console.log('✅ Customer data is accessible');
      console.log('✅ API endpoint should work correctly');
    } else {
      console.log('⚠️  No customers found - this could mean:');
      console.log('   1. Google Sheets is empty');
      console.log('   2. Customer IDs don\'t exist in the sheet');
      console.log('   3. Column mapping is incorrect');
      console.log('   4. Search logic needs adjustment');
    }
    
  } catch (error) {
    console.error('\n💥 Google Sheets connection test failed:', error.message);
    console.error('Full error:', error.stack);
    
    // Diagnostic information
    console.log('\n🔧 DIAGNOSTIC INFORMATION:');
    
    // Check service account file
    const fs = require('fs');
    const path = require('path');
    const serviceAccountPath = path.join(process.cwd(), 'config', 'google-service-account.json');
    
    console.log(`Service account file exists: ${fs.existsSync(serviceAccountPath)}`);
    console.log(`Service account path: ${serviceAccountPath}`);
    
    // Check environment variables
    console.log('Environment variables:', {
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_PRIVATE_KEY_LENGTH: (process.env.GOOGLE_PRIVATE_KEY || '').length
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

// Add test customers to Google Sheets (if needed)
async function addTestCustomers() {
  try {
    console.log('\n➕ Adding test customers to Google Sheets...');
    
    const service = createGoogleSheetsService();
    await service.initialize();
    
    const testCustomers = [
      {
        customerId: 'DIR-20250914-000001',
        businessName: 'Elite Test Business',
        firstName: 'Elite',
        lastName: 'Customer',
        email: 'elite@test.com',
        packageType: 'professional',
        submissionStatus: 'pending'
      },
      {
        customerId: 'DIR-2025-001234',
        businessName: 'Test Business 1',
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test1@test.com',
        packageType: 'starter',
        submissionStatus: 'pending'
      },
      {
        customerId: 'TEST-CUSTOMER-123',
        businessName: 'Development Test Business',
        firstName: 'Dev',
        lastName: 'Customer',
        email: 'dev@test.com',
        packageType: 'growth',
        submissionStatus: 'pending'
      }
    ];
    
    for (const customer of testCustomers) {
      try {
        // Check if customer already exists
        const existing = await service.findByCustomerId(customer.customerId);
        if (existing) {
          console.log(`   ✅ Customer ${customer.customerId} already exists`);
        } else {
          // Create new customer
          const result = await service.createBusinessSubmission(customer);
          console.log(`   ✅ Created customer ${customer.customerId}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to create ${customer.customerId}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Failed to add test customers:', error.message);
  }
}

// Main execution
async function main() {
  await testGoogleSheetsConnection();
  
  // Uncomment to add test customers if they don't exist
  // await addTestCustomers();
}

if (require.main === module) {
  main();
}

module.exports = {
  testGoogleSheetsConnection,
  addTestCustomers
};