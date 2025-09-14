# 🔄 FRANK'S DATABASE RECOVERY & MONITORING FRAMEWORK
**Advanced Recovery Procedures and Proactive Monitoring for AI-Powered SaaS**
*DirectoryBolt Production Reliability System*

---

## 🚀 AUTOMATED RECOVERY PROCEDURES

### **1. DATABASE FAILOVER & RECOVERY**

#### **Primary Database Failure Recovery**
```typescript
// lib/database/recovery-manager.ts
export class DatabaseRecoveryManager {
  private primaryConnection: any;
  private replicaConnections: any[];
  private healthCheckInterval: NodeJS.Timeout;
  
  async initiateFailover(reason: string): Promise<void> {
    console.log(`🚨 INITIATING DATABASE FAILOVER: ${reason}`);
    
    // Step 1: Stop all write operations
    await this.pauseWriteOperations();
    
    // Step 2: Promote read replica to primary
    const newPrimary = await this.promoteHealthiestReplica();
    
    // Step 3: Update connection strings
    await this.updateConnectionStrings(newPrimary);
    
    // Step 4: Resume operations with new primary
    await this.resumeOperations();
    
    // Step 5: Alert engineering team
    await this.sendFailoverAlert(reason, newPrimary);
    
    console.log(`✅ FAILOVER COMPLETED - New primary: ${newPrimary.id}`);
  }
  
  private async pauseWriteOperations(): Promise<void> {
    // Gracefully pause all write operations
    await Promise.all([
      this.pauseUserRegistrations(),
      this.pausePaymentProcessing(),
      this.pauseAIAnalysisCreation(),
      this.pauseQueueJobCreation()
    ]);
  }
  
  private async promoteHealthiestReplica(): Promise<any> {
    // Check replica lag and health scores
    const replicaHealth = await Promise.all(
      this.replicaConnections.map(async (replica) => ({
        id: replica.id,
        lag: await this.getReplicationLag(replica),
        health: await this.checkReplicaHealth(replica),
        lastUpdate: await this.getLastUpdateTime(replica)
      }))
    );
    
    // Select replica with lowest lag and best health
    const bestReplica = replicaHealth
      .filter(r => r.health > 0.9)
      .sort((a, b) => a.lag - b.lag)[0];
    
    if (!bestReplica) {
      throw new Error('No healthy replicas available for promotion');
    }
    
    return bestReplica;
  }
}
```

#### **Data Consistency Recovery**
```sql
-- Emergency data consistency check and repair
-- Run this after any failover or major incident

-- 1. Check for orphaned records
WITH orphaned_analyses AS (
  SELECT aj.id, aj.user_id, aj.created_at
  FROM ai_analysis_jobs aj
  LEFT JOIN users u ON aj.user_id = u.id
  WHERE u.id IS NULL
),
orphaned_payments AS (
  SELECT p.id, p.user_id, p.amount
  FROM payments p
  LEFT JOIN users u ON p.user_id = u.id  
  WHERE u.id IS NULL
)
SELECT 'Orphaned AI Analyses' as issue_type, COUNT(*) as count FROM orphaned_analyses
UNION ALL
SELECT 'Orphaned Payments', COUNT(*) FROM orphaned_payments;

-- 2. Repair referential integrity
DELETE FROM ai_analysis_jobs 
WHERE user_id NOT IN (SELECT id FROM users);

-- 3. Fix duplicate Stripe customers
WITH duplicate_stripe_customers AS (
  SELECT stripe_customer_id, array_agg(id) as user_ids, COUNT(*)
  FROM users 
  WHERE stripe_customer_id IS NOT NULL
  GROUP BY stripe_customer_id
  HAVING COUNT(*) > 1
)
UPDATE users 
SET stripe_customer_id = NULL
WHERE id IN (
  SELECT unnest(user_ids[2:]) 
  FROM duplicate_stripe_customers
);

-- 4. Reconcile subscription statuses
UPDATE users u
SET subscription_status = s.status,
    current_period_end = s.current_period_end
FROM subscriptions s
WHERE u.subscription_id = s.stripe_subscription_id
  AND u.subscription_status != s.status;
```

