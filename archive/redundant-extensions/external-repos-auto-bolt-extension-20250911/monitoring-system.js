/**
 * Auto-Bolt Monitoring System
 * Core monitoring engine that tracks success rates, performance, and alerts
 * Integrates with extension components to provide real-time monitoring
 */

class AutoBoltMonitoringSystem {
    constructor() {
        this.isInitialized = false;
        this.config = {
            successRateThreshold: 80,
            apiRateThreshold: 90,
            performanceThreshold: 5000,
            errorRateThreshold: 15,
            alertCooldown: 300000, // 5 minutes
            dataRetentionDays: 7,
            batchSize: 100,
            updateInterval: 10000 // 10 seconds
        };
        
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            errorsByType: new Map(),
            directoryStats: new Map(),
            apiUsage: {
                requests: 0,
                limit: 1000,
                resetTime: null
            },
            sessionStartTime: Date.now(),
            lastAlertTime: new Map()
        };
        
        this.alerts = {
            active: [],
            history: [],
            handlers: []
        };
        
        this.dataCollector = new MonitoringDataCollector();
        this.alertManager = new MonitoringAlertManager();
        this.performanceTracker = new PerformanceTracker();
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🔧 Initializing Auto-Bolt Monitoring System...');
            
            await this.loadConfig();
            await this.loadHistoricalData();
            this.setupEventListeners();
            this.startDataCollection();
            
            this.isInitialized = true;
            console.log('✅ Monitoring System initialized successfully');
            
