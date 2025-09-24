#!/usr/bin/env node

/**
 * ALEX'S API CONNECTIVITY FIXES - COMPREHENSIVE AUDIT
 * 
 * Hudson's Code Review: Detailed testing of Alex's claimed API fixes
 * - 503 errors resolved
 * - APIs return 200 status
 * - Chrome extension can communicate with backend
 * - Health check endpoint working
 * 
 * Audit Date: 2025-09-24
 * Reviewer: Hudson (Senior Code Review Specialist)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

class APIConnectivityAudit {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.apiKey = '8bcca50677940010e7be19a5922d074cd2217e048f46956f57a5612f39cb2076';
        this.testResults = {
            timestamp: new Date().toISOString(),
            auditor: 'Hudson',
            subject: 'Alex API Connectivity Fixes',
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        this.evidenceCollected = [];
    }

    /**
     * LOG EVIDENCE FOR AUDIT TRAIL
     */
    logEvidence(category, description, data) {
        const evidence = {
            timestamp: new Date().toISOString(),
            category,
            description,
            data
        };
        this.evidenceCollected.push(evidence);
        console.log(`📋 EVIDENCE [${category}]: ${description}`);
    }

    /**
     * MAKE HTTP REQUEST WITH DETAILED LOGGING
     */
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            
            const reqOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-Audit/1.0.0 (Hudson Code Review)',
                    ...options.headers
                },
                timeout: 30000
            };

            const protocol = fullUrl.startsWith('https') ? https : http;
            
            const req = protocol.request(fullUrl, reqOptions, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    // Parse JSON if possible
                    let jsonData = null;
                    try {
                        jsonData = JSON.parse(body);
                    } catch (e) {
                        // Not JSON, that's okay
                    }
                    
                    const result = {
                        url: fullUrl,
                        method: reqOptions.method,
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        body: jsonData || body.substring(0, 1000), // Limit body size
                        responseTime,
                        success: res.statusCode >= 200 && res.statusCode < 400
                    };
                    
                    resolve(result);
                });
            });
            
            req.on('error', (error) => {
                reject({
                    url: fullUrl,
                    method: reqOptions.method,
                    error: error.message,
                    success: false,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject({
                    url: fullUrl,
                    method: reqOptions.method,
                    error: 'Request timeout',
                    success: false,
                    responseTime: Date.now() - startTime
                });
            });
            
            if (options.body) {
                req.write(JSON.stringify(options.body));
            }
            
            req.end();
        });
    }

    /**
     * ADD TEST RESULT
     */
    addTestResult(testName, result, details = {}) {
        const testResult = {
            test: testName,
            result: result, // 'PASS', 'FAIL', 'WARN'
            timestamp: new Date().toISOString(),
            details,
            evidence: this.evidenceCollected.filter(e => e.timestamp >= details.startTime || new Date().toISOString())
        };
        
        this.testResults.tests.push(testResult);
        this.testResults.summary.total++;
        
        if (result === 'PASS') {
            this.testResults.summary.passed++;
            console.log(`✅ ${testName}: PASSED`);
        } else if (result === 'FAIL') {
            this.testResults.summary.failed++;
            console.log(`❌ ${testName}: FAILED`);
        } else if (result === 'WARN') {
            this.testResults.summary.warnings++;
            console.log(`⚠️ ${testName}: WARNING`);
        }
    }

    /**
     * TEST 1: HEALTH ENDPOINT FUNCTIONALITY
     */
    async testHealthEndpoint() {
        console.log('\n🏥 TESTING: Health Endpoint (/api/autobolt/health)');
        const startTime = new Date().toISOString();
        
        try {
            const response = await this.makeRequest('/api/autobolt/health');
            
            this.logEvidence('HTTP_RESPONSE', 'Health endpoint response', {
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                headers: response.headers,
                body: response.body
            });

            // Check Alex's claims
            const claims = {
                returns200Status: response.statusCode === 200,
                noHealthErrors: response.success,
                hasHealthData: response.body && response.body.status,
                respondsQuickly: response.responseTime < 5000,
                hasCorsHeaders: response.headers['access-control-allow-origin'] === '*',
                hasCorrectVersion: response.body && response.body.version === '2.0.1-emergency-fix'
            };

            if (claims.returns200Status && claims.noHealthErrors && claims.hasHealthData) {
                this.addTestResult('Health Endpoint - Basic Functionality', 'PASS', {
                    startTime,
                    claims,
                    response
                });
            } else {
                this.addTestResult('Health Endpoint - Basic Functionality', 'FAIL', {
                    startTime,
                    claims,
                    response,
                    issues: Object.keys(claims).filter(key => !claims[key])
                });
            }

            // Test CORS preflight
            const corsResponse = await this.makeRequest('/api/autobolt/health', {
                method: 'OPTIONS'
            });
            
            this.logEvidence('CORS_TEST', 'Health endpoint CORS preflight', {
                statusCode: corsResponse.statusCode,
                headers: corsResponse.headers
            });

            if (corsResponse.statusCode === 204 && corsResponse.headers['access-control-allow-origin']) {
                this.addTestResult('Health Endpoint - CORS Support', 'PASS', {
                    corsResponse
                });
            } else {
                this.addTestResult('Health Endpoint - CORS Support', 'FAIL', {
                    corsResponse
                });
            }

        } catch (error) {
            this.logEvidence('ERROR', 'Health endpoint test failed', error);
            this.addTestResult('Health Endpoint - Basic Functionality', 'FAIL', {
                startTime,
                error: error.message || error
            });
        }
    }

    /**
     * TEST 2: EXTENSION VALIDATE ENDPOINT
     */
    async testExtensionValidateEndpoint() {
        console.log('\n🔐 TESTING: Extension Validate Endpoint (/api/extension/validate)');
        const startTime = new Date().toISOString();
        
        try {
            // Test with invalid customer ID (should return 404)
            const invalidResponse = await this.makeRequest('/api/extension/validate?customerId=DIR-20240101-123456');
            
            this.logEvidence('VALIDATION_TEST', 'Extension validate with invalid customer', {
                statusCode: invalidResponse.statusCode,
                body: invalidResponse.body
            });

            const validationClaims = {
                returns404ForInvalid: invalidResponse.statusCode === 404,
                hasProperErrorMessage: invalidResponse.body && invalidResponse.body.code === 'NOT_FOUND',
                hasCorsHeaders: invalidResponse.headers['access-control-allow-origin'] === '*'
            };

            if (validationClaims.returns404ForInvalid && validationClaims.hasProperErrorMessage) {
                this.addTestResult('Extension Validate - Error Handling', 'PASS', {
                    startTime,
                    validationClaims,
                    invalidResponse
                });
            } else {
                this.addTestResult('Extension Validate - Error Handling', 'FAIL', {
                    startTime,
                    validationClaims,
                    invalidResponse
                });
            }

            // Test CORS
            const corsResponse = await this.makeRequest('/api/extension/validate', {
                method: 'OPTIONS'
            });
            
            if (corsResponse.statusCode === 204) {
                this.addTestResult('Extension Validate - CORS Support', 'PASS', {
                    corsResponse
                });
            } else {
                this.addTestResult('Extension Validate - CORS Support', 'FAIL', {
                    corsResponse
                });
            }

        } catch (error) {
            this.logEvidence('ERROR', 'Extension validate test failed', error);
            this.addTestResult('Extension Validate - Error Handling', 'FAIL', {
                startTime,
                error: error.message || error
            });
        }
    }

    /**
     * TEST 3: AUTOBOLT TEST SUBMISSIONS
     */
    async testAutoBoltTestSubmissions() {
        console.log('\n🧪 TESTING: AutoBolt Test Submissions (/api/autobolt/test-submissions)');
        const startTime = new Date().toISOString();
        
        try {
            // Test authentication (should fail without API key)
            const unauthResponse = await this.makeRequest('/api/autobolt/test-submissions');
            
            this.logEvidence('AUTH_TEST', 'Test submissions without API key', {
                statusCode: unauthResponse.statusCode,
                body: unauthResponse.body
            });

            // Test with API key (should succeed)
            const authResponse = await this.makeRequest('/api/autobolt/test-submissions', {
                headers: {
                    'x-api-key': this.apiKey
                }
            });
            
            this.logEvidence('AUTH_SUCCESS', 'Test submissions with API key', {
                statusCode: authResponse.statusCode,
                body: authResponse.body,
                responseTime: authResponse.responseTime
            });

            const authClaims = {
                blocksUnauthRequests: unauthResponse.statusCode === 401,
                allowsAuthRequests: authResponse.statusCode === 200,
                hasRateLimit: authResponse.headers['x-ratelimit-limit'] !== undefined,
                returnsJsonData: authResponse.body && typeof authResponse.body === 'object'
            };

            if (authClaims.blocksUnauthRequests && authClaims.allowsAuthRequests) {
                this.addTestResult('AutoBolt Test Submissions - Authentication', 'PASS', {
                    startTime,
                    authClaims,
                    unauthResponse,
                    authResponse
                });
            } else {
                this.addTestResult('AutoBolt Test Submissions - Authentication', 'FAIL', {
                    startTime,
                    authClaims,
                    unauthResponse,
                    authResponse
                });
            }

        } catch (error) {
            this.logEvidence('ERROR', 'AutoBolt test submissions failed', error);
            this.addTestResult('AutoBolt Test Submissions - Authentication', 'FAIL', {
                startTime,
                error: error.message || error
            });
        }
    }

    /**
     * TEST 4: AUTOBOLT JOBS NEXT ENDPOINT
     */
    async testAutoBoltJobsNext() {
        console.log('\n⚡ TESTING: AutoBolt Jobs Next (/api/autobolt/jobs/next)');
        const startTime = new Date().toISOString();
        
        try {
            // Test authentication
            const unauthResponse = await this.makeRequest('/api/autobolt/jobs/next');
            
            // Test with API key
            const authResponse = await this.makeRequest('/api/autobolt/jobs/next', {
                headers: {
                    'x-api-key': this.apiKey
                }
            });
            
            this.logEvidence('JOBS_API', 'Jobs next endpoint test', {
                unauthStatus: unauthResponse.statusCode,
                authStatus: authResponse.statusCode,
                responseTime: authResponse.responseTime,
                body: authResponse.body
            });

            const jobsClaims = {
                requiresAuth: unauthResponse.statusCode === 403,
                returns200WithAuth: authResponse.statusCode === 200,
                hasJobStructure: authResponse.body && typeof authResponse.body.job !== 'undefined',
                respondsQuickly: authResponse.responseTime < 3000
            };

            if (jobsClaims.requiresAuth && jobsClaims.returns200WithAuth) {
                this.addTestResult('AutoBolt Jobs Next - API Functionality', 'PASS', {
                    startTime,
                    jobsClaims,
                    authResponse
                });
            } else {
                this.addTestResult('AutoBolt Jobs Next - API Functionality', 'FAIL', {
                    startTime,
                    jobsClaims,
                    authResponse,
                    unauthResponse
                });
            }

        } catch (error) {
            this.logEvidence('ERROR', 'AutoBolt jobs next test failed', error);
            this.addTestResult('AutoBolt Jobs Next - API Functionality', 'FAIL', {
                startTime,
                error: error.message || error
            });
        }
    }

    /**
     * TEST 5: CHROME EXTENSION CONNECTIVITY SIMULATION
     */
    async testChromeExtensionConnectivity() {
        console.log('\n🌐 TESTING: Chrome Extension Connectivity Simulation');
        const startTime = new Date().toISOString();
        
        try {
            // Simulate extension requests to multiple endpoints
            const extensionTests = [
                {
                    name: 'Health Check',
                    request: () => this.makeRequest('/api/autobolt/health', {
                        headers: {
                            'Origin': 'chrome-extension://test-extension-id',
                            'X-Extension-ID': 'test-extension-id'
                        }
                    })
                },
                {
                    name: 'Customer Validation',
                    request: () => this.makeRequest('/api/extension/validate?customerId=DIR-20240101-123456', {
                        headers: {
                            'Origin': 'chrome-extension://test-extension-id'
                        }
                    })
                },
                {
                    name: 'Authenticated API',
                    request: () => this.makeRequest('/api/autobolt/test-submissions', {
                        headers: {
                            'Origin': 'chrome-extension://test-extension-id',
                            'x-api-key': this.apiKey
                        }
                    })
                }
            ];

            const results = [];
            for (const test of extensionTests) {
                try {
                    const response = await test.request();
                    results.push({
                        test: test.name,
                        success: true,
                        statusCode: response.statusCode,
                        hasCors: response.headers['access-control-allow-origin'] !== undefined,
                        responseTime: response.responseTime
                    });
                } catch (error) {
                    results.push({
                        test: test.name,
                        success: false,
                        error: error.message || error
                    });
                }
            }

            this.logEvidence('EXTENSION_SIMULATION', 'Chrome extension connectivity tests', results);

            const allSuccessful = results.every(r => r.success);
            const allHaveCors = results.filter(r => r.success).every(r => r.hasCors);

            if (allSuccessful && allHaveCors) {
                this.addTestResult('Chrome Extension Connectivity', 'PASS', {
                    startTime,
                    results,
                    summary: 'All simulated extension requests succeeded with CORS'
                });
            } else if (allSuccessful) {
                this.addTestResult('Chrome Extension Connectivity', 'WARN', {
                    startTime,
                    results,
                    issue: 'APIs work but some missing CORS headers'
                });
            } else {
                this.addTestResult('Chrome Extension Connectivity', 'FAIL', {
                    startTime,
                    results,
                    failedTests: results.filter(r => !r.success)
                });
            }

        } catch (error) {
            this.logEvidence('ERROR', 'Extension connectivity simulation failed', error);
            this.addTestResult('Chrome Extension Connectivity', 'FAIL', {
                startTime,
                error: error.message || error
            });
        }
    }

    /**
     * TEST 6: 503 ERROR VERIFICATION
     */
    async test503ErrorResolution() {
        console.log('\n🔍 TESTING: 503 Error Resolution Verification');
        const startTime = new Date().toISOString();
        
        try {
            // Test multiple endpoints to ensure no 503 errors
            const endpoints = [
                '/api/autobolt/health',
                '/api/extension/validate?customerId=TEST-123',
                '/api/autobolt/test-submissions'
            ];

            const results = [];
            for (const endpoint of endpoints) {
                const headers = endpoint.includes('autobolt/test-submissions') 
                    ? { 'x-api-key': this.apiKey }
                    : {};
                
                try {
                    const response = await this.makeRequest(endpoint, { headers });
                    results.push({
                        endpoint,
                        statusCode: response.statusCode,
                        is503: response.statusCode === 503,
                        success: response.success,
                        responseTime: response.responseTime
                    });
                } catch (error) {
                    results.push({
                        endpoint,
                        error: error.message,
                        is503: error.message && error.message.includes('503'),
                        success: false
                    });
                }
            }

            this.logEvidence('503_VERIFICATION', '503 error check across endpoints', results);

            const no503Errors = results.every(r => !r.is503);
            const allResponding = results.every(r => r.statusCode && r.statusCode !== 503);

            if (no503Errors && allResponding) {
                this.addTestResult('503 Error Resolution', 'PASS', {
                    startTime,
                    results,
                    confirmation: 'No 503 errors found across tested endpoints'
                });
            } else {
                this.addTestResult('503 Error Resolution', 'FAIL', {
                    startTime,
                    results,
                    issue: '503 errors still present',
                    endpoints503: results.filter(r => r.is503 || r.statusCode === 503)
                });
            }

        } catch (error) {
            this.logEvidence('ERROR', '503 error verification failed', error);
            this.addTestResult('503 Error Resolution', 'FAIL', {
                startTime,
                error: error.message || error
            });
        }
    }

    /**
     * RUN COMPLETE AUDIT
     */
    async runCompleteAudit() {
        console.log('🔍 STARTING COMPREHENSIVE API CONNECTIVITY AUDIT');
        console.log('📋 Auditor: Hudson (Senior Code Review Specialist)');
        console.log('🎯 Subject: Alex\'s API Connectivity Fixes');
        console.log('📅 Date:', new Date().toLocaleString());
        console.log('=====================================\n');

        const auditStart = Date.now();

        await this.testHealthEndpoint();
        await this.testExtensionValidateEndpoint();
        await this.testAutoBoltTestSubmissions();
        await this.testAutoBoltJobsNext();
        await this.testChromeExtensionConnectivity();
        await this.test503ErrorResolution();

        const auditDuration = Date.now() - auditStart;
        
        // Generate final assessment
        this.generateFinalAssessment(auditDuration);
        
        // Save detailed report
        await this.saveAuditReport();
        
        return this.testResults;
    }

    /**
     * GENERATE FINAL ASSESSMENT
     */
    generateFinalAssessment(auditDuration) {
        console.log('\n🎯 FINAL ASSESSMENT');
        console.log('=====================================');
        
        const { total, passed, failed, warnings } = this.testResults.summary;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
        
        console.log(`📊 Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        console.log(`⏱️ Audit Duration: ${auditDuration}ms`);
        
        // Alex's Claims Verification
        const claimsVerification = {
            '503_errors_resolved': this.testResults.tests.find(t => t.test === '503 Error Resolution')?.result === 'PASS',
            'apis_return_200': this.testResults.tests.filter(t => t.result === 'PASS' && t.details.response?.statusCode === 200).length > 0,
            'chrome_extension_communication': this.testResults.tests.find(t => t.test === 'Chrome Extension Connectivity')?.result === 'PASS',
            'health_check_working': this.testResults.tests.find(t => t.test.includes('Health Endpoint'))?.result === 'PASS'
        };
        
        console.log('\n🔍 ALEX\'S CLAIMS VERIFICATION:');
        Object.entries(claimsVerification).forEach(([claim, verified]) => {
            console.log(`  ${verified ? '✅' : '❌'} ${claim.replace(/_/g, ' ').toUpperCase()}: ${verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
        });
        
        // Overall verdict
        const allClaimsVerified = Object.values(claimsVerification).every(v => v === true);
        const criticalFailures = failed > 0;
        
        let verdict = 'CONDITIONAL_APPROVAL';
        if (allClaimsVerified && !criticalFailures) {
            verdict = 'APPROVED';
        } else if (criticalFailures) {
            verdict = 'REJECTED';
        }
        
        console.log(`\n🏆 OVERALL VERDICT: ${verdict}`);
        
        if (verdict === 'APPROVED') {
            console.log('✅ Alex\'s API connectivity fixes are VERIFIED and APPROVED');
            console.log('📋 Evidence shows 503 errors resolved, APIs returning 200 status');
            console.log('🌐 Chrome extension can successfully communicate with backend');
            console.log('🏥 Health check endpoint is operational');
        } else if (verdict === 'CONDITIONAL_APPROVAL') {
            console.log('⚠️ Alex\'s fixes show improvement but have minor issues');
            console.log('📋 Most functionality works but some areas need attention');
        } else {
            console.log('❌ Alex\'s fixes are NOT SUFFICIENT - critical issues remain');
            console.log('📋 Failed tests indicate ongoing problems with API connectivity');
        }
        
        this.testResults.finalAssessment = {
            verdict,
            passRate,
            claimsVerification,
            auditDuration,
            recommendation: verdict === 'APPROVED' 
                ? 'Approve deployment of Alex\'s API connectivity fixes'
                : verdict === 'CONDITIONAL_APPROVAL'
                ? 'Approve with minor fixes required'
                : 'Reject - significant issues must be addressed'
        };
    }

    /**
     * SAVE AUDIT REPORT
     */
    async saveAuditReport() {
        const reportPath = `C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt\\ALEX_API_CONNECTIVITY_AUDIT_${Date.now()}.json`;
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2), 'utf8');
            console.log(`\n💾 Detailed audit report saved to: ${reportPath}`);
            
            // Also save a summary report
            const summaryPath = `C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt\\ALEX_API_AUDIT_SUMMARY_${Date.now()}.md`;
            const summaryContent = this.generateMarkdownSummary();
            fs.writeFileSync(summaryPath, summaryContent, 'utf8');
            console.log(`📄 Summary report saved to: ${summaryPath}`);
            
        } catch (error) {
            console.error('❌ Failed to save audit report:', error.message);
        }
    }

    /**
     * GENERATE MARKDOWN SUMMARY
     */
    generateMarkdownSummary() {
        const { summary, finalAssessment } = this.testResults;
        
        return `# Alex's API Connectivity Fixes - Audit Report

## Executive Summary

**Auditor:** Hudson (Senior Code Review Specialist)  
**Date:** ${new Date().toLocaleString()}  
**Subject:** Alex's API Connectivity Fixes  
**Verdict:** ${finalAssessment.verdict}  

## Test Results Summary

- **Total Tests:** ${summary.total}
- **Passed:** ${summary.passed} ✅
- **Failed:** ${summary.failed} ❌  
- **Warnings:** ${summary.warnings} ⚠️
- **Pass Rate:** ${finalAssessment.passRate}%

## Claims Verification

${Object.entries(finalAssessment.claimsVerification).map(([claim, verified]) => 
    `- ${verified ? '✅' : '❌'} **${claim.replace(/_/g, ' ').toUpperCase()}:** ${verified ? 'VERIFIED' : 'NOT VERIFIED'}`
).join('\n')}

## Detailed Test Results

${this.testResults.tests.map(test => `
### ${test.test}
- **Result:** ${test.result}
- **Timestamp:** ${test.timestamp}
${test.details.response ? `- **Status Code:** ${test.details.response.statusCode}` : ''}
${test.details.response ? `- **Response Time:** ${test.details.response.responseTime}ms` : ''}
${test.result === 'FAIL' && test.details.error ? `- **Error:** ${test.details.error}` : ''}
`).join('')}

## Recommendation

${finalAssessment.recommendation}

## Evidence Files

This audit collected ${this.evidenceCollected.length} pieces of evidence documenting API responses, error conditions, and performance metrics.

---
*Generated by Hudson's DirectoryBolt Code Review System*
`;
    }
}

// Run the audit
async function main() {
    const audit = new APIConnectivityAudit();
    
    try {
        const results = await audit.runCompleteAudit();
        
        // Exit with appropriate code
        process.exit(results.summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ AUDIT FAILED:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = APIConnectivityAudit;