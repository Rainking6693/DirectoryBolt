# DirectoryBolt Edge Functions

## ⚠️ IMPORTANT: Edge Functions Currently DISABLED

Both edge functions are **disabled by default** to prevent deployment conflicts and parsing errors.

### Why Disabled?

**Problem**: Both `waf.ts` and `performance-optimizer.js` were configured with `path: "/*"`, causing:
- Edge function conflict (both intercept all traffic)
- Netlify parsing errors during deployment
- Potential traffic blocking
- Build failures

### Edge Functions in This Directory

#### 1. `waf.ts` - Web Application Firewall
**Purpose**: Security protection against attacks

**Features**:
- ✅ Rate limiting (200-500 req/min based on endpoint)
- ✅ IP blocking
- ✅ Attack pattern detection (SQL injection, XSS, path traversal)
- ✅ User agent filtering
- ✅ Request size limits (10MB max)

**Current Status**: ⚠️ **DISABLED** (config commented out)

**To Enable**:
1. Uncomment `export const config` at bottom of `waf.ts`
2. Ensure `performance-optimizer.js` is disabled OR scoped to different paths
3. Test thoroughly in deploy preview

#### 2. `performance-optimizer.js` - Performance Optimization
**Purpose**: Edge-based caching and routing

**Features**:
- ✅ Geographic routing
- ✅ AI request optimization
- ✅ Customer data GDPR compliance
- ✅ Static asset caching
- ✅ Performance monitoring

**Current Status**: ⚠️ **DISABLED** (config commented out)

**To Enable**:
1. Uncomment `export const config` at bottom
2. Ensure `waf.ts` is disabled OR scoped to different paths
3. Test caching behavior

---

## How to Enable Edge Functions Safely

### Option 1: Choose ONE Function (Recommended)

#### Enable WAF Only:
```typescript
// waf.ts - uncomment config
export const config = {
  path: "/*",
  excludedPath: ["/_next/*", "/images/*"]
};
```

#### Enable Performance Optimizer Only:
```javascript
// performance-optimizer.js - uncomment config
export const config = {
  path: "/*",
  cache: "manual"
};
```

### Option 2: Scope to Different Paths

#### WAF for API Only:
```typescript
// waf.ts
export const config = {
  path: "/api/*",  // Only API routes
};
```

#### Performance Optimizer for Static Assets:
```javascript
// performance-optimizer.js
export const config = {
  path: ["/static/*", "/_next/static/*"],  // Only static files
  cache: "manual"
};
```

### Option 3: Combine Into Single Function

Merge both into one edge function:
```typescript
// combined-edge.ts
export default async function(request, context) {
  // 1. Run WAF checks
  // 2. Run performance optimizations
  // 3. Return response
}

export const config = {
  path: "/*"
};
```

---

## Testing Edge Functions

### Local Testing (Netlify Dev)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run with edge functions
netlify dev

# Test specific path
curl http://localhost:8888/api/test
```

### Deploy Preview Testing

```bash
# Create deploy preview
git push origin feature/edge-functions

# Test in deploy preview before production
curl https://deploy-preview-123--yoursite.netlify.app/
```

### Monitoring

When enabled, edge functions log to Netlify Function logs:
```bash
# View logs
netlify functions:log waf

# Or in dashboard:
# Netlify Dashboard → Functions → Edge Functions → Logs
```

---

## Current Recommendation

### ✅ KEEP DISABLED Until Needed

**Reasoning**:
1. ✅ Site works without edge functions
2. ✅ Prevents deployment conflicts
3. ✅ Eliminates parsing errors
4. ✅ Simpler deployment pipeline
5. ✅ Easier debugging

**When to Enable**:
- High traffic requiring rate limiting
- DDoS attacks need mitigation
- Performance optimization needed
- GDPR compliance required at edge

### If You Need Security:

**Use Instead**:
- Netlify's built-in rate limiting
- Cloudflare in front of Netlify
- Application-level rate limiting (already implemented in API routes)
- Supabase Row Level Security

### If You Need Performance:

**Use Instead**:
- Next.js built-in caching
- Netlify CDN (automatic)
- `next.config.js` optimization
- ISR (Incremental Static Regeneration)

---

## Environment Variables (If Enabling)

Edge functions may need:
```bash
# WAF Configuration
WAF_ENABLED=true
BLOCKED_IPS=["1.2.3.4", "5.6.7.8"]

# Performance Optimizer
EDGE_CACHE_TTL=3600
AI_REGION_US=us-west-1
```

**Note**: Currently no env vars are required since functions are disabled.

---

## Known Issues

### Issue #1: Path Conflicts
- **Problem**: Both functions use `path: "/*"`
- **Solution**: Disable one or scope to different paths
- **Status**: ✅ Fixed (both disabled)

### Issue #2: Parsing Errors
- **Problem**: Edge function conflicts cause Netlify parsing errors
- **Solution**: Disable until needed
- **Status**: ✅ Fixed

### Issue #3: Overly Aggressive Blocking
- **Problem**: WAF attack patterns may block legitimate traffic
- **Solution**: Test thoroughly, adjust patterns
- **Status**: ⏭️ Deferred (function disabled)

---

## Migration Path

If you want to enable edge functions in the future:

### Phase 1: Enable Performance Optimizer
1. Uncomment config in `performance-optimizer.js`
2. Deploy to preview
3. Test caching behavior
4. Monitor logs for errors
5. Deploy to production

### Phase 2: Add WAF (if needed)
1. Scope WAF to `/api/*` only
2. Uncomment config in `waf.ts`
3. Test rate limiting
4. Verify legitimate traffic not blocked
5. Deploy to production

### Phase 3: Optimize
1. Tune rate limits based on traffic
2. Adjust cache TTLs
3. Add specific IP blocks
4. Monitor performance metrics

---

## Summary

**Current State**: ✅ Both edge functions DISABLED  
**Reason**: Path conflicts causing deployment errors  
**Impact**: None - site works without them  
**Recommendation**: Keep disabled until specific need arises  

**Files Modified**:
- `netlify/edge-functions/waf.ts` - Config commented out
- `netlify/edge-functions/performance-optimizer.js` - Config commented out

**Next Steps**: Build and deploy should succeed now!

