#!/usr/bin/env node

/**
 * DirectoryBolt AutoBolt Proxy Management Service
 * 
 * Handles HTTP proxy rotation for Enterprise scaling
 * Monitors proxy health and automatically rotates to working proxies
 * Replaces extension throttling with intelligent proxy management
 */

const http = require('http');
const axios = require('axios');
const redis = require('redis');
const { URL } = require('url');

class ProxyManager {
    constructor() {
        this.config = {
            // Proxy Configuration
            proxyList: (process.env.PROXY_LIST || '').split(',').filter(p => p.trim()),
            rotationInterval: parseInt(process.env.PROXY_ROTATION_INTERVAL) || 300000, // 5 minutes
            healthCheckInterval: parseInt(process.env.PROXY_HEALTH_CHECK_INTERVAL) || 60000, // 1 minute
            
            // Redis Configuration
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            
            // Service Configuration
            port: process.env.PROXY_MANAGER_PORT || 3002,
            healthCheckTimeout: 10000,
            maxFailures: 3,
            
            // Test URLs for proxy health checks
            testUrls: [
                'https://httpbin.org/ip',
                'https://api.ipify.org?format=json',
                'https://ifconfig.me/ip'
            ]
        };
        
        this.state = {
            activeProxies: new Map(),
            failedProxies: new Map(),
            currentProxyIndex: 0,
            lastRotation: 0,
            totalRequests: 0,
            healthCheckRunning: false
        };
        
        this.redis = null;
        this.server = null;
    }
    
    /**
     * Initialize the proxy manager
     */
    async initialize() {
        console.log('🔧 Initializing Proxy Manager...');
        
        try {
            // Validate configuration
            if (this.config.proxyList.length === 0) {
                throw new Error('No proxies configured. Set PROXY_LIST environment variable.');
            }
            
            console.log(`📋 Managing ${this.config.proxyList.length} proxies:`, this.config.proxyList);
            
            // Connect to Redis
            this.redis = redis.createClient({ url: this.config.redisUrl });
            await this.redis.connect();
            console.log('✅ Connected to Redis');
            
            // Initialize proxy health states
            await this.initializeProxyStates();
            
            // Start health checking
            this.startHealthChecking();
            
            // Start HTTP server
            await this.startServer();
            
            console.log('✅ Proxy Manager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize proxy manager:', error);
            throw error;
        }
    }
    
    /**
     * Initialize proxy health states
     */
    async initializeProxyStates() {
        console.log('🔍 Initializing proxy health states...');
        
        for (const proxy of this.config.proxyList) {
            this.state.activeProxies.set(proxy, {
                url: proxy,
                healthy: true,
                failureCount: 0,
                lastCheck: 0,
                responseTime: 0,
                successRate: 100
            });
        }
        
        // Perform initial health check
        await this.performHealthCheck();
    }
    
    /**
     * Start periodic health checking
     */
    startHealthChecking() {
        console.log('🔄 Starting proxy health monitoring...');
        
        setInterval(async () => {
            if (!this.state.healthCheckRunning) {
                await this.performHealthCheck();
            }
        }, this.config.healthCheckInterval);
    }
    
    /**
     * Perform health check on all proxies
     */
    async performHealthCheck() {
        this.state.healthCheckRunning = true;
        console.log('🔍 Performing proxy health check...');
        
        try {
            const healthPromises = Array.from(this.state.activeProxies.keys()).map(proxy => 
                this.checkProxyHealth(proxy)
            );
            
            await Promise.allSettled(healthPromises);
            
            // Update Redis with current proxy states
            await this.updateProxyStatesInRedis();
            
            // Log health summary
            const healthyCount = Array.from(this.state.activeProxies.values())
                .filter(proxy => proxy.healthy).length;
            const totalCount = this.state.activeProxies.size;
            
            console.log(`📊 Proxy health check complete: ${healthyCount}/${totalCount} healthy`);
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
        } finally {
            this.state.healthCheckRunning = false;
        }
    }
    
    /**
     * Check individual proxy health
     */
    async checkProxyHealth(proxyUrl) {
        const startTime = Date.now();
        const proxyState = this.state.activeProxies.get(proxyUrl);
        
        try {
            // Parse proxy URL
            const proxyConfig = this.parseProxyUrl(proxyUrl);
            
            // Test proxy with a simple HTTP request
            const testUrl = this.config.testUrls[0]; // Use first test URL
            const response = await axios.get(testUrl, {
                proxy: proxyConfig,
                timeout: this.config.healthCheckTimeout,
                headers: {
                    'User-Agent': 'DirectoryBolt-ProxyChecker/1.0'
                }
            });
            
            // Update proxy state on success
            const responseTime = Date.now() - startTime;
            proxyState.healthy = true;
            proxyState.failureCount = 0;
            proxyState.lastCheck = startTime;
            proxyState.responseTime = responseTime;
            proxyState.successRate = Math.min(100, proxyState.successRate + 1);
            
            console.log(`✅ Proxy ${proxyUrl} healthy (${responseTime}ms)`);
            
        } catch (error) {
            // Update proxy state on failure
            proxyState.healthy = false;
            proxyState.failureCount += 1;
            proxyState.lastCheck = startTime;
            proxyState.successRate = Math.max(0, proxyState.successRate - 5);
            
            console.warn(`⚠️  Proxy ${proxyUrl} failed: ${error.message}`);
            
            // Move to failed proxies if too many failures
            if (proxyState.failureCount >= this.config.maxFailures) {
                this.state.failedProxies.set(proxyUrl, proxyState);
                this.state.activeProxies.delete(proxyUrl);
                console.log(`❌ Proxy ${proxyUrl} marked as failed`);
            }
        }
    }
    
