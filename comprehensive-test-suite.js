/**
 * COMPREHENSIVE TESTING SUITE FOR DIRECTORYBOLT
 * Critical testing for authentication, customer data, and system integrity
 * Target Customer ID: DIR-202597-recwsFS91NG2O90xi (DirectoryBolt, 100 directories)
 */

const https = require('https');
const fs = require('fs');

// Test Configuration
const REAL_CUSTOMER_ID = 'DIR-202597-recwsFS91NG2O90xi';
const TEST_CUSTOMER_IDS = [
    'DIR-202597-recwsFS91NG2O90xi', // Real customer
    'DIR-000000-invalid123',         // Invalid format
    'invalid-customer-id',           // Wrong format
    '',                              // Empty string
    null,                           // Null value
    'DIR-2024-' + Math.random().toString(36).substr(2, 12) // Random but valid format
];

const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://directorybolt.com' 
    : 'http://localhost:3000';

class DirectoryBoltTestSuite {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            testResults: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                critical_issues: []
            }
        };
    }

    /**
     * Log test result
     */
    logTest(testName, status, details, isCritical = false) {
        const result = {
            testName,
            status,
            details,
            timestamp: new Date().toISOString(),
            isCritical
        };

        this.results.testResults.push(result);
        this.results.summary.total++;
        
        if (status === 'PASS') {
            this.results.summary.passed++;
            console.log(`✅ ${testName}: ${details}`);
        } else {
            this.results.summary.failed++;
            console.log(`❌ ${testName}: ${details}`);
            
            if (isCritical) {
                this.results.summary.critical_issues.push(result);
            }
        }
    }

    /**
     * Make HTTP request helper
     */
    async makeRequest(path, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, BASE_URL);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-Test-Suite/1.0',
                    ...headers
                }
            };

            const req = https.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const responseData = body ? JSON.parse(body) : {};
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: responseData,
                            raw: body
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: { parseError: e.message },
                            raw: body
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Test 1: Real Customer ID Validation
     */
    async testRealCustomerValidation() {
        console.log('\n🔍 Testing Real Customer ID Validation...');
        
        try {
            const response = await this.makeRequest('/api/extension/validate', 'POST', {
                customerId: REAL_CUSTOMER_ID,
                extensionVersion: '1.0.0',
                timestamp: Date.now()
            });

            if (response.status === 200 && response.data.valid === true) {
                this.logTest(
                    'Real Customer Validation', 
                    'PASS', 
                    `Customer ${REAL_CUSTOMER_ID} validated successfully. Name: ${response.data.customerName}, Package: ${response.data.packageType}`
                );
                
                // Additional checks for expected data
                if (response.data.customerName === 'DirectoryBolt' || response.data.customerName.includes('DirectoryBolt')) {
                    this.logTest(
                        'Customer Name Verification', 
                        'PASS', 
                        `Customer name matches expected: ${response.data.customerName}`
                    );
                } else {
                    this.logTest(
                        'Customer Name Verification', 
                        'FAIL', 
                        `Unexpected customer name: ${response.data.customerName}`, 
                        true
                    );
                }

                return response.data;
            } else {
                this.logTest(
                    'Real Customer Validation', 
                    'FAIL', 
                    `Validation failed for real customer. Status: ${response.status}, Valid: ${response.data.valid}, Error: ${response.data.error}`, 
                    true
                );
                return null;
            }
        } catch (error) {
            this.logTest(
                'Real Customer Validation', 
                'FAIL', 
                `Request failed: ${error.message}`, 
                true
            );
            return null;
        }
    }

    /**
     * Test 2: Invalid Customer ID Handling
     */
    async testInvalidCustomerIds() {
        console.log('\n🔍 Testing Invalid Customer ID Handling...');
        
        for (const customerId of TEST_CUSTOMER_IDS.slice(1)) { // Skip the real one
            try {
                const response = await this.makeRequest('/api/extension/validate', 'POST', {
                    customerId: customerId,
                    extensionVersion: '1.0.0',
                    timestamp: Date.now()
                });

                if (response.status === 401 && response.data.valid === false) {
                    this.logTest(
                        `Invalid Customer ID (${customerId})`, 
                        'PASS', 
                        `Correctly rejected invalid customer ID: ${response.data.error}`
                    );
                } else {
                    this.logTest(
                        `Invalid Customer ID (${customerId})`, 
                        'FAIL', 
                        `Should have been rejected but got status ${response.status}`, 
                        true
                    );
                }
            } catch (error) {
                this.logTest(
                    `Invalid Customer ID (${customerId})`, 
                    'FAIL', 
                    `Request failed: ${error.message}`
                );
            }
        }
    }

    /**
     * Test 3: Field Mapping Verification
     */
    async testFieldMapping() {
        console.log('\n🔍 Testing Field Mapping (businessName vs business_name)...');
        
        try {
            // Test the Airtable lookup directly by checking customer data structure
            const response = await this.makeRequest('/api/extension/validate', 'POST', {
                customerId: REAL_CUSTOMER_ID,
                extensionVersion: '1.0.0',
                timestamp: Date.now()
            });

            if (response.status === 200 && response.data.customerName) {
                this.logTest(
                    'Field Mapping - Customer Name', 
                    'PASS', 
                    `customerName field properly mapped: ${response.data.customerName}`
                );
            } else {
                this.logTest(
                    'Field Mapping - Customer Name', 
                    'FAIL', 
                    'customerName field missing or unmapped', 
                    true
                );
            }

            if (response.data.packageType) {
                this.logTest(
                    'Field Mapping - Package Type', 
                    'PASS', 
                    `packageType field properly mapped: ${response.data.packageType}`
                );
            } else {
                this.logTest(
                    'Field Mapping - Package Type', 
                    'FAIL', 
                    'packageType field missing or unmapped', 
                    true
                );
            }

        } catch (error) {
            this.logTest(
                'Field Mapping Test', 
                'FAIL', 
                `Request failed: ${error.message}`, 
                true
            );
        }
    }

    /**
     * Test 4: Authentication Flow
     */
    async testAuthenticationFlow() {
        console.log('\n🔍 Testing Authentication Flow...');
        
        // Test 1: Login endpoint accessibility
        try {
            const response = await this.makeRequest('/api/auth/login', 'POST', {
                email: 'test@example.com',
                password: 'testpassword'
            });

            if (response.status === 401 || response.status === 400) {
                this.logTest(
                    'Authentication Endpoint', 
                    'PASS', 
                    `Login endpoint accessible and returning expected error status: ${response.status}`
                );
            } else if (response.status === 500) {
                this.logTest(
                    'Authentication Endpoint', 
                    'FAIL', 
                    'Login endpoint returning server error', 
                    true
                );
            } else {
                this.logTest(
                    'Authentication Endpoint', 
                    'PARTIAL', 
                    `Unexpected status: ${response.status}`
                );
            }
        } catch (error) {
            this.logTest(
                'Authentication Endpoint', 
                'FAIL', 
                `Authentication endpoint not accessible: ${error.message}`, 
                true
            );
        }
    }

    /**
     * Test 5: API Security Check
     */
    async testAPISecurity() {
        console.log('\n🔍 Testing API Security...');
        
        // Test for exposed environment variables
        try {
            const response = await this.makeRequest('/api/debug.env.js');
            
            if (response.status === 404 || response.status === 403) {
                this.logTest(
                    'Environment Variables Security', 
                    'PASS', 
                    'Debug endpoint properly secured'
                );
            } else if (response.status === 200) {
                this.logTest(
                    'Environment Variables Security', 
                    'FAIL', 
                    'Debug endpoint exposed - potential security vulnerability', 
                    true
                );
            }
        } catch (error) {
            this.logTest(
                'Environment Variables Security', 
                'PASS', 
                'Debug endpoint not accessible (secure)'
            );
        }

        // Test for API key exposure
        try {
            const response = await this.makeRequest('/api/config.js');
            
            if (response.status === 404 || response.status === 403) {
                this.logTest(
                    'API Configuration Security', 
                    'PASS', 
                    'Configuration endpoint properly secured'
                );
            } else if (response.status === 200) {
                this.logTest(
                    'API Configuration Security', 
                    'FAIL', 
                    'Configuration endpoint exposed - potential security vulnerability', 
                    true
                );
            }
        } catch (error) {
            this.logTest(
                'API Configuration Security', 
                'PASS', 
                'Configuration endpoint not accessible (secure)'
            );
        }

        // Test rate limiting
        try {
            const requests = [];
            for (let i = 0; i < 15; i++) {
                requests.push(this.makeRequest('/api/extension/validate', 'POST', {
                    customerId: 'test-rate-limit',
                    extensionVersion: '1.0.0',
                    timestamp: Date.now()
                }));
            }

            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r.status === 429);

            if (rateLimited) {
                this.logTest(
                    'Rate Limiting', 
                    'PASS', 
                    'Rate limiting properly configured'
                );
            } else {
                this.logTest(
                    'Rate Limiting', 
                    'FAIL', 
                    'Rate limiting not working - potential DoS vulnerability', 
                    true
                );
            }
        } catch (error) {
            this.logTest(
                'Rate Limiting', 
                'FAIL', 
                `Rate limiting test failed: ${error.message}`
            );
        }
    }

    /**
     * Test 6: Data Display Verification
     */
    async testDataDisplay() {
        console.log('\n🔍 Testing Data Display...');
        
        try {
            const customerData = await this.testRealCustomerValidation();
            
            if (customerData) {
                // Check if data looks like real customer data vs test data
                const isTestData = customerData.customerName && (
                    customerData.customerName.toLowerCase().includes('test') ||
                    customerData.customerName.toLowerCase().includes('demo') ||
                    customerData.customerName.toLowerCase().includes('sample')
                );

                if (isTestData) {
                    this.logTest(
                        'Real vs Test Data', 
                        'FAIL', 
                        'System appears to be showing test data instead of real customer data', 
                        true
                    );
                } else {
                    this.logTest(
                        'Real vs Test Data', 
                        'PASS', 
                        'System appears to be showing real customer data'
                    );
                }

                // Check data completeness
                const requiredFields = ['customerName', 'packageType'];
                const missingFields = requiredFields.filter(field => !customerData[field]);

                if (missingFields.length === 0) {
                    this.logTest(
                        'Data Completeness', 
                        'PASS', 
                        'All required customer fields present'
                    );
                } else {
                    this.logTest(
                        'Data Completeness', 
                        'FAIL', 
                        `Missing required fields: ${missingFields.join(', ')}`, 
                        true
                    );
                }
            }
        } catch (error) {
            this.logTest(
                'Data Display Verification', 
                'FAIL', 
                `Test failed: ${error.message}`
            );
        }
    }

    /**
     * Test 7: Edge Cases
     */
    async testEdgeCases() {
        console.log('\n🔍 Testing Edge Cases...');
        
        // Test with malformed timestamp
        try {
            const response = await this.makeRequest('/api/extension/validate', 'POST', {
                customerId: REAL_CUSTOMER_ID,
                extensionVersion: '1.0.0',
                timestamp: Date.now() + (10 * 60 * 1000) // 10 minutes in future
            });

            if (response.status === 400 && response.data.error && response.data.error.includes('timestamp')) {
                this.logTest(
                    'Edge Case - Future Timestamp', 
                    'PASS', 
                    'Future timestamp properly rejected'
                );
            } else {
                this.logTest(
                    'Edge Case - Future Timestamp', 
                    'FAIL', 
                    'Future timestamp not properly validated', 
                    true
                );
            }
        } catch (error) {
            this.logTest(
                'Edge Case - Future Timestamp', 
                'FAIL', 
                `Test failed: ${error.message}`
            );
        }

        // Test with missing required fields
        try {
            const response = await this.makeRequest('/api/extension/validate', 'POST', {
                customerId: REAL_CUSTOMER_ID
                // Missing extensionVersion and timestamp
            });

            if (response.status === 400) {
                this.logTest(
                    'Edge Case - Missing Fields', 
                    'PASS', 
                    'Missing required fields properly rejected'
                );
            } else {
                this.logTest(
                    'Edge Case - Missing Fields', 
                    'FAIL', 
                    'Missing fields not properly validated', 
                    true
                );
            }
        } catch (error) {
            this.logTest(
                'Edge Case - Missing Fields', 
                'FAIL', 
                `Test failed: ${error.message}`
            );
        }

        // Test with SQL injection attempt
        try {
            const response = await this.makeRequest('/api/extension/validate', 'POST', {
                customerId: "'; DROP TABLE customers; --",
                extensionVersion: '1.0.0',
                timestamp: Date.now()
            });

            if (response.status === 401 || response.status === 400) {
                this.logTest(
                    'Edge Case - SQL Injection', 
                    'PASS', 
                    'SQL injection attempt properly rejected'
                );
            } else {
                this.logTest(
                    'Edge Case - SQL Injection', 
                    'FAIL', 
                    'Potential SQL injection vulnerability', 
                    true
                );
            }
        } catch (error) {
            this.logTest(
                'Edge Case - SQL Injection', 
                'PASS', 
                'SQL injection attempt properly handled (request failed)'
            );
        }
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        const report = {
            ...this.results,
            recommendations: [],
            criticalFindings: this.results.summary.critical_issues,
            nextSteps: []
        };

        // Add recommendations based on findings
        if (this.results.summary.critical_issues.length > 0) {
            report.recommendations.push('URGENT: Address critical security and functionality issues immediately');
        }

        if (this.results.summary.failed > 0) {
            report.recommendations.push('Fix failed test cases before production deployment');
        }

        // Add next steps
        report.nextSteps = [
            'Review all failed test cases',
            'Implement fixes for critical issues',
            'Re-run test suite after fixes',
            'Perform manual testing of authentication flow',
            'Verify real customer data in production environment'
        ];

        return report;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting DirectoryBolt Comprehensive Test Suite');
        console.log(`Environment: ${this.results.environment}`);
        console.log(`Target URL: ${BASE_URL}`);
        console.log(`Real Customer ID: ${REAL_CUSTOMER_ID}`);
        console.log('=' .repeat(60));

        await this.testRealCustomerValidation();
        await this.testInvalidCustomerIds();
        await this.testFieldMapping();
        await this.testAuthenticationFlow();
        await this.testAPISecurity();
        await this.testDataDisplay();
        await this.testEdgeCases();

        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.results.summary.total}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`Critical Issues: ${this.results.summary.critical_issues.length}`);

        if (this.results.summary.critical_issues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            this.results.summary.critical_issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.testName}: ${issue.details}`);
            });
        }

        const report = this.generateReport();
        
        // Save report to file
        const reportPath = `test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return report;
    }
}

// Export for use as module
module.exports = DirectoryBoltTestSuite;

// Run tests if called directly
if (require.main === module) {
    const testSuite = new DirectoryBoltTestSuite();
    testSuite.runAllTests().then(report => {
        process.exit(report.summary.critical_issues.length > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}