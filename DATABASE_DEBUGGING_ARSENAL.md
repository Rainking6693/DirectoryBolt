# 🔧 FRANK'S DATABASE DEBUGGING COMMAND ARSENAL
**Rapid Diagnosis Tools for AI-Powered SaaS Applications**
*DirectoryBolt Emergency Response Toolkit*

---

## 🎯 INSTANT DIAGNOSIS COMMANDS

### **🔥 CRITICAL SYSTEM HEALTH (< 30 SECONDS)**

```bash
# === ONE-LINER SYSTEM STATUS ===
echo "=== CRITICAL SYSTEM STATUS ===" && \
curl -s localhost:3000/api/health | jq '{database: .database.status, ai: .ai.status, queue: .queue.active_jobs}' && \
echo "=== DATABASE CONNECTIONS ===" && \
psql $DATABASE_URL -c "SELECT state, count(*) FROM pg_stat_activity WHERE application_name LIKE 'directorybolt%' GROUP BY state;" && \
echo "=== MEMORY STATUS ===" && \
free -h | grep Mem && \
echo "=== DISK SPACE ===" && \
df -h | grep -E '(Filesystem|/)'
```

```bash
# === REVENUE IMPACT CHECK ===
psql $DATABASE_URL -c "
SELECT 
  'Active Premium Customers' as metric,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as sample_emails
FROM users 
WHERE subscription_tier IN ('growth', 'professional', 'enterprise') 
  AND subscription_status = 'active'
  AND last_login_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Failed Premium Analyses (Last Hour)',
  COUNT(*),
  STRING_AGG(DISTINCT u.email, ', ')
FROM ai_analysis_jobs aj
JOIN users u ON aj.user_id = u.id
WHERE aj.status = 'failed' 
  AND aj.created_at > NOW() - INTERVAL '1 hour'
  AND u.subscription_tier IN ('growth', 'professional', 'enterprise');
"
```

---

## ⚡ AI INTEGRATION DEBUGGING

### **OpenAI API Health & Performance**

```bash
# === AI SERVICE RAPID DIAGNOSIS ===
echo "=== OPENAI API STATUS ===" && \
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -s "https://api.openai.com/v1/models" | \
jq '{available_models: [.data[].id], total_models: (.data | length)}' && \

echo "=== AI ANALYSIS QUEUE DEPTH ===" && \
psql $DATABASE_URL -c "
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM ai_analysis_jobs 
WHERE created_at > NOW() - INTERVAL '6 hours'
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'failed' THEN 1
    WHEN 'processing' THEN 2  
    WHEN 'queued' THEN 3
    WHEN 'completed' THEN 4
  END;
"
```

```bash
# === AI COST & USAGE ANALYSIS ===
psql $DATABASE_URL -c "
WITH ai_usage AS (
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    SUM(COALESCE(token_count, 0)) as total_tokens,
    SUM(COALESCE(cost_usd, 0)) as total_cost
  FROM ai_analysis_jobs
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
)
SELECT 
  TO_CHAR(hour, 'MM-DD HH24:MI') as time_hour,
  total_requests,
  successful,
  failed,
  ROUND((failed::decimal / NULLIF(total_requests, 0)) * 100, 2) as failure_rate_pct,
  total_tokens,
  ROUND(total_cost, 2) as cost_usd,
  ROUND(total_tokens / NULLIF(successful, 0)) as avg_tokens_per_success
FROM ai_usage
ORDER BY hour DESC
LIMIT 24;
"
```

### **AI Analysis Result Integrity Check**

```bash
# === AI DATA INTEGRITY VERIFICATION ===
psql $DATABASE_URL -c "
WITH integrity_stats AS (
  SELECT 
    COUNT(*) as total_analyses,
    COUNT(business_profile) as with_business_profile,
    COUNT(recommendations) as with_recommendations,
    COUNT(insights) as with_insights,
    COUNT(CASE WHEN business_profile IS NOT NULL 
               AND recommendations IS NOT NULL 
               AND insights IS NOT NULL THEN 1 END) as complete_analyses,
    AVG(CASE WHEN status = 'completed' 
             THEN EXTRACT(EPOCH FROM (completed_at - created_at)) END) as avg_processing_time_sec
  FROM ai_analysis_results
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  total_analyses,
  complete_analyses,
  ROUND((complete_analyses::decimal / NULLIF(total_analyses, 0)) * 100, 2) as completeness_rate_pct,
  with_business_profile,
  with_recommendations, 
  with_insights,
  ROUND(avg_processing_time_sec, 2) as avg_processing_time_sec
FROM integrity_stats;
"
```

---

## 🗃️ DATABASE PERFORMANCE DIAGNOSTICS

### **Connection Pool & Query Analysis**

