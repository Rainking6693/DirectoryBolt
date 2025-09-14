#!/usr/bin/env node

/**
 * CLIVE - API Endpoint Testing Script
 * Tests DirectoryBolt customer validation endpoints
 */

const https = require('https');

class CLIVEAPITester {
    constructor() {
        this.baseUrl = 'directorybolt.com';
        this.testCustomerId = 'TEST-123';
        this.results = [];
    }

    async testEndpoint(path, method = 'POST', body = null) {
        return new Promise((resolve) => {
            const postData = body ? JSON.stringify(body) : null;
            
            const options = {
                hostname: this.baseUrl,
                port: 443,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CLIVE-API-Tester/1.0'
                }
            };

            if (postData) {
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            console.log(`🔍 CLIVE Testing: ${method} https://${this.baseUrl}${path}`);

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const result = {
                        path,
                        method,
                        status: res.statusCode,
                        headers: res.headers,
                        body: this.parseResponse(data),
                        timestamp: new Date().toISOString()
                    };
                    
                    this.results.push(result);
                    this.logResult(result);
                    resolve(result);
                });
            });

            req.on('error', (error) => {
                const result = {
                    path,
                    method,
                    status: 0,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                this.results.push(result);
                this.logResult(result);
                resolve(result);
            });

            if (postData) {
                req.write(postData);
            }
            
            req.end();
        });
    }

    parseResponse(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data.substring(0, 500);
        }
    }

    logResult(result) {
        const statusIcon = result.status >= 200 && result.status < 300 ? '✅' : '❌';
        console.log(`   ${statusIcon} ${result.status || 'ERROR'} - ${result.path}`);
        
        if (result.body && typeof result.body === 'object') {
            if (result.body.success !== undefined) {
                console.log(`   📝 Success: ${result.body.success}`);
            }
            if (result.body.error) {
                console.log(`   🚨 Error: ${result.body.error}`);
            }
            if (result.body.message) {
                console.log(`   💬 Message: ${result.body.message}`);
            }
        }
        console.log('');
    }

    async runComprehensiveTest() {
        console.log('🔍 CLIVE - DirectoryBolt API Endpoint Testing');
        console.log('=' .repeat(60));
        
        // Test customer validation endpoints
        await this.testCustomerValidationEndpoints();
        
        // Test Netlify Functions directly
        await this.testNetlifyFunctions();
        
        // Test health endpoints
        await this.testHealthEndpoints();
        
        // Generate report
        this.generateReport();
    }

    async testCustomerValidationEndpoints() {
        console.log('\\n📋 Testing Customer Validation Endpoints...');
        
        const testPayload = { customerId: this.testCustomerId };
        
        // Test main customer validation endpoint (what extension calls)
        await this.testEndpoint('/api/customer/validate', 'POST', testPayload);
        
        // Test extension validation endpoints
        await this.testEndpoint('/api/extension/validate', 'POST', {
            customerId: this.testCustomerId,
            extensionVersion: '3.0.2',
            timestamp: Date.now()
        });
        
        await this.testEndpoint('/api/extension/secure-validate', 'POST', testPayload);
        await this.testEndpoint('/api/extension/validate-simple', 'POST', testPayload);
    }

    async testNetlifyFunctions() {
        console.log('\\n⚡ Testing Netlify Functions Directly...');
        
        const testPayload = { customerId: this.testCustomerId };
        
        // Test direct Netlify Function URLs
        await this.testEndpoint('/.netlify/functions/customer-validate', 'POST', testPayload);
        await this.testEndpoint('/.netlify/functions/health-google-sheets', 'GET');
    }

    async testHealthEndpoints() {
        console.log('\\n🏥 Testing Health Endpoints...');
        
        // Test health endpoints
        await this.testEndpoint('/api/health', 'GET');
        await this.testEndpoint('/api/health/google-sheets', 'GET');
    }

    generateReport() {
        console.log('\\n📊 CLIVE API TEST REPORT');
        console.log('=' .repeat(60));
        
        const successCount = this.results.filter(r => r.status >= 200 && r.status < 300).length;
        const totalCount = this.results.length;
        const successRate = Math.round((successCount / totalCount) * 100);
        
        console.log(`📈 Overall Success Rate: ${successCount}/${totalCount} (${successRate}%)`);
        console.log('');
        
        // Categorize results
        const customerValidation = this.results.filter(r => r.path.includes('/api/customer/validate'));
        const extensionValidation = this.results.filter(r => r.path.includes('/api/extension/'));
        const netlifyFunctions = this.results.filter(r => r.path.includes('/.netlify/functions/'));
        const healthChecks = this.results.filter(r => r.path.includes('/api/health'));
        
        console.log('🎯 CRITICAL CUSTOMER VALIDATION:');
        customerValidation.forEach(result => {
            const icon = result.status >= 200 && result.status < 300 ? '✅' : '❌';
            console.log(`   ${icon} ${result.path}: ${result.status}`);
            if (result.body && result.body.error) {
                console.log(`      Error: ${result.body.error}`);
            }
        });
        
        console.log('\\n🔌 EXTENSION ENDPOINTS:');
        extensionValidation.forEach(result => {
            const icon = result.status >= 200 && result.status < 300 ? '✅' : '❌';
            console.log(`   ${icon} ${result.path}: ${result.status}`);
        });
        
        console.log('\\n⚡ NETLIFY FUNCTIONS:');
        netlifyFunctions.forEach(result => {
            const icon = result.status >= 200 && result.status < 300 ? '✅' : '❌';
            console.log(`   ${icon} ${result.path}: ${result.status}`);
        });
        
        console.log('\\n🏥 HEALTH CHECKS:');
        healthChecks.forEach(result => {
            const icon = result.status >= 200 && result.status < 300 ? '✅' : '❌';
            console.log(`   ${icon} ${result.path}: ${result.status}`);
        });
        
        console.log('\\n🎯 DIAGNOSIS:');
        
        const customerValidationWorking = customerValidation.some(r => r.status >= 200 && r.status < 300);
        const netlifyFunctionsWorking = netlifyFunctions.some(r => r.status >= 200 && r.status < 300);
        const healthWorking = healthChecks.some(r => r.status >= 200 && r.status < 300);
        
        if (customerValidationWorking) {
            console.log('   ✅ Customer validation endpoint is working');
            console.log('   🎯 Extension should be able to validate customers');
        } else {
            console.log('   ❌ Customer validation endpoint is failing');
            console.log('   🚨 This explains why extension shows \"Validation failed\"');
        }
        
        if (netlifyFunctionsWorking) {
            console.log('   ✅ Netlify Functions are deployed and working');
        } else {
            console.log('   ❌ Netlify Functions are not working');
            console.log('   🔧 Need to check Netlify deployment');
        }
        
        if (healthWorking) {
            console.log('   ✅ Health checks are working');
        } else {
            console.log('   ❌ Health checks are failing');
            console.log('   🔧 Google Sheets integration may be broken');
        }
        
        console.log('\\n🚀 NEXT STEPS:');
        if (!customerValidationWorking) {
            console.log('   1. 🔧 Deploy Netlify fixes immediately');
            console.log('   2. ⚡ Verify Netlify Functions are deployed');
            console.log('   3. 🔍 Check environment variables in Netlify');
            console.log('   4. 🧪 Test extension after fixes');
        } else {
            console.log('   1. ✅ API endpoints are working');
            console.log('   2. 🧪 Test extension customer validation');
            console.log('   3. 📊 Monitor for any remaining issues');
        }
        
        console.log('\\n📄 Detailed results saved to: clive-api-test-results.json');
        
        // Save detailed results
        const fs = require('fs');
        fs.writeFileSync('clive-api-test-results.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: totalCount,
                successCount,
                successRate,
                customerValidationWorking,
                netlifyFunctionsWorking,
                healthWorking
            },
            results: this.results
        }, null, 2));
    }
}

// Run the test
const tester = new CLIVEAPITester();
tester.runComprehensiveTest().catch(console.error);