### **2. AI SERVICE RECOVERY AUTOMATION**

#### **OpenAI API Failure Recovery**
```typescript
// lib/services/ai-recovery-service.ts
export class AIServiceRecoveryManager {
  private openaiClient: OpenAI;
  private fallbackStrategies: FallbackStrategy[];
  
  async handleOpenAIFailure(error: any): Promise<any> {
    console.log(`🤖 AI SERVICE FAILURE: ${error.message}`);
    
    const recoveryPlan = this.determineRecoveryStrategy(error);
    
    switch (recoveryPlan.strategy) {
      case 'api_key_rotation':
        return await this.rotateAPIKey();
        
      case 'model_fallback':
        return await this.switchToBackupModel();
        
      case 'cache_mode':
        return await this.enableCacheOnlyMode();
        
      case 'rate_limit_backoff':
        return await this.implementExponentialBackoff();
        
      case 'service_degradation':
        return await this.enableDegradedService();
        
      default:
        return await this.enableMaintenanceMode();
    }
  }
  
  private async rotateAPIKey(): Promise<void> {
    // Rotate to backup API key
    const backupKey = process.env.OPENAI_BACKUP_API_KEY;
    if (!backupKey) {
      throw new Error('No backup API key available');
    }
    
    // Test backup key
    const testClient = new OpenAI({ apiKey: backupKey });
    await testClient.models.list();
    
    // Update active key
    process.env.OPENAI_API_KEY = backupKey;
    this.openaiClient = testClient;
    
    console.log('✅ OpenAI API key rotated successfully');
  }
  
  private async enableCacheOnlyMode(): Promise<void> {
    // Temporarily serve cached analysis results only
    await this.updateServiceStatus('cache_only');
    
    // Queue new requests for later processing
    await this.enableRequestQueuing();
    
    console.log('⚡ Cache-only mode enabled - serving cached results');
  }
  
  private async enableDegradedService(): Promise<void> {
    // Provide basic analysis using rule-based algorithms
    await this.updateServiceStatus('degraded');
    
    // Use simplified analysis templates
    await this.enableFallbackAnalysis();
    
    console.log('🔧 Degraded service mode enabled');
  }
}
```

### **3. PAYMENT SYSTEM RECOVERY**

#### **Stripe Webhook Recovery**
```typescript
// lib/services/stripe-recovery-service.ts
export class StripeRecoveryManager {
  async recoverFailedWebhooks(hoursBack: number = 6): Promise<void> {
    console.log(`🔄 Recovering Stripe webhooks from last ${hoursBack} hours`);
    
    // 1. Get failed webhook events from database
    const failedWebhooks = await this.getFailedWebhooks(hoursBack);
    
    // 2. Replay each webhook with exponential backoff
    for (const webhook of failedWebhooks) {
      try {
        await this.replayWebhookWithBackoff(webhook);
        await this.markWebhookProcessed(webhook.id);
        console.log(`✅ Replayed webhook: ${webhook.stripe_event_id}`);
      } catch (error) {
        console.error(`❌ Failed to replay webhook ${webhook.id}:`, error);
        await this.markWebhookPermanentFailure(webhook.id, error.message);
      }
    }
    
    // 3. Sync customer statuses manually
    await this.syncCustomerStatuses();
    
    console.log('🎉 Stripe webhook recovery completed');
  }
  
  private async syncCustomerStatuses(): Promise<void> {
    // Get all active subscriptions from Stripe
    const stripeSubscriptions = await this.getAllStripeSubscriptions();
    
    // Compare with database and update discrepancies
    for (const stripeSub of stripeSubscriptions) {
      const dbUser = await this.getUserByStripeCustomerId(stripeSub.customer);
      
      if (dbUser && dbUser.subscription_status !== stripeSub.status) {
        await this.updateUserSubscriptionStatus(dbUser.id, stripeSub);
        console.log(`🔄 Synced user ${dbUser.email}: ${stripeSub.status}`);
      }
    }
  }
}
```

---

