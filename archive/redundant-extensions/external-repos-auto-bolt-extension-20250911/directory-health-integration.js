/**
 * Directory Health Monitoring System Integration
 * Production-ready integration for AutoBolt Chrome Extension
 * 
 * This module integrates the complete monitoring system with the existing
 * AutoBolt extension infrastructure and provides production deployment configuration.
 */

class DirectoryHealthIntegration {
    constructor() {
        this.healthMonitor = null;
        this.scheduler = null;
        this.isInitialized = false;
        this.settings = {
            enabled: true,
            monitoringInterval: 3600000, // 1 hour
            alertsEnabled: true,
            performanceTracking: true,
            resourceLimit: 0.03 // 3% CPU usage limit
        };
    }

    /**
     * Initialize the complete monitoring system
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('Directory Health Monitoring already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Directory Health Monitoring System...');

            // Load user settings
            await this.loadSettings();

            if (!this.settings.enabled) {
                console.log('Monitoring disabled by user settings');
                return;
            }

            // Initialize core monitoring system
            this.healthMonitor = new DirectoryHealthMonitor();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for initialization

            // Initialize scheduler
            this.scheduler = new MonitoringScheduler(this.healthMonitor);

            // Setup Chrome extension integration
            await this.setupChromeIntegration();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Start monitoring system
            this.startMonitoring();

            this.isInitialized = true;
            console.log('✅ Directory Health Monitoring System initialized successfully');

            // Notify extension of successful initialization
            this.notifyExtension('monitoring_initialized', {
                directories: this.healthMonitor.directories.length,
                status: 'active'
            });

        } catch (error) {
            console.error('❌ Failed to initialize monitoring system:', error);
            this.notifyExtension('monitoring_error', { error: error.message });
        }
    }

    /**
     * Start the monitoring system
     */
    startMonitoring() {
        if (!this.scheduler) {
            throw new Error('Scheduler not initialized');
        }

        console.log('▶️ Starting directory health monitoring...');
        this.scheduler.startWithExtensionIntegration();

        // Setup monitoring status updates
        setInterval(() => {
            this.updateMonitoringStatus();
        }, 60000); // Update every minute
    }

    /**
     * Stop the monitoring system
     */
    stopMonitoring() {
        if (this.scheduler) {
            this.scheduler.stop();
            console.log('⏹️ Directory health monitoring stopped');
        }
    }

    /**
     * Setup Chrome extension integration
     */
    async setupChromeIntegration() {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.log('Chrome extension API not available - running in standalone mode');
            return;
        }

