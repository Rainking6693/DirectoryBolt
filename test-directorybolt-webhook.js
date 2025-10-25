#!/usr/bin/env node

/**
 * Test script for DirectoryBolt Stripe Webhook
 * Simulates a checkout.session.completed event to test our webhook handler
 */

const crypto = require('crypto');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Mock checkout session data
const mockCheckoutSession = {
  id: 'cs_test_123456789',
  object: 'checkout.session',
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

// Create a mock Stripe event
const createMockEvent = (eventType, data) => {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: `key_${Date.now()}`
    },
    type: eventType
  };
};

// Generate a Stripe signature header
const generateSignature = (payload, secret, timestamp) => {
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
};

// Test the webhook
async function testWebhook() {
  console.log('🧪 Testing DirectoryBolt Stripe Webhook...\n');
  
  // Use a test webhook secret if not set
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret_for_testing';
  
  // Create mock event
  const event = createMockEvent('checkout.session.completed', mockCheckoutSession);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(event, webhookSecret, timestamp);
  
  console.log('📋 Event Details:');
  console.log(`   Event Type: ${event.type}`);
  console.log(`   Session ID: ${event.data.object.id}`);
  console.log(`   Customer: ${event.data.object.customer_details.email}`);
  console.log(`   Amount: $${(event.data.object.amount_total / 100).toFixed(2)}`);
  console.log(`   Package: ${event.data.object.metadata.package_type}`);
  
  // Write the event to a file for manual testing
  const eventFile = 'test-stripe-event.json';
  fs.writeFileSync(eventFile, JSON.stringify(event, null, 2));
  console.log(`\n💾 Event saved to ${eventFile}`);
  
  console.log('\n✅ Webhook test event generated successfully!');
  console.log('   To test the webhook manually:');
  console.log('   1. Start your Netlify dev server: netlify dev');
  console.log('   2. Send the test event with curl:');
  console.log(`      curl -X POST http://localhost:8888/.netlify/functions/stripe-webhook \\`);
  console.log(`           -H "Content-Type: application/json" \\`);
  console.log(`           -H "Stripe-Signature: ${signature}" \\`);
  console.log(`           -d @${eventFile}`);
  
  console.log('\n📝 Note: This test only generates the event data.');
  console.log('   You need to manually send it to the webhook endpoint to test the actual handler.');
  
  // Also create a simple test script that can be used to test the webhook directly
  const testScript = `
// Simple test script to test the webhook function directly
const { handler } = require('./netlify/functions/stripe-webhook');

// Mock event
const event = ${JSON.stringify(event, null, 2)};

// Generate signature
const crypto = require('crypto');
const timestamp = Math.floor(Date.now() / 1000);
const signature = '${signature}';

// Test the handler
handler({
  httpMethod: 'POST',
  headers: {
    'stripe-signature': signature
  },
  body: JSON.stringify(event)
}, {}).then(response => {
  console.log('Response:', response);
}).catch(error => {
  console.error('Error:', error);
});
`;
  
  fs.writeFileSync('test-webhook-direct.js', testScript);
  console.log(`\n💾 Direct test script saved to test-webhook-direct.js`);
  console.log('   Run with: node test-webhook-direct.js');
}

// Run the test
if (require.main === module) {
  testWebhook().catch(console.error);
}