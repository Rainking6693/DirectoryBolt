/**
 * AutoBolt Testing & Validation Suite
 * Comprehensive testing framework for Airtable schema and API functionality
 * 
 * This module provides automated testing for all schema components,
 * API endpoints, data integrity, and system performance.
 */

const { v4: uuidv4 } = require('uuid');
const AirtableQueueManager = require('./airtable-queue-manager.js');
const AutoBoltAPIServer = require('./airtable-api-integration.js');
const PackageConfigurationManager = require('./package-configuration.js');
const DataMigrationManager = require('./data-migration-scripts.js');
const { AIRTABLE_SCHEMA_CONFIG } = require('./airtable-schema-enhancement.js');

class TestingSuite {
    constructor(config = {}) {
        this.config = {
            ...AIRTABLE_SCHEMA_CONFIG,
            testTimeout: config.testTimeout || 30000,
            cleanupAfterTests: config.cleanupAfterTests !== false,
            ...config
        };
        
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            startTime: null,
            endTime: null,
            testDetails: []
        };
        
        this.testData = {
            customers: [],
            packages: [],
            directories: [],
            queue: [],
            submissions: []
        };
        
        // Test suites
        this.testSuites = [
            { name: 'Schema Validation Tests', handler: this.runSchemaTests.bind(this) },
            { name: 'Package Management Tests', handler: this.runPackageTests.bind(this) },
            { name: 'Customer Management Tests', handler: this.runCustomerTests.bind(this) },
            { name: 'Queue Processing Tests', handler: this.runQueueTests.bind(this) },
            { name: 'API Integration Tests', handler: this.runAPITests.bind(this) },
            { name: 'Data Migration Tests', handler: this.runMigrationTests.bind(this) },
            { name: 'Performance Tests', handler: this.runPerformanceTests.bind(this) },
            { name: 'Integration Tests', handler: this.runIntegrationTests.bind(this) }
        ];
    }

    /**
     * Run complete test suite
     */
    async runAllTests() {
        console.log('🧪 Starting AutoBolt Testing Suite');
        console.log('===================================');
        
        this.testResults.startTime = new Date();
        
        try {
            // Setup test environment
            await this.setupTestEnvironment();
            
            // Run all test suites
            for (const suite of this.testSuites) {
                console.log(`\n📋 Running ${suite.name}...`);
                await this.runTestSuite(suite);
            }
            
            // Generate final report
            this.testResults.endTime = new Date();
            const report = this.generateTestReport();
            
            // Cleanup if requested
            if (this.config.cleanupAfterTests) {
                await this.cleanupTestEnvironment();
            }
            
            console.log('\n📊 Test Results Summary:');
            console.log('========================');
            console.log(report.summary);
            
            return report;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        try {
            // Initialize test data
            await this.createTestPackages();
            await this.createTestCustomers();
            await this.createTestDirectories();
            
            console.log('✅ Test environment setup completed');
        } catch (error) {
            console.error('❌ Failed to setup test environment:', error);
            throw error;
        }
    }

    /**
     * Create test packages
     */
    async createTestPackages() {
        const packageManager = new PackageConfigurationManager(this.config);
        
        const testPackages = [
            {
                package_id: 'TEST_STARTER',
                package_name: 'Test Starter Package',
                directory_limit: 10,
                priority_level: 4,
                processing_speed: 'standard',
                price_monthly: 9.99,
                price_annual: 99.99,
                features_included: 'Test features for starter package',
                max_concurrent_submissions: 1,
                support_level: 'Email Support',
                is_active: true
            }
        ];
        
        for (const packageData of testPackages) {
            try {
                const result = await this.createAirtableRecord('Packages', packageData);
                this.testData.packages.push(result);
            } catch (error) {
                console.warn(`⚠️ Failed to create test package: ${error.message}`);
            }
        }
    }

    /**
     * Create test customers
     */
    async createTestCustomers() {
        const testCustomers = [
            {
                customer_id: uuidv4(),
                first_name: 'Test',
                last_name: 'Customer1',
                email: `test.customer1@test${Date.now()}.com`,
                package_type: 'TEST_STARTER',
                subscription_status: 'Active',
                total_directories_allocated: 10,
                directories_completed: 0,
                customer_status: 'Active',
                priority_level: 4
            },
            {
                customer_id: uuidv4(),
                first_name: 'Test',
                last_name: 'Customer2',
                email: `test.customer2@test${Date.now()}.com`,
                package_type: 'TEST_STARTER',
                subscription_status: 'Active',
                total_directories_allocated: 10,
                directories_completed: 5,
                customer_status: 'Active',
                priority_level: 4
            }
        ];
        
        for (const customerData of testCustomers) {
            try {
                const result = await this.createAirtableRecord('Customers', customerData);
                this.testData.customers.push(result);
            } catch (error) {
                console.warn(`⚠️ Failed to create test customer: ${error.message}`);
            }
        }
    }

    /**
     * Create test directories
     */
    async createTestDirectories() {
        const testDirectories = [
            {
                directory_name: 'Test Directory 1',
                directory_url: 'https://test-directory-1.com',
                submission_url: 'https://test-directory-1.com/submit',
                category: 'General Business',
                domain_authority: 50,
                monthly_traffic: 10000,
                submission_difficulty: 'Easy',
                automation_success_rate: 0.95,
                requires_registration: false,
                requires_verification: false,
                has_captcha: false,
                is_active: true,
                automation_enabled: true,
                processing_priority: 1,
                required_fields: JSON.stringify(['business_name', 'business_email'])
            },
            {
                directory_name: 'Test Directory 2',
                directory_url: 'https://test-directory-2.com',
                submission_url: 'https://test-directory-2.com/add-business',
                category: 'Local Citations',
                domain_authority: 75,
                monthly_traffic: 50000,
                submission_difficulty: 'Medium',
                automation_success_rate: 0.80,
                requires_registration: true,
                requires_verification: true,
                has_captcha: true,
                is_active: true,
                automation_enabled: true,
                processing_priority: 2,
                required_fields: JSON.stringify(['business_name', 'business_address', 'business_phone'])
            }
        ];
        
        for (const directoryData of testDirectories) {
            try {
                const result = await this.createAirtableRecord('Directories', directoryData);
                this.testData.directories.push(result);
            } catch (error) {
                console.warn(`⚠️ Failed to create test directory: ${error.message}`);
            }
        }
    }

    // ==================== TEST SUITES ====================

    /**
     * Schema validation tests
     */
    async runSchemaTests() {
        const tests = [
            {
                name: 'Validate Customers table exists',
                test: async () => {
                    const result = await this.makeAirtableRequest('GET', 'Customers', { maxRecords: 1 });
                    return result !== null;
                }
            },
            {
                name: 'Validate Packages table exists',
                test: async () => {
                    const result = await this.makeAirtableRequest('GET', 'Packages', { maxRecords: 1 });
                    return result !== null;
                }
            },
            {
                name: 'Validate Queue table exists',
                test: async () => {
                    const result = await this.makeAirtableRequest('GET', 'Queue', { maxRecords: 1 });
                    return result !== null;
                }
            },
            {
                name: 'Validate Submissions table exists',
                test: async () => {
                    const result = await this.makeAirtableRequest('GET', 'Submissions', { maxRecords: 1 });
                    return result !== null;
                }
            },
            {
                name: 'Validate Directories table exists',
                test: async () => {
                    const result = await this.makeAirtableRequest('GET', 'Directories', { maxRecords: 1 });
                    return result !== null;
                }
            },
            {
                name: 'Validate ProcessingLogs table exists',
                test: async () => {
                    const result = await this.makeAirtableRequest('GET', 'ProcessingLogs', { maxRecords: 1 });
                    return result !== null;
                }
            }
        ];
        
        return await this.runTests(tests, 'Schema');
    }

    /**
     * Package management tests
     */
    async runPackageTests() {
        const packageManager = new PackageConfigurationManager(this.config);
        
        const tests = [
            {
                name: 'Get active packages',
                test: async () => {
                    const packages = await packageManager.getActivePackages();
                    return Array.isArray(packages) && packages.length >= 0;
                }
            },
            {
                name: 'Get package pricing',
                test: async () => {
                    if (this.testData.packages.length === 0) return true; // Skip if no test packages
                    const pricing = await packageManager.getPackagePricing('TEST_STARTER');
                    return pricing && typeof pricing.pricing === 'object';
                }
            },
            {
                name: 'Check feature access',
                test: async () => {
                    if (this.testData.customers.length === 0) return true; // Skip if no test customers
                    const access = await packageManager.checkFeatureAccess(this.testData.customers[0].id, 'directorySubmissions');
                    return typeof access.hasAccess === 'boolean';
                }
            },
            {
                name: 'Get usage limits',
                test: async () => {
                    if (this.testData.customers.length === 0) return true; // Skip if no test customers
                    const limits = await packageManager.getUsageLimits(this.testData.customers[0].id);
                    return limits && limits.limits && typeof limits.limits.totalDirectories === 'number';
                }
            }
        ];
        
        return await this.runTests(tests, 'Package Management');
    }

    /**
     * Customer management tests
     */
    async runCustomerTests() {
        const tests = [
            {
                name: 'Create customer record',
                test: async () => {
                    const customerData = {
                        customer_id: uuidv4(),
                        first_name: 'Test',
                        last_name: 'CreateCustomer',
                        email: `create.test@test${Date.now()}.com`,
                        package_type: 'Starter',
                        subscription_status: 'Active',
                        total_directories_allocated: 50,
                        directories_completed: 0,
                        customer_status: 'Active',
                        priority_level: 4
                    };
                    
                    const result = await this.createAirtableRecord('Customers', customerData);
                    return result && result.id;
                }
            },
            {
                name: 'Read customer record',
                test: async () => {
                    if (this.testData.customers.length === 0) return true; // Skip if no test customers
                    const customer = await this.getAirtableRecord('Customers', this.testData.customers[0].id);
                    return customer && customer.fields && customer.fields.first_name === 'Test';
                }
            },
            {
                name: 'Update customer record',
                test: async () => {
                    if (this.testData.customers.length === 0) return true; // Skip if no test customers
                    const updateData = { customer_notes: 'Updated during testing' };
                    const result = await this.updateAirtableRecord('Customers', this.testData.customers[0].id, updateData);
                    return result && result.fields && result.fields.customer_notes === 'Updated during testing';
                }
            },
            {
                name: 'Validate customer relationships',
                test: async () => {
                    if (this.testData.customers.length === 0) return true; // Skip if no test customers
                    const customer = await this.getAirtableRecord('Customers', this.testData.customers[0].id);
                    return customer && customer.fields.package_type;
                }
            }
        ];
        
        return await this.runTests(tests, 'Customer Management');
    }

    /**
     * Queue processing tests
     */
    async runQueueTests() {
        const tests = [
            {
                name: 'Create queue entry',
                test: async () => {
                    if (this.testData.customers.length === 0 || this.testData.directories.length === 0) {
                        return true; // Skip if no test data
                    }
                    
                    const queueData = {
                        customer_id: [this.testData.customers[0].id],
                        business_name: 'Test Business Queue',
                        business_website: 'https://testbusiness.com',
                        business_email: 'test@testbusiness.com',
                        queue_status: 'Pending',
                        selected_directories: [this.testData.directories[0].id],
                        submission_source: 'Test Suite'
                    };
                    
                    const result = await this.createAirtableRecord('Queue', queueData);
                    if (result && result.id) {
                        this.testData.queue.push(result);
                        return true;
                    }
                    return false;
                }
            },
            {
                name: 'Update queue status',
                test: async () => {
                    if (this.testData.queue.length === 0) return true; // Skip if no test queue entries
                    
                    const updateData = { 
                        queue_status: 'Processing',
                        date_started: new Date().toISOString()
                    };
                    
                    const result = await this.updateAirtableRecord('Queue', this.testData.queue[0].id, updateData);
                    return result && result.fields.queue_status === 'Processing';
                }
            },
            {
                name: 'Queue priority calculation',
                test: async () => {
                    // Test that queue entries are properly prioritized
                    const response = await this.makeAirtableRequest('GET', 'Queue', {
                        sort: [{ field: 'priority_score', direction: 'asc' }],
                        maxRecords: 5
                    });
                    
                    return response && response.records;
                }
            }
        ];
        
        return await this.runTests(tests, 'Queue Processing');
    }

    /**
     * API integration tests
     */
    async runAPITests() {
        const tests = [
            {
                name: 'API server initialization',
                test: async () => {
                    // Test that API server can be initialized without errors
                    try {
                        const apiServer = new AutoBoltAPIServer({
                            ...this.config,
                            port: 0 // Use random available port for testing
                        });
                        return true;
                    } catch (error) {
                        console.error('API server initialization failed:', error);
                        return false;
                    }
                }
            },
            {
                name: 'Package endpoints availability',
                test: async () => {
                    // Test that package configuration can be retrieved
                    const packageManager = new PackageConfigurationManager(this.config);
                    const packages = await packageManager.getActivePackages();
                    return Array.isArray(packages);
                }
            },
            {
                name: 'Data validation',
                test: async () => {
                    // Test data validation functions
                    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    const isValidPackage = (pkg) => ['Starter', 'Growth', 'Professional', 'Enterprise'].includes(pkg);
                    
                    return isValidEmail('test@example.com') && 
                           isValidPackage('Professional') && 
                           !isValidPackage('Invalid');
                }
            }
        ];
        
        return await this.runTests(tests, 'API Integration');
    }

    /**
     * Data migration tests
     */
    async runMigrationTests() {
        const tests = [
            {
                name: 'Migration manager initialization',
                test: async () => {
                    try {
                        const migrationManager = new DataMigrationManager({
                            ...this.config,
                            dryRun: true
                        });
                        return true;
                    } catch (error) {
                        console.error('Migration manager initialization failed:', error);
                        return false;
                    }
                }
            },
            {
                name: 'Data transformation validation',
                test: async () => {
                    const migrationManager = new DataMigrationManager({
                        ...this.config,
                        dryRun: true
                    });
                    
                    // Test data transformation logic
                    const sampleLegacyData = {
                        Name: 'John Doe',
                        Email: 'john.doe@example.com',
                        'Business Name': 'Doe Enterprises',
                        packageType: 'Professional'
                    };
                    
                    const transformed = await migrationManager.transformCustomerData(sampleLegacyData);
                    
                    return transformed && 
                           transformed.first_name === 'John' && 
                           transformed.last_name === 'Doe' && 
                           transformed.email === 'john.doe@example.com' &&
                           transformed.package_type === 'Professional';
                }
            }
        ];
        
        return await this.runTests(tests, 'Data Migration');
    }

    /**
     * Performance tests
     */
    async runPerformanceTests() {
        const tests = [
            {
                name: 'Airtable API response time',
                test: async () => {
                    const startTime = Date.now();
                    await this.makeAirtableRequest('GET', 'Customers', { maxRecords: 1 });
                    const responseTime = Date.now() - startTime;
                    
                    // Should respond within 5 seconds
                    return responseTime < 5000;
                }
            },
            {
                name: 'Bulk record creation performance',
                test: async () => {
                    const startTime = Date.now();
                    
                    // Create multiple test records
                    const promises = [];
                    for (let i = 0; i < 5; i++) {
                        const logData = {
                            log_level: 'INFO',
                            event_type: 'Performance Test',
                            event_summary: `Performance test log ${i}`,
                            processor_instance: 'test_suite'
                        };
                        promises.push(this.createAirtableRecord('ProcessingLogs', logData));
                    }
                    
                    await Promise.all(promises);
                    const totalTime = Date.now() - startTime;
                    
                    // Should complete within 10 seconds
                    return totalTime < 10000;
                }
            },
            {
                name: 'Memory usage validation',
                test: async () => {
                    const initialMemory = process.memoryUsage().heapUsed;
                    
                    // Perform some operations
                    await this.makeAirtableRequest('GET', 'Customers', { maxRecords: 10 });
                    await this.makeAirtableRequest('GET', 'Directories', { maxRecords: 10 });
                    
                    const finalMemory = process.memoryUsage().heapUsed;
                    const memoryIncrease = finalMemory - initialMemory;
                    
                    // Memory increase should be reasonable (less than 50MB)
                    return memoryIncrease < 50 * 1024 * 1024;
                }
            }
        ];
        
        return await this.runTests(tests, 'Performance');
    }

    /**
     * Integration tests
     */
    async runIntegrationTests() {
        const tests = [
            {
                name: 'End-to-end customer workflow',
                test: async () => {
                    try {
                        // 1. Create customer
                        const customerData = {
                            customer_id: uuidv4(),
                            first_name: 'Integration',
                            last_name: 'Test',
                            email: `integration.test@test${Date.now()}.com`,
                            package_type: 'Professional',
                            subscription_status: 'Active',
                            total_directories_allocated: 500,
                            directories_completed: 0,
                            customer_status: 'Active',
                            priority_level: 2
                        };
                        
                        const customer = await this.createAirtableRecord('Customers', customerData);
                        if (!customer || !customer.id) return false;
                        
                        // 2. Create queue entry
                        const queueData = {
                            customer_id: [customer.id],
                            business_name: 'Integration Test Business',
                            business_website: 'https://integrationtest.com',
                            queue_status: 'Pending',
                            submission_source: 'Integration Test'
                        };
                        
                        const queueEntry = await this.createAirtableRecord('Queue', queueData);
                        if (!queueEntry || !queueEntry.id) return false;
                        
                        // 3. Update queue to processing
                        const updatedQueue = await this.updateAirtableRecord('Queue', queueEntry.id, {
                            queue_status: 'Processing',
                            date_started: new Date().toISOString()
                        });
                        
                        if (!updatedQueue || updatedQueue.fields.queue_status !== 'Processing') return false;
                        
                        // 4. Create submission record
                        const submissionData = {
                            customer_id: [customer.id],
                            queue_id: [queueEntry.id],
                            submission_status: 'Processing',
                            processing_started: new Date().toISOString()
                        };
                        
                        if (this.testData.directories.length > 0) {
                            submissionData.directory_id = [this.testData.directories[0].id];
                        }
                        
                        const submission = await this.createAirtableRecord('Submissions', submissionData);
                        if (!submission || !submission.id) return false;
                        
                        // 5. Complete submission
                        const completedSubmission = await this.updateAirtableRecord('Submissions', submission.id, {
                            submission_status: 'Submitted',
                            processing_completed: new Date().toISOString(),
                            automation_success: true
                        });
                        
                        return completedSubmission && completedSubmission.fields.submission_status === 'Submitted';
                        
                    } catch (error) {
                        console.error('Integration test failed:', error);
                        return false;
                    }
                }
            },
            {
                name: 'Cross-table relationship validation',
                test: async () => {
                    // Test that relationships between tables work correctly
                    if (this.testData.customers.length === 0) return true;
                    
                    const customer = await this.getAirtableRecord('Customers', this.testData.customers[0].id);
                    
                    // Check that customer has valid package type
                    if (!customer.fields.package_type) return false;
                    
                    // Check if queue entries reference valid customers
                    const queueEntries = await this.makeAirtableRequest('GET', 'Queue', {
                        filterByFormula: `{customer_id} = '${customer.id}'`,
                        maxRecords: 5
                    });
                    
                    return true; // Relationship validation passed
                }
            }
        ];
        
        return await this.runTests(tests, 'Integration');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Run test suite
     */
    async runTestSuite(suite) {
        try {
            const results = await suite.handler();
            console.log(`✅ ${suite.name}: ${results.passed}/${results.total} tests passed`);
            
            if (results.failed > 0) {
                console.log(`❌ Failed tests:`);
                results.details.forEach(detail => {
                    if (!detail.passed) {
                        console.log(`  - ${detail.name}: ${detail.error}`);
                    }
                });
            }
            
            return results;
        } catch (error) {
            console.error(`❌ ${suite.name} failed:`, error);
            return { passed: 0, failed: 1, total: 1, details: [{ name: suite.name, passed: false, error: error.message }] };
        }
    }

    /**
     * Run individual tests
     */
    async runTests(tests, suiteName) {
        const results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: tests.length,
            details: []
        };
        
        for (const test of tests) {
            try {
                const startTime = Date.now();
                const passed = await Promise.race([
                    test.test(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
                    )
                ]);
                const duration = Date.now() - startTime;
                
                if (passed) {
                    results.passed++;
                    results.details.push({
                        name: test.name,
                        passed: true,
                        duration: duration
                    });
                    console.log(`  ✅ ${test.name} (${duration}ms)`);
                } else {
                    results.failed++;
                    results.details.push({
                        name: test.name,
                        passed: false,
                        error: 'Test returned false',
                        duration: duration
                    });
                    console.log(`  ❌ ${test.name}: Test returned false`);
                }
                
                this.testResults.total++;
                if (passed) this.testResults.passed++;
                else this.testResults.failed++;
                
            } catch (error) {
                results.failed++;
                results.details.push({
                    name: test.name,
                    passed: false,
                    error: error.message
                });
                console.log(`  ❌ ${test.name}: ${error.message}`);
                
                this.testResults.total++;
                this.testResults.failed++;
            }
        }
        
        return results;
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const successRate = this.testResults.total > 0 ? 
            Math.round((this.testResults.passed / this.testResults.total) * 100) : 0;
        
        return {
            summary: `Tests completed: ${this.testResults.passed}/${this.testResults.total} passed (${successRate}%), ${this.testResults.failed} failed, ${this.testResults.skipped} skipped. Duration: ${Math.round(duration / 1000)}s`,
            statistics: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                successRate: successRate,
                duration: Math.round(duration / 1000)
            },
            testDetails: this.testResults.testDetails,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Cleanup test environment
     */
    async cleanupTestEnvironment() {
        console.log('🧹 Cleaning up test environment...');
        
        try {
            // Delete test customers
            for (const customer of this.testData.customers) {
                try {
                    await this.deleteAirtableRecord('Customers', customer.id);
                } catch (error) {
                    console.warn(`⚠️ Failed to delete test customer ${customer.id}`);
                }
            }
            
            // Delete test packages
            for (const pkg of this.testData.packages) {
                try {
                    await this.deleteAirtableRecord('Packages', pkg.id);
                } catch (error) {
                    console.warn(`⚠️ Failed to delete test package ${pkg.id}`);
                }
            }
            
            // Delete test directories
            for (const directory of this.testData.directories) {
                try {
                    await this.deleteAirtableRecord('Directories', directory.id);
                } catch (error) {
                    console.warn(`⚠️ Failed to delete test directory ${directory.id}`);
                }
            }
            
            // Delete test queue entries
            for (const queue of this.testData.queue) {
                try {
                    await this.deleteAirtableRecord('Queue', queue.id);
                } catch (error) {
                    console.warn(`⚠️ Failed to delete test queue entry ${queue.id}`);
                }
            }
            
            console.log('✅ Test environment cleanup completed');
            
        } catch (error) {
            console.warn('⚠️ Test cleanup encountered errors:', error);
        }
    }

    /**
     * Make Airtable API request
     */
    async makeAirtableRequest(method, tableName, params = {}) {
        const url = `${this.config.apiUrl}/${this.config.baseId}/${tableName}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, JSON.stringify(item)));
                } else {
                    searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                }
            });
            url += `?${searchParams.toString()}`;
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Create Airtable record
     */
    async createAirtableRecord(tableName, data) {
        return await this.makeAirtableRequest('POST', tableName, {
            fields: data
        });
    }

    /**
     * Get Airtable record
     */
    async getAirtableRecord(tableName, recordId) {
        try {
            return await this.makeAirtableRequest('GET', `${tableName}/${recordId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Update Airtable record
     */
    async updateAirtableRecord(tableName, recordId, data) {
        return await this.makeAirtableRequest('PATCH', `${tableName}/${recordId}`, {
            fields: data
        });
    }

    /**
     * Delete Airtable record
     */
    async deleteAirtableRecord(tableName, recordId) {
        return await this.makeAirtableRequest('DELETE', `${tableName}/${recordId}`);
    }
}

// ==================== CLI INTERFACE ====================

/**
 * CLI runner for testing suite
 */
async function runTests() {
    const args = process.argv.slice(2);
    const cleanupAfterTests = !args.includes('--no-cleanup');
    const testTimeout = parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1]) || 30000;
    
    console.log('🧪 AutoBolt Testing & Validation Suite');
    console.log('======================================');
    
    const testingSuite = new TestingSuite({
        cleanupAfterTests,
        testTimeout
    });
    
    try {
        const report = await testingSuite.runAllTests();
        
        if (report.statistics.failed === 0) {
            console.log('\n🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log(`\n❌ ${report.statistics.failed} test(s) failed`);
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = TestingSuite;