```bash
# === DATABASE CONNECTION HEALTH ===
psql $DATABASE_URL -c "
-- Active connections by state
SELECT 
  'Connection States' as metric,
  state,
  COUNT(*) as count,
  MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) as max_duration_sec
FROM pg_stat_activity 
WHERE application_name LIKE 'directorybolt%'
GROUP BY state

UNION ALL

-- Long running queries
SELECT 
  'Long Running Queries',
  'query_time_over_30s',
  COUNT(*),
  MAX(EXTRACT(EPOCH FROM (NOW() - query_start)))
FROM pg_stat_activity 
WHERE application_name LIKE 'directorybolt%'
  AND query_start < NOW() - INTERVAL '30 seconds'
  AND state = 'active';
"
```

```bash
# === QUERY PERFORMANCE HOTSPOTS ===
psql $DATABASE_URL -c "
SELECT 
  query,
  calls,
  total_exec_time,
  ROUND(mean_exec_time, 2) as avg_exec_time_ms,
  ROUND((total_exec_time / SUM(total_exec_time) OVER()) * 100, 2) as pct_total_time,
  rows,
  ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS hit_percent
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
  AND calls > 10
ORDER BY total_exec_time DESC 
LIMIT 10;
"
```

### **Table & Index Health**

```bash
# === TABLE BLOAT & PERFORMANCE ===
psql $DATABASE_URL -c "
WITH table_stats AS (
  SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_row_pct,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND (n_live_tup + n_dead_tup) > 1000
)
SELECT 
  tablename,
  live_rows,
  dead_rows,
  dead_row_pct,
  inserts + updates + deletes as total_activity,
  CASE 
    WHEN dead_row_pct > 20 THEN '🔴 NEEDS_VACUUM'
    WHEN dead_row_pct > 10 THEN '🟡 WATCH'
    ELSE '🟢 OK'
  END as vacuum_status,
  COALESCE(last_autovacuum, last_vacuum) as last_vacuum_any
FROM table_stats
ORDER BY dead_row_pct DESC NULLS LAST;
"
```

---

## 🚦 QUEUE & PROCESSING DIAGNOSTICS

### **Queue Health & Bottlenecks**

```bash
# === QUEUE PROCESSING ANALYSIS ===
psql $DATABASE_URL -c "
WITH queue_stats AS (
  SELECT 
    type,
    status,
    priority,
    COUNT(*) as job_count,
    MIN(created_at) as oldest_job,
    MAX(created_at) as newest_job,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_jobs
  FROM scraping_jobs
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY type, status, priority
)
SELECT 
  type,
  status,
  priority,
  job_count,
  recent_jobs,
  ROUND(avg_age_seconds) as avg_age_sec,
  CASE 
    WHEN status = 'processing' AND avg_age_seconds > 1800 THEN '🔴 STUCK'
    WHEN status = 'queued' AND job_count > 100 THEN '🟡 BACKLOG'
    WHEN status = 'failed' AND recent_jobs > 10 THEN '🔴 FAILING'
    ELSE '🟢 OK'
  END as health_status,
  TO_CHAR(oldest_job, 'MM-DD HH24:MI') as oldest_job_time
FROM queue_stats
ORDER BY 
  CASE status
    WHEN 'failed' THEN 1
    WHEN 'processing' THEN 2
    WHEN 'queued' THEN 3
    WHEN 'completed' THEN 4
  END,
  avg_age_seconds DESC;
"
```

### **Customer Processing Pipeline Status**

```bash
# === AUTOBOLT CUSTOMER PIPELINE ===
psql $DATABASE_URL -c "
WITH customer_pipeline AS (
  SELECT 
    u.subscription_tier,
    u.subscription_status,
    COUNT(*) as customer_count,
    COUNT(CASE WHEN u.last_analysis_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_analyses,
    COUNT(CASE WHEN u.last_analysis_failed = true THEN 1 END) as failed_analyses,
    SUM(u.directories_used_this_period) as total_directories_used,
    AVG(u.directories_used_this_period) as avg_directories_per_customer
  FROM users u
  WHERE u.subscription_tier != 'free'
    AND u.created_at > NOW() - INTERVAL '30 days'
  GROUP BY u.subscription_tier, u.subscription_status
)
SELECT 
  subscription_tier,
  subscription_status,
  customer_count,
  recent_analyses,
  failed_analyses,
  ROUND((failed_analyses::decimal / NULLIF(customer_count, 0)) * 100, 2) as failure_rate_pct,
  total_directories_used,
  ROUND(avg_directories_per_customer, 1) as avg_dirs_per_customer,
  CASE 
    WHEN failure_rate_pct > 10 THEN '🔴 HIGH_FAILURE'
    WHEN failure_rate_pct > 5 THEN '🟡 WATCH'
    ELSE '🟢 HEALTHY'
  END as pipeline_health
FROM customer_pipeline
ORDER BY 
  CASE subscription_tier
    WHEN 'enterprise' THEN 1
    WHEN 'professional' THEN 2
    WHEN 'growth' THEN 3
    WHEN 'starter' THEN 4
  END;
"
```

