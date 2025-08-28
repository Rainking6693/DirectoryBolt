# DirectoryBolt Production Deployment Guide

## 🚀 Deployment Overview

DirectoryBolt is now ready for production deployment with an 8.0/10+ launch readiness score. This guide will walk you through the complete deployment process with monitoring and validation.

## ⚙️ Environment Configuration

### 1. Set Up Stripe Configuration

Before deployment, you MUST configure your Stripe keys:

```bash
# Required Stripe Configuration
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID  
STRIPE_GROWTH_PRICE_ID=price_YOUR_GROWTH_PRICE_ID
STRIPE_PROFESSIONAL_PRICE_ID=price_YOUR_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID
```

**Steps to get Stripe keys:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **API keys** section
3. Copy your **Live secret key** (starts with `sk_live_`)
4. Navigate to **Products** section
5. Create 4 products with corresponding price IDs:
   - **Starter Plan**: $97/month
   - **Growth Plan**: $297/month  
   - **Professional Plan**: $497/month
   - **Enterprise Plan**: $997/month

### 2. Update Environment File

Copy the production environment template:

```bash
cp .env.production .env.local
```

Then update `.env.local` with your actual values:

```env
# DirectoryBolt Production Environment
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_GROWTH_PRICE_ID=price_YOUR_GROWTH_PRICE_ID  
STRIPE_PROFESSIONAL_PRICE_ID=price_YOUR_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID

# Production URL (update with your domain)
NEXTAUTH_URL=https://your-domain.com
USER_AGENT=DirectoryBolt/2.0 (+https://your-domain.com)

# Production settings
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
```

## 🚀 Deployment Process

### Option 1: Automated Production Deployment (Recommended)

The automated deployment script handles the complete deployment process:

```bash
# Run automated production deployment
npm run deploy:production
```

This script will:
- ✅ Validate environment configuration
- ✅ Build application for production  
- ✅ Deploy to Vercel with zero downtime
- ✅ Run comprehensive health checks
- ✅ Test critical user flows
- ✅ Calculate launch readiness score
- ✅ Generate deployment report

### Option 2: Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build for production
npm run build:production

# 3. Deploy to Vercel
vercel --prod --confirm

# 4. Monitor deployment
npm run deploy:monitor
```

## 📊 Monitoring & Health Checks

### Real-time Production Monitoring

Start continuous monitoring after deployment:

```bash
# Start production monitoring (runs continuously)
npm run deploy:monitor
```

**Monitoring features:**
- 🔍 Health checks every 5 minutes
- ⚡ API performance testing
- 🚨 Automatic alerting for issues
- 📈 Response time tracking
- 📊 Incident reporting

### Manual Health Verification

Test critical endpoints manually:

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test analysis API
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","tier":"starter"}'

# Test Stripe integration  
curl -X POST https://your-domain.com/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"starter"}'
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Stripe keys configured (live keys for production)
- [ ] All 4 pricing tiers created in Stripe Dashboard
- [ ] Domain configured in environment variables
- [ ] SSL certificate ready
- [ ] DNS settings configured

### During Deployment
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Deployment URL accessible
- [ ] Zero downtime achieved

### Post-Deployment
- [ ] All 3 critical endpoints responding (score ≥ 6.0/10)
- [ ] Analysis API performance < 15 seconds
- [ ] Stripe checkout creation working
- [ ] Homepage and pricing pages loading
- [ ] Overall launch readiness score ≥ 8.0/10

## 🎯 Expected Performance Metrics

Based on team testing, expect these production metrics:

- **Health Check Score**: 8.0-10.0/10
- **API Response Time**: ~13 seconds average
- **Critical Endpoint Success**: 100% uptime target
- **Page Load Speed**: < 3 seconds
- **Conversion Funnel**: All 4 pricing tiers accessible

## 🚨 Incident Response

### Automatic Alerting

The monitoring system automatically alerts when:
- Health score drops below 7.0/10
- Critical endpoints fail
- Response times exceed 30 seconds
- Multiple consecutive check failures

### Manual Troubleshooting

If deployment issues occur:

```bash
# Check logs
tail -f logs/monitor-$(date +%Y-%m-%d).log

# Check specific endpoint
curl -v https://your-domain.com/api/health

# Verify environment variables
node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'Stripe configured' : 'Stripe missing')"

# Test local build
npm run build:production && npm run start:production
```

## 📈 Monitoring Dashboard

Access monitoring reports:
- **Current Status**: `monitoring-reports/current-status.json`
- **Deployment Reports**: `deployment-reports/deploy-*.json` 
- **Daily Logs**: `logs/monitor-YYYY-MM-DD.log`

## 🔧 Configuration Options

### Environment Variables

```env
# Monitoring Configuration
PRODUCTION_URL=https://your-domain.com
MONITOR_INTERVAL=300000  # Check every 5 minutes
ALERT_THRESHOLD=7.0      # Alert if score < 7.0

# Optional Integrations
OPENAI_API_KEY=sk-your-openai-key   # For AI features
SENTRY_DSN=https://your-sentry-dsn  # Error tracking
GA_MEASUREMENT_ID=G-XXXXXXXXXX     # Analytics
```

### Deployment Platforms

The application is configured for:
- **Vercel** (Recommended) - Automatic scaling, edge functions
- **Netlify** - Alternative with similar features  
- **Docker** - Container deployment for VPS/cloud
- **Traditional VPS** - Manual server deployment

## 📞 Support

If you encounter deployment issues:

1. **Check Environment**: Ensure all required variables are set
2. **Review Logs**: Check deployment and monitoring logs
3. **Test Locally**: Verify build works locally first
4. **Validate Stripe**: Confirm all pricing tiers exist
5. **DNS/SSL**: Ensure domain and certificates are configured

---

## 🎉 Success Criteria

**Deployment is successful when:**
- ✅ Health score consistently ≥ 8.0/10
- ✅ All critical endpoints responding  
- ✅ Stripe integration working
- ✅ No incidents in first 30 minutes
- ✅ Response times within acceptable range

**The application is now production-ready and should maintain its 8.0/10 launch readiness score in the production environment!**