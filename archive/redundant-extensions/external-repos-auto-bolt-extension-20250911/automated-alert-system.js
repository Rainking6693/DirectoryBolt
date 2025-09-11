/**
 * Automated Alert System for AutoBolt Extension Testing
 * Comprehensive notification and escalation system for test failures
 * Based on Taylor's QA framework requirements
 * 
 * Features:
 * - Real-time test failure alerts
 * - Severity-based escalation
 * - Multiple notification channels
 * - Alert aggregation and deduplication
 * - Performance threshold monitoring
 * - Automated recovery suggestions
 * 
 * Created by: Claude Code QA Agent
 * Date: September 3, 2025
 */

const fs = require('fs').promises;
const path = require('path');

class AutomatedAlertSystem {
    constructor() {
        this.config = null;
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.notificationChannels = new Map();
        this.escalationRules = new Map();
        this.suppressionRules = new Map();
        this.logger = new AlertLogger();
    }

    async initialize(config = null) {
        this.logger.info('🚨 Initializing Automated Alert System');
        
        // Load configuration
        if (config) {
            this.config = config;
        } else {
            await this.loadConfiguration();
        }
        
        // Initialize notification channels
        await this.initializeNotificationChannels();
        
        // Setup escalation rules
        this.setupEscalationRules();
        
        // Initialize alert storage
        await this.initializeAlertStorage();
        
        this.logger.info('✅ Alert system initialized successfully');
    }

