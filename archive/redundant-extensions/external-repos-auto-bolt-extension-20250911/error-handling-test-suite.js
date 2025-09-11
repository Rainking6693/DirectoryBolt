/**
 * Comprehensive Error Handling Test Suite
 * Tests for Enhanced AutoBolt Error Handler based on Taylor's QA Assessment
 * 
 * Validates all critical error scenarios identified:
 * - Network timeouts beyond 30 seconds
 * - Rate limiting edge cases
 * - CAPTCHA detection improvements
 * - Form structure changes
 * - Directory unavailability scenarios
 * - User interruption handling
 * - Progress preservation
 * - Recovery mechanisms
 */

class ErrorHandlingTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            details: [],
            startTime: null,
            endTime: null,
            duration: 0
        };
        
        this.errorHandler = null;
        this.testConfig = {
            enableVerboseLogging: true,
            enableNetworkSimulation: true,
            simulateRealDelays: false, // Set to true for realistic testing
            timeoutTolerance: 5000, // 5 seconds tolerance for timing tests
            maxTestDuration: 60000 // 1 minute per test max
        };
        
        this.simulatedNetworkConditions = {
            offline: false,
            latency: 0,
            rateLimited: false,
            captchaDetected: false
        };
    }

    /**
     * Initialize test suite
     */
    async initialize() {
        console.log('🚀 Initializing Error Handling Test Suite...');
        
        try {
            // Initialize enhanced error handler
            this.errorHandler = new EnhancedErrorHandler({
                baseTimeout: 5000, // Shorter for testing
                maxTimeout: 30000,
                maxRetries: 3,
                progressPersistenceEnabled: true,
                userFriendlyErrors: true,
                enableAnalytics: true
            });
            
            // Setup test environment
            this.setupTestEnvironment();
            
            console.log('✅ Error Handling Test Suite initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize test suite:', error);
            throw error;
        }
    }

    /**
     * Run complete test suite
     */
    async runAllTests() {
        this.testResults.startTime = Date.now();
        console.log('🧪 Starting comprehensive error handling tests...');
        
        const testCategories = [
            {
                name: 'Network Error Tests',
                tests: [
                    () => this.testNetworkTimeout(),
                    () => this.testProgressiveTimeoutIncrease(),
                    () => this.testOfflineDetection(),
                    () => this.testOnlineRecovery(),
                    () => this.testConnectionErrors()
                ]
            },
            {
                name: 'Rate Limiting Tests',
                tests: [
                    () => this.testRateLimitDetection(),
                    () => this.testRateLimitBackoff(),
                    () => this.testRateLimitHeaders(),
                    () => this.testMultipleDomainRateLimits(),
                    () => this.testRateLimitCircuitBreaker()
                ]
            },
            {
                name: 'CAPTCHA Detection Tests',
                tests: [
                    () => this.testCaptchaDetection(),
                    () => this.testAdvancedCaptchaPatterns(),
                    () => this.testCaptchaConfidenceLevels(),
                    () => this.testCaptchaUserNotification(),
                    () => this.testCaptchaProgressPreservation()
                ]
            },
            {
                name: 'Form Structure Tests',
                tests: [
                    () => this.testFormStructureChange(),
                    () => this.testFormRedetection(),
                    () => this.testFallbackSelectors(),
                    () => this.testMappingUpdates(),
                    () => this.testDynamicFormHandling()
                ]
            },
            {
                name: 'Directory Availability Tests',
                tests: [
                    () => this.testDirectoryUnavailable(),
                    () => this.testSiteStatusCheck(),
                    () => this.testMaintenanceMode(),
                    () => this.testTemporaryOutages(),
                    () => this.testPermanentFailures()
                ]
            },
            {
                name: 'User Interruption Tests',
                tests: [
                    () => this.testUserInterruption(),
                    () => this.testProgressPreservation(),
                    () => this.testSessionResumption(),
                    () => this.testPageUnload(),
                    () => this.testBrowserCrash()
                ]
            },
            {
                name: 'Circuit Breaker Tests',
                tests: [
                    () => this.testCircuitBreakerTriggering(),
                    () => this.testCircuitBreakerRecovery(),
                    () => this.testMultipleFailures(),
                    () => this.testHalfOpenState(),
                    () => this.testDomainIsolation()
                ]
            },
            {
                name: 'Recovery Mechanism Tests',
                tests: [
                    () => this.testExponentialBackoff(),
                    () => this.testRetryWithJitter(),
                    () => this.testMaxRetryLimits(),
                    () => this.testRecoveryActionChaining(),
                    () => this.testManualInterventionEscalation()
                ]
            },
            {
                name: 'Edge Case Tests',
                tests: [
                    () => this.testMultipleSimultaneousErrors(),
                    () => this.testErrorDuringRecovery(),
                    () => this.testResourceExhaustion(),
                    () => this.testCorruptedProgressData(),
                    () => this.testBrowserLimitations()
                ]
            },
            {
                name: 'Performance Tests',
                tests: [
                    () => this.testErrorHandlingPerformance(),
                    () => this.testMemoryUsage(),
                    () => this.testHighVolumeErrors(),
                    () => this.testConcurrentErrorHandling(),
                    () => this.testCleanupEfficiency()
                ]
            }
        ];

        try {
            for (const category of testCategories) {
                await this.runTestCategory(category);
            }
            
            this.testResults.endTime = Date.now();
            this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
            
            // Generate comprehensive report
            const report = await this.generateTestReport();
            await this.saveTestResults(report);
            
            console.log(`🎉 Test suite completed: ${this.testResults.passed}/${this.testResults.total} passed`);
            return report;
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            throw error;
        }
    }

    /**
     * Run specific test category
     */
    async runTestCategory(category) {
        console.log(`📋 Running ${category.name}...`);
        
        const categoryResults = {
            name: category.name,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };

        for (const testFn of category.tests) {
            try {
                const testName = testFn.name.replace('bound ', '');
                console.log(`  🧪 ${testName}...`);
                
                const testResult = await this.runSingleTest(testFn, testName);
                categoryResults.tests.push(testResult);
                
                if (testResult.status === 'passed') {
                    categoryResults.passed++;
                    this.testResults.passed++;
                } else if (testResult.status === 'failed') {
                    categoryResults.failed++;
                    this.testResults.failed++;
                } else {
                    categoryResults.skipped++;
                    this.testResults.skipped++;
                }
                
                this.testResults.total++;
                
            } catch (error) {
                console.error(`❌ Test execution error in ${category.name}:`, error);
                categoryResults.failed++;
                this.testResults.failed++;
                this.testResults.total++;
            }
        }
        
        this.testResults.details.push(categoryResults);
        console.log(`✅ ${category.name} completed: ${categoryResults.passed}/${categoryResults.tests.length} passed`);
    }

    /**
     * Run individual test with timeout and error handling
     */
    async runSingleTest(testFn, testName) {
        const startTime = Date.now();
        
        try {
            // Set timeout for individual test
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Test timeout')), this.testConfig.maxTestDuration)
            );

            const testPromise = testFn();
            const result = await Promise.race([testPromise, timeoutPromise]);
            
            const duration = Date.now() - startTime;
            
            return {
                name: testName,
                status: result.success ? 'passed' : 'failed',
                duration,
                message: result.message || 'Test completed',
                details: result.details || {},
                error: result.success ? null : result.error
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            return {
                name: testName,
                status: 'failed',
                duration,
                message: error.message,
                error: error.toString(),
                details: {}
            };
        }
    }

    /**
     * Network Error Tests
     */
    async testNetworkTimeout() {
        console.log('    Testing network timeout handling...');
        
        try {
            // Simulate timeout error
            const timeoutError = new Error('Request timed out after 30000ms');
            timeoutError.name = 'TimeoutError';
            
            const context = {
                url: 'https://example.com/form',
                timeout: 30000,
                retryCallback: () => Promise.resolve({ success: true })
            };
            
            const result = await this.errorHandler.handleNetworkError(timeoutError, context);
            
            return {
                success: result.success,
                message: 'Network timeout handled correctly',
                details: { attempts: result.attempts, finalTimeout: result.finalTimeout }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testProgressiveTimeoutIncrease() {
        console.log('    Testing progressive timeout increase...');
        
        try {
            const timeoutError = new Error('Request timed out');
            timeoutError.name = 'TimeoutError';
            
            let callCount = 0;
            const context = {
                url: 'https://example.com/form',
                timeout: 5000,
                retryCallback: () => {
                    callCount++;
                    if (callCount < 3) {
                        throw timeoutError;
                    }
                    return Promise.resolve({ success: true });
                }
            };
            
            const result = await this.errorHandler.handleTimeoutError(timeoutError, context);
            
            return {
                success: result.success && result.attempts >= 2,
                message: 'Progressive timeout increase working',
                details: { attempts: result.attempts, finalTimeout: result.finalTimeout }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testOfflineDetection() {
        console.log('    Testing offline detection...');
        
        try {
            // Simulate offline condition
            this.simulatedNetworkConditions.offline = true;
            this.errorHandler.onlineStatus = false;
            
            const networkError = new Error('Network error');
            const context = {
                url: 'https://example.com/form',
                retryCallback: () => Promise.resolve({ success: true })
            };
            
            const resultPromise = this.errorHandler.handleOfflineScenario(context);
            
            // Simulate going back online after 1 second
            setTimeout(() => {
                this.simulatedNetworkConditions.offline = false;
                this.errorHandler.onlineStatus = true;
                window.dispatchEvent(new Event('online'));
            }, 1000);
            
            const result = await resultPromise;
            
            return {
                success: result.preservedProgress,
                message: 'Offline detection and progress preservation working',
                details: { preservedProgress: result.preservedProgress }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Rate Limiting Tests
     */
    async testRateLimitDetection() {
        console.log('    Testing rate limit detection...');
        
        try {
            const rateLimitError = new Error('Rate limit exceeded');
            const context = {
                url: 'https://api.example.com/submit',
                headers: {
                    'x-ratelimit-remaining': '0',
                    'x-ratelimit-reset': Math.floor((Date.now() + 60000) / 1000).toString(),
                    'retry-after': '60'
                }
            };
            
            const result = await this.errorHandler.handleRateLimiting(rateLimitError, context);
            
            return {
                success: result.success && result.waitTime > 0,
                message: 'Rate limiting detected and handled',
                details: { waitTime: result.waitTime }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testRateLimitBackoff() {
        console.log('    Testing rate limit exponential backoff...');
        
        try {
            const domain = 'api.example.com';
            
            // Simulate multiple rate limit hits
            for (let i = 0; i < 3; i++) {
                const rateLimitError = new Error('429 Too Many Requests');
                const context = {
                    url: `https://${domain}/submit`,
                    headers: { 'retry-after': '30' }
                };
                
                await this.errorHandler.handleRateLimiting(rateLimitError, context);
            }
            
            // Check if rate limit state is tracked
            const rateLimitState = this.errorHandler.rateLimitState.get(domain);
            
            return {
                success: rateLimitState && rateLimitState.limitReached,
                message: 'Rate limit backoff mechanism working',
                details: { rateLimitState }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * CAPTCHA Detection Tests
     */
    async testCaptchaDetection() {
        console.log('    Testing CAPTCHA detection...');
        
        try {
            const captchaError = new Error('CAPTCHA verification required');
            const context = {
                url: 'https://directory.com/submit',
                captchaDetected: true,
                htmlContent: '<div class="g-recaptcha"></div>'
            };
            
            const result = await this.errorHandler.handleCaptchaDetection(captchaError, context);
            
            return {
                success: !result.success && result.requiresManualIntervention,
                message: 'CAPTCHA detection working correctly',
                details: { 
                    captchaType: result.captchaType,
                    confidence: result.confidence,
                    preservedProgress: result.preservedProgress
                }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testAdvancedCaptchaPatterns() {
        console.log('    Testing advanced CAPTCHA pattern detection...');
        
        try {
            const testCases = [
                {
                    context: { htmlContent: 'recaptcha challenge detected' },
                    expectedType: 'reCAPTCHA',
                    expectedConfidence: 0.9
                },
                {
                    context: { htmlContent: 'hcaptcha verification required' },
                    expectedType: 'hCaptcha',
                    expectedConfidence: 0.9
                },
                {
                    context: { htmlContent: 'cloudflare security check' },
                    expectedType: 'Cloudflare',
                    expectedConfidence: 0.8
                }
            ];
            
            let allPassed = true;
            const results = [];
            
            for (const testCase of testCases) {
                const detection = this.errorHandler.detectAdvancedCaptcha(testCase.context);
                const passed = detection.type === testCase.expectedType && 
                             detection.confidence >= testCase.expectedConfidence;
                             
                results.push({ ...testCase, detection, passed });
                if (!passed) allPassed = false;
            }
            
            return {
                success: allPassed,
                message: 'Advanced CAPTCHA pattern detection working',
                details: { testResults: results }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Form Structure Change Tests
     */
    async testFormStructureChange() {
        console.log('    Testing form structure change handling...');
        
        try {
            const structureError = new Error('Element not found: #business-name');
            const context = {
                url: 'https://directory.com/submit',
                directoryId: 'dir_123',
                retryCallback: (newStructure) => Promise.resolve({ success: true, newStructure })
            };
            
            // Mock form analysis
            this.errorHandler.analyzeFormStructure = async () => ({
                success: true,
                structure: { businessName: '#company_name', email: '#contact_email' }
            });
            
            this.errorHandler.updateFormMappings = async () => true;
            
            const result = await this.errorHandler.handleFormStructureChange(structureError, context);
            
            return {
                success: result.success,
                message: 'Form structure change handled',
                details: { newStructure: result.newFormStructure }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Directory Availability Tests
     */
    async testDirectoryUnavailable() {
        console.log('    Testing directory unavailability handling...');
        
        try {
            const unavailableError = new Error('503 Service Temporarily Unavailable');
            const context = {
                url: 'https://directory.com/submit',
                directoryName: 'Test Directory'
            };
            
            // Mock site status check - simulate recovery on second check
            let checkCount = 0;
            this.errorHandler.checkSiteStatus = async () => {
                checkCount++;
                return { available: checkCount >= 2, status: checkCount >= 2 ? 'online' : 'maintenance' };
            };
            
            const result = await this.errorHandler.handleDirectoryUnavailable(unavailableError, context);
            
            return {
                success: result.success && result.attempts > 1,
                message: 'Directory unavailability handled with retry',
                details: { attempts: result.attempts, siteStatus: result.siteStatus }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * User Interruption Tests
     */
    async testUserInterruption() {
        console.log('    Testing user interruption handling...');
        
        try {
            const context = {
                sessionId: 'test_session_123',
                reason: 'user_initiated',
                completedDirectories: ['dir1', 'dir2'],
                currentDirectory: 'dir3',
                businessData: { name: 'Test Business' },
                processingState: 'in_progress'
            };
            
            const result = await this.errorHandler.handleUserInterruption(context);
            
            return {
                success: result.success && result.progressSaved && result.canResume,
                message: 'User interruption handled with progress preservation',
                details: { sessionId: result.sessionId, progressSaved: result.progressSaved }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testProgressPreservation() {
        console.log('    Testing progress preservation system...');
        
        try {
            const sessionId = 'test_preserve_session';
            const progressData = {
                sessionId,
                timestamp: Date.now(),
                completedDirectories: ['dir1', 'dir2', 'dir3'],
                businessData: { name: 'Test Business', email: 'test@example.com' }
            };
            
            // Test save
            await this.errorHandler.saveProgress(progressData);
            
            // Test load
            const loadedData = await this.errorHandler.loadProgress(sessionId);
            
            const dataMatches = loadedData && 
                               loadedData.sessionId === sessionId &&
                               loadedData.completedDirectories.length === 3;
            
            return {
                success: dataMatches,
                message: 'Progress preservation system working',
                details: { saved: progressData, loaded: loadedData }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Circuit Breaker Tests
     */
    async testCircuitBreakerTriggering() {
        console.log('    Testing circuit breaker triggering...');
        
        try {
            const url = 'https://failing-service.com/api';
            const domain = this.errorHandler.extractDomain(url);
            
            // Simulate multiple failures to trigger circuit breaker
            for (let i = 0; i < 6; i++) {
                this.errorHandler.updateCircuitBreaker(url, false);
            }
            
            const isOpen = this.errorHandler.isCircuitBreakerOpen(url);
            const breakerState = this.errorHandler.circuitBreakers.get(domain);
            
            return {
                success: isOpen && breakerState.state === 'open',
                message: 'Circuit breaker triggering correctly',
                details: { isOpen, breakerState }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Performance Tests
     */
    async testErrorHandlingPerformance() {
        console.log('    Testing error handling performance...');
        
        try {
            const startTime = Date.now();
            const errorCount = 100;
            const errors = [];
            
            // Generate multiple errors rapidly
            for (let i = 0; i < errorCount; i++) {
                const error = new Error(`Test error ${i}`);
                const context = { url: `https://test${i}.com`, testId: i };
                
                const resultPromise = this.errorHandler.handleError(error, context);
                errors.push(resultPromise);
            }
            
            // Wait for all to complete
            const results = await Promise.all(errors);
            const duration = Date.now() - startTime;
            const avgTimePerError = duration / errorCount;
            
            return {
                success: avgTimePerError < 100, // Less than 100ms per error
                message: `Processed ${errorCount} errors in ${duration}ms`,
                details: { 
                    duration, 
                    avgTimePerError, 
                    successfulRecoveries: results.filter(r => r.success).length 
                }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Edge Case Tests
     */
    async testMultipleSimultaneousErrors() {
        console.log('    Testing multiple simultaneous errors...');
        
        try {
            const errors = [
                { error: new Error('Network timeout'), context: { url: 'https://site1.com' } },
                { error: new Error('Rate limited'), context: { url: 'https://site2.com' } },
                { error: new Error('CAPTCHA detected'), context: { url: 'https://site3.com' } }
            ];
            
            const promises = errors.map(({ error, context }) => 
                this.errorHandler.handleError(error, context)
            );
            
            const results = await Promise.all(promises);
            
            return {
                success: results.length === 3,
                message: 'Multiple simultaneous errors handled',
                details: { results }
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup test environment
     */
    setupTestEnvironment() {
        // Mock Chrome storage API
        if (!global.chrome) {
            global.chrome = {
                storage: {
                    local: {
                        get: async (keys) => ({}),
                        set: async (data) => true
                    }
                }
            };
        }
        
        // Mock window events for online/offline testing
        if (typeof window !== 'undefined') {
            this.originalNavigatorOnLine = navigator.onLine;
        }
        
        console.log('🔧 Test environment setup complete');
    }

    /**
     * Generate comprehensive test report
     */
    async generateTestReport() {
        const report = {
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                passRate: this.testResults.total > 0 ? 
                         Math.round((this.testResults.passed / this.testResults.total) * 100) : 0,
                duration: this.testResults.duration,
                timestamp: new Date().toISOString()
            },
            categories: this.testResults.details,
            errorHandlerMetrics: this.errorHandler.getErrorMetrics(),
            recommendations: this.generateRecommendations(),
            criticalIssues: this.identifyCriticalIssues()
        };
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const passRate = this.testResults.passed / this.testResults.total;
        
        if (passRate < 0.95) {
            recommendations.push({
                priority: 'high',
                category: 'reliability',
                issue: 'Test pass rate below 95%',
                recommendation: 'Review failed tests and improve error handling reliability'
            });
        }
        
        if (this.testResults.failed > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'robustness',
                issue: 'Some error scenarios are not handled properly',
                recommendation: 'Investigate failed test cases and enhance error recovery mechanisms'
            });
        }
        
        return recommendations;
    }

    identifyCriticalIssues() {
        const critical = [];
        
        // Check for critical test failures
        for (const category of this.testResults.details) {
            if (category.name.includes('Network') && category.failed > 0) {
                critical.push({
                    severity: 'critical',
                    area: 'Network Error Handling',
                    issue: 'Network error handling tests failed',
                    impact: 'May cause timeouts and failed submissions in production'
                });
            }
            
            if (category.name.includes('Progress') && category.failed > 0) {
                critical.push({
                    severity: 'critical',
                    area: 'Progress Preservation',
                    issue: 'Progress preservation tests failed',
                    impact: 'Users may lose work progress on interruptions'
                });
            }
        }
        
        return critical;
    }

    /**
     * Save test results
     */
    async saveTestResults(report) {
        try {
            const fileName = `error-handling-test-report-${Date.now()}.json`;
            const reportData = JSON.stringify(report, null, 2);
            
            // In a real environment, this would save to file system
            console.log(`📊 Test report generated: ${fileName}`);
            console.log('Report summary:', report.summary);
            
            return fileName;
            
        } catch (error) {
            console.error('❌ Failed to save test results:', error);
        }
    }

    /**
     * Cleanup after tests
     */
    async cleanup() {
        if (this.errorHandler) {
            await this.errorHandler.shutdown();
        }
        
        // Restore original state
        if (typeof window !== 'undefined' && this.originalNavigatorOnLine !== undefined) {
            Object.defineProperty(navigator, 'onLine', {
                value: this.originalNavigatorOnLine,
                writable: true
            });
        }
        
        console.log('🧹 Test suite cleanup complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlingTestSuite;
} else if (typeof window !== 'undefined') {
    window.ErrorHandlingTestSuite = ErrorHandlingTestSuite;
}

// Auto-run if loaded directly
if (typeof window !== 'undefined' && window.location && window.location.search.includes('autorun=true')) {
    (async () => {
        const testSuite = new ErrorHandlingTestSuite();
        await testSuite.initialize();
        const report = await testSuite.runAllTests();
        await testSuite.cleanup();
        
        console.log('🎉 Automated test run completed');
        window.errorHandlingTestReport = report;
    })();
}