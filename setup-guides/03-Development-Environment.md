# 🛠️ **Development Environment Setup Guide**

## **Step 1: Install Required Tools**

### **1.1 Install Node.js (if not already installed)**
1. Go to https://nodejs.org/
2. Download LTS version (20.18.1 or higher)
3. Install and verify:
   ```bash
   node --version  # Should show v20.18.1 or higher
   npm --version   # Should show 8.0.0 or higher
   ```

### **1.2 Install ngrok for Webhook Testing**
```bash
# Option 1: Download from website
# Go to https://ngrok.com/download and follow instructions

# Option 2: Install via npm (recommended)
npm install -g ngrok

# Verify installation
ngrok --version
```

### **1.3 Install Dependencies**
```bash
# Navigate to DirectoryBolt folder
cd C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt

# Install all dependencies
npm install

# Verify installation
npm run build
```

## **Step 2: Environment Configuration**

### **2.1 Verify .env.local File**
Your `.env.local` should now have:
```bash
# OpenAI (from Step 1)
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY

# Stripe (from Step 2)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Price IDs (from Step 2)
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_ID
STRIPE_GROWTH_PRICE_ID=price_YOUR_GROWTH_ID
STRIPE_PROFESSIONAL_PRICE_ID=price_YOUR_PROFESSIONAL_ID
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_ID

# Other settings (should already be configured)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### **2.2 Test Environment Variables**
```bash
# Test that environment loads correctly
npm run dev
```

## **Step 3: Testing Setup**

### **3.1 Start Development Server**
```bash
# Terminal 1: Start the main server
npm run dev

# Should show:
# ✓ Ready on http://localhost:3000
```

### **3.2 Start ngrok (for webhook testing)**
```bash
# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL in your Stripe webhook configuration
```

### **3.3 Run Initial Tests**
```bash
# Terminal 3: Run tests
npm run test:ai                    # Test OpenAI integration
npm run test:pricing-tiers         # Test Stripe integration
npm run test:comprehensive         # Full test suite
```

## **Step 4: Browser Testing**

### **4.1 Test Basic Functionality**
1. Open http://localhost:3000
2. Navigate through the site
3. Try the "Get Free Analysis" feature
4. Test the pricing page

### **4.2 Test Payment Flow**
1. Go to pricing page
2. Click "Get Started" on any plan
3. Use test card: `4242424242424242`
4. Complete checkout
5. Verify webhook receives payment confirmation

### **4.3 Test AI Analysis**
1. Enter a real website URL (e.g., `https://example.com`)
2. Submit for analysis
3. Verify AI generates business intelligence
4. Check that directory recommendations appear

## **Step 5: Monitoring & Debugging**

### **5.1 Check Logs**
```bash
# Server logs in Terminal 1 will show:
# - API requests
# - OpenAI API calls
# - Stripe webhook events
# - Any errors
```

### **5.2 Monitor API Usage**
- **OpenAI:** https://platform.openai.com/usage
- **Stripe:** https://dashboard.stripe.com/test/logs

### **5.3 Debug Common Issues**
```bash
# If OpenAI fails:
npm run test:ai

# If Stripe fails:
npm run test:pricing-tiers

# If webhooks fail:
# Check ngrok is running and webhook URL is correct
```

## **Step 6: Production Preparation**

### **6.1 Environment Variables for Production**
Create `.env.production` with live keys:
```bash
OPENAI_API_KEY=sk-proj-LIVE_KEY
STRIPE_SECRET_KEY=sk_live_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_LIVE_KEY
# ... etc
```

### **6.2 Deploy Checklist**
- [ ] All API keys are live/production keys
- [ ] Webhook endpoint points to production URL
- [ ] SSL certificate is configured
- [ ] Error monitoring is set up
- [ ] Usage limits are configured

## **Troubleshooting Common Issues**

### **Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### **Environment Variables Not Loading**
```bash
# Restart development server
# Verify .env.local file exists and has correct format
# Check for typos in variable names
```

### **ngrok Connection Issues**
```bash
# Restart ngrok
ngrok http 3000

# Update webhook URL in Stripe dashboard
```

### **Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```