            // Send initialization event
            this.broadcast('monitoring:initialized', { status: 'ready' });
            
        } catch (error) {
            console.error('❌ Failed to initialize monitoring system:', error);
            this.handleError('INIT_ERROR', error);
        }
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.local.get('monitoringConfig');
            if (result.monitoringConfig) {
                this.config = { ...this.config, ...result.monitoringConfig };
            }
        } catch (error) {
            console.warn('Using default monitoring config:', error);
        }
    }
    
    async loadHistoricalData() {
        try {
            const result = await chrome.storage.local.get(['monitoringMetrics', 'monitoringAlerts']);
            
            if (result.monitoringMetrics) {
                const historical = result.monitoringMetrics;
                this.metrics.totalRequests = historical.totalRequests || 0;
                this.metrics.successfulRequests = historical.successfulRequests || 0;
                this.metrics.failedRequests = historical.failedRequests || 0;
            }
            
            if (result.monitoringAlerts) {
                this.alerts.history = result.monitoringAlerts.history || [];
            }
            
        } catch (error) {
            console.warn('Could not load historical data:', error);
        }
    }
    
    setupEventListeners() {
        // Listen for extension events
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sender, sendResponse);
            });
        }
        
        // Listen for form filling events
        document.addEventListener('autoBoltFormStart', (e) => {
            this.trackFormStart(e.detail);
        });
        
        document.addEventListener('autoBoltFormComplete', (e) => {
            this.trackFormComplete(e.detail);
        });
        
        document.addEventListener('autoBoltFormError', (e) => {
            this.trackFormError(e.detail);
        });
        
        document.addEventListener('autoBoltApiRequest', (e) => {
            this.trackApiRequest(e.detail);
        });
        
        // Performance monitoring
        window.addEventListener('beforeunload', () => {
            this.saveMetrics();
        });
    }
    
    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'MONITORING_GET_METRICS':
                sendResponse(this.getCurrentMetrics());
                break;
                
            case 'MONITORING_GET_ALERTS':
                sendResponse(this.alerts.active);
                break;
                
            case 'MONITORING_RESET_METRICS':
                this.resetMetrics();
                sendResponse({ success: true });
                break;
                
            case 'MONITORING_UPDATE_CONFIG':
                this.updateConfig(message.config);
                sendResponse({ success: true });
                break;
                
            case 'MONITORING_EXPORT_DATA':
                sendResponse(this.exportData());
                break;
        }
    }
    
    trackFormStart(details) {
        this.performanceTracker.startTracking(details.formId, details.directoryName);
        
        // Update directory stats
        if (!this.metrics.directoryStats.has(details.directoryName)) {
            this.metrics.directoryStats.set(details.directoryName, {
                name: details.directoryName,
                attempts: 0,
                successes: 0,
                failures: 0,
                avgTime: 0,
                totalTime: 0,
                lastAttempt: null
            });
        }
        
        const dirStats = this.metrics.directoryStats.get(details.directoryName);
        dirStats.attempts++;
        dirStats.lastAttempt = Date.now();
        
        console.log(`📝 Form tracking started: ${details.directoryName}`);
    }
    
    trackFormComplete(details) {
        const duration = this.performanceTracker.endTracking(details.formId);
        
        this.metrics.totalRequests++;
        this.metrics.successfulRequests++;
        
        // Update directory stats
        if (this.metrics.directoryStats.has(details.directoryName)) {
            const dirStats = this.metrics.directoryStats.get(details.directoryName);
            dirStats.successes++;
            dirStats.totalTime += duration;
            dirStats.avgTime = dirStats.totalTime / dirStats.successes;
        }
        
        // Update average response time
        this.updateAverageResponseTime(duration);
        
        console.log(`✅ Form completed successfully: ${details.directoryName} (${duration}ms)`);
        
        // Check if we need alerts
        this.checkAlertConditions();
    }
    
    trackFormError(details) {
        this.metrics.totalRequests++;
        this.metrics.failedRequests++;
        
        // Track error by type
        const errorType = details.errorType || 'UNKNOWN';
        const count = this.metrics.errorsByType.get(errorType) || 0;
        this.metrics.errorsByType.set(errorType, count + 1);
        
        // Update directory stats
        if (this.metrics.directoryStats.has(details.directoryName)) {
            const dirStats = this.metrics.directoryStats.get(details.directoryName);
            dirStats.failures++;
        }
        
        console.error(`❌ Form error: ${details.directoryName} - ${errorType}`, details);
        
        // Create alert if error rate is high
        this.checkErrorRateAlert();
    }
    
    trackApiRequest(details) {
        this.metrics.apiUsage.requests++;
        
        // Reset counter if time period has passed
        const now = Date.now();
        if (!this.metrics.apiUsage.resetTime || now > this.metrics.apiUsage.resetTime) {
            this.metrics.apiUsage.requests = 1;
            this.metrics.apiUsage.resetTime = now + (60 * 60 * 1000); // 1 hour
        }
        
        // Check API rate limit
        this.checkApiRateLimit();
    }
    
    updateAverageResponseTime(newTime) {
        const totalSuccessful = this.metrics.successfulRequests;
        if (totalSuccessful === 1) {
            this.metrics.avgResponseTime = newTime;
        } else {
            this.metrics.avgResponseTime = ((this.metrics.avgResponseTime * (totalSuccessful - 1)) + newTime) / totalSuccessful;
        }
    }
    
    getCurrentMetrics() {
        const successRate = this.metrics.totalRequests > 0 
            ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
            : 0;
            
        const errorRate = this.metrics.totalRequests > 0 
            ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
            : 0;
            
        const apiUsagePercent = (this.metrics.apiUsage.requests / this.metrics.apiUsage.limit) * 100;
        
        return {
            successRate,
            errorRate,
            totalRequests: this.metrics.totalRequests,
            successfulRequests: this.metrics.successfulRequests,
            failedRequests: this.metrics.failedRequests,
            avgResponseTime: this.metrics.avgResponseTime,
            apiUsage: {
                current: this.metrics.apiUsage.requests,
                limit: this.metrics.apiUsage.limit,
                percentage: apiUsagePercent,
                resetTime: this.metrics.apiUsage.resetTime
            },
            directoryStats: Array.from(this.metrics.directoryStats.values()),
            errorsByType: Object.fromEntries(this.metrics.errorsByType),
            sessionUptime: Date.now() - this.metrics.sessionStartTime,
            timestamp: Date.now()
        };
    }
    
    checkAlertConditions() {
        const metrics = this.getCurrentMetrics();
        
        // Success rate alert
        if (metrics.successRate < this.config.successRateThreshold) {
            this.createAlert('CRITICAL', 'Low Success Rate', 
                `Success rate (${metrics.successRate.toFixed(1)}%) is below threshold (${this.config.successRateThreshold}%)`);
        }
        
        // Performance alert
        if (metrics.avgResponseTime > this.config.performanceThreshold) {
            this.createAlert('WARNING', 'Performance Degradation', 
                `Average response time (${metrics.avgResponseTime}ms) exceeds threshold (${this.config.performanceThreshold}ms)`);
        }
    }
    
    checkErrorRateAlert() {
        const metrics = this.getCurrentMetrics();
        
        if (metrics.errorRate > this.config.errorRateThreshold) {
            this.createAlert('CRITICAL', 'High Error Rate', 
                `Error rate (${metrics.errorRate.toFixed(1)}%) exceeds threshold (${this.config.errorRateThreshold}%)`);
        }
    }
    
    checkApiRateLimit() {
        const usagePercent = (this.metrics.apiUsage.requests / this.metrics.apiUsage.limit) * 100;
        
        if (usagePercent > this.config.apiRateThreshold) {
            this.createAlert('WARNING', 'API Rate Limit Warning', 
                `API usage (${usagePercent.toFixed(1)}%) is approaching limit`);
        }
    }
    
    createAlert(severity, title, message, metadata = {}) {
        const alertId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const alert = {
            id: alertId,
            severity,
            title,
            message,
            timestamp: Date.now(),
            resolved: false,
            metadata
        };
        
        // Check cooldown
        const lastAlert = this.metrics.lastAlertTime.get(title);
        if (lastAlert && (Date.now() - lastAlert) < this.config.alertCooldown) {
            console.log(`🔄 Alert "${title}" still in cooldown period`);
            return;
        }
        
        this.alerts.active.push(alert);
        this.alerts.history.push(alert);
        this.metrics.lastAlertTime.set(title, Date.now());
        
        console.warn(`🚨 Alert created: [${severity}] ${title} - ${message}`);
        
        // Trigger alert handlers
        this.alerts.handlers.forEach(handler => {
            try {
                handler(alert);
            } catch (error) {
                console.error('Alert handler error:', error);
            }
        });
        
        // Broadcast alert
        this.broadcast('monitoring:alert', alert);
        
        // Save to storage
        this.saveAlerts();
    }
    
    resolveAlert(alertId) {
        const alert = this.alerts.active.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            
            // Remove from active alerts
            this.alerts.active = this.alerts.active.filter(a => a.id !== alertId);
            
            console.log(`✅ Alert resolved: ${alert.title}`);
            this.broadcast('monitoring:alert:resolved', alert);
        }
    }
    
    addAlertHandler(handler) {
        if (typeof handler === 'function') {
            this.alerts.handlers.push(handler);
        }
    }
    
    startDataCollection() {
        // Periodic data collection and cleanup
        setInterval(() => {
            this.saveMetrics();
            this.cleanupOldData();
        }, this.config.updateInterval);
        
        // Performance monitoring
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000); // Every 30 seconds
    }
    
    async saveMetrics() {
        try {
            await chrome.storage.local.set({
                monitoringMetrics: {
                    totalRequests: this.metrics.totalRequests,
                    successfulRequests: this.metrics.successfulRequests,
                    failedRequests: this.metrics.failedRequests,
                    avgResponseTime: this.metrics.avgResponseTime,
                    errorsByType: Object.fromEntries(this.metrics.errorsByType),
                    directoryStats: Object.fromEntries(this.metrics.directoryStats),
                    apiUsage: this.metrics.apiUsage,
                    lastUpdate: Date.now()
                }
            });
        } catch (error) {
            console.error('Error saving metrics:', error);
        }
    }
    
    async saveAlerts() {
        try {
            await chrome.storage.local.set({
                monitoringAlerts: {
                    active: this.alerts.active,
                    history: this.alerts.history.slice(-1000), // Keep last 1000 alerts
                    lastUpdate: Date.now()
                }
            });
        } catch (error) {
            console.error('Error saving alerts:', error);
        }
    }
    
    cleanupOldData() {
        const cutoffTime = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
        
        // Cleanup old alerts
        this.alerts.history = this.alerts.history.filter(alert => alert.timestamp > cutoffTime);
        
        // Cleanup resolved alerts older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.alerts.active = this.alerts.active.filter(alert => 
            !alert.resolved || alert.resolvedAt > oneHourAgo
        );
    }
    
    collectPerformanceMetrics() {
        // Collect browser performance metrics
        if (performance && performance.memory) {
            const memoryInfo = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
            
            // Check memory usage
            const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
            if (memoryUsagePercent > 80) {
                this.createAlert('WARNING', 'High Memory Usage', 
                    `Memory usage (${memoryUsagePercent.toFixed(1)}%) is high`, 
                    { memoryInfo });
            }
        }
    }
    
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            errorsByType: new Map(),
            directoryStats: new Map(),
            apiUsage: {
                requests: 0,
                limit: 1000,
                resetTime: null
            },
            sessionStartTime: Date.now(),
            lastAlertTime: new Map()
        };
        
        console.log('🔄 Metrics reset');
        this.saveMetrics();
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        chrome.storage.local.set({ monitoringConfig: this.config });
        console.log('⚙️ Monitoring config updated');
    }
    
    exportData() {
        return {
            metrics: this.getCurrentMetrics(),
            alerts: {
                active: this.alerts.active,
                history: this.alerts.history.slice(-100) // Last 100 alerts
            },
            config: this.config,
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        };
    }
    
    broadcast(eventType, data) {
        // Broadcast to content scripts and popup
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: eventType,
                        data
                    }).catch(() => {
                        // Tab might not have content script, ignore error
                    });
                });
            });
        }
        
        // Dispatch custom event for local listeners
        document.dispatchEvent(new CustomEvent(eventType, { detail: data }));
    }
    
    handleError(errorType, error) {
        console.error(`Monitoring system error [${errorType}]:`, error);
        
        this.createAlert('CRITICAL', `System Error: ${errorType}`, 
            error.message || 'An unexpected error occurred', 
            { error: error.toString() });
    }
}

