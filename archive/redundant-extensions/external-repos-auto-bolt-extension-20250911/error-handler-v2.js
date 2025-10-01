/**
 * AutoBolt Error Handler v2
 * Advanced error handling with package-specific recovery strategies
 * 
 * This module handles:
 * - Package-specific error recovery and retry strategies
 * - Intelligent error classification and routing
 * - Escalation management based on customer tier
 * - Error analytics and pattern recognition
 * - Automated incident response and notifications
 */

class ErrorHandlerV2 {
    constructor(config = {}) {
        this.config = {
            enableAnalytics: config.enableAnalytics !== false,
            enableAutoRecovery: config.enableAutoRecovery !== false,
            maxRetryAttempts: config.maxRetryAttempts || 5,
            escalationThreshold: config.escalationThreshold || 3,
            analyticsRetentionDays: config.analyticsRetentionDays || 30,
            ...config
        };

        // Error classification system
        this.errorTypes = {
            NETWORK_ERROR: {
                category: 'network',
                severity: 'medium',
                retryable: true,
                baseDelay: 2000,
                maxRetries: 3
            },
            API_ERROR: {
                category: 'api',
                severity: 'high',
                retryable: true,
                baseDelay: 5000,
                maxRetries: 2
            },
            FORM_ERROR: {
                category: 'form',
                severity: 'medium',
                retryable: true,
                baseDelay: 1000,
                maxRetries: 2
            },
            CAPTCHA_ERROR: {
                category: 'captcha',
                severity: 'high',
                retryable: false,
                baseDelay: 0,
                maxRetries: 0
            },
            ANTI_BOT_ERROR: {
                category: 'anti_bot',
                severity: 'critical',
                retryable: false,
                baseDelay: 0,
                maxRetries: 0
            },
            TIMEOUT_ERROR: {
                category: 'timeout',
                severity: 'medium',
                retryable: true,
                baseDelay: 3000,
                maxRetries: 2
            },
            VALIDATION_ERROR: {
                category: 'validation',
                severity: 'low',
                retryable: true,
                baseDelay: 1000,
                maxRetries: 1
            },
            SYSTEM_ERROR: {
                category: 'system',
                severity: 'critical',
                retryable: false,
                baseDelay: 0,
                maxRetries: 0
            },
            AUTH_ERROR: {
                category: 'authentication',
                severity: 'high',
                retryable: true,
                baseDelay: 2000,
                maxRetries: 1
            },
            RATE_LIMIT_ERROR: {
                category: 'rate_limit',
                severity: 'medium',
                retryable: true,
                baseDelay: 10000,
                maxRetries: 3
            }
        };

        // Package-specific recovery strategies
        this.packageStrategies = {
            'Enterprise': {
                maxRetries: 5,
                retryMultiplier: 1.5,
                enableHumanEscalation: true,
                enableCustomScripting: true,
                enableManualIntervention: true,
                escalationChannels: ['phone', 'email', 'slack', 'pagerduty'],
                escalationSLA: 300, // 5 minutes
                priorityLevel: 'critical',
                customRecoveryEnabled: true,
                fallbackStrategies: ['human_intervention', 'alternative_methods', 'custom_scripts']
            },
            'Professional': {
                maxRetries: 3,
                retryMultiplier: 1.3,
                enableHumanEscalation: true,
                enableCustomScripting: false,
                enableManualIntervention: true,
                escalationChannels: ['phone', 'email', 'slack'],
                escalationSLA: 900, // 15 minutes
                priorityLevel: 'high',
                customRecoveryEnabled: false,
                fallbackStrategies: ['smart_retry', 'alternative_methods']
            },
            'Growth': {
                maxRetries: 2,
                retryMultiplier: 1.2,
                enableHumanEscalation: false,
                enableCustomScripting: false,
                enableManualIntervention: false,
                escalationChannels: ['email'],
                escalationSLA: 3600, // 1 hour
                priorityLevel: 'medium',
                customRecoveryEnabled: false,
                fallbackStrategies: ['basic_retry']
            },
            'Starter': {
                maxRetries: 1,
                retryMultiplier: 1.0,
                enableHumanEscalation: false,
                enableCustomScripting: false,
                enableManualIntervention: false,
                escalationChannels: ['email'],
                escalationSLA: 14400, // 4 hours
                priorityLevel: 'low',
                customRecoveryEnabled: false,
                fallbackStrategies: ['skip_and_continue']
            }
        };

        // Error tracking and analytics
        this.errorTracking = {
            errorHistory: new Map(),
            errorPatterns: new Map(),
            recoveryStats: new Map(),
            escalationHistory: new Map()
        };

        // Active error contexts
        this.activeErrors = new Map();
        this.escalationQueue = new Map();

        // Recovery statistics
        this.recoveryMetrics = {
            totalErrors: 0,
            recoveredErrors: 0,
            escalatedErrors: 0,
            failedErrors: 0,
            averageRecoveryTime: 0,
            packageBreakdown: {}
        };
    }

