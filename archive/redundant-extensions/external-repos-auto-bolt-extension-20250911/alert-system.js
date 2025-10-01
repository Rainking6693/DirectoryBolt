/**
 * Auto-Bolt Alert System
 * Comprehensive alerting system with multiple notification channels
 * Handles success rate drops, performance issues, and API rate limiting
 */

class AutoBoltAlertSystem {
    constructor() {
        this.config = {
            alertChannels: {
                console: true,
                browser: true,
                storage: true,
                webhook: false
            },
            thresholds: {
                successRate: 80,
                errorRate: 15,
                apiUsage: 90,
                responseTime: 5000,
                memoryUsage: 80
            },
            cooldownPeriods: {
                critical: 300000, // 5 minutes
                warning: 600000,  // 10 minutes
                info: 1800000     // 30 minutes
            },
            retryAttempts: 3,
            batchAlerts: true,
            maxAlertsPerHour: 50
        };
        
        this.alertQueue = [];
        this.sentAlerts = new Map();
        this.alertHistory = [];
        this.channels = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🚨 Initializing Auto-Bolt Alert System...');
        
        await this.loadConfig();
        this.setupChannels();
        this.startAlertProcessor();
        
        // Setup emergency alert handlers
        this.setupEmergencyHandlers();
        
        console.log('✅ Alert System initialized successfully');
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.local.get('alertSystemConfig');
            if (result.alertSystemConfig) {
                this.config = { ...this.config, ...result.alertSystemConfig };
            }
        } catch (error) {
            console.warn('Using default alert config:', error);
        }
    }
    
    setupChannels() {
        // Console Channel
        if (this.config.alertChannels.console) {
            this.channels.set('console', new ConsoleAlertChannel());
        }
        
        // Browser Notification Channel
        if (this.config.alertChannels.browser) {
            this.channels.set('browser', new BrowserNotificationChannel());
        }
        
        // Storage Channel
        if (this.config.alertChannels.storage) {
            this.channels.set('storage', new StorageAlertChannel());
        }
        
        // Webhook Channel (if configured)
        if (this.config.alertChannels.webhook && this.config.webhookUrl) {
            this.channels.set('webhook', new WebhookAlertChannel(this.config.webhookUrl));
        }
        
        console.log(`📡 Alert channels initialized: ${Array.from(this.channels.keys()).join(', ')}`);
    }
    
    setupEmergencyHandlers() {
        // Critical system failures
        window.addEventListener('error', (event) => {
            this.createEmergencyAlert('SYSTEM_ERROR', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.createEmergencyAlert('PROMISE_REJECTION', 'Unhandled Promise Rejection', {
                reason: event.reason
            });
        });
        
        // Extension context invalidation
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onConnect.addListener(() => {
                if (chrome.runtime.lastError) {
                    this.createEmergencyAlert('CONTEXT_INVALID', 'Extension Context Lost', {
                        error: chrome.runtime.lastError
                    });
                }
            });
        }
    }
    
    createAlert(severity, title, message, metadata = {}) {
        const alert = {
            id: this.generateAlertId(),
            severity: severity.toUpperCase(),
            title,
            message,
            timestamp: Date.now(),
            metadata,
            retryCount: 0,
            status: 'pending'
        };
        
        // Check if we should create this alert
        if (!this.shouldCreateAlert(alert)) {
            return null;
        }
        
        // Add to queue
        this.alertQueue.push(alert);
        
        // Track alert for cooldown
        this.sentAlerts.set(this.getAlertKey(alert), Date.now());
        
        console.log(`🚨 Alert queued: [${severity}] ${title}`);
        
        return alert;
    }
    
    createEmergencyAlert(type, title, metadata = {}) {
        const alert = {
            id: this.generateAlertId(),
            severity: 'CRITICAL',
            title,
            message: `Emergency alert: ${type}`,
            timestamp: Date.now(),
            metadata: { ...metadata, emergency: true, type },
            retryCount: 0,
            status: 'pending',
            priority: 'IMMEDIATE'
        };
        
        // Skip cooldown for emergency alerts
        this.alertQueue.unshift(alert); // Add to front of queue
        
        console.error(`🚨 EMERGENCY ALERT: [${type}] ${title}`, metadata);
        
        // Try to send immediately
        this.processAlert(alert);
        
        return alert;
    }
    
    shouldCreateAlert(alert) {
        const alertKey = this.getAlertKey(alert);
        const lastSent = this.sentAlerts.get(alertKey);
        
        // Check cooldown period
        if (lastSent) {
            const cooldown = this.config.cooldownPeriods[alert.severity.toLowerCase()] || 300000;
            if (Date.now() - lastSent < cooldown) {
                console.log(`🔄 Alert "${alert.title}" still in cooldown period`);
                return false;
            }
        }
        
        // Check hourly rate limit
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentAlerts = this.alertHistory.filter(a => a.timestamp > oneHourAgo);
        if (recentAlerts.length >= this.config.maxAlertsPerHour) {
            console.warn('⚠️ Alert rate limit exceeded, skipping alert');
            return false;
        }
        
        return true;
    }
    
    getAlertKey(alert) {
        return `${alert.severity}:${alert.title}`;
    }
    
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    startAlertProcessor() {
        setInterval(() => {
            this.processAlertQueue();
        }, 1000); // Process every second
    }
    
    async processAlertQueue() {
        if (this.alertQueue.length === 0) return;
        
        const alert = this.alertQueue.shift();
        await this.processAlert(alert);
    }
    
    async processAlert(alert) {
        alert.status = 'processing';
        
        try {
            // Send through all active channels
            const channelPromises = Array.from(this.channels.values()).map(channel =>
                channel.send(alert).catch(error => {
                    console.error(`Channel error for ${channel.name}:`, error);
                    return { success: false, error };
                })
            );
            
            const results = await Promise.all(channelPromises);
            
            // Check if at least one channel succeeded
            const successful = results.some(result => result.success !== false);
            
            if (successful) {
                alert.status = 'sent';
                alert.sentAt = Date.now();
                this.alertHistory.push(alert);
                
                console.log(`✅ Alert sent successfully: ${alert.title}`);
                
            } else if (alert.retryCount < this.config.retryAttempts) {
                // Retry failed alert
                alert.retryCount++;
                alert.status = 'retry';
                
                setTimeout(() => {
                    this.alertQueue.push(alert);
                }, Math.pow(2, alert.retryCount) * 1000); // Exponential backoff
                
                console.warn(`🔄 Retrying alert (${alert.retryCount}/${this.config.retryAttempts}): ${alert.title}`);
                
            } else {
                alert.status = 'failed';
                alert.failedAt = Date.now();
                this.alertHistory.push(alert);
                
                console.error(`❌ Alert failed permanently: ${alert.title}`);
            }
            
        } catch (error) {
            console.error('Error processing alert:', error);
            alert.status = 'error';
            alert.error = error.message;
        }
        
        // Save to storage
        await this.saveAlertHistory();
    }
    
    // Specific alert creation methods for common scenarios
    
    createSuccessRateAlert(currentRate, threshold) {
        return this.createAlert(
            'CRITICAL',
            'Success Rate Below Threshold',
            `Current success rate (${currentRate.toFixed(1)}%) has dropped below the critical threshold of ${threshold}%`,
            {
                currentRate,
                threshold,
                category: 'performance',
                impact: 'high',
                suggestedAction: 'Check directory mappings and form detection logic'
            }
        );
    }
    
    createApiRateLimitAlert(currentUsage, limit) {
        return this.createAlert(
            'WARNING',
            'API Rate Limit Warning',
            `API usage (${currentUsage}/${limit} requests) is approaching the hourly limit`,
            {
                currentUsage,
                limit,
                usagePercent: (currentUsage / limit) * 100,
                category: 'api',
                impact: 'medium',
                suggestedAction: 'Consider implementing request batching or rate limiting'
            }
        );
    }
    
    createPerformanceAlert(avgTime, threshold) {
        return this.createAlert(
            'WARNING',
            'Performance Degradation Detected',
            `Average processing time (${avgTime}ms) exceeds the performance threshold of ${threshold}ms`,
            {
                avgTime,
                threshold,
                category: 'performance',
                impact: 'medium',
                suggestedAction: 'Review form mapping efficiency and reduce unnecessary delays'
            }
        );
    }
    
    createErrorRateAlert(errorRate, threshold) {
        return this.createAlert(
            'CRITICAL',
            'High Error Rate Detected',
            `Error rate (${errorRate.toFixed(1)}%) has exceeded the threshold of ${threshold}%`,
            {
                errorRate,
                threshold,
                category: 'reliability',
                impact: 'high',
                suggestedAction: 'Review error logs and update form mappings for failing directories'
            }
        );
    }
    
    createDirectoryFailureAlert(directoryName, failureCount, successRate) {
        return this.createAlert(
            'WARNING',
            'Directory Failure Alert',
            `Directory "${directoryName}" has ${failureCount} recent failures (${successRate.toFixed(1)}% success rate)`,
            {
                directoryName,
                failureCount,
                successRate,
                category: 'directory',
                impact: 'medium',
                suggestedAction: `Review and update field mappings for ${directoryName}`
            }
        );
    }
    
    createSystemHealthAlert(memoryUsage, cpuUsage) {
        return this.createAlert(
            'WARNING',
            'System Resource Alert',
            `High resource usage detected - Memory: ${memoryUsage.toFixed(1)}%, CPU: ${cpuUsage.toFixed(1)}%`,
            {
                memoryUsage,
                cpuUsage,
                category: 'system',
                impact: 'medium',
                suggestedAction: 'Consider reducing concurrent operations or optimizing performance'
            }
        );
    }
    
    // Alert management methods
    
    async getActiveAlerts() {
        return this.alertHistory.filter(alert => 
            alert.status === 'sent' && 
            !alert.resolved && 
            (Date.now() - alert.timestamp) < (24 * 60 * 60 * 1000) // Last 24 hours
        );
    }
    
    async resolveAlert(alertId, resolution = 'manual') {
        const alert = this.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            alert.resolution = resolution;
            
            await this.saveAlertHistory();
            
            console.log(`✅ Alert resolved: ${alert.title} (${resolution})`);
            return true;
        }
        return false;
    }
    
    async getAlertHistory(hours = 24) {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.alertHistory.filter(alert => alert.timestamp > cutoffTime);
    }
    
    async saveAlertHistory() {
        try {
            // Keep only last 1000 alerts
            const recentAlerts = this.alertHistory.slice(-1000);
            
            await chrome.storage.local.set({
                alertHistory: recentAlerts,
                alertHistoryLastUpdate: Date.now()
            });
            
        } catch (error) {
            console.error('Error saving alert history:', error);
        }
    }
    
    async exportAlerts(format = 'json') {
        const data = {
            alerts: await this.getAlertHistory(),
            config: this.config,
            exportTime: new Date().toISOString(),
            totalAlerts: this.alertHistory.length
        };
        
        if (format === 'csv') {
            return this.convertToCSV(data.alerts);
        }
        
        return JSON.stringify(data, null, 2);
    }
    
    convertToCSV(alerts) {
        const headers = ['ID', 'Severity', 'Title', 'Message', 'Timestamp', 'Status', 'Category'];
        const rows = alerts.map(alert => [
            alert.id,
            alert.severity,
            alert.title,
            alert.message.replace(/,/g, ';'),
            new Date(alert.timestamp).toISOString(),
            alert.status,
            alert.metadata?.category || 'unknown'
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    // Configuration management
    
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        await chrome.storage.local.set({
            alertSystemConfig: this.config
        });
        
        // Reinitialize channels if needed
        this.setupChannels();
        
        console.log('⚙️ Alert system configuration updated');
    }
    
    getConfig() {
        return { ...this.config };
    }
}

/**
 * Console Alert Channel
 * Outputs alerts to browser console with appropriate styling
 */
class ConsoleAlertChannel {
    constructor() {
        this.name = 'console';
    }
    
    async send(alert) {
        const styles = this.getConsoleStyles(alert.severity);
        const timestamp = new Date(alert.timestamp).toLocaleTimeString();
        
        console.log(
            `%c[${alert.severity}] ${timestamp} - ${alert.title}%c\n${alert.message}`,
            styles.title,
            styles.message
        );
        
        if (alert.metadata && Object.keys(alert.metadata).length > 0) {
            console.log('Alert Metadata:', alert.metadata);
        }
        
        return { success: true };
    }
    
    getConsoleStyles(severity) {
        const base = 'font-weight: bold; padding: 2px 6px; border-radius: 3px;';
        
        switch (severity) {
            case 'CRITICAL':
                return {
                    title: `${base} background: #dc2626; color: white;`,
                    message: 'color: #dc2626;'
                };
            case 'WARNING':
                return {
                    title: `${base} background: #f59e0b; color: white;`,
                    message: 'color: #f59e0b;'
                };
            case 'INFO':
                return {
                    title: `${base} background: #2563eb; color: white;`,
                    message: 'color: #2563eb;'
                };
            default:
                return {
                    title: `${base} background: #6b7280; color: white;`,
                    message: 'color: #6b7280;'
                };
        }
    }
}

/**
 * Browser Notification Channel
 * Creates desktop notifications using the Notifications API
 */
class BrowserNotificationChannel {
    constructor() {
        this.name = 'browser';
        this.requestPermission();
    }
    
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
    
    async send(alert) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return { success: false, error: 'Notifications not permitted' };
        }
        
        try {
            const notification = new Notification(`Auto-Bolt Alert: ${alert.title}`, {
                body: alert.message,
                icon: this.getAlertIcon(alert.severity),
                tag: alert.id,
                requireInteraction: alert.severity === 'CRITICAL',
                silent: alert.severity === 'INFO'
            });
            
            // Auto-close after 10 seconds for non-critical alerts
            if (alert.severity !== 'CRITICAL') {
                setTimeout(() => notification.close(), 10000);
            }
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    getAlertIcon(severity) {
        // You could return actual icon paths here
        return '/icons/icon48.png';
    }
}

/**
 * Storage Alert Channel
 * Stores alerts in browser storage for retrieval by dashboard
 */
class StorageAlertChannel {
    constructor() {
        this.name = 'storage';
    }
    
    async send(alert) {
        try {
            // Get existing alerts
            const result = await chrome.storage.local.get('dashboardAlerts');
            const existingAlerts = result.dashboardAlerts || [];
            
            // Add new alert and keep last 100
            const updatedAlerts = [alert, ...existingAlerts].slice(0, 100);
            
            await chrome.storage.local.set({
                dashboardAlerts: updatedAlerts,
                lastAlertUpdate: Date.now()
            });
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

/**
 * Webhook Alert Channel
 * Sends alerts to external webhook endpoints
 */
class WebhookAlertChannel {
    constructor(webhookUrl) {
        this.name = 'webhook';
        this.webhookUrl = webhookUrl;
    }
    
    async send(alert) {
        try {
            const payload = {
                alert: {
                    id: alert.id,
                    severity: alert.severity,
                    title: alert.title,
                    message: alert.message,
                    timestamp: alert.timestamp,
                    metadata: alert.metadata
                },
                source: 'auto-bolt-extension',
                version: '2.0.0'
            };
            
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Auto-Bolt-Monitor/2.0.0'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoBoltAlertSystem };
} else {
    window.AutoBoltAlertSystem = AutoBoltAlertSystem;
}