/**
 * Support Ticket Tracker
 * Monitors error rates and support requests
 * Target: <5% of users need support
 */

class SupportTicketTracker {
    constructor() {
        this.config = {
            ticketThreshold: 5,      // <5% of users should need support
            errorSeverityLevels: {
                critical: 10,        // Weight for critical errors
                high: 5,            // Weight for high severity errors
                medium: 2,          // Weight for medium severity errors
                low: 1              // Weight for low severity errors
            },
            supportCategories: [
                'technical_error',
                'form_filling_issue',
                'directory_problem',
                'performance_issue',
                'user_experience',
                'feature_request',
                'authentication',
                'other'
            ],
            trackingWindow: 90      // Days to track support data
        };
        
        this.supportData = {
            tickets: new Map(),      // Support tickets by user
            errors: new Map(),       // Error tracking by user
            issues: new Map(),       // Common issues tracking
            userProblems: new Map()  // User-specific problem tracking
        };
        
        this.errorPatterns = new Map();  // Pattern recognition for common errors
        this.totalUsers = 0;
        this.isInitialized = false;
    }
    
    async init() {
        console.log('🎫 Initializing Support Ticket Tracker...');
        
        try {
            // Load existing support data
            await this.loadSupportData();
            
            // Initialize error pattern recognition
            this.initializeErrorPatterns();
            
            // Set up error listeners
            this.setupErrorListeners();
            
            // Load user count
            await this.loadUserCount();
            
            this.isInitialized = true;
            console.log('✅ Support Ticket Tracker initialized');
            
        } catch (error) {
            console.error('Error initializing Support Ticket Tracker:', error);
        }
    }
    
    async loadSupportData() {
        try {
            const result = await chrome.storage.local.get([
                'supportTickets',
                'errorTracking',
                'supportIssues',
                'userProblems'
            ]);
            
            if (result.supportTickets) {
                this.supportData.tickets = new Map(Object.entries(result.supportTickets));
            }
            
            if (result.errorTracking) {
                this.supportData.errors = new Map(Object.entries(result.errorTracking));
            }
            
            if (result.supportIssues) {
                this.supportData.issues = new Map(Object.entries(result.supportIssues));
            }
            
            if (result.userProblems) {
                this.supportData.userProblems = new Map(Object.entries(result.userProblems));
            }
            
            console.log(`📊 Loaded support data for ${this.supportData.tickets.size} users`);
            
        } catch (error) {
            console.error('Error loading support data:', error);
        }
    }
    
    async loadUserCount() {
        try {
            const result = await chrome.storage.local.get('userRetentionData');
            if (result.userRetentionData) {
                this.totalUsers = Object.keys(result.userRetentionData).length;
            } else {
                this.totalUsers = 1; // Default to prevent division by zero
            }
        } catch (error) {
            console.error('Error loading user count:', error);
            this.totalUsers = 1;
        }
    }
    
    initializeErrorPatterns() {
        // Common error patterns that often lead to support requests
        this.errorPatterns.set('form_not_filling', {
            keywords: ['form', 'field', 'not filling', 'empty', 'blank'],
            category: 'form_filling_issue',
            severity: 'high',
            userImpact: 'blocks_main_functionality',
            commonCauses: ['selector_mismatch', 'dynamic_content', 'security_restrictions']
        });
        
        this.errorPatterns.set('directory_not_found', {
            keywords: ['directory', 'not found', '404', 'missing'],
            category: 'directory_problem',
            severity: 'high',
            userImpact: 'prevents_usage',
            commonCauses: ['site_changes', 'unsupported_site', 'network_issues']
        });
        
        this.errorPatterns.set('performance_slow', {
            keywords: ['slow', 'timeout', 'performance', 'hanging', 'freeze'],
            category: 'performance_issue',
            severity: 'medium',
            userImpact: 'degrades_experience',
            commonCauses: ['large_forms', 'network_latency', 'resource_constraints']
        });
        
        this.errorPatterns.set('authentication_failed', {
            keywords: ['auth', 'login', 'token', 'permission', 'access denied'],
            category: 'authentication',
            severity: 'critical',
            userImpact: 'blocks_access',
            commonCauses: ['expired_tokens', 'permission_changes', 'api_changes']
        });
        
        this.errorPatterns.set('ui_elements_missing', {
            keywords: ['ui', 'element', 'button', 'missing', 'not visible'],
            category: 'user_experience',
            severity: 'medium',
            userImpact: 'confuses_users',
            commonCauses: ['css_changes', 'dom_updates', 'responsive_issues']
        });
    }
    
