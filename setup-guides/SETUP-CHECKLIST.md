# ✅ **MASTER SETUP CHECKLIST**

## **🎯 QUICK START (30 minutes)**

### **Phase 1: OpenAI Setup (10 minutes)**
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Create account and add payment method ($20 credit)
- [ ] Create API key named "DirectoryBolt Development"
- [ ] Copy key (starts with `sk-proj-` or `sk-`)
- [ ] Add to `.env.local`: `OPENAI_API_KEY=sk-proj-YOUR_KEY`

### **Phase 2: Stripe Setup (15 minutes)**
- [ ] Go to https://dashboard.stripe.com/register
- [ ] Create account
- [ ] Get test API keys from https://dashboard.stripe.com/test/apikeys
- [ ] Add to `.env.local`:
  ```bash
  STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
  STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
  ```

### **Phase 3: Create Stripe Products (10 minutes)**
- [ ] Go to https://dashboard.stripe.com/test/products
- [ ] Create 4 products:
  - [ ] **Starter:** $149 one-time → Copy price ID
  - [ ] **Growth:** $299 one-time → Copy price ID  
  - [ ] **Professional:** $499 one-time → Copy price ID
  - [ ] **Enterprise:** $799 one-time → Copy price ID
- [ ] Add price IDs to `.env.local`:
  ```bash
  STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_ID
  STRIPE_GROWTH_PRICE_ID=price_YOUR_GROWTH_ID
  STRIPE_PROFESSIONAL_PRICE_ID=price_YOUR_PROFESSIONAL_ID
  STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_ID
  ```

### **Phase 4: Development Environment (5 minutes)**
- [ ] Install ngrok: `npm install -g ngrok`
- [ ] Start server: `npm run dev`
- [ ] Start ngrok: `ngrok http 3000` (in new terminal)
- [ ] Copy ngrok URL (e.g., `https://abc123.ngrok.io`)

### **Phase 5: Webhook Setup (5 minutes)**
- [ ] Go to https://dashboard.stripe.com/test/webhooks
- [ ] Click "Add endpoint"
- [ ] URL: `https://abc123.ngrok.io/api/webhooks/stripe`
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] Copy webhook secret (starts with `whsec_`)
- [ ] Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET`

## **🧪 TESTING PHASE (15 minutes)**

### **Test 1: AI Integration**
- [ ] Run: `npm run test:ai`
- [ ] Expected: ✅ OpenAI connection successful
- [ ] If fails: Check API key format and credits

### **Test 2: Payment Flow**
- [ ] Go to http://localhost:3000/pricing
- [ ] Click "Get Started" on Growth plan
- [ ] Use test card: `4242424242424242`
- [ ] Complete checkout
- [ ] Expected: ✅ Payment succeeds, webhook receives event

### **Test 3: AI Analysis**
- [ ] Go to http://localhost:3000
- [ ] Enter website: `https://stripe.com`
- [ ] Submit for analysis
- [ ] Expected: ✅ AI generates business intelligence

### **Test 4: Full Test Suite**
- [ ] Run: `npm run test:comprehensive`
- [ ] Expected: ✅ All tests pass

## **🚨 TROUBLESHOOTING**

### **OpenAI Issues**
**"Invalid API key"**
- Check key format (should start with `sk-proj-` or `sk-`)
- Verify key is copied completely
- Check account has credits

**"Rate limit exceeded"**
- Wait 1 minute and try again
- Check usage at https://platform.openai.com/usage

### **Stripe Issues**
**"No such price"**
- Verify price IDs are copied exactly
- Check you're in test mode
- Recreate products if needed

**"Webhook signature verification failed"**
- Check webhook secret is correct
- Verify ngrok URL matches webhook endpoint
- Restart ngrok and update webhook URL

### **General Issues**
**"Port 3000 already in use"**
```bash
npx kill-port 3000
npm run dev
```

**"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

## **📋 FINAL VERIFICATION**

### **All Systems Working:**
- [ ] ✅ OpenAI API responds to requests
- [ ] ✅ Stripe accepts test payments
- [ ] ✅ Webhooks receive events
- [ ] ✅ AI analysis generates results
- [ ] ✅ All tests pass

### **Ready for Development:**
- [ ] ✅ Server runs on http://localhost:3000
- [ ] ✅ ngrok exposes webhook endpoint
- [ ] ✅ All environment variables configured
- [ ] ✅ No build errors

## **🎉 SUCCESS!**

**You're now ready to:**
- Develop new features
- Test AI integrations
- Process payments
- Run comprehensive tests

**Next Steps:**
1. Read the testing guide: `./setup-guides/04-Testing-Guide.md`
2. Start developing: `npm run dev`
3. Monitor usage: OpenAI & Stripe dashboards
4. Deploy to production when ready

## **📞 SUPPORT**

**If you get stuck:**
1. Check the detailed guides in `./setup-guides/`
2. Review error messages carefully
3. Test each component individually
4. Verify all API keys are correct

**Common Commands:**
```bash
npm run dev                    # Start development server
ngrok http 3000               # Expose webhook endpoint
npm run test:ai               # Test OpenAI integration
npm run test:pricing-tiers    # Test Stripe integration
npm run test:comprehensive    # Run all tests
```