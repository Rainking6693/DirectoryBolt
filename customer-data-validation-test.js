/**
 * CUSTOMER DATA VALIDATION TEST
 * Specifically tests the real customer ID DIR-202597-recwsFS91NG2O90xi
 * and validates the authentication flow and data accuracy
 */

const { createAirtableService } = require('./lib/services/airtable');

class CustomerDataValidator {
    constructor() {
        this.realCustomerId = 'DIR-202597-recwsFS91NG2O90xi';
        this.expectedCustomerName = 'DirectoryBolt';
        this.expectedDirectoryCount = 100;
        this.results = [];
    }

    log(test, status, message, data = null) {
        const result = {
            timestamp: new Date().toISOString(),
            test,
            status,
            message,
            data
        };
        this.results.push(result);
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${emoji} ${test}: ${message}`);
        if (data) {
            console.log(`   Data:`, JSON.stringify(data, null, 2));
        }
    }

    /**
     * Test 1: Direct Airtable Connection
     */
    async testAirtableConnection() {
        console.log('\n🔍 Testing Direct Airtable Connection...');
        
        try {
            const airtableService = createAirtableService();
            
            // Test health check
            const healthCheck = await airtableService.healthCheck();
            if (healthCheck) {
                this.log('Airtable Health Check', 'PASS', 'Airtable connection successful');
            } else {
                this.log('Airtable Health Check', 'FAIL', 'Airtable connection failed');
                return false;
            }

            return true;
        } catch (error) {
            this.log('Airtable Connection', 'FAIL', `Connection error: ${error.message}`, { error: error.message });
            return false;
        }
    }

    /**
     * Test 2: Real Customer Data Lookup
     */
    async testRealCustomerLookup() {
        console.log('\n🔍 Testing Real Customer Data Lookup...');
        
        try {
            const airtableService = createAirtableService();
            
            // Look up the real customer
            const customer = await airtableService.findByCustomerId(this.realCustomerId);
            
            if (customer) {
                this.log('Customer Lookup', 'PASS', `Customer found: ${this.realCustomerId}`, {
                    customerId: customer.customerId,
                    businessName: customer.businessName,
                    packageType: customer.packageType,
                    submissionStatus: customer.submissionStatus,
                    totalDirectories: customer.totalDirectories
                });

                // Validate customer data
                await this.validateCustomerData(customer);
                return customer;
            } else {
                this.log('Customer Lookup', 'FAIL', `Customer not found: ${this.realCustomerId}`);
                return null;
            }
        } catch (error) {
            this.log('Customer Lookup', 'FAIL', `Lookup error: ${error.message}`, { error: error.message });
            return null;
        }
    }

    /**
     * Test 3: Field Mapping Validation
     */
    async validateCustomerData(customer) {
        console.log('\n🔍 Validating Customer Data Fields...');

        // Check businessName field (not business_name)
        if (customer.businessName !== undefined) {
            this.log('Field Mapping - businessName', 'PASS', `businessName field exists: ${customer.businessName}`);
        } else if (customer.business_name !== undefined) {
            this.log('Field Mapping - businessName', 'FAIL', 'Using old business_name field instead of businessName');
        } else {
            this.log('Field Mapping - businessName', 'FAIL', 'businessName field missing entirely');
        }

        // Check expected customer name
        if (customer.businessName === this.expectedCustomerName) {
            this.log('Customer Name Validation', 'PASS', `Customer name matches expected: ${this.expectedCustomerName}`);
        } else {
            this.log('Customer Name Validation', 'WARN', `Customer name differs from expected. Got: ${customer.businessName}, Expected: ${this.expectedCustomerName}`);
        }

        // Check directory count
        if (customer.totalDirectories === this.expectedDirectoryCount) {
            this.log('Directory Count Validation', 'PASS', `Directory count matches expected: ${this.expectedDirectoryCount}`);
        } else {
            this.log('Directory Count Validation', 'WARN', `Directory count differs. Got: ${customer.totalDirectories}, Expected: ${this.expectedDirectoryCount}`);
        }

        // Check required fields
        const requiredFields = ['customerId', 'businessName', 'packageType', 'submissionStatus'];
        const missingFields = requiredFields.filter(field => !customer[field]);
        
        if (missingFields.length === 0) {
            this.log('Required Fields', 'PASS', 'All required fields present');
        } else {
            this.log('Required Fields', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }

        // Check data types
        this.validateDataTypes(customer);
    }

    /**
     * Test 4: Data Type Validation
     */
    validateDataTypes(customer) {
        console.log('\n🔍 Validating Data Types...');

        const validations = [
            { field: 'customerId', expectedType: 'string', value: customer.customerId },
            { field: 'businessName', expectedType: 'string', value: customer.businessName },
            { field: 'packageType', expectedType: 'string', value: customer.packageType },
            { field: 'submissionStatus', expectedType: 'string', value: customer.submissionStatus },
            { field: 'directoriesSubmitted', expectedType: 'number', value: customer.directoriesSubmitted },
            { field: 'totalDirectories', expectedType: 'number', value: customer.totalDirectories }
        ];

        validations.forEach(({ field, expectedType, value }) => {
            const actualType = typeof value;
            if (value === undefined || value === null) {
                this.log(`Data Type - ${field}`, 'WARN', `Field is ${value}`);
            } else if (actualType === expectedType) {
                this.log(`Data Type - ${field}`, 'PASS', `Correct type: ${expectedType}`);
            } else {
                this.log(`Data Type - ${field}`, 'FAIL', `Wrong type. Expected: ${expectedType}, Got: ${actualType}`);
            }
        });
    }

    /**
     * Test 5: Package Type Validation
     */
    async testPackageTypeValidation(customer) {
        console.log('\n🔍 Testing Package Type Validation...');

        if (!customer) return;

        const validPackageTypes = ['starter', 'growth', 'pro', 'subscription'];
        
        if (validPackageTypes.includes(customer.packageType?.toLowerCase())) {
            this.log('Package Type', 'PASS', `Valid package type: ${customer.packageType}`);
        } else {
            this.log('Package Type', 'FAIL', `Invalid package type: ${customer.packageType}`);
        }

        // Check package type vs directory count consistency
        const expectedDirectories = {
            'starter': 50,
            'growth': 100,
            'pro': 200,
            'subscription': 0
        };

        const expected = expectedDirectories[customer.packageType?.toLowerCase()];
        if (expected !== undefined && customer.totalDirectories === expected) {
            this.log('Package Consistency', 'PASS', `Directory count matches package type`);
        } else {
            this.log('Package Consistency', 'WARN', `Directory count (${customer.totalDirectories}) may not match package type (${customer.packageType}, expected: ${expected})`);
        }
    }

    /**
     * Test 6: Authentication System Integration
     */
    async testAuthenticationIntegration() {
        console.log('\n🔍 Testing Authentication System Integration...');

        // Test if the authentication endpoint exists and responds
        try {
            // We'll simulate what the extension does
            const validationData = {
                customerId: this.realCustomerId,
                extensionVersion: '1.0.0',
                timestamp: Date.now()
            };

            // Since we can't make HTTP requests easily in this context,
            // we'll test the validation logic directly
            const airtableService = createAirtableService();
            const customer = await airtableService.findByCustomerId(this.realCustomerId);

            if (customer) {
                // Check what the validation endpoint would check
                const validStatuses = ['pending', 'in-progress', 'completed'];
                if (validStatuses.includes(customer.submissionStatus)) {
                    this.log('Status Validation', 'PASS', `Customer has valid status: ${customer.submissionStatus}`);
                } else {
                    this.log('Status Validation', 'FAIL', `Customer has invalid status: ${customer.submissionStatus}`);
                }

                if (customer.packageType) {
                    this.log('Package Validation', 'PASS', `Customer has package: ${customer.packageType}`);
                } else {
                    this.log('Package Validation', 'FAIL', `Customer has no package type`);
                }
            }

        } catch (error) {
            this.log('Authentication Integration', 'FAIL', `Integration test failed: ${error.message}`);
        }
    }

    /**
     * Test 7: Environment Configuration Check
     */
    async testEnvironmentConfiguration() {
        console.log('\n🔍 Testing Environment Configuration...');

        // Check if required environment variables are set
        const requiredEnvVars = [
            'AIRTABLE_ACCESS_TOKEN',
            'AIRTABLE_BASE_ID',
            'AIRTABLE_TABLE_NAME'
        ];

        requiredEnvVars.forEach(envVar => {
            const value = process.env[envVar];
            if (value && value !== 'your_airtable_access_token_here') {
                this.log(`Environment - ${envVar}`, 'PASS', 'Environment variable configured');
            } else {
                this.log(`Environment - ${envVar}`, 'FAIL', 'Environment variable missing or using placeholder');
            }
        });

        // Check for potential security issues
        if (process.env.AIRTABLE_ACCESS_TOKEN && process.env.AIRTABLE_ACCESS_TOKEN.startsWith('pat')) {
            this.log('Security - API Token', 'PASS', 'Using personal access token (recommended)');
        } else if (process.env.AIRTABLE_API_KEY) {
            this.log('Security - API Token', 'WARN', 'Using legacy API key (consider upgrading to PAT)');
        } else {
            this.log('Security - API Token', 'FAIL', 'No valid Airtable credentials found');
        }
    }

    /**
     * Generate Final Report
     */
    generateReport() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;

        const report = {
            timestamp: new Date().toISOString(),
            customerId: this.realCustomerId,
            summary: {
                total: this.results.length,
                passed,
                failed,
                warnings
            },
            status: failed > 0 ? 'FAILED' : warnings > 0 ? 'PASSED_WITH_WARNINGS' : 'PASSED',
            results: this.results,
            recommendations: []
        };

        // Add recommendations
        if (failed > 0) {
            report.recommendations.push('CRITICAL: Fix failed validations before proceeding');
        }
        if (warnings > 0) {
            report.recommendations.push('Review warnings to ensure data accuracy');
        }

        return report;
    }

    /**
     * Run All Validation Tests
     */
    async runAllTests() {
        console.log('🚀 Starting Customer Data Validation Tests');
        console.log(`Target Customer ID: ${this.realCustomerId}`);
        console.log('='.repeat(60));

        const airtableConnected = await this.testAirtableConnection();
        if (!airtableConnected) {
            console.log('❌ Cannot proceed without Airtable connection');
            return this.generateReport();
        }

        const customer = await this.testRealCustomerLookup();
        await this.testPackageTypeValidation(customer);
        await this.testAuthenticationIntegration();
        await this.testEnvironmentConfiguration();

        console.log('\n' + '='.repeat(60));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(60));

        const report = this.generateReport();
        
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Warnings: ${report.summary.warnings}`);
        console.log(`Overall Status: ${report.status}`);

        if (report.recommendations.length > 0) {
            console.log('\n📋 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }

        return report;
    }
}

// Export for use as module
module.exports = CustomerDataValidator;

// Run tests if called directly
if (require.main === module) {
    const validator = new CustomerDataValidator();
    validator.runAllTests().then(report => {
        // Save report
        const fs = require('fs');
        const reportPath = `customer-validation-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);
        
        process.exit(report.status === 'FAILED' ? 1 : 0);
    }).catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}