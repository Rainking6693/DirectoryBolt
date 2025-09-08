# 🔧 **STRIPE TEST PRODUCTS SETUP GUIDE**

## ⚠️ **CRITICAL ISSUE IDENTIFIED**

The test failed because you have **live Stripe price IDs** in your `.env.local` file, but you're using **test API keys**. This mismatch causes the error:

```
❌ No such price: 'price_1S489TPQdMywmVkHFBCQrAlV'; a similar object exists in live mode, but a test mode key was used to make this request.
```

## 🛠️ **SOLUTION: CREATE TEST PRODUCTS**

You need to create **test mode products** in your Stripe dashboard to match your test API keys.

### **STEP 1: Access Stripe Test Dashboard**

1. Go to https://dashboard.stripe.com/test/products
2. Make sure you're in **TEST MODE** (toggle in top left should say "Test")
3. You should see "No products" if you haven't created any test products yet

### **STEP 2: Create Test Products**

Create these 4 products in **test mode**:

#### **Product 1: DirectoryBolt Starter Intelligence**
- Click "Add product"
- **Name:** DirectoryBolt Starter Intelligence
- **Description:** AI Business Profile Analysis with 100 Directory Opportunities
- **Pricing:** One-time payment
- **Price:** $149.00 USD
- Click "Save product"
- **Copy the Price ID** (price_1S4WsHPQdMywmVkHWCiGHgok)

#### **Product 2: DirectoryBolt Growth Intelligence**
- Click "Add product"
- **Name:** DirectoryBolt Growth Intelligence
- **Description:** Complete AI Business Intelligence with 250+ Directory Opportunities
- **Pricing:** One-time payment
- **Price:** $299.00 USD
- Click "Save product"
- **Copy the Price ID** (price_1S4Wt6PQdMywmVkHnnLIF8YO)

#### **Product 3: DirectoryBolt Professional Intelligence**
- Click "Add product"
- **Name:** DirectoryBolt Professional Intelligence
- **Description:** Advanced AI Analysis with 400+ Directory Opportunities
- **Pricing:** One-time payment
- **Price:** $499.00 USD
- Click "Save product"
- **Copy the Price ID** (price_1S4WtiPQdMywmVkHtIDZoS4d)

#### **Product 4: DirectoryBolt Enterprise Intelligence**
- Click "Add product"
- **Name:** DirectoryBolt Enterprise Intelligence
- **Description:** Enterprise AI Suite with 500+ Directory Opportunities
- **Pricing:** One-time payment
- **Price:** $799.00 USD
- Click "Save product"
- **Copy the Price ID** (price_1S4Wu8PQdMywmVkHnPPjzRoH)

### **STEP 3: Update .env.local File**

Replace the placeholder price IDs in your `.env.local` file:

```bash
# Replace these placeholder values with your actual test price IDs:
STRIPE_STARTER_PRICE_ID=price_test_YOUR_ACTUAL_STARTER_ID
STRIPE_GROWTH_PRICE_ID=price_test_YOUR_ACTUAL_GROWTH_ID
STRIPE_PROFESSIONAL_PRICE_ID=price_test_YOUR_ACTUAL_PROFESSIONAL_ID
STRIPE_ENTERPRISE_PRICE_ID=price_test_YOUR_ACTUAL_ENTERPRISE_ID
```

### **STEP 4: Verify Test Setup**

After updating the price IDs, run the test again:

```bash
npm run test:protocol
```

You should now see:
```
✅ Starter tier: $149.00 USD
✅ Growth tier: $299.00 USD
✅ Professional tier: $499.00 USD
✅ Enterprise tier: $799.00 USD
```

## 🔄 **ALTERNATIVE: QUICK TEST WITH EXISTING PRODUCTS**

If you want to test immediately without creating new products, you can:

1. **Switch to Live Mode Testing:**
   - Use your live Stripe keys instead of test keys
   - **⚠️ WARNING:** This will process real payments!

2. **Or Create Simple Test Products:**
   - Create one test product for $1.00
   - Use the same price ID for all tiers temporarily
   - This allows testing the integration without real pricing

## 📋 **VERIFICATION CHECKLIST**

After setup, verify:
- [ ] All 4 test products created in Stripe test dashboard
- [ ] All price IDs start with `price_test_`
- [ ] Price IDs updated in `.env.local`
- [ ] Test API keys are being used (not live keys)
- [ ] Webhook endpoint points to your ngrok URL

## 🎯 **EXPECTED TEST RESULTS**

Once properly configured, you should see:

```
🎉 ALL INTEGRATION TESTS PASSED!
✅ DirectoryBolt is fully functional
✅ AI analysis is working correctly
✅ Stripe payments are configured
✅ All APIs are responding
✅ Complete workflow is operational

🚀 READY FOR PRODUCTION LAUNCH!
```

## 🚨 **TROUBLESHOOTING**

**If tests still fail:**

1. **Double-check test mode:** Ensure you're in Stripe test mode when creating products
2. **Verify price IDs:** Make sure they start with `price_test_` not `price_`
3. **Check API keys:** Ensure you're using test keys (`sk_test_` and `pk_test_`)
4. **Restart server:** After updating `.env.local`, restart your dev server

**Common mistakes:**
- ❌ Creating products in live mode instead of test mode
- ❌ Using live price IDs with test API keys
- ❌ Forgetting to restart the development server after updating `.env.local`

## 🎉 **NEXT STEPS**

Once the Stripe test setup is complete:

1. **Run comprehensive tests:** `npm run test:protocol`
2. **Verify all tests pass**
3. **Deploy to production** with live Stripe keys
4. **Create live products** matching the test setup

**You're almost there! Just need to create the test products in Stripe and update the price IDs.** 🚀