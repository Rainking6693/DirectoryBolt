/**
 * Auto-Bolt Performance Metrics Collection System
 * Comprehensive performance monitoring and metrics collection
 * Tracks processing times, resource usage, and system performance
 */

class PerformanceMetricsCollector {
    constructor() {
        this.config = {
            collection: {
                interval: 10000, // 10 seconds
                batchSize: 50,
                retentionPeriod: 86400000, // 24 hours
                detailedMetrics: true
            },
            thresholds: {
                responseTime: 5000, // 5 seconds
                memoryUsage: 100 * 1024 * 1024, // 100MB
                cpuUsage: 80, // 80%
                errorRate: 10 // 10%
            },
            tracking: {
                formFilling: true,
                apiCalls: true,
                directoryProcessing: true,
                systemResources: true,
                userInteractions: true
            }
        };
        
        this.metrics = {
            performance: new PerformanceDataStore(),
            system: new SystemMetricsCollector(),
            forms: new FormProcessingMetrics(),
            api: new APIPerformanceMetrics(),
            errors: new ErrorTrackingMetrics()
        };
        
        this.collectors = new Map();
        this.alerts = [];
        this.isCollecting = false;
        
        this.init();
    }
    
    async init() {
        console.log('📊 Initializing Performance Metrics Collector...');
        
        await this.loadConfig();
        this.setupCollectors();
        this.startCollection();
        this.setupPerformanceObservers();
        
        console.log('✅ Performance Metrics Collector initialized');
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.local.get('performanceConfig');
            if (result.performanceConfig) {
                this.config = { ...this.config, ...result.performanceConfig };
            }
        } catch (error) {
            console.warn('Using default performance config:', error);
        }
    }
    
    setupCollectors() {
        // Form processing collector
        if (this.config.tracking.formFilling) {
            this.collectors.set('forms', new FormPerformanceCollector());
        }
        
        // API performance collector
        if (this.config.tracking.apiCalls) {
            this.collectors.set('api', new APICallPerformanceCollector());
        }
        
        // Directory processing collector
        if (this.config.tracking.directoryProcessing) {
            this.collectors.set('directory', new DirectoryProcessingCollector());
        }
        
        // System resource collector
        if (this.config.tracking.systemResources) {
            this.collectors.set('system', new SystemResourceCollector());
        }
        
        // User interaction collector
        if (this.config.tracking.userInteractions) {
            this.collectors.set('interactions', new UserInteractionCollector());
        }
        
        console.log(`📈 Performance collectors setup: ${Array.from(this.collectors.keys()).join(', ')}`);
    }
    
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }
        
        // Navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordNavigationTiming(entry);
            }
        });
        
        try {
            navigationObserver.observe({ entryTypes: ['navigation'] });
        } catch (error) {
            console.warn('Navigation observer setup failed:', error);
        }
        
        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordResourceTiming(entry);
            }
        });
        
        try {
            resourceObserver.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('Resource observer setup failed:', error);
        }
        
        // Measure timing
        const measureObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordMeasurement(entry);
            }
        });
        
        try {
            measureObserver.observe({ entryTypes: ['measure'] });
        } catch (error) {
            console.warn('Measure observer setup failed:', error);
        }
    }
    
    startCollection() {
        this.isCollecting = true;
        
        // Main collection loop
        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.collection.interval);
        
        // Cleanup old data
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, 300000); // Every 5 minutes
        
        // Save metrics periodically
        this.saveInterval = setInterval(() => {
            this.saveMetrics();
        }, 60000); // Every minute
        
        console.log('🔄 Performance metrics collection started');
    }
    
    async collectMetrics() {
        if (!this.isCollecting) return;
        
        const collectionStart = performance.now();
        const timestamp = Date.now();
        
        try {
            // Collect from all active collectors
            const collectionPromises = Array.from(this.collectors.entries()).map(
                async ([name, collector]) => {
                    try {
                        const data = await collector.collect();
                        return { name, data, success: true };
                    } catch (error) {
                        console.error(`Error collecting ${name} metrics:`, error);
                        return { name, error: error.message, success: false };
                    }
                }
            );
            
            const results = await Promise.all(collectionPromises);
            
            // Process results
            for (const result of results) {
                if (result.success && result.data) {
                    this.processMetricsData(result.name, result.data, timestamp);
                }
            }
            
            // Record collection performance
            const collectionDuration = performance.now() - collectionStart;
            this.recordCollectionMetrics(collectionDuration, timestamp);
            
            // Check for performance issues
            this.analyzePerformance();
            
        } catch (error) {
            console.error('Error in metrics collection cycle:', error);
        }
    }
    
    processMetricsData(collectorName, data, timestamp) {
        // Add timestamp and collector info
        const enrichedData = {
            ...data,
            timestamp,
            collector: collectorName,
            sessionId: this.getSessionId()
        };
        
        // Store in appropriate metrics store
        switch (collectorName) {
            case 'forms':
                this.metrics.forms.add(enrichedData);
                break;
            case 'api':
                this.metrics.api.add(enrichedData);
                break;
            case 'directory':
                this.metrics.performance.addDirectoryMetrics(enrichedData);
                break;
            case 'system':
                this.metrics.system.add(enrichedData);
                break;
            case 'interactions':
                this.metrics.performance.addInteractionMetrics(enrichedData);
                break;
            default:
                this.metrics.performance.add(enrichedData);
        }
    }
    
    recordNavigationTiming(entry) {
        const timing = {
            type: 'navigation',
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            timestamp: Date.now()
        };
        
        this.metrics.performance.addNavigationTiming(timing);
    }
    
    recordResourceTiming(entry) {
        // Only track relevant resources (scripts, stylesheets, API calls)
        if (!this.shouldTrackResource(entry.name)) return;
        
        const timing = {
            type: 'resource',
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            size: entry.transferSize || entry.encodedBodySize,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            timestamp: Date.now()
        };
        
        this.metrics.performance.addResourceTiming(timing);
    }
    
    recordMeasurement(entry) {
        const measurement = {
            type: 'measure',
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            timestamp: Date.now()
        };
        
        this.metrics.performance.addMeasurement(measurement);
    }
    
    shouldTrackResource(url) {
        const trackablePatterns = [
            /api\.airtable\.com/,
            /auto-bolt/,
            /\.js$/,
            /\.css$/
        ];
        
        return trackablePatterns.some(pattern => pattern.test(url));
    }
    
    recordCollectionMetrics(duration, timestamp) {
        this.metrics.performance.addCollectionMetric({
            duration,
            timestamp,
            activeCollectors: this.collectors.size,
            memoryUsage: this.getMemoryUsage()
        });
    }
    
    analyzePerformance() {
        const analysis = this.generatePerformanceAnalysis();
        
        // Check for issues
        if (analysis.issues.length > 0) {
            console.warn('⚠️ Performance issues detected:', analysis.issues);
            
            // Create alerts for significant issues
            for (const issue of analysis.issues) {
                if (issue.severity === 'high') {
                    this.createPerformanceAlert(issue);
                }
            }
        }
    }
    
    generatePerformanceAnalysis() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        const analysis = {
            timestamp: now,
            period: '1h',
            issues: [],
            recommendations: []
        };
        
        // Analyze form processing times
        const formMetrics = this.metrics.forms.getMetricsSince(oneHourAgo);
        if (formMetrics.length > 0) {
            const avgFormTime = formMetrics.reduce((sum, m) => sum + m.duration, 0) / formMetrics.length;
            
            if (avgFormTime > this.config.thresholds.responseTime) {
                analysis.issues.push({
                    type: 'slow_form_processing',
                    severity: 'high',
                    value: avgFormTime,
                    threshold: this.config.thresholds.responseTime,
                    description: `Average form processing time (${avgFormTime.toFixed(0)}ms) exceeds threshold`
                });
            }
        }
        
        // Analyze API performance
        const apiMetrics = this.metrics.api.getMetricsSince(oneHourAgo);
        if (apiMetrics.length > 0) {
            const avgApiTime = apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length;
            const errorRate = (apiMetrics.filter(m => m.error).length / apiMetrics.length) * 100;
            
            if (avgApiTime > 3000) { // 3 seconds for API calls
                analysis.issues.push({
                    type: 'slow_api_calls',
                    severity: 'medium',
                    value: avgApiTime,
                    description: `Average API response time (${avgApiTime.toFixed(0)}ms) is slow`
                });
            }
            
            if (errorRate > this.config.thresholds.errorRate) {
                analysis.issues.push({
                    type: 'high_api_error_rate',
                    severity: 'high',
                    value: errorRate,
                    threshold: this.config.thresholds.errorRate,
                    description: `API error rate (${errorRate.toFixed(1)}%) exceeds threshold`
                });
            }
        }
        
        // Analyze system resources
        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage > this.config.thresholds.memoryUsage) {
            analysis.issues.push({
                type: 'high_memory_usage',
                severity: 'medium',
                value: memoryUsage,
                threshold: this.config.thresholds.memoryUsage,
                description: `Memory usage (${(memoryUsage / 1024 / 1024).toFixed(1)}MB) is high`
            });
        }
        
        return analysis;
    }
    
    createPerformanceAlert(issue) {
        // Dispatch custom event for alert system
        document.dispatchEvent(new CustomEvent('autoBoltPerformanceAlert', {
            detail: {
                type: 'PERFORMANCE_ISSUE',
                severity: issue.severity === 'high' ? 'CRITICAL' : 'WARNING',
                title: `Performance Issue: ${issue.type.replace(/_/g, ' ')}`,
                message: issue.description,
                metadata: {
                    issueType: issue.type,
                    value: issue.value,
                    threshold: issue.threshold,
                    timestamp: Date.now()
                }
            }
        }));
    }
    
    // Public API methods
    
    startFormTracking(formId, directoryName) {
        const trackingData = {
            id: formId,
            directory: directoryName,
            startTime: performance.now(),
            timestamp: Date.now(),
            status: 'started'
        };
        
        this.metrics.forms.startTracking(formId, trackingData);
        
        // Add performance mark
        if ('performance' in window && performance.mark) {
            performance.mark(`form-start-${formId}`);
        }
    }
    
    completeFormTracking(formId, success = true, errorInfo = null) {
        const tracking = this.metrics.forms.completeTracking(formId);
        
        if (tracking) {
            const duration = performance.now() - tracking.startTime;
            
            const completionData = {
                ...tracking,
                endTime: performance.now(),
                duration,
                success,
                error: errorInfo,
                status: 'completed'
            };
            
            this.metrics.forms.recordCompletion(formId, completionData);
            
            // Add performance measure
            if ('performance' in window && performance.measure) {
                try {
                    performance.measure(`form-duration-${formId}`, `form-start-${formId}`);
                } catch (error) {
                    // Mark might not exist, ignore
                }
            }
            
            return completionData;
        }
        
        return null;
    }
    
    trackAPICall(url, method, startTime) {
        const callData = {
            url,
            method,
            startTime,
            timestamp: Date.now()
        };
        
        this.metrics.api.startTracking(callData);
        return callData;
    }
    
    completeAPICall(callData, response, error = null) {
        const duration = performance.now() - callData.startTime;
        
        const completionData = {
            ...callData,
            endTime: performance.now(),
            duration,
            status: response ? response.status : 0,
            success: response ? response.ok : false,
            error,
            responseSize: response ? this.getResponseSize(response) : 0
        };
        
        this.metrics.api.recordCompletion(completionData);
        return completionData;
    }
    
    getResponseSize(response) {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength) : 0;
    }
    
    trackDirectoryProcessing(directoryName, operationType) {
        const processingData = {
            directory: directoryName,
            operation: operationType,
            startTime: performance.now(),
            timestamp: Date.now()
        };
        
        this.metrics.performance.startDirectoryTracking(processingData);
        return processingData;
    }
    
    getMetrics(type = 'all', timeRange = '1h') {
        const now = Date.now();
        let since;
        
        switch (timeRange) {
            case '15m': since = now - 900000; break;
            case '1h': since = now - 3600000; break;
            case '24h': since = now - 86400000; break;
            default: since = now - 3600000;
        }
        
        if (type === 'all') {
            return {
                forms: this.metrics.forms.getMetricsSince(since),
                api: this.metrics.api.getMetricsSince(since),
                system: this.metrics.system.getMetricsSince(since),
                performance: this.metrics.performance.getMetricsSince(since)
            };
        }
        
        const metricsStore = this.metrics[type];
        return metricsStore ? metricsStore.getMetricsSince(since) : null;
    }
    
    generateReport(timeRange = '1h') {
        const metrics = this.getMetrics('all', timeRange);
        const analysis = this.generatePerformanceAnalysis();
        
        return {
            timestamp: Date.now(),
            timeRange,
            summary: {
                formsProcessed: metrics.forms.length,
                apiCalls: metrics.api.length,
                avgFormTime: this.calculateAverageTime(metrics.forms),
                avgApiTime: this.calculateAverageTime(metrics.api),
                successRate: this.calculateSuccessRate(metrics.forms),
                errorRate: this.calculateErrorRate(metrics.api)
            },
            analysis,
            metrics,
            recommendations: this.generateRecommendations(analysis)
        };
    }
    
    calculateAverageTime(metrics) {
        if (metrics.length === 0) return 0;
        const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
        return total / metrics.length;
    }
    
    calculateSuccessRate(metrics) {
        if (metrics.length === 0) return 100;
        const successful = metrics.filter(m => m.success).length;
        return (successful / metrics.length) * 100;
    }
    
    calculateErrorRate(metrics) {
        if (metrics.length === 0) return 0;
        const errors = metrics.filter(m => m.error || !m.success).length;
        return (errors / metrics.length) * 100;
    }
    
    generateRecommendations(analysis) {
        const recommendations = [];
        
        for (const issue of analysis.issues) {
            switch (issue.type) {
                case 'slow_form_processing':
                    recommendations.push({
                        priority: 'high',
                        action: 'Optimize form field detection and mapping algorithms',
                        impact: 'Reduce form processing time by 20-40%'
                    });
                    break;
                    
                case 'slow_api_calls':
                    recommendations.push({
                        priority: 'medium',
                        action: 'Implement request batching and connection pooling',
                        impact: 'Improve API response times by 15-25%'
                    });
                    break;
                    
                case 'high_memory_usage':
                    recommendations.push({
                        priority: 'medium',
                        action: 'Implement data cleanup and memory management',
                        impact: 'Reduce memory usage by 30-50%'
                    });
                    break;
            }
        }
        
        return recommendations;
    }
    
    cleanupOldData() {
        const cutoff = Date.now() - this.config.collection.retentionPeriod;
        
        for (const [name, metricsStore] of Object.entries(this.metrics)) {
            if (metricsStore.cleanup) {
                metricsStore.cleanup(cutoff);
            }
        }
        
        console.log('🧹 Old performance data cleaned up');
    }
    
    async saveMetrics() {
        try {
            const data = {
                timestamp: Date.now(),
                metrics: {},
                config: this.config
            };
            
            // Serialize metrics from each store
            for (const [name, store] of Object.entries(this.metrics)) {
                if (store.serialize) {
                    data.metrics[name] = store.serialize();
                }
            }
            
            await chrome.storage.local.set({
                performanceMetrics: data
            });
            
        } catch (error) {
            console.error('Error saving performance metrics:', error);
        }
    }
    
    getMemoryUsage() {
        if ('performance' in window && performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }
    
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }
    
    stop() {
        this.isCollecting = false;
        
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        
        console.log('⏹️ Performance metrics collection stopped');
    }
}

