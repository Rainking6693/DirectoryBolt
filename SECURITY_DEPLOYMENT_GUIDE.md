# 🔒 SECURITY DEPLOYMENT GUIDE - DirectoryBolt
## Production-Ready Security Configuration

**⚠️ CRITICAL**: Complete this security checklist before deployment

---

## 🚨 IMMEDIATE SECURITY ACTIONS (REQUIRED)

### 1. Revoke Compromised API Keys
The following Stripe keys have been exposed and must be revoked immediately:

1. **Login to Stripe Dashboard**
   - Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Find the exposed keys (sk_live_[REDACTED] and pk_live_[REDACTED])
   - Click "Reveal" and then "Delete" for each key

2. **Generate New Production Keys**
   - Create new Restricted API keys with minimal permissions
   - Only grant permissions needed for payment processing
   - Document key creation date and permissions

### 2. Remove Environment Files
```bash
# Remove all environment files from filesystem
rm .env .env.local .env.production

# Verify removal
ls -la .env*
# Should show: No such file or directory
```

### 3. Audit Recent Transactions
- Check Stripe Dashboard for unauthorized transactions
- Review payment logs from the exposure period
- Monitor for suspicious activity patterns

---

## 🔐 SECURE ENVIRONMENT SETUP

### Netlify Environment Variables Configuration

**In Netlify Dashboard → Site Settings → Environment Variables**

#### Required Production Variables
```
STRIPE_SECRET_KEY=sk_live_[NEW_SECRET_KEY]
STRIPE_STARTER_PRICE_ID=price_[STARTER_ID]
STRIPE_GROWTH_PRICE_ID=price_[GROWTH_ID]
STRIPE_PROFESSIONAL_PRICE_ID=price_[PROFESSIONAL_ID]
STRIPE_ENTERPRISE_PRICE_ID=price_[ENTERPRISE_ID]
NODE_ENV=production
NEXTAUTH_URL=https://directorybolt.com
USER_AGENT=DirectoryBolt/2.0 (+https://directorybolt.com)
CORS_ORIGINS=https://directorybolt.com,https://www.directorybolt.com
```

#### Security Configuration Variables
```
ANALYSIS_RATE_LIMIT_REQUESTS_PER_MINUTE=10
ANALYSIS_RATE_LIMIT_WINDOW_MS=60000
ANALYSIS_REQUEST_TIMEOUT=15000
ANALYSIS_MAX_CONTENT_SIZE=5242880
DEBUG=false
LOG_LEVEL=warn
```

#### Optional Integration Variables
```
# Only add if using these services
OPENAI_API_KEY=sk-[ACTUAL_OPENAI_KEY]
SENTRY_DSN=https://[ACTUAL_SENTRY_DSN]
GA_MEASUREMENT_ID=G-[ACTUAL_GA_ID]
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[ACTUAL_ANON_KEY]
SUPABASE_SERVICE_KEY=[ACTUAL_SERVICE_KEY]
```

---

## 🛡️ SECURITY VALIDATION CHECKLIST

### Pre-Deployment Security Tests

1. **Environment Security**
   ```bash
   # Verify no environment files in repo
   ls -la .env* 2>/dev/null && echo "❌ Environment files found" || echo "✅ No environment files"
   
   # Check git status for tracked env files
   git status --porcelain | grep -E '\.env' && echo "❌ Env files tracked" || echo "✅ No env files tracked"
   ```

2. **Security Headers Test**
   ```bash
   # Run security validation
   npm run security-test
   # Expected: Score >= 90%
   ```

3. **API Security Test**
   ```bash
   # Test malicious URL blocking
   curl -X POST https://your-domain.com/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"url": "javascript:alert(1)"}' 
   # Expected: {"success":false,"error":"Invalid URL format"}
   
   # Test internal URL blocking  
   curl -X POST https://your-domain.com/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"url": "http://localhost:8080"}'
   # Expected: {"success":false,"error":"Private/internal URLs are not allowed"}
   ```

### Post-Deployment Security Verification

4. **CSP Compliance Check**
   ```bash
   curl -I https://your-domain.com | grep -i content-security-policy
   # Expected: CSP header with all required directives
   ```

5. **Rate Limiting Test**
   ```bash
   # Test rate limiting (run multiple times quickly)
   for i in {1..10}; do curl -X POST https://your-domain.com/api/analyze -H "Content-Type: application/json" -d '{"url": "https://example.com"}'; done
   # Expected: 429 status after rate limit exceeded
   ```

---

