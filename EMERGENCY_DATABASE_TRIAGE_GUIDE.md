# 🚨 FRANK'S EMERGENCY DATABASE TRIAGE GUIDE
**AI-Powered Application Database Emergency Response Playbook**
*Specialized for DirectoryBolt & Premium SaaS Applications*

---

## 🎯 EMERGENCY RESPONSE FRAMEWORK

### **CRITICAL FAILURE SCENARIOS - IMMEDIATE ACTION REQUIRED**

#### 1️⃣ **REVENUE-THREATENING DATABASE FAILURES** (< 2 MINUTES)
```bash
# IMMEDIATE TRIAGE COMMANDS
# Run ALL commands in parallel - time is money!

# Check core database connections
curl -s "https://yourapp.com/api/health" | jq '.database.status'

# Verify Stripe webhook processing
curl -s "https://yourapp.com/api/webhooks/stripe-health" | jq '.processing_status'

# Check queue processing status
curl -s "https://yourapp.com/api/queue/status" | jq '.processing_stats'

# Monitor OpenAI API health
curl -s "https://yourapp.com/api/ai/health" | jq '.openai_status'
```

#### 2️⃣ **AI INTEGRATION DATABASE CORRUPTION** (< 5 MINUTES)
```bash
# Check AI analysis result storage integrity
SELECT COUNT(*) as total_analyses, 
       COUNT(CASE WHEN result IS NOT NULL THEN 1 END) as completed,
       COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed
FROM ai_analysis_results 
WHERE created_at > NOW() - INTERVAL '1 hour';

# Verify OpenAI API key rotation and usage limits
SELECT api_key_id, usage_count, rate_limit_remaining, last_used_at
FROM openai_api_keys 
WHERE is_active = true 
ORDER BY usage_count DESC;

# Check for stuck AI processing jobs
SELECT job_id, type, status, created_at, 
       EXTRACT(EPOCH FROM (NOW() - created_at)) as stuck_duration_seconds
FROM scraping_jobs 
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '10 minutes';
```

---

## 🔥 CRITICAL PATTERNS IN DIRECTORYBOLT ARCHITECTURE

### **High-Risk Failure Points Identified**

1. **Puppeteer Handler Memory Leaks** (Netlify Functions)
   - Browser instances not properly closed
   - Memory accumulation causing function timeouts
   - Network bottlenecks in AI content scraping

2. **Queue Manager Race Conditions**
   - Concurrent queue processing deadlocks
   - Priority queue corruption during high load
   - AutoBolt customer processing failures

3. **Google Sheets API Rate Limiting**
   - Customer data sync failures
   - Stripe webhook → Google Sheets pipeline breaks
   - Business intelligence report generation delays

4. **OpenAI API Integration Cascading Failures**
   - Token limit exceeded causing analysis backup
   - Model deprecation breaking AI workflows
   - Response parsing errors corrupting business profiles

---

## ⚡ 2-MINUTE EMERGENCY DIAGNOSIS

### **STEP 1: REVENUE IMPACT ASSESSMENT**
```bash
# Check active premium subscriptions affected
SELECT tier, COUNT(*) as affected_customers, 
       SUM(CASE WHEN tier IN ('growth', 'professional', 'enterprise') 
           THEN 299 ELSE 0 END) as potential_revenue_loss
FROM users 
WHERE subscription_status = 'active' 
AND last_analysis_failed = true;

# Verify Stripe webhook processing (CRITICAL)
SELECT COUNT(*) as failed_webhooks, 
       MAX(created_at) as last_successful_webhook
FROM stripe_webhook_logs 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 hour';
```

### **STEP 2: SYSTEM HEALTH RAPID CHECK**
```bash
# Memory and processing status
curl -s localhost:3000/api/status | jq '.memory_usage, .active_connections, .queue_status'

# AI service availability
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     "https://api.openai.com/v1/models" | jq '.data[0].id'

# Database connection pool status
SELECT state, COUNT(*) 
FROM pg_stat_activity 
WHERE application_name LIKE 'directorybolt%' 
GROUP BY state;
```

### **STEP 3: CUSTOMER IMPACT SCOPE**
```bash
# Identify stuck customer analyses
SELECT u.email, u.subscription_tier, aj.status, aj.created_at
FROM users u
JOIN ai_analysis_jobs aj ON u.id = aj.user_id
WHERE aj.status IN ('processing', 'failed')
AND aj.created_at > NOW() - INTERVAL '30 minutes'
AND u.subscription_tier IN ('growth', 'professional', 'enterprise');
```

