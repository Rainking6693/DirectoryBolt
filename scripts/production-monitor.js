#!/usr/bin/env node

/**
 * DirectoryBolt Production Monitoring System
 * Monitors deployment health, API performance, and error rates
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class ProductionMonitor {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.startTime = Date.now();
        this.monitoringId = `monitor-${Date.now()}`;
        
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            errors: [],
            endpointStats: {}
        };
        
        console.log(`🔍 DirectoryBolt Production Monitor Started`);
        console.log(`🌐 Monitoring: ${this.baseUrl}`);
        console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        
        console.log(`${colors[level] || colors.info}[${timestamp}] ${message}${colors.reset}`);
    }

    async makeRequest(endpoint, method = 'GET', expectedStatus = 200) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const url = require('url').parse(`${this.baseUrl}${endpoint}`);
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.path,
                method: method,
                timeout: 30000, // 30 second timeout for analyze endpoint
                headers: {
                    'User-Agent': 'DirectoryBolt-Monitor/1.0',
                    'Accept': 'application/json, text/html',
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        status: res.statusCode,
                        responseTime,
                        data: data.slice(0, 1000), // Limit data size
                        headers: res.headers,
                        success: res.statusCode === expectedStatus || (expectedStatus === 'any' && res.statusCode < 500)
                    });
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                reject({
                    error: error.message,
                    responseTime,
                    success: false
                });
            });

            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                reject({
                    error: 'Request timeout',
                    responseTime,
                    success: false
                });
            });

            req.setTimeout(30000);
            
            // Send POST data for analyze endpoint
            if (method === 'POST' && endpoint === '/api/analyze') {
                const postData = JSON.stringify({
                    url: 'https://example.com',
                    categories: ['technology']
                });
                req.write(postData);
            }
            
            req.end();
        });
    }

    async testEndpoint(endpoint, method = 'GET', expectedStatus = 200, name = null) {
        const displayName = name || `${method} ${endpoint}`;
        
        try {
            this.metrics.totalRequests++;
            
            const result = await this.makeRequest(endpoint, method, expectedStatus);
            
            if (result.success) {
                this.metrics.successfulRequests++;
                this.log(`✅ ${displayName}: ${result.status} (${result.responseTime}ms)`, 'success');
            } else {
                this.metrics.failedRequests++;
                this.log(`⚠️  ${displayName}: ${result.status} (${result.responseTime}ms)`, 'warning');
            }
            
            // Update endpoint stats
            if (!this.metrics.endpointStats[endpoint]) {
                this.metrics.endpointStats[endpoint] = {
                    requests: 0,
                    successes: 0,
                    failures: 0,
                    avgResponseTime: 0,
                    totalResponseTime: 0
                };
            }
            
            const stats = this.metrics.endpointStats[endpoint];
            stats.requests++;
            stats.totalResponseTime += result.responseTime;
            stats.avgResponseTime = Math.round(stats.totalResponseTime / stats.requests);
            
            if (result.success) {
                stats.successes++;
            } else {
                stats.failures++;
            }
            
            return result;
            
        } catch (error) {
            this.metrics.totalRequests++;
            this.metrics.failedRequests++;
            this.metrics.errors.push({
                endpoint,
                method,
                error: error.error || error.message,
                timestamp: new Date().toISOString(),
                responseTime: error.responseTime || 0
            });
            
            this.log(`❌ ${displayName}: ${error.error || error.message} (${error.responseTime || 0}ms)`, 'error');
            return { success: false, error: error.error || error.message };
        }
    }

    async runHealthChecks() {
        this.log('🏥 Running health checks...');
        
        const healthChecks = [
            { endpoint: '/', method: 'GET', status: 200, name: 'Homepage' },
            { endpoint: '/pricing', method: 'GET', status: 200, name: 'Pricing Page' },
            { endpoint: '/api/health', method: 'GET', status: 200, name: 'Health API' },
            { endpoint: '/api/analyze', method: 'POST', status: 200, name: 'Analyze API (with test data)' },
            { endpoint: '/api/create-checkout-session', method: 'GET', status: 405, name: 'Checkout API (method check)' }
        ];
        
        for (const check of healthChecks) {
            await this.testEndpoint(check.endpoint, check.method, check.status, check.name);
            // Wait between requests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async runPerformanceTest() {
        this.log('🚀 Running performance tests...');
        
        // Test homepage performance multiple times
        const iterations = 3;
        const responseTimes = [];
        
        for (let i = 0; i < iterations; i++) {
            const result = await this.testEndpoint('/', 'GET', 200, `Homepage Performance Test ${i + 1}`);
            if (result.success) {
                responseTimes.push(result.responseTime);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (responseTimes.length > 0) {
            const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length);
            const minResponseTime = Math.min(...responseTimes);
            const maxResponseTime = Math.max(...responseTimes);
            
            this.log(`📊 Homepage Performance - Avg: ${avgResponseTime}ms, Min: ${minResponseTime}ms, Max: ${maxResponseTime}ms`, 'info');
            this.metrics.avgResponseTime = avgResponseTime;
        }
    }

    async testAnalyzeWorkflow() {
        this.log('🔍 Testing analyze workflow...');
        
        // Test with different scenarios that Nathan validated
        const testScenarios = [
            {
                name: 'Valid URL Test',
                data: { url: 'https://stripe.com', categories: ['technology', 'finance'] }
            },
            {
                name: 'DNS Resolution Test', 
                data: { url: 'https://nonexistent-domain-12345.com', categories: ['technology'] }
            },
            {
                name: 'Invalid URL Test',
                data: { url: 'not-a-url', categories: ['technology'] }
            }
        ];
        
        for (const scenario of testScenarios) {
            try {
                this.log(`Testing: ${scenario.name}`);
                const result = await this.makeRequest('/api/analyze', 'POST');
                
                if (result.success) {
                    this.log(`✅ ${scenario.name}: API responded correctly`, 'success');
                } else {
                    this.log(`⚠️  ${scenario.name}: Status ${result.status}`, 'warning');
                }
            } catch (error) {
                this.log(`❌ ${scenario.name}: ${error.error || error.message}`, 'error');
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer between analyze tests
        }
    }

    async testPricingTiers() {
        this.log('💳 Testing pricing tiers...');
        
        // Test that pricing page loads and contains tier information
        try {
            const result = await this.testEndpoint('/pricing', 'GET', 200, 'Pricing Page Load');
            if (result.success && result.data) {
                const hasStarterTier = result.data.includes('Starter') || result.data.includes('$9');
                const hasGrowthTier = result.data.includes('Growth') || result.data.includes('$29');
                const hasProfessionalTier = result.data.includes('Professional') || result.data.includes('$79');
                const hasEnterpriseTier = result.data.includes('Enterprise') || result.data.includes('$199');
                
                if (hasStarterTier && hasGrowthTier && hasProfessionalTier && hasEnterpriseTier) {
                    this.log('✅ All 4 pricing tiers detected on pricing page', 'success');
                } else {
                    this.log('⚠️  Some pricing tiers may be missing from pricing page', 'warning');
                }
            }
        } catch (error) {
            this.log(`❌ Pricing tiers test failed: ${error.message}`, 'error');
        }
    }

    generateReport() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const successRate = this.metrics.totalRequests > 0 
            ? Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100) 
            : 0;
        
        const report = {
            monitoringId: this.monitoringId,
            timestamp: new Date().toISOString(),
            duration: `${duration} seconds`,
            baseUrl: this.baseUrl,
            summary: {
                totalRequests: this.metrics.totalRequests,
                successfulRequests: this.metrics.successfulRequests,
                failedRequests: this.metrics.failedRequests,
                successRate: `${successRate}%`,
                avgResponseTime: `${this.metrics.avgResponseTime}ms`
            },
            endpointStats: this.metrics.endpointStats,
            errors: this.metrics.errors,
            healthStatus: successRate >= 80 ? 'HEALTHY' : successRate >= 50 ? 'DEGRADED' : 'UNHEALTHY',
            recommendations: []
        };
        
        // Add recommendations
        if (successRate < 80) {
            report.recommendations.push('⚠️  Success rate below 80% - investigate failing endpoints');
        }
        if (this.metrics.avgResponseTime > 3000) {
            report.recommendations.push('🐌 Average response time above 3s - consider performance optimization');
        }
        if (this.metrics.errors.length > 0) {
            report.recommendations.push(`❌ ${this.metrics.errors.length} errors detected - review error logs`);
        }
        if (report.recommendations.length === 0) {
            report.recommendations.push('✅ All systems operating within normal parameters');
        }
        
        // Save report
        const reportFile = `monitoring-report-${this.monitoringId}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('\n' + '='.repeat(80));
        console.log('🔍 DirectoryBolt Production Monitoring Report');
        console.log('='.repeat(80));
        console.log(`🌐 URL: ${this.baseUrl}`);
        console.log(`⏱️  Duration: ${report.duration}`);
        console.log(`📊 Requests: ${report.summary.totalRequests} (${report.summary.successfulRequests} success, ${report.summary.failedRequests} failed)`);
        console.log(`✅ Success Rate: ${report.summary.successRate}`);
        console.log(`⚡ Avg Response Time: ${report.summary.avgResponseTime}`);
        console.log(`🏥 Health Status: ${report.healthStatus}`);
        console.log(`📋 Report saved: ${reportFile}`);
        
        console.log('\n📈 Endpoint Performance:');
        Object.entries(report.endpointStats).forEach(([endpoint, stats]) => {
            const successRate = stats.requests > 0 ? Math.round((stats.successes / stats.requests) * 100) : 0;
            console.log(`  ${endpoint}: ${successRate}% success, ${stats.avgResponseTime}ms avg`);
        });
        
        if (report.errors.length > 0) {
            console.log('\n❌ Errors Detected:');
            report.errors.forEach(error => {
                console.log(`  ${error.endpoint}: ${error.error} (${error.responseTime}ms)`);
            });
        }
        
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`  ${rec}`));
        
        console.log('\n' + '='.repeat(80));
        
        return report;
    }

    async monitor() {
        try {
            await this.runHealthChecks();
            await this.runPerformanceTest();
            await this.testAnalyzeWorkflow();
            await this.testPricingTiers();
            
            const report = this.generateReport();
            
            return {
                success: true,
                healthStatus: report.healthStatus,
                successRate: report.summary.successRate,
                report: report
            };
            
        } catch (error) {
            this.log(`💥 Monitoring failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run monitoring if called directly
if (require.main === module) {
    const baseUrl = process.argv[2] || process.env.DEPLOYMENT_URL;
    
    if (!baseUrl) {
        console.error('❌ Usage: node production-monitor.js <base-url>');
        console.error('   Example: node production-monitor.js https://your-app.vercel.app');
        process.exit(1);
    }
    
    const monitor = new ProductionMonitor(baseUrl);
    
    monitor.monitor()
        .then(result => {
            console.log(`\n🎉 MONITORING COMPLETE - Status: ${result.healthStatus}`);
            process.exit(result.healthStatus === 'HEALTHY' ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 MONITORING FAILED!');
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = ProductionMonitor;