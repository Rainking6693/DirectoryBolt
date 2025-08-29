# 🔧 Stripe Integration Debugging Guide

This comprehensive guide provides systematic debugging procedures for the DirectoryBolt Stripe integration. Use this when Cora's diagnostic shows low launch readiness scores due to Stripe issues.

## 🚀 Quick Start

Run the complete diagnostic suite:
```bash
npm run stripe:debug
```

Or run individual components:
```bash
# Environment validation
node scripts/stripe-environment-validator.js

# Product validation  
node scripts/stripe-product-validator.js

# API debugging
node scripts/stripe-api-debugger.js

# Complete test suite
node scripts/stripe-test-suite.js
```

## 📋 Issue Categories & Solutions

### 🚨 Critical Issues (Launch Blockers)

#### 1. Environment Configuration Errors

**Symptoms:**
- API returns "Payment system configuration error"
- Environment validator fails with critical errors
- Mock keys detected in production

**Diagnosis:**
```bash
node scripts/stripe-environment-validator.js
```

**Common Root Causes:**
- `STRIPE_SECRET_KEY` not set or invalid
- Key type mismatch (test key with live publishable key)
- Missing price ID environment variables

**Solutions:**
```bash
# Set proper environment variables
export STRIPE_SECRET_KEY="sk_live_..."  # or sk_test_ for testing
export STRIPE_PUBLISHABLE_KEY="pk_live_..."  # or pk_test_ for testing

# Set all price IDs
export STRIPE_STARTER_PRICE_ID="price_..."
export STRIPE_GROWTH_PRICE_ID="price_..."
export STRIPE_PROFESSIONAL_PRICE_ID="price_..."
export STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

#### 2. Stripe API Connection Failures

**Symptoms:**
- "Payment system is temporarily unavailable"
- Connection timeout errors
- Authentication failures

**Diagnosis:**
```bash
# Test direct API connection
node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
stripe.customers.list({limit: 1})
  .then(r => console.log('✅ Connection successful'))
  .catch(e => console.error('❌ Connection failed:', e.message));
"
```

**Solutions:**
1. Verify API key permissions in Stripe Dashboard
2. Check if API key is revoked or suspended
3. Ensure network connectivity (firewalls, proxies)
4. Verify API version compatibility (currently using 2024-06-20)

#### 3. Product/Price Configuration Issues

**Symptoms:**
- "Plan is not properly configured"
- Price not found errors
- Inactive price errors

**Diagnosis:**
```bash
node scripts/stripe-product-validator.js
```

**Solutions:**
1. Create missing products in Stripe Dashboard
2. Create price objects for each plan
3. Ensure prices are active (not archived)
4. Update environment variables with correct price IDs

### ⚠️ High Priority Issues

#### 1. API Endpoint Errors

**Symptoms:**
- Specific API tests failing
- Inconsistent response formats
- Validation errors

**Diagnosis:**
```bash
node scripts/stripe-api-debugger.js http://localhost:3000
```

**Common Issues & Fixes:**

| Error | Cause | Solution |
|-------|-------|----------|
| 400: Missing plan parameter | Frontend not sending required data | Check frontend payload structure |
| 400: Invalid plan | Plan name mismatch | Verify plan names match SUBSCRIPTION_PLANS |
| 500: Stripe error | Various Stripe issues | Check enhanced error logs |
| 503: Configuration error | Environment variables | Run environment validator |

#### 2. Payment Flow Issues

**Symptoms:**
- Checkout sessions created but no redirect URL
- Sessions expire immediately
- Customer creation failures

**Debug Steps:**
1. Check session creation logs in API endpoint
2. Verify customer email format
3. Test with different user data
4. Monitor Stripe Dashboard for session activity

### 💡 Medium Priority Issues

#### 1. Performance Issues
- Slow API responses
- Timeout errors
- Rate limiting

#### 2. Error Handling Issues
- Generic error messages
- Missing error details
- Poor user experience

## 🔍 Systematic Debugging Process

### Step 1: Environment Validation
```bash
# Run comprehensive environment check
node scripts/stripe-environment-validator.js

# Expected output:
# ✅ Valid Stripe secret key found: TEST mode
# ✅ Valid Stripe publishable key found: TEST mode  
# ✅ Keys are consistent: both are TEST keys
# ✅ Valid price ID for starter plan
```

### Step 2: Product Validation
```bash
# Validate Stripe products and prices
node scripts/stripe-product-validator.js

# This will:
# - Connect to Stripe API
# - Validate each price ID exists
# - Check price configuration matches expectations
# - List all products for reference
```

### Step 3: API Testing
```bash
# Test API endpoint functionality
node scripts/stripe-api-debugger.js