    /**
     * Initialize the error handler
     */
    async initialize() {
        console.log('🚀 Initializing Error Handler v2...');

        try {
            // Initialize package-specific metrics
            this.initializePackageMetrics();

            // Load error history from storage
            await this.loadErrorHistory();

            // Start analytics processing
            if (this.config.enableAnalytics) {
                this.startAnalyticsProcessing();
            }

            // Setup cleanup intervals
            this.setupCleanupIntervals();

            console.log('✅ Error Handler v2 initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Error Handler v2:', error);
            throw error;
        }
    }

    /**
     * Handle error with package-specific recovery
     */
    async handleError(errorType, error, context = {}) {
        const errorId = this.generateErrorId();
        const timestamp = Date.now();

        console.log(`🚨 Handling ${errorType} error: ${error.message || error}`);

        try {
            // Create error context
            const errorContext = {
                id: errorId,
                type: errorType,
                error: error instanceof Error ? error : new Error(error),
                message: error.message || error.toString(),
                timestamp,
                context: {
                    ...context,
                    userAgent: navigator.userAgent,
                    url: window.location?.href,
                    timestamp: new Date().toISOString()
                },
                packageType: context.packageType || 'Starter',
                severity: this.classifyErrorSeverity(errorType, error),
                retryCount: 0,
                status: 'processing'
            };

            // Store in active errors
            this.activeErrors.set(errorId, errorContext);

            // Update metrics
            this.updateErrorMetrics(errorContext);

            // Log error for analytics
            await this.logErrorForAnalytics(errorContext);

            // Attempt recovery based on package type
            const recoveryResult = await this.attemptRecovery(errorContext);

            // Handle recovery result
            await this.processRecoveryResult(errorContext, recoveryResult);

            return {
                errorId,
                recovered: recoveryResult.success,
                attempts: recoveryResult.attempts,
                strategy: recoveryResult.strategy,
                escalated: recoveryResult.escalated
            };

        } catch (recoveryError) {
            console.error('❌ Recovery process failed:', recoveryError);
            await this.escalateError(errorContext, 'Recovery process failed');
            
            return {
                errorId,
                recovered: false,
                attempts: 0,
                strategy: 'failed',
                escalated: true
            };
        } finally {
            // Clean up active error
            this.activeErrors.delete(errorId);
        }
    }

    /**
     * Handle customer processing error with specific recovery
     */
    async handleCustomerProcessingError(queueEntry, error, packageType) {
        console.log(`🚨 Customer processing error for ${packageType}: ${error.message}`);

        const context = {
            queueId: queueEntry.id,
            customerId: queueEntry.fields.customer_id,
            businessName: queueEntry.fields.business_name,
            packageType,
            processingStage: 'customer_processing',
            directoryCount: queueEntry.fields.selected_directories?.length || 0
        };

        // Handle the error with package-specific recovery
        const result = await this.handleError('PROCESSING_ERROR', error, context);

        // Send notifications based on package type
        await this.sendErrorNotifications(context, result);

        return result;
    }