// Supporting classes for different metric types

class PerformanceDataStore {
    constructor() {
        this.data = [];
        this.tracking = new Map();
    }
    
    add(data) {
        this.data.push(data);
        if (this.data.length > 1000) {
            this.data = this.data.slice(-1000);
        }
    }
    
    getMetricsSince(timestamp) {
        return this.data.filter(item => item.timestamp > timestamp);
    }
    
    cleanup(cutoff) {
        this.data = this.data.filter(item => item.timestamp > cutoff);
    }
    
    serialize() {
        return {
            data: this.data.slice(-100), // Last 100 entries
            tracking: Object.fromEntries(this.tracking)
        };
    }
}

class FormProcessingMetrics extends PerformanceDataStore {
    constructor() {
        super();
        this.activeTracking = new Map();
    }
    
    startTracking(formId, data) {
        this.activeTracking.set(formId, data);
    }
    
    completeTracking(formId) {
        const tracking = this.activeTracking.get(formId);
        if (tracking) {
            this.activeTracking.delete(formId);
            return tracking;
        }
        return null;
    }
    
    recordCompletion(formId, data) {
        this.add(data);
    }
}

class APIPerformanceMetrics extends PerformanceDataStore {
    constructor() {
        super();
        this.activeCalls = new Map();
    }
    
