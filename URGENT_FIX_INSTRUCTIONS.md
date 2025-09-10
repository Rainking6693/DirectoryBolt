# 🚨 URGENT: DirectoryBolt Server Error Fix

## **ROOT CAUSE IDENTIFIED** ✅

Your "Server error: please try again in a moment" is caused by **missing API keys** in your `.env.local` file.

The application is trying to make API calls with placeholder values like:
- `OPENAI_API_KEY=your_openai_api_key_here`
- `STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here`
- `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here`

## **IMMEDIATE FIX** (5 minutes)

### Step 1: Get Your API Keys

1. **OpenAI API Key** (Required)
   - Go to: https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Stripe API Keys** (Required for payments)
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your "Secret key" (starts with `sk_test_`)
   - Copy your "Publishable key" (starts with `pk_test_`)

3. **Supabase Keys** (Required for database)
   - Go to your Supabase project: https://supabase.com/dashboard
   - Go to Settings → API
   - Copy the "service_role" key

### Step 2: Update .env.local

Open `.env.local` and replace these lines:

```bash
# BEFORE (broken):
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_SECRET=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AFTER (working):
OPENAI_API_KEY=sk-your-actual-openai-key-here
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
STRIPE_SECRET=sk_test_your_actual_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## **QUICK TEST** ✅

After updating the keys, test these URLs:

1. **Health Check**: http://localhost:3000/api/health
   - Should show: `{"status":"healthy","hasStripe":true,"hasSupabase":true}`

2. **Homepage**: http://localhost:3000
   - Should load without errors

3. **Analysis Test**: Try analyzing a website
   - Should work without "Server error" message

## **IF YOU DON'T HAVE API KEYS YET**

### Temporary Fix (Development Only)

You can temporarily disable external API calls by creating a minimal `.env.local`:

```bash
# Minimal working configuration
NODE_ENV=development
BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Dummy keys to prevent errors (won't work for real functionality)
OPENAI_API_KEY=sk-dummy-key-for-development-only
STRIPE_SECRET_KEY=sk_test_dummy_key_for_development
SUPABASE_URL=https://kolgqfjgncdwddziqloz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dummy-key-for-development
```

This will stop the server errors, but features requiring these services won't work.

## **VERIFICATION STEPS**

1. ✅ Update API keys in `.env.local`
2. ✅ Restart development server: `npm run dev`
3. ✅ Visit: http://localhost:3000/api/health
4. ✅ Check for `"hasStripe":true` and `"hasSupabase":true`
5. ✅ Test homepage: http://localhost:3000
6. ✅ Try website analysis feature

## **COMMON ISSUES**

### "Still getting server errors"
- Double-check API keys are correct (no extra spaces)
- Make sure you saved `.env.local` file
- Restart the development server completely

### "API keys not working"
- Verify OpenAI key has credits/billing enabled
- Check Stripe is in test mode
- Confirm Supabase project is active

### "Can't find API keys"
- OpenAI: Platform → API Keys → Create new
- Stripe: Dashboard → Developers → API Keys
- Supabase: Project → Settings → API

## **NEXT STEPS AFTER FIX**

1. **Test Core Features**
   - Website analysis
   - Pricing pages
   - Payment flow (test mode)

2. **Set Up Webhooks** (Optional)
   - Stripe webhook for payment processing
   - Configure webhook secret

3. **Production Deployment**
   - Use production API keys
   - Set up proper environment variables

---

**This should fix your server error immediately!** 🚀

The application was failing because it couldn't authenticate with external services using placeholder API keys.