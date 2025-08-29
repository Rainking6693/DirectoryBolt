# NETLIFY ENVIRONMENT SECURITY CONFIGURATION

🔒 **CRITICAL: This document contains instructions for secure production deployment on Netlify**

## ENVIRONMENT VARIABLES REQUIRED

### 🔴 CRITICAL - STRIPE PAYMENT PROCESSING
```
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_GROWTH_PRICE_ID=price_YOUR_GROWTH_PRICE_ID
STRIPE_PROFESSIONAL_PRICE_ID=price_YOUR_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID
```

### 🔴 CRITICAL - APPLICATION CONFIGURATION
```
NODE_ENV=production
NEXTAUTH_URL=https://your-actual-domain.com
USER_AGENT=DirectoryBolt/2.0 (+https://your-actual-domain.com)
```

### 🟡 OPTIONAL - ENHANCED FEATURES
```
# OpenAI Integration (for AI features)
OPENAI_API_KEY=sk-your-actual-openai-key

# Error Monitoring
SENTRY_DSN=https://your-sentry-dsn

# Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Database (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## SECURITY REQUIREMENTS IMPLEMENTED

✅ **Environment File Protection**
- All `.env*` files blocked from git commits
- Template files with placeholder values only
- No actual secrets in repository history

✅ **API Key Security**
- No hardcoded fallback keys in production code
- Required environment validation at startup
- Server-side only access to secret keys

✅ **CORS Security**
- Wildcard CORS policy removed
- Domain-specific origins only
- Environment-specific configuration

✅ **Deployment Security**
- Vercel artifacts completely removed
- Single deployment target (Netlify only)
- Clean infrastructure pipeline

## NETLIFY DEPLOYMENT STEPS

### 1. Environment Variable Configuration
Navigate to: **Site Settings → Environment Variables**

Add each environment variable listed above with **Build time** and **Runtime** scoping as appropriate:

- **Build + Runtime**: `NODE_ENV`, `NEXTAUTH_URL`, `USER_AGENT`
- **Runtime Only**: `STRIPE_SECRET_KEY`, all price IDs, optional keys

### 2. Build Configuration
```toml
# netlify.toml (if needed)
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Access-Control-Allow-Origin = "https://your-domain.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "X-Requested-With, Content-Type, Authorization"
```

### 3. Domain Configuration
- Configure custom domain in Netlify DNS
- Enable SSL/HTTPS (automatic with Netlify)
- Update CORS origins to match your domain
- Update `NEXTAUTH_URL` to match your domain

## SECURITY VALIDATION CHECKLIST

Before deploying to production:

- [ ] All environment variables set in Netlify dashboard
- [ ] No secrets visible in git repository or history
- [ ] CORS policy restricted to your domain only
- [ ] Stripe keys are LIVE keys (sk_live_*, pk_live_*)
- [ ] All price IDs created in Stripe Dashboard
- [ ] Domain SSL certificate active
- [ ] Build deploys successfully
- [ ] Payment integration tested in production

## INCIDENT RESPONSE

If secrets are accidentally committed:

1. **Immediately rotate all exposed keys**
2. **Force push to remove from git history**
3. **Update environment variables in Netlify**
4. **Audit logs for any unauthorized usage**
5. **Update this security documentation**

## MONITORING & ALERTS

Production monitoring includes:
- API response times and error rates
- Payment processing success/failure rates
- Security event logging
- Resource utilization metrics

Critical alerts automatically notify team for:
- Payment processing failures
- API error rates > 5%
- Suspicious security events
- Performance degradation

---

🔒 **SECURITY FIRST**: Never compromise on environment variable security. When in doubt, rotate keys and restart deployment.