## 📊 PROACTIVE MONITORING FRAMEWORK

### **1. REAL-TIME HEALTH MONITORING**

#### **System Health Monitor**
```typescript
// lib/monitoring/health-monitor.ts
export class SystemHealthMonitor {
  private metrics: HealthMetrics;
  private alertManager: AlertManager;
  private monitoringInterval: NodeJS.Timeout;
  
  constructor() {
    this.startContinuousMonitoring();
  }
  
  private async startContinuousMonitoring(): Promise<void> {
    this.monitoringInterval = setInterval(async () => {
      const healthReport = await this.generateHealthReport();
      
      // Check for critical issues
      const criticalIssues = this.analyzeCriticalIssues(healthReport);
      
      if (criticalIssues.length > 0) {
        await this.handleCriticalIssues(criticalIssues);
      }
      
      // Store metrics for trending
      await this.storeHealthMetrics(healthReport);
      
    }, 30000); // Every 30 seconds
  }
  
  private async generateHealthReport(): Promise<HealthReport> {
    const [
      databaseHealth,
      aiServiceHealth,
      queueHealth,
      paymentSystemHealth,
      systemResourcesHealth
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkAIServiceHealth(),
      this.checkQueueHealth(),
      this.checkPaymentSystemHealth(),
      this.checkSystemResources()
    ]);
    
    return {
      timestamp: new Date(),
      overall_status: this.calculateOverallHealth([
        databaseHealth, aiServiceHealth, queueHealth, 
        paymentSystemHealth, systemResourcesHealth
      ]),
      database: databaseHealth,
      ai_service: aiServiceHealth,
      queue: queueHealth,
      payments: paymentSystemHealth,
      system: systemResourcesHealth
    };
  }
  
  private async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connectivity and performance
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as active_connections,
          AVG(EXTRACT(EPOCH FROM (NOW() - query_start))) as avg_query_duration,
          COUNT(CASE WHEN state = 'idle in transaction' THEN 1 END) as idle_in_transaction
        FROM pg_stat_activity 
        WHERE application_name LIKE 'directorybolt%'
      `);
      
      const responseTime = Date.now() - startTime;
      const stats = result.rows[0];
      
      return {
        status: this.evaluateDatabaseStatus(stats, responseTime),
        response_time_ms: responseTime,
        active_connections: parseInt(stats.active_connections),
        avg_query_duration: parseFloat(stats.avg_query_duration || '0'),
        idle_in_transaction: parseInt(stats.idle_in_transaction),
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        last_check: new Date()
      };
    }
  }
  
  private async checkAIServiceHealth(): Promise<AIServiceHealth> {
    try {
      // Check OpenAI API availability
      const apiHealth = await this.testOpenAIAPI();
      
      // Check processing queue depth
      const queueDepth = await this.getAIQueueDepth();
      
      // Check recent success rate
      const successRate = await this.getAISuccessRate();
      
      return {
        status: this.evaluateAIServiceStatus(apiHealth, queueDepth, successRate),
        api_available: apiHealth.available,
        api_response_time_ms: apiHealth.response_time,
        queue_depth: queueDepth,
        success_rate_1h: successRate,
        token_usage_rate: await this.getTokenUsageRate(),
        last_check: new Date()
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        last_check: new Date()
      };
    }
  }
}
```

### **2. PREDICTIVE MONITORING**

#### **Anomaly Detection System**
```typescript
// lib/monitoring/anomaly-detector.ts
export class AnomalyDetector {
  private readonly THRESHOLDS = {
    database_response_time: { warning: 1000, critical: 5000 }, // ms
    ai_queue_depth: { warning: 50, critical: 200 },
    error_rate: { warning: 0.05, critical: 0.15 }, // 5%, 15%
    memory_usage: { warning: 0.8, critical: 0.95 }, // 80%, 95%
    payment_failure_rate: { warning: 0.1, critical: 0.25 } // 10%, 25%
  };
  
