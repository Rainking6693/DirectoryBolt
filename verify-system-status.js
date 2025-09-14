#!/usr/bin/env node

/**
 * DirectoryBolt System Status Verification Script
 * Tests all critical API endpoints and system components
 * 
 * Usage: node verify-system-status.js
 */

const https = require('https');
const http = require('http');

class SystemVerifier {
    constructor() {
        this.baseUrl = 'https://directorybolt.com';
        this.results = [];
        this.startTime = Date.now();
    }

    async verifySystem() {
        console.log('🔍 DirectoryBolt System Verification Starting...');
        console.log('=' .repeat(60));
        
        // Test critical API endpoints
        await this.testEndpoint('GET', '/api/health', null, 'System Health Check');
        await this.testEndpoint('GET', '/api/health/google-sheets', null, 'Google Sheets Health');
        await this.testEndpoint('POST', '/api/customer/validate', 
            { customerId: 'TEST-123' }, 'Customer Validation');
        await this.testEndpoint('GET', '/api/admin/config-check', null, 'Admin Config Check', {
            'x-admin-key': 'DirectoryBolt-Admin-2025-SecureKey'
        });
        
        // Test dashboard pages
        await this.testEndpoint('GET', '/dashboard', null, 'Customer Dashboard');
        await this.testEndpoint('GET', '/admin-dashboard', null, 'Admin Dashboard');
        await this.testEndpoint('GET', '/staff-dashboard', null, 'Staff Dashboard');
        
        this.generateReport();
    }

    async testEndpoint(method, path, body, description, headers = {}) {
        return new Promise((resolve) => {
            const url = `${this.baseUrl}${path}`;
            const startTime = Date.now();
            
            console.log(`🔄 Testing: ${description}`);
            console.log(`   ${method} ${url}`);
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-System-Verifier/1.0',
                    ...headers
                }
            };
            
            const req = https.request(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const duration = Date.now() - startTime;
                    const result = {
                        description,
                        method,
                        path,
                        status: res.statusCode,
                        duration,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        headers: res.headers,
                        body: this.parseResponse(data),
                        timestamp: new Date().toISOString()
                    };\
                    
                    this.results.push(result);
                    this.logResult(result);
                    resolve(result);
                });
            });
            
            req.on('error', (error) => {
                const duration = Date.now() - startTime;
                const result = {
                    description,
                    method,
                    path,
                    status: 0,
                    duration,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                this.results.push(result);
                this.logResult(result);
                resolve(result);
            });
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            
            req.end();
        });
    }

    parseResponse(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data.substring(0, 200) + (data.length > 200 ? '...' : '');
        }
    }

    logResult(result) {
        const statusIcon = result.success ? '✅' : '❌';
        const statusText = result.status || 'ERROR';
        const duration = `${result.duration}ms`;
        
        console.log(`   ${statusIcon} ${statusText} (${duration})`);
        
        if (!result.success) {
            if (result.error) {
                console.log(`   🔍 Error: ${result.error}`);
            } else if (result.body && typeof result.body === 'object') {
                console.log(`   🔍 Response: ${JSON.stringify(result.body, null, 2).substring(0, 200)}`);
            }
        } else if (result.body && typeof result.body === 'object' && result.body.status) {
            console.log(`   🔍 Status: ${result.body.status}`);
        }
        
        console.log('');
    }

    generateReport() {
        const totalDuration = Date.now() - this.startTime;
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        const successRate = Math.round((successCount / totalCount) * 100);
        
        console.log('=' .repeat(60));
        console.log('📊 SYSTEM VERIFICATION REPORT');
        console.log('=' .repeat(60));
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`📈 Success Rate: ${successCount}/${totalCount} (${successRate}%)`);
        console.log('');
        
        // Categorize results
        const critical = this.results.filter(r => 
            r.path.includes('/api/health') || 
            r.path.includes('/api/customer/validate') ||
            r.path.includes('/api/admin/config-check')
        );
        
        const dashboards = this.results.filter(r => 
            r.path.includes('dashboard')
        );
        
        console.log('🔧 CRITICAL API ENDPOINTS:');
        critical.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            console.log(`   ${icon} ${result.description}: ${result.status}`);
        });
        
        console.log('');
        console.log('🖥️  DASHBOARD PAGES:');
        dashboards.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            console.log(`   ${icon} ${result.description}: ${result.status}`);
        });
        
        console.log('');
        console.log('🎯 SYSTEM STATUS:');
        
        const criticalSuccess = critical.filter(r => r.success).length;
        const criticalTotal = critical.length;
        
        if (criticalSuccess === criticalTotal) {
            console.log('   ✅ SYSTEM OPERATIONAL - All critical endpoints functional');
        } else {
            console.log('   ❌ SYSTEM ISSUES DETECTED - Critical endpoints failing');
            console.log('   🔧 ACTION REQUIRED: Configure missing environment variables');
        }
        
        console.log('');
        console.log('📋 NEXT STEPS:');
        
        if (successRate < 80) {
            console.log('   1. Configure missing environment variables in Netlify');
            console.log('   2. Trigger Netlify redeploy');
            console.log('   3. Re-run this verification script');
            console.log('   4. Test AutoBolt extension functionality');
        } else {
            console.log('   1. Test AutoBolt extension customer validation');
            console.log('   2. Verify end-to-end customer journey');
            console.log('   3. Monitor system performance');
            console.log('   4. Begin customer onboarding');
        }
        
        console.log('');
        console.log('📄 Full results saved to: system-verification-results.json');
        
        // Save detailed results
        const reportData = {
            timestamp: new Date().toISOString(),
            totalDuration,
            successRate,
            successCount,
            totalCount,
            results: this.results,
            summary: {
                critical: {
                    success: criticalSuccess,
                    total: criticalTotal,
                    rate: Math.round((criticalSuccess / criticalTotal) * 100)
                },
                dashboards: {
                    success: dashboards.filter(r => r.success).length,
                    total: dashboards.length,
                    rate: Math.round((dashboards.filter(r => r.success).length / dashboards.length) * 100)
                }
            }
        };
        
        require('fs').writeFileSync(
            'system-verification-results.json', 
            JSON.stringify(reportData, null, 2)
        );
    }
}

// Run verification
const verifier = new SystemVerifier();
verifier.verifySystem().catch(console.error);