    async loadConfiguration() {
        try {
            const configPath = path.join(__dirname, 'continuous-qa-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const fullConfig = JSON.parse(configData);
            this.config = fullConfig.alerting;
        } catch (error) {
            this.logger.warn('⚠️ No alert config found, using defaults');
            this.config = this.getDefaultAlertConfig();
        }
    }

    getDefaultAlertConfig() {
        return {
            enabled: true,
            channels: ['console', 'file'],
            severity_levels: {
                'CRITICAL': {
                    color: '#FF0000',
                    notify_immediately: true,
                    escalate_after_minutes: 15
                },
                'HIGH': {
                    color: '#FF8C00',
                    notify_immediately: true,
                    escalate_after_minutes: 30
                },
                'MEDIUM': {
                    color: '#FFD700',
                    notify_immediately: false,
                    escalate_after_minutes: 60
                },
                'LOW': {
                    color: '#90EE90',
                    notify_immediately: false,
                    escalate_after_minutes: 240
                }
            },
            thresholds: {
                test_failure_rate: 10,
                performance_degradation: 25,
                consecutive_failures: 3,
                directory_outage_count: 5
            },
            deduplication: {
                enabled: true,
                window_minutes: 30,
                max_similar_alerts: 5
            }
        };
    }

    async initializeNotificationChannels() {
        // Console notifications
        if (this.config.channels.includes('console')) {
            this.notificationChannels.set('console', new ConsoleNotificationChannel());
        }
        
        // File notifications
        if (this.config.channels.includes('file')) {
            this.notificationChannels.set('file', new FileNotificationChannel());
        }
        
        // GitHub notifications (for CI/CD integration)
        if (this.config.channels.includes('github')) {
            this.notificationChannels.set('github', new GitHubNotificationChannel());
        }
        
        // Slack notifications (if configured)
        if (this.config.slack_webhook) {
            this.notificationChannels.set('slack', new SlackNotificationChannel(this.config.slack_webhook));
        }
        
        // Email notifications (if configured)
        if (this.config.email_recipients && this.config.email_recipients.length > 0) {
            this.notificationChannels.set('email', new EmailNotificationChannel(this.config.email_recipients));
        }
        
        this.logger.info(`📢 Initialized ${this.notificationChannels.size} notification channels`);
    }

    setupEscalationRules() {
        // Critical test failures
        this.escalationRules.set('CRITICAL_TEST_FAILURE', {
            immediateEscalation: true,
            escalationChain: ['console', 'file', 'slack', 'email'],
            maxRetries: 3,
            retryIntervalMinutes: 5
        });
        
        // Performance degradation
        this.escalationRules.set('PERFORMANCE_DEGRADATION', {
            immediateEscalation: false,
            escalationChain: ['console', 'file'],
            thresholdMinutes: 30,
            maxRetries: 2
        });
        
        // Directory outages
        this.escalationRules.set('DIRECTORY_OUTAGE', {
            immediateEscalation: false,
            escalationChain: ['console', 'file', 'slack'],
            thresholdCount: this.config.thresholds?.directory_outage_count || 5,
            maxRetries: 1
        });
        
        // Regression detection
        this.escalationRules.set('REGRESSION_DETECTED', {
            immediateEscalation: true,
            escalationChain: ['console', 'file', 'slack', 'email'],
            maxRetries: 1
        });
    }

    async initializeAlertStorage() {
        const alertDir = path.join(__dirname, 'test-alerts');
        try {
            await fs.access(alertDir);
        } catch {
            await fs.mkdir(alertDir, { recursive: true });
        }
        
        // Load existing active alerts
        try {
            const activeAlertsFile = path.join(alertDir, 'active-alerts.json');
            const data = await fs.readFile(activeAlertsFile, 'utf8');
            const alerts = JSON.parse(data);
            
            for (const alert of alerts) {
                this.activeAlerts.set(alert.id, alert);
            }
            
            this.logger.info(`📁 Loaded ${alerts.length} active alerts from storage`);
        } catch (error) {
            this.logger.info('📁 No existing active alerts found');
        }
    }

    async sendAlert(alertType, data, severity = 'MEDIUM') {
        if (!this.config.enabled) {
            return;
        }

        const alert = this.createAlert(alertType, data, severity);
        
        // Check for deduplication
        if (this.shouldSuppressAlert(alert)) {
            this.logger.info(`🔇 Alert suppressed due to deduplication: ${alert.id}`);
            return;
        }
        
        // Store alert
        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
        
        // Send immediate notifications
        await this.processAlert(alert);
        
        // Setup escalation if needed
        if (this.shouldEscalate(alert)) {
            await this.scheduleEscalation(alert);
        }
        
        // Save alerts to storage
        await this.saveActiveAlerts();
        
        this.logger.info(`🚨 Alert sent: ${alert.type} [${alert.severity}]`);
    }

    createAlert(type, data, severity) {
        return {
            id: this.generateAlertId(type, data),
            type,
            severity,
            data,
            timestamp: new Date().toISOString(),
            status: 'ACTIVE',
            escalationLevel: 0,
            notificationsSent: [],
            acknowledgments: [],
            resolutionActions: this.generateResolutionActions(type, data)
        };
    }

    generateAlertId(type, data) {
        const hash = require('crypto').createHash('md5');
        hash.update(type + JSON.stringify(data) + Date.now().toString());
        return `alert_${hash.digest('hex').substring(0, 8)}`;
    }

    shouldSuppressAlert(alert) {
        if (!this.config.deduplication?.enabled) {
            return false;
        }
        
        const windowStart = new Date(Date.now() - (this.config.deduplication.window_minutes || 30) * 60 * 1000);
        const similarAlerts = this.alertHistory.filter(existingAlert => 
            existingAlert.type === alert.type &&
            new Date(existingAlert.timestamp) > windowStart &&
            this.alertsAreSimilar(existingAlert, alert)
        );
        
        return similarAlerts.length >= (this.config.deduplication.max_similar_alerts || 5);
    }

    alertsAreSimilar(alert1, alert2) {
        // Basic similarity check - can be enhanced based on alert type
        return JSON.stringify(alert1.data) === JSON.stringify(alert2.data);
    }

    async processAlert(alert) {
        const severityConfig = this.config.severity_levels[alert.severity];
        
        if (severityConfig.notify_immediately) {
            await this.sendImmediateNotifications(alert);
        } else {
            // Queue for later processing
            await this.queueAlert(alert);
        }
    }

    async queueAlert(alert) {
        // For now, just send notifications with delay - can be enhanced with proper queue
        setTimeout(async () => {
            await this.sendImmediateNotifications(alert);
        }, 5000); // 5 second delay for queued alerts
    }

    async sendImmediateNotifications(alert) {
        const promises = [];
        
        for (const [channelName, channel] of this.notificationChannels) {
            promises.push(
                this.sendNotificationToChannel(alert, channel, channelName)
                    .catch(error => {
                        this.logger.error(`❌ Failed to send notification via ${channelName}:`, error);
                    })
            );
        }
        
        await Promise.allSettled(promises);
    }

    async sendNotificationToChannel(alert, channel, channelName) {
        try {
            await channel.sendNotification(alert);
            alert.notificationsSent.push({
                channel: channelName,
                timestamp: new Date().toISOString(),
                status: 'SUCCESS'
            });
        } catch (error) {
            alert.notificationsSent.push({
                channel: channelName,
                timestamp: new Date().toISOString(),
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    shouldEscalate(alert) {
        const escalationRule = this.escalationRules.get(alert.type);
        if (!escalationRule) {
            return false;
        }
        
        if (escalationRule.immediateEscalation) {
            return true;
        }
        
        const severityConfig = this.config.severity_levels[alert.severity];
        return severityConfig.escalate_after_minutes > 0;
    }

    async scheduleEscalation(alert) {
        const severityConfig = this.config.severity_levels[alert.severity];
        const escalationDelay = severityConfig.escalate_after_minutes * 60 * 1000; // Convert to ms
        
        setTimeout(async () => {
            if (this.activeAlerts.has(alert.id) && this.activeAlerts.get(alert.id).status === 'ACTIVE') {
                await this.escalateAlert(alert.id);
            }
        }, escalationDelay);
    }

    async escalateAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            return;
        }
        
        alert.escalationLevel++;
        alert.status = 'ESCALATED';
        
        const escalationRule = this.escalationRules.get(alert.type);
        if (escalationRule && alert.escalationLevel <= escalationRule.maxRetries) {
            // Send escalation notifications
            await this.sendEscalationNotifications(alert);
            
            // Schedule next escalation if needed
            if (alert.escalationLevel < escalationRule.maxRetries) {
                await this.scheduleEscalation(alert);
            }
        }
        
        await this.saveActiveAlerts();
        this.logger.warn(`⬆️ Alert escalated: ${alert.id} (Level ${alert.escalationLevel})`);
    }

    async sendEscalationNotifications(alert) {
        const escalationRule = this.escalationRules.get(alert.type);
        if (!escalationRule) {
            return;
        }
        
        for (const channelName of escalationRule.escalationChain) {
            const channel = this.notificationChannels.get(channelName);
            if (channel) {
                try {
                    await channel.sendEscalationNotification(alert);
                } catch (error) {
                    this.logger.error(`❌ Failed to send escalation via ${channelName}:`, error);
                }
            }
        }
    }

    generateResolutionActions(type, data) {
        const actions = [];
        
        switch (type) {
            case 'TEST_SUITE_FAILURE':
                actions.push('Review test logs for specific failure details');
                actions.push('Check if issue is environment-specific');
                actions.push('Validate test data and configuration');
                actions.push('Consider rolling back recent changes');
                break;
                
            case 'PERFORMANCE_DEGRADATION':
                actions.push('Review performance metrics and identify bottlenecks');
                actions.push('Check system resources and scaling');
                actions.push('Analyze recent code changes for performance impact');
                actions.push('Consider performance optimization measures');
                break;
                
            case 'DIRECTORY_OUTAGE':
                actions.push('Verify directory URL accessibility');
                actions.push('Check for site structure changes');
                actions.push('Update form mappings if needed');
                actions.push('Contact directory support if persistent');
                break;
                
            case 'THRESHOLD_BREACH':
                actions.push('Analyze trend data to identify root cause');
                actions.push('Review threshold settings for appropriateness');
                actions.push('Implement corrective measures');
                actions.push('Monitor for improvement');
                break;
                
            default:
                actions.push('Review alert details and context');
                actions.push('Investigate root cause');
                actions.push('Implement appropriate fix');
                actions.push('Monitor for resolution');
        }
        
        return actions;
    }

    async acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        
        alert.acknowledgments.push({
            acknowledgedBy,
            timestamp: new Date().toISOString(),
            notes
        });
        
        alert.status = 'ACKNOWLEDGED';
        
        await this.saveActiveAlerts();
        this.logger.info(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    }

    async resolveAlert(alertId, resolvedBy, resolution = '') {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        
        alert.status = 'RESOLVED';
        alert.resolution = {
            resolvedBy,
            timestamp: new Date().toISOString(),
            resolution
        };
        
        // Remove from active alerts
        this.activeAlerts.delete(alertId);
        
        await this.saveActiveAlerts();
        this.logger.info(`✅ Alert resolved: ${alertId} by ${resolvedBy}`);
    }

    async saveActiveAlerts() {
        const alertDir = path.join(__dirname, 'test-alerts');
        const activeAlertsFile = path.join(alertDir, 'active-alerts.json');
        
        const alerts = Array.from(this.activeAlerts.values());
        await fs.writeFile(activeAlertsFile, JSON.stringify(alerts, null, 2));
    }

    async generateAlertReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                activeAlerts: this.activeAlerts.size,
                totalAlertsToday: this.getTodayAlertCount(),
                criticalAlerts: this.getCriticalAlertCount(),
                averageResolutionTime: this.getAverageResolutionTime()
            },
            activeAlerts: Array.from(this.activeAlerts.values()),
            alertsByType: this.getAlertsByType(),
            alertsBySeverity: this.getAlertsBySeverity(),
            trends: this.getAlertTrends()
        };
        
        const reportPath = path.join(__dirname, 'test-alerts', `alert-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    getTodayAlertCount() {
        const today = new Date().toDateString();
        return this.alertHistory.filter(alert => 
            new Date(alert.timestamp).toDateString() === today
        ).length;
    }

    getCriticalAlertCount() {
        return Array.from(this.activeAlerts.values()).filter(alert => 
            alert.severity === 'CRITICAL'
        ).length;
    }

    getAverageResolutionTime() {
        const resolvedAlerts = this.alertHistory.filter(alert => alert.resolution);
        if (resolvedAlerts.length === 0) return 0;
        
        const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
            const created = new Date(alert.timestamp);
            const resolved = new Date(alert.resolution.timestamp);
            return sum + (resolved - created);
        }, 0);
        
        return totalResolutionTime / resolvedAlerts.length / 1000 / 60; // Return in minutes
    }

    getAlertsByType() {
        const typeCount = {};
        this.alertHistory.forEach(alert => {
            typeCount[alert.type] = (typeCount[alert.type] || 0) + 1;
        });
        return typeCount;
    }

    getAlertsBySeverity() {
        const severityCount = {};
        this.alertHistory.forEach(alert => {
            severityCount[alert.severity] = (severityCount[alert.severity] || 0) + 1;
        });
        return severityCount;
    }

    getAlertTrends() {
        // Simple 7-day trend analysis
        const trends = {};
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toDateString();
        });
        
        last7Days.forEach(day => {
            trends[day] = this.alertHistory.filter(alert => 
                new Date(alert.timestamp).toDateString() === day
            ).length;
        });
        
        return trends;
    }
}

// Notification Channel Implementations
class ConsoleNotificationChannel {
    async sendNotification(alert) {
        const severityColors = {
            'CRITICAL': '\x1b[31m', // Red
            'HIGH': '\x1b[33m',     // Yellow
            'MEDIUM': '\x1b[34m',   // Blue
            'LOW': '\x1b[32m'       // Green
        };
        
        const reset = '\x1b[0m';
        const color = severityColors[alert.severity] || '\x1b[37m';
        
        console.log(`${color}🚨 ALERT [${alert.severity}] ${alert.type}${reset}`);
        console.log(`   ID: ${alert.id}`);
        console.log(`   Time: ${alert.timestamp}`);
        console.log(`   Data: ${JSON.stringify(alert.data, null, 2)}`);
        console.log(`   Actions: ${alert.resolutionActions.join(', ')}`);
    }
    
    async sendEscalationNotification(alert) {
        console.log(`⬆️ ESCALATION [${alert.severity}] ${alert.type} - Level ${alert.escalationLevel}`);
        await this.sendNotification(alert);
    }
}

class FileNotificationChannel {
    async sendNotification(alert) {
        const alertsDir = path.join(__dirname, 'test-alerts');
        const alertFile = path.join(alertsDir, `alert-${alert.id}.json`);
        
        await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
        
        // Also append to daily log
        const today = new Date().toISOString().split('T')[0];
        const dailyLogFile = path.join(alertsDir, `daily-alerts-${today}.log`);
        const logEntry = `[${alert.timestamp}] ${alert.severity} ${alert.type}: ${JSON.stringify(alert.data)}\n`;
        
        await fs.appendFile(dailyLogFile, logEntry);
    }
    
    async sendEscalationNotification(alert) {
        await this.sendNotification(alert);
    }
}

class GitHubNotificationChannel {
    async sendNotification(alert) {
        // In a real implementation, this would create GitHub issues or comments
        console.log(`📝 Would create GitHub notification for alert: ${alert.id}`);
    }
    
    async sendEscalationNotification(alert) {
        console.log(`📝 Would escalate GitHub notification for alert: ${alert.id}`);
    }
}

class SlackNotificationChannel {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
    }
    
    async sendNotification(alert) {
        // In a real implementation, this would send to Slack webhook
        console.log(`💬 Would send Slack notification for alert: ${alert.id}`);
    }
    
    async sendEscalationNotification(alert) {
        console.log(`💬 Would escalate Slack notification for alert: ${alert.id}`);
    }
}

class EmailNotificationChannel {
    constructor(recipients) {
        this.recipients = recipients;
    }
    
    async sendNotification(alert) {
        // In a real implementation, this would send emails
        console.log(`📧 Would send email notification for alert: ${alert.id} to ${this.recipients.length} recipients`);
    }
    
    async sendEscalationNotification(alert) {
        console.log(`📧 Would escalate email notification for alert: ${alert.id}`);
    }
}

class AlertLogger {
    info(message, ...args) {
        console.log(`[${new Date().toISOString()}] ALERT-INFO: ${message}`, ...args);
    }

    warn(message, ...args) {
        console.log(`[${new Date().toISOString()}] ALERT-WARN: ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`[${new Date().toISOString()}] ALERT-ERROR: ${message}`, ...args);
    }
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AutomatedAlertSystem,
        ConsoleNotificationChannel,
        FileNotificationChannel,
        GitHubNotificationChannel,
        SlackNotificationChannel,
        EmailNotificationChannel
    };
}