## 🚀 SECURE DEPLOYMENT PROCESS

### 1. Pre-Deployment Checklist
- [ ] All environment files removed from filesystem
- [ ] New Stripe keys generated with restricted permissions
- [ ] Environment variables configured in Netlify dashboard
- [ ] Security tests passing locally
- [ ] Git repository clean of sensitive data

### 2. Deploy with Security Validation
```bash
# Build with security checks
npm run build

# Run security validation
npm run security-test

# Deploy only if security score >= 90%
```

### 3. Post-Deployment Verification
- [ ] SSL/TLS certificate active (https://)
- [ ] Security headers present in all responses
- [ ] CSP violations monitoring (browser console)
- [ ] API endpoints responding with proper validation
- [ ] Rate limiting active and working
- [ ] Payment integration working with new keys

---

## 🔍 ONGOING SECURITY MONITORING

### Daily Monitoring Tasks
1. **Check Stripe Dashboard**
   - Monitor for unusual transaction patterns
   - Verify webhook deliveries
   - Check for failed payments or disputes

2. **Application Monitoring**
   - CSP violation reports (browser console)
   - API error rates and patterns
   - Rate limiting trigger frequency

### Weekly Security Tasks
1. **Dependency Updates**
   ```bash
   npm audit
   npm update
   npm run security-test
   ```

2. **Log Analysis**
   - Review application logs for security events
   - Check for attempted attacks or unusual patterns
   - Verify rate limiting effectiveness

### Monthly Security Review
1. **API Key Rotation** (Optional but recommended)
   - Generate new API keys
   - Update environment variables
   - Verify functionality

2. **Security Configuration Review**
   - CSP directive effectiveness
   - Rate limiting configuration optimization
   - Security header updates

---

## 🚨 INCIDENT RESPONSE PROCEDURES

### Suspected Security Breach
1. **Immediate Actions**
   - Revoke all API keys immediately
   - Check recent transaction history
   - Review application logs for signs of compromise
   - Document the incident with timestamps

2. **Investigation**
   - Identify attack vector
   - Assess data/financial impact
   - Check for unauthorized access patterns

3. **Recovery**
   - Generate new API keys
   - Update security configurations
   - Apply additional security measures
   - Notify relevant stakeholders

### CSP Violations
1. **Analysis**
   - Review browser console for CSP violation reports
   - Identify source of violations
   - Assess if violations indicate attack attempts

2. **Response**
   - Update CSP directives if legitimate violations
   - Investigate suspicious violation patterns
   - Document and monitor for trends

---

## 🎯 SECURITY HARDENING RECOMMENDATIONS

### Immediate Improvements (Post Critical Fix)
1. **Implement CSRF Protection**
   ```javascript
   // Add to API routes
   import { getCsrfToken, validateCsrfToken } from '@/lib/csrf'
   ```

2. **Add Webhook Signature Validation**
   ```javascript
   // Stripe webhook validation
   const signature = req.headers['stripe-signature']
   const payload = req.body
   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
   stripe.webhooks.constructEvent(payload, signature, endpointSecret)
   ```

3. **Enhanced Logging**
   ```javascript
   // Security event logging
   logger.security('API_KEY_USAGE', { endpoint, ip, timestamp })
   logger.security('RATE_LIMIT_EXCEEDED', { ip, endpoint, timestamp })
   ```

### Advanced Security Measures
1. **API Key Restrictions**
   - Use Stripe's restricted keys
   - Limit permissions to minimum required
   - Set IP address restrictions if possible

2. **Advanced Rate Limiting**
   - Implement sliding window rate limiting
   - Add user-specific rate limits
   - Geographic rate limiting for high-risk regions

3. **Security Headers Enhancement**
   - Add Expect-CT header
   - Implement Feature-Policy restrictions
   - Add custom security headers for additional protection

---

## 📊 SECURITY COMPLIANCE

### Data Protection Compliance
- GDPR compliance for EU users
- PCI DSS compliance for payment processing
- Data minimization and retention policies

### Regular Security Audits
- Monthly automated security scanning
- Quarterly manual security reviews
- Annual third-party security assessment

---

## 📞 EMERGENCY CONTACTS

**Security Incident Response**
- Development Team: [Contact Info]
- Security Team: [Contact Info]
- Hosting Provider (Netlify): Support ticket system

**Financial Security**
- Stripe Support: [Contact through dashboard]
- Bank/Payment Processor: [Emergency contact]

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Review Date**: After deployment + 30 days  
**Status**: ⚠️ Critical issues must be resolved before deployment