# 🔒 NETLIFY PRODUCTION ENVIRONMENT SETUP

**Date:** December 7, 2024  
**Purpose:** Configure secure production environment variables in Netlify  
**Security Level:** Production-ready with live API keys

---

## 🚀 **NETLIFY ENVIRONMENT VARIABLES CONFIGURATION**

### **Step 1: Access Netlify Environment Variables**

1. Login to [Netlify Dashboard](https://app.netlify.com)
2. Navigate to your DirectoryBolt site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** for each required variable

### **Step 2: Required Production Environment Variables**

#### **🔑 STRIPE CONFIGURATION (LIVE KEYS)**
```bash
# Stripe Live Keys (from Stripe Dashboard → API Keys → Live)
STRIPE_SECRET_KEY=sk_live_[YOUR_LIVE_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_LIVE_PUBLISHABLE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]

# Stripe Price IDs (from Stripe Dashboard → Products)
STRIPE_STARTER_PRICE_ID=price_[LIVE_STARTER_PRICE_ID]
STRIPE_GROWTH_PRICE_ID=price_[LIVE_GROWTH_PRICE_ID]
STRIPE_PROFESSIONAL_PRICE_ID=price_[LIVE_PROFESSIONAL_PRICE_ID]
STRIPE_ENTERPRISE_PRICE_ID=price_[LIVE_ENTERPRISE_PRICE_ID]
```

#### **🤖 AI CONFIGURATION**
```bash
# OpenAI API Key (from OpenAI Platform → API Keys)
OPENAI_API_KEY=sk-proj-[YOUR_OPENAI_KEY]

# Anthropic API Key (optional - from Anthropic Console)
ANTHROPIC_API_KEY=sk-ant-[YOUR_ANTHROPIC_KEY]
```

#### **🗄️ DATABASE CONFIGURATION**
```bash
# Airtable Configuration
AIRTABLE_ACCESS_TOKEN=[YOUR_AIRTABLE_TOKEN]
AIRTABLE_BASE_ID=[YOUR_AIRTABLE_BASE_ID]
AIRTABLE_TABLE_NAME=Directory Bolt Import

# Supabase Configuration
SUPABASE_URL=[YOUR_SUPABASE_URL]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_KEY]
```

#### **🌐 APPLICATION CONFIGURATION**
```bash
# Production URLs
NEXTAUTH_URL=https://directorybolt.com
NEXT_PUBLIC_APP_URL=https://directorybolt.com
BASE_URL=https://directorybolt.com
SITE_URL=https://directorybolt.com
NEXT_PUBLIC_API_BASE_URL=https://directorybolt.com/api

# Security Configuration
NODE_ENV=production
JWT_SECRET=[GENERATE_SECURE_32_CHAR_SECRET]
ALLOWED_ORIGINS=https://directorybolt.com,https://www.directorybolt.com

# User Agent for Web Scraping
USER_AGENT=DirectoryBolt/2.0 (+https://directorybolt.com)

# Puppeteer Configuration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/opt/chrome/chrome
```

#### **📊 MONITORING & ANALYTICS (Optional)**
```bash
# Google Analytics
GA_MEASUREMENT_ID=G-[YOUR_GA_ID]

# Sentry Error Tracking
SENTRY_DSN=https://[YOUR_SENTRY_DSN]

# Security Monitoring
SECURITY_WEBHOOK_URL=[YOUR_SECURITY_MONITORING_WEBHOOK]
```

### **Step 3: Security Best Practices**

#### **🔒 Environment Variable Security**
- ✅ Never commit environment variables to git
- ✅ Use Netlify's encrypted environment storage
- ✅ Rotate API keys regularly (quarterly)
- ✅ Use least-privilege access for all keys
- ✅ Monitor API key usage for anomalies

#### **🚨 Emergency Procedures**
- **Key Compromise:** Immediately revoke in respective dashboards
- **Unauthorized Access:** Rotate all keys and audit usage
- **Security Incident:** Document and report via security monitoring

---

## 🔧 **NETLIFY BUILD CONFIGURATION**

### **netlify.toml Updates**
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20.18.1"
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
  PUPPETEER_EXECUTABLE_PATH = "/opt/chrome/chrome"

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Pre-Deployment Verification**
- [ ] All environment variables configured in Netlify
- [ ] No environment files in git repository
- [ ] Stripe webhook endpoints configured
- [ ] OpenAI API key has sufficient credits
- [ ] All price IDs match Stripe products
- [ ] JWT secret is cryptographically secure
- [ ] CORS origins restricted to production domains

### **Post-Deployment Testing**
- [ ] Payment flow works with live Stripe keys
- [ ] AI analysis functions with production API keys
- [ ] Webhook signature validation working
- [ ] Security headers properly configured
- [ ] Error handling graceful with production settings

---

## 🚀 **DEPLOYMENT STEPS**

1. **Configure Environment Variables** (this guide)
2. **Deploy to Netlify** (`git push` to main branch)
3. **Test Payment Flow** (small test transaction)
4. **Verify AI Analysis** (test with real business URL)
5. **Monitor Security** (check logs for any issues)

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues**
- **Build Failures:** Check Node.js version and dependencies
- **Payment Errors:** Verify Stripe keys and price IDs
- **AI Failures:** Check OpenAI API key and credits
- **CORS Errors:** Verify allowed origins configuration

### **Emergency Contacts**
- **Stripe Support:** [Stripe Dashboard → Support](https://dashboard.stripe.com/support)
- **OpenAI Support:** [OpenAI Platform → Help](https://platform.openai.com/help)
- **Netlify Support:** [Netlify Support Center](https://support.netlify.com)

---

**Configuration Complete:** Ready for secure production deployment  
**Security Level:** Production-grade with encrypted environment storage  
**Next Step:** Implement webhook signature validation and CSRF protection