/**
 * Auto-Bolt Automated Test Suite
 * Coordinates comprehensive testing of all 63 directories
 * Provides test scheduling, parallel execution, and detailed reporting
 */

class AutoBoltTestSuite {
    constructor() {
        this.validator = null;
        this.testConfig = {
            maxConcurrentTests: 5,
            timeout: 30000, // 30 seconds per test
            retryAttempts: 2,
            retryDelay: 5000, // 5 seconds between retries
            testSchedule: 'immediate', // 'immediate', 'scheduled', 'batch'
            enableSmokeTesting: true,
            enableRegressionTesting: true,
            enablePerformanceTesting: true
        };
        this.testResults = new Map();
        this.testQueue = [];
        this.activeTests = new Set();
        this.logger = null;
        this.metrics = {
            totalDirectories: 0,
            testsCompleted: 0,
            testsInProgress: 0,
            testsFailed: 0,
            testsSkipped: 0,
            avgExecutionTime: 0,
            totalExecutionTime: 0,
            startTime: null,
            endTime: null
        };
        this.reportGenerator = new TestReportGenerator();
    }

    async initialize() {
        console.log('🚀 Initializing Auto-Bolt Automated Test Suite');
        
        try {
            // Initialize validator
            if (typeof DirectoryQAValidator !== 'undefined') {
                this.validator = new DirectoryQAValidator();
                this.logger = this.validator.logger;
                await this.validator.init();
            } else {
                throw new Error('DirectoryQAValidator not found. Ensure qa-validation-system.js is loaded.');
            }

            // Load test configuration
            await this.loadTestConfiguration();
            
            // Setup test environment
            this.setupTestEnvironment();
            
            console.log('✅ Test Suite initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize test suite:', error);
            throw error;
        }
    }

    async loadTestConfiguration() {
        // Load configuration from storage or use defaults
        try {
            const config = await chrome.storage.local.get(['testSuiteConfig']);
            if (config.testSuiteConfig) {
                this.testConfig = { ...this.testConfig, ...config.testSuiteConfig };
                this.logger.info('📋 Loaded test configuration from storage');
            }
        } catch (error) {
            this.logger.warn('⚠️ Using default test configuration');
        }
    }

    setupTestEnvironment() {
        this.logger.info('🏗️ Setting up test environment');
        
        // Initialize metrics
        this.metrics.totalDirectories = this.validator.masterDirectories.length;
        this.metrics.startTime = Date.now();
        
        // Setup test categories
        this.testCategories = {
            SMOKE_TESTS: {
                name: 'Smoke Tests',
                description: 'Basic functionality validation',
                priority: 1,
                directories: this.getHighPriorityDirectories(),
                enabled: this.testConfig.enableSmokeTesting
            },
            REGRESSION_TESTS: {
                name: 'Regression Tests', 
                description: 'Full validation of all directories',
                priority: 2,
                directories: this.validator.masterDirectories,
                enabled: this.testConfig.enableRegressionTesting
            },
            PERFORMANCE_TESTS: {
                name: 'Performance Tests',
                description: 'Load time and response validation',
                priority: 3,
                directories: this.getSampleDirectories(20),
                enabled: this.testConfig.enablePerformanceTesting
            }
        };

        this.logger.info('✅ Test environment setup complete');
    }

    getHighPriorityDirectories() {
        return this.validator.masterDirectories.filter(dir => dir.priority === 'high');
    }