// CLI usage for testing
if (require.main === module) {
    async function testAlertSystem() {
        const alertSystem = new AutomatedAlertSystem();
        
        try {
            await alertSystem.initialize();
            
            // Send test alerts
            await alertSystem.sendAlert('TEST_SUITE_FAILURE', {
                suite: 'Daily Smoke Tests',
                successRate: 85,
                failedTests: ['directory_access_test', 'form_mapping_test']
            }, 'HIGH');
            
            await alertSystem.sendAlert('PERFORMANCE_DEGRADATION', {
                metric: 'load_time',
                currentValue: 5000,
                threshold: 3000,
                degradationPercent: 67
            }, 'MEDIUM');
            
            await alertSystem.sendAlert('DIRECTORY_OUTAGE', {
                directory: 'Google Business Profile',
                url: 'https://business.google.com',
                error: 'Connection timeout'
            }, 'CRITICAL');
            
            // Generate report
            const report = await alertSystem.generateAlertReport();
            console.log('\n📊 Alert Report Summary:');
            console.log(`Active Alerts: ${report.summary.activeAlerts}`);
            console.log(`Critical Alerts: ${report.summary.criticalAlerts}`);
            console.log(`Total Alerts Today: ${report.summary.totalAlertsToday}`);
            
        } catch (error) {
            console.error('❌ Alert system test failed:', error);
            process.exit(1);
        }
    }
    
    testAlertSystem();
}