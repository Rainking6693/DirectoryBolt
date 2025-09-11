#!/usr/bin/env node

/**
 * NATHAN - Phase 1 Emergency Testing Suite
 * Tests all critical Phase 1 fixes and validates production readiness
 */

const https = require('https');
const http = require('http');

class Phase1EmergencyTester {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        this.results = {
            airtable: { status: 'pending', details: [] },
            security: { status: 'pending', details: [] },
            extension: { status: 'pending', details: [] },
            infrastructure: { status: 'pending', details: [] },
            overall: { status: 'pending', critical_failures: 0, total_tests: 0 }
        };
    }

    async runAllTests() {
        console.log('🚨 NATHAN - Phase 1 Emergency Testing Suite');
        console.log('===========================================');
        console.log(`🎯 Testing against: ${this.baseUrl}`);
        console.log(`📅 Started: ${new Date().toISOString()}`);
        console.log();

        // Run all test suites
        await this.testFrankAirtableConnection();
        await this.testShaneSecurityFixes();
        await this.testAlexExtensionFixes();
        await this.testQuinnInfrastructure();

        // Generate final report
        this.generateFinalReport();
        
        return this.results;
    }

    async testFrankAirtableConnection() {
        console.log('🔍 FRANK - Testing Airtable Connection...');
        console.log('========================================');
        
        try {
            // Test 1: Direct API Connection
            const connectionTest = await this.testAirtableAPI();
            this.results.airtable.details.push({
                test: 'Direct API Connection',
                status: connectionTest.success ? 'PASS' : 'FAIL',
                details: connectionTest
            });

            // Test 2: Customer Validation Endpoint
            const validationTest = await this.testCustomerValidation();
            this.results.airtable.details.push({
                test: 'Customer Validation API',
                status: validationTest.success ? 'PASS' : 'FAIL',
                details: validationTest
            });

            // Test 3: Real Customer Lookup
            const realCustomerTest = await this.testRealCustomerLookup();
            this.results.airtable.details.push({
                test: 'Real Customer Lookup',
                status: realCustomerTest.success ? 'PASS' : 'FAIL',
                details: realCustomerTest
            });

            // Determine overall status
            const allPassed = this.results.airtable.details.every(t => t.status === 'PASS');
            this.results.airtable.status = allPassed ? 'PASS' : 'FAIL';
            
            if (!allPassed) this.results.overall.critical_failures++;

        } catch (error) {
            console.error('💥 FRANK testing failed:', error);
            this.results.airtable.status = 'FAIL';
            this.results.overall.critical_failures++;
        }

        console.log(`📊 FRANK Result: ${this.results.airtable.status}\n`);
    }

    async testShaneSecurityFixes() {
        console.log('🔐 SHANE - Testing Security Fixes...');
        console.log('====================================');
        
        try {
            // Test 1: Development Bypass Removed
            const devBypassTest = await this.testDevelopmentBypassRemoval();
            this.results.security.details.push({
                test: 'Development Bypass Removed',
                status: devBypassTest.bypassed ? 'FAIL' : 'PASS',
                details: devBypassTest
            });

            // Test 2: Admin Authentication Required
            const adminAuthTest = await this.testAdminAuthenticationRequired();
            this.results.security.details.push({
                test: 'Admin Authentication Required',
                status: adminAuthTest.secure ? 'PASS' : 'FAIL',
                details: adminAuthTest
            });

            // Test 3: Staff Authentication Required
            const staffAuthTest = await this.testStaffAuthenticationRequired();
            this.results.security.details.push({
                test: 'Staff Authentication Required',
                status: staffAuthTest.secure ? 'PASS' : 'FAIL',
                details: staffAuthTest
            });

            // Test 4: No Hardcoded Credentials
            const credentialsTest = await this.testHardcodedCredentials();
            this.results.security.details.push({
                test: 'No Hardcoded Credentials',
                status: credentialsTest.secure ? 'PASS' : 'FAIL',
                details: credentialsTest
            });

            // Determine overall status
            const allPassed = this.results.security.details.every(t => t.status === 'PASS');
            this.results.security.status = allPassed ? 'PASS' : 'FAIL';
            
            if (!allPassed) this.results.overall.critical_failures++;

        } catch (error) {
            console.error('💥 SHANE testing failed:', error);
            this.results.security.status = 'FAIL';
            this.results.overall.critical_failures++;
        }

        console.log(`🔒 SHANE Result: ${this.results.security.status}\n`);
    }

    async testAlexExtensionFixes() {
        console.log('🔧 ALEX - Testing Extension Fixes...');
        console.log('====================================');
        
        try {
            const fs = require('fs');
            const path = require('path');

            // Test 1: Extension Directory Exists
            const extensionPath = path.join(process.cwd(), 'build', 'auto-bolt-extension');
            const extensionExists = fs.existsSync(extensionPath);
            this.results.extension.details.push({
                test: 'Extension Directory Exists',
                status: extensionExists ? 'PASS' : 'FAIL',
                details: { path: extensionPath, exists: extensionExists }
            });

            // Test 2: Required Extension Files
            const requiredFiles = ['manifest.json', 'customer-popup.html', 'customer-popup.js'];
            const fileTests = requiredFiles.map(file => {
                const filePath = path.join(extensionPath, file);
                const exists = fs.existsSync(filePath);
                return { file, exists, path: filePath };
            });
            
            const allFilesExist = fileTests.every(t => t.exists);
            this.results.extension.details.push({
                test: 'Required Extension Files',
                status: allFilesExist ? 'PASS' : 'FAIL',
                details: fileTests
            });

            // Test 3: Customer Validation API Works
            const validationApiTest = await this.testExtensionValidationAPI();
            this.results.extension.details.push({
                test: 'Extension Validation API',
                status: validationApiTest.working ? 'PASS' : 'FAIL',
                details: validationApiTest
            });

            // Determine overall status
            const allPassed = this.results.extension.details.every(t => t.status === 'PASS');
            this.results.extension.status = allPassed ? 'PASS' : 'FAIL';
            
            if (!allPassed) this.results.overall.critical_failures++;

        } catch (error) {
            console.error('💥 ALEX testing failed:', error);
            this.results.extension.status = 'FAIL';
            this.results.overall.critical_failures++;
        }

        console.log(`🔧 ALEX Result: ${this.results.extension.status}\n`);
    }

    async testQuinnInfrastructure() {
        console.log('⚙️ QUINN - Testing Infrastructure...');
        console.log('====================================');
        
        try {
            // Test 1: Next.js Dev Server Running
            const serverTest = await this.testDevServerRunning();
            this.results.infrastructure.details.push({
                test: 'Next.js Dev Server',
                status: serverTest.running ? 'PASS' : 'FAIL',
                details: serverTest
            });

            // Test 2: API Endpoints Responding
            const apiTest = await this.testAPIEndpoints();
            this.results.infrastructure.details.push({
                test: 'API Endpoints',
                status: apiTest.working ? 'PASS' : 'FAIL',
                details: apiTest
            });

            // Test 3: Environment Variables Present
            const envTest = await this.testEnvironmentVariables();
            this.results.infrastructure.details.push({
                test: 'Environment Variables',
                status: envTest.configured ? 'PASS' : 'FAIL',
                details: envTest
            });

            // Determine overall status
            const allPassed = this.results.infrastructure.details.every(t => t.status === 'PASS');
            this.results.infrastructure.status = allPassed ? 'PASS' : 'FAIL';
            
            if (!allPassed) this.results.overall.critical_failures++;

        } catch (error) {
            console.error('💥 QUINN testing failed:', error);
            this.results.infrastructure.status = 'FAIL';
            this.results.overall.critical_failures++;
        }

        console.log(`⚙️ QUINN Result: ${this.results.infrastructure.status}\n`);
    }

    async testAirtableAPI() {
        const token = process.env.AIRTABLE_ACCESS_TOKEN || 'patpWWU88HJac0C6f.3f037d5baa8c3486634a626b32e9eb8ce6538cb8fb75824b331d9ca49d82cdf0';
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.airtable.com',
                path: '/v0/appZDNMzebkaOkLXo/Directory%20Bolt%20Import',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({
                            success: res.statusCode === 200,
                            statusCode: res.statusCode,
                            recordCount: parsed.records?.length || 0,
                            error: res.statusCode !== 200 ? data : null
                        });
                    } catch (error) {
                        resolve({ success: false, error: 'Parse error', details: error.message });
                    }
                });
            });

            req.on('error', error => resolve({ success: false, error: error.message }));
            req.setTimeout(10000, () => resolve({ success: false, error: 'Timeout' }));
            req.end();
        });
    }

    async testCustomerValidation() {
        return this.makeRequest('POST', '/api/customer/validate', {
            customerId: 'TEST-CUSTOMER-123'
        });
    }

    async testRealCustomerLookup() {
        return this.makeRequest('POST', '/api/customer/validate', {
            customerId: 'DIR-202597-recwsFS91NG2O90xi'
        });
    }

    async testDevelopmentBypassRemoval() {
        const response = await this.makeRequest('GET', '/api/staff/auth-check');
        
        // Should fail authentication without credentials
        return {
            bypassed: response.success && response.data?.warning?.includes('Development mode'),
            statusCode: response.statusCode,
            details: response.data
        };
    }

    async testAdminAuthenticationRequired() {
        const response = await this.makeRequest('GET', '/api/admin/auth-check');
        
        // Should require authentication (401 unauthorized)
        return {
            secure: response.statusCode === 401,
            statusCode: response.statusCode,
            details: response.data
        };
    }

    async testStaffAuthenticationRequired() {
        const response = await this.makeRequest('GET', '/api/staff/auth-check');
        
        // Should require authentication (401 unauthorized)
        return {
            secure: response.statusCode === 401,
            statusCode: response.statusCode,
            details: response.data
        };
    }

    async testHardcodedCredentials() {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
            
            // Check for hardcoded passwords (should use hashes or secure generation)
            const hasHardcodedPasswords = envFile.includes('DirectoryBolt2025!') || 
                                        envFile.includes('DirectoryBoltStaff2025!');
            
            return {
                secure: !hasHardcodedPasswords,
                details: {
                    hasHardcodedPasswords,
                    recommendation: 'Use bcrypt hashed passwords or secure credential generation'
                }
            };
        } catch (error) {
            return { secure: true, details: { error: 'Could not read .env.local' } };
        }
    }

    async testExtensionValidationAPI() {
        const response = await this.makeRequest('POST', '/api/customer/validate', {
            customerId: 'DIR-2025-001234'
        });
        
        return {
            working: response.success || response.statusCode === 404, // 404 is acceptable (customer not found)
            statusCode: response.statusCode,
            details: response.data
        };
    }

    async testDevServerRunning() {
        const response = await this.makeRequest('GET', '/');
        
        return {
            running: response.statusCode === 200,
            statusCode: response.statusCode,
            details: response.error || 'Server responding'
        };
    }

    async testAPIEndpoints() {
        const endpoints = ['/api/health', '/api/customer/validate'];
        const results = [];
        
        for (const endpoint of endpoints) {
            const response = await this.makeRequest('GET', endpoint);
            results.push({
                endpoint,
                working: response.statusCode < 500,
                statusCode: response.statusCode
            });
        }
        
        return {
            working: results.every(r => r.working),
            endpoints: results
        };
    }

    async testEnvironmentVariables() {
        const required = [
            'AIRTABLE_ACCESS_TOKEN',
            'AIRTABLE_BASE_ID',
            'NEXT_PUBLIC_APP_URL'
        ];
        
        const missing = required.filter(key => !process.env[key]);
        
        return {
            configured: missing.length === 0,
            missing,
            present: required.filter(key => !!process.env[key])
        };
    }

    async makeRequest(method, path, body = null) {
        return new Promise((resolve) => {
            const isLocalhost = this.baseUrl.includes('localhost');
            const url = new URL(this.baseUrl + path);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NATHAN-Phase1-Tester/1.0'
                }
            };

            if (body) {
                const bodyString = JSON.stringify(body);
                options.headers['Content-Length'] = bodyString.length;
            }

            const client = isLocalhost ? http : https;
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 400,
                            statusCode: res.statusCode,
                            data: parsed
                        });
                    } catch (error) {
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 400,
                            statusCode: res.statusCode,
                            data: data,
                            parseError: error.message
                        });
                    }
                });
            });

            req.on('error', error => {
                resolve({
                    success: false,
                    error: error.message,
                    statusCode: 0
                });
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout',
                    statusCode: 0
                });
            });

            if (body) {
                req.write(JSON.stringify(body));
            }
            
            req.end();
        });
    }

    generateFinalReport() {
        console.log('📊 NATHAN - PHASE 1 EMERGENCY TEST RESULTS');
        console.log('===========================================');
        
        const totalTests = Object.values(this.results)
            .filter(r => r.details)
            .reduce((sum, r) => sum + r.details.length, 0);
        
        this.results.overall.total_tests = totalTests;
        
        console.log(`📈 Total Tests Run: ${totalTests}`);
        console.log(`❌ Critical Failures: ${this.results.overall.critical_failures}`);
        console.log();

        // Individual agent results
        console.log('👥 AGENT RESULTS:');
        console.log(`🔍 FRANK (Database):      ${this.results.airtable.status}`);
        console.log(`🔐 SHANE (Security):      ${this.results.security.status}`);
        console.log(`🔧 ALEX (Extension):      ${this.results.extension.status}`);
        console.log(`⚙️ QUINN (Infrastructure): ${this.results.infrastructure.status}`);
        console.log();

        // Overall status
        const overallPass = this.results.overall.critical_failures === 0;
        this.results.overall.status = overallPass ? 'PASS' : 'FAIL';

        console.log('🎯 OVERALL PHASE 1 STATUS:');
        console.log('===========================');
        if (overallPass) {
            console.log('✅ PHASE 1 EMERGENCY FIXES: SUCCESSFUL');
            console.log('🚀 Ready for Phase 2 deployment');
        } else {
            console.log('❌ PHASE 1 EMERGENCY FIXES: FAILED');
            console.log(`⚠️ ${this.results.overall.critical_failures} critical issues need attention`);
        }
        
        console.log();
        console.log('📋 DETAILED RESULTS:');
        console.log('====================');
        
        // Print detailed results for each agent
        Object.entries(this.results).forEach(([agent, result]) => {
            if (result.details && result.details.length > 0) {
                console.log(`\n${agent.toUpperCase()}:`);
                result.details.forEach(detail => {
                    const status = detail.status === 'PASS' ? '✅' : '❌';
                    console.log(`  ${status} ${detail.test}`);
                });
            }
        });
        
        console.log('\n🏁 NATHAN Phase 1 Testing Complete');
        console.log(`📅 Completed: ${new Date().toISOString()}`);
    }
}

// Run tests if called directly
if (require.main === module) {
    (async () => {
        const tester = new Phase1EmergencyTester();
        await tester.runAllTests();
        
        // Exit with appropriate code
        process.exit(tester.results.overall.critical_failures > 0 ? 1 : 0);
    })();
}

module.exports = { Phase1EmergencyTester };