    getSampleDirectories(count) {
        const shuffled = [...this.validator.masterDirectories].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Run comprehensive test suite
     */
    async runAllTests() {
        this.logger.info('🎯 Starting comprehensive test suite execution');
        
        try {
            const results = {
                suiteId: `test-suite-${Date.now()}`,
                startTime: new Date().toISOString(),
                endTime: null,
                categories: {},
                summary: null,
                recommendations: [],
                artifacts: []
            };

            // Execute test categories in priority order
            for (const [categoryKey, category] of Object.entries(this.testCategories)) {
                if (category.enabled) {
                    this.logger.info(`📋 Executing ${category.name}...`);
                    results.categories[categoryKey] = await this.runTestCategory(category);
                } else {
                    this.logger.info(`⏭️ Skipping ${category.name} (disabled)`);
                    results.categories[categoryKey] = { skipped: true, reason: 'Disabled in configuration' };
                }
            }

            results.endTime = new Date().toISOString();
            results.summary = this.generateTestSuiteSummary(results);
            results.recommendations = this.generateTestSuiteRecommendations(results);

            // Generate and save artifacts
            results.artifacts = await this.generateTestArtifacts(results);

            this.logger.info('✅ Comprehensive test suite completed');
            return results;

        } catch (error) {
            this.logger.error('❌ Test suite execution failed:', error);
            throw error;
        }
    }

    /**
     * Run smoke tests only (high priority directories)
     */
    async runSmokeTests() {
        this.logger.info('🔥 Running smoke tests for high priority directories');
        
        const category = this.testCategories.SMOKE_TESTS;
        if (!category.enabled) {
            throw new Error('Smoke testing is disabled');
        }

        return await this.runTestCategory(category);
    }

    /**
     * Run tests for a specific category
     */
    async runTestCategory(category) {
        this.logger.info(`📋 Starting ${category.name} with ${category.directories.length} directories`);
        
        const categoryResult = {
            categoryName: category.name,
            description: category.description,
            startTime: Date.now(),
            endTime: null,
            directoriesCount: category.directories.length,
            results: [],
            metrics: {
                passed: 0,
                failed: 0,
                skipped: 0,
                errors: 0
            }
        };

        try {
            // Execute tests with concurrency control
            const testPromises = this.createConcurrentTestRunner(category.directories);
            const results = await Promise.allSettled(testPromises);
            
            // Process results
            results.forEach((result, index) => {
                const directory = category.directories[index];
                
                if (result.status === 'fulfilled') {
                    categoryResult.results.push(result.value);
                    this.updateCategoryMetrics(categoryResult.metrics, result.value);
                } else {
                    const errorResult = this.createErrorTestResult(directory, result.reason);
                    categoryResult.results.push(errorResult);
                    categoryResult.metrics.errors++;
                }
            });

            categoryResult.endTime = Date.now();
            this.logger.info(`✅ ${category.name} completed: ${categoryResult.metrics.passed}/${categoryResult.directoriesCount} passed`);
            
            return categoryResult;

        } catch (error) {
            this.logger.error(`❌ ${category.name} failed:`, error);
            categoryResult.endTime = Date.now();
            categoryResult.error = error.message;
            return categoryResult;
        }
    }

    /**
     * Create concurrent test runner with queue management
     */
    createConcurrentTestRunner(directories) {
        const semaphore = new Semaphore(this.testConfig.maxConcurrentTests);
        
        return directories.map(directory => 
            semaphore.acquire().then(async (release) => {
                try {
                    this.metrics.testsInProgress++;
                    this.logger.debug(`🔄 Starting test for ${directory.name}`);
                    
                    const result = await this.runDirectoryTestWithRetry(directory);
                    
                    this.metrics.testsCompleted++;
                    this.metrics.testsInProgress--;
                    this.logger.debug(`✅ Completed test for ${directory.name}`);
                    
                    return result;
                } finally {
                    release();
                }
            })
        );
    }

    /**
     * Run directory test with retry logic
     */
    async runDirectoryTestWithRetry(directory) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.testConfig.retryAttempts + 1; attempt++) {
            try {
                if (attempt > 1) {
                    this.logger.info(`🔄 Retry attempt ${attempt - 1} for ${directory.name}`);
                    await this.delay(this.testConfig.retryDelay);
                }
                
                const result = await this.runDirectoryTest(directory);
                
                if (attempt > 1) {
                    result.retryAttempts = attempt - 1;
                    this.logger.info(`✅ ${directory.name} succeeded on retry ${attempt - 1}`);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                this.logger.warn(`⚠️ Test attempt ${attempt} failed for ${directory.name}: ${error.message}`);
            }
        }
        
        // All retries failed
        this.logger.error(`❌ All retry attempts failed for ${directory.name}`);
        throw lastError;
    }