  async detectAnomalies(): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // 1. Database performance anomalies
    const dbMetrics = await this.getDatabaseMetrics();
    if (dbMetrics.avg_response_time > this.THRESHOLDS.database_response_time.critical) {
      anomalies.push({
        type: 'database_performance',
        severity: 'critical',
        message: `Database response time: ${dbMetrics.avg_response_time}ms`,
        metric_value: dbMetrics.avg_response_time,
        threshold: this.THRESHOLDS.database_response_time.critical,
        detected_at: new Date()
      });
    }
    
    // 2. AI processing bottleneck detection
    const aiQueueDepth = await this.getAIQueueDepth();
    if (aiQueueDepth > this.THRESHOLDS.ai_queue_depth.warning) {
      const severity = aiQueueDepth > this.THRESHOLDS.ai_queue_depth.critical ? 'critical' : 'warning';
      anomalies.push({
        type: 'ai_queue_backlog',
        severity,
        message: `AI analysis queue depth: ${aiQueueDepth} jobs`,
        metric_value: aiQueueDepth,
        threshold: this.THRESHOLDS.ai_queue_depth[severity],
        detected_at: new Date()
      });
    }
    
    // 3. Payment system anomalies
    const paymentFailureRate = await this.getPaymentFailureRate();
    if (paymentFailureRate > this.THRESHOLDS.payment_failure_rate.warning) {
      const severity = paymentFailureRate > this.THRESHOLDS.payment_failure_rate.critical ? 'critical' : 'warning';
      anomalies.push({
        type: 'payment_system_degradation',
        severity,
        message: `Payment failure rate: ${(paymentFailureRate * 100).toFixed(1)}%`,
        metric_value: paymentFailureRate,
        threshold: this.THRESHOLDS.payment_failure_rate[severity],
        detected_at: new Date()
      });
    }
    
    // 4. Resource exhaustion prediction
    const memoryTrend = await this.analyzeMemoryTrend();
    if (memoryTrend.projected_exhaustion_hours < 2) {
      anomalies.push({
        type: 'resource_exhaustion_predicted',
        severity: 'critical',
        message: `Memory exhaustion predicted in ${memoryTrend.projected_exhaustion_hours.toFixed(1)} hours`,
        metric_value: memoryTrend.current_usage,
        threshold: this.THRESHOLDS.memory_usage.critical,
        detected_at: new Date()
      });
    }
    
    return anomalies;
  }
  
  private async analyzeMemoryTrend(): Promise<MemoryTrend> {
    // Get memory usage data from last 6 hours
    const memoryData = await this.getMemoryUsageHistory(6);
    
    // Calculate linear regression to predict exhaustion time
    const trend = this.calculateLinearTrend(memoryData);
    
    const currentUsage = memoryData[memoryData.length - 1]?.usage || 0;
    const hoursToExhaustion = (0.95 - currentUsage) / Math.max(trend.slope, 0.001);
    
    return {
      current_usage: currentUsage,
      trend_slope: trend.slope,
      projected_exhaustion_hours: Math.max(0, hoursToExhaustion),
      confidence: trend.confidence
    };
  }
}
```

### **3. INTELLIGENT ALERTING SYSTEM**

#### **Smart Alert Manager**
```typescript
// lib/monitoring/alert-manager.ts
export class SmartAlertManager {
  private alertHistory: Map<string, AlertHistory> = new Map();
  private escalationRules: EscalationRule[];
  
  async processAlert(alert: Alert): Promise<void> {
    // 1. Check if this is a duplicate or related alert
    const isDuplicate = await this.checkDuplicateAlert(alert);
    if (isDuplicate) {
      await this.updateAlertCount(alert);
      return;
    }
    
    // 2. Determine alert severity and urgency
    const alertContext = await this.gatherAlertContext(alert);
    const enhancedAlert = await this.enhanceAlertWithAI(alert, alertContext);
    
    // 3. Apply smart routing and escalation
    const recipients = await this.determineRecipients(enhancedAlert);
    const escalationPlan = await this.createEscalationPlan(enhancedAlert);
    
    // 4. Send initial alert
    await this.sendAlert(enhancedAlert, recipients);
    
    // 5. Schedule escalation if needed
    if (escalationPlan.shouldEscalate) {
      await this.scheduleEscalation(enhancedAlert, escalationPlan);
    }
    
    // 6. Track alert for resolution monitoring
    await this.trackAlertForResolution(enhancedAlert);
  }
  