    /**
     * Parse proxy URL into axios proxy configuration
     */
    parseProxyUrl(proxyUrl) {
        try {
            const url = new URL(proxyUrl);
            
            const config = {
                protocol: url.protocol.replace(':', ''),
                host: url.hostname,
                port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80)
            };
            
            if (url.username && url.password) {
                config.auth = {
                    username: url.username,
                    password: url.password
                };
            }
            
            return config;
        } catch (error) {
            throw new Error(`Invalid proxy URL: ${proxyUrl} - ${error.message}`);
        }
    }
    
    /**
     * Get next available proxy
     */
    async getNextProxy() {
        const healthyProxies = Array.from(this.state.activeProxies.entries())
            .filter(([url, state]) => state.healthy);
        
        if (healthyProxies.length === 0) {
            throw new Error('No healthy proxies available');
        }
        
        // Round-robin selection
        const [proxyUrl, proxyState] = healthyProxies[this.state.currentProxyIndex % healthyProxies.length];
        this.state.currentProxyIndex++;
        
        return {
            url: proxyUrl,
            config: this.parseProxyUrl(proxyUrl),
            state: proxyState
        };
    }
    
    /**
     * Update proxy states in Redis for worker access
     */
    async updateProxyStatesInRedis() {
        try {
            const proxyData = {
                active: Array.from(this.state.activeProxies.entries())
                    .filter(([url, state]) => state.healthy)
                    .map(([url, state]) => ({ url, ...state })),
                failed: Array.from(this.state.failedProxies.entries())
                    .map(([url, state]) => ({ url, ...state })),
                lastUpdate: Date.now()
            };
            
            await this.redis.setEx('autobolt:proxy:states', 300, JSON.stringify(proxyData));
        } catch (error) {
            console.error('❌ Failed to update proxy states in Redis:', error);
        }
    }
    
    /**
     * Start HTTP server for proxy management API
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });
            
            this.server.listen(this.config.port, () => {
                console.log(`🌐 Proxy Manager API listening on port ${this.config.port}`);
                resolve();
            });
            
            this.server.on('error', (error) => {
                console.error('❌ Server error:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Handle HTTP requests
     */
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.config.port}`);
        
        try {
            switch (url.pathname) {
                case '/health':
                    await this.handleHealthCheck(req, res);
                    break;
                case '/proxy/next':
                    await this.handleGetNextProxy(req, res);
                    break;
                case '/proxy/status':
                    await this.handleGetProxyStatus(req, res);
                    break;
                case '/proxy/rotate':
                    await this.handleRotateProxy(req, res);
                    break;
                default:
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not Found' }));
            }
        } catch (error) {
            console.error('❌ Request handling error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }
    
    /**
     * Handle health check requests
     */
    async handleHealthCheck(req, res) {
        const healthyCount = Array.from(this.state.activeProxies.values())
            .filter(proxy => proxy.healthy).length;
        
        const status = {
            status: healthyCount > 0 ? 'healthy' : 'unhealthy',
            proxies: {
                total: this.config.proxyList.length,
                healthy: healthyCount,
                failed: this.state.failedProxies.size
            },
            lastHealthCheck: Math.max(
                ...Array.from(this.state.activeProxies.values()).map(p => p.lastCheck)
            ),
            uptime: process.uptime()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    /**
     * Handle get next proxy requests
     */
    async handleGetNextProxy(req, res) {
        try {
            const proxy = await this.getNextProxy();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                proxy: proxy.url,
                config: proxy.config,
                responseTime: proxy.state.responseTime,
                successRate: proxy.state.successRate
            }));
            
            this.state.totalRequests++;
        } catch (error) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    /**
     * Handle get proxy status requests
     */
    async handleGetProxyStatus(req, res) {
        const status = {
            active: Array.from(this.state.activeProxies.entries()).map(([url, state]) => ({
                url,
                healthy: state.healthy,
                failureCount: state.failureCount,
                responseTime: state.responseTime,
                successRate: state.successRate,
                lastCheck: state.lastCheck
            })),
            failed: Array.from(this.state.failedProxies.entries()).map(([url, state]) => ({
                url,
                failureCount: state.failureCount,
                lastCheck: state.lastCheck
            })),
            stats: {
                totalRequests: this.state.totalRequests,
                currentIndex: this.state.currentProxyIndex,
                lastRotation: this.state.lastRotation
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    /**
     * Handle force proxy rotation requests
     */
    async handleRotateProxy(req, res) {
        this.state.currentProxyIndex++;
        this.state.lastRotation = Date.now();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Proxy rotation triggered',
            newIndex: this.state.currentProxyIndex
        }));
    }
    
    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Proxy Manager...');
        
        if (this.server) {
            this.server.close();
        }
        
        if (this.redis) {
            await this.redis.quit();
        }
        
        console.log('✅ Proxy Manager shut down gracefully');
        process.exit(0);
    }
}

// Main execution
if (require.main === module) {
    const proxyManager = new ProxyManager();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        proxyManager.shutdown();
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        proxyManager.shutdown();
    });
    
    // Start the proxy manager
    proxyManager.initialize()
        .then(() => {
            console.log('🚀 DirectoryBolt Proxy Manager is running!');
        })
        .catch((error) => {
            console.error('❌ Failed to start proxy manager:', error);
            process.exit(1);
        });
}

module.exports = ProxyManager;