# 🧪 **Comprehensive Testing Guide**

## **Quick Start Testing**

### **1. Basic Health Check**
```bash
# Start the server
npm run dev

# In another terminal, run basic tests
npm run test:ai                    # Test OpenAI integration
npm run test:pricing-tiers         # Test Stripe integration
```

## **AI Integration Testing**

### **2.1 Test OpenAI Services**
```bash
# Test AI business analyzer
npm run test:ai-integration

# Test AI accuracy across different business types
npm run test:ai-accuracy

# Test cost optimization
npm run test:cost-optimization
```

### **2.2 Manual AI Testing**
1. Go to http://localhost:3000
2. Enter test websites:
   - **SaaS:** `https://stripe.com`
   - **Restaurant:** `https://mcdonalds.com`
   - **E-commerce:** `https://shopify.com`
   - **Professional:** `https://mckinsey.com`

3. Verify AI generates:
   - Business categorization
   - Competitive analysis
   - Directory recommendations
   - SEO insights
   - Revenue projections

### **2.3 Expected AI Results**
**For SaaS Business:**
- Category: "Software/Technology"
- Directories: Product Hunt, G2, Capterra
- Success Probability: 70-90%
- Revenue Projection: $50K-200K

**For Restaurant:**
- Category: "Food & Beverage"
- Directories: Yelp, Google Business, TripAdvisor
- Success Probability: 80-95%
- Revenue Projection: $25K-100K

## **Stripe Payment Testing**

### **3.1 Test Payment Flows**
```bash
# Test all pricing tiers
npm run test:pricing-tiers

# Test conversion funnel
npm run test:conversion-funnel
```

### **3.2 Manual Payment Testing**
1. Go to http://localhost:3000/pricing
2. Click "Get Started" on Growth plan ($299)
3. Use test card details:
   - **Card:** `4242424242424242`
   - **Expiry:** Any future date
   - **CVC:** Any 3 digits
   - **ZIP:** Any 5 digits

4. Complete checkout
5. Verify:
   - Payment succeeds
   - Webhook receives event
   - Customer data is stored
   - Confirmation email sent (if configured)

### **3.3 Test Different Card Scenarios**
```bash
# Success card
4242424242424242

# Declined card
4000000000000002

# Requires authentication
4000002500003155

# Insufficient funds
4000000000009995
```

## **End-to-End Testing**

### **4.1 Complete User Journey**
```bash
# Test full user experience
npm run test:user-journey

# Test mobile responsiveness
npm run test:mobile
```

### **4.2 Manual E2E Testing**
**New User Flow:**
1. Visit homepage
2. Click "See Sample Analysis"
3. View demo results
4. Go to pricing page
5. Select Growth plan
6. Complete payment
7. Access enhanced business form
8. Submit business details
9. Receive AI analysis
10. Export PDF report

**Expected Timeline:** 5-10 minutes total

### **4.3 Performance Testing**
```bash
# Test system performance
npm run test:performance

# Test under load
npm run test:comprehensive
```

## **Webhook Testing**

### **5.1 Test Webhook Events**
1. Ensure ngrok is running: `ngrok http 3000`
2. Complete a test payment
3. Check webhook logs in terminal
4. Verify events in Stripe dashboard

### **5.2 Expected Webhook Events**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "amount_total": 29900,
      "customer": "cus_...",
      "metadata": {
        "plan": "growth"
      }
    }
  }
}
```

## **Error Testing**

### **6.1 Test Error Scenarios**
**OpenAI Errors:**
- Invalid API key
- Rate limiting
- Network timeouts

**Stripe Errors:**
- Invalid price IDs
- Webhook signature failures
- Payment declines

### **6.2 Error Handling Verification**
1. Temporarily use invalid API keys
2. Verify graceful error messages
3. Check error logging
4. Restore valid keys

## **Production Testing Checklist**

### **7.1 Pre-Launch Tests**
- [ ] All API keys are production keys
- [ ] Webhook endpoint uses HTTPS
- [ ] SSL certificate is valid
- [ ] Error monitoring is active
- [ ] Usage limits are set

### **7.2 Live Testing (with real money)**
1. Use real credit card with small amount
2. Complete full purchase flow
3. Verify all systems work
4. Refund test transaction

## **Monitoring & Analytics**

### **8.1 Set Up Monitoring**
```bash
# Monitor API usage
# OpenAI: https://platform.openai.com/usage
# Stripe: https://dashboard.stripe.com/logs

# Set up alerts for:
# - High API usage
# - Payment failures
# - Error rates
```

### **8.2 Key Metrics to Track**
- **Conversion Rate:** Free → Paid
- **AI Analysis Success Rate:** >95%
- **Payment Success Rate:** >98%
- **Average Response Time:** <3 seconds
- **Error Rate:** <1%

## **Troubleshooting Guide**

### **Common Issues & Solutions**

**"OpenAI API Error"**
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API directly
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

**"Stripe Payment Failed"**
```bash
# Check webhook logs
# Verify price IDs exist
# Test with different cards
```

**"Analysis Not Working"**
```bash
# Check website is accessible
# Verify Puppeteer can load site
# Test with different URLs
```

**"Webhook Not Receiving Events"**
```bash
# Verify ngrok is running
# Check webhook URL in Stripe
# Test webhook signature
```

## **Performance Optimization**

### **9.1 Speed Improvements**
- Cache AI analysis results
- Optimize image loading
- Minimize API calls
- Use CDN for static assets

### **9.2 Cost Optimization**
- Set OpenAI usage limits
- Cache expensive operations
- Monitor API costs daily
- Optimize prompt efficiency

## **Security Testing**

### **10.1 Security Checklist**
- [ ] API keys are not exposed in client code
- [ ] Webhook signatures are verified
- [ ] Input validation is implemented
- [ ] Rate limiting is active
- [ ] HTTPS is enforced

### **10.2 Security Tests**
```bash
# Run security validation
npm run security-test

# Check for exposed secrets
# Test input sanitization
# Verify CORS settings
```