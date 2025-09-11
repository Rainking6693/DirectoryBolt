/**
 * Directory Health Monitoring Test Suite
 * Comprehensive testing for all monitoring system components
 * Validates accuracy, performance, and reliability
 * 
 * Test Categories:
 * - URL Accessibility Testing
 * - Form Structure Change Detection
 * - Anti-Bot Protection Monitoring
 * - Field Selector Validation
 * - Alert System Testing
 * - Performance and Resource Usage
 * - Scheduler Integration Testing
 */

class DirectoryHealthTestSuite {
    constructor() {
        this.testResults = [];
        this.testConfig = {
            timeout: 10000,
            maxRetries: 3,
            accuracyThreshold: 0.95, // 95% accuracy requirement
            performanceThreshold: 0.03 // 3% resource usage limit
        };
        
        this.mockData = {
            testDirectories: [
                {
                    id: 'test-google',
                    name: 'Google Test',
                    url: 'https://google.com',
                    submissionUrl: 'https://google.com',
                    priority: 'high',
                    category: 'test',
                    fieldMapping: {
                        query: 'input[name="q"]',
                        searchBtn: 'input[type="submit"]'
                    },
                    requirements: ['none'],
                    estimatedTime: 100,
                    difficulty: 'easy'
                },
                {
                    id: 'test-invalid',
                    name: 'Invalid Test',
                    url: 'https://invalid-domain-12345.com',
                    submissionUrl: 'https://invalid-domain-12345.com/form',
                    priority: 'low',
                    category: 'test',
                    fieldMapping: {
                        name: 'input[name="invalid"]'
                    },
                    requirements: ['none'],
                    estimatedTime: 200,
                    difficulty: 'medium'
                }
            ]
        };
    }

    /**
     * Run all test suites
     */
    async runAllTests() {
        console.log('🧪 Starting Directory Health Monitoring Test Suite');
        console.log('=' .repeat(60));
        
        const startTime = performance.now();
        
        try {
            // Initialize test environment
            await this.initializeTestEnvironment();
            
            // Run test categories
            await this.runUrlAccessibilityTests();
            await this.runFormStructureTests();
            await this.runAntiBotDetectionTests();
            await this.runSelectorValidationTests();
            await this.runAlertSystemTests();
            await this.runPerformanceTests();
            await this.runSchedulerTests();
            await this.runIntegrationTests();
            
            // Generate final report
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            this.generateTestReport(totalTime);
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.recordTestResult('Test Suite', 'CRITICAL_FAILURE', false, { error: error.message });
        }
    }

    /**
     * Initialize test environment
     */
    async initializeTestEnvironment() {
        console.log('🔧 Initializing test environment...');
        
        try {
            // Create test monitor instance
            this.testMonitor = new DirectoryHealthMonitor();
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Override directories with test data
            this.testMonitor.directories = this.mockData.testDirectories;
            await this.testMonitor.initializeHealthTracking();
            
            this.recordTestResult('Environment Setup', 'PASSED', true);
            
        } catch (error) {
            this.recordTestResult('Environment Setup', 'FAILED', false, { error: error.message });
            throw error;
        }
    }

