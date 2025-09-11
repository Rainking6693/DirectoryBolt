/**
 * Advanced Queue Processing Modules
 * Lazy-loaded advanced functionality for complex queue operations
 */

export class AdvancedAnalyzer {
    constructor() {
        this.analysisHistory = new Map();
        this.learningData = new Map();
    }
    
    analyzeDirectoryComplexity(directory) {
        const complexity = {
            formCount: this.estimateFormCount(directory),
            requiresLogin: this.detectLoginRequirement(directory),
            hasPaywall: this.detectPaywall(directory),
            antiBot: this.detectAntiBotMeasures(directory),
            dynamicContent: this.detectDynamicContent(directory)
        };
        
        complexity.score = this.calculateComplexityScore(complexity);
        return complexity;
    }
    
    estimateFormCount(directory) {
        // Analyze directory characteristics to estimate form count
        const indicators = [
            directory.name.toLowerCase().includes('multi'),
            directory.name.toLowerCase().includes('step'),
            directory.url.includes('wizard'),
            directory.url.includes('registration')
        ];
        
        return indicators.filter(Boolean).length + 1;
    }
    
    detectLoginRequirement(directory) {
        const loginIndicators = [
            /login/i,
            /signin/i,
            /register/i,
            /account/i,
            /member/i
        ];
        
        return loginIndicators.some(pattern => 
            pattern.test(directory.url) || pattern.test(directory.name)
        );
    }
    
    detectPaywall(directory) {
        const paywallIndicators = [
            /premium/i,
            /paid/i,
            /subscription/i,
            /billing/i,
            /upgrade/i
        ];
        
        return paywallIndicators.some(pattern =>
            pattern.test(directory.url) || pattern.test(directory.name)
        );
    }
    
    detectAntiBotMeasures(directory) {
        const botDetectionIndicators = [
            /captcha/i,
            /recaptcha/i,
            /cloudflare/i,
            /verification/i
        ];
        
        return botDetectionIndicators.some(pattern =>
            pattern.test(directory.url) || pattern.test(directory.name)
        );
    }
    
    detectDynamicContent(directory) {
        const dynamicIndicators = [
            directory.url.includes('spa'),
            directory.url.includes('react'),
            directory.url.includes('angular'),
            directory.url.includes('vue'),
            directory.name.toLowerCase().includes('dynamic')
        ];
        
        return dynamicIndicators.some(Boolean);
    }
    
    calculateComplexityScore(complexity) {
        let score = 1; // Base score
        
        if (complexity.requiresLogin) score += 2;
        if (complexity.hasPaywall) score += 3;
        if (complexity.antiBot) score += 4;
        if (complexity.dynamicContent) score += 1;
        if (complexity.formCount > 2) score += complexity.formCount;
        
        return Math.min(score, 10); // Cap at 10
    }
    
    predictProcessingTime(directory) {
        const complexity = this.analyzeDirectoryComplexity(directory);
        
        // Base processing time in milliseconds
        const baseTime = 30000; // 30 seconds
        const complexityMultiplier = complexity.score * 0.5;
        
        return Math.round(baseTime * (1 + complexityMultiplier));
    }
    
    recommendProcessingStrategy(directory) {
        const complexity = this.analyzeDirectoryComplexity(directory);
        
        if (complexity.score >= 8) {
            return {
                strategy: 'manual',
                reason: 'High complexity - requires manual intervention',
                retries: 2,
                delay: 10000
            };
        } else if (complexity.score >= 5) {
            return {
                strategy: 'cautious',
                reason: 'Medium complexity - use extended delays',
                retries: 4,
                delay: 8000
            };
        } else {
            return {
                strategy: 'standard',
                reason: 'Low complexity - standard processing',
                retries: 3,
                delay: 5000
            };
        }
    }
}

export class BatchProcessor {
    constructor() {
        this.batchSize = 5;
        this.concurrencyLimit = 2;
        this.batchDelay = 60000; // 1 minute between batches
    }
    
    optimizeBatchSize(directories) {
        const avgComplexity = this.calculateAverageComplexity(directories);
        
        if (avgComplexity > 7) {
            return 2; // Small batches for complex directories
        } else if (avgComplexity > 4) {
            return 5; // Medium batches
        } else {
            return 10; // Larger batches for simple directories
        }
    }
    
    calculateAverageComplexity(directories) {
        const analyzer = new AdvancedAnalyzer();
        const complexities = directories.map(dir => 
            analyzer.analyzeDirectoryComplexity(dir).score
        );
        
        return complexities.reduce((sum, score) => sum + score, 0) / complexities.length;
    }
    
