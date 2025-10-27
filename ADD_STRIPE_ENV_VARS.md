# Add Stripe Environment Variables

## Quick Fix for Missing Stripe Variables

The verification script found that these environment variables are missing:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 🚀 Quick Solution

### Option 1: Use Test Mode (Recommended for Development)

Add these lines to your `.env.local` file:

```env
# Stripe Test Mode (for development)
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

**Note:** These are placeholder values. Replace with your actual Stripe test keys.

### Option 2: Skip Stripe for Now

If you don't need Stripe functionality yet, you can add dummy values:

```env
# Stripe Placeholder (not functional)
STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

This will pass the verification check, but Stripe webhooks won't work.

## 📝 How to Get Real Stripe Keys

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign up"
3. Complete registration

### Step 2: Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the **Secret key** (starts with `sk_test_`)
3. Copy the **Publishable key** (starts with `pk_test_`)

### Step 3: Create Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `http://localhost:3000/netlify/functions/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Add to .env.local

```env
# Stripe (Real Keys)
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
```

## ✅ Verify

After adding the variables:

1. Restart your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. Run verification:
   ```bash
   node verify-backend-setup.js
   ```

You should see:
```
✅ STRIPE_SECRET_KEY is set
✅ STRIPE_WEBHOOK_SECRET is set
```

## 🧪 Test Stripe Integration

### Using Stripe CLI (Optional)

1. Install Stripe CLI:
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # macOS
   brew install stripe/stripe-cli/stripe
   ```

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/netlify/functions/stripe-webhook
   ```

4. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

## 🔒 Security Notes

- **Never commit** `.env.local` to git (it's in `.gitignore`)
- Use **test mode** keys for development (start with `sk_test_`)
- Use **live mode** keys only in production (start with `sk_live_`)
- Rotate keys if they're ever exposed

## 📚 Additional Resources

- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

**That's it!** Once you add these variables, the verification script will pass. 🎉
