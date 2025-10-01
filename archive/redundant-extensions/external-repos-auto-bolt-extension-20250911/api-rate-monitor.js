/**
 * Auto-Bolt API Rate Monitoring System
 * Comprehensive API rate limiting and usage monitoring for Airtable and other services
 * Prevents rate limit violations and optimizes API usage patterns
 */

class APIRateMonitor {
    constructor() {
        this.config = {
            airtable: {
                baseUrl: 'https://api.airtable.com',
                rateLimit: 5, // requests per second
                burstLimit: 50, // burst capacity
                dailyLimit: 100000, // requests per day
                retryAfterHeader: 'Retry-After',
                rateLimitHeaders: {
                    remaining: 'X-RateLimit-Remaining',
                    reset: 'X-RateLimit-Reset',
                    limit: 'X-RateLimit-Limit'
                }
            },
            monitoring: {
                trackingWindow: 3600000, // 1 hour in ms
                alertThresholds: {
                    warning: 0.8, // 80% of rate limit
                    critical: 0.95 // 95% of rate limit
                },
                cooldownPeriod: 300000, // 5 minutes
                retryBackoff: {
                    initial: 1000,
                    multiplier: 2,
                    maxDelay: 30000
                }
            }
        };
        
        this.rateLimiters = new Map();
        this.apiMetrics = new Map();
        this.alertSystem = null;
        this.requestQueue = new Map();
        this.retryQueue = [];
        
        this.init();
    }
    
