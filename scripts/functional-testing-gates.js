/**
 * FUNCTIONAL TESTING GATES - MANDATORY WORKING DEMONSTRATIONS
 * No agent can claim completion without passing these tests
 */

const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

class FunctionalTestingGates {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = {};
        this.passedTests = 0;
        this.totalTests = 0;
    }

    async runTest(testName, testFunction) {
        this.totalTests++;
        console.log(`\n🧪 Running: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.passed) {
                this.passedTests++;
                console.log(`✅ PASSED: ${testName}`);
                console.log(`   ${result.message}`);
            } else {
                console.log(`❌ FAILED: ${testName}`);
                console.log(`   ${result.message}`);
            }
            this.results[testName] = result;
        } catch (error) {
            console.log(`❌ ERROR: ${testName}`);
            console.log(`   ${error.message}`);
            this.results[testName] = { passed: false, message: error.message };
        }
    }

    // SECURITY TESTING GATES
    async testCSPHeaders() {
        return this.runTest('CSP Headers Implementation', async () => {
            const response = await axios.get(this.baseUrl, { 
                validateStatus: () => true,
                timeout: 10000 
            });
            
            const cspHeader = response.headers['content-security-policy'];
            if (cspHeader) {
                return {
                    passed: true,
                    message: `CSP header found: ${cspHeader.substring(0, 100)}...`
                };
            }
            
            return {
                passed: false,
                message: 'Content-Security-Policy header missing'
            };
        });
    }

    async testAuthEndpoint() {
        return this.runTest('Authentication Endpoint Security', async () => {
            try {
                const response = await axios.get(`${this.baseUrl}/api/admin/auth-check`, { 
                    validateStatus: () => true,
                    timeout: 10000 
                });
                
                if (response.status === 401) {
                    return {
                        passed: true,
                        message: 'Auth endpoint properly returns 401 without credentials'
                    };
                }
                
                return {
                    passed: false,
                    message: `Auth endpoint returned ${response.status} instead of 401`
                };
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    return {
                        passed: false,
                        message: 'Cannot connect to server - application not running properly'
                    };
                }
                throw error;
            }
        });
    }

    async testSecurityHeaders() {
        return this.runTest('Security Headers Complete', async () => {
            const response = await axios.get(this.baseUrl, { 
                validateStatus: () => true,
                timeout: 10000 
            });
            
            const requiredHeaders = [
                'strict-transport-security',
                'x-frame-options',
                'x-content-type-options',
                'referrer-policy'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => 
                !response.headers[header]
            );
            
            if (missingHeaders.length === 0) {
                return {
                    passed: true,
                    message: 'All required security headers present'
                };
            }
            
            return {
                passed: false,
                message: `Missing headers: ${missingHeaders.join(', ')}`
            };
        });
    }

    // COMPLIANCE TESTING GATES
    async testGDPREndpoint() {
        return this.runTest('GDPR Compliance Implementation', async () => {
            try {
                const response = await axios.post(`${this.baseUrl}/api/gdpr/deletion-request`, {
                    email: 'test@example.com'
                }, { 
                    validateStatus: () => true,
                    timeout: 10000 
                });
                
                if (response.status === 200 || response.status === 202) {
                    return {
                        passed: true,
                        message: `GDPR endpoint operational (${response.status})`
                    };
                }
                
                return {
                    passed: false,
                    message: `GDPR endpoint returned ${response.status}`
                };
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    return {
                        passed: false,
                        message: 'GDPR deletion endpoint not implemented'
                    };
                }
                throw error;
            }
        });
    }

    async testCookieConsent() {
        return this.runTest('Cookie Consent Banner', async () => {
            const response = await axios.get(this.baseUrl, { 
                validateStatus: () => true,
                timeout: 10000 
            });
            
            const htmlContent = response.data;
            const hasCookieConsent = htmlContent.includes('cookie') && 
                                   (htmlContent.includes('consent') || htmlContent.includes('accept'));
            
            if (hasCookieConsent) {
                return {
                    passed: true,
                    message: 'Cookie consent elements detected in homepage'
                };
            }
            
            return {
                passed: false,
                message: 'No cookie consent banner found in homepage'
            };
        });
    }

    async testPrivacyPolicy() {
        return this.runTest('Privacy Policy Accessibility', async () => {
            const response = await axios.get(`${this.baseUrl}/privacy`, { 
                validateStatus: () => true,
                timeout: 10000 
            });
            
            if (response.status === 200) {
                return {
                    passed: true,
                    message: 'Privacy policy accessible'
                };
            }
            
            return {
                passed: false,
                message: `Privacy policy returns ${response.status} (expected 200)`
            };
        });
    }

    // FUNCTIONALITY TESTING GATES
    async testAPIEndpoints() {
        return this.runTest('Critical API Endpoints', async () => {
            const endpoints = [
                '/api/health',
                '/api/admin/system/metrics',
                '/api/guides'
            ];
            
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${this.baseUrl}${endpoint}`, { 
                        validateStatus: () => true,
                        timeout: 10000 
                    });
                    
                    results.push({
                        endpoint,
                        status: response.status,
                        working: response.status !== 500
                    });
                } catch (error) {
                    results.push({
                        endpoint,
                        status: 'ERROR',
                        working: false,
                        error: error.message
                    });
                }
            }
            
            const workingEndpoints = results.filter(r => r.working);
            
            if (workingEndpoints.length === endpoints.length) {
                return {
                    passed: true,
                    message: `All ${endpoints.length} critical endpoints working`
                };
            }
            
            return {
                passed: false,
                message: `${workingEndpoints.length}/${endpoints.length} endpoints working`
            };
        });
    }

    async testBuildSystem() {
        return this.runTest('Build System Functionality', async () => {
            try {
                const output = execSync('npm run build', { 
                    cwd: process.cwd(),
                    timeout: 120000,
                    encoding: 'utf8'
                });
                
                if (output.includes('Compiled successfully') || output.includes('Build completed')) {
                    return {
                        passed: true,
                        message: 'Build completed successfully'
                    };
                }
                
                return {
                    passed: false,
                    message: 'Build completed but with warnings/errors'
                };
            } catch (error) {
                return {
                    passed: false,
                    message: `Build failed: ${error.message}`
                };
            }
        });
    }

    async testDashboardAccess() {
        return this.runTest('Admin Dashboard Access', async () => {
            const response = await axios.get(`${this.baseUrl}/admin`, { 
                validateStatus: () => true,
                timeout: 10000 
            });
            
            if (response.status === 200 || response.status === 401 || response.status === 403) {
                return {
                    passed: true,
                    message: `Dashboard accessible (${response.status} - auth required)`
                };
            }
            
            if (response.status === 500) {
                return {
                    passed: false,
                    message: 'Dashboard returns 500 server error'
                };
            }
            
            return {
                passed: false,
                message: `Dashboard returns unexpected status: ${response.status}`
            };
        });
    }

    // UX TESTING GATES
    async testHomepageLoad() {
        return this.runTest('Homepage Load Performance', async () => {
            const startTime = Date.now();
            const response = await axios.get(this.baseUrl, { 
                validateStatus: () => true,
                timeout: 10000 
            });
            const loadTime = Date.now() - startTime;
            
            if (response.status === 200 && loadTime < 5000) {
                return {
                    passed: true,
                    message: `Homepage loads in ${loadTime}ms`
                };
            }
            
            return {
                passed: false,
                message: `Homepage issues: status ${response.status}, load time ${loadTime}ms`
            };
        });
    }

    async testMobileResponsiveness() {
        return this.runTest('Mobile Responsiveness', async () => {
            const response = await axios.get(this.baseUrl, { 
                validateStatus: () => true,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                }
            });
            
            const htmlContent = response.data;
            const hasViewportMeta = htmlContent.includes('viewport');
            const hasResponsiveElements = htmlContent.includes('responsive') || 
                                        htmlContent.includes('mobile') ||
                                        htmlContent.includes('sm:') ||
                                        htmlContent.includes('md:');
            
            if (response.status === 200 && hasViewportMeta && hasResponsiveElements) {
                return {
                    passed: true,
                    message: 'Mobile responsiveness indicators present'
                };
            }
            
            return {
                passed: false,
                message: 'Mobile responsiveness issues detected'
            };
        });
    }

    // RUN ALL TESTS
    async runAllTests() {
        console.log('🚀 DIRECTORBOLT FUNCTIONAL TESTING GATES');
        console.log('==========================================');
        console.log('Mandatory working demonstrations required for all agents\n');

        // Security Gates
        await this.testCSPHeaders();
        await this.testAuthEndpoint();
        await this.testSecurityHeaders();

        // Compliance Gates
        await this.testGDPREndpoint();
        await this.testCookieConsent();
        await this.testPrivacyPolicy();

        // Functionality Gates
        await this.testAPIEndpoints();
        await this.testBuildSystem();
        await this.testDashboardAccess();

        // UX Gates
        await this.testHomepageLoad();
        await this.testMobileResponsiveness();

        this.generateReport();
    }

    generateReport() {
        console.log('\n📊 FUNCTIONAL TESTING RESULTS');
        console.log('==============================');
        console.log(`Tests Passed: ${this.passedTests}/${this.totalTests}`);
        console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
        
        if (this.passedTests === this.totalTests) {
            console.log('\n🎉 ALL TESTS PASSED - AGENTS CAN PROCEED');
        } else {
            console.log('\n⚠️  TESTS FAILED - AGENTS MUST FIX ISSUES BEFORE PROCEEDING');
            console.log('\nFailed Tests:');
            Object.entries(this.results).forEach(([test, result]) => {
                if (!result.passed) {
                    console.log(`❌ ${test}: ${result.message}`);
                }
            });
        }

        console.log('\n📋 AGENT DEPLOYMENT STATUS:');
        console.log('- Quinn (CSP Headers): ' + (this.results['CSP Headers Implementation']?.passed ? '✅ DEPLOY' : '❌ BLOCKED'));
        console.log('- Shane (API Endpoints): ' + (this.results['Critical API Endpoints']?.passed ? '✅ DEPLOY' : '❌ BLOCKED'));
        console.log('- Sam (Cookie Consent): ' + (this.results['Cookie Consent Banner']?.passed ? '✅ DEPLOY' : '❌ BLOCKED'));
        console.log('- Alex (Build System): ' + (this.results['Build System Functionality']?.passed ? '✅ DEPLOY' : '❌ BLOCKED'));
    }
}

module.exports = FunctionalTestingGates;

// Run tests if called directly
if (require.main === module) {
    const tester = new FunctionalTestingGates();
    tester.runAllTests().catch(console.error);
}