    groupDirectoriesByComplexity(directories) {
        const analyzer = new AdvancedAnalyzer();
        const groups = { simple: [], medium: [], complex: [] };
        
        directories.forEach(directory => {
            const complexity = analyzer.analyzeDirectoryComplexity(directory);
            
            if (complexity.score <= 3) {
                groups.simple.push(directory);
            } else if (complexity.score <= 6) {
                groups.medium.push(directory);
            } else {
                groups.complex.push(directory);
            }
        });
        
        return groups;
    }
    
    createOptimizedBatches(directories) {
        const groups = this.groupDirectoriesByComplexity(directories);
        const batches = [];
        
        // Process simple directories first in larger batches
        const simpleBatchSize = this.optimizeBatchSize(groups.simple);
        for (let i = 0; i < groups.simple.length; i += simpleBatchSize) {
            batches.push({
                directories: groups.simple.slice(i, i + simpleBatchSize),
                type: 'simple',
                priority: 'high',
                estimatedTime: simpleBatchSize * 30000
            });
        }
        
        // Medium complexity directories in smaller batches
        const mediumBatchSize = Math.max(3, simpleBatchSize / 2);
        for (let i = 0; i < groups.medium.length; i += mediumBatchSize) {
            batches.push({
                directories: groups.medium.slice(i, i + mediumBatchSize),
                type: 'medium',
                priority: 'medium',
                estimatedTime: mediumBatchSize * 60000
            });
        }
        
        // Complex directories processed individually
        groups.complex.forEach(directory => {
            batches.push({
                directories: [directory],
                type: 'complex',
                priority: 'low',
                estimatedTime: 180000 // 3 minutes each
            });
        });
        
        return batches;
    }
}

export class ErrorRecoveryEngine {
    constructor() {
        this.recoveryStrategies = new Map();
        this.errorPatterns = new Map();
        this.setupRecoveryStrategies();
    }
    
    setupRecoveryStrategies() {
        this.recoveryStrategies.set('network', {
            maxRetries: 5,
            retryDelay: 10000,
            strategy: 'exponential_backoff',
            autoRecover: true
        });
        
        this.recoveryStrategies.set('timeout', {
            maxRetries: 3,
            retryDelay: 15000,
            strategy: 'linear_backoff',
            autoRecover: true
        });
        
        this.recoveryStrategies.set('captcha', {
            maxRetries: 1,
            retryDelay: 300000, // 5 minutes
            strategy: 'manual_intervention',
            autoRecover: false
        });
        
        this.recoveryStrategies.set('loginRequired', {
            maxRetries: 0,
            retryDelay: 0,
            strategy: 'skip',
            autoRecover: false
        });
        
        this.recoveryStrategies.set('formNotFound', {
            maxRetries: 2,
            retryDelay: 5000,
            strategy: 'page_refresh',
            autoRecover: true
        });
    }
    
    classifyError(error, context = {}) {
        const errorStr = error.toString().toLowerCase();
        
        // Network-related errors
        if (this.matchesPattern(errorStr, ['network', 'connection', 'dns', 'unreachable'])) {
            return 'network';
        }
        
        // Timeout errors
        if (this.matchesPattern(errorStr, ['timeout', 'timed out', 'deadline'])) {
            return 'timeout';
        }
        
        // CAPTCHA detection
        if (this.matchesPattern(errorStr, ['captcha', 'recaptcha', 'verification required'])) {
            return 'captcha';
        }
        
        // Login required
        if (this.matchesPattern(errorStr, ['login', 'authentication', 'unauthorized', '401'])) {
            return 'loginRequired';
        }
        
        // Form not found
        if (this.matchesPattern(errorStr, ['form', 'element not found', 'selector'])) {
            return 'formNotFound';
        }
        
        // Fee-based service detected
        if (this.matchesPattern(errorStr, ['payment', 'subscription', 'premium', 'upgrade'])) {
            return 'feeBased';
        }
        
        return 'unknown';
    }
    
    matchesPattern(text, patterns) {
        return patterns.some(pattern => text.includes(pattern));
    }
    
    getRecoveryStrategy(errorType) {
        return this.recoveryStrategies.get(errorType) || {
            maxRetries: 1,
            retryDelay: 5000,
            strategy: 'standard_retry',
            autoRecover: true
        };
    }
    
    async executeRecovery(job, error, errorType) {
        const strategy = this.getRecoveryStrategy(errorType);
        
        switch (strategy.strategy) {
            case 'exponential_backoff':
                return await this.exponentialBackoff(job, strategy);
                
            case 'linear_backoff':
                return await this.linearBackoff(job, strategy);
                
            case 'page_refresh':
                return await this.pageRefreshRecovery(job);
                
            case 'manual_intervention':
                return await this.manualInterventionRequired(job, errorType);
                
            case 'skip':
                return await this.skipJob(job, errorType);
                
            default:
                return await this.standardRetry(job, strategy);
        }
    }
    