    setupErrorListeners() {
        // Listen for JavaScript errors
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.trackError({
                    type: 'javascript_error',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                });
            });
            
            // Listen for unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.trackError({
                    type: 'promise_rejection',
                    message: event.reason?.message || event.reason,
                    stack: event.reason?.stack
                });
            });
        }
        
        // Listen for custom error events
        if (typeof document !== 'undefined') {
            document.addEventListener('autoBoltError', (event) => {
                this.trackError(event.detail);
            });
        }
    }
    
    // Error tracking methods
    
    trackError(error, userId = null) {
        try {
            // Get current user ID if not provided
            if (!userId) {
                userId = this.getCurrentUserId();
            }
            
            const errorData = {
                id: this.generateErrorId(),
                userId,
                timestamp: Date.now(),
                type: error.type || 'unknown',
                message: error.message || error.toString(),
                stack: error.stack,
                context: error.context || {},
                severity: this.classifyErrorSeverity(error),
                category: this.categorizeError(error),
                pattern: this.matchErrorPattern(error),
                userAgent: navigator.userAgent,
                url: window.location?.href
            };
            
            // Store error
            this.storeError(userId, errorData);
            
            // Check if this should generate a support ticket
            this.evaluateForSupportTicket(userId, errorData);
            
            // Update error patterns
            this.updateErrorPatterns(errorData);
            
            console.log(`🚨 Error tracked: ${errorData.severity} - ${errorData.category}`);
            
        } catch (trackingError) {
            console.error('Error in error tracking:', trackingError);
        }
    }
    
    storeError(userId, errorData) {
        if (!this.supportData.errors.has(userId)) {
            this.supportData.errors.set(userId, {
                userId,
                errors: [],
                errorCount: 0,
                severityCount: {
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0
                },
                lastError: null,
                errorScore: 0
            });
        }
        
        const userErrors = this.supportData.errors.get(userId);
        userErrors.errors.push(errorData);
        userErrors.errorCount++;
        userErrors.severityCount[errorData.severity]++;
        userErrors.lastError = Date.now();
        
        // Calculate error score (weighted by severity)
        userErrors.errorScore += this.config.errorSeverityLevels[errorData.severity];
        
        // Keep only recent errors
        if (userErrors.errors.length > 100) {
            const removed = userErrors.errors.shift();
            userErrors.errorScore -= this.config.errorSeverityLevels[removed.severity];
        }
        
        this.supportData.errors.set(userId, userErrors);
    }
    
    evaluateForSupportTicket(userId, errorData) {
        const userErrors = this.supportData.errors.get(userId);
        
        // Criteria for auto-generating support ticket
        const shouldCreateTicket = 
            errorData.severity === 'critical' ||
            (errorData.severity === 'high' && userErrors.severityCount.high >= 3) ||
            userErrors.errorScore >= 20 ||
            this.hasRepeatedPattern(userId, errorData.pattern);
        
        if (shouldCreateTicket) {
            this.createSupportTicket(userId, {
                type: 'auto_generated',
                category: errorData.category,
                reason: 'error_threshold_exceeded',
                errorData,
                userErrorSummary: userErrors
            });
        }
    }
    
    hasRepeatedPattern(userId, pattern) {
        if (!pattern) return false;
        
        const userErrors = this.supportData.errors.get(userId);
        const recentErrors = userErrors.errors.slice(-10); // Last 10 errors
        
        const patternCount = recentErrors.filter(error => error.pattern === pattern).length;
        return patternCount >= 3; // Same pattern 3 times in last 10 errors
    }
    
    classifyErrorSeverity(error) {
        const message = (error.message || '').toLowerCase();
        const type = (error.type || '').toLowerCase();
        
        // Critical errors - block functionality completely
        if (
            message.includes('critical') ||
            message.includes('fatal') ||
            type.includes('auth') ||
            message.includes('permission denied') ||
            message.includes('network error')
        ) {
            return 'critical';
        }
        
        // High severity - significant impact on user experience
        if (
            message.includes('form') && message.includes('failed') ||
            message.includes('directory') && message.includes('not found') ||
            message.includes('timeout') ||
            type.includes('form_error')
        ) {
            return 'high';
        }
        
        // Medium severity - moderate impact
        if (
            message.includes('warning') ||
            message.includes('slow') ||
            message.includes('performance') ||
            type.includes('ui_issue')
        ) {
            return 'medium';
        }
        
        // Default to low severity
        return 'low';
    }
    
    categorizeError(error) {
        const message = (error.message || '').toLowerCase();
        const type = (error.type || '').toLowerCase();
        
        // Check each category
        if (message.includes('form') || type.includes('form')) {
            return 'form_filling_issue';
        }
        
        if (message.includes('directory') || type.includes('directory')) {
            return 'directory_problem';
        }
        
        if (message.includes('performance') || message.includes('slow') || message.includes('timeout')) {
            return 'performance_issue';
        }
        
        if (message.includes('auth') || message.includes('login') || message.includes('token')) {
            return 'authentication';
        }
        
        if (message.includes('ui') || message.includes('element') || type.includes('ui')) {
            return 'user_experience';
        }
        
        return 'technical_error';
    }
    
    matchErrorPattern(error) {
        const message = (error.message || '').toLowerCase();
        
        for (const [patternName, pattern] of this.errorPatterns.entries()) {
            const hasKeyword = pattern.keywords.some(keyword => message.includes(keyword));
            if (hasKeyword) {
                return patternName;
            }
        }
        
        return null;
    }
    
    updateErrorPatterns(errorData) {
        // Update pattern frequency for learning
        if (errorData.pattern) {
            const pattern = this.errorPatterns.get(errorData.pattern);
            if (pattern) {
                pattern.frequency = (pattern.frequency || 0) + 1;
                pattern.lastSeen = Date.now();
                this.errorPatterns.set(errorData.pattern, pattern);
            }
        }
    }
    
    // Support ticket management
    
    recordSupportRequest(userId, type, details) {
        const ticketId = this.generateTicketId();
        
        const ticket = {
            id: ticketId,
            userId,
            type,
            details,
            status: 'open',
            createdAt: Date.now(),
            category: this.categorizeSupportRequest(type, details),
            priority: this.calculatePriority(userId, type),
            source: 'user_reported',
            relatedErrors: this.getRelatedErrors(userId, type)
        };
        
        this.storeSupportTicket(userId, ticket);
        
        // Update user problem tracking
        this.updateUserProblems(userId, ticket);
        
        console.log(`🎫 Support ticket created: ${ticketId} for user ${userId}`);
        
        return ticket;
    }
    
    createSupportTicket(userId, autoData) {
        const ticketId = this.generateTicketId();
        
        const ticket = {
            id: ticketId,
            userId,
            type: autoData.type,
            category: autoData.category,
            reason: autoData.reason,
            status: 'open',
            createdAt: Date.now(),
            source: 'auto_generated',
            priority: this.calculatePriority(userId, autoData.category),
            errorData: autoData.errorData,
            userErrorSummary: autoData.userErrorSummary,
            autoResolution: this.suggestAutoResolution(autoData)
        };
        
        this.storeSupportTicket(userId, ticket);
        
        // Update user problem tracking
        this.updateUserProblems(userId, ticket);
        
        console.log(`🤖 Auto-generated ticket: ${ticketId} for ${autoData.category}`);
        
        return ticket;
    }
    
    storeSupportTicket(userId, ticket) {
        if (!this.supportData.tickets.has(userId)) {
            this.supportData.tickets.set(userId, {
                userId,
                tickets: [],
                ticketCount: 0,
                openTickets: 0,
                lastTicket: null,
                categories: {}
            });
        }
        
        const userTickets = this.supportData.tickets.get(userId);
        userTickets.tickets.push(ticket);
        userTickets.ticketCount++;
        userTickets.openTickets++;
        userTickets.lastTicket = Date.now();
        
        // Track category frequency
        const category = ticket.category;
        userTickets.categories[category] = (userTickets.categories[category] || 0) + 1;
        
        this.supportData.tickets.set(userId, userTickets);
        
        // Update global issue tracking
        this.updateGlobalIssueTracking(ticket);
    }
    
    updateGlobalIssueTracking(ticket) {
        const issueKey = ticket.category;
        
        if (!this.supportData.issues.has(issueKey)) {
            this.supportData.issues.set(issueKey, {
                category: issueKey,
                count: 0,
                users: new Set(),
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                priority: 'low',
                patterns: new Map()
            });
        }
        
        const issue = this.supportData.issues.get(issueKey);
        issue.count++;
        issue.users.add(ticket.userId);
        issue.lastSeen = Date.now();
        
        // Update priority based on frequency
        const userPercentage = (issue.users.size / this.totalUsers) * 100;
        if (userPercentage > 10) {
            issue.priority = 'critical';
        } else if (userPercentage > 5) {
            issue.priority = 'high';
        } else if (userPercentage > 2) {
            issue.priority = 'medium';
        }
        
        // Track patterns if error data available
        if (ticket.errorData && ticket.errorData.pattern) {
            const pattern = ticket.errorData.pattern;
            const patternCount = issue.patterns.get(pattern) || 0;
            issue.patterns.set(pattern, patternCount + 1);
        }
        
        this.supportData.issues.set(issueKey, {
            ...issue,
            users: Array.from(issue.users) // Convert Set to Array for storage
        });
    }
    
    updateUserProblems(userId, ticket) {
        if (!this.supportData.userProblems.has(userId)) {
            this.supportData.userProblems.set(userId, {
                userId,
                problemsScore: 0,
                categories: new Set(),
                riskLevel: 'low',
                interventionsNeeded: [],
                lastProblem: null
            });
        }
        
        const userProblems = this.supportData.userProblems.get(userId);
        userProblems.problemsScore += this.getProblemScore(ticket);
        userProblems.categories.add(ticket.category);
        userProblems.lastProblem = Date.now();
        
        // Calculate risk level
        if (userProblems.problemsScore >= 50) {
            userProblems.riskLevel = 'critical';
            userProblems.interventionsNeeded.push('immediate_support');
        } else if (userProblems.problemsScore >= 25) {
            userProblems.riskLevel = 'high';
            userProblems.interventionsNeeded.push('proactive_outreach');
        } else if (userProblems.problemsScore >= 10) {
            userProblems.riskLevel = 'medium';
            userProblems.interventionsNeeded.push('follow_up');
        }
        
        this.supportData.userProblems.set(userId, {
            ...userProblems,
            categories: Array.from(userProblems.categories) // Convert Set to Array for storage
        });
    }
    
    categorizeSupportRequest(type, details) {
        const detailsLower = (details || '').toLowerCase();
        
        if (detailsLower.includes('form') || detailsLower.includes('field') || detailsLower.includes('filling')) {
            return 'form_filling_issue';
        }
        
        if (detailsLower.includes('directory') || detailsLower.includes('site') || detailsLower.includes('website')) {
            return 'directory_problem';
        }
        
        if (detailsLower.includes('slow') || detailsLower.includes('performance') || detailsLower.includes('speed')) {
            return 'performance_issue';
        }
        
        if (detailsLower.includes('login') || detailsLower.includes('auth') || detailsLower.includes('access')) {
            return 'authentication';
        }
        
        if (detailsLower.includes('feature') || detailsLower.includes('request') || detailsLower.includes('suggestion')) {
            return 'feature_request';
        }
        
        if (detailsLower.includes('ui') || detailsLower.includes('interface') || detailsLower.includes('confusing')) {
            return 'user_experience';
        }
        
        return 'other';
    }
    
    calculatePriority(userId, category) {
        const userErrors = this.supportData.errors.get(userId);
        const userTickets = this.supportData.tickets.get(userId);
        
        let priority = 'low';
        
        // High priority categories
        if (['authentication', 'form_filling_issue', 'directory_problem'].includes(category)) {
            priority = 'high';
        }
        
        // Escalate based on user error history
        if (userErrors && userErrors.errorScore >= 20) {
            priority = 'critical';
        } else if (userErrors && userErrors.errorScore >= 10) {
            priority = priority === 'low' ? 'medium' : 'high';
        }
        
        // Escalate based on ticket history
        if (userTickets && userTickets.openTickets >= 3) {
            priority = 'critical';
        } else if (userTickets && userTickets.ticketCount >= 2) {
            priority = priority === 'low' ? 'medium' : 'high';
        }
        
        return priority;
    }
    
    getProblemScore(ticket) {
        const baseScores = {
            critical: 20,
            high: 10,
            medium: 5,
            low: 2
        };
        
        let score = baseScores[ticket.priority] || 2;
        
        // Add bonus for certain categories
        if (['authentication', 'form_filling_issue'].includes(ticket.category)) {
            score += 5;
        }
        
        // Auto-generated tickets indicate more serious problems
        if (ticket.source === 'auto_generated') {
            score += 3;
        }
        
        return score;
    }
    
    getRelatedErrors(userId, category) {
        const userErrors = this.supportData.errors.get(userId);
        if (!userErrors) return [];
        
        // Get recent errors related to the ticket category
        return userErrors.errors
            .filter(error => error.category === category)
            .slice(-5) // Last 5 related errors
            .map(error => ({
                timestamp: error.timestamp,
                message: error.message,
                severity: error.severity,
                pattern: error.pattern
            }));
    }
    
    suggestAutoResolution(autoData) {
        const suggestions = [];
        
        // Common resolutions based on error patterns
        if (autoData.errorData.pattern === 'form_not_filling') {
            suggestions.push({
                action: 'refresh_page',
                description: 'Try refreshing the page and running AutoBolt again',
                success_rate: 70
            });
            
            suggestions.push({
                action: 'check_selectors',
                description: 'Verify the form fields are visible and accessible',
                success_rate: 85
            });
        }
        
        if (autoData.errorData.pattern === 'directory_not_found') {
            suggestions.push({
                action: 'update_directory',
                description: 'The directory may need updating for this website',
                success_rate: 90
            });
        }
        
        if (autoData.errorData.pattern === 'performance_slow') {
            suggestions.push({
                action: 'close_other_tabs',
                description: 'Close other browser tabs to improve performance',
                success_rate: 60
            });
            
            suggestions.push({
                action: 'check_network',
                description: 'Verify your internet connection is stable',
                success_rate: 50
            });
        }
        
        return suggestions;
    }
    
    // Analytics methods
    
    async getSupportMetrics(timeRange = '30d') {
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const since = now - rangeMs;
        
        // Count users with support tickets in the time range
        let usersWithTickets = 0;
        const ticketCounts = {
            total: 0,
            open: 0,
            byCategory: {},
            byPriority: {},
            autoGenerated: 0,
            userReported: 0
        };
        
        for (const [userId, userTickets] of this.supportData.tickets.entries()) {
            const recentTickets = userTickets.tickets.filter(
                ticket => ticket.createdAt >= since
            );
            
            if (recentTickets.length > 0) {
                usersWithTickets++;
                
                for (const ticket of recentTickets) {
                    ticketCounts.total++;
                    
                    if (ticket.status === 'open') {
                        ticketCounts.open++;
                    }
                    
                    ticketCounts.byCategory[ticket.category] = 
                        (ticketCounts.byCategory[ticket.category] || 0) + 1;
                    
                    ticketCounts.byPriority[ticket.priority] = 
                        (ticketCounts.byPriority[ticket.priority] || 0) + 1;
                    
                    if (ticket.source === 'auto_generated') {
                        ticketCounts.autoGenerated++;
                    } else {
                        ticketCounts.userReported++;
                    }
                }
            }
        }
        
        // Calculate error metrics
        const errorMetrics = this.calculateErrorMetrics(since);
        
        // Calculate ticket rate
        const ticketRate = this.totalUsers > 0 ? (usersWithTickets / this.totalUsers) * 100 : 0;
        
        // Get top issues
        const topIssues = this.getTopIssues(timeRange);
        
        return {
            ticketRate,
            target: this.config.ticketThreshold,
            achieved: ticketRate <= this.config.ticketThreshold,
            usersWithTickets,
            totalUsers: this.totalUsers,
            ticketCounts,
            errorMetrics,
            topIssues,
            riskAnalysis: this.analyzeUserRisk(),
            trends: this.analyzeTrends(timeRange),
            timeRange,
            calculatedAt: now
        };
    }
    
    calculateErrorMetrics(since) {
        let totalErrors = 0;
        let usersWithErrors = 0;
        const errorsByCategory = {};
        const errorsBySeverity = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };
        
        for (const [userId, userErrors] of this.supportData.errors.entries()) {
            const recentErrors = userErrors.errors.filter(
                error => error.timestamp >= since
            );
            
            if (recentErrors.length > 0) {
                usersWithErrors++;
                totalErrors += recentErrors.length;
                
                for (const error of recentErrors) {
                    errorsByCategory[error.category] = 
                        (errorsByCategory[error.category] || 0) + 1;
                    
                    errorsBySeverity[error.severity]++;
                }
            }
        }
        
        const errorRate = this.totalUsers > 0 ? (usersWithErrors / this.totalUsers) * 100 : 0;
        
        return {
            totalErrors,
            usersWithErrors,
            errorRate,
            errorsByCategory,
            errorsBySeverity,
            avgErrorsPerUser: usersWithErrors > 0 ? totalErrors / usersWithErrors : 0
        };
    }
    
    getTopIssues(timeRange) {
        const issues = Array.from(this.supportData.issues.values())
            .map(issue => ({
                ...issue,
                users: new Set(issue.users), // Convert back to Set for processing
                percentage: (issue.users.length / this.totalUsers) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        return issues.map(issue => ({
            ...issue,
            users: issue.users.size, // Convert Set size to number for output
            patterns: Object.fromEntries(issue.patterns || new Map())
        }));
    }
    
    analyzeUserRisk() {
        const riskLevels = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };
        
        for (const [userId, problems] of this.supportData.userProblems.entries()) {
            riskLevels[problems.riskLevel]++;
        }
        
        return {
            riskLevels,
            totalUsersAtRisk: riskLevels.critical + riskLevels.high + riskLevels.medium,
            criticalUsers: riskLevels.critical,
            interventionsNeeded: this.getInterventionsNeeded()
        };
    }
    
    getInterventionsNeeded() {
        const interventions = {};
        
        for (const [userId, problems] of this.supportData.userProblems.entries()) {
            for (const intervention of problems.interventionsNeeded || []) {
                interventions[intervention] = (interventions[intervention] || 0) + 1;
            }
        }
        
        return interventions;
    }
    
    analyzeTrends(timeRange) {
        // This would analyze trends over time
        // For now, return basic trend data
        const now = Date.now();
        const rangeMs = this.parseTimeRange(timeRange);
        const period = rangeMs / 7; // Week intervals
        
        const trends = {
            ticketTrend: 'stable', // Would calculate actual trend
            errorTrend: 'stable',
            categories: {
                increasing: [],
                decreasing: [],
                stable: []
            }
        };
        
        return trends;
    }
    
    parseTimeRange(timeRange) {
        const ranges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return ranges[timeRange] || ranges['30d'];
    }
    
    // Utility methods
    
    generateTicketId() {
        return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    getCurrentUserId() {
        // This would get the current user ID from the main analytics system
        return 'current_user'; // Placeholder
    }
    
    // Data persistence
    
    async saveSupportData() {
        try {
            // Convert Maps to Objects for storage
            const ticketsData = Object.fromEntries(this.supportData.tickets);
            const errorsData = Object.fromEntries(this.supportData.errors);
            const issuesData = Object.fromEntries(this.supportData.issues);
            const problemsData = Object.fromEntries(this.supportData.userProblems);
            
            await chrome.storage.local.set({
                supportTickets: ticketsData,
                errorTracking: errorsData,
                supportIssues: issuesData,
                userProblems: problemsData
            });
            
        } catch (error) {
            console.error('Error saving support data:', error);
        }
    }
    
    // Public API
    
    getUserSupportStatus(userId) {
        const tickets = this.supportData.tickets.get(userId);
        const errors = this.supportData.errors.get(userId);
        const problems = this.supportData.userProblems.get(userId);
        
        return {
            hasActiveTickets: tickets?.openTickets > 0,
            ticketCount: tickets?.ticketCount || 0,
            errorScore: errors?.errorScore || 0,
            riskLevel: problems?.riskLevel || 'low',
            needsSupport: this.userNeedsSupport(userId)
        };
    }
    
    userNeedsSupport(userId) {
        const status = this.getUserSupportStatus(userId);
        
        return status.hasActiveTickets ||
               status.errorScore >= 15 ||
               status.riskLevel === 'critical';
    }
    
    getSupportInsights() {
        const insights = [];
        
        // Check overall ticket rate
        const metrics = this.getSupportMetrics('30d');
        if (metrics.ticketRate > this.config.ticketThreshold) {
            insights.push({
                type: 'high_ticket_rate',
                severity: 'high',
                message: `Support ticket rate (${metrics.ticketRate.toFixed(1)}%) exceeds ${this.config.ticketThreshold}% target`,
                recommendation: 'Identify and fix top issues causing support requests'
            });
        }
        
        // Check for critical issues
        const topIssue = metrics.topIssues[0];
        if (topIssue && topIssue.percentage > 5) {
            insights.push({
                type: 'critical_issue',
                severity: 'critical',
                message: `${topIssue.category} affects ${topIssue.percentage.toFixed(1)}% of users`,
                recommendation: `Prioritize fixing ${topIssue.category} issues`
            });
        }
        
        // Check error rates
        if (metrics.errorMetrics.errorRate > 20) {
            insights.push({
                type: 'high_error_rate',
                severity: 'medium',
                message: `${metrics.errorMetrics.errorRate.toFixed(1)}% of users experiencing errors`,
                recommendation: 'Improve error handling and user experience'
            });
        }
        
        return insights;
    }
    
    stop() {
        // Save any pending data
        if (this.isInitialized) {
            this.saveSupportData();
        }
        
        console.log('🎫 Support Ticket Tracker stopped');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupportTicketTracker;
} else {
    window.SupportTicketTracker = SupportTicketTracker;
}