    /**
     * Test URL accessibility scanning
     */
    async runUrlAccessibilityTests() {
        console.log('\n📡 Running URL Accessibility Tests...');
        
        const tests = [
            {
                name: 'Valid URL Access',
                test: async () => {
                    const result = await this.testMonitor.checkUrlAccessibility(this.mockData.testDirectories[0]);
                    return result.status === 'accessible' && result.httpStatus >= 200 && result.httpStatus < 400;
                }
            },
            {
                name: 'Invalid URL Handling',
                test: async () => {
                    const result = await this.testMonitor.checkUrlAccessibility(this.mockData.testDirectories[1]);
                    return result.status === 'inaccessible' && result.error;
                }
            },
            {
                name: 'Response Time Measurement',
                test: async () => {
                    const result = await this.testMonitor.checkUrlAccessibility(this.mockData.testDirectories[0]);
                    return typeof result.responseTime === 'number' && result.responseTime > 0;
                }
            },
            {
                name: 'Timeout Handling',
                test: async () => {
                    // Create a test directory with very long timeout
                    const slowDirectory = {
                        ...this.mockData.testDirectories[0],
                        url: 'https://httpstat.us/200?sleep=15000' // 15 second delay
                    };
                    
                    const startTime = performance.now();
                    const result = await this.testMonitor.checkUrlAccessibility(slowDirectory);
                    const endTime = performance.now();
                    
                    // Should timeout before 15 seconds
                    return (endTime - startTime) < 12000;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('URL Accessibility', test.name, test.test);
        }
    }

    /**
     * Test form structure change detection
     */
    async runFormStructureTests() {
        console.log('\n📋 Running Form Structure Tests...');
        
        const tests = [
            {
                name: 'Form Structure Analysis',
                test: async () => {
                    const result = await this.testMonitor.analyzeFormStructure(this.mockData.testDirectories[0]);
                    return result.status === 'analyzed' && result.structure;
                }
            },
            {
                name: 'Selector Mapping Validation',
                test: async () => {
                    const result = await this.testMonitor.analyzeFormStructure(this.mockData.testDirectories[0]);
                    if (result.status !== 'analyzed') return false;
                    
                    const hasSelectors = Object.keys(result.structure.selectors).length > 0;
                    const hasValidMappings = Object.values(result.structure.selectors).some(s => s.found);
                    
                    return hasSelectors && hasValidMappings;
                }
            },
            {
                name: 'Change Detection Algorithm',
                test: async () => {
                    // Create two different structures
                    const oldStructure = {
                        forms: [{ action: '/old', method: 'POST', fieldCount: 3 }],
                        selectors: {
                            name: { found: true, count: 1 },
                            email: { found: true, count: 1 }
                        }
                    };
                    
                    const newStructure = {
                        forms: [{ action: '/new', method: 'POST', fieldCount: 4 }],
                        selectors: {
                            name: { found: true, count: 1 },
                            email: { found: false, count: 0 },
                            phone: { found: true, count: 1 }
                        }
                    };
                    
                    const hasChanges = this.testMonitor.detectStructureChanges(oldStructure, newStructure);
                    return hasChanges === true;
                }
            },
            {
                name: 'HTML Parsing Robustness',
                test: async () => {
                    // Test with malformed HTML
                    const malformedHtml = '<html><body><form><input name="test" type="text"</form></body></html>';
                    const structure = this.testMonitor.parseFormStructure(malformedHtml, { test: 'input[name="test"]' });
                    
                    return structure && structure.selectors && structure.selectors.test;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Form Structure', test.name, test.test);
        }
    }

    /**
     * Test anti-bot protection detection
     */
    async runAntiBotDetectionTests() {
        console.log('\n🛡️ Running Anti-Bot Detection Tests...');
        
        const tests = [
            {
                name: 'CAPTCHA Detection',
                test: async () => {
                    const testHtml = '<html><body><div class="g-recaptcha" data-sitekey="test"></div></body></html>';
                    const captchaResult = this.testMonitor.detectCaptcha(testHtml);
                    return captchaResult.detected && captchaResult.type === 'reCAPTCHA';
                }
            },
            {
                name: 'Cloudflare Detection',
                test: async () => {
                    const testHeaders = { 'cf-ray': '12345', 'server': 'cloudflare' };
                    const testHtml = '<html><body>Checking your browser</body></html>';
                    const cfResult = this.testMonitor.detectCloudflare(testHtml, testHeaders);
                    return cfResult.detected;
                }
            },
            {
                name: 'Rate Limiting Detection',
                test: async () => {
                    const testHeaders = { 'x-ratelimit-limit': '100', 'x-ratelimit-remaining': '50' };
                    const rateLimitResult = this.testMonitor.detectRateLimiting(testHeaders);
                    return rateLimitResult.detected && rateLimitResult.headers.length > 0;
                }
            },
            {
                name: 'JavaScript Challenge Detection',
                test: async () => {
                    const testHtml = '<html><body>JavaScript required to continue</body></html>';
                    const jsResult = this.testMonitor.detectJsChallenge(testHtml);
                    return jsResult.detected;
                }
            },
            {
                name: 'Risk Level Calculation',
                test: async () => {
                    const indicators = {
                        captcha: { detected: true },
                        cloudflare: { detected: true },
                        rateLimiting: { detected: false },
                        jsChallenge: { detected: false },
                        botDetection: { detected: false }
                    };
                    
                    const riskLevel = this.testMonitor.calculateAntiBotRisk(indicators);
                    return ['low', 'medium', 'high'].includes(riskLevel);
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Anti-Bot Detection', test.name, test.test);
        }
    }

    /**
     * Test field selector validation
     */
    async runSelectorValidationTests() {
        console.log('\n🎯 Running Selector Validation Tests...');
        
        const tests = [
            {
                name: 'Selector Accuracy Check',
                test: async () => {
                    const result = await this.testMonitor.validateFieldSelectors(this.mockData.testDirectories[0]);
                    return result.status === 'completed' && typeof result.accuracy === 'number';
                }
            },
            {
                name: 'Missing Selector Detection',
                test: async () => {
                    const result = await this.testMonitor.validateFieldSelectors(this.mockData.testDirectories[1]);
                    return result.status === 'completed' && result.accuracy < 1.0;
                }
            },
            {
                name: 'Element Type Validation',
                test: async () => {
                    const result = await this.testMonitor.validateFieldSelectors(this.mockData.testDirectories[0]);
                    if (result.status !== 'completed') return false;
                    
                    const hasElementTypes = Object.values(result.results).some(
                        field => field.elementTypes && field.elementTypes.length > 0
                    );
                    
                    return hasElementTypes;
                }
            },
            {
                name: 'Change Detection for Selectors',
                test: async () => {
                    const oldSelectorHealth = new Map([
                        ['name', { valid: true, elementCount: 1 }],
                        ['email', { valid: true, elementCount: 1 }]
                    ]);
                    
                    const newSelectorResults = {
                        name: { valid: true, elementCount: 1 },
                        email: { valid: false, elementCount: 0 }
                    };
                    
                    const changes = this.testMonitor.detectSelectorChanges(oldSelectorHealth, newSelectorResults);
                    return Array.isArray(changes) && changes.length > 0;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Selector Validation', test.name, test.test);
        }
    }

    /**
     * Test alert system functionality
     */
    async runAlertSystemTests() {
        console.log('\n🚨 Running Alert System Tests...');
        
        const tests = [
            {
                name: 'Alert Generation',
                test: async () => {
                    // Create a directory with poor metrics to trigger alerts
                    const testDirectory = { ...this.mockData.testDirectories[0] };
                    const healthData = this.testMonitor.healthData.get(testDirectory.id);
                    
                    // Set high response time to trigger alert
                    healthData.responseTime = 10000; // 10 seconds
                    healthData.performanceMetrics.successRate = 0.5; // 50% success rate
                    
                    await this.testMonitor.checkForAlerts(testDirectory.id, testDirectory);
                    
                    return healthData.alerts.length > 0;
                }
            },
            {
                name: 'Alert Severity Classification',
                test: async () => {
                    const testDirectory = { ...this.mockData.testDirectories[0] };
                    const healthData = this.testMonitor.healthData.get(testDirectory.id);
                    
                    // Set critical metrics
                    healthData.performanceMetrics.successRate = 0.3; // 30% success rate
                    
                    await this.testMonitor.checkForAlerts(testDirectory.id, testDirectory);
                    
                    const criticalAlerts = healthData.alerts.filter(alert => alert.severity === 'critical');
                    return criticalAlerts.length > 0;
                }
            },
            {
                name: 'Alert Storage',
                test: async () => {
                    const alertData = {
                        directoryId: 'test',
                        alerts: [{ type: 'test', severity: 'warning', message: 'Test alert' }],
                        timestamp: new Date().toISOString()
                    };
                    
                    await this.testMonitor.storeAlert(alertData);
                    
                    // Check if alert was stored (in localStorage for this test)
                    const storedAlerts = JSON.parse(localStorage.getItem('directory_alerts') || '[]');
                    return storedAlerts.some(alert => alert.directoryId === 'test');
                }
            },
            {
                name: 'Alert Event Triggering',
                test: async () => {
                    return new Promise((resolve) => {
                        // Listen for alert event
                        const alertListener = (event) => {
                            window.removeEventListener('directoryHealthAlert', alertListener);
                            resolve(event.detail && event.detail.directoryId);
                        };
                        
                        window.addEventListener('directoryHealthAlert', alertListener);
                        
                        // Trigger alert
                        const alertData = {
                            directoryId: 'test-event',
                            alerts: [{ type: 'test', severity: 'critical' }]
                        };
                        
                        this.testMonitor.triggerAlertHandlers(alertData);
                        
                        // Timeout after 2 seconds
                        setTimeout(() => {
                            window.removeEventListener('directoryHealthAlert', alertListener);
                            resolve(false);
                        }, 2000);
                    });
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Alert System', test.name, test.test);
        }
    }

    /**
     * Test performance and resource usage
     */
    async runPerformanceTests() {
        console.log('\n⚡ Running Performance Tests...');
        
        const tests = [
            {
                name: 'Resource Usage Limit',
                test: async () => {
                    const startTime = performance.now();
                    
                    // Monitor multiple directories simultaneously
                    const promises = this.mockData.testDirectories.map(
                        directory => this.testMonitor.monitorDirectory(directory)
                    );
                    
                    await Promise.allSettled(promises);
                    
                    const endTime = performance.now();
                    const executionTime = endTime - startTime;
                    
                    // Check if execution time is reasonable (under 10 seconds for 2 directories)
                    return executionTime < 10000;
                }
            },
            {
                name: 'Memory Usage Tracking',
                test: async () => {
                    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                    
                    // Run multiple monitoring cycles
                    for (let i = 0; i < 10; i++) {
                        await this.testMonitor.monitorDirectory(this.mockData.testDirectories[0]);
                    }
                    
                    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                    const memoryIncrease = finalMemory - initialMemory;
                    
                    // Memory increase should be reasonable (less than 10MB)
                    return memoryIncrease < 10 * 1024 * 1024;
                }
            },
            {
                name: 'Concurrent Task Handling',
                test: async () => {
                    const startTime = performance.now();
                    
                    // Create multiple concurrent monitoring tasks
                    const tasks = [];
                    for (let i = 0; i < 5; i++) {
                        tasks.push(this.testMonitor.monitorDirectory(this.mockData.testDirectories[0]));
                    }
                    
                    const results = await Promise.allSettled(tasks);
                    const endTime = performance.now();
                    
                    // All tasks should complete and not take too long
                    const allCompleted = results.every(result => result.status === 'fulfilled' || result.status === 'rejected');
                    const reasonableTime = (endTime - startTime) < 15000; // 15 seconds max
                    
                    return allCompleted && reasonableTime;
                }
            },
            {
                name: 'Data Structure Efficiency',
                test: async () => {
                    // Test health data retrieval performance
                    const startTime = performance.now();
                    
                    for (let i = 0; i < 1000; i++) {
                        this.testMonitor.getHealthSummary(this.mockData.testDirectories[0].id);
                    }
                    
                    const endTime = performance.now();
                    const avgTime = (endTime - startTime) / 1000;
                    
                    // Average retrieval should be under 1ms
                    return avgTime < 1;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Performance', test.name, test.test);
        }
    }

    /**
     * Test scheduler integration
     */
    async runSchedulerTests() {
        console.log('\n⏰ Running Scheduler Tests...');
        
        const tests = [
            {
                name: 'Scheduler Initialization',
                test: async () => {
                    const scheduler = new MonitoringScheduler(this.testMonitor);
                    return scheduler && scheduler.healthMonitor === this.testMonitor;
                }
            },
            {
                name: 'Task Queue Management',
                test: async () => {
                    const scheduler = new MonitoringScheduler(this.testMonitor);
                    
                    scheduler.addTask({
                        type: 'directory_check',
                        directoryId: 'test',
                        priority: 'high',
                        scheduledTime: Date.now()
                    });
                    
                    return scheduler.taskQueue.length === 1;
                }
            },
            {
                name: 'Priority-Based Sorting',
                test: async () => {
                    const scheduler = new MonitoringScheduler(this.testMonitor);
                    
                    scheduler.addTask({
                        type: 'directory_check',
                        directoryId: 'low',
                        priority: 'low',
                        scheduledTime: Date.now()
                    });
                    
                    scheduler.addTask({
                        type: 'directory_check',
                        directoryId: 'high',
                        priority: 'high',
                        scheduledTime: Date.now()
                    });
                    
                    return scheduler.taskQueue[0].priority === 'high';
                }
            },
            {
                name: 'Performance Metrics Tracking',
                test: async () => {
                    const scheduler = new MonitoringScheduler(this.testMonitor);
                    
                    scheduler.updatePerformanceMetrics(1000); // 1 second execution
                    
                    return scheduler.performance.totalExecutions === 1 &&
                           scheduler.performance.avgExecutionTime === 1000;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Scheduler', test.name, test.test);
        }
    }

    /**
     * Test full system integration
     */
    async runIntegrationTests() {
        console.log('\n🔗 Running Integration Tests...');
        
        const tests = [
            {
                name: 'End-to-End Monitoring Flow',
                test: async () => {
                    // Initialize scheduler with monitor
                    const scheduler = new MonitoringScheduler(this.testMonitor);
                    
                    // Start monitoring
                    scheduler.start();
                    
                    // Wait for some processing
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Check if system is running
                    const status = scheduler.getSchedulerStatus();
                    
                    scheduler.stop();
                    
                    return status.isRunning;
                }
            },
            {
                name: 'Dashboard Integration',
                test: async () => {
                    // Test data retrieval for dashboard
                    const healthReport = this.testMonitor.getHealthReport();
                    const monitoringStatus = this.testMonitor.getMonitoringStatus();
                    
                    return healthReport && 
                           healthReport.directories && 
                           healthReport.directories.length > 0 &&
                           monitoringStatus &&
                           typeof monitoringStatus.totalDirectories === 'number';
                }
            },
            {
                name: 'Export Functionality',
                test: async () => {
                    const exportData = this.testMonitor.exportHealthData();
                    
                    try {
                        const parsed = JSON.parse(exportData);
                        return parsed.timestamp && parsed.healthData && Array.isArray(parsed.healthData);
                    } catch (error) {
                        return false;
                    }
                }
            },
            {
                name: 'Configuration Persistence',
                test: async () => {
                    const scheduler = new MonitoringScheduler(this.testMonitor);
                    
                    // Modify configuration
                    scheduler.adjustSchedulingConfiguration({
                        intervals: { highPriority: 600000 }
                    });
                    
                    // Save configuration
                    scheduler.saveConfiguration();
                    
                    // Create new scheduler and load configuration
                    const newScheduler = new MonitoringScheduler(this.testMonitor);
                    await newScheduler.loadConfiguration();
                    
                    return newScheduler.scheduleConfig.highPriority === 600000;
                }
            }
        ];

        for (const test of tests) {
            await this.runSingleTest('Integration', test.name, test.test);
        }
    }

    /**
     * Run a single test with error handling and retries
     */
    async runSingleTest(category, name, testFunction) {
        let retries = 0;
        let success = false;
        let error = null;
        
        while (retries < this.testConfig.maxRetries && !success) {
            try {
                const startTime = performance.now();
                
                // Run test with timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Test timeout')), this.testConfig.timeout);
                });
                
                const testPromise = testFunction();
                const result = await Promise.race([testPromise, timeoutPromise]);
                
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                
                success = Boolean(result);
                
                this.recordTestResult(category, name, success, {
                    executionTime: Math.round(executionTime),
                    retries: retries
                });
                
                if (success) {
                    console.log(`  ✅ ${name} (${Math.round(executionTime)}ms)`);
                } else {
                    console.log(`  ❌ ${name} - Test returned false`);
                }
                
            } catch (testError) {
                error = testError;
                retries++;
                
                if (retries < this.testConfig.maxRetries) {
                    console.log(`  🔄 ${name} - Retry ${retries}/${this.testConfig.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
                } else {
                    this.recordTestResult(category, name, false, { error: error.message, retries: retries });
                    console.log(`  ❌ ${name} - ${error.message}`);
                }
            }
        }
    }

    /**
     * Record test result
     */
    recordTestResult(category, name, passed, metadata = {}) {
        this.testResults.push({
            category: category,
            name: name,
            passed: passed,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport(totalExecutionTime) {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${successRate.toFixed(1)}%)`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Execution Time: ${Math.round(totalExecutionTime)}ms`);
        console.log(`Accuracy Requirement: ${(this.testConfig.accuracyThreshold * 100)}%`);
        
        // Check if accuracy requirement is met
        const accuracyMet = successRate >= (this.testConfig.accuracyThreshold * 100);
        console.log(`Accuracy Met: ${accuracyMet ? '✅ YES' : '❌ NO'}`);
        
        // Category breakdown
        console.log('\nCategory Breakdown:');
        const categories = [...new Set(this.testResults.map(r => r.category))];
        
        categories.forEach(category => {
            const categoryTests = this.testResults.filter(r => r.category === category);
            const categoryPassed = categoryTests.filter(r => r.passed).length;
            const categoryRate = (categoryPassed / categoryTests.length) * 100;
            
            console.log(`  ${category}: ${categoryPassed}/${categoryTests.length} (${categoryRate.toFixed(1)}%)`);
        });
        
        // Failed tests details
        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`  ❌ ${result.category}: ${result.name}`);
                if (result.error) {
                    console.log(`     Error: ${result.error}`);
                }
            });
        }
        
        // Performance summary
        const executionTimes = this.testResults
            .filter(r => r.executionTime)
            .map(r => r.executionTime);
        
        if (executionTimes.length > 0) {
            const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
            const maxTime = Math.max(...executionTimes);
            const minTime = Math.min(...executionTimes);
            
            console.log('\nPerformance Summary:');
            console.log(`  Average Test Time: ${Math.round(avgTime)}ms`);
            console.log(`  Fastest Test: ${minTime}ms`);
            console.log(`  Slowest Test: ${maxTime}ms`);
        }
        
        // Generate JSON report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: totalTests,
                passedTests: passedTests,
                failedTests: failedTests,
                successRate: successRate,
                accuracyMet: accuracyMet,
                totalExecutionTime: Math.round(totalExecutionTime)
            },
            categories: categories.map(category => {
                const categoryTests = this.testResults.filter(r => r.category === category);
                return {
                    name: category,
                    totalTests: categoryTests.length,
                    passedTests: categoryTests.filter(r => r.passed).length,
                    successRate: (categoryTests.filter(r => r.passed).length / categoryTests.length) * 100
                };
            }),
            detailedResults: this.testResults
        };
        
        // Save report to localStorage
        try {
            localStorage.setItem('directory_health_test_report', JSON.stringify(report, null, 2));
            console.log('\n📁 Test report saved to localStorage');
        } catch (error) {
            console.warn('Failed to save test report:', error);
        }
        
        // Final verdict
        console.log('\n🎯 FINAL VERDICT');
        if (accuracyMet && failedTests === 0) {
            console.log('✅ ALL TESTS PASSED - System ready for production deployment!');
        } else if (accuracyMet) {
            console.log('⚠️ TESTS PASSED WITH WARNINGS - Review failed tests before deployment');
        } else {
            console.log('❌ TESTS FAILED - System requires fixes before deployment');
        }
        
        console.log('=' .repeat(60));
    }

    /**
     * Export test report
     */
    exportTestReport() {
        const report = localStorage.getItem('directory_health_test_report');
        if (!report) {
            throw new Error('No test report found');
        }
        
        const blob = new Blob([report], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `directory-health-test-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectoryHealthTestSuite;
} else if (typeof window !== 'undefined') {
    window.DirectoryHealthTestSuite = DirectoryHealthTestSuite;
}

// Auto-run tests if loaded in browser and test flag is set
if (typeof window !== 'undefined' && window.location.search.includes('run-tests')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const testSuite = new DirectoryHealthTestSuite();
        await testSuite.runAllTests();
    });
}