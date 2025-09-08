# 💳 **Stripe Integration Setup Guide**

## **Step 1: Create Stripe Account**

### **1.1 Sign Up for Stripe**
1. Go to https://dashboard.stripe.com/register
2. Create account with business email
3. Complete business verification (can skip for testing)

### **1.2 Get Test API Keys**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" for **Secret key** (starts with `sk_test_`)

### **1.3 Configure API Keys in DirectoryBolt**
Update your `.env.local` file:
```bash
# Replace these placeholder values:
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

## **Step 2: Create Products & Prices**

### **2.1 Create Products**
1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product" for each tier:

**Starter Plan:**
- Name: "DirectoryBolt Starter Intelligence"
- Description: "AI Business Profile Analysis with 100 Directory Opportunities"
- Click "Add pricing" → One-time → $149.00 USD
- Copy the Price ID (starts with `price_`)

**Growth Plan:**
- Name: "DirectoryBolt Growth Intelligence" 
- Description: "Complete AI Business Intelligence with 250+ Directory Opportunities"
- Click "Add pricing" → One-time → $299.00 USD
- Copy the Price ID

**Professional Plan:**
- Name: "DirectoryBolt Professional Intelligence"
- Description: "Advanced AI Analysis with 400+ Directory Opportunities"
- Click "Add pricing" → One-time → $499.00 USD
- Copy the Price ID

**Enterprise Plan:**
- Name: "DirectoryBolt Enterprise Intelligence"
- Description: "Enterprise AI Suite with 500+ Directory Opportunities"
- Click "Add pricing" → One-time → $799.00 USD
- Copy the Price ID

### **2.2 Update Price IDs in .env.local**
```bash
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_GROWTH_PRICE_ID=price_YOUR_GROWTH_PRICE_ID
STRIPE_PROFESSIONAL_PRICE_ID=price_YOUR_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID
```

## **Step 3: Set Up Webhooks**

### **3.1 Install ngrok (for local testing)**
```bash
# Download from https://ngrok.com/download
# Or install via npm:
npm install -g ngrok

# Start your DirectoryBolt server:
npm run dev

# In another terminal, expose it:
ngrok http 3000
```

### **3.2 Create Webhook Endpoint**
1. Copy your ngrok URL (e.g., `https://abc123.ngrok.io`)
2. Go to https://dashboard.stripe.com/test/webhooks
3. Click "Add endpoint"
4. Endpoint URL: `https://abc123.ngrok.io/api/webhooks/stripe`
5. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `customer.updated`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### **3.3 Get Webhook Secret**
1. Click on your webhook endpoint
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Update `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

## **Step 4: Test the Setup**

### **4.1 Test Payment Flow**
```bash
# Start the server
npm run dev

# Run Stripe tests
npm run test:pricing-tiers
```

### **4.2 Test with Stripe Test Cards**
Use these test card numbers:
- **Success:** `4242424242424242`
- **Decline:** `4000000000000002`
- **3D Secure:** `4000002500003155`

**Test Details:**
- Any future expiry date
- Any 3-digit CVC
- Any billing postal code

## **Step 5: Production Setup (Later)**

### **5.1 Activate Live Mode**
1. Complete Stripe account verification
2. Go to https://dashboard.stripe.com/apikeys
3. Get live keys (start with `sk_live_` and `pk_live_`)
4. Create live products/prices
5. Update webhook endpoint to production URL

## **Security Best Practices**
- ✅ Never expose secret keys in client code
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Monitor failed payments and disputes
- ✅ Set up proper error handling

## **Troubleshooting**
- **"No such price"** → Check price IDs match exactly
- **"Invalid API key"** → Ensure using test keys in test mode
- **"Webhook signature verification failed"** → Check webhook secret
- **"Payment failed"** → Use test card numbers above