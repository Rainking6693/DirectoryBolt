# DirectoryBolt Stripe Setup Guide - Complete Implementation

## 🎯 Overview

Your complete DirectoryBolt checkout system has been built with your exact specifications:

### ✅ What's Been Implemented

1. **Package Selection** - $49, $89, $159 (Starter, Growth, Pro)
2. **Add-ons Upsells** - $25, $15, $10, $9 (Fast-track, Premium Directories, Manual QA, CSV Export)
3. **Subscription Option** - $49/month Auto Update & Resubmission service
4. **Complete Checkout Flow** - 4-step process with mobile-responsive design
5. **Success Page** - Includes subscription upsell for customers who showed interest
6. **Live Stripe Integration** - Using your provided live keys
7. **Error Handling** - Comprehensive error states and loading indicators

### 🔧 Configuration Status

- ✅ **Live Stripe Keys**: Configured in `.env.local`
- ✅ **Frontend Components**: Complete checkout system built
- ✅ **Backend API**: Integrated with Shane's existing endpoints
- ✅ **Success Flow**: Enhanced with subscription upsell
- ⚠️ **Stripe Products**: Need to be created in Stripe Dashboard (see below)

---

## 🏪 Required Stripe Products Setup

You need to create these products in your Stripe Dashboard:

### 1. Core Packages (One-time payments)

| Package | Price | Stripe Product Name | Suggested Price ID |
|---------|-------|-------------------|-------------------|
| Starter | $49 | DirectoryBolt Starter Package | `price_starter_49_usd` |
| Growth | $89 | DirectoryBolt Growth Package | `price_growth_89_usd` |
| Pro | $159 | DirectoryBolt Pro Package | `price_pro_159_usd` |

### 2. Add-ons (One-time payments)

| Add-on | Price | Stripe Product Name | Suggested Price ID |
|--------|-------|-------------------|-------------------|
| Fast-track Submission | $25 | DirectoryBolt Fast-track | `price_fast_track_25_usd` |
| Premium Directories Only | $15 | DirectoryBolt Premium Directories | `price_premium_directories_15_usd` |
| Manual QA Review | $10 | DirectoryBolt Manual QA | `price_manual_qa_10_usd` |
| CSV Export | $9 | DirectoryBolt CSV Export | `price_csv_export_9_usd` |

### 3. Subscription Service (Recurring)

| Service | Price | Billing | Stripe Product Name | Suggested Price ID |
|---------|-------|---------|-------------------|-------------------|
| Auto Update & Resubmission | $49/month | Monthly | DirectoryBolt Auto Update | `price_auto_update_49_monthly_usd` |

---

## 📋 Step-by-Step Stripe Setup

### Step 1: Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. For each product above:
   - Enter the product name
   - Set the price (one-time or recurring as specified)
   - Copy the Price ID that Stripe generates
   - Update your environment variables

### Step 2: Update Environment Variables

Replace the placeholder price IDs in your `.env.local` file:

```bash
# Core Package Price IDs
STRIPE_STARTER_PRICE_ID=price_1234567890abcdef  # Replace with actual Stripe price ID
STRIPE_GROWTH_PRICE_ID=price_1234567890abcdef   # Replace with actual Stripe price ID
STRIPE_PRO_PRICE_ID=price_1234567890abcdef      # Replace with actual Stripe price ID

# Add-on Price IDs
STRIPE_FAST_TRACK_PRICE_ID=price_1234567890abcdef
STRIPE_PREMIUM_DIRECTORIES_PRICE_ID=price_1234567890abcdef
STRIPE_MANUAL_QA_PRICE_ID=price_1234567890abcdef
STRIPE_CSV_EXPORT_PRICE_ID=price_1234567890abcdef

# Subscription Price ID
STRIPE_AUTO_UPDATE_PRICE_ID=price_1234567890abcdef
```

### Step 3: Set Up Webhook (Optional but Recommended)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://directorybolt.com/api/webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `subscription.created`
5. Copy the webhook signing secret
6. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 🚀 File Structure Created

```
DirectoryBolt/
├── components/checkout/
│   ├── DirectoryBoltCheckout.tsx     # Main checkout component
│   ├── PackageSelection.tsx          # Step 1: Package selection
│   ├── AddOnsSelection.tsx          # Step 2: Add-ons upsells  
│   ├── SubscriptionOption.tsx       # Step 3: Subscription choice
│   ├── OrderSummary.tsx             # Step 4: Review & payment
│   ├── CheckoutProcessing.tsx       # Loading state
│   └── SuccessPage.tsx              # Enhanced success page
├── pages/
│   ├── checkout.tsx                 # Main checkout route
│   ├── success.js                   # Updated success handler
│   └── test-checkout.tsx            # Test page for development
├── .env.local                       # Updated with live Stripe keys
└── lib/config/directoryBoltProducts.js # Updated with your pricing
```

---

## 🔄 User Flow

### Complete Checkout Process:

1. **Package Selection**: User chooses Starter ($49), Growth ($89), or Pro ($159)
2. **Add-ons**: Optional upsells - Fast-track ($25), Premium Directories ($15), Manual QA ($10), CSV Export ($9)
3. **Subscription**: Choice to add Auto Update service ($49/month) or skip
4. **Review**: Customer enters business info, reviews total
5. **Payment**: Redirects to Stripe Checkout for secure payment
6. **Success**: Confirmation page with subscription upsell (if they skipped it)

### Key Features:

- ✅ Mobile-responsive design
- ✅ Progress indicator showing current step
- ✅ Real-time price calculation
- ✅ Form validation and error handling
- ✅ Loading states during API calls
- ✅ Trust indicators and guarantees
- ✅ Subscription upsell on success page

---

## 🧪 Testing

### Test the Checkout Flow:

1. Visit: `https://directorybolt.com/test-checkout`
2. Click "Test New Checkout"
3. Go through the complete flow
4. Test with Stripe test cards:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`

### Test Cases:

- [ ] Package selection works
- [ ] Add-ons can be selected/deselected
- [ ] Subscription choice saves correctly
- [ ] Form validation works
- [ ] Stripe redirect happens
- [ ] Success page shows correct info
- [ ] Subscription upsell appears when appropriate

---

## 🔗 Key URLs

- **Main Checkout**: `https://directorybolt.com/checkout`
- **Test Page**: `https://directorybolt.com/test-checkout`
- **Success Page**: `https://directorybolt.com/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel Page**: `https://directorybolt.com/checkout?cancelled=true`

---

## 🐛 Troubleshooting

### Common Issues:

1. **"Development mode" message**: Price IDs not set in environment
2. **"Stripe not configured"**: Check live keys in `.env.local`
3. **Price not found**: Create products in Stripe Dashboard first
4. **Checkout fails**: Verify all price IDs match Stripe exactly

### Debug Mode:

Add `?debug=true` to any checkout URL to see debug information and API calls.

---

## 📞 Next Steps

1. **Immediate**: Create Stripe products and update price IDs
2. **Test**: Run through complete checkout flow with test cards
3. **Deploy**: Push changes to production
4. **Monitor**: Watch for successful payments and any errors
5. **Optimize**: Track conversion rates and optimize as needed

---

## 💳 Live Stripe Keys in Use

- **Secret Key**: `sk_live_51RyJPcPQdMywmVkH...` (configured)
- **Publishable Key**: `pk_live_51RyJPcPQdMywmVkH...` (configured)
- **Domain**: `https://directorybolt.com`

The system is ready to accept live payments once you create the Stripe products!