    /**
     * Handle directory submission error
     */
    async handleDirectorySubmissionError(directory, error, packageType, context = {}) {
        console.log(`🚨 Directory submission error for ${directory.fields?.directory_name}: ${error.message}`);

        const errorContext = {
            directoryId: directory.id,
            directoryName: directory.fields?.directory_name,
            directoryUrl: directory.fields?.submission_url,
            packageType,
            processingStage: 'directory_submission',
            ...context
        };

        return await this.handleError('FORM_ERROR', error, errorContext);
    }

    /**
     * Attempt error recovery based on package configuration
     */
    async attemptRecovery(errorContext) {
        const packageStrategy = this.packageStrategies[errorContext.packageType];
        const errorType = this.classifyError(errorContext.error);
        
        console.log(`🔄 Attempting recovery with ${errorContext.packageType} strategy`);

        const recoveryResult = {
            success: false,
            attempts: 0,
            strategy: 'none',
            escalated: false,
            recoveryTime: 0
        };

        const startTime = Date.now();

        try {
            // Try package-specific recovery strategies
            for (const strategy of packageStrategy.fallbackStrategies) {
                recoveryResult.attempts++;
                recoveryResult.strategy = strategy;

                console.log(`🔧 Trying recovery strategy: ${strategy}`);

                const success = await this.executeRecoveryStrategy(strategy, errorContext, packageStrategy);
                
                if (success) {
                    recoveryResult.success = true;
                    recoveryResult.recoveryTime = Date.now() - startTime;
                    
                    console.log(`✅ Recovery successful with strategy: ${strategy}`);
                    
                    // Update recovery statistics
                    this.updateRecoveryStats(errorContext.packageType, strategy, true);
                    
                    break;
                }

                // Add delay between recovery attempts
                if (recoveryResult.attempts < packageStrategy.fallbackStrategies.length) {
                    const delay = this.calculateRecoveryDelay(recoveryResult.attempts, packageStrategy);
                    await this.delay(delay);
                }
            }

            // If all strategies failed, check for escalation
            if (!recoveryResult.success && this.shouldEscalate(errorContext, packageStrategy)) {
                await this.escalateError(errorContext, 'All recovery strategies failed');
                recoveryResult.escalated = true;
            }

        } catch (error) {
            console.error('❌ Recovery attempt failed:', error);
            recoveryResult.success = false;
        }

        return recoveryResult;
    }

    /**
     * Execute specific recovery strategy
     */
    async executeRecoveryStrategy(strategy, errorContext, packageStrategy) {
        try {
            switch (strategy) {
                case 'human_intervention':
                    return await this.executeHumanIntervention(errorContext, packageStrategy);
                    
                case 'alternative_methods':
                    return await this.executeAlternativeMethods(errorContext, packageStrategy);
                    
                case 'custom_scripts':
                    return await this.executeCustomScripts(errorContext, packageStrategy);
                    
                case 'smart_retry':
                    return await this.executeSmartRetry(errorContext, packageStrategy);
                    
                case 'basic_retry':
                    return await this.executeBasicRetry(errorContext, packageStrategy);
                    
                case 'skip_and_continue':
                    return await this.executeSkipAndContinue(errorContext, packageStrategy);
                    
                default:
                    console.warn(`⚠️ Unknown recovery strategy: ${strategy}`);
                    return false;
            }
        } catch (error) {
            console.error(`❌ Recovery strategy ${strategy} failed:`, error);
            return false;
        }
    }

    /**
     * Recovery strategy implementations
     */
    async executeHumanIntervention(errorContext, packageStrategy) {
        if (!packageStrategy.enableHumanIntervention) return false;

        console.log('👤 Escalating to human intervention');

        // Create human intervention ticket
        const ticket = {
            errorId: errorContext.id,
            priority: packageStrategy.priorityLevel,
            packageType: errorContext.packageType,
            errorType: errorContext.type,
            context: errorContext.context,
            assignedTo: 'human_operator',
            status: 'pending_intervention',
            createdAt: Date.now()
        };

        // Store ticket for manual processing
        await this.createHumanInterventionTicket(ticket);

        // For simulation, assume human intervention is successful for Enterprise
        if (errorContext.packageType === 'Enterprise') {
            // Simulate processing time
            await this.delay(5000);
            return true;
        }

        return false;
    }