---

## 🛠️ RAPID RESOLUTION PROCEDURES

### **AI SERVICE FAILURES**
```bash
# Emergency AI service restart
pm2 restart ai-service --update-env

# Clear stuck OpenAI requests
curl -X POST localhost:3000/api/ai/clear-stuck-requests \
     -H "Content-Type: application/json" \
     -d '{"max_age_minutes": 10}'

# Fallback to cached analysis results
UPDATE ai_analysis_jobs 
SET status = 'completed', 
    result = (SELECT cached_result FROM ai_analysis_cache 
              WHERE business_url = ai_analysis_jobs.business_url 
              LIMIT 1)
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '15 minutes';
```

### **QUEUE PROCESSING DEADLOCKS**
```bash
# Emergency queue reset (NUCLEAR OPTION)
const queueManager = require('./lib/batch-processing/QueueManager');
const queue = new queueManager();

// Safely restart queue processing
await queue.shutdown();
await queue.initialize();

# Database-level queue cleanup
UPDATE scraping_jobs 
SET status = 'queued', attempts = 0 
WHERE status = 'processing' 
AND started_at < NOW() - INTERVAL '30 minutes';
```

### **STRIPE WEBHOOK FAILURES**
```bash
# Replay failed webhooks
SELECT webhook_id, event_type, stripe_event_id 
FROM stripe_webhook_logs 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

# Emergency customer status sync
node scripts/emergency-stripe-sync.js --customers-only --last-24h
```

---

## 📊 MONITORING & ALERTING FRAMEWORK

### **Critical Metrics Dashboard**
```typescript
// Real-time monitoring queries (execute every 30 seconds)
const CRITICAL_METRICS = {
  // Revenue-threatening failures
  stripe_webhook_failures: `
    SELECT COUNT(*) FROM stripe_webhook_logs 
    WHERE status = 'failed' AND created_at > NOW() - INTERVAL '5 minutes'
  `,
  
  // AI processing bottlenecks
  stuck_ai_analyses: `
    SELECT COUNT(*) FROM ai_analysis_jobs 
    WHERE status = 'processing' AND created_at < NOW() - INTERVAL '10 minutes'
  `,
  
  // Premium customer impact
  premium_customer_failures: `
    SELECT COUNT(DISTINCT user_id) FROM submission_failures sf
    JOIN users u ON sf.user_id = u.id
    WHERE u.subscription_tier IN ('growth', 'professional', 'enterprise')
    AND sf.created_at > NOW() - INTERVAL '15 minutes'
  `,
  
  // Queue processing health
  queue_processing_rate: `
    SELECT COUNT(*) as completed_last_hour
    FROM scraping_jobs 
    WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '1 hour'
  `
};
```

### **Automated Alert Triggers**
```javascript
// Emergency escalation thresholds
const ALERT_THRESHOLDS = {
  // DEFCON 1: Immediate CEO/CTO notification
  revenue_threat: {
    stripe_webhook_failures: 5,        // 5 failed webhooks in 5 minutes
    premium_customer_impact: 10,       // 10+ premium customers affected
    total_system_downtime: 120         // 2 minutes total downtime
  },
  
  // DEFCON 2: Engineering team activation
  service_degradation: {
    ai_processing_delays: 50,          // 50+ stuck AI analyses
    queue_processing_halt: 300,        // No queue processing for 5 minutes
    database_connection_failures: 20   // 20+ DB connection errors
  },
  
  // DEFCON 3: Monitoring team notification
  performance_issues: {
    response_time_p95: 5000,          // 95th percentile > 5 seconds
    error_rate_spike: 5,              // Error rate > 5%
    memory_usage_critical: 90         // Memory usage > 90%
  }
};
```

---

## 🔄 RECOVERY PROCEDURES

### **DATA INTEGRITY RESTORATION**
```sql
-- Verify critical data relationships
WITH integrity_check AS (
  SELECT 
    'users_subscriptions' as check_name,
    COUNT(*) as total_users,
    COUNT(stripe_customer_id) as with_stripe_id,
    COUNT(subscription_id) as with_subscription
  FROM users 
  WHERE subscription_tier != 'free'
  
  UNION ALL
  
  SELECT 
    'ai_analyses_completeness',
    COUNT(*) as total_analyses,
    COUNT(business_profile) as with_business_profile,
    COUNT(recommendations) as with_recommendations
  FROM ai_analysis_results
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT * FROM integrity_check;

-- Emergency data recovery from backups
COPY ai_analysis_results_backup TO '/tmp/emergency_backup.sql';
-- Execute selective restore based on missing data patterns
```