---

## 💰 STRIPE & PAYMENT DIAGNOSTICS

### **Payment Processing Health**

```bash
# === STRIPE INTEGRATION STATUS ===
psql $DATABASE_URL -c "
WITH payment_health AS (
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as revenue_cents,
    COUNT(DISTINCT user_id) as unique_customers
  FROM payments
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
)
SELECT 
  TO_CHAR(hour, 'MM-DD HH24:MI') as hour,
  total_payments,
  successful_payments,
  failed_payments,
  ROUND((failed_payments::decimal / NULLIF(total_payments, 0)) * 100, 2) as failure_rate_pct,
  ROUND(revenue_cents / 100.0, 2) as revenue_usd,
  unique_customers,
  CASE 
    WHEN failure_rate_pct > 15 THEN '🔴 CRITICAL'
    WHEN failure_rate_pct > 5 THEN '🟡 WARNING' 
    ELSE '🟢 HEALTHY'
  END as payment_health
FROM payment_health
WHERE total_payments > 0
ORDER BY hour DESC
LIMIT 24;
"
```

### **Webhook Processing Status**

```bash
# === STRIPE WEBHOOK HEALTH ===
psql $DATABASE_URL -c "
SELECT 
  event_type,
  COUNT(*) as total_webhooks,
  COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  MAX(created_at) as last_webhook,
  ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))), 2) as avg_processing_time_sec
FROM stripe_webhook_logs
WHERE created_at > NOW() - INTERVAL '6 hours'
GROUP BY event_type
ORDER BY failed DESC, total_webhooks DESC;
"
```

---

## 🔍 ADVANCED DEBUGGING QUERIES

### **Memory & Resource Usage**

```bash
# === PROCESS MEMORY ANALYSIS ===
ps aux | grep -E "(node|postgres|redis)" | awk '{
  process = $11
  memory_mb = $6/1024
  cpu = $3
  pid = $2
  total_mem += memory_mb
  printf "%-20s PID: %-8s CPU: %6.1f%% RAM: %8.1f MB\n", process, pid, cpu, memory_mb
}
END {
  printf "\n%-20s %-8s %-8s %8.1f MB\n", "TOTAL MEMORY:", "", "", total_mem
}'
```

### **Network & API Latency**

```bash
# === API ENDPOINT HEALTH CHECK ===
#!/bin/bash
endpoints=(
  "health:http://localhost:3000/api/health"
  "ai-status:http://localhost:3000/api/ai/status" 
  "queue-status:http://localhost:3000/api/queue/status"
  "stripe-health:http://localhost:3000/api/payments/health"
)

echo "=== API ENDPOINT LATENCY TEST ==="
for endpoint in "${endpoints[@]}"; do
  name="${endpoint%:*}"
  url="${endpoint#*:}"
  
  response_time=$(curl -w "%{time_total}" -s -o /dev/null "$url")
  status_code=$(curl -w "%{http_code}" -s -o /dev/null "$url")
  
  if (( $(echo "$response_time > 1.0" | bc -l) )); then
    status="🔴 SLOW"
  elif (( $(echo "$response_time > 0.5" | bc -l) )); then
    status="🟡 MODERATE"
  else
    status="🟢 FAST"
  fi
  
  printf "%-15s HTTP: %s Time: %6.3fs %s\n" "$name" "$status_code" "$response_time" "$status"
done
```

### **Error Pattern Analysis**

```bash
# === ERROR PATTERN DETECTION ===
psql $DATABASE_URL -c "
WITH error_patterns AS (
  SELECT 
    SUBSTRING(error_message FROM 1 FOR 50) as error_prefix,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as affected_users,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence,
    ARRAY_AGG(DISTINCT 
      CASE WHEN user_id IS NOT NULL 
           THEN (SELECT email FROM users WHERE id = error_logs.user_id LIMIT 1)
      END
    ) FILTER (WHERE user_id IS NOT NULL) as affected_user_emails
  FROM error_logs
  WHERE created_at > NOW() - INTERVAL '6 hours'
    AND error_message IS NOT NULL
  GROUP BY SUBSTRING(error_message FROM 1 FOR 50)
)
SELECT 
  error_prefix || '...' as error_pattern,
  error_count,
  affected_users,
  TO_CHAR(first_occurrence, 'HH24:MI') as first_seen,
  TO_CHAR(last_occurrence, 'HH24:MI') as last_seen,
  CASE 
    WHEN error_count > 50 THEN '🔴 CRITICAL'
    WHEN error_count > 10 THEN '🟡 WARNING'
    ELSE '🟢 MINOR'
  END as severity,
  COALESCE(ARRAY_TO_STRING(affected_user_emails[1:3], ', '), 'No users') as sample_users
FROM error_patterns
ORDER BY error_count DESC
LIMIT 15;
"
```