    /**
     * Run test for individual directory
     */
    async runDirectoryTest(directory) {
        const testStartTime = Date.now();
        
        try {
            // Set timeout for individual test
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Test timeout')), this.testConfig.timeout)
            );
            
            const testPromise = this.validator.validateDirectory(directory);
            const result = await Promise.race([testPromise, timeoutPromise]);
            
            const executionTime = Date.now() - testStartTime;
            result.testExecutionTime = executionTime;
            
            // Add test suite specific metadata
            result.testSuiteMetadata = {
                suiteVersion: '1.0.0',
                testEnvironment: this.getTestEnvironment(),
                executionContext: 'automated-suite',
                timestamp: new Date().toISOString()
            };
            
            return result;
            
        } catch (error) {
            const executionTime = Date.now() - testStartTime;
            
            return this.createErrorTestResult(directory, error, executionTime);
        }
    }

    createErrorTestResult(directory, error, executionTime = 0) {
        return {
            directoryId: directory.id,
            directoryName: directory.name,
            url: directory.url,
            submissionUrl: directory.submissionUrl,
            overallStatus: 'error',
            error: error.message || error.toString(),
            testExecutionTime: executionTime,
            timestamp: new Date().toISOString(),
            testResults: {},
            metrics: { totalTests: 0, passed: 0, failed: 1, skipped: 0 }
        };
    }

    updateCategoryMetrics(metrics, result) {
        switch (result.overallStatus) {
            case 'passed':
                metrics.passed++;
                break;
            case 'failed':
                metrics.failed++;
                break;
            case 'skipped':
                metrics.skipped++;
                break;
            case 'error':
                metrics.errors++;
                break;
        }
    }

    /**
     * Generate test suite summary
     */
    generateTestSuiteSummary(results) {
        const totalTests = Object.values(results.categories)
            .reduce((sum, cat) => sum + (cat.directoriesCount || 0), 0);
        
        const totalPassed = Object.values(results.categories)
            .reduce((sum, cat) => sum + (cat.metrics?.passed || 0), 0);
        
        const totalFailed = Object.values(results.categories)
            .reduce((sum, cat) => sum + (cat.metrics?.failed || 0), 0);
        
        const totalSkipped = Object.values(results.categories)
            .reduce((sum, cat) => sum + (cat.metrics?.skipped || 0), 0);

        const totalExecutionTime = Object.values(results.categories)
            .reduce((sum, cat) => sum + ((cat.endTime || 0) - (cat.startTime || 0)), 0);

        return {
            totalDirectories: this.validator.masterDirectories.length,
            totalTests: totalTests,
            passed: totalPassed,
            failed: totalFailed,
            skipped: totalSkipped,
            errors: Object.values(results.categories)
                .reduce((sum, cat) => sum + (cat.metrics?.errors || 0), 0),
            successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
            totalExecutionTime: totalExecutionTime,
            averageExecutionTime: totalTests > 0 ? Math.round(totalExecutionTime / totalTests) : 0,
            categoriesExecuted: Object.keys(results.categories).length,
            testEnvironment: this.getTestEnvironment()
        };
    }

    /**
     * Generate recommendations based on test results
     */
    generateTestSuiteRecommendations(results) {
        const recommendations = [];
        
        // Analyze failure patterns
        const failurePatterns = this.analyzeFailurePatterns(results);
        if (failurePatterns.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Reliability',
                issue: `${failurePatterns.length} common failure patterns identified`,
                action: 'Review and fix systematic issues in directory configurations',
                patterns: failurePatterns
            });
        }

        // Performance recommendations
        const performanceIssues = this.identifyPerformanceIssues(results);
        if (performanceIssues.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'Performance', 
                issue: `${performanceIssues.length} directories have performance issues`,
                action: 'Optimize slow-loading directories or adjust timeout settings',
                directories: performanceIssues
            });
        }

        // Test coverage recommendations
        const coverageGaps = this.identifyCoverageGaps(results);
        if (coverageGaps.length > 0) {
            recommendations.push({
                priority: 'low',
                category: 'Coverage',
                issue: `${coverageGaps.length} test coverage gaps identified`,
                action: 'Expand test coverage for identified areas',
                gaps: coverageGaps
            });
        }

        return recommendations;
    }

    analyzeFailurePatterns(results) {
        const patterns = new Map();
        
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    if (result.overallStatus === 'failed' || result.overallStatus === 'error') {
                        // Extract failure patterns
                        const errorType = result.error || 'Unknown';
                        const key = errorType.substring(0, 50); // Group similar errors
                        
                        if (!patterns.has(key)) {
                            patterns.set(key, {
                                pattern: key,
                                count: 0,
                                directories: []
                            });
                        }
                        
                        patterns.get(key).count++;
                        patterns.get(key).directories.push(result.directoryId);
                    }
                });
            }
        });
        
        // Return patterns that affect multiple directories
        return Array.from(patterns.values())
            .filter(p => p.count >= 3)
            .sort((a, b) => b.count - a.count);
    }

    identifyPerformanceIssues(results) {
        const slowDirectories = [];
        
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    if (result.testExecutionTime > 10000) { // 10+ seconds
                        slowDirectories.push({
                            id: result.directoryId,
                            name: result.directoryName,
                            executionTime: result.testExecutionTime
                        });
                    }
                });
            }
        });
        
        return slowDirectories.sort((a, b) => b.executionTime - a.executionTime);
    }

    identifyCoverageGaps(results) {
        const gaps = [];
        
        // Check for untested directories
        const testedDirectories = new Set();
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    testedDirectories.add(result.directoryId);
                });
            }
        });
        
        const untestedCount = this.validator.masterDirectories.length - testedDirectories.size;
        if (untestedCount > 0) {
            gaps.push({
                type: 'Untested Directories',
                count: untestedCount,
                description: `${untestedCount} directories were not tested in this suite`
            });
        }
        
        // Check for test category gaps
        const enabledCategories = Object.values(this.testCategories).filter(cat => cat.enabled).length;
        const totalCategories = Object.keys(this.testCategories).length;
        
        if (enabledCategories < totalCategories) {
            gaps.push({
                type: 'Test Category Coverage',
                count: totalCategories - enabledCategories,
                description: `${totalCategories - enabledCategories} test categories disabled`
            });
        }
        
        return gaps;
    }

    /**
     * Generate test artifacts
     */
    async generateTestArtifacts(results) {
        const artifacts = [];
        
        try {
            // Generate detailed JSON report
            const jsonReport = await this.reportGenerator.generateJSONReport(results);
            artifacts.push({
                type: 'json',
                name: 'detailed-test-report.json',
                description: 'Comprehensive test results in JSON format',
                content: jsonReport
            });

            // Generate CSV summary
            const csvReport = await this.reportGenerator.generateCSVReport(results);
            artifacts.push({
                type: 'csv',
                name: 'test-results-summary.csv',
                description: 'Test results summary for spreadsheet analysis',
                content: csvReport
            });

            // Generate HTML dashboard
            const htmlReport = await this.reportGenerator.generateHTMLDashboard(results);
            artifacts.push({
                type: 'html',
                name: 'test-dashboard.html',
                description: 'Interactive test results dashboard',
                content: htmlReport
            });

            // Generate metrics report
            const metricsReport = await this.reportGenerator.generateMetricsReport(results);
            artifacts.push({
                type: 'json',
                name: 'test-metrics.json', 
                description: 'Detailed test execution metrics',
                content: metricsReport
            });

            this.logger.info(`📄 Generated ${artifacts.length} test artifacts`);
            
        } catch (error) {
            this.logger.error('❌ Error generating test artifacts:', error);
        }
        
        return artifacts;
    }

    /**
     * Utility methods
     */
    getTestEnvironment() {
        return {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Save test results to storage
     */
    async saveTestResults(results) {
        try {
            const storageKey = `test-results-${Date.now()}`;
            await chrome.storage.local.set({ [storageKey]: results });
            this.logger.info(`💾 Test results saved to storage: ${storageKey}`);
            return storageKey;
        } catch (error) {
            this.logger.error('❌ Failed to save test results:', error);
            throw error;
        }
    }

    /**
     * Load previous test results
     */
    async loadTestResults(storageKey) {
        try {
            const data = await chrome.storage.local.get([storageKey]);
            if (data[storageKey]) {
                this.logger.info(`📄 Loaded test results: ${storageKey}`);
                return data[storageKey];
            } else {
                throw new Error(`Test results not found: ${storageKey}`);
            }
        } catch (error) {
            this.logger.error('❌ Failed to load test results:', error);
            throw error;
        }
    }

    /**
     * Compare test results
     */
    async compareTestResults(currentResults, previousStorageKey) {
        try {
            const previousResults = await this.loadTestResults(previousStorageKey);
            const comparison = this.reportGenerator.compareTestRuns(previousResults, currentResults);
            
            this.logger.info('📊 Test comparison completed');
            return comparison;
        } catch (error) {
            this.logger.error('❌ Failed to compare test results:', error);
            throw error;
        }
    }
}

/**
 * Semaphore for controlling concurrent test execution
 */
class Semaphore {
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
        this.currentCount = 0;
        this.waitingQueue = [];
    }

    acquire() {
        return new Promise((resolve) => {
            if (this.currentCount < this.maxConcurrent) {
                this.currentCount++;
                resolve(() => this.release());
            } else {
                this.waitingQueue.push(() => {
                    this.currentCount++;
                    resolve(() => this.release());
                });
            }
        });
    }

    release() {
        this.currentCount--;
        if (this.waitingQueue.length > 0) {
            const next = this.waitingQueue.shift();
            next();
        }
    }
}