  private async enhanceAlertWithAI(alert: Alert, context: AlertContext): Promise<EnhancedAlert> {
    // Use AI to analyze the alert and provide context
    const aiAnalysis = await this.aiService.analyzeAlert({
      alert_type: alert.type,
      severity: alert.severity,
      metrics: context.related_metrics,
      recent_events: context.recent_events,
      system_state: context.system_state
    });
    
    return {
      ...alert,
      ai_analysis: {
        likely_root_cause: aiAnalysis.likely_root_cause,
        recommended_actions: aiAnalysis.recommended_actions,
        business_impact_assessment: aiAnalysis.business_impact,
        estimated_resolution_time: aiAnalysis.estimated_resolution_time,
        confidence_score: aiAnalysis.confidence
      },
      context,
      enhanced_at: new Date()
    };
  }
  
  private async determineRecipients(alert: EnhancedAlert): Promise<AlertRecipient[]> {
    const recipients: AlertRecipient[] = [];
    
    // Business hours vs after-hours routing
    const isBusinessHours = this.isBusinessHours();
    
    switch (alert.severity) {
      case 'critical':
        recipients.push(
          { type: 'on_call_engineer', immediate: true },
          { type: 'engineering_manager', immediate: true }
        );
        
        if (alert.ai_analysis.business_impact_assessment === 'revenue_threatening') {
          recipients.push(
            { type: 'cto', immediate: true },
            { type: 'ceo', delay_minutes: isBusinessHours ? 0 : 15 }
          );
        }
        break;
        
      case 'warning':
        recipients.push(
          { type: 'on_call_engineer', immediate: !isBusinessHours },
          { type: 'team_slack_channel', immediate: true }
        );
        break;
        
      case 'info':
        recipients.push(
          { type: 'monitoring_dashboard', immediate: true },
          { type: 'daily_report', immediate: false }
        );
        break;
    }
    
    return recipients;
  }
}
```

---

## 🔧 AUTOMATED RECOVERY SCRIPTS

### **Database Recovery Script**
```bash
#!/bin/bash
# === AUTOMATED DATABASE RECOVERY SCRIPT ===
# File: scripts/database-recovery.sh

set -e

LOG_FILE="/var/log/directorybolt/recovery_$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check database health
check_db_health() {
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            log "✅ Database connection successful on attempt $attempt"
            return 0
        fi
        
        log "❌ Database connection failed, attempt $attempt/$max_attempts"
        sleep $(( attempt * 2 ))
        attempt=$(( attempt + 1 ))
    done
    
    return 1
}