# This runs 15+ test scenarios including:
# - Valid requests
# - Invalid parameters  
# - Error handling
# - All subscription plans
```

### Step 4: Complete Analysis
```bash
# Run full diagnostic suite
node scripts/stripe-test-suite.js

# Provides:
# - Overall readiness score
# - Root cause analysis
# - Priority recommendations
# - Launch readiness assessment
```

## 📊 Understanding Test Results

### Score Interpretation
- **90-100%**: Production ready
- **80-89%**: Minor fixes needed
- **70-79%**: Major issues to resolve
- **<70%**: Not ready for production

### Launch Readiness Criteria
✅ All critical issues resolved  
✅ Environment properly configured  
✅ All price IDs valid and active  
✅ API tests >80% pass rate  
✅ No authentication errors  

## 🛠️ Common Fix Scenarios

### Scenario 1: New Project Setup
```bash
# 1. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Stripe keys

# 2. Validate configuration  
node scripts/stripe-environment-validator.js

# 3. Create products in Stripe Dashboard
# 4. Update price IDs in environment
# 5. Run full test suite
node scripts/stripe-test-suite.js
```

### Scenario 2: Production Deployment Issues
```bash
# 1. Check production environment variables
NODE_ENV=production node scripts/stripe-environment-validator.js

# 2. Validate live keys and prices
node scripts/stripe-product-validator.js

# 3. Test production API
node scripts/stripe-api-debugger.js https://your-domain.com
```

### Scenario 3: Development to Production Migration
```bash
# 1. Switch from test to live keys
export STRIPE_SECRET_KEY="sk_live_..."
export STRIPE_PUBLISHABLE_KEY="pk_live_..."

# 2. Update price IDs to live prices
export STRIPE_STARTER_PRICE_ID="price_live_..."
# ... etc for all plans

# 3. Validate migration
node scripts/stripe-test-suite.js
```

## 📝 Error Log Analysis

### Reading Enhanced Error Logs

The API endpoint now provides detailed error information:

```json
{
  "request_id": "checkout_1234567890_abc123",
  "error_message": "Price not found",
  "error_type": "StripeInvalidRequestError", 
  "error_code": "resource_missing",
  "environment": {
    "has_stripe_key": true,
    "stripe_key_type": "test",
    "node_env": "development"
  }
}
```

### Key Error Indicators

| Log Field | Meaning | Action |
|-----------|---------|---------|
| `has_stripe_key: false` | No API key set | Set STRIPE_SECRET_KEY |
| `stripe_key_type: "test"` | Using test environment | Switch to live keys for production |
| `error_code: "api_key_invalid"` | Authentication failed | Check API key validity |
| `error_code: "resource_missing"` | Price/product not found | Verify price IDs |

## 🔄 Continuous Monitoring

### Set Up Regular Health Checks
```bash
# Add to cron job for regular monitoring
0 */6 * * * cd /path/to/project && node scripts/stripe-environment-validator.js >> /var/log/stripe-health.log
```

### Monitoring Checklist
- [ ] Run diagnostics after environment changes
- [ ] Test before major deployments  
- [ ] Monitor error rates in production
- [ ] Validate after Stripe dashboard changes
- [ ] Check before marketing campaigns

## 🆘 Emergency Troubleshooting

### If Payments Completely Fail

1. **Immediate Actions:**
   ```bash
   # Quick health check
   curl -f https://your-domain.com/api/health
   
   # Test API endpoint
   curl -X POST https://your-domain.com/api/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"plan":"starter","user_email":"test@example.com","user_id":"test123"}'
   ```

2. **Emergency Diagnostics:**
   ```bash
   # Run rapid diagnostic
   node scripts/stripe-test-suite.js https://your-domain.com
   ```

3. **Rollback Checklist:**
   - Revert to previous environment variables
   - Check Stripe Dashboard for recent changes
   - Verify DNS/deployment hasn't changed
   - Test with previous working configuration

### Getting Help

1. **Check the reports:**
   - `stripe-comprehensive-test-report.json` - Full analysis
   - `stripe-validation-report.json` - Environment issues
   - `stripe-product-validation-report.json` - Product issues

2. **Provide this information when seeking help:**
   - Output from `node scripts/stripe-test-suite.js`
   - Recent error logs from API endpoint
   - Current environment configuration (sanitized)
   - Recent changes to Stripe Dashboard

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Environment Variables Best Practices](https://stripe.com/docs/keys)
- [Webhook Configuration](https://stripe.com/docs/webhooks)

---

**Last Updated:** 2025-08-28  
**Version:** 1.0.0  
**Maintainer:** DirectoryBolt Team