/**
 * Test Report Generator
 */
class TestReportGenerator {
    constructor() {
        this.templateCache = new Map();
    }

    async generateJSONReport(results) {
        return JSON.stringify(results, null, 2);
    }

    async generateCSVReport(results) {
        const headers = [
            'Category', 'Directory ID', 'Directory Name', 'Priority', 'Status', 
            'Execution Time (ms)', 'URL Accessible', 'Forms Detected', 'Field Mappings Valid',
            'Anti-bot Protection', 'Login Required', 'Recommendations Count'
        ];
        
        let csv = headers.join(',') + '\n';
        
        Object.entries(results.categories).forEach(([categoryKey, category]) => {
            if (category.results) {
                category.results.forEach(result => {
                    const row = [
                        categoryKey,
                        result.directoryId,
                        `"${result.directoryName}"`,
                        this.getDirectoryPriority(result.directoryId),
                        result.overallStatus,
                        result.testExecutionTime || 0,
                        this.getTestStatus(result.testResults?.URL_ACCESSIBILITY),
                        this.getTestStatus(result.testResults?.FORM_STRUCTURE),
                        this.getTestStatus(result.testResults?.FIELD_SELECTORS),
                        this.getTestStatus(result.testResults?.SKIP_LOGIC),
                        result.skipReason || 'N/A',
                        (result.recommendations || []).length
                    ];
                    csv += row.join(',') + '\n';
                });
            }
        });
        
        return csv;
    }