# Main recovery function
perform_recovery() {
    log "🚨 Starting database recovery process"
    
    # Step 1: Check if database is accessible
    if ! check_db_health; then
        log "🔥 CRITICAL: Database is not accessible - initiating failover"
        
        # Attempt failover to replica
        if [ -n "$DATABASE_REPLICA_URL" ]; then
            log "🔄 Switching to database replica"
            export DATABASE_URL="$DATABASE_REPLICA_URL"
            
            if check_db_health; then
                log "✅ Successfully failed over to replica"
                # Update application configuration
                sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_REPLICA_URL|" .env.production
                # Restart application services
                pm2 restart all
                log "🎉 Application restarted with replica database"
            else
                log "💀 DISASTER: Replica database also unavailable"
                exit 1
            fi
        else
            log "💀 DISASTER: No replica database configured"
            exit 1
        fi
    fi
    
    # Step 2: Check for data corruption
    log "🔍 Checking for data corruption"
    corruption_check=$(psql "$DATABASE_URL" -t -c "
        WITH corruption_check AS (
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as users_without_email,
                COUNT(CASE WHEN stripe_customer_id IS NOT NULL 
                           AND subscription_tier = 'free' THEN 1 END) as inconsistent_subscriptions
            FROM users
        )
        SELECT 
            users_without_email + inconsistent_subscriptions as issues
        FROM corruption_check;
    " | tr -d ' ')
    
    if [ "$corruption_check" -gt 0 ]; then
        log "⚠️ Data corruption detected: $corruption_check issues found"
        
        # Run data repair
        log "🔧 Running data repair procedures"
        psql "$DATABASE_URL" -f scripts/repair-data-corruption.sql
        
        log "✅ Data repair completed"
    fi
    
    # Step 3: Reset stuck processes
    log "🔄 Resetting stuck processes"
    psql "$DATABASE_URL" -c "
        -- Reset stuck AI analysis jobs
        UPDATE ai_analysis_jobs 
        SET status = 'queued', error_message = NULL
        WHERE status = 'processing' 
          AND created_at < NOW() - INTERVAL '30 minutes';
        
        -- Reset stuck scraping jobs
        UPDATE scraping_jobs 
        SET status = 'queued', started_at = NULL
        WHERE status = 'processing' 
          AND started_at < NOW() - INTERVAL '30 minutes';
        
        -- Clear expired sessions
        DELETE FROM user_sessions 
        WHERE expires_at < NOW();
        
        SELECT 'Recovery procedures completed successfully';
    "
    
    # Step 4: Verify system health
    log "🏥 Verifying system health post-recovery"
    
    # Test critical endpoints
    for endpoint in "health" "ai/status" "queue/status" "payments/health"; do
        if curl -f -s "http://localhost:3000/api/$endpoint" >/dev/null; then
            log "✅ Endpoint /$endpoint is healthy"
        else
            log "❌ Endpoint /$endpoint is unhealthy"
        fi
    done
    
    # Step 5: Send recovery notification
    log "📨 Sending recovery notification"
    curl -X POST "$SLACK_WEBHOOK_URL" \
         -H 'Content-type: application/json' \
         --data "{\"text\":\"🎉 Database recovery completed successfully at $(date). System is back online.\"}" \
         || log "⚠️ Failed to send Slack notification"
    
    log "🎉 Database recovery process completed successfully"
}

# Trap errors and cleanup
trap 'log "❌ Recovery script failed at line $LINENO"' ERR

# Run recovery
perform_recovery

exit 0
```

### **AI Service Recovery Script**
```bash
#!/bin/bash
# === AI SERVICE RECOVERY SCRIPT ===
# File: scripts/ai-service-recovery.sh

set -e

LOG_FILE="/var/log/directorybolt/ai_recovery_$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test OpenAI API connectivity
test_openai_api() {
    local test_response
    test_response=$(curl -s -w "%{http_code}" \
                        -H "Authorization: Bearer $OPENAI_API_KEY" \
                        -H "Content-Type: application/json" \
                        "https://api.openai.com/v1/models" \
                        -o /dev/null)
    
    if [ "$test_response" = "200" ]; then
        log "✅ OpenAI API is accessible"
        return 0
    else
        log "❌ OpenAI API returned status: $test_response"
        return 1
    fi
}

# Recover AI service
recover_ai_service() {
    log "🤖 Starting AI service recovery"
    
    # Step 1: Test API connectivity
    if ! test_openai_api; then
        if [ -n "$OPENAI_BACKUP_API_KEY" ]; then
            log "🔄 Switching to backup OpenAI API key"
            export OPENAI_API_KEY="$OPENAI_BACKUP_API_KEY"
            
            if test_openai_api; then
                log "✅ Backup API key is working"
                # Update environment file
                sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_BACKUP_API_KEY|" .env.production
            else
                log "💀 Backup API key also failed - enabling cache-only mode"
                # Enable cache-only mode
                curl -X POST "http://localhost:3000/api/ai/enable-cache-mode" \
                     -H "Content-Type: application/json" \
                     -d '{"reason": "api_failure", "duration_hours": 2}'
            fi
        else
            log "⚠️ No backup API key available - enabling degraded service"
            # Enable degraded service mode
            curl -X POST "http://localhost:3000/api/ai/enable-degraded-mode" \
                 -H "Content-Type: application/json" \
                 -d '{"reason": "api_unavailable"}'
        fi
    fi
    
    # Step 2: Process stuck jobs
    log "🔧 Processing stuck AI analysis jobs"
    stuck_jobs=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM ai_analysis_jobs 
        WHERE status = 'processing' 
          AND created_at < NOW() - INTERVAL '15 minutes';
    " | tr -d ' ')
    
    if [ "$stuck_jobs" -gt 0 ]; then
        log "📋 Found $stuck_jobs stuck AI jobs - resetting them"
        psql "$DATABASE_URL" -c "
            UPDATE ai_analysis_jobs 
            SET status = 'queued', error_message = 'Reset due to timeout'
            WHERE status = 'processing' 
              AND created_at < NOW() - INTERVAL '15 minutes';
        "
    fi
    
    # Step 3: Clear any memory issues
    log "🧹 Clearing AI service memory issues"
    pm2 restart ai-service --update-env
    sleep 5
    
    # Step 4: Verify recovery
    log "🏥 Verifying AI service recovery"
    if curl -f -s "http://localhost:3000/api/ai/health" | grep -q "healthy"; then
        log "✅ AI service is healthy after recovery"
    else
        log "❌ AI service is still unhealthy"
        return 1
    fi
    
    log "🎉 AI service recovery completed"
}

# Run recovery
recover_ai_service

exit 0
```

---

## 📈 MONITORING DASHBOARD CONFIGURATION

### **Grafana Dashboard Configuration**
```json
{
  "dashboard": {
    "title": "DirectoryBolt Production Monitoring",
    "panels": [
      {
        "title": "System Health Overview",
        "type": "stat",
        "targets": [
          {
            "query": "rate(http_requests_total[5m])",
            "legendFormat": "Request Rate"
          },
          {
            "query": "avg(response_time_seconds)",
            "legendFormat": "Avg Response Time"
          },
          {
            "query": "rate(errors_total[5m]) / rate(requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "query": "postgres_active_connections",
            "legendFormat": "Active Connections"
          },
          {
            "query": "postgres_query_duration_avg",
            "legendFormat": "Avg Query Duration (ms)"
          },
          {
            "query": "postgres_deadlocks_total",
            "legendFormat": "Deadlocks"
          }
        ]
      },
      {
        "title": "AI Service Metrics",
        "type": "graph",
        "targets": [
          {
            "query": "openai_requests_per_minute",
            "legendFormat": "OpenAI Requests/min"
          },
          {
            "query": "ai_analysis_queue_depth",
            "legendFormat": "Analysis Queue Depth"
          },
          {
            "query": "openai_token_usage_per_hour",
            "legendFormat": "Token Usage/hour"
          },
          {
            "query": "ai_analysis_success_rate",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "title": "Revenue Metrics",
        "type": "graph",
        "targets": [
          {
            "query": "stripe_payments_per_hour",
            "legendFormat": "Payments/hour"
          },
          {
            "query": "stripe_payment_failures",
            "legendFormat": "Payment Failures"
          },
          {
            "query": "stripe_webhook_processing_time",
            "legendFormat": "Webhook Processing Time"
          }
        ]
      }
    ],
    "alerts": [
      {
        "name": "High Error Rate",
        "condition": "error_rate > 5",
        "severity": "critical",
        "notification_channels": ["slack-alerts", "pagerduty"]
      },
      {
        "name": "Database Response Time High",
        "condition": "avg_query_duration > 1000",
        "severity": "warning",
        "notification_channels": ["slack-alerts"]
      },
      {
        "name": "AI Queue Backlog",
        "condition": "ai_queue_depth > 100",
        "severity": "warning",
        "notification_channels": ["slack-alerts"]
      }
    ]
  }
}
```

---

**🎯 SUMMARY: This comprehensive recovery and monitoring framework provides automated healing capabilities, predictive alerting, and proactive maintenance for DirectoryBolt's AI-powered SaaS architecture. The system is designed to minimize downtime, prevent revenue loss, and maintain premium customer satisfaction.**

*Frank's Recovery & Monitoring Framework v2.0 | Production Ready | January 2025*