        // Listen for messages from extension popup/content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleExtensionMessage(request, sender, sendResponse);
            return true; // Indicates async response
        });

        // Setup badge updates
        this.updateExtensionBadge();
        setInterval(() => {
            this.updateExtensionBadge();
        }, 300000); // Update badge every 5 minutes

        // Setup context menu integration
        this.setupContextMenu();

        console.log('Chrome extension integration configured');
    }

    /**
     * Handle messages from Chrome extension components
     */
    async handleExtensionMessage(request, sender, sendResponse) {
        try {
            switch (request.type) {
                case 'get_monitoring_status':
                    const status = this.getComprehensiveStatus();
                    sendResponse({ success: true, data: status });
                    break;

                case 'force_directory_scan':
                    await this.forceDirectoryScan(request.directoryId);
                    sendResponse({ success: true, message: 'Scan initiated' });
                    break;

                case 'get_health_report':
                    const report = this.healthMonitor.getHealthReport();
                    sendResponse({ success: true, data: report });
                    break;

                case 'update_settings':
                    await this.updateSettings(request.settings);
                    sendResponse({ success: true, message: 'Settings updated' });
                    break;

                case 'export_data':
                    const exportData = this.exportMonitoringData();
                    sendResponse({ success: true, data: exportData });
                    break;

                case 'run_diagnostics':
                    const diagnostics = await this.runDiagnostics();
                    sendResponse({ success: true, data: diagnostics });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown request type' });
            }
        } catch (error) {
            console.error('Extension message handler error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Get comprehensive monitoring status
     */
    getComprehensiveStatus() {
        if (!this.healthMonitor || !this.scheduler) {
            return { status: 'not_initialized' };
        }

        const monitoringStatus = this.healthMonitor.getMonitoringStatus();
        const schedulerStatus = this.scheduler.getSchedulerStatus();

        return {
            initialized: this.isInitialized,
            monitoring: {
                active: schedulerStatus.isRunning,
                directories: monitoringStatus.totalDirectories,
                healthy: monitoringStatus.healthyDirectories,
                healthPercentage: monitoringStatus.healthyPercentage,
                lastUpdate: monitoringStatus.lastUpdate
            },
            performance: {
                averageResponseTime: Math.round(monitoringStatus.averageMetrics.responseTime),
                successRate: Math.round(monitoringStatus.averageMetrics.successRate * 100),
                selectorAccuracy: Math.round(monitoringStatus.averageMetrics.selectorAccuracy * 100)
            },
            scheduler: {
                taskQueue: schedulerStatus.taskQueue,
                performance: schedulerStatus.performance
            },
            alerts: this.getActiveAlerts(),
            settings: this.settings
        };
    }

    /**
     * Force scan of specific directory or all directories
     */
    async forceDirectoryScan(directoryId = null) {
        if (!this.scheduler) {
            throw new Error('Scheduler not available');
        }

        if (directoryId) {
            await this.scheduler.forceDirectoryCheck(directoryId);
            console.log(`Forced scan initiated for directory: ${directoryId}`);
        } else {
            // Force scan all high priority directories
            this.scheduler.addTask({
                type: 'priority_check',
                priority: 'high',
                scheduledTime: Date.now(),
                estimatedDuration: 30000
            });
            console.log('Forced scan initiated for all high-priority directories');
        }
    }

    /**
     * Update extension badge with monitoring status
     */
    updateExtensionBadge() {
        if (!chrome.action) return;

        const status = this.getComprehensiveStatus();
        
        if (!status.initialized) {
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#f39c12' });
            chrome.action.setTitle({ title: 'Directory monitoring not initialized' });
            return;
        }

        const alerts = status.alerts.length;
        const healthPercentage = status.monitoring.healthPercentage || 0;

        if (alerts > 0) {
            chrome.action.setBadgeText({ text: alerts.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
            chrome.action.setTitle({ title: `${alerts} active monitoring alerts` });
        } else if (healthPercentage >= 90) {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#27ae60' });
            chrome.action.setTitle({ title: `Monitoring active - ${Math.round(healthPercentage)}% healthy` });
        } else {
            chrome.action.setBadgeText({ text: '⚠' });
            chrome.action.setBadgeBackgroundColor({ color: '#f39c12' });
            chrome.action.setTitle({ title: `Monitoring active - ${Math.round(healthPercentage)}% healthy` });
        }
    }

    /**
     * Setup context menu integration
     */
    setupContextMenu() {
        if (!chrome.contextMenus) return;

        chrome.contextMenus.create({
            id: 'directory-health-dashboard',
            title: 'Open Monitoring Dashboard',
            contexts: ['action']
        });

        chrome.contextMenus.create({
            id: 'force-directory-scan',
            title: 'Run Health Check',
            contexts: ['action']
        });

        chrome.contextMenus.onClicked.addListener((info) => {
            if (info.menuItemId === 'directory-health-dashboard') {
                chrome.tabs.create({ url: chrome.runtime.getURL('directory-health-dashboard.html') });
            } else if (info.menuItemId === 'force-directory-scan') {
                this.forceDirectoryScan();
            }
        });
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor system performance
        setInterval(() => {
            if (this.settings.performanceTracking) {
                this.trackSystemPerformance();
            }
        }, 300000); // Every 5 minutes

        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (memoryUsage > 0.8) {
                    console.warn('High memory usage detected:', Math.round(memoryUsage * 100) + '%');
                    this.optimizeMemoryUsage();
                }
            }, 60000); // Every minute
        }
    }

    /**
     * Track system performance metrics
     */
    trackSystemPerformance() {
        const status = this.getComprehensiveStatus();
        
        const performanceData = {
            timestamp: Date.now(),
            healthPercentage: status.monitoring.healthPercentage,
            averageResponseTime: status.performance.averageResponseTime,
            successRate: status.performance.successRate,
            activeAlerts: status.alerts.length,
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
        };

        // Store performance data (keep last 24 hours)
        const existingData = JSON.parse(localStorage.getItem('monitoring_performance_data') || '[]');
        existingData.push(performanceData);

        // Keep only last 24 hours of data (288 data points at 5-minute intervals)
        if (existingData.length > 288) {
            existingData.splice(0, existingData.length - 288);
        }

        localStorage.setItem('monitoring_performance_data', JSON.stringify(existingData));
    }

    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        console.log('Optimizing memory usage...');
        
        // Clear old health data
        if (this.healthMonitor) {
            for (const [directoryId, healthData] of this.healthMonitor.healthData.entries()) {
                // Keep only last 10 error history entries
                if (healthData.errorHistory.length > 10) {
                    healthData.errorHistory = healthData.errorHistory.slice(-10);
                }
            }
        }

        // Clear old alerts
        try {
            const alerts = JSON.parse(localStorage.getItem('directory_alerts') || '[]');
            if (alerts.length > 100) {
                const recentAlerts = alerts.slice(-100);
                localStorage.setItem('directory_alerts', JSON.stringify(recentAlerts));
            }
        } catch (error) {
            console.warn('Failed to optimize alert storage:', error);
        }

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }

        console.log('Memory optimization completed');
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        if (!this.healthMonitor) return [];

        const alerts = [];
        for (const [directoryId, healthData] of this.healthMonitor.healthData.entries()) {
            const directory = this.healthMonitor.directories.find(d => d.id === directoryId);
            healthData.alerts.forEach(alert => {
                alerts.push({
                    directoryId: directoryId,
                    directoryName: directory ? directory.name : directoryId,
                    ...alert,
                    timestamp: Date.now()
                });
            });
        }

        return alerts.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, warning: 2, medium: 3, info: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }

    /**
     * Update monitoring settings
     */
    async updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        await this.saveSettings();

        // Apply settings changes
        if (this.scheduler && newSettings.hasOwnProperty('monitoringInterval')) {
            this.scheduler.adjustSchedulingConfiguration({
                intervals: {
                    highPriority: newSettings.monitoringInterval / 2,
                    mediumPriority: newSettings.monitoringInterval,
                    lowPriority: newSettings.monitoringInterval * 2
                }
            });
        }

        if (newSettings.hasOwnProperty('enabled')) {
            if (newSettings.enabled && !this.scheduler.isRunning) {
                this.startMonitoring();
            } else if (!newSettings.enabled && this.scheduler.isRunning) {
                this.stopMonitoring();
            }
        }

        console.log('Monitoring settings updated:', newSettings);
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('directory_monitoring_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    Object.assign(this.settings, settings);
                    console.log('Monitoring settings loaded');
                }
            }
        } catch (error) {
            console.warn('Failed to load monitoring settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('directory_monitoring_settings', JSON.stringify(this.settings));
            }
        } catch (error) {
            console.warn('Failed to save monitoring settings:', error);
        }
    }

    /**
     * Export comprehensive monitoring data
     */
    exportMonitoringData() {
        const data = {
            timestamp: new Date().toISOString(),
            system: {
                version: '1.0.0',
                status: this.getComprehensiveStatus()
            },
            healthData: this.healthMonitor ? this.healthMonitor.exportHealthData() : null,
            performanceHistory: localStorage.getItem('monitoring_performance_data'),
            alerts: localStorage.getItem('directory_alerts'),
            settings: this.settings
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Run comprehensive diagnostics
     */
    async runDiagnostics() {
        console.log('Running system diagnostics...');

        const diagnostics = {
            timestamp: new Date().toISOString(),
            system: {
                initialized: this.isInitialized,
                componentsLoaded: {
                    healthMonitor: !!this.healthMonitor,
                    scheduler: !!this.scheduler
                }
            },
            directories: {
                total: this.healthMonitor ? this.healthMonitor.directories.length : 0,
                monitored: 0,
                healthy: 0,
                withIssues: 0
            },
            performance: {
                memoryUsage: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
                } : null
            },
            storage: {
                healthData: this.checkStorageItem('directory_health_data'),
                alerts: this.checkStorageItem('directory_alerts'),
                performanceData: this.checkStorageItem('monitoring_performance_data'),
                settings: this.checkStorageItem('directory_monitoring_settings')
            }
        };

        // Check directory health if available
        if (this.healthMonitor) {
            for (const [directoryId, healthData] of this.healthMonitor.healthData.entries()) {
                diagnostics.directories.monitored++;
                
                if (healthData.status === 'accessible' && healthData.alerts.length === 0) {
                    diagnostics.directories.healthy++;
                } else {
                    diagnostics.directories.withIssues++;
                }
            }
        }

        console.log('Diagnostics completed:', diagnostics);
        return diagnostics;
    }

    /**
     * Check storage item size and validity
     */
    checkStorageItem(key) {
        try {
            const item = localStorage.getItem(key);
            return {
                exists: !!item,
                size: item ? item.length : 0,
                valid: item ? this.isValidJSON(item) : false
            };
        } catch (error) {
            return {
                exists: false,
                size: 0,
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Check if string is valid JSON
     */
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Update monitoring status for extension
     */
    updateMonitoringStatus() {
        if (this.isInitialized) {
            const status = this.getComprehensiveStatus();
            this.notifyExtension('monitoring_status_update', status);
        }
    }

    /**
     * Notify extension components of events
     */
    notifyExtension(eventType, data) {
        // Send message to all extension tabs
        if (chrome.tabs) {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && tab.url.startsWith('chrome-extension://')) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: eventType,
                            data: data
                        }).catch(() => {
                            // Ignore errors for inactive tabs
                        });
                    }
                });
            });
        }

        // Broadcast event for dashboard
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('directoryMonitoringEvent', {
                detail: { type: eventType, data: data }
            }));
        }
    }

    /**
     * Shutdown monitoring system
     */
    async shutdown() {
        console.log('Shutting down Directory Health Monitoring System...');
        
        this.stopMonitoring();
        
        // Save final state
        await this.saveSettings();
        
        // Clear intervals and cleanup
        this.isInitialized = false;
        this.healthMonitor = null;
        this.scheduler = null;
        
        console.log('Directory Health Monitoring System shutdown complete');
    }
}

// Global integration instance
let globalMonitoringIntegration = null;

/**
 * Initialize monitoring system for Chrome extension
 */
async function initializeDirectoryMonitoring() {
    if (globalMonitoringIntegration) {
        console.log('Directory monitoring already initialized');
        return globalMonitoringIntegration;
    }

    globalMonitoringIntegration = new DirectoryHealthIntegration();
    await globalMonitoringIntegration.initialize();
    
    return globalMonitoringIntegration;
}

/**
 * Get global monitoring instance
 */
function getDirectoryMonitoring() {
    return globalMonitoringIntegration;
}

// Auto-initialize for Chrome extension background script
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(initializeDirectoryMonitoring);
    chrome.runtime.onInstalled.addListener(initializeDirectoryMonitoring);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DirectoryHealthIntegration, initializeDirectoryMonitoring, getDirectoryMonitoring };
} else if (typeof window !== 'undefined') {
    window.DirectoryHealthIntegration = DirectoryHealthIntegration;
    window.initializeDirectoryMonitoring = initializeDirectoryMonitoring;
    window.getDirectoryMonitoring = getDirectoryMonitoring;
}