# 🚀 DirectoryBolt Stripe Integration Setup Guide

## Complete Stripe Payment Integration Implementation

This guide will walk you through setting up the complete Stripe payment system for DirectoryBolt, including all 4 pricing tiers, checkout sessions, success/cancel flows, and webhook handling.

## ✅ What's Already Implemented

### ✅ Complete Payment Flow
- **4 Pricing Tiers**: Starter ($49), Growth ($79), Professional ($129), Enterprise ($299)
- **Stripe Checkout Sessions**: Fully functional for all plans
- **14-day Free Trial**: Built-in for all subscriptions  
- **Extended 21-day Trial**: For users returning from cancel page
- **Success Page**: Enhanced with real-time session data
- **Cancel Page**: Advanced recovery flow with special offers
- **Webhook Handling**: Complete subscription lifecycle management
- **Error Handling**: Comprehensive error management and logging

### ✅ Advanced Features
- **Dynamic Trial Extension**: Users get 21 days if they return from cancel page
- **Real-time Session Retrieval**: Success page fetches actual Stripe data
- **Subscription Metadata**: Proper plan tracking and user attribution
- **Recovery Flow**: Cancel page with compelling return incentives
- **Test Suite**: Complete integration testing script

## 🔧 Setup Instructions

### Step 1: Set Up Stripe Dashboard

1. **Create Stripe Account** (if you haven't already)
   - Go to [stripe.com](https://stripe.com) and create account
   - Complete business verification

2. **Create Products and Prices**
   In your Stripe Dashboard, create these 4 products with monthly recurring prices:
   
   ```bash
   # Starter Plan
   Product: "DirectoryBolt Starter"
   Price: $49.00/month (recurring)
   Price ID: price_xxxxxxxxxxxxx (save this)
   
   # Growth Plan  
   Product: "DirectoryBolt Growth"
   Price: $79.00/month (recurring)
   Price ID: price_xxxxxxxxxxxxx (save this)
   
   # Professional Plan
   Product: "DirectoryBolt Professional" 
   Price: $129.00/month (recurring)
   Price ID: price_xxxxxxxxxxxxx (save this)
   
   # Enterprise Plan
   Product: "DirectoryBolt Enterprise"
   Price: $299.00/month (recurring) 
   Price ID: price_xxxxxxxxxxxxx (save this)
   ```

3. **Get API Keys**
   - Go to Developers → API Keys
   - Copy Publishable Key (pk_test_... or pk_live_...)
   - Copy Secret Key (sk_test_... or sk_live_...)

4. **Set Up Webhook Endpoint**
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select these events:
     - `customer.subscription.created`
     - `customer.subscription.updated` 
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`
     - `checkout.session.completed`
   - Copy Webhook Secret (whsec_...)

### Step 2: Configure Environment Variables

Create `.env.local` file with these variables:

```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from Step 1)
STRIPE_STARTER_PRICE_ID=price_starter_id_from_stripe
STRIPE_GROWTH_PRICE_ID=price_growth_id_from_stripe  
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_id_from_stripe
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_id_from_stripe

# App Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-here

# Database (if using)
DATABASE_URL=your_database_connection_string
```

### Step 3: Test the Integration

Run the comprehensive test suite:

```bash
# Test locally (make sure your dev server is running)
npm run dev
# In another terminal:
npm run stripe:test:local

# Test production deployment
npm run stripe:test
```

### Step 4: Deploy and Verify

1. **Deploy to Production**
   ```bash
   npm run build
   npm run deploy
   ```

2. **Set Production Environment Variables**
   - In Netlify/Vercel dashboard, add all environment variables
   - Use live Stripe keys for production
   - Update NEXTAUTH_URL to production domain

3. **Test Production Flow**
   - Visit `/pricing` page
   - Test all 4 checkout flows
   - Verify success page loads correctly
   - Test cancel page recovery flow

## 🧪 Testing Guide

### Manual Testing Checklist

- [ ] All 4 pricing plans create checkout sessions
- [ ] Checkout redirects to Stripe properly
- [ ] Test cards work (4242 4242 4242 4242)
- [ ] Success page shows correct subscription details
- [ ] Cancel page shows recovery offers
- [ ] Extended trial activates when returning from cancel
- [ ] Webhooks process subscription events
- [ ] Trial periods are set correctly (14 or 21 days)

### Test Cards (Stripe Test Mode)
```bash
# Successful payment
4242 4242 4242 4242

# Declined payment  
4000 0000 0000 0002

# Requires 3D Secure
4000 0027 6000 3184
```

## 🎯 Key Features Implemented

### Pricing Plans
- ✅ **Starter**: $49/month, 25 submissions
- ✅ **Growth**: $79/month, 50 submissions (Most Popular)
- ✅ **Professional**: $129/month, 100+ submissions
- ✅ **Enterprise**: $299/month, 500+ submissions

### Payment Flow
- ✅ Stripe Checkout integration
- ✅ 14-day free trial (21 days for returning users)
- ✅ Subscription management
- ✅ Automatic tax calculation
- ✅ Promotion codes supported

### Success Experience  
- ✅ Real-time session data retrieval
- ✅ Subscription confirmation
- ✅ Next steps guidance
- ✅ Trial period display
- ✅ Quick access to dashboard/analysis

### Cancel Recovery
- ✅ Extended trial offer (21 days)
- ✅ Free analysis alternative
- ✅ Demo scheduling option
- ✅ Social proof testimonials
- ✅ Compelling return incentives

### Backend Integration
- ✅ Webhook handling for all subscription events
- ✅ Customer creation and management
- ✅ Subscription metadata tracking
- ✅ Error handling and logging
- ✅ Session retrieval API

## 🚨 Important Notes

### Security
- All Stripe operations use server-side API keys
- Webhook signatures are verified
- User data is handled securely
- No sensitive data stored locally

### User Experience
- Seamless checkout flow
- Clear pricing display
- Trial period transparency
- Recovery options for cancellations
- Real-time success confirmation

### Business Logic
- Subscription lifecycle management
- Trial period handling
- Plan upgrade/downgrade support
- Billing period tracking
- Usage limit enforcement ready

## 🎉 Ready for Production!

Your Stripe integration is now complete and ready for production use. The system handles:

- ✅ All 4 pricing tiers with proper checkout
- ✅ 14-day free trials (21-day extended trials)  
- ✅ Complete subscription lifecycle
- ✅ Success and cancel page experiences
- ✅ Webhook processing
- ✅ Error handling and recovery
- ✅ Test coverage

Just configure your environment variables and deploy! 🚀

## 📞 Support

If you encounter any issues:
1. Check the test script output: `npm run stripe:test`
2. Verify environment variables are set correctly
3. Check Stripe dashboard for webhook delivery
4. Review server logs for detailed error information

The integration is now complete and production-ready! 🎯