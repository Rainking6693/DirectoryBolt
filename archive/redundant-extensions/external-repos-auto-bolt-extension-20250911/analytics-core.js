/**
 * AutoBolt Analytics Core System
 * Comprehensive analytics tracking for success metrics
 * Based on Taylor's success criteria
 */

class AutoBoltAnalytics {
    constructor() {
        this.config = {
            targets: {
                userRetention: 60,      // >60% retention rate
                supportTickets: 5,      // <5% of users need support
                multiDirectory: 70,      // >70% use multiple directories
                timeSavings: 120         // 2+ hours saved per user (minutes)
            },
            tracking: {
                enabled: true,
                batchSize: 20,
                flushInterval: 30000,    // 30 seconds
                sessionTimeout: 1800000   // 30 minutes
            },
            reporting: {
                weeklyReports: true,
                monthlyReports: true,
                realTimeDashboard: true
            }
        };
        
        this.metrics = {
            users: new UserRetentionTracker(),
            support: new SupportTicketTracker(),
            features: new FeatureUsageTracker(),
            timeSavings: new TimeSavingsCalculator(),
            performance: new PerformanceMetricsCollector()
        };
        
        this.session = null;
        this.userId = null;
        this.eventQueue = [];
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        console.log('📊 Initializing AutoBolt Analytics System...');
        
        try {
            // Load user ID and session
            await this.loadUserSession();
            
            // Initialize metrics trackers
            await this.initializeTrackers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start batch processing
            this.startBatchProcessor();
            
            // Load cached analytics
            await this.loadCachedAnalytics();
            
            this.isInitialized = true;
            console.log('✅ Analytics system initialized successfully');
            
            // Track initialization event
            this.track('analytics_initialized', {
                version: chrome.runtime.getManifest().version,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
            this.handleError('init_failed', error);
        }
    }
    
    async loadUserSession() {
        try {
            // Get or create user ID
            const result = await chrome.storage.local.get(['userId', 'analyticsSession']);
            
            if (!result.userId) {
                // Generate new user ID
                this.userId = this.generateUserId();
                await chrome.storage.local.set({ userId: this.userId });
                
                // Track new user
                this.trackNewUser();
            } else {
                this.userId = result.userId;
            }
            
            // Check for existing session
            if (result.analyticsSession && this.isSessionValid(result.analyticsSession)) {
                this.session = result.analyticsSession;
                this.session.resumed = true;
            } else {
                // Create new session
                this.session = this.createNewSession();
                await this.saveSession();
            }
            
            console.log(`👤 User: ${this.userId}, Session: ${this.session.id}`);
            
        } catch (error) {
            console.error('Error loading user session:', error);
            this.userId = 'anonymous';
            this.session = this.createNewSession();
        }
    }
    
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    createNewSession() {
        return {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: this.userId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            events: 0,
            directories: new Set(),
            forms: 0,
            errors: 0
        };
    }
    
    isSessionValid(session) {
        const now = Date.now();
        const timeSinceActivity = now - session.lastActivity;
        return timeSinceActivity < this.config.tracking.sessionTimeout;
    }
    
    async saveSession() {
        try {
            await chrome.storage.local.set({
                analyticsSession: {
                    ...this.session,
                    directories: Array.from(this.session.directories)
                }
            });
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }
    
    async initializeTrackers() {
        // Initialize each metrics tracker
        await Promise.all([
            this.metrics.users.init(this.userId),
            this.metrics.support.init(),
            this.metrics.features.init(),
            this.metrics.timeSavings.init(this.userId),
            this.metrics.performance.init()
        ]);
    }
    
    setupEventListeners() {
        // Listen for extension events
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'ANALYTICS_EVENT') {
                this.handleAnalyticsEvent(message.data);
            }
        });
        
        // Listen for performance alerts
        document.addEventListener('autoBoltPerformanceAlert', (event) => {
            this.handlePerformanceAlert(event.detail);
        });
        
        // Listen for error events
        window.addEventListener('error', (event) => {
            this.handleErrorEvent(event);
        });
        
        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleRejectionEvent(event);
        });
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
    }
    
    startBatchProcessor() {
        // Process event queue periodically
        this.batchInterval = setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushEvents();
            }
        }, this.config.tracking.flushInterval);
        
        // Also flush when queue reaches batch size
        this.checkBatchSize = () => {
            if (this.eventQueue.length >= this.config.tracking.batchSize) {
                this.flushEvents();
            }
        };
    }
    
    async loadCachedAnalytics() {
        try {
            const result = await chrome.storage.local.get('cachedAnalytics');
            if (result.cachedAnalytics) {
                // Process any cached events that weren't sent
                const cached = result.cachedAnalytics;
                if (cached.events && cached.events.length > 0) {
                    console.log(`📦 Processing ${cached.events.length} cached events`);
                    this.eventQueue.push(...cached.events);
                    await chrome.storage.local.remove('cachedAnalytics');
                }
            }
        } catch (error) {
            console.error('Error loading cached analytics:', error);
        }
    }
    
    // Core tracking methods
    
    track(eventName, properties = {}) {
        if (!this.config.tracking.enabled) return;
        
        const event = {
            eventName,
            eventType: this.getEventType(eventName),
            userId: this.userId,
            sessionId: this.session.id,
            timestamp: Date.now(),
            properties: {
                ...properties,
                extensionVersion: chrome.runtime.getManifest().version,
                platform: navigator.platform,
                browserVersion: this.getBrowserVersion()
            }
        };
        
        // Update session
        this.session.events++;
        this.session.lastActivity = Date.now();
        
        // Add to queue
        this.eventQueue.push(event);
        
        // Process event locally
        this.processEventLocally(event);
        
        // Check if should flush
        this.checkBatchSize();
        
        return event;
    }
    
    getEventType(eventName) {
        const typeMap = {
            form_filled: 'FORM_PROCESSING',
            form_started: 'FORM_PROCESSING',
            form_completed: 'FORM_PROCESSING',
            form_error: 'ERROR',
            directory_selected: 'DIRECTORY_USAGE',
            directory_switched: 'DIRECTORY_USAGE',
            multi_directory_used: 'FEATURE_USAGE',
            error_occurred: 'ERROR',
            support_request: 'SUPPORT',
            performance_issue: 'PERFORMANCE',
            user_return: 'RETENTION',
            session_start: 'SESSION',
            session_end: 'SESSION'
        };
        
        for (const [pattern, type] of Object.entries(typeMap)) {
            if (eventName.includes(pattern)) {
                return type;
            }
        }
        
        return 'GENERAL';
    }
    
    processEventLocally(event) {
        // Update relevant metrics based on event type
        switch (event.eventType) {
            case 'FORM_PROCESSING':
                this.metrics.timeSavings.trackFormEvent(event);
                this.metrics.features.trackFormUsage(event);
                break;
                
            case 'DIRECTORY_USAGE':
                this.metrics.features.trackDirectoryUsage(event);
                if (event.properties.directoryId) {
                    this.session.directories.add(event.properties.directoryId);
                }
                break;
                
            case 'ERROR':
                this.metrics.support.trackError(event);
                this.session.errors++;
                break;
                
            case 'SUPPORT':
                this.metrics.support.trackSupportRequest(event);
                break;
                
            case 'RETENTION':
                this.metrics.users.trackRetentionEvent(event);
                break;
                
            case 'PERFORMANCE':
                this.metrics.performance.trackPerformanceEvent(event);
                break;
        }
    }
    
    async flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];
        
        try {
            // Try to send to backend
            const response = await this.sendToBackend(eventsToSend);
            
            if (!response.success) {
                // Cache events if sending failed
                await this.cacheEvents(eventsToSend);
            }
            
        } catch (error) {
            console.error('Error flushing events:', error);
            // Cache events for later
            await this.cacheEvents(eventsToSend);
        }
    }
    
    async sendToBackend(events) {
        try {
            const response = await fetch('/.netlify/functions/analytics-collector/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-ID': chrome.runtime.id
                },
                body: JSON.stringify({ events })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.warn('Failed to send analytics to backend:', error);
            return { success: false, error: error.message };
        }
    }
    
    async cacheEvents(events) {
        try {
            const result = await chrome.storage.local.get('cachedAnalytics');
            const cached = result.cachedAnalytics || { events: [] };
            
            cached.events.push(...events);
            
            // Limit cache size
            if (cached.events.length > 500) {
                cached.events = cached.events.slice(-500);
            }
            
            await chrome.storage.local.set({ cachedAnalytics: cached });
            
        } catch (error) {
            console.error('Error caching events:', error);
        }
    }
    
    // Specific tracking methods
    
    trackFormFilled(directoryName, formData) {
        const startTime = performance.now();
        
        const trackingData = {
            directory: directoryName,
            fieldsCount: Object.keys(formData).length,
            formUrl: window.location.href,
            startTime
        };
        
        // Track with performance metrics
        this.metrics.performance.startFormTracking(
            `form_${Date.now()}`,
            directoryName
        );
        
        // Track event
        this.track('form_started', trackingData);
        
        return {
            trackingId: `form_${Date.now()}`,
            startTime,
            complete: (success, errorInfo = null) => {
                const duration = performance.now() - startTime;
                
                // Complete performance tracking
                this.metrics.performance.completeFormTracking(
                    trackingData.trackingId,
                    success,
                    errorInfo
                );
                
                // Track completion
                this.track(success ? 'form_completed' : 'form_error', {
                    ...trackingData,
                    duration,
                    success,
                    error: errorInfo,
                    timeSaved: this.calculateTimeSaved(trackingData.fieldsCount, duration)
                });
                
                // Update time savings
                if (success) {
                    this.metrics.timeSavings.addTimeSaved(
                        this.calculateTimeSaved(trackingData.fieldsCount, duration)
                    );
                }
            }
        };
    }
    
    calculateTimeSaved(fieldsCount, actualDuration) {
        // Estimate manual time: 5 seconds per field + 10 seconds overhead
        const estimatedManualTime = (fieldsCount * 5000) + 10000;
        
        // Time saved is the difference
        const timeSaved = Math.max(0, estimatedManualTime - actualDuration);
        
        return {
            manual: estimatedManualTime,
            actual: actualDuration,
            saved: timeSaved,
            savedMinutes: timeSaved / 60000
        };
    }
    
    trackDirectoryUsage(directoryId, directoryName) {
        this.track('directory_selected', {
            directoryId,
            directoryName,
            isMultiDirectory: this.session.directories.size > 1
        });
        
        // Check for multi-directory usage
        if (this.session.directories.size > 1) {
            this.track('multi_directory_used', {
                directoriesCount: this.session.directories.size,
                directories: Array.from(this.session.directories)
            });
        }
    }
    
    trackError(error, context) {
        this.track('error_occurred', {
            error: error.message || error.toString(),
            stack: error.stack,
            context,
            severity: this.getErrorSeverity(error)
        });
    }
    
    getErrorSeverity(error) {
        // Classify error severity
        const errorMessage = error.message || error.toString();
        
        if (errorMessage.includes('CRITICAL') || errorMessage.includes('FATAL')) {
            return 'critical';
        } else if (errorMessage.includes('ERROR')) {
            return 'high';
        } else if (errorMessage.includes('WARNING')) {
            return 'medium';
        }
        
        return 'low';
    }
    
    trackSupportRequest(type, details) {
        this.track('support_request', {
            type,
            details,
            hasErrors: this.session.errors > 0,
            sessionDuration: Date.now() - this.session.startTime
        });
        
        // Update support metrics
        this.metrics.support.recordSupportRequest(this.userId, type, details);
    }
    
    // User retention tracking
    
    trackNewUser() {
        this.track('user_new', {
            registeredAt: Date.now()
        });
        
        this.metrics.users.registerNewUser(this.userId);
    }
    
    trackUserReturn() {
        this.track('user_return', {
            daysSinceLastVisit: this.metrics.users.getDaysSinceLastVisit(this.userId)
        });
        
        this.metrics.users.recordReturn(this.userId);
    }
    
    // Analytics API methods
    
    async getMetrics(timeRange = '24h') {
        const metrics = {
            overview: await this.getOverviewMetrics(timeRange),
            retention: await this.metrics.users.getRetentionMetrics(timeRange),
            support: await this.metrics.support.getSupportMetrics(timeRange),
            features: await this.metrics.features.getFeatureMetrics(timeRange),
            timeSavings: await this.metrics.timeSavings.getTimeSavingsMetrics(timeRange),
            performance: await this.metrics.performance.getMetrics('all', timeRange)
        };
        
        return this.calculateSuccessMetrics(metrics);
    }
    
    async getOverviewMetrics(timeRange) {
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const since = now - rangeMs;
        
        // Get stored metrics
        const result = await chrome.storage.local.get('analyticsMetrics');
        const stored = result.analyticsMetrics || {};
        
        return {
            totalUsers: stored.totalUsers || 1,
            activeUsers: stored.activeUsers || 1,
            totalSessions: stored.totalSessions || 1,
            totalEvents: stored.totalEvents || 0,
            averageSessionDuration: stored.avgSessionDuration || 0,
            periodStart: since,
            periodEnd: now
        };
    }
    
    parseTimeRange(timeRange) {
        const ranges = {
            '15m': 900000,
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        
        return ranges[timeRange] || ranges['24h'];
    }
    
    calculateSuccessMetrics(metrics) {
        const targets = this.config.targets;
        
        // Calculate success rates vs targets
        const successMetrics = {
            ...metrics,
            success: {
                userRetention: {
                    current: metrics.retention.retentionRate,
                    target: targets.userRetention,
                    achieved: metrics.retention.retentionRate >= targets.userRetention,
                    percentage: (metrics.retention.retentionRate / targets.userRetention) * 100
                },
                supportTickets: {
                    current: metrics.support.ticketRate,
                    target: targets.supportTickets,
                    achieved: metrics.support.ticketRate <= targets.supportTickets,
                    percentage: Math.max(0, 100 - (metrics.support.ticketRate / targets.supportTickets) * 100)
                },
                multiDirectoryUsage: {
                    current: metrics.features.multiDirectoryRate,
                    target: targets.multiDirectory,
                    achieved: metrics.features.multiDirectoryRate >= targets.multiDirectory,
                    percentage: (metrics.features.multiDirectoryRate / targets.multiDirectory) * 100
                },
                timeSavings: {
                    current: metrics.timeSavings.averagePerUser,
                    target: targets.timeSavings,
                    achieved: metrics.timeSavings.averagePerUser >= targets.timeSavings,
                    percentage: (metrics.timeSavings.averagePerUser / targets.timeSavings) * 100
                },
                overall: {
                    score: 0,
                    achieved: 0,
                    total: 4
                }
            },
            timestamp: Date.now()
        };
        
        // Calculate overall success score
        let achieved = 0;
        let totalScore = 0;
        
        for (const metric of Object.values(successMetrics.success)) {
            if (metric.achieved === true) achieved++;
            if (metric.percentage) totalScore += Math.min(100, metric.percentage);
        }
        
        successMetrics.success.overall.achieved = achieved;
        successMetrics.success.overall.score = totalScore / 4;
        
        return successMetrics;
    }
    
    // Reporting methods
    
    async generateReport(type = 'daily') {
        console.log(`📊 Generating ${type} analytics report...`);
        
        const timeRange = this.getReportTimeRange(type);
        const metrics = await this.getMetrics(timeRange);
        
        const report = {
            type,
            generatedAt: Date.now(),
            period: {
                start: Date.now() - this.parseTimeRange(timeRange),
                end: Date.now(),
                range: timeRange
            },
            metrics,
            summary: this.generateReportSummary(metrics),
            recommendations: this.generateRecommendations(metrics),
            alerts: this.generateAlerts(metrics)
        };
        
        // Store report
        await this.storeReport(report);
        
        // Send report if configured
        if (this.shouldSendReport(type)) {
            await this.sendReport(report);
        }
        
        return report;
    }
    
    getReportTimeRange(type) {
        const ranges = {
            daily: '24h',
            weekly: '7d',
            monthly: '30d'
        };
        
        return ranges[type] || '24h';
    }
    
    generateReportSummary(metrics) {
        const achieved = metrics.success.overall.achieved;
        const total = metrics.success.overall.total;
        const score = metrics.success.overall.score;
        
        return {
            status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'needs_improvement',
            score: Math.round(score),
            targetsAchieved: `${achieved}/${total}`,
            highlights: this.getReportHighlights(metrics),
            concerns: this.getReportConcerns(metrics)
        };
    }
    
    getReportHighlights(metrics) {
        const highlights = [];
        
        if (metrics.success.userRetention.achieved) {
            highlights.push(`User retention at ${metrics.retention.retentionRate.toFixed(1)}% (exceeds ${this.config.targets.userRetention}% target)`);
        }
        
        if (metrics.success.supportTickets.achieved) {
            highlights.push(`Support tickets at ${metrics.support.ticketRate.toFixed(1)}% (below ${this.config.targets.supportTickets}% target)`);
        }
        
        if (metrics.success.multiDirectoryUsage.achieved) {
            highlights.push(`Multi-directory usage at ${metrics.features.multiDirectoryRate.toFixed(1)}% (exceeds ${this.config.targets.multiDirectory}% target)`);
        }
        
        if (metrics.success.timeSavings.achieved) {
            const hours = (metrics.timeSavings.averagePerUser / 60).toFixed(1);
            highlights.push(`Average time saved: ${hours} hours per user (exceeds ${this.config.targets.timeSavings / 60} hour target)`);
        }
        
        return highlights;
    }
    
    getReportConcerns(metrics) {
        const concerns = [];
        
        if (!metrics.success.userRetention.achieved) {
            concerns.push({
                metric: 'User Retention',
                current: `${metrics.retention.retentionRate.toFixed(1)}%`,
                target: `${this.config.targets.userRetention}%`,
                gap: `${(this.config.targets.userRetention - metrics.retention.retentionRate).toFixed(1)}%`
            });
        }
        
        if (!metrics.success.supportTickets.achieved) {
            concerns.push({
                metric: 'Support Tickets',
                current: `${metrics.support.ticketRate.toFixed(1)}%`,
                target: `${this.config.targets.supportTickets}%`,
                gap: `${(metrics.support.ticketRate - this.config.targets.supportTickets).toFixed(1)}%`
            });
        }
        
        if (!metrics.success.multiDirectoryUsage.achieved) {
            concerns.push({
                metric: 'Multi-Directory Usage',
                current: `${metrics.features.multiDirectoryRate.toFixed(1)}%`,
                target: `${this.config.targets.multiDirectory}%`,
                gap: `${(this.config.targets.multiDirectory - metrics.features.multiDirectoryRate).toFixed(1)}%`
            });
        }
        
        if (!metrics.success.timeSavings.achieved) {
            const currentHours = (metrics.timeSavings.averagePerUser / 60).toFixed(1);
            const targetHours = (this.config.targets.timeSavings / 60).toFixed(1);
            concerns.push({
                metric: 'Time Savings',
                current: `${currentHours} hours`,
                target: `${targetHours} hours`,
                gap: `${(targetHours - currentHours).toFixed(1)} hours`
            });
        }
        
        return concerns;
    }
    
    generateRecommendations(metrics) {
        const recommendations = [];
        
        // User retention recommendations
        if (!metrics.success.userRetention.achieved) {
            if (metrics.retention.churnRate > 20) {
                recommendations.push({
                    priority: 'high',
                    category: 'retention',
                    action: 'Implement onboarding improvements',
                    impact: 'Could improve retention by 15-25%',
                    details: 'High churn rate indicates users struggling with initial setup'
                });
            }
            
            if (metrics.retention.avgDaysBetweenVisits > 7) {
                recommendations.push({
                    priority: 'medium',
                    category: 'retention',
                    action: 'Add engagement notifications',
                    impact: 'Could increase visit frequency by 30%',
                    details: 'Users returning infrequently, need engagement triggers'
                });
            }
        }
        
        // Support ticket recommendations
        if (!metrics.success.supportTickets.achieved) {
            if (metrics.support.topIssues[0]?.count > 10) {
                recommendations.push({
                    priority: 'high',
                    category: 'support',
                    action: `Address top issue: ${metrics.support.topIssues[0].type}`,
                    impact: `Could reduce support tickets by ${Math.round(metrics.support.topIssues[0].percentage)}%`,
                    details: 'Fixing the most common issue will significantly reduce support load'
                });
            }
            
            if (metrics.support.errorRate > 5) {
                recommendations.push({
                    priority: 'high',
                    category: 'support',
                    action: 'Improve error handling and recovery',
                    impact: 'Could reduce support tickets by 20-30%',
                    details: 'High error rate correlates with support requests'
                });
            }
        }
        
        // Feature usage recommendations
        if (!metrics.success.multiDirectoryUsage.achieved) {
            recommendations.push({
                priority: 'medium',
                category: 'features',
                action: 'Improve directory discovery UI',
                impact: 'Could increase multi-directory usage by 20%',
                details: 'Users may not be aware of available directories'
            });
            
            recommendations.push({
                priority: 'low',
                category: 'features',
                action: 'Add directory recommendations',
                impact: 'Could increase usage by 10-15%',
                details: 'Suggest relevant directories based on user behavior'
            });
        }
        
        // Time savings recommendations
        if (!metrics.success.timeSavings.achieved) {
            if (metrics.performance.forms.avgFormTime > 5000) {
                recommendations.push({
                    priority: 'high',
                    category: 'performance',
                    action: 'Optimize form processing speed',
                    impact: 'Could increase time savings by 30-40%',
                    details: 'Slow form processing reduces overall time savings'
                });
            }
            
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                action: 'Add bulk processing features',
                impact: 'Could double time savings per session',
                details: 'Allow users to process multiple forms at once'
            });
        }
        
        return recommendations;
    }
    
    generateAlerts(metrics) {
        const alerts = [];
        
        // Critical alerts
        if (metrics.support.errorRate > 10) {
            alerts.push({
                level: 'critical',
                type: 'high_error_rate',
                message: `Error rate at ${metrics.support.errorRate.toFixed(1)}% - immediate action required`,
                metric: 'errorRate',
                value: metrics.support.errorRate,
                threshold: 10
            });
        }
        
        if (metrics.retention.retentionRate < 40) {
            alerts.push({
                level: 'critical',
                type: 'low_retention',
                message: `User retention critically low at ${metrics.retention.retentionRate.toFixed(1)}%`,
                metric: 'retentionRate',
                value: metrics.retention.retentionRate,
                threshold: 40
            });
        }
        
        // Warning alerts
        if (metrics.success.overall.score < 50) {
            alerts.push({
                level: 'warning',
                type: 'low_success_score',
                message: `Overall success score at ${metrics.success.overall.score.toFixed(0)}% - below acceptable threshold`,
                metric: 'successScore',
                value: metrics.success.overall.score,
                threshold: 50
            });
        }
        
        if (metrics.performance.forms.errorRate > 5) {
            alerts.push({
                level: 'warning',
                type: 'form_errors',
                message: `Form error rate at ${metrics.performance.forms.errorRate.toFixed(1)}% - monitor closely`,
                metric: 'formErrorRate',
                value: metrics.performance.forms.errorRate,
                threshold: 5
            });
        }
        
        // Info alerts
        if (metrics.features.newFeatureAdoption < 30) {
            alerts.push({
                level: 'info',
                type: 'low_adoption',
                message: 'New feature adoption below 30% - consider improving discovery',
                metric: 'featureAdoption',
                value: metrics.features.newFeatureAdoption,
                threshold: 30
            });
        }
        
        return alerts;
    }
    
    async storeReport(report) {
        try {
            // Get existing reports
            const result = await chrome.storage.local.get('analyticsReports');
            const reports = result.analyticsReports || [];
            
            // Add new report
            reports.push(report);
            
            // Keep only last 30 reports
            if (reports.length > 30) {
                reports.shift();
            }
            
            // Save
            await chrome.storage.local.set({ analyticsReports: reports });
            
            console.log(`📊 Report stored: ${report.type} report at ${new Date(report.generatedAt).toLocaleString()}`);
            
        } catch (error) {
            console.error('Error storing report:', error);
        }
    }
    
    shouldSendReport(type) {
        return (type === 'weekly' && this.config.reporting.weeklyReports) ||
               (type === 'monthly' && this.config.reporting.monthlyReports);
    }
    
    async sendReport(report) {
        // This would send the report to backend or email
        console.log('📧 Sending report...', report.type);
        
        try {
            await this.sendToBackend([{
                eventName: 'report_generated',
                eventType: 'REPORT',
                properties: {
                    reportType: report.type,
                    summary: report.summary,
                    metrics: report.metrics.success
                }
            }]);
        } catch (error) {
            console.error('Error sending report:', error);
        }
    }
    
    // Event handlers
    
    handleAnalyticsEvent(data) {
        // Process analytics events from other parts of the extension
        this.track(data.eventName, data.properties);
    }
    
    handlePerformanceAlert(alert) {
        // Track performance alerts
        this.track('performance_alert', {
            alertType: alert.type,
            severity: alert.severity,
            message: alert.message,
            metadata: alert.metadata
        });
    }
    
    handleErrorEvent(event) {
        // Track JavaScript errors
        this.trackError(event.error || new Error(event.message), {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }
    
    handleRejectionEvent(event) {
        // Track unhandled promise rejections
        this.trackError(new Error(event.reason), {
            type: 'unhandled_rejection',
            promise: event.promise
        });
    }
    
    handlePageHidden() {
        // Save session when page becomes hidden
        this.saveSession();
        
        // Flush any pending events
        if (this.eventQueue.length > 0) {
            this.flushEvents();
        }
    }
    
    handlePageVisible() {
        // Update session activity
        this.session.lastActivity = Date.now();
    }
    
    // Utility methods
    
    getBrowserVersion() {
        const userAgent = navigator.userAgent;
        const match = userAgent.match(/Chrome\/(\d+)/);
        return match ? match[1] : 'unknown';
    }
    
    handleError(context, error) {
        console.error(`Analytics error in ${context}:`, error);
        
        // Try to track the error if possible
        try {
            this.trackError(error, { context, component: 'analytics' });
        } catch (e) {
            // Ignore errors in error handling
        }
    }
    
    // Cleanup
    
    destroy() {
        // Stop batch processor
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
        }
        
        // Save any pending data
        this.flushEvents();
        this.saveSession();
        
        // Stop metrics collectors
        for (const metric of Object.values(this.metrics)) {
            if (metric.stop) {
                metric.stop();
            }
        }
        
        console.log('📊 Analytics system shut down');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoBoltAnalytics;
} else {
    window.AutoBoltAnalytics = AutoBoltAnalytics;
}