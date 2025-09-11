/**
 * FUNCTIONAL TESTING GATES - MANDATORY WORKING DEMONSTRATIONS
 * Simplified version using only Node.js built-ins
 */

const { execSync } = require('child_process');
const http = require('http');

class FunctionalTestingGates {
    constructor() {
        this.baseUrl = 'localhost';
        this.port = 3000;
        this.results = {};
        this.passedTests = 0;
        this.totalTests = 0;
    }

    async makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: this.baseUrl,
                port: this.port,
                path: path,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.data) {
                req.write(options.data);
            }
            req.end();
        });
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
            try {
                const response = await this.makeRequest('/');
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
            } catch (error) {
                return {
                    passed: false,
                    message: `Cannot connect to server: ${error.message}`
                };
            }
        });
    }

    async testSecurityHeaders() {
        return this.runTest('Security Headers Complete', async () => {
            try {
                const response = await this.makeRequest('/');
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
            } catch (error) {
                return {
                    passed: false,
                    message: `Cannot test headers: ${error.message}`
                };
            }
        });
    }

    // FUNCTIONALITY TESTING GATES
    async testHomepageLoad() {
        return this.runTest('Homepage Load Performance', async () => {
            try {
                const startTime = Date.now();
                const response = await this.makeRequest('/');
                const loadTime = Date.now() - startTime;
                
                if (response.status === 200 && loadTime < 5000) {
                    return {
                        passed: true,
                        message: `Homepage loads in ${loadTime}ms with status ${response.status}`
                    };
                }
                
                return {
                    passed: false,
                    message: `Homepage issues: status ${response.status}, load time ${loadTime}ms`
                };
            } catch (error) {
                return {
                    passed: false,
                    message: `Homepage not accessible: ${error.message}`
                };
            }
        });
    }

    async testAPIEndpoints() {
        return this.runTest('Critical API Endpoints', async () => {
            const endpoints = ['/api/health', '/api/guides'];
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await this.makeRequest(endpoint);
                    results.push({
                        endpoint,
                        status: response.status,
                        working: response.status !== 500 && response.status < 400
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
            
            const details = results.map(r => `${r.endpoint}: ${r.status}`).join(', ');
            return {
                passed: false,
                message: `${workingEndpoints.length}/${endpoints.length} endpoints working (${details})`
            };
        });
    }

    async testBuildSystem() {
        return this.runTest('Build System Functionality', async () => {
            try {
                console.log('   Running npm run build (this may take a few minutes)...');
                const output = execSync('npm run build', { 
                    cwd: process.cwd(),
                    timeout: 300000, // 5 minutes
                    encoding: 'utf8'
                });
                
                if (output.includes('Compiled successfully') || 
                    output.includes('Build completed') ||
                    output.includes('✓ Compiled')) {
                    return {
                        passed: true,
                        message: 'Build completed successfully'
                    };
                }
                
                return {
                    passed: false,
                    message: 'Build completed but with potential issues'
                };
            } catch (error) {
                return {
                    passed: false,
                    message: `Build failed: ${error.message.substring(0, 200)}...`
                };
            }
        });
    }

    async testCookieConsent() {
        return this.runTest('Cookie Consent Banner', async () => {
            try {
                const response = await this.makeRequest('/');
                const htmlContent = response.data.toLowerCase();
                
                const hasCookieConsent = htmlContent.includes('cookie') && 
                                       (htmlContent.includes('consent') || 
                                        htmlContent.includes('accept') ||
                                        htmlContent.includes('agree'));
                
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
            } catch (error) {
                return {
                    passed: false,
                    message: `Cannot test cookie consent: ${error.message}`
                };
            }
        });
    }

    // RUN ALL TESTS
    async runAllTests() {
        console.log('🚀 DIRECTORBOLT FUNCTIONAL TESTING GATES');
        console.log('==========================================');
        console.log('Mandatory working demonstrations required for all agents\n');

        // Core functionality tests
        await this.testHomepageLoad();
        await this.testAPIEndpoints();
        
        // Security tests
        await this.testSecurityHeaders(); 
        await this.testCSPHeaders();
        
        // Compliance tests
        await this.testCookieConsent();
        
        // Build system test (most comprehensive)
        await this.testBuildSystem();

        this.generateReport();
        return this.results;
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

        console.log('\n🎯 IMMEDIATE ACTIONS REQUIRED:');
        const blockedAgents = [];
        if (!this.results['CSP Headers Implementation']?.passed) blockedAgents.push('Quinn must implement CSP headers');
        if (!this.results['Critical API Endpoints']?.passed) blockedAgents.push('Shane must fix API 500 errors');
        if (!this.results['Cookie Consent Banner']?.passed) blockedAgents.push('Sam must add cookie consent banner');
        if (!this.results['Build System Functionality']?.passed) blockedAgents.push('Alex must fix build system');

        if (blockedAgents.length > 0) {
            blockedAgents.forEach(action => console.log(`• ${action}`));
        } else {
            console.log('• All agents cleared for deployment!');
        }
    }
}

module.exports = FunctionalTestingGates;

// Run tests if called directly
if (require.main === module) {
    const tester = new FunctionalTestingGates();
    tester.runAllTests().catch(console.error);
}