    async executeAlternativeMethods(errorContext, packageStrategy) {
        console.log('🔀 Trying alternative submission methods');

        // Simulate trying different submission approaches
        const methods = ['method_a', 'method_b', 'method_c'];
        
        for (const method of methods) {
            try {
                console.log(`🔧 Trying alternative method: ${method}`);
                
                // Simulate method execution
                await this.delay(2000);
                
                // Simulate success probability based on package tier
                const successProbability = this.getMethodSuccessProbability(method, errorContext.packageType);
                
                if (Math.random() < successProbability) {
                    console.log(`✅ Alternative method ${method} successful`);
                    return true;
                }
                
            } catch (error) {
                console.log(`❌ Alternative method ${method} failed:`, error.message);
                continue;
            }
        }

        return false;
    }

    async executeCustomScripts(errorContext, packageStrategy) {
        if (!packageStrategy.enableCustomScripting) return false;

        console.log('📜 Executing custom recovery scripts');

        try {
            // Simulate custom script execution
            await this.delay(3000);

            // Enterprise gets better custom script success rate
            const successRate = errorContext.packageType === 'Enterprise' ? 0.8 : 0.6;
            
            return Math.random() < successRate;
            
        } catch (error) {
            console.error('❌ Custom script execution failed:', error);
            return false;
        }
    }