    async exponentialBackoff(job, strategy) {
        const delay = strategy.retryDelay * Math.pow(2, job.retryCount);
        return {
            shouldRetry: job.retryCount < strategy.maxRetries,
            delay: Math.min(delay, 300000), // Cap at 5 minutes
            reason: 'Exponential backoff retry'
        };
    }
    
    async linearBackoff(job, strategy) {
        const delay = strategy.retryDelay * (job.retryCount + 1);
        return {
            shouldRetry: job.retryCount < strategy.maxRetries,
            delay: delay,
            reason: 'Linear backoff retry'
        };
    }
    
    async pageRefreshRecovery(job) {
        // Attempt to refresh the page and retry
        if (job.tabId) {
            try {
                await chrome.tabs.reload(job.tabId);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return {
                    shouldRetry: true,
                    delay: 0,
                    reason: 'Page refreshed for recovery'
                };
            } catch (refreshError) {
                return {
                    shouldRetry: false,
                    delay: 0,
                    reason: 'Page refresh failed'
                };
            }
        }
        
        return { shouldRetry: false, delay: 0, reason: 'No tab to refresh' };
    }
    
    async manualInterventionRequired(job, errorType) {
        // Log for manual review
        console.warn(`Manual intervention required for job ${job.id}: ${errorType}`);
        
        return {
            shouldRetry: false,
            delay: 0,
            reason: `Manual intervention required: ${errorType}`,
            requiresManualReview: true
        };
    }
    
    async skipJob(job, errorType) {
        return {
            shouldRetry: false,
            delay: 0,
            reason: `Job skipped due to: ${errorType}`,
            shouldSkip: true
        };
    }
    
    async standardRetry(job, strategy) {
        return {
            shouldRetry: job.retryCount < strategy.maxRetries,
            delay: strategy.retryDelay,
            reason: 'Standard retry attempt'
        };
    }
    
    analyzeErrorTrends(errors) {
        const trends = {
            mostCommonError: null,
            errorFrequency: new Map(),
            timePatterns: new Map(),
            recommendations: []
        };
        
        // Analyze error frequency
        errors.forEach(error => {
            const type = this.classifyError(error.message);
            trends.errorFrequency.set(type, (trends.errorFrequency.get(type) || 0) + 1);
        });
        
        // Find most common error
        let maxCount = 0;
        trends.errorFrequency.forEach((count, type) => {
            if (count > maxCount) {
                maxCount = count;
                trends.mostCommonError = type;
            }
        });
        
        // Generate recommendations
        if (trends.mostCommonError === 'network') {
            trends.recommendations.push('Consider increasing network timeout values');
            trends.recommendations.push('Check for network stability issues');
        }
        
        if (trends.mostCommonError === 'timeout') {
            trends.recommendations.push('Increase processing timeouts');
            trends.recommendations.push('Reduce batch sizes for complex directories');
        }
        
        return trends;
    }
}

export class PerformanceOptimizer {
    constructor() {
        this.performanceMetrics = new Map();
        this.optimizationHistory = [];
    }
    
    trackPerformance(jobId, metrics) {
        this.performanceMetrics.set(jobId, {
            ...metrics,
            timestamp: Date.now()
        });
    }
    
    analyzePerformance() {
        const metrics = Array.from(this.performanceMetrics.values());
        
        return {
            averageProcessingTime: this.calculateAverage(metrics, 'processingTime'),
            successRate: this.calculateSuccessRate(metrics),
            memoryUsage: this.calculateAverage(metrics, 'memoryUsage'),
            recommendations: this.generateOptimizationRecommendations(metrics)
        };
    }
    
    calculateAverage(metrics, field) {
        if (metrics.length === 0) return 0;
        
        const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
        return sum / metrics.length;
    }
    
    calculateSuccessRate(metrics) {
        if (metrics.length === 0) return 0;
        
        const successful = metrics.filter(metric => metric.success).length;
        return (successful / metrics.length) * 100;
    }
    
    generateOptimizationRecommendations(metrics) {
        const recommendations = [];
        const avgTime = this.calculateAverage(metrics, 'processingTime');
        const successRate = this.calculateSuccessRate(metrics);
        
        if (avgTime > 120000) { // 2 minutes
            recommendations.push('Consider reducing batch sizes to improve processing time');
        }
        
        if (successRate < 80) {
            recommendations.push('Review error handling strategies to improve success rate');
        }
        
        return recommendations;
    }
}