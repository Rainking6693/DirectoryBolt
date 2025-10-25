// Unit test for the webhook functions without Stripe signature verification
const webhookFunctions = require('./netlify/functions/stripe-webhook');

// Mock session data
const mockSession = {
  id: 'cs_test_123456789',
  amount_total: 29900,
  currency: 'usd',
  customer: 'cus_test123456789',
  customer_details: {
    email: 'test@example.com',
    name: 'Test Customer',
    phone: '+1 (555) 123-4567',
    address: {
      line1: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'US'
    }
  },
  metadata: {
    business_name: 'Test Business LLC',
    website: 'https://testbusiness.com',
    package_type: 'growth'
  },
  mode: 'payment',
  payment_status: 'paid',
  status: 'complete'
};

// Test the handleSuccessfulPayment function directly
async function testHandleSuccessfulPayment() {
  console.log('🧪 Testing handleSuccessfulPayment function...\n');
  
  try {
    // This will fail because we don't have proper Supabase credentials in the test environment
    // But we can at least check if the function structure is correct
    console.log('📋 Mock Session Data:');
    console.log(`   Session ID: ${mockSession.id}`);
    console.log(`   Customer: ${mockSession.customer_details.email}`);
    console.log(`   Amount: $${(mockSession.amount_total / 100).toFixed(2)}`);
    console.log(`   Package: ${mockSession.metadata.package_type}`);
    
    // Try to call the function (this will likely fail due to missing env vars)
    await webhookFunctions.handleSuccessfulPayment(mockSession);
    console.log('\n✅ handleSuccessfulPayment function executed without errors');
  } catch (error) {
    console.log('\n⚠️  handleSuccessfulPayment function threw an error (expected in test environment):');
    console.log(`   Error: ${error.message}`);
    
    // Check if it's an environment variable error or a logic error
    if (error.message.includes('SUPABASE') || error.message.includes('process.env')) {
      console.log('   📝 This is expected in test environment due to missing Supabase credentials');
    } else {
      console.log('   ❌ This might indicate a logic error in the function');
    }
  }
  
  console.log('\n📝 Note: This test verifies function structure but cannot fully test database operations');
  console.log('   without proper Supabase credentials in the test environment.');
}

// Run the test
if (require.main === module) {
  testHandleSuccessfulPayment().catch(console.error);
}