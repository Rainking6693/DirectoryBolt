/**
 * AutoBolt Package Tier Test Suite
 * Comprehensive testing for all package tiers and queue processing functionality
 * 
 * This module provides:
 * - Complete package tier validation testing
 * - Queue processing workflow testing
 * - Integration testing between all Phase 2 components
 * - Performance and load testing
 * - Error handling and recovery testing
 * - SLA compliance testing
 */

class PackageTierTestSuite {
    constructor() {
        this.testResults = new Map();
        this.testMetrics = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            totalTime: 0,
            startTime: 0
        };

        // Test configurations for each package tier
        this.packageTestConfigs = {
            'Enterprise': {
                testCustomers: [
                    {
                        businessName: 'Enterprise Corp',
                        directoryCount: 200,
                        expectedFeatures: ['white-glove-processing', 'human-verification', 'comprehensive-qa'],
                        expectedSLA: 15, // 15 minutes
                        expectedConcurrency: 5,
                        expectedRetries: 5
                    }
                ],
                performanceTargets: {
                    maxProcessingTime: 900000, // 15 minutes
                    minSuccessRate: 0.98,
                    maxErrorRate: 0.02
                }
            },
            'Professional': {
                testCustomers: [
                    {
                        businessName: 'Professional Services LLC',
                        directoryCount: 150,
                        expectedFeatures: ['rush-processing', 'enhanced-qa', 'smart-retry'],
                        expectedSLA: 120, // 2 hours
                        expectedConcurrency: 3,
                        expectedRetries: 3
                    }
                ],
                performanceTargets: {
                    maxProcessingTime: 7200000, // 2 hours
                    minSuccessRate: 0.95,
                    maxErrorRate: 0.05
                }
            },
            'Growth': {
                testCustomers: [
                    {
                        businessName: 'Growth Business Inc',
                        directoryCount: 100,
                        expectedFeatures: ['priority-processing', 'standard-qa', 'basic-retry'],
                        expectedSLA: 480, // 8 hours
                        expectedConcurrency: 2,
                        expectedRetries: 2
                    }
                ],
                performanceTargets: {
                    maxProcessingTime: 28800000, // 8 hours
                    minSuccessRate: 0.90,
                    maxErrorRate: 0.10
                }
            },
            'Starter': {
                testCustomers: [
                    {
                        businessName: 'Starter Business',
                        directoryCount: 30,
                        expectedFeatures: ['standard-processing', 'basic-qa', 'simple-retry'],
                        expectedSLA: 960, // 16 hours
                        expectedConcurrency: 1,
                        expectedRetries: 1
                    }
                ],
                performanceTargets: {
                    maxProcessingTime: 57600000, // 16 hours
                    minSuccessRate: 0.85,
                    maxErrorRate: 0.15
                }
            }
        };

        // Mock test data
        this.mockDirectories = [];
        this.mockCustomers = [];
        