### **SERVICE DEPENDENCY RECOVERY**
```bash
# Sequential service restart with health checks
#!/bin/bash

services=("database" "redis" "api-server" "queue-processor" "ai-service")

for service in "${services[@]}"; do
  echo "Restarting $service..."
  systemctl restart $service
  
  # Wait for health check
  for i in {1..30}; do
    if curl -f "http://localhost:3000/api/health/$service" >/dev/null 2>&1; then
      echo "$service is healthy"
      break
    fi
    sleep 2
  done
done
```

### **Customer Communication Protocol**
```typescript
// Automated customer notification system
const INCIDENT_COMMUNICATIONS = {
  immediate: {
    channels: ['status_page', 'twitter', 'email_admin'],
    message: 'We are investigating reports of service issues and will provide updates shortly.',
    trigger_threshold: 'DEFCON 2'
  },
  
  hourly_updates: {
    channels: ['email_customers', 'in_app_notification'],
    message: 'Service restoration in progress. Premium analyses will be prioritized upon resolution.',
    affected_users_only: true
  },
  
  resolution: {
    channels: ['all'],
    message: 'All services have been restored. Any failed analyses will be automatically retried.',
    include_compensation: true
  }
};
```

---

## 🎯 PREVENTION STRATEGIES

### **Proactive Monitoring Implementation**
```typescript
// Implement these monitoring patterns in production
class DatabaseHealthMonitor {
  private alertManager: AlertManager;
  
  async runHealthChecks() {
    const checks = await Promise.all([
      this.checkConnectionPool(),
      this.checkQueryPerformance(),
      this.checkReplicationLag(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
      this.checkBackupStatus()
    ]);
    
    return this.evaluateHealthScore(checks);
  }
  
  async checkAIIntegrationHealth() {
    return {
      openai_api_status: await this.pingOpenAI(),
      token_usage_rate: await this.getTokenUsageRate(),
      analysis_queue_depth: await this.getQueueDepth(),
      cache_hit_rate: await this.getCacheHitRate()
    };
  }
}
```

### **Automated Recovery Systems**
```javascript
// Self-healing system implementation
class AutoRecoverySystem {
  async handleDatabaseFailure(error) {
    // 1. Immediate failover to read replica
    await this.switchToReadReplica();
    
    // 2. Notify engineering team
    await this.sendAlert('DATABASE_FAILOVER', error);
    
    // 3. Begin automatic recovery
    await this.initiateRecoveryProcess();
    
    // 4. Monitor recovery progress
    await this.monitorRecovery();
  }
  
  async handleAIServiceFailure() {
    // 1. Switch to cached results where possible
    await this.enableAICacheMode();
    
    // 2. Rate limit new analysis requests
    await this.enableRateLimiting();
    
    // 3. Queue requests for later processing
    await this.queueFailedAnalyses();
  }
}
```

---

## 📈 SUCCESS METRICS & KPIs

### **Recovery Time Objectives (RTO)**
- **Critical Revenue Functions**: < 2 minutes
- **AI Analysis Services**: < 5 minutes  
- **Queue Processing**: < 10 minutes
- **Full Service Restoration**: < 30 minutes

### **Recovery Point Objectives (RPO)**
- **Financial Data**: Zero data loss
- **Customer Analyses**: < 1 hour data loss acceptable
- **Queue States**: < 15 minutes data loss acceptable

### **Business Impact Minimization**
- **Premium Customer SLA**: 99.9% uptime
- **Revenue Protection**: < $1,000 potential loss per incident
- **Customer Satisfaction**: < 5% churn rate due to incidents

---

## 🚀 EMERGENCY CONTACT ESCALATION

```
DEFCON 1 (Revenue Threat): 
├── Frank (Database Lead) - Primary
├── Engineering Manager - Secondary  
└── CTO - Executive

DEFCON 2 (Service Degradation):
├── On-call Engineer - Primary
├── Frank (Database Lead) - Secondary
└── Product Manager - Business Impact

DEFCON 3 (Performance Issues):
├── Monitoring Team - Primary
└── DevOps Engineer - Secondary
```

---

**🏆 Remember: In database emergencies, SPEED beats PERFECTION. Execute the triage, stabilize the system, then investigate the root cause.**

*Last Updated: January 2025 | Frank's Emergency Database Triage Protocol v2.0*