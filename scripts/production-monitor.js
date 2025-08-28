#!/usr/bin/env node

/**
 * DirectoryBolt Production Monitoring System
 * Continuous monitoring with alerting and reporting
 * 
 * Usage: npm run deploy:monitor
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class ProductionMonitor {
    constructor() {
        this.baseUrl = process.env.PRODUCTION_URL || 'https://directorybolt.com';
        this.monitoringInterval = parseInt(process.env.MONITOR_INTERVAL) || 300000; // 5 minutes
        this.alertThreshold = parseFloat(process.env.ALERT_THRESHOLD) || 7.0; // Alert if score < 7.0
        this.isRunning = false;
        this.metrics = {
            uptime: 0,
            totalChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            averageResponseTime: 0,
            lastHealthScore: 0,
            incidents: [],
            responseTimeHistory: []
        };
        
        this.endpoints = [
            { path: '/api/health', name: 'Health Check', critical: true },
            { path: '/api/analyze', name: 'Analysis API', critical: true },
            { path: '/api/create-checkout-session', name: 'Stripe Integration', critical: true },
            { path: '/', name: 'Homepage', critical: false },
            { path: '/pricing', name: 'Pricing Page', critical: false }
        ];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        console.log(logEntry);
        
        // Also write to file
        this.writeLogToFile(logEntry);
    }

    async writeLogToFile(logEntry) {
        try {
            const logDir = path.join(__dirname, '..', 'logs');
            await fs.mkdir(logDir, { recursive: true });
            
            const logFile = path.join(logDir, `monitor-${new Date().toISOString().split('T')[0]}.log`);
            await fs.appendFile(logFile, logEntry + '\n');
        } catch (error) {
            // Ignore file write errors to prevent infinite loops
        }
    }

    async checkEndpoint(endpoint) {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const url = `${this.baseUrl}${endpoint.path}`;
            const client = url.startsWith('https://') ? https : http;
            
            const req = client.get(url, { 
                timeout: 30000,
                headers: {
                    'User-Agent': 'DirectoryBolt-Monitor/1.0'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        endpoint: endpoint.path,
                        name: endpoint.name,
                        critical: endpoint.critical,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        responseTime,
                        timestamp: new Date().toISOString(),
                        response: data.substring(0, 1000) // First 1000 chars
                    });
                });
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    endpoint: endpoint.path,
                    name: endpoint.name,
                    critical: endpoint.critical,
                    status: 0,
                    success: false,
                    responseTime,
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                resolve({
                    endpoint: endpoint.path,
                    name: endpoint.name,
                    critical: endpoint.critical,
                    status: 408,
                    success: false,
                    responseTime,
                    timestamp: new Date().toISOString(),
                    error: 'Request timeout'
                });
            });
        });
    }

    async performHealthCheck() {
        this.log('🔍 Performing health check...');
        
        const results = [];
        let successCount = 0;
        let totalResponseTime = 0;
        let criticalIssues = 0;
        
        for (const endpoint of this.endpoints) {
            const result = await this.checkEndpoint(endpoint);
            results.push(result);
            totalResponseTime += result.responseTime;
            
            if (result.success) {
                successCount++;
                this.log(`✅ ${result.name} - ${result.status} (${result.responseTime}ms)`);
            } else {
                if (result.critical) {
                    criticalIssues++;
                    this.log(`❌ ${result.name} - ${result.error || result.status} (${result.responseTime}ms)`, 'error');
                } else {
                    this.log(`⚠️  ${result.name} - ${result.error || result.status} (${result.responseTime}ms)`, 'warn');
                }
            }
        }

        const healthScore = (successCount / this.endpoints.length) * 10;
        const avgResponseTime = Math.round(totalResponseTime / this.endpoints.length);
        
        // Update metrics
        this.metrics.totalChecks++;
        this.metrics.successfulChecks += successCount === this.endpoints.length ? 1 : 0;
        this.metrics.failedChecks += successCount < this.endpoints.length ? 1 : 0;
        this.metrics.lastHealthScore = healthScore;
        this.metrics.averageResponseTime = avgResponseTime;
        this.metrics.responseTimeHistory.push({
            timestamp: new Date().toISOString(),
            responseTime: avgResponseTime
        });

        // Keep only last 100 response time entries
        if (this.metrics.responseTimeHistory.length > 100) {
            this.metrics.responseTimeHistory = this.metrics.responseTimeHistory.slice(-100);
        }

        // Check for incidents
        if (criticalIssues > 0 || healthScore < this.alertThreshold) {
            await this.recordIncident(results, healthScore, criticalIssues);
        }

        this.log(`📊 Health Score: ${healthScore.toFixed(1)}/10 | Avg Response: ${avgResponseTime}ms`);
        
        return {
            score: healthScore,
            avgResponseTime,
            results,
            criticalIssues,
            timestamp: new Date().toISOString()
        };
    }

    async recordIncident(results, healthScore, criticalIssues) {
        const incident = {
            id: `incident-${Date.now()}`,
            timestamp: new Date().toISOString(),
            healthScore,
            criticalIssues,
            details: results.filter(r => !r.success),
            resolved: false
        };

        this.metrics.incidents.push(incident);
        
        // Keep only last 50 incidents
        if (this.metrics.incidents.length > 50) {
            this.metrics.incidents = this.metrics.incidents.slice(-50);
        }

        this.log(`🚨 INCIDENT RECORDED: ${incident.id} - Score: ${healthScore.toFixed(1)}/10`, 'error');
        
        // Send alert if configured
        await this.sendAlert(incident);
    }

    async sendAlert(incident) {
        // This is where you'd integrate with your alerting system
        // Examples: Slack webhook, email, PagerDuty, etc.
        
        const alertMessage = `
🚨 DirectoryBolt Production Alert 🚨

Incident ID: ${incident.id}
Time: ${incident.timestamp}
Health Score: ${incident.healthScore.toFixed(1)}/10
Critical Issues: ${incident.criticalIssues}

Failed Endpoints:
${incident.details.map(d => `• ${d.name}: ${d.error || d.status}`).join('\n')}

Production URL: ${this.baseUrl}
        `;

        this.log(`📧 ALERT: ${alertMessage}`, 'error');
        
        // You can add webhook calls here:
        // await this.sendSlackAlert(alertMessage);
        // await this.sendEmailAlert(alertMessage);
    }

    async generateStatusReport() {
        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        const uptimeHours = (uptime / 3600).toFixed(1);
        const successRate = this.metrics.totalChecks > 0 ? 
            ((this.metrics.successfulChecks / this.metrics.totalChecks) * 100).toFixed(1) : 0;

        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            uptime: {
                seconds: uptime,
                hours: uptimeHours
            },
            metrics: {
                ...this.metrics,
                successRate: `${successRate}%`
            },
            currentStatus: this.metrics.lastHealthScore >= this.alertThreshold ? 'HEALTHY' : 'DEGRADED',
            recentIncidents: this.metrics.incidents.slice(-5) // Last 5 incidents
        };

        // Write status report
        const reportsDir = path.join(__dirname, '..', 'monitoring-reports');
        await fs.mkdir(reportsDir, { recursive: true });
        
        const reportPath = path.join(reportsDir, 'current-status.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    async testApiPerformance() {
        this.log('⚡ Testing API performance...');
        
        // Test analysis endpoint with a real request
        const testUrl = 'https://example.com';
        const startTime = Date.now();
        
        try {
            const testResult = await this.makeAnalysisRequest(testUrl, 'starter');
            const analysisTime = Date.now() - startTime;
            
            if (analysisTime > 15000) {
                this.log(`⚠️  Analysis API slow: ${analysisTime}ms (>15s)`, 'warn');
            } else {
                this.log(`✅ Analysis API performance: ${analysisTime}ms`);
            }
            
            return {
                success: true,
                responseTime: analysisTime,
                result: testResult
            };
        } catch (error) {
            this.log(`❌ Analysis API test failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }

    async makeAnalysisRequest(url, tier) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({ url, tier });
            const options = {
                hostname: this.baseUrl.replace('https://', '').replace('http://', ''),
                port: this.baseUrl.startsWith('https://') ? 443 : 80,
                path: '/api/analyze',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const client = this.baseUrl.startsWith('https://') ? https : http;
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    async start() {
        this.log('🚀 Starting production monitoring...');
        this.isRunning = true;
        this.startTime = Date.now();
        
        const runMonitoringCycle = async () => {
            if (!this.isRunning) return;
            
            try {
                // Perform health check
                await this.performHealthCheck();
                
                // Test API performance every 3rd check
                if (this.metrics.totalChecks % 3 === 0) {
                    await this.testApiPerformance();
                }
                
                // Generate status report
                await this.generateStatusReport();
                
            } catch (error) {
                this.log(`❌ Monitoring error: ${error.message}`, 'error');
            }
            
            // Schedule next check
            setTimeout(runMonitoringCycle, this.monitoringInterval);
        };

        // Initial check
        await runMonitoringCycle();
        
        this.log(`📊 Monitoring active - checking every ${this.monitoringInterval/1000}s`);
    }

    stop() {
        this.log('🛑 Stopping production monitoring...');
        this.isRunning = false;
    }

    async getStatus() {
        return await this.generateStatusReport();
    }
}

// Command line interface
if (require.main === module) {
    const monitor = new ProductionMonitor();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        monitor.stop();
        process.exit(0);
    });
    
    // Start monitoring
    monitor.start().catch(error => {
        console.error('Failed to start monitoring:', error);
        process.exit(1);
    });
}

module.exports = ProductionMonitor;