    async init() {
        console.log('📊 Initializing API Rate Monitor...');
        
        await this.loadConfig();
        this.setupRateLimiters();
        this.startMonitoring();
        this.setupRequestInterception();
        
        console.log('✅ API Rate Monitor initialized');
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.local.get('apiRateConfig');
            if (result.apiRateConfig) {
                this.config = { ...this.config, ...result.apiRateConfig };
            }
        } catch (error) {
            console.warn('Using default API rate config:', error);
        }
    }
    
    setupRateLimiters() {
        // Airtable rate limiter
        this.rateLimiters.set('airtable', new RateLimiter({
            tokensPerInterval: this.config.airtable.rateLimit,
            interval: 1000, // 1 second
            fireImmediately: true
        }));
        
        // Initialize metrics for each API
        this.apiMetrics.set('airtable', new APIMetrics('airtable'));
        
        console.log('🚦 Rate limiters configured');
    }
    
    setupRequestInterception() {
        // Intercept fetch requests to monitor API calls
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            const apiProvider = this.identifyAPIProvider(url);
            
            if (apiProvider) {
                return this.handleAPIRequest(originalFetch, url, options, apiProvider);
            }
            
            return originalFetch(url, options);
        };
        
        console.log('🔍 Request interception setup complete');
    }
    
    identifyAPIProvider(url) {
        if (typeof url === 'string') {
            if (url.includes('api.airtable.com')) return 'airtable';
        } else if (url instanceof URL) {
            if (url.hostname === 'api.airtable.com') return 'airtable';
        }
        return null;
    }
    
    async handleAPIRequest(originalFetch, url, options, apiProvider) {
        const startTime = performance.now();
        const requestId = this.generateRequestId();
        const metrics = this.apiMetrics.get(apiProvider);
        
        try {
            // Check rate limits before making request
            await this.checkRateLimit(apiProvider);
            
            // Make the request
            const response = await originalFetch(url, options);
            
            // Record metrics
            const duration = performance.now() - startTime;
            this.recordRequest(apiProvider, {
                requestId,
                url: typeof url === 'string' ? url : url.toString(),
                method: options.method || 'GET',
                status: response.status,
                duration,
                timestamp: Date.now(),
                success: response.ok
            });
            
            // Handle rate limit headers
            this.updateRateLimitInfo(apiProvider, response);
            
            // Handle rate limit errors
            if (response.status === 429) {
                await this.handleRateLimit(apiProvider, response);
            }
            
            return response;
            
        } catch (error) {
            const duration = performance.now() - startTime;
            
            this.recordRequest(apiProvider, {
                requestId,
                url: typeof url === 'string' ? url : url.toString(),
                method: options.method || 'GET',
                status: 0,
                duration,
                timestamp: Date.now(),
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }
    
    async checkRateLimit(apiProvider) {
        const rateLimiter = this.rateLimiters.get(apiProvider);
        const metrics = this.apiMetrics.get(apiProvider);
        
        if (!rateLimiter || !metrics) {
            return;
        }
        
        // Check if we should throttle based on current usage
        const currentUsage = metrics.getCurrentUsage();
        const threshold = this.config.monitoring.alertThresholds.warning;
        
        if (currentUsage.percentage > threshold) {
            console.warn(`⚠️ API usage high for ${apiProvider}: ${currentUsage.percentage.toFixed(1)}%`);
            
            // Add delay to prevent hitting limits
            const delay = this.calculateThrottleDelay(currentUsage.percentage);
            if (delay > 0) {
                await this.sleep(delay);
            }
        }
        
        // Use rate limiter
        return rateLimiter.removeTokens(1);
    }
    
    calculateThrottleDelay(usagePercentage) {
        if (usagePercentage < 0.8) return 0;
        if (usagePercentage < 0.9) return 100;
        if (usagePercentage < 0.95) return 500;
        return 1000;
    }
    
    updateRateLimitInfo(apiProvider, response) {
        const metrics = this.apiMetrics.get(apiProvider);
        if (!metrics) return;
        
        const headers = response.headers;
        const config = this.config[apiProvider];
        
        if (config && config.rateLimitHeaders) {
            const remaining = headers.get(config.rateLimitHeaders.remaining);
            const reset = headers.get(config.rateLimitHeaders.reset);
            const limit = headers.get(config.rateLimitHeaders.limit);
            
            if (remaining !== null || reset !== null || limit !== null) {
                metrics.updateRateLimitInfo({
                    remaining: remaining ? parseInt(remaining) : null,
                    reset: reset ? parseInt(reset) : null,
                    limit: limit ? parseInt(limit) : null
                });
            }
        }
    }
    
    async handleRateLimit(apiProvider, response) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        const retryDelay = parseInt(retryAfter) * 1000;
        
        console.warn(`🚦 Rate limit hit for ${apiProvider}, retrying after ${retryAfter}s`);
        
        // Create alert
        if (this.alertSystem) {
            this.alertSystem.createAlert(
                'WARNING',
                `API Rate Limit Hit - ${apiProvider}`,
                `Rate limit exceeded for ${apiProvider}. Retrying after ${retryAfter} seconds.`,
                {
                    apiProvider,
                    retryAfter: retryAfter,
                    timestamp: Date.now()
                }
            );
        }
        
        // Update metrics
        const metrics = this.apiMetrics.get(apiProvider);
        if (metrics) {
            metrics.recordRateLimit(retryDelay);
        }
    }
    
    recordRequest(apiProvider, requestData) {
        const metrics = this.apiMetrics.get(apiProvider);
        if (metrics) {
            metrics.recordRequest(requestData);
        }
        
        // Check if we need to create alerts
        this.checkUsageAlerts(apiProvider);
    }
    
    checkUsageAlerts(apiProvider) {
        const metrics = this.apiMetrics.get(apiProvider);
        if (!metrics || !this.alertSystem) return;
        
        const usage = metrics.getCurrentUsage();
        const config = this.config.monitoring.alertThresholds;
        
        // Warning threshold
        if (usage.percentage >= config.warning && usage.percentage < config.critical) {
            this.alertSystem.createAlert(
                'WARNING',
                `API Usage Warning - ${apiProvider}`,
                `API usage for ${apiProvider} is at ${usage.percentage.toFixed(1)}% (${usage.current}/${usage.limit})`,
                {
                    apiProvider,
                    usage: usage.current,
                    limit: usage.limit,
                    percentage: usage.percentage
                }
            );
        }
        
        // Critical threshold
        if (usage.percentage >= config.critical) {
            this.alertSystem.createAlert(
                'CRITICAL',
                `API Usage Critical - ${apiProvider}`,
                `API usage for ${apiProvider} is critically high at ${usage.percentage.toFixed(1)}% (${usage.current}/${usage.limit})`,
                {
                    apiProvider,
                    usage: usage.current,
                    limit: usage.limit,
                    percentage: usage.percentage
                }
            );
        }
    }
    
    startMonitoring() {
        // Periodic monitoring and cleanup
        setInterval(() => {
            this.performMonitoringCycle();
        }, 60000); // Every minute
        
        // Save metrics periodically
        setInterval(() => {
            this.saveMetrics();
        }, 300000); // Every 5 minutes
    }
    
    performMonitoringCycle() {
        for (const [provider, metrics] of this.apiMetrics) {
            try {
                // Cleanup old data
                metrics.cleanup();
                
                // Generate reports
                const report = metrics.generateReport();
                
                // Log if high usage
                if (report.usage.percentage > 50) {
                    console.log(`📊 ${provider} API Usage: ${report.usage.percentage.toFixed(1)}% (${report.requests.total} requests in last hour)`);
                }
                
            } catch (error) {
                console.error(`Error monitoring ${provider}:`, error);
            }
        }
    }
    
    async saveMetrics() {
        try {
            const metricsData = {};
            
            for (const [provider, metrics] of this.apiMetrics) {
                metricsData[provider] = metrics.serialize();
            }
            
            await chrome.storage.local.set({
                apiMetrics: metricsData,
                apiMetricsLastUpdate: Date.now()
            });
            
        } catch (error) {
            console.error('Error saving API metrics:', error);
        }
    }
    
    // Public API methods
    
    getMetrics(apiProvider = null) {
        if (apiProvider) {
            const metrics = this.apiMetrics.get(apiProvider);
            return metrics ? metrics.generateReport() : null;
        }
        
        const allMetrics = {};
        for (const [provider, metrics] of this.apiMetrics) {
            allMetrics[provider] = metrics.generateReport();
        }
        
        return allMetrics;
    }
    
    getCurrentUsage(apiProvider) {
        const metrics = this.apiMetrics.get(apiProvider);
        return metrics ? metrics.getCurrentUsage() : null;
    }
    
    setAlertSystem(alertSystem) {
        this.alertSystem = alertSystem;
        console.log('🚨 Alert system connected to API Rate Monitor');
    }
    
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * API Metrics tracker for individual API providers
 */
class APIMetrics {
    constructor(provider) {
        this.provider = provider;
        this.requests = [];
        this.rateLimitInfo = {
            remaining: null,
            reset: null,
            limit: null,
            lastUpdate: null
        };
        this.rateLimitEvents = [];
    }
    
    recordRequest(requestData) {
        this.requests.push(requestData);
        
        // Keep only last 1000 requests
        if (this.requests.length > 1000) {
            this.requests = this.requests.slice(-1000);
        }
    }
    
    updateRateLimitInfo(info) {
        this.rateLimitInfo = {
            ...this.rateLimitInfo,
            ...info,
            lastUpdate: Date.now()
        };
    }
    
    recordRateLimit(retryDelay) {
        this.rateLimitEvents.push({
            timestamp: Date.now(),
            retryDelay
        });
        
        // Keep only last 100 rate limit events
        if (this.rateLimitEvents.length > 100) {
            this.rateLimitEvents = this.rateLimitEvents.slice(-100);
        }
    }
    
    getCurrentUsage() {
        const oneHourAgo = Date.now() - 3600000; // 1 hour
        const recentRequests = this.requests.filter(req => req.timestamp > oneHourAgo);
        
        // Use rate limit info if available, otherwise estimate
        let limit = this.rateLimitInfo.limit;
        if (!limit) {
            // Estimate based on provider (Airtable = 5 req/sec = 18000 req/hour)
            limit = this.provider === 'airtable' ? 18000 : 1000;
        }
        
        return {
            current: recentRequests.length,
            limit: limit,
            percentage: (recentRequests.length / limit) * 100,
            remaining: this.rateLimitInfo.remaining,
            resetTime: this.rateLimitInfo.reset
        };
    }
    
    generateReport() {
        const oneHourAgo = Date.now() - 3600000;
        const recentRequests = this.requests.filter(req => req.timestamp > oneHourAgo);
        const successfulRequests = recentRequests.filter(req => req.success);
        const failedRequests = recentRequests.filter(req => !req.success);
        
        const avgDuration = recentRequests.length > 0 
            ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length
            : 0;
        
        return {
            provider: this.provider,
            timestamp: Date.now(),
            requests: {
                total: recentRequests.length,
                successful: successfulRequests.length,
                failed: failedRequests.length,
                successRate: recentRequests.length > 0 
                    ? (successfulRequests.length / recentRequests.length) * 100 
                    : 0
            },
            performance: {
                avgDuration: avgDuration,
                minDuration: recentRequests.length > 0 
                    ? Math.min(...recentRequests.map(r => r.duration)) 
                    : 0,
                maxDuration: recentRequests.length > 0 
                    ? Math.max(...recentRequests.map(r => r.duration)) 
                    : 0
            },
            usage: this.getCurrentUsage(),
            rateLimits: {
                events: this.rateLimitEvents.filter(e => e.timestamp > oneHourAgo).length,
                lastEvent: this.rateLimitEvents.length > 0 
                    ? this.rateLimitEvents[this.rateLimitEvents.length - 1] 
                    : null
            }
        };
    }
    
    cleanup() {
        const oneHourAgo = Date.now() - 3600000;
        
        // Remove old requests (keep last hour)
        this.requests = this.requests.filter(req => req.timestamp > oneHourAgo);
        
        // Remove old rate limit events
        this.rateLimitEvents = this.rateLimitEvents.filter(event => event.timestamp > oneHourAgo);
    }
    
    serialize() {
        return {
            provider: this.provider,
            requests: this.requests.slice(-100), // Last 100 requests
            rateLimitInfo: this.rateLimitInfo,
            rateLimitEvents: this.rateLimitEvents.slice(-50) // Last 50 events
        };
    }
}

/**
 * Token bucket rate limiter implementation
 */
class RateLimiter {
    constructor(options) {
        this.tokensPerInterval = options.tokensPerInterval;
        this.interval = options.interval;
        this.maxTokens = options.maxTokens || options.tokensPerInterval;
        this.fireImmediately = options.fireImmediately || false;
        
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
    }
    
    async removeTokens(count = 1) {
        this.refill();
        
        if (this.tokens >= count) {
            this.tokens -= count;
            return Promise.resolve();
        }
        
        // Not enough tokens, calculate wait time
        const tokensNeeded = count - this.tokens;
        const timePerToken = this.interval / this.tokensPerInterval;
        const waitTime = tokensNeeded * timePerToken;
        
        return new Promise(resolve => {
            setTimeout(() => {
                this.tokens = Math.max(0, this.tokens - count);
                resolve();
            }, waitTime);
        });
    }
    
    refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        
        if (timePassed >= this.interval) {
            const tokensToAdd = Math.floor(timePassed / this.interval) * this.tokensPerInterval;
            this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }
    
    getTokenCount() {
        this.refill();
        return this.tokens;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIRateMonitor, APIMetrics, RateLimiter };
} else {
    window.APIRateMonitor = APIRateMonitor;
}