/**
 * Performance Tracker utility class
 */
class PerformanceTracker {
    constructor() {
        this.activeTracking = new Map();
    }
    
    startTracking(id, name) {
        this.activeTracking.set(id, {
            name,
            startTime: performance.now(),
            startTimestamp: Date.now()
        });
    }
    
    endTracking(id) {
        const tracking = this.activeTracking.get(id);
        if (tracking) {
            const duration = performance.now() - tracking.startTime;
            this.activeTracking.delete(id);
            return duration;
        }
        return 0;
    }
}

/**
 * Data Collector utility class
 */
class MonitoringDataCollector {
    constructor() {
        this.batchData = [];
        this.batchSize = 50;
    }
    
    collect(dataPoint) {
        this.batchData.push({
            ...dataPoint,
            timestamp: Date.now()
        });
        
        if (this.batchData.length >= this.batchSize) {
            this.flush();
        }
    }
    
    async flush() {
        if (this.batchData.length === 0) return;
        
        try {
            const batch = [...this.batchData];
            this.batchData = [];
            
            await chrome.storage.local.set({
                [`monitoringBatch_${Date.now()}`]: batch
            });
            
        } catch (error) {
            console.error('Error flushing monitoring data:', error);
        }
    }
}

/**
 * Alert Manager utility class
 */
class MonitoringAlertManager {
    constructor() {
        this.alertChannels = [];
    }
    
    addChannel(channel) {
        this.alertChannels.push(channel);
    }
    
    async sendAlert(alert) {
        for (const channel of this.alertChannels) {
            try {
                await channel.send(alert);
            } catch (error) {
                console.error('Alert channel error:', error);
            }
        }
    }
}

// Initialize monitoring system if in service worker context
if (typeof importScripts === 'function') {
    // We're in a service worker
    let monitoringSystem = null;
    
    chrome.runtime.onStartup.addListener(() => {
        monitoringSystem = new AutoBoltMonitoringSystem();
    });
    
    chrome.runtime.onInstalled.addListener(() => {
        monitoringSystem = new AutoBoltMonitoringSystem();
    });
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoBoltMonitoringSystem, PerformanceTracker };
} else {
    window.AutoBoltMonitoringSystem = AutoBoltMonitoringSystem;
}