    async generateHTMLDashboard(results) {
        const template = `
<!DOCTYPE html>
<html>
<head>
    <title>Auto-Bolt Test Suite Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-card h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; text-transform: uppercase; }
        .metric-value { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .metric-passed { color: #4caf50; }
        .metric-failed { color: #f44336; }
        .metric-skipped { color: #ff9800; }
        .metric-neutral { color: #2196f3; }
        .section { background: white; margin-bottom: 30px; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #dee2e6; }
        .section-header h2 { margin: 0; color: #495057; }
        .section-content { padding: 20px; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .category-card { border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; }
        .category-card h4 { margin: 0 0 15px 0; color: #495057; }
        .progress-bar { background: #e9ecef; height: 8px; border-radius: 4px; margin: 10px 0; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 15px; margin: 10px 0; }
        .recommendation-high { border-left: 4px solid #dc3545; }
        .recommendation-medium { border-left: 4px solid #ffc107; }
        .recommendation-low { border-left: 4px solid #28a745; }
        .directory-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .directory-table th, .directory-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .directory-table th { background: #f8f9fa; font-weight: 600; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-skipped { background: #fff3cd; color: #856404; }
        .status-error { background: #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Auto-Bolt Test Suite Dashboard</h1>
        <p>Comprehensive validation results for ${results.summary.totalDirectories} directories</p>
        <p>Generated: ${new Date(results.startTime).toLocaleString()}</p>
    </div>

    <div class="summary-grid">
        <div class="metric-card">
            <h3>Total Tests</h3>
            <div class="metric-value metric-neutral">${results.summary.totalTests}</div>
        </div>
        <div class="metric-card">
            <h3>Passed</h3>
            <div class="metric-value metric-passed">${results.summary.passed}</div>
        </div>
        <div class="metric-card">
            <h3>Failed</h3>
            <div class="metric-value metric-failed">${results.summary.failed}</div>
        </div>
        <div class="metric-card">
            <h3>Success Rate</h3>
            <div class="metric-value metric-neutral">${results.summary.successRate}%</div>
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <h2>📋 Test Categories</h2>
        </div>
        <div class="section-content">
            <div class="category-grid">
                ${Object.entries(results.categories).map(([key, category]) => `
                <div class="category-card">
                    <h4>${category.categoryName || key}</h4>
                    <p><strong>Directories:</strong> ${category.directoriesCount || 0}</p>
                    <div class="progress-bar">
                        <div class="progress-fill metric-passed" style="width: ${((category.metrics?.passed || 0) / (category.directoriesCount || 1)) * 100}%"></div>
                    </div>
                    <p><strong>Results:</strong> ${category.metrics?.passed || 0} passed, ${category.metrics?.failed || 0} failed, ${category.metrics?.skipped || 0} skipped</p>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    ${results.recommendations && results.recommendations.length > 0 ? `
    <div class="section">
        <div class="section-header">
            <h2>💡 Recommendations</h2>
        </div>
        <div class="section-content">
            ${results.recommendations.map(rec => `
            <div class="recommendations recommendation-${rec.priority}">
                <strong>${rec.priority.toUpperCase()}:</strong> ${rec.issue}<br>
                <em>Action:</em> ${rec.action}
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-header">
            <h2>📊 Detailed Results</h2>
        </div>
        <div class="section-content">
            <table class="directory-table">
                <thead>
                    <tr>
                        <th>Directory</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Execution Time</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateDirectoryRows(results)}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Add interactivity
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Test Dashboard Loaded');
            
            // Add click handlers for expandable sections
            document.querySelectorAll('.directory-table tr').forEach(row => {
                row.addEventListener('click', function() {
                    // Could expand to show more details
                });
            });
        });
    </script>
