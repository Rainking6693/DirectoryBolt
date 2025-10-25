// Simple test script to test the webhook function directly
const { handler } = require('./netlify/functions/stripe-webhook');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Mock event
const event = {
  "id": "evt_test_1761417209123",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1761417209,
  "data": {
    "object": {
      "id": "cs_test_123456789",
      "object": "checkout.session",
      "amount_total": 29900,
      "currency": "usd",
      "customer": "cus_test123456789",
      "customer_details": {
        "email": "test@example.com",
        "name": "Test Customer",
        "phone": "+1 (555) 123-4567",
        "address": {
          "line1": "123 Test Street",
          "city": "Test City",
          "state": "TS",
          "postal_code": "12345",
          "country": "US"
        }
      },
      "metadata": {
        "business_name": "Test Business LLC",
        "website": "https://testbusiness.com",
        "package_type": "growth"
      },
      "mode": "payment",
      "payment_status": "paid",
      "status": "complete"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_1761417209123",
    "idempotency_key": "key_1761417209123"
  },
  "type": "checkout.session.completed"
};

// Test the handler
handler({
  httpMethod: 'POST',
  headers: {
    'stripe-signature': 't=1761417209,v1=d9d52d8ad0d9ad666ed8440bfb7fe636258c8c705281997370d1bb09affaf243'
  },
  body: JSON.stringify(event)
}, {}).then(response => {
  console.log('Response:', response);
}).catch(error => {
  console.error('Error:', error);
});