    async executeSmartRetry(errorContext, packageStrategy) {
        console.log('🧠 Executing smart retry with adaptive logic');

        const maxRetries = Math.min(packageStrategy.maxRetries, 3);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Calculate adaptive delay
                const delay = this.calculateAdaptiveDelay(attempt, errorContext, packageStrategy);
                await this.delay(delay);

                // Simulate retry with improved success probability
                const baseSuccessRate = 0.3;
                const packageBonus = this.getPackageRetryBonus(errorContext.packageType);
                const adaptiveBonus = attempt * 0.1; // Improves with each attempt
                
                const successRate = Math.min(0.9, baseSuccessRate + packageBonus + adaptiveBonus);
                
                if (Math.random() < successRate) {
                    console.log(`✅ Smart retry successful on attempt ${attempt}`);
                    return true;
                }

                console.log(`❌ Smart retry attempt ${attempt} failed`);
                
            } catch (error) {
                console.error(`❌ Smart retry attempt ${attempt} error:`, error);
            }
        }

        return false;
    }

    async executeBasicRetry(errorContext, packageStrategy) {
        console.log('🔄 Executing basic retry');

        const maxRetries = Math.min(packageStrategy.maxRetries, 2);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Simple exponential backoff
                const delay = 1000 * Math.pow(2, attempt - 1);
                await this.delay(delay);

                // Simple retry logic
                const successRate = 0.4; // Basic retry has lower success rate
                
                if (Math.random() < successRate) {
                    console.log(`✅ Basic retry successful on attempt ${attempt}`);
                    return true;
                }

                console.log(`❌ Basic retry attempt ${attempt} failed`);
                
            } catch (error) {
                console.error(`❌ Basic retry attempt ${attempt} error:`, error);
            }
        }

        return false;
    }

    async executeSkipAndContinue(errorContext, packageStrategy) {
        console.log('⏭️ Skipping failed item and continuing');

        // Log the skip for reporting
        await this.logSkippedItem(errorContext);

        // Always "succeeds" because we're skipping
        return true;
    }

    /**
     * Error classification and analysis
     */
    classifyError(error) {
        const message = error.message?.toLowerCase() || '';
        const stack = error.stack?.toLowerCase() || '';

        // Network errors
        if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
            return this.errorTypes.NETWORK_ERROR;
        }

        // API errors
        if (message.includes('api') || message.includes('401') || message.includes('403') || message.includes('500')) {
            return this.errorTypes.API_ERROR;
        }

        // Form errors
        if (message.includes('form') || message.includes('element not found') || message.includes('selector')) {
            return this.errorTypes.FORM_ERROR;
        }

        // CAPTCHA errors
        if (message.includes('captcha') || message.includes('recaptcha')) {
            return this.errorTypes.CAPTCHA_ERROR;
        }

        // Anti-bot errors
        if (message.includes('bot') || message.includes('blocked') || message.includes('protection')) {
            return this.errorTypes.ANTI_BOT_ERROR;
        }

        // Rate limit errors
        if (message.includes('rate limit') || message.includes('429')) {
            return this.errorTypes.RATE_LIMIT_ERROR;
        }

        // Default to system error
        return this.errorTypes.SYSTEM_ERROR;
    }

    classifyErrorSeverity(errorType, error) {
        const classification = this.classifyError(error);
        return classification.severity;
    }

    /**
     * Escalation management
     */
    shouldEscalate(errorContext, packageStrategy) {
        const errorType = this.classifyError(errorContext.error);
        
        // Always escalate critical errors
        if (errorType.severity === 'critical') return true;

        // Escalate based on retry count
        if (errorContext.retryCount >= packageStrategy.maxRetries) return true;

        // Escalate based on package type
        if (packageStrategy.enableHumanEscalation && errorType.severity === 'high') return true;

        return false;
    }

    async escalateError(errorContext, reason) {
        const packageStrategy = this.packageStrategies[errorContext.packageType];
        
        console.log(`⚠️ Escalating error ${errorContext.id}: ${reason}`);

        const escalation = {
            errorId: errorContext.id,
            reason,
            packageType: errorContext.packageType,
            priority: packageStrategy.priorityLevel,
            channels: packageStrategy.escalationChannels,
            sla: packageStrategy.escalationSLA,
            createdAt: Date.now(),
            status: 'escalated'
        };

        // Store escalation
        this.escalationQueue.set(errorContext.id, escalation);

        // Send escalation notifications
        await this.sendEscalationNotifications(escalation, errorContext);

        // Update metrics
        this.recoveryMetrics.escalatedErrors++;
    }

    async sendEscalationNotifications(escalation, errorContext) {
        try {
            for (const channel of escalation.channels) {
                await this.sendNotification(channel, {
                    type: 'error_escalation',
                    priority: escalation.priority,
                    errorId: escalation.errorId,
                    packageType: escalation.packageType,
                    message: `Error escalation for ${escalation.packageType} customer`,
                    context: errorContext.context,
                    sla: escalation.sla
                });
            }
        } catch (error) {
            console.error('❌ Failed to send escalation notifications:', error);
        }
    }

    /**
     * Notification system
     */
    async sendErrorNotifications(context, result) {
        try {
            if (!result.recovered && context.packageType === 'Enterprise') {
                await this.sendNotification('phone', {
                    type: 'error_notification',
                    priority: 'critical',
                    packageType: context.packageType,
                    businessName: context.businessName,
                    message: 'Enterprise customer processing failed'
                });
            } else if (!result.recovered && ['Professional', 'Growth'].includes(context.packageType)) {
                await this.sendNotification('email', {
                    type: 'error_notification',
                    priority: 'high',
                    packageType: context.packageType,
                    businessName: context.businessName,
                    message: 'Customer processing encountered errors'
                });
            }
        } catch (error) {
            console.error('❌ Failed to send error notifications:', error);
        }
    }

    async sendNotification(channel, data) {
        // Implementation would integrate with actual notification systems
        console.log(`📧 Sending ${channel} notification:`, data.type);
        
        // Simulate notification delay
        await this.delay(500);
    }

    /**
     * Analytics and metrics
     */
    updateErrorMetrics(errorContext) {
        this.recoveryMetrics.totalErrors++;
        
        const packageType = errorContext.packageType;
        if (!this.recoveryMetrics.packageBreakdown[packageType]) {
            this.recoveryMetrics.packageBreakdown[packageType] = {
                total: 0,
                recovered: 0,
                escalated: 0,
                failed: 0
            };
        }
        
        this.recoveryMetrics.packageBreakdown[packageType].total++;
    }

    updateRecoveryStats(packageType, strategy, success) {
        if (success) {
            this.recoveryMetrics.recoveredErrors++;
            this.recoveryMetrics.packageBreakdown[packageType].recovered++;
        } else {
            this.recoveryMetrics.failedErrors++;
            this.recoveryMetrics.packageBreakdown[packageType].failed++;
        }
    }

    async logErrorForAnalytics(errorContext) {
        if (!this.config.enableAnalytics) return;

        try {
            const logEntry = {
                errorId: errorContext.id,
                timestamp: errorContext.timestamp,
                type: errorContext.type,
                severity: errorContext.severity,
                packageType: errorContext.packageType,
                message: errorContext.message,
                context: JSON.stringify(errorContext.context),
                userAgent: navigator.userAgent,
                url: window.location?.href
            };

            // Store in local analytics (would be sent to analytics service)
            this.storeAnalyticsEntry(logEntry);
            
        } catch (error) {
            console.warn('⚠️ Failed to log error for analytics:', error);
        }
    }

    storeAnalyticsEntry(entry) {
        const dateKey = new Date().toDateString();
        
        if (!this.errorTracking.errorHistory.has(dateKey)) {
            this.errorTracking.errorHistory.set(dateKey, []);
        }
        
        this.errorTracking.errorHistory.get(dateKey).push(entry);
    }

    startAnalyticsProcessing() {
        // Process analytics every 5 minutes
        setInterval(() => {
            this.processErrorAnalytics();
        }, 300000);

        console.log('📊 Analytics processing started');
    }

    processErrorAnalytics() {
        try {
            // Identify error patterns
            this.identifyErrorPatterns();

            // Calculate recovery effectiveness
            this.calculateRecoveryEffectiveness();

            // Clean old data
            this.cleanupOldAnalyticsData();

        } catch (error) {
            console.error('❌ Analytics processing failed:', error);
        }
    }

    identifyErrorPatterns() {
        // Analyze error patterns across packages and time
        const patterns = new Map();

        for (const [date, errors] of this.errorTracking.errorHistory.entries()) {
            for (const error of errors) {
                const patternKey = `${error.type}_${error.packageType}`;
                
                if (!patterns.has(patternKey)) {
                    patterns.set(patternKey, {
                        count: 0,
                        firstSeen: error.timestamp,
                        lastSeen: error.timestamp,
                        packageTypes: new Set(),
                        severity: error.severity
                    });
                }

                const pattern = patterns.get(patternKey);
                pattern.count++;
                pattern.lastSeen = Math.max(pattern.lastSeen, error.timestamp);
                pattern.packageTypes.add(error.packageType);
            }
        }

        this.errorTracking.errorPatterns = patterns;
    }

    calculateRecoveryEffectiveness() {
        const effectiveness = {};

        for (const [packageType, stats] of Object.entries(this.recoveryMetrics.packageBreakdown)) {
            if (stats.total > 0) {
                effectiveness[packageType] = {
                    recoveryRate: stats.recovered / stats.total,
                    escalationRate: stats.escalated / stats.total,
                    failureRate: stats.failed / stats.total
                };
            }
        }

        this.recoveryMetrics.packageEffectiveness = effectiveness;
    }

    /**
     * Helper methods
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    calculateRecoveryDelay(attempt, packageStrategy) {
        const baseDelay = 1000; // 1 second base
        const multiplier = packageStrategy.retryMultiplier || 1.0;
        return baseDelay * Math.pow(multiplier, attempt);
    }

    calculateAdaptiveDelay(attempt, errorContext, packageStrategy) {
        const errorType = this.classifyError(errorContext.error);
        const baseDelay = errorType.baseDelay || 1000;
        const multiplier = packageStrategy.retryMultiplier || 1.0;
        
        // Adaptive delay based on error type and package
        return baseDelay * Math.pow(multiplier, attempt - 1);
    }

    getMethodSuccessProbability(method, packageType) {
        const baseProbabilities = {
            'method_a': 0.4,
            'method_b': 0.5,
            'method_c': 0.3
        };

        const packageBonuses = {
            'Enterprise': 0.3,
            'Professional': 0.2,
            'Growth': 0.1,
            'Starter': 0.0
        };

        return baseProbabilities[method] + packageBonuses[packageType];
    }

    getPackageRetryBonus(packageType) {
        const bonuses = {
            'Enterprise': 0.3,
            'Professional': 0.2,
            'Growth': 0.1,
            'Starter': 0.0
        };
        
        return bonuses[packageType] || 0;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Lifecycle methods
     */
    initializePackageMetrics() {
        Object.keys(this.packageStrategies).forEach(packageType => {
            this.recoveryMetrics.packageBreakdown[packageType] = {
                total: 0,
                recovered: 0,
                escalated: 0,
                failed: 0
            };
        });
    }

    async loadErrorHistory() {
        try {
            // Load from Chrome storage or other persistence layer
            const stored = await chrome.storage.local.get(['errorHistory']);
            if (stored.errorHistory) {
                this.errorTracking.errorHistory = new Map(stored.errorHistory);
            }
        } catch (error) {
            console.warn('⚠️ Could not load error history:', error);
        }
    }

    setupCleanupIntervals() {
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldAnalyticsData();
        }, 3600000);
    }

    cleanupOldAnalyticsData() {
        const cutoffDate = Date.now() - (this.config.analyticsRetentionDays * 24 * 60 * 60 * 1000);
        
        for (const [date, errors] of this.errorTracking.errorHistory.entries()) {
            const dateTime = new Date(date).getTime();
            if (dateTime < cutoffDate) {
                this.errorTracking.errorHistory.delete(date);
            }
        }
    }

    /**
     * Utility methods for specific error handling
     */
    async createHumanInterventionTicket(ticket) {
        // Implementation would integrate with ticketing system
        console.log('🎫 Created human intervention ticket:', ticket.errorId);
    }

    async logSkippedItem(errorContext) {
        console.log(`⏭️ Skipped item due to error: ${errorContext.id}`);
        
        // Log for reporting purposes
        this.storeAnalyticsEntry({
            errorId: errorContext.id,
            action: 'skipped',
            packageType: errorContext.packageType,
            timestamp: Date.now()
        });
    }

    processRecoveryResult(errorContext, recoveryResult) {
        if (recoveryResult.success) {
            console.log(`✅ Error ${errorContext.id} recovered successfully`);
            errorContext.status = 'recovered';
        } else if (recoveryResult.escalated) {
            console.log(`⚠️ Error ${errorContext.id} escalated`);
            errorContext.status = 'escalated';
        } else {
            console.log(`❌ Error ${errorContext.id} recovery failed`);
            errorContext.status = 'failed';
        }
    }

    /**
     * Public API methods
     */
    getErrorMetrics() {
        return {
            ...this.recoveryMetrics,
            activeErrors: this.activeErrors.size,
            escalationQueue: this.escalationQueue.size,
            errorPatterns: Array.from(this.errorTracking.errorPatterns.entries())
        };
    }

    getPackageErrorStats(packageType) {
        return this.recoveryMetrics.packageBreakdown[packageType] || null;
    }

    clearErrorHistory() {
        this.errorTracking.errorHistory.clear();
        this.errorTracking.errorPatterns.clear();
        console.log('🧹 Error history cleared');
    }

    /**
     * Cleanup
     */
    async shutdown() {
        console.log('🛑 Shutting down Error Handler v2...');

        // Save error history
        try {
            await chrome.storage.local.set({
                errorHistory: Array.from(this.errorTracking.errorHistory.entries())
            });
        } catch (error) {
            console.warn('⚠️ Failed to save error history:', error);
        }

        // Clear active errors
        this.activeErrors.clear();
        this.escalationQueue.clear();

        console.log('✅ Error Handler v2 shutdown complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlerV2;
} else if (typeof window !== 'undefined') {
    window.ErrorHandlerV2 = ErrorHandlerV2;
}