---

## 🛠️ EMERGENCY REPAIR COMMANDS

### **Immediate Fixes**

```bash
# === EMERGENCY QUEUE RESET ===
psql $DATABASE_URL -c "
-- Reset stuck processing jobs
UPDATE scraping_jobs 
SET status = 'queued', attempts = attempts + 1, started_at = NULL
WHERE status = 'processing' 
  AND started_at < NOW() - INTERVAL '30 minutes';

-- Clear failed AI analyses for retry
UPDATE ai_analysis_jobs
SET status = 'queued', error_message = NULL
WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '2 hours'
  AND attempts < 3;

SELECT 'Jobs reset for retry: ' || ROW_COUNT();
"
```

```bash
# === EMERGENCY MEMORY CLEANUP ===
# Clear Node.js memory
pm2 reload all --update-env

# Clear Redis cache
redis-cli FLUSHDB

# Force garbage collection if needed
kill -USR2 $(pgrep -f "node.*directorybolt")

echo "Emergency memory cleanup completed"
```

### **Database Maintenance**

```bash
# === EMERGENCY DATABASE OPTIMIZATION ===
psql $DATABASE_URL -c "
-- Analyze tables for query planner
ANALYZE;

-- Vacuum tables with high dead tuple percentage
VACUUM (ANALYZE, VERBOSE) ai_analysis_jobs;
VACUUM (ANALYZE, VERBOSE) scraping_jobs;
VACUUM (ANALYZE, VERBOSE) users;

-- Update statistics
SELECT 'Database maintenance completed at: ' || NOW();
"
```

---

## 📊 MONITORING AUTOMATION SCRIPTS

### **Health Check Script**

```bash
#!/bin/bash
# === AUTOMATED HEALTH CHECK ===
# Save as: check_health.sh

LOG_FILE="/tmp/directorybolt_health_$(date +%Y%m%d_%H%M%S).log"

{
echo "=== DirectoryBolt Health Check - $(date) ==="
echo

# System resources
echo "=== SYSTEM RESOURCES ==="
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "Load: $(uptime | awk -F'load average:' '{ print $2 }')"
echo

# API endpoints
echo "=== API HEALTH ==="
for endpoint in health ai/status queue/status; do
  response=$(curl -s -w "Time:%{time_total}s|Status:%{http_code}" \
                 "http://localhost:3000/api/$endpoint")
  echo "$endpoint: $response"
done
echo

# Database connections
echo "=== DATABASE ==="
psql $DATABASE_URL -c "
SELECT 
  'Active connections: ' || COUNT(*) as status
FROM pg_stat_activity 
WHERE application_name LIKE 'directorybolt%';"

# Queue status
echo "=== QUEUE STATUS ==="
psql $DATABASE_URL -c "
SELECT 
  status,
  COUNT(*) as count
FROM scraping_jobs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;"

echo "=== END HEALTH CHECK ==="
} | tee "$LOG_FILE"

# Check for critical issues and alert
if grep -q "🔴\|CRITICAL\|ERROR" "$LOG_FILE"; then
  echo "CRITICAL ISSUES DETECTED - Check $LOG_FILE"
  # Add alerting logic here (email, Slack, etc.)
fi
```

---

## 🎯 QUICK REFERENCE CARD

```bash
# === FRANK'S EMERGENCY COMMAND QUICK CARD ===

# Instant system status
curl -s localhost:3000/api/health | jq

# Database connections  
psql $DATABASE_URL -c "SELECT state, count(*) FROM pg_stat_activity WHERE application_name LIKE 'directorybolt%' GROUP BY state;"

# AI queue depth
psql $DATABASE_URL -c "SELECT status, count(*) FROM ai_analysis_jobs WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY status;"

# Revenue impact
psql $DATABASE_URL -c "SELECT COUNT(*) as premium_customers FROM users WHERE subscription_tier IN ('growth', 'professional', 'enterprise') AND subscription_status = 'active';"

# Memory usage
free -h && ps aux | grep node | awk '{sum+=$6} END {print "Node.js total RAM: " sum/1024 " MB"}'

# Reset stuck jobs
psql $DATABASE_URL -c "UPDATE scraping_jobs SET status = 'queued' WHERE status = 'processing' AND started_at < NOW() - INTERVAL '30 minutes';"

# Emergency restart
pm2 restart all --update-env
```

---

**⚡ Speed is everything in database emergencies. These commands are designed for rapid diagnosis and immediate action.**

*Frank's Database Arsenal v2.0 | Last Updated: January 2025*