    startTracking(data) {
        const id = `${data.method}-${data.url}-${data.timestamp}`;
        this.activeCalls.set(id, data);
    }
    
    recordCompletion(data) {
        this.add(data);
    }
}

class SystemMetricsCollector {
    constructor() {
        this.data = [];
    }
    
    add(data) {
        this.data.push(data);
        if (this.data.length > 500) {
            this.data = this.data.slice(-500);
        }
    }
    
    getMetricsSince(timestamp) {
        return this.data.filter(item => item.timestamp > timestamp);
    }
    
    cleanup(cutoff) {
        this.data = this.data.filter(item => item.timestamp > cutoff);
    }
    
    serialize() {
        return { data: this.data.slice(-50) };
    }
}

class ErrorTrackingMetrics extends PerformanceDataStore {
    recordError(error, context) {
        this.add({
            error: error.message || error.toString(),
            stack: error.stack,
            context,
            timestamp: Date.now()
        });
    }
}

// Performance collector implementations

class FormPerformanceCollector {
    async collect() {
        // This would be implemented to collect current form processing metrics
        return {
            activeFormsCount: document.querySelectorAll('form').length,
            timestamp: Date.now()
        };
    }
}

class APICallPerformanceCollector {
    async collect() {
        // This would collect current API performance metrics
        return {
            pendingRequests: 0, // Would track actual pending requests
            timestamp: Date.now()
        };
    }
}

class DirectoryProcessingCollector {
    async collect() {
        // This would collect directory-specific performance metrics
        return {
            activeDirectories: 0, // Would track actual active processing
            timestamp: Date.now()
        };
    }
}

class SystemResourceCollector {
    async collect() {
        const metrics = {
            timestamp: Date.now()
        };
        
        // Memory information
        if ('performance' in window && performance.memory) {
            metrics.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // Connection information
        if ('navigator' in window && navigator.connection) {
            metrics.network = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        
        return metrics;
    }
}

class UserInteractionCollector {
    async collect() {
        // This would collect user interaction metrics
        return {
            timestamp: Date.now()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMetricsCollector };
} else {
    window.PerformanceMetricsCollector = PerformanceMetricsCollector;
}