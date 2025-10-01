/**
 * Auto-Bolt Monitoring System Integration
 * Connects all monitoring components and integrates with the main extension
 */

class MonitoringIntegration {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.config = {
            enablePerformanceTracking: true,
            enableAPIMonitoring: true,
            enableAlerts: true,
            enableHotfixDeployment: true,
            enableDashboard: true
        };
    }
    
    async initialize() {
        console.log('🔧 Initializing Auto-Bolt Monitoring Integration...');
        
        try {
            // Load configuration
            await this.loadConfiguration();
            
            // Initialize core monitoring system
            await this.initializeMonitoringSystem();
            
            // Initialize alert system
            await this.initializeAlertSystem();
            
            // Initialize API rate monitor
            await this.initializeAPIMonitoring();
            
            // Initialize performance metrics
            await this.initializePerformanceMetrics();
            
            // Initialize hotfix deployment
            await this.initializeHotfixDeployment();
            
            // Connect all components
            await this.connectComponents();
            
            // Setup extension integration
            await this.setupExtensionIntegration();
            
            this.isInitialized = true;
            console.log('✅ Monitoring Integration initialized successfully');
            
            // Send initialization complete event
            this.broadcastEvent('monitoring:integration:ready', {
                components: Object.keys(this.components),
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize monitoring integration:', error);
            throw error;
        }
    }
    
    async loadConfiguration() {
        try {
            const result = await chrome.storage.local.get('monitoringIntegrationConfig');
            if (result.monitoringIntegrationConfig) {
                this.config = { ...this.config, ...result.monitoringIntegrationConfig };
            }
        } catch (error) {
            console.warn('Using default monitoring integration config:', error);
        }
    }
    
    async initializeMonitoringSystem() {
        if (!this.config.enablePerformanceTracking) return;
        
        console.log('📊 Initializing core monitoring system...');
        
        this.components.monitoring = new AutoBoltMonitoringSystem();
        await this.components.monitoring.init();
        
        console.log('✅ Core monitoring system ready');
    }
    
    async initializeAlertSystem() {
        if (!this.config.enableAlerts) return;
        
        console.log('🚨 Initializing alert system...');
        
        this.components.alerts = new AutoBoltAlertSystem();
        await this.components.alerts.init();
        
        console.log('✅ Alert system ready');
    }
    
    async initializeAPIMonitoring() {
        if (!this.config.enableAPIMonitoring) return;
        
        console.log('🔌 Initializing API monitoring...');
        
        this.components.apiMonitor = new APIRateMonitor();
        await this.components.apiMonitor.init();
        
        console.log('✅ API monitoring ready');
    }
    
    async initializePerformanceMetrics() {
        if (!this.config.enablePerformanceTracking) return;
        
        console.log('📈 Initializing performance metrics...');
        
        this.components.performanceMetrics = new PerformanceMetricsCollector();
        await this.components.performanceMetrics.init();
        
        console.log('✅ Performance metrics ready');
    }
    
    async initializeHotfixDeployment() {
        if (!this.config.enableHotfixDeployment) return;
        
        console.log('🔥 Initializing hotfix deployment...');
        
        this.components.hotfixDeployment = new HotfixDeploymentSystem();
        await this.components.hotfixDeployment.init();
        
        console.log('✅ Hotfix deployment ready');
    }
    
    async connectComponents() {
        console.log('🔗 Connecting monitoring components...');
        
        // Connect API monitor to alert system
        if (this.components.apiMonitor && this.components.alerts) {
            this.components.apiMonitor.setAlertSystem(this.components.alerts);
        }
        
        // Connect monitoring system to alert system
        if (this.components.monitoring && this.components.alerts) {
            this.components.monitoring.addAlertHandler((alert) => {
                this.components.alerts.processAlert(alert);
            });
        }
        
        // Connect performance metrics to alert system
        if (this.components.performanceMetrics && this.components.alerts) {
            document.addEventListener('autoBoltPerformanceAlert', (event) => {
                this.components.alerts.createAlert(
                    event.detail.severity,
                    event.detail.title,
                    event.detail.message,
                    event.detail.metadata
                );
            });
        }
        
        // Connect alert system to hotfix deployment
        if (this.components.alerts && this.components.hotfixDeployment) {
            document.addEventListener('autoBoltCriticalAlert', (event) => {
                // Critical alerts handled by hotfix system
            });
        }
        
        console.log('✅ Component connections established');
    }
    
    async setupExtensionIntegration() {
        console.log('🔌 Setting up extension integration...');
        
        // Integrate with existing extension components
        await this.integrateWithContentScript();
        await this.integrateWithBackgroundScript();
        await this.integrateWithPopup();
        
        console.log('✅ Extension integration complete');
    }
    
    async integrateWithContentScript() {
        // Add monitoring event listeners to content script functionality
        this.setupFormMonitoring();
        this.setupDirectoryMonitoring();
        this.setupErrorMonitoring();
    }
    
    setupFormMonitoring() {
        // Intercept form filling operations
        const originalFillForm = window.fillForm || function() {};
        
        window.fillForm = async (formData) => {
            const formId = this.generateId();
            const startTime = performance.now();
            
            // Start form tracking
            this.trackFormStart(formId, formData.directoryName);
            
            try {
                const result = await originalFillForm.call(this, formData);
                
                // Track successful completion
                this.trackFormComplete(formId, formData.directoryName, performance.now() - startTime);
                
                return result;
                
            } catch (error) {
                // Track form error
                this.trackFormError(formId, formData.directoryName, error);
                throw error;
            }
        };
        
        console.log('📝 Form monitoring integration active');
    }
    
    setupDirectoryMonitoring() {
        // Monitor directory processing operations
        document.addEventListener('directoryProcessingStart', (event) => {
            if (this.components.performanceMetrics) {
                this.components.performanceMetrics.trackDirectoryProcessing(
                    event.detail.directoryName,
                    event.detail.operation
                );
            }
        });
        
        document.addEventListener('directoryProcessingComplete', (event) => {
            // Directory processing completion tracking
            this.broadcastEvent('monitoring:directory:complete', event.detail);
        });
        
        console.log('📁 Directory monitoring integration active');
    }
    
    setupErrorMonitoring() {
        // Global error handling
        window.addEventListener('error', (event) => {
            this.handleGlobalError({
                type: 'javascript-error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError({
                type: 'unhandled-promise-rejection',
                reason: event.reason,
                promise: event.promise
            });
        });
        
        console.log('🚨 Error monitoring integration active');
    }
    
    async integrateWithBackgroundScript() {
        // Set up message passing with background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleBackgroundMessage(message, sender, sendResponse);
            });
        }
    }
    
    async integrateWithPopup() {
        // Integration with popup for monitoring controls
        document.addEventListener('popupMonitoringRequest', (event) => {
            this.handlePopupRequest(event.detail);
        });
    }
    
    handleBackgroundMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'GET_MONITORING_STATUS':
                sendResponse({
                    initialized: this.isInitialized,
                    components: Object.keys(this.components),
                    health: this.getSystemHealth()
                });
                break;
                
            case 'GET_METRICS':
                const metrics = this.getAllMetrics();
                sendResponse(metrics);
                break;
                
            case 'TRIGGER_HEALTH_CHECK':
                this.performHealthCheck().then(result => {
                    sendResponse(result);
                });
                return true; // Async response
                
            case 'EXPORT_MONITORING_DATA':
                const exportData = this.exportAllData();
                sendResponse(exportData);
                break;
        }
    }
    
    handlePopupRequest(request) {
        switch (request.type) {
            case 'dashboard-data':
                this.sendDashboardData();
                break;
            case 'system-status':
                this.sendSystemStatus();
                break;
            case 'recent-alerts':
                this.sendRecentAlerts();
                break;
        }
    }
    
    trackFormStart(formId, directoryName) {
        this.broadcastEvent('autoBoltFormStart', {
            formId,
            directoryName,
            timestamp: Date.now()
        });
        
        if (this.components.performanceMetrics) {
            this.components.performanceMetrics.startFormTracking(formId, directoryName);
        }
    }
    
    trackFormComplete(formId, directoryName, duration) {
        this.broadcastEvent('autoBoltFormComplete', {
            formId,
            directoryName,
            duration,
            timestamp: Date.now()
        });
        
        if (this.components.performanceMetrics) {
            this.components.performanceMetrics.completeFormTracking(formId, true);
        }
    }
    
    trackFormError(formId, directoryName, error) {
        this.broadcastEvent('autoBoltFormError', {
            formId,
            directoryName,
            error: error.message,
            errorType: error.type || 'UNKNOWN',
            timestamp: Date.now()
        });
        
        if (this.components.performanceMetrics) {
            this.components.performanceMetrics.completeFormTracking(formId, false, error);
        }
    }
    
    handleGlobalError(errorData) {
        console.error('🚨 Global error detected:', errorData);
        
        if (this.components.alerts) {
            this.components.alerts.createAlert(
                'CRITICAL',
                'System Error Detected',
                `${errorData.type}: ${errorData.message || errorData.reason}`,
                errorData
            );
        }
        
        // Broadcast for other systems
        this.broadcastEvent('monitoring:global:error', errorData);
    }
    
    getSystemHealth() {
        const health = {
            overall: 'healthy',
            components: {},
            issues: [],
            timestamp: Date.now()
        };
        
        // Check each component
        for (const [name, component] of Object.entries(this.components)) {
            try {
                if (component.getHealth) {
                    health.components[name] = component.getHealth();
                } else {
                    health.components[name] = { status: 'unknown' };
                }
            } catch (error) {
                health.components[name] = { 
                    status: 'error', 
                    error: error.message 
                };
                health.issues.push(`${name}: ${error.message}`);
            }
        }
        
        // Determine overall health
        const hasErrors = Object.values(health.components).some(c => c.status === 'error');
        const hasWarnings = Object.values(health.components).some(c => c.status === 'warning');
        
        if (hasErrors) {
            health.overall = 'unhealthy';
        } else if (hasWarnings) {
            health.overall = 'warning';
        }
        
        return health;
    }
    
    getAllMetrics() {
        const metrics = {
            timestamp: Date.now(),
            components: {}
        };
        
        // Collect metrics from all components
        if (this.components.monitoring) {
            metrics.components.monitoring = this.components.monitoring.getCurrentMetrics();
        }
        
        if (this.components.apiMonitor) {
            metrics.components.api = this.components.apiMonitor.getMetrics();
        }
        
        if (this.components.performanceMetrics) {
            metrics.components.performance = this.components.performanceMetrics.getMetrics();
        }
        
        if (this.components.alerts) {
            metrics.components.alerts = {
                active: this.components.alerts.getActiveAlerts(),
                recent: this.components.alerts.getAlertHistory(1) // Last hour
            };
        }
        
        return metrics;
    }
    
    async performHealthCheck() {
        console.log('🏥 Performing system health check...');
        
        const healthCheck = {
            timestamp: Date.now(),
            overall: 'healthy',
            components: [],
            recommendations: []
        };
        
        // Check each component
        for (const [name, component] of Object.entries(this.components)) {
            try {
                let componentHealth;
                
                if (component.performHealthCheck) {
                    componentHealth = await component.performHealthCheck();
                } else {
                    // Basic health check
                    componentHealth = {
                        name,
                        status: component.isInitialized !== false ? 'healthy' : 'unhealthy',
                        details: 'Basic health check'
                    };
                }
                
                healthCheck.components.push(componentHealth);
                
                if (componentHealth.status !== 'healthy') {
                    healthCheck.overall = 'warning';
                    if (componentHealth.recommendations) {
                        healthCheck.recommendations.push(...componentHealth.recommendations);
                    }
                }
                
            } catch (error) {
                healthCheck.components.push({
                    name,
                    status: 'error',
                    error: error.message
                });
                healthCheck.overall = 'unhealthy';
            }
        }
        
        return healthCheck;
    }
    
    exportAllData() {
        const exportData = {
            timestamp: Date.now(),
            version: '1.0.0',
            components: {},
            system: this.getSystemHealth(),
            metrics: this.getAllMetrics()
        };
        
        // Export data from each component
        for (const [name, component] of Object.entries(this.components)) {
            try {
                if (component.exportData) {
                    exportData.components[name] = component.exportData();
                }
            } catch (error) {
                console.error(`Error exporting data from ${name}:`, error);
            }
        }
        
        return exportData;
    }
    
    sendDashboardData() {
        const dashboardData = {
            metrics: this.getAllMetrics(),
            health: this.getSystemHealth(),
            alerts: this.components.alerts ? this.components.alerts.getActiveAlerts() : [],
            timestamp: Date.now()
        };
        
        this.broadcastEvent('monitoring:dashboard:data', dashboardData);
    }
    
    sendSystemStatus() {
        const status = {
            initialized: this.isInitialized,
            components: Object.keys(this.components),
            health: this.getSystemHealth(),
            uptime: Date.now() - (this.initTime || Date.now())
        };
        
        this.broadcastEvent('monitoring:system:status', status);
    }
    
    sendRecentAlerts() {
        const alerts = this.components.alerts ? 
            this.components.alerts.getAlertHistory(24) : []; // Last 24 hours
        
        this.broadcastEvent('monitoring:alerts:recent', { alerts });
    }
    
    broadcastEvent(eventType, data) {
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent(eventType, { detail: data }));
        
        // Send to background script if available
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: 'MONITORING_EVENT',
                eventType,
                data
            }).catch(() => {
                // Background script might not be available, ignore
            });
        }
    }
    
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Public API methods
    
    getComponent(name) {
        return this.components[name];
    }
    
    isComponentActive(name) {
        return !!this.components[name];
    }
    
    async updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        await chrome.storage.local.set({
            monitoringIntegrationConfig: this.config
        });
        
        console.log('⚙️ Monitoring integration configuration updated');
    }
    
    getConfiguration() {
        return { ...this.config };
    }
    
    async restart() {
        console.log('🔄 Restarting monitoring integration...');
        
        // Stop all components
        for (const component of Object.values(this.components)) {
            if (component.stop) {
                component.stop();
            }
        }
        
        // Clear components
        this.components = {};
        this.isInitialized = false;
        
        // Reinitialize
        await this.initialize();
    }
    
    stop() {
        console.log('⏹️ Stopping monitoring integration...');
        
        for (const component of Object.values(this.components)) {
            if (component.stop) {
                component.stop();
            }
        }
        
        this.components = {};
        this.isInitialized = false;
        
        this.broadcastEvent('monitoring:integration:stopped', {
            timestamp: Date.now()
        });
    }
}

// Auto-initialize if in appropriate context
let monitoringIntegration = null;

async function initializeMonitoring() {
    if (!monitoringIntegration) {
        monitoringIntegration = new MonitoringIntegration();
        await monitoringIntegration.initialize();
        
        // Make available globally for debugging
        if (typeof window !== 'undefined') {
            window.monitoringIntegration = monitoringIntegration;
        }
    }
    
    return monitoringIntegration;
}

// Initialize on load if in browser context
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMonitoring);
    } else {
        initializeMonitoring().catch(console.error);
    }
}

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MonitoringIntegration, initializeMonitoring };
} else if (typeof window !== 'undefined') {
    window.MonitoringIntegration = MonitoringIntegration;
    window.initializeMonitoring = initializeMonitoring;
}