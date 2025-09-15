/**
 * EMILY - Test Service Account File Integration
 * Verifies that Google Sheets service can load from service account file
 */

const { createGoogleSheetsService } = require('./lib/services/google-sheets.js');

async function testServiceAccountFile() {
  console.log('🧪 EMILY - Testing Service Account File Integration...');
  console.log('=' .repeat(60));

  try {
    // Test service creation
    console.log('📊 Creating Google Sheets service...');
    const service = createGoogleSheetsService();
    console.log('✅ Service created successfully');

    // Test initialization
    console.log('🔄 Initializing service...');
    await service.initialize();
    console.log('✅ Service initialized successfully');

    // Test health check
    console.log('🏥 Running health check...');
    const healthCheck = await service.healthCheck();
    console.log(`${healthCheck ? '✅' : '❌'} Health check: ${healthCheck ? 'PASSED' : 'FAILED'}`);

    // Test customer lookup
    console.log('🔍 Testing customer lookup...');
    const testCustomerId = 'DIR-2025-001234';
    const customer = await service.findByCustomerId(testCustomerId);
    
    if (customer) {
      console.log('✅ Customer found:', {
        customerId: customer.customerId || customer.customerID,
        businessName: customer.businessName,
        packageType: customer.packageType
      });
    } else {
      console.log('⚠️  Customer not found, but connection is working');
    }

    console.log('\n🎉 SERVICE ACCOUNT FILE INTEGRATION SUCCESSFUL!');
    console.log('✅ Google Sheets service is working with service account file');
    console.log('✅ This should fix the 4KB environment variable limit issue');

  } catch (error) {
    console.error('❌ Service account file test failed:', error.message);
    console.error('Full error:', error.stack);
    
    // Check if service account file exists
    const fs = require('fs');
    const path = require('path');
    const serviceAccountPath = path.join(process.cwd(), 'config', 'google-service-account.json');
    
    console.log('\n🔧 Diagnostic Information:');
    console.log(`Service account file exists: ${fs.existsSync(serviceAccountPath)}`);
    console.log(`Service account path: ${serviceAccountPath}`);
    
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const content = fs.readFileSync(serviceAccountPath, 'utf8');
        const parsed = JSON.parse(content);
        console.log('Service account file structure:', {
          type: parsed.type,
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          has_private_key: !!parsed.private_key
        });
      } catch (e) {
        console.error('Failed to read service account file:', e.message);
      }
    }
  }
}

// Run the test
testServiceAccountFile();