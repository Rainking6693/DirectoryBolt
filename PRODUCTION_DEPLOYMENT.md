# 🚀 DirectoryBolt Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Environment Configuration
- [ ] Set all required environment variables
- [ ] Configure Supabase database
- [ ] Set up Stripe payment processing
- [ ] Configure monitoring and logging
- [ ] Set up rate limiting
- [ ] Configure security headers

### ✅ Database Setup
- [ ] Run database migrations
- [ ] Seed initial directory data
- [ ] Set up database indexes for performance
- [ ] Configure connection pooling
- [ ] Set up backup strategy

### ✅ Security & Performance
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CDN (Cloudflare/AWS CloudFront)
- [ ] Set up monitoring (Sentry/DataDog)
- [ ] Configure rate limiting
- [ ] Set up error tracking
- [ ] Enable security headers

---

## 🌍 Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://directorybolt.com
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-here

# Database
DATABASE_URL=postgresql://user:password@host:5432/directorybolt_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# External APIs
RAPID_API_KEY=your-rapid-api-key
SCRAPING_API_KEY=your-scraping-service-key
USER_AGENT=DirectoryBolt/1.0 (+https://directorybolt.com)

# Performance & Monitoring
REDIS_URL=redis://username:password@host:6379
MAX_REQUESTS_PER_HOUR=1000
MAX_CONCURRENT_SCRAPES=10

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

---

## 🔐 Security Configuration

### 1. Database Security
```sql
-- Create production user with limited permissions
CREATE USER directorybolt_prod WITH PASSWORD 'secure_random_password';
GRANT CONNECT ON DATABASE directorybolt_prod TO directorybolt_prod;
GRANT USAGE ON SCHEMA public TO directorybolt_prod;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO directorybolt_prod;
```

### 2. Supabase Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can only see their own data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their submissions" ON submissions
    FOR ALL USING (auth.uid() = user_id);
```

### 3. Rate Limiting Configuration
```typescript
// Production rate limits
const productionLimits = {
  analyze: { perMinute: 10, perHour: 100, perDay: 500 },
  submit: { perMinute: 5, perHour: 50, perDay: 200 },
  auth: { perMinute: 10, perHour: 60, perDay: 200 },
  registration: { perMinute: 2, perHour: 10, perDay: 20 },
  general: { perMinute: 20, perHour: 500, perDay: 5000 }
}
```

---

## 🏗️ Deployment Steps

### 1. Build & Test
```bash
# Install dependencies
npm ci --only=production

# Run type checking
npm run type-check

# Build application
npm run build

# Test production build
npm start
```

### 2. Database Migration
```bash
# Run migrations
npx supabase db push

# Seed initial data
npx tsx scripts/seed-directories.ts
```

### 3. Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... set all other variables
```

### 4. Deploy to Netlify (Alternative)
```bash
# Build for static deployment
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

### 5. Deploy to AWS/Docker (Enterprise)
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
```

---

## 📊 Monitoring & Health Checks

### 1. Health Check Endpoint
The application includes a comprehensive health check at `/api/health`:

```bash
curl https://directorybolt.com/api/health
```

Response format:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 12345678,
  "environment": "production",
  "checks": {
    "database": {
      "status": "pass|warn|fail",
      "message": "Database connection healthy",
      "responseTime": 50,
      "details": {
        "totalDirectories": 127,
        "activeDirectories": 120
      }
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage normal",
      "details": {
        "usedMB": 45,
        "totalMB": 128,
        "usagePercentage": 35
      }
    },
    "external_apis": {
      "status": "pass",
      "message": "All external APIs healthy",
      "responseTime": 150
    }
  }
}
```

### 2. Monitoring Setup
```bash
# Set up uptime monitoring
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -d "api_key=YOUR_API_KEY" \
  -d "friendly_name=DirectoryBolt Health Check" \
  -d "url=https://directorybolt.com/api/health" \
  -d "type=1"
```

### 3. Error Tracking with Sentry
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

---

## 🔧 Performance Optimization

### 1. CDN Configuration (Cloudflare)
```javascript
// _headers file for Netlify
/*
  # Cache static assets for 1 year
  Cache-Control: public, max-age=31536000, immutable

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  # API responses shouldn't be cached
  Cache-Control: no-cache, no-store, must-revalidate
```

### 2. Database Indexing
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_directories_category ON directories(category);
CREATE INDEX CONCURRENTLY idx_directories_authority ON directories(authority DESC);
CREATE INDEX CONCURRENTLY idx_directories_active ON directories(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_submissions_user_id ON submissions(user_id);
CREATE INDEX CONCURRENTLY idx_submissions_status_created ON submissions(status, created_at DESC);
```

### 3. Connection Pooling
```typescript
// Database connection pool configuration
const poolConfig = {
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  acquire: 30000, // Maximum time to get connection
  idle: 10000,    // Maximum time connection can be idle
}
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   ```bash
   Error: connect ETIMEDOUT
   ```
   **Solution:** Check firewall rules, increase connection timeout, verify credentials.

2. **Rate Limiting Issues**
   ```bash
   Error: Rate limit exceeded
   ```
   **Solution:** Increase rate limits, implement request queuing, add retry logic.

3. **Memory Issues**
   ```bash
   Error: JavaScript heap out of memory
   ```
   **Solution:** Increase Node.js memory limit, optimize queries, implement caching.

4. **API Timeouts**
   ```bash
   Error: Request timeout
   ```
   **Solution:** Increase timeout values, implement retry logic, optimize scraping.

### Debug Commands
```bash
# Check application logs
vercel logs --follow

# Monitor memory usage
node --inspect server.js

# Database connection test
psql $DATABASE_URL -c "SELECT 1;"

# Health check test
curl -v https://directorybolt.com/api/health
```

---

## 📈 Scaling Strategy

### Horizontal Scaling
1. **Load Balancer**: AWS ALB/ELB, Cloudflare Load Balancing
2. **Multiple Instances**: Auto-scaling groups
3. **Database**: Read replicas, connection pooling
4. **Caching**: Redis cluster, CDN

### Vertical Scaling
1. **CPU**: Monitor and increase as needed
2. **Memory**: Optimize queries, increase RAM
3. **Storage**: SSD, database sharding
4. **Network**: CDN, edge locations

---

## 🔒 Backup & Recovery

### Database Backups
```bash
# Daily automated backups
pg_dump $DATABASE_URL > "backup-$(date +%Y%m%d).sql"

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

### Application Backups
```bash
# Backup environment configuration
cp .env.production .env.backup-$(date +%Y%m%d)

# Backup application code
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

## 📞 Support & Maintenance

### Monitoring Alerts
- Database response time > 5 seconds
- Memory usage > 90%
- Error rate > 5%
- Health check failures
- API rate limit threshold breached

### Maintenance Windows
- **Weekly**: Dependency updates, security patches
- **Monthly**: Database maintenance, performance review
- **Quarterly**: Security audit, scaling review

---

**🎉 Congratulations! DirectoryBolt is now production-ready with enterprise-grade reliability, security, and performance!**