#!/bin/bash

# Enhanced Checkout Flow Test Script
# Tests the checkout API endpoints with add-ons

BASE_URL="http://localhost:3000"
TEST_EMAIL="test@directorybolt.com"

echo "🚀 Testing Enhanced Checkout Flow"
echo "=================================="

# Test 1: Starter Plan with Fast Track Add-on
echo ""
echo "Test 1: Starter Plan with Fast Track"
echo "------------------------------------"
curl -X POST "$BASE_URL/api/create-checkout-session-v3" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "starter",
    "addons": ["fasttrack"],
    "customerEmail": "'$TEST_EMAIL'",
    "metadata": {
      "customer_name": "Test User",
      "business_name": "Test Business LLC"
    }
  }' | jq '.'

echo ""
echo "Expected: $74 total ($49 starter + $25 fasttrack)"

# Test 2: Growth Plan with Multiple Add-ons
echo ""
echo ""
echo "Test 2: Growth Plan with Multiple Add-ons"
echo "-----------------------------------------"
curl -X POST "$BASE_URL/api/create-checkout-session-v3" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "growth",
    "addons": ["fasttrack", "premium", "qa"],
    "customerEmail": "'$TEST_EMAIL'",
    "metadata": {
      "customer_name": "Test User",
      "business_name": "Test Business LLC"
    }
  }' | jq '.'

echo ""
echo "Expected: $139 total ($89 growth + $25 + $15 + $10)"

# Test 3: Pro Plan with All Add-ons
echo ""
echo ""
echo "Test 3: Pro Plan with All Add-ons"
echo "--------------------------------"
curl -X POST "$BASE_URL/api/create-checkout-session-v3" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "addons": ["fasttrack", "premium", "qa", "csv"],
    "customerEmail": "'$TEST_EMAIL'",
    "metadata": {
      "customer_name": "Test User",
      "business_name": "Test Business LLC"
    }
  }' | jq '.'

echo ""
echo "Expected: $218 total ($159 pro + $25 + $15 + $10 + $9)"

# Test 4: Invalid Plan (should fail)
echo ""
echo ""
echo "Test 4: Invalid Plan (should fail)"
echo "---------------------------------"
curl -X POST "$BASE_URL/api/create-checkout-session-v3" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "invalid_plan",
    "addons": [],
    "customerEmail": "'$TEST_EMAIL'"
  }' | jq '.'

echo ""
echo "Expected: Error response"

# Test 5: Test Session Details Endpoint
echo ""
echo ""
echo "Test 5: Session Details Endpoint"
echo "-------------------------------"
echo "Testing with mock session ID (should return 404):"
curl "$BASE_URL/api/checkout-session-details?session_id=cs_test_mock123" | jq '.'

echo ""
echo ""
echo "✅ All tests completed!"
echo "Check the responses above to verify:"
echo "1. Sessions are created with correct totals"
echo "2. Add-ons are properly included"
echo "3. Invalid requests are rejected"
echo "4. Session details endpoint is functional"