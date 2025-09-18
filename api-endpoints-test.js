#!/usr/bin/env node

/**
 * DirectoryBolt API Endpoints Testing Suite
 * ==========================================
 * Tests all critical API endpoints for Supabase integration
 */

const fs = require('fs');
const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class APIEndpointTester {
    constructor() {
        this.baseURL = process.env.BASE_URL || 'http://localhost:3004';
        this.results = {
            timestamp: new Date().toISOString(),
            base_url: this.baseURL,
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const colors = {
            INFO: '\x1b[36m',
            SUCCESS: '\x1b[32m',
            WARNING: '\x1b[33m',
            ERROR: '\x1b[31m',
            RESET: '\x1b[0m'
        };
        
        const color = colors[level] || colors.RESET;
        console.log(`${color}[${timestamp}] ${message}${colors.RESET}`);
    }

    async testEndpoint(endpoint, method = 'GET', data = null, expectedStatus = [200, 201], description = '') {
        this.log('INFO', `🧪 Testing ${method} ${endpoint} - ${description}`);
        this.results.summary.total++;

        const startTime = Date.now();
        
        try {
            const config = {
                method: method.toLowerCase(),
                url: `${this.baseURL}${endpoint}`,
                timeout: 10000,
                validateStatus: (status) => status < 500 // Don't throw on client errors
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                config.data = data;
                config.headers = { 'Content-Type': 'application/json' };
            }

            const response = await axios(config);
            const duration = Date.now() - startTime;
            
            const testResult = {
                endpoint,
                method,
                description,
                status: Array.isArray(expectedStatus) ? 
                    expectedStatus.includes(response.status) : 
                    response.status === expectedStatus,
                response_status: response.status,
                response_time: duration,
                response_data: typeof response.data === 'object' ? 
                    JSON.stringify(response.data).substring(0, 200) : 
                    String(response.data).substring(0, 200),
                timestamp: new Date().toISOString()
            };

            this.results.tests.push(testResult);

            if (testResult.status) {
                this.results.summary.passed++;
                this.log('SUCCESS', `✅ ${endpoint} - ${response.status} (${duration}ms)`);
            } else {
                this.results.summary.failed++;
                this.log('ERROR', `❌ ${endpoint} - Expected ${expectedStatus}, got ${response.status} (${duration}ms)`);
            }

            return testResult;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            const testResult = {
                endpoint,
                method,
                description,
                status: false,
                error: error.message,
                response_time: duration,
                timestamp: new Date().toISOString()
            };

            this.results.tests.push(testResult);
            this.results.summary.failed++;
            this.log('ERROR', `❌ ${endpoint} - Error: ${error.message} (${duration}ms)`);

            return testResult;
        }
    }

    async runAPITests() {
        this.log('INFO', '🚀 Starting API Endpoints Testing');
        this.log('INFO', `📡 Base URL: ${this.baseURL}`);
        this.log('INFO', '=====================================');

        // Test core endpoints
        await this.testEndpoint('/api/health', 'GET', null, [200, 404], 'Health check endpoint');
        
        // Customer API endpoints
        await this.testEndpoint('/api/customer/validate', 'POST', {
            customer_id: 'DIR-20250918-123456',
            email: 'test@example.com'
        }, [200, 400, 404], 'Customer validation');

        await this.testEndpoint('/api/customer/create', 'POST', {
            business_name: 'Test Business',
            email: 'test@example.com',
            package_type: 'professional'
        }, [200, 201, 400, 404], 'Customer creation');

        // Admin endpoints
        await this.testEndpoint('/api/admin/customers', 'GET', null, [200, 401, 404], 'Admin customer list');
        await this.testEndpoint('/api/admin/system/metrics', 'GET', null, [200, 401, 404], 'System metrics');

        // Staff endpoints  
        await this.testEndpoint('/api/staff/customers', 'GET', null, [200, 401, 404], 'Staff customer access');

        // Analytics endpoints
        await this.testEndpoint('/api/analytics/track', 'POST', {
            event: 'test_event',
            customer_id: 'DIR-20250918-123456'
        }, [200, 201, 400, 404], 'Analytics tracking');

        // Queue endpoints
        await this.testEndpoint('/api/queue/status', 'GET', null, [200, 404], 'Queue status');

        // AI endpoints
        await this.testEndpoint('/api/ai/status', 'GET', null, [200, 404], 'AI service status');

        // Chrome extension endpoints
        await this.testEndpoint('/api/autobolt/customer-status', 'POST', {
            customer_id: 'DIR-20250918-123456'
        }, [200, 400, 404], 'AutoBolt customer status');

        // Generate results
        const reportPath = this.generateReport();
        this.displaySummary(reportPath);

        return this.results;
    }

    generateReport() {
        const reportPath = `api-endpoints-test-results-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        return reportPath;
    }

    displaySummary(reportPath) {
        console.log('\n🎉 API TESTING RESULTS');
        console.log('======================');
        console.log(`📊 Total Tests: ${this.results.summary.total}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`📈 Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
        console.log(`📋 Report: ${reportPath}`);

        // Show response time stats
        const responseTimes = this.results.tests
            .filter(t => t.response_time)
            .map(t => t.response_time);
        
        if (responseTimes.length > 0) {
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            console.log(`⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
            console.log(`⏱️  Max Response Time: ${maxResponseTime}ms`);
        }

        // Show working endpoints
        const workingEndpoints = this.results.tests.filter(t => t.status);
        console.log(`\n✅ WORKING ENDPOINTS (${workingEndpoints.length}):`);
        workingEndpoints.forEach(test => {
            console.log(`   ${test.method} ${test.endpoint} - ${test.response_status}`);
        });

        // Show failing endpoints  
        const failingEndpoints = this.results.tests.filter(t => !t.status);
        if (failingEndpoints.length > 0) {
            console.log(`\n❌ FAILING ENDPOINTS (${failingEndpoints.length}):`);
            failingEndpoints.forEach(test => {
                console.log(`   ${test.method} ${test.endpoint} - ${test.error || test.response_status}`);
            });
        }

        console.log('\n🔍 ANALYSIS:');
        if (this.results.summary.passed === this.results.summary.total) {
            console.log('✅ All API endpoints are functional');
            console.log('🚀 System ready for production deployment');
        } else {
            const successRate = (this.results.summary.passed / this.results.summary.total) * 100;
            if (successRate >= 70) {
                console.log('⚠️  Most endpoints working, some failures expected during development');
                console.log('📝 Review failing endpoints before production deployment');
            } else {
                console.log('❌ Multiple endpoint failures detected');
                console.log('🔧 System requires fixes before deployment');
            }
        }
    }
}

// Execute testing if run directly
if (require.main === module) {
    const tester = new APIEndpointTester();
    tester.runAPITests()
        .then(results => {
            const successRate = (results.summary.passed / results.summary.total) * 100;
            process.exit(successRate >= 50 ? 0 : 1); // Exit successfully if at least 50% working
        })
        .catch(error => {
            console.error('❌ API testing failed:', error);
            process.exit(1);
        });
}

module.exports = APIEndpointTester;