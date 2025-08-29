# 🚀 DirectoryBolt Stripe Integration Setup Guide

This guide walks you through setting up the complete DirectoryBolt Stripe integration for secure payments and subscription management.

## 📋 Overview

DirectoryBolt uses a hybrid payment model:
- **Core Packages**: One-time payments for directory submissions (Starter: $49, Growth: $89, Pro: $159)
- **Subscription Service**: Monthly Auto Update & Resubmission ($49/month)
- **Add-Ons**: One-time upsells (Fast-track: $25, Premium: $15, Manual QA: $10, CSV: $9)

## 🛠️ Prerequisites

- Stripe account (sign up at https://stripe.com)
- DirectoryBolt project set up
- Node.js 18+ installed

## 🔧 Step 1: Stripe Account Setup

### 1.1 Create Stripe Products

Log into your Stripe Dashboard and create these products:

#### Core Packages (One-time payments)
```
Product: DirectoryBolt Starter Package
Price: $49.00 USD
Type: One-time
Billing: One time
Description: 50 directory submissions to get your business listed
```

```
Product: DirectoryBolt Growth Package  
Price: $89.00 USD
Type: One-time
Billing: One time
Description: 100 directory submissions for growing businesses
```

```
Product: DirectoryBolt Pro Package
Price: $159.00 USD
Type: One-time  
Billing: One time
Description: 200 directory submissions for established businesses
```

#### Subscription Service (Monthly recurring)
```
Product: Auto Update & Resubmission
Price: $49.00 USD
Type: Recurring
Billing: Monthly
Description: Automatic directory monitoring and resubmissions
```

#### Add-Ons (One-time upsells)
```
Product: Fast-track Submission
Price: $25.00 USD
Type: One-time
Description: Complete submissions in 1-2 business days

Product: Premium Directories Only
Price: $15.00 USD  
Type: One-time
Description: Submit only to high-authority directories

Product: Manual QA Review
Price: $10.00 USD
Type: One-time
Description: Human quality assurance review

Product: CSV Export
Price: $9.00 USD
Type: One-time
Description: Download detailed CSV report
```

### 1.2 Get Price IDs

After creating products, copy the Price IDs (format: `price_1234567890abcdef`) for each product.

### 1.3 Set Up Webhooks

1. Go to Developers > Webhooks in Stripe Dashboard
2. Click "Add endpoint"
3. Set endpoint URL: `https://directorybolt.com/api/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret

## 🔐 Step 2: Environment Configuration

### 2.1 Copy Environment Template
```bash
cp .env.example .env.local
```

### 2.2 Fill in Stripe Configuration

Edit `.env.local` with your actual Stripe values:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key

# Core Package Price IDs
STRIPE_STARTER_PRICE_ID=price_your_actual_starter_price_id
STRIPE_GROWTH_PRICE_ID=price_your_actual_growth_price_id  
STRIPE_PRO_PRICE_ID=price_your_actual_pro_price_id

# Subscription Service Price ID
STRIPE_AUTO_UPDATE_PRICE_ID=price_your_actual_auto_update_price_id

# Add-On Price IDs
STRIPE_FAST_TRACK_PRICE_ID=price_your_actual_fast_track_price_id
STRIPE_PREMIUM_DIRECTORIES_PRICE_ID=price_your_actual_premium_directories_price_id
STRIPE_MANUAL_QA_PRICE_ID=price_your_actual_manual_qa_price_id
STRIPE_CSV_EXPORT_PRICE_ID=price_your_actual_csv_export_price_id

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Application URL
NEXTAUTH_URL=https://directorybolt.com
```

## 🧪 Step 3: Testing Setup

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Start Development Server
```bash
npm run dev
```

### 3.3 Test API Endpoints

#### Test Configuration Endpoint
```bash
curl http://localhost:3000/api/config
```

#### Test One-time Package Checkout
```bash
curl -X POST http://localhost:3000/api/create-checkout-session-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "package": "growth",
    "addOns": ["fast_track", "premium_directories"],
    "customer_email": "test@example.com",
    "customer_name": "Test Customer"
  }'
```

#### Test Subscription Checkout  
```bash
curl -X POST http://localhost:3000/api/create-subscription-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "service": "auto_update",
    "customer_email": "test@example.com",
    "customer_name": "Test Customer"
  }'
```

### 3.4 Stripe CLI Testing

Install Stripe CLI and test webhooks locally:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward events to local webhook
stripe listen --forward-to localhost:3000/api/webhook

# Test webhook with sample event
stripe trigger checkout.session.completed
```

## 🚀 Step 4: Production Deployment

### 4.1 Production Environment Variables

For production, update environment variables:

```bash
# Use live Stripe keys (not test keys)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key

# Production URL
NEXTAUTH_URL=https://directorybolt.com
NODE_ENV=production
```

### 4.2 Webhook URL Update

Update webhook endpoint URL in Stripe Dashboard to:
`https://directorybolt.com/api/webhook`

### 4.3 Deploy to Production

```bash
# Build the application
npm run build

# Deploy (method depends on your hosting platform)
# For Vercel:
npm run deploy

# For other platforms, follow their deployment guides
```

## 🔒 Step 5: Security Checklist

- [ ] All Stripe keys are properly configured
- [ ] Webhook signatures are verified
- [ ] HTTPS is enabled in production
- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is in place
- [ ] Error handling doesn't expose sensitive data

## 📊 Step 6: API Endpoints Reference

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config` | GET | Get client configuration |
| `/api/create-checkout-session-v2` | POST | Create one-time package checkout |
| `/api/create-subscription-checkout` | POST | Create subscription checkout |  
| `/api/webhook` | POST | Handle Stripe webhooks |

### Request Examples

#### One-time Package Purchase
```javascript
{
  "package": "growth",           // Required: starter, growth, pro
  "addOns": ["fast_track"],     // Optional: array of add-on IDs
  "customer_email": "user@example.com",  // Required
  "customer_name": "John Doe",   // Optional
  "success_url": "https://directorybolt.com/success", // Optional
  "cancel_url": "https://directorybolt.com/pricing",  // Optional
  "metadata": {                  // Optional: custom metadata
    "source": "landing_page"
  }
}
```

#### Subscription Purchase
```javascript
{
  "service": "auto_update",      // Required: currently only auto_update
  "customer_email": "user@example.com",  // Required  
  "customer_name": "John Doe",   // Optional
  "trial_period_days": 7,        // Optional: default 7 days
  "success_url": "https://directorybolt.com/success", // Optional
  "cancel_url": "https://directorybolt.com/pricing"   // Optional
}
```

## 🐛 Step 7: Troubleshooting

### Common Issues

#### 1. "Stripe not configured" Error
- Check that all required environment variables are set
- Verify Stripe keys are valid (not expired)
- Ensure keys match the environment (test vs live)

#### 2. "Price not found" Error  
- Verify Price IDs are correct in environment variables
- Check that products are active in Stripe Dashboard
- Ensure price IDs match the product type (one-time vs recurring)

#### 3. Webhook Signature Verification Failed
- Check webhook secret is correctly set
- Verify webhook URL is correct
- Ensure endpoint is receiving raw request body

#### 4. Development Mode Responses
- This is normal when Stripe is not fully configured
- Mock responses are returned for testing
- Set proper environment variables to enable live mode

### Debug Commands

```bash
# Test Stripe configuration
npm run stripe:validate:env

# Debug Stripe connectivity  
npm run stripe:debug

# Run comprehensive validation
npm run test:comprehensive
```

## 📈 Step 8: Monitoring & Analytics

### Key Metrics to Track
- Conversion rates by package type
- Add-on attachment rates  
- Subscription churn rate
- Revenue per customer
- Failed payment rates

### Recommended Tools
- Stripe Dashboard for payment metrics
- Google Analytics for user behavior
- Error tracking service (Sentry)
- Application performance monitoring

## 🆘 Support

### Documentation
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Testing Resources
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Webhook Testing Tool](https://stripe.com/docs/webhooks/test)

### Contact
For DirectoryBolt-specific issues:
- Create GitHub issue
- Contact: support@directorybolt.com

---

## 🎯 Success Criteria

Your DirectoryBolt Stripe integration is working correctly when:

✅ Configuration endpoint returns proper product data  
✅ One-time checkout sessions create successfully  
✅ Subscription checkout sessions create successfully  
✅ Webhooks are received and processed  
✅ Test payments complete end-to-end  
✅ Production deployment is successful  

**Congratulations! Your DirectoryBolt payment system is ready to accept payments and manage subscriptions securely.**