</body>
</html>`;
        
        return template;
    }

    generateDirectoryRows(results) {
        let rows = '';
        
        Object.entries(results.categories).forEach(([categoryKey, category]) => {
            if (category.results) {
                category.results.forEach(result => {
                    const issueCount = (result.recommendations || []).length;
                    rows += `
                    <tr>
                        <td><strong>${result.directoryName}</strong><br><small>${result.directoryId}</small></td>
                        <td>${categoryKey}</td>
                        <td><span class="status-badge status-${result.overallStatus}">${result.overallStatus}</span></td>
                        <td>${result.testExecutionTime || 0}ms</td>
                        <td>${issueCount > 0 ? `${issueCount} issues` : 'None'}</td>
                    </tr>`;
                });
            }
        });
        
        return rows;
    }

    async generateMetricsReport(results) {
        const metrics = {
            executionMetrics: {
                totalExecutionTime: results.summary.totalExecutionTime,
                averageExecutionTime: results.summary.averageExecutionTime,
                slowestTests: this.findSlowestTests(results),
                fastestTests: this.findFastestTests(results)
            },
            reliabilityMetrics: {
                successRate: results.summary.successRate,
                failureRate: Math.round((results.summary.failed / results.summary.totalTests) * 100),
                retryRate: this.calculateRetryRate(results),
                timeoutRate: this.calculateTimeoutRate(results)
            },
            categoryMetrics: this.calculateCategoryMetrics(results),
            trendAnalysis: this.generateTrendAnalysis(results)
        };
        
        return JSON.stringify(metrics, null, 2);
    }

    findSlowestTests(results) {
        const allTests = [];
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    if (result.testExecutionTime) {
                        allTests.push({
                            directory: result.directoryName,
                            executionTime: result.testExecutionTime
                        });
                    }
                });
            }
        });
        
        return allTests
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, 10);
    }

    findFastestTests(results) {
        const allTests = [];
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    if (result.testExecutionTime) {
                        allTests.push({
                            directory: result.directoryName,
                            executionTime: result.testExecutionTime
                        });
                    }
                });
            }
        });
        
        return allTests
            .sort((a, b) => a.executionTime - b.executionTime)
            .slice(0, 10);
    }

    calculateRetryRate(results) {
        let totalTests = 0;
        let retriedTests = 0;
        
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    totalTests++;
                    if (result.retryAttempts > 0) {
                        retriedTests++;
                    }
                });
            }
        });
        
        return totalTests > 0 ? Math.round((retriedTests / totalTests) * 100) : 0;
    }

    calculateTimeoutRate(results) {
        let totalTests = 0;
        let timeoutTests = 0;
        
        Object.values(results.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    totalTests++;
                    if (result.error && result.error.includes('timeout')) {
                        timeoutTests++;
                    }
                });
            }
        });
        
        return totalTests > 0 ? Math.round((timeoutTests / totalTests) * 100) : 0;
    }

    calculateCategoryMetrics(results) {
        const metrics = {};
        
        Object.entries(results.categories).forEach(([key, category]) => {
            metrics[key] = {
                name: category.categoryName || key,
                executionTime: category.endTime - category.startTime,
                successRate: category.directoriesCount > 0 
                    ? Math.round((category.metrics.passed / category.directoriesCount) * 100) 
                    : 0,
                averageTestTime: category.directoriesCount > 0 
                    ? Math.round((category.endTime - category.startTime) / category.directoriesCount)
                    : 0
            };
        });
        
        return metrics;
    }

    generateTrendAnalysis(results) {
        // This would compare against historical data
        // For now, return placeholder analysis
        return {
            message: 'Trend analysis requires historical test data',
            recommendations: [
                'Run tests regularly to establish performance baselines',
                'Track success rates over time to identify regressions',
                'Monitor execution time trends to detect performance degradation'
            ]
        };
    }

    compareTestRuns(previousResults, currentResults) {
        const comparison = {
            summary: {
                previousDate: previousResults.startTime,
                currentDate: currentResults.startTime,
                successRateChange: currentResults.summary.successRate - previousResults.summary.successRate,
                executionTimeChange: currentResults.summary.totalExecutionTime - previousResults.summary.totalExecutionTime,
                testsCountChange: currentResults.summary.totalTests - previousResults.summary.totalTests
            },
            improvements: [],
            regressions: [],
            newIssues: [],
            resolvedIssues: []
        };

        // Compare directory results
        const previousDirs = new Map();
        const currentDirs = new Map();

        Object.values(previousResults.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    previousDirs.set(result.directoryId, result);
                });
            }
        });

        Object.values(currentResults.categories).forEach(category => {
            if (category.results) {
                category.results.forEach(result => {
                    currentDirs.set(result.directoryId, result);
                    
                    const previous = previousDirs.get(result.directoryId);
                    if (previous) {
                        if (previous.overallStatus !== result.overallStatus) {
                            if (result.overallStatus === 'passed' && previous.overallStatus !== 'passed') {
                                comparison.improvements.push({
                                    directory: result.directoryName,
                                    change: `${previous.overallStatus} → ${result.overallStatus}`
                                });
                            } else if (result.overallStatus !== 'passed' && previous.overallStatus === 'passed') {
                                comparison.regressions.push({
                                    directory: result.directoryName,
                                    change: `${previous.overallStatus} → ${result.overallStatus}`,
                                    error: result.error
                                });
                            }
                        }
                    } else {
                        // New directory
                        if (result.overallStatus !== 'passed') {
                            comparison.newIssues.push({
                                directory: result.directoryName,
                                status: result.overallStatus,
                                error: result.error
                            });
                        }
                    }
                });
            }
        });

        // Check for resolved issues
        previousDirs.forEach((previous, directoryId) => {
            if (!currentDirs.has(directoryId) && previous.overallStatus !== 'passed') {
                comparison.resolvedIssues.push({
                    directory: previous.directoryName,
                    previousStatus: previous.overallStatus
                });
            }
        });

        return comparison;
    }

    getTestStatus(testResult) {
        if (!testResult) return 'not-tested';
        return testResult.status || 'unknown';
    }

    getDirectoryPriority(directoryId) {
        // This would look up the directory priority from the master list
        return 'unknown'; // Placeholder
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoBoltTestSuite, TestReportGenerator };
} else {
    window.AutoBoltTestSuite = AutoBoltTestSuite;
    window.TestReportGenerator = TestReportGenerator;
}