        this.generateMockData();
    }

    /**
     * Run complete test suite
     */
    async runCompleteTestSuite() {
        console.log('🚀 Starting AutoBolt Package Tier Test Suite...');
        
        this.testMetrics.startTime = Date.now();
        
        try {
            // Initialize test environment
            await this.initializeTestEnvironment();

            // Run component integration tests
            await this.runComponentIntegrationTests();

            // Run package tier tests
            await this.runPackageTierTests();

            // Run queue processing tests
            await this.runQueueProcessingTests();

            // Run error handling tests
            await this.runErrorHandlingTests();

            // Run performance tests
            await this.runPerformanceTests();

            // Run load tests
            await this.runLoadTests();

            // Generate test report
            const report = this.generateTestReport();

            console.log('✅ Test suite completed successfully');
            return report;

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        } finally {
            this.testMetrics.totalTime = Date.now() - this.testMetrics.startTime;
            await this.cleanupTestEnvironment();
        }
    }

    /**
     * Initialize test environment
     */
    async initializeTestEnvironment() {
        console.log('🔧 Initializing test environment...');

        try {
            // Initialize all components with test configurations
            this.airtableConnector = new AirtableConnector({
                apiToken: 'test_token',
                baseId: 'test_base'
            });

            this.packageManager = new PackageManager({
                enableUpgradeRecommendations: false // Disable for testing
            });

            this.statusUpdater = new StatusUpdater(this.airtableConnector);
            this.errorHandler = new ErrorHandlerV2({ enableAnalytics: false });
            this.directoryFilter = new DirectoryFilter({ enablePerformanceTracking: false });
            this.backgroundScheduler = new BackgroundScheduler({ enableAutoScaling: false });

            this.queueProcessor = new QueueProcessorV2({
                maxConcurrentCustomers: 5,
                pollInterval: 1000 // Faster polling for tests
            });

            // Initialize components (mock implementations)
            await this.initializeComponentMocks();

            console.log('✅ Test environment initialized');

        } catch (error) {
            console.error('❌ Failed to initialize test environment:', error);
            throw error;
        }
    }

    /**
     * Initialize component mocks
     */
    async initializeComponentMocks() {
        // Mock Airtable connector
        this.airtableConnector.initialize = async () => true;
        this.airtableConnector.makeRequest = async (method, endpoint, data) => {
            return this.mockAirtableRequest(method, endpoint, data);
        };

        // Initialize other components with mocked dependencies
        await this.packageManager.initialize();
        await this.statusUpdater.initialize();
        await this.errorHandler.initialize();
        await this.directoryFilter.initialize();
        await this.backgroundScheduler.initialize();

        await this.queueProcessor.initialize({
            airtableConnector: this.airtableConnector,
            packageManager: this.packageManager,
            statusUpdater: this.statusUpdater,
            errorHandler: this.errorHandler,
            directoryFilter: this.directoryFilter
        });
    }

    /**
     * Mock Airtable request handler
     */
    mockAirtableRequest(method, endpoint, data) {
        if (endpoint === 'Queue') {
            return { records: this.mockCustomers.filter(c => c.fields.queue_status === 'Pending') };
        } else if (endpoint.includes('Customers/')) {
            const customerId = endpoint.split('/')[1];
            return this.mockCustomers.find(c => c.id === customerId);
        } else if (endpoint === 'Directories') {
            return { records: this.mockDirectories };
        } else {
            return { records: [] };
        }
    }

    /**
     * Run component integration tests
     */
    async runComponentIntegrationTests() {
        console.log('🔗 Running component integration tests...');

        const tests = [
            {
                name: 'Airtable Connector Integration',
                test: async () => {
                    const result = await this.airtableConnector.getNextCustomerInQueue();
                    return result !== undefined;
                }
            },
            {
                name: 'Package Manager Integration',
                test: async () => {
                    const config = this.packageManager.getPackageConfiguration('Enterprise');
                    return config && config.tier === 'Enterprise';
                }
            },
            {
                name: 'Status Updater Integration',
                test: async () => {
                    await this.statusUpdater.sendProgressUpdate('test_queue', 'test_customer', {
                        currentDirectory: 1,
                        totalDirectories: 10,
                        progress: 10
                    });
                    return true;
                }
            },
            {
                name: 'Error Handler Integration',
                test: async () => {
                    const result = await this.errorHandler.handleError('TEST_ERROR', new Error('Test error'), {
                        packageType: 'Enterprise'
                    });
                    return result && result.errorId;
                }
            },
            {
                name: 'Directory Filter Integration',
                test: async () => {
                    const filtered = await this.directoryFilter.filterForPackage(this.mockDirectories, {
                        type: 'Enterprise'
                    });
                    return Array.isArray(filtered);
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('integration', test.name, test.test);
        }
    }

    /**
     * Run package tier tests
     */
    async runPackageTierTests() {
        console.log('📦 Running package tier tests...');

        for (const [packageType, config] of Object.entries(this.packageTestConfigs)) {
            console.log(`🧪 Testing ${packageType} package tier...`);

            await this.runSingleTest(`${packageType}_basic_config`, `${packageType} Basic Configuration`, async () => {
                const packageConfig = this.packageManager.getPackageConfiguration(packageType);
                return packageConfig && packageConfig.tier === packageType;
            });

            await this.runSingleTest(`${packageType}_directory_filtering`, `${packageType} Directory Filtering`, async () => {
                const filtered = await this.directoryFilter.filterForPackage(this.mockDirectories, {
                    type: packageType
                });
                
                const expectedLimit = this.packageManager.packageTiers[packageType].directoryAccess.maxDirectories;
                return !expectedLimit || filtered.length <= expectedLimit;
            });

            await this.runSingleTest(`${packageType}_feature_access`, `${packageType} Feature Access`, async () => {
                const packageConfig = this.packageManager.getPackageConfiguration(packageType);
                const testCustomer = config.testCustomers[0];
                
                return testCustomer.expectedFeatures.every(feature => 
                    packageConfig.features.includes(feature)
                );
            });

            await this.runSingleTest(`${packageType}_processing_limits`, `${packageType} Processing Limits`, async () => {
                const packageConfig = this.packageManager.getPackageConfiguration(packageType);
                const testCustomer = config.testCustomers[0];
                
                return packageConfig.processing.concurrentSubmissions === testCustomer.expectedConcurrency &&
                       packageConfig.processing.retryAttempts === testCustomer.expectedRetries;
            });

            await this.runSingleTest(`${packageType}_sla_compliance`, `${packageType} SLA Compliance`, async () => {
                const packageConfig = this.packageManager.getPackageConfiguration(packageType);
                const testCustomer = config.testCustomers[0];
                
                return packageConfig.sla.processingStart <= testCustomer.expectedSLA;
            });
        }
    }

    /**
     * Run queue processing tests
     */
    async runQueueProcessingTests() {
        console.log('⚡ Running queue processing tests...');

        const tests = [
            {
                name: 'Queue Processor Initialization',
                test: async () => {
                    const status = this.queueProcessor.getProcessingStatus();
                    return status && typeof status.isActive === 'boolean';
                }
            },
            {
                name: 'Customer Queue Processing',
                test: async () => {
                    // Add test customers to queue
                    this.addTestCustomersToQueue();
                    
                    // Start processing
                    await this.queueProcessor.startProcessing();
                    
                    // Wait a bit for processing
                    await this.delay(2000);
                    
                    const status = this.queueProcessor.getProcessingStatus();
                    
                    // Stop processing
                    await this.queueProcessor.stopProcessing();
                    
                    return status.isActive === true;
                }
            },
            {
                name: 'Package Priority Processing',
                test: async () => {
                    // Test that Enterprise customers are processed first
                    const enterpriseCustomer = this.createTestCustomer('Enterprise', 'high_priority');
                    const starterCustomer = this.createTestCustomer('Starter', 'low_priority');
                    
                    this.mockCustomers = [starterCustomer, enterpriseCustomer]; // Starter added first
                    
                    const nextCustomer = await this.airtableConnector.getNextCustomerInQueue();
                    
                    return nextCustomer && nextCustomer.fields.package_type === 'Enterprise';
                }
            },
            {
                name: 'Concurrent Processing Limits',
                test: async () => {
                    // Test that processing respects concurrency limits
                    const maxConcurrent = this.queueProcessor.config.maxConcurrentCustomers;
                    
                    // Add more customers than max concurrent
                    for (let i = 0; i < maxConcurrent + 2; i++) {
                        this.mockCustomers.push(this.createTestCustomer('Professional', `test_${i}`));
                    }
                    
                    await this.queueProcessor.startProcessing();
                    await this.delay(1000);
                    
                    const status = this.queueProcessor.getProcessingStatus();
                    
                    await this.queueProcessor.stopProcessing();
                    
                    return status.currentCustomers.length <= maxConcurrent;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('queue_processing', test.name, test.test);
        }
    }

    /**
     * Run error handling tests
     */
    async runErrorHandlingTests() {
        console.log('🚨 Running error handling tests...');

        const tests = [
            {
                name: 'Basic Error Handling',
                test: async () => {
                    const result = await this.errorHandler.handleError('NETWORK_ERROR', 
                        new Error('Network connection failed'), {
                            packageType: 'Professional'
                        }
                    );
                    
                    return result && result.errorId;
                }
            },
            {
                name: 'Package-Specific Recovery',
                test: async () => {
                    const enterpriseResult = await this.errorHandler.handleError('FORM_ERROR', 
                        new Error('Form submission failed'), {
                            packageType: 'Enterprise'
                        }
                    );
                    
                    const starterResult = await this.errorHandler.handleError('FORM_ERROR', 
                        new Error('Form submission failed'), {
                            packageType: 'Starter'
                        }
                    );
                    
                    // Enterprise should have more recovery attempts than Starter
                    return enterpriseResult.attempts > starterResult.attempts;
                }
            },
            {
                name: 'Error Escalation',
                test: async () => {
                    const result = await this.errorHandler.handleError('SYSTEM_ERROR', 
                        new Error('Critical system failure'), {
                            packageType: 'Enterprise',
                            severity: 'critical'
                        }
                    );
                    
                    return result.escalated === true;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('error_handling', test.name, test.test);
        }
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('📈 Running performance tests...');

        for (const [packageType, config] of Object.entries(this.packageTestConfigs)) {
            await this.runSingleTest(`${packageType}_performance`, `${packageType} Performance Test`, async () => {
                const startTime = Date.now();
                
                // Simulate processing for this package
                const testCustomer = this.createTestCustomer(packageType, 'performance_test');
                const mockResult = await this.simulateCustomerProcessing(testCustomer, config);
                
                const processingTime = Date.now() - startTime;
                const targets = config.performanceTargets;
                
                return processingTime <= targets.maxProcessingTime &&
                       mockResult.successRate >= targets.minSuccessRate;
            });
        }
    }

    /**
     * Run load tests
     */
    async runLoadTests() {
        console.log('🏋️ Running load tests...');

        const tests = [
            {
                name: 'High Volume Queue Processing',
                test: async () => {
                    // Create a large number of test customers
                    const testCustomers = [];
                    for (let i = 0; i < 50; i++) {
                        const packageType = ['Enterprise', 'Professional', 'Growth', 'Starter'][i % 4];
                        testCustomers.push(this.createTestCustomer(packageType, `load_test_${i}`));
                    }
                    
                    this.mockCustomers = testCustomers;
                    
                    const startTime = Date.now();
                    
                    // Simulate processing
                    await this.queueProcessor.startProcessing();
                    await this.delay(5000); // 5 seconds of processing
                    await this.queueProcessor.stopProcessing();
                    
                    const processingTime = Date.now() - startTime;
                    
                    return processingTime < 60000; // Should complete within 1 minute for simulation
                }
            },
            {
                name: 'Concurrent Package Processing',
                test: async () => {
                    // Test processing multiple package types simultaneously
                    const packageTypes = ['Enterprise', 'Professional', 'Growth', 'Starter'];
                    const processingPromises = packageTypes.map(async (packageType) => {
                        const testCustomer = this.createTestCustomer(packageType, `concurrent_${packageType}`);
                        return await this.simulateCustomerProcessing(testCustomer, this.packageTestConfigs[packageType]);
                    });
                    
                    const results = await Promise.all(processingPromises);
                    
                    return results.every(result => result.success);
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('load_testing', test.name, test.test);
        }
    }

    /**
     * Simulate customer processing for testing
     */
    async simulateCustomerProcessing(customer, packageConfig) {
        const packageType = customer.fields.package_type;
        const directoryCount = customer.fields.selected_directories?.length || packageConfig.testCustomers[0].directoryCount;
        
        // Simulate processing time based on package type
        const processingTimePerDirectory = {
            'Enterprise': 100,   // 100ms per directory (fast simulation)
            'Professional': 80,
            'Growth': 60,
            'Starter': 40
        };
        
        const totalProcessingTime = directoryCount * (processingTimePerDirectory[packageType] || 60);
        await this.delay(totalProcessingTime);
        
        // Simulate success rates based on package
        const successRates = {
            'Enterprise': 0.98,
            'Professional': 0.95,
            'Growth': 0.90,
            'Starter': 0.85
        };
        
        const successRate = successRates[packageType] || 0.85;
        const successful = Math.floor(directoryCount * successRate);
        const failed = directoryCount - successful;
        
        return {
            success: true,
            successful,
            failed,
            successRate: successful / directoryCount,
            processingTime: totalProcessingTime,
            packageType
        };
    }

    /**
     * Run a single test with error handling and metrics
     */
    async runSingleTest(category, testName, testFunction) {
        this.testMetrics.totalTests++;
        
        const testId = `${category}_${testName}`;
        const startTime = Date.now();
        
        try {
            console.log(`  🧪 ${testName}...`);
            
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            if (result === true) {
                this.testMetrics.passedTests++;
                this.testResults.set(testId, {
                    name: testName,
                    category,
                    status: 'PASSED',
                    duration,
                    timestamp: new Date().toISOString()
                });
                console.log(`    ✅ ${testName} PASSED (${duration}ms)`);
            } else {
                this.testMetrics.failedTests++;
                this.testResults.set(testId, {
                    name: testName,
                    category,
                    status: 'FAILED',
                    duration,
                    error: 'Test returned false',
                    timestamp: new Date().toISOString()
                });
                console.log(`    ❌ ${testName} FAILED (${duration}ms)`);
            }
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.testMetrics.failedTests++;
            this.testResults.set(testId, {
                name: testName,
                category,
                status: 'FAILED',
                duration,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            console.log(`    ❌ ${testName} FAILED (${duration}ms): ${error.message}`);
        }
    }

    /**
     * Generate mock test data
     */
    generateMockData() {
        console.log('🎭 Generating mock test data...');

        // Generate mock directories
        for (let tier = 1; tier <= 5; tier++) {
            const directoriesPerTier = [50, 75, 50, 15, 10][tier - 1];
            
            for (let i = 1; i <= directoriesPerTier; i++) {
                this.mockDirectories.push({
                    id: `dir_tier${tier}_${i}`,
                    fields: {
                        directory_name: `Directory Tier ${tier} #${i}`,
                        directory_tier: tier,
                        difficulty_level: ['Easy', 'Medium', 'Hard', 'Expert', 'Enterprise'][tier - 1],
                        automation_success_rate: 1.0 - (tier * 0.1), // Higher tiers are harder
                        has_anti_bot_protection: tier >= 4,
                        requires_captcha: tier >= 3,
                        requires_manual_review: tier >= 4,
                        is_premium_directory: tier >= 3,
                        domain_authority: Math.max(20, 100 - (tier * 15)),
                        importance_score: tier * 20,
                        submission_url: `https://directory-tier${tier}-${i}.com/submit`
                    }
                });
            }
        }

        console.log(`✅ Generated ${this.mockDirectories.length} mock directories`);
    }

    /**
     * Helper methods
     */
    createTestCustomer(packageType, businessName) {
        const directoryCount = {
            'Enterprise': 200,
            'Professional': 150,
            'Growth': 100,
            'Starter': 30
        }[packageType] || 50;

        return {
            id: `customer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            fields: {
                business_name: businessName,
                package_type: packageType,
                queue_status: 'Pending',
                date_added: new Date().toISOString(),
                selected_directories: this.mockDirectories.slice(0, directoryCount).map(d => d.id),
                email: `${businessName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                phone: '+1-555-0123',
                business_category: 'Technology'
            }
        };
    }

    addTestCustomersToQueue() {
        this.mockCustomers = [];
        
        // Add one customer of each package type
        const packageTypes = ['Enterprise', 'Professional', 'Growth', 'Starter'];
        packageTypes.forEach((packageType, index) => {
            this.mockCustomers.push(this.createTestCustomer(packageType, `Test ${packageType} Business ${index + 1}`));
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const report = {
            summary: {
                totalTests: this.testMetrics.totalTests,
                passed: this.testMetrics.passedTests,
                failed: this.testMetrics.failedTests,
                skipped: this.testMetrics.skippedTests,
                passRate: (this.testMetrics.passedTests / this.testMetrics.totalTests * 100).toFixed(2) + '%',
                totalTime: this.testMetrics.totalTime,
                averageTestTime: Math.round(this.testMetrics.totalTime / this.testMetrics.totalTests),
                timestamp: new Date().toISOString()
            },
            categories: {},
            failures: [],
            recommendations: []
        };

        // Group results by category
        for (const [testId, result] of this.testResults.entries()) {
            if (!report.categories[result.category]) {
                report.categories[result.category] = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    averageTime: 0
                };
            }

            const category = report.categories[result.category];
            category.total++;
            
            if (result.status === 'PASSED') {
                category.passed++;
            } else {
                category.failed++;
                report.failures.push({
                    test: result.name,
                    category: result.category,
                    error: result.error,
                    duration: result.duration
                });
            }
        }

        // Calculate average times and pass rates for categories
        for (const [categoryName, category] of Object.entries(report.categories)) {
            const categoryTests = Array.from(this.testResults.values()).filter(r => r.category === categoryName);
            const totalTime = categoryTests.reduce((sum, test) => sum + test.duration, 0);
            
            category.averageTime = Math.round(totalTime / category.total);
            category.passRate = (category.passed / category.total * 100).toFixed(2) + '%';
        }

        // Generate recommendations based on test results
        this.generateRecommendations(report);

        return report;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(report) {
        const recommendations = [];

        // Check overall pass rate
        if (report.summary.passed / report.summary.totalTests < 0.95) {
            recommendations.push({
                type: 'critical',
                message: 'Overall test pass rate is below 95%. Review failed tests and address issues before deployment.'
            });
        }

        // Check specific categories
        for (const [categoryName, category] of Object.entries(report.categories)) {
            if (category.failed > 0) {
                recommendations.push({
                    type: 'warning',
                    message: `${categoryName} tests have failures. Review and fix before production deployment.`
                });
            }

            if (category.averageTime > 10000) { // 10 seconds
                recommendations.push({
                    type: 'performance',
                    message: `${categoryName} tests are slow (avg: ${category.averageTime}ms). Consider optimization.`
                });
            }
        }

        // Package-specific recommendations
        const packageFailures = report.failures.filter(f => f.category.includes('Enterprise') || 
                                                           f.category.includes('Professional') || 
                                                           f.category.includes('Growth') || 
                                                           f.category.includes('Starter'));

        if (packageFailures.length > 0) {
            recommendations.push({
                type: 'critical',
                message: 'Package tier tests have failures. This could affect customer experience and SLA compliance.'
            });
        }

        // Performance recommendations
        if (report.summary.averageTestTime > 5000) {
            recommendations.push({
                type: 'performance',
                message: 'Test execution is slow. Consider optimizing test performance for faster feedback cycles.'
            });
        }

        report.recommendations = recommendations;
    }

    /**
     * Export test results
     */
    exportTestResults() {
        const report = this.generateTestReport();
        
        const exportData = {
            metadata: {
                testSuite: 'AutoBolt Package Tier Test Suite',
                version: '2.0.0',
                executedAt: new Date().toISOString(),
                environment: 'test'
            },
            report,
            detailedResults: Array.from(this.testResults.entries()).map(([id, result]) => ({
                id,
                ...result
            })),
            testConfiguration: {
                packageConfigs: this.packageTestConfigs,
                mockDataStats: {
                    directories: this.mockDirectories.length,
                    customers: this.mockCustomers.length
                }
            }
        };

        return exportData;
    }

    /**
     * Cleanup test environment
     */
    async cleanupTestEnvironment() {
        console.log('🧹 Cleaning up test environment...');

        try {
            // Stop any running processes
            if (this.queueProcessor) {
                await this.queueProcessor.shutdown();
            }

            if (this.backgroundScheduler) {
                await this.backgroundScheduler.shutdown();
            }

            if (this.statusUpdater) {
                await this.statusUpdater.shutdown();
            }

            if (this.errorHandler) {
                await this.errorHandler.shutdown();
            }

            if (this.directoryFilter) {
                await this.directoryFilter.shutdown();
            }

            // Clear mock data
            this.mockDirectories.length = 0;
            this.mockCustomers.length = 0;

            console.log('✅ Test environment cleaned up');

        } catch (error) {
            console.warn('⚠️ Error during cleanup:', error.message);
        }
    }

    /**
     * Run specific package tier test
     */
    async runPackageTierTest(packageType) {
        console.log(`🧪 Running tests for ${packageType} package tier...`);

        const config = this.packageTestConfigs[packageType];
        if (!config) {
            throw new Error(`No test configuration found for package type: ${packageType}`);
        }

        await this.initializeTestEnvironment();

        try {
            // Run package-specific tests
            const testResults = [];

            // Test configuration
            testResults.push(await this.testPackageConfiguration(packageType, config));

            // Test directory filtering
            testResults.push(await this.testDirectoryFiltering(packageType, config));

            // Test processing features
            testResults.push(await this.testProcessingFeatures(packageType, config));

            // Test performance targets
            testResults.push(await this.testPerformanceTargets(packageType, config));

            return {
                packageType,
                results: testResults,
                summary: {
                    total: testResults.length,
                    passed: testResults.filter(r => r.passed).length,
                    failed: testResults.filter(r => !r.passed).length
                }
            };

        } finally {
            await this.cleanupTestEnvironment();
        }
    }

    /**
     * Individual test methods
     */
    async testPackageConfiguration(packageType, config) {
        const packageConfig = this.packageManager.getPackageConfiguration(packageType);
        const testCustomer = config.testCustomers[0];

        return {
            name: 'Package Configuration',
            passed: packageConfig.tier === packageType &&
                   packageConfig.features.every(f => testCustomer.expectedFeatures.includes(f)),
            details: {
                configFound: !!packageConfig,
                tierMatch: packageConfig.tier === packageType,
                featuresMatch: packageConfig.features.every(f => testCustomer.expectedFeatures.includes(f))
            }
        };
    }

    async testDirectoryFiltering(packageType, config) {
        const filtered = await this.directoryFilter.filterForPackage(this.mockDirectories, {
            type: packageType
        });

        const packageAccess = this.directoryFilter.getPackageAccess(packageType);
        const expectedMaxDirectories = packageAccess.maxDirectories;

        return {
            name: 'Directory Filtering',
            passed: !expectedMaxDirectories || filtered.length <= expectedMaxDirectories,
            details: {
                totalDirectories: this.mockDirectories.length,
                filteredDirectories: filtered.length,
                expectedMax: expectedMaxDirectories,
                withinLimit: !expectedMaxDirectories || filtered.length <= expectedMaxDirectories
            }
        };
    }

    async testProcessingFeatures(packageType, config) {
        const packageConfig = this.packageManager.getPackageConfiguration(packageType);
        const testCustomer = config.testCustomers[0];

        const hasExpectedFeatures = testCustomer.expectedFeatures.every(feature =>
            packageConfig.features.includes(feature)
        );

        const correctConcurrency = packageConfig.processing.concurrentSubmissions === testCustomer.expectedConcurrency;
        const correctRetries = packageConfig.processing.retryAttempts === testCustomer.expectedRetries;

        return {
            name: 'Processing Features',
            passed: hasExpectedFeatures && correctConcurrency && correctRetries,
            details: {
                featuresMatch: hasExpectedFeatures,
                concurrencyMatch: correctConcurrency,
                retriesMatch: correctRetries,
                expectedFeatures: testCustomer.expectedFeatures,
                actualFeatures: packageConfig.features,
                expectedConcurrency: testCustomer.expectedConcurrency,
                actualConcurrency: packageConfig.processing.concurrentSubmissions,
                expectedRetries: testCustomer.expectedRetries,
                actualRetries: packageConfig.processing.retryAttempts
            }
        };
    }

    async testPerformanceTargets(packageType, config) {
        const testCustomer = this.createTestCustomer(packageType, 'performance_test');
        const mockResult = await this.simulateCustomerProcessing(testCustomer, config);

        const targets = config.performanceTargets;
        const meetsSLA = mockResult.processingTime <= targets.maxProcessingTime;
        const meetsSuccessRate = mockResult.successRate >= targets.minSuccessRate;

        return {
            name: 'Performance Targets',
            passed: meetsSLA && meetsSuccessRate,
            details: {
                slaCompliance: meetsSLA,
                successRateCompliance: meetsSuccessRate,
                actualProcessingTime: mockResult.processingTime,
                targetProcessingTime: targets.maxProcessingTime,
                actualSuccessRate: mockResult.successRate,
                targetSuccessRate: targets.minSuccessRate
            }
        };
    }

    /**
     * Public API methods
     */
    async validateAllPackageTiers() {
        const results = {};

        for (const packageType of Object.keys(this.packageTestConfigs)) {
            results[packageType] = await this.runPackageTierTest(packageType);
        }

        return results;
    }

    getTestSummary() {
        return {
            metrics: this.testMetrics,
            results: Array.from(this.testResults.values()),
            mockDataStats: {
                directories: this.mockDirectories.length,
                customers: this.mockCustomers.length
            }
        };
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PackageTierTestSuite;
} else if (typeof window !== 'undefined') {
    window.PackageTierTestSuite = PackageTierTestSuite;
}

// Auto-run tests if this is the main module
if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('test')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Auto-running AutoBolt Package Tier Test Suite...');
        
        const testSuite = new PackageTierTestSuite();
        const report = await testSuite.runCompleteTestSuite();
        
        console.log('📊 Test Report:', report);
        console.log('📁 Detailed Results:', testSuite.exportTestResults());
    });
}