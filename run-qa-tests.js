#!/usr/bin/env node

/**
 * Auto-Bolt QA Test Runner
 * Command-line interface for running comprehensive directory validation
 * 
 * Usage:
 *   node run-qa-tests.js [options]
 *   
 * Options:
 *   --type=all|smoke|validation     Test type to run (default: all)
 *   --format=json|csv|html          Output format (default: json)
 *   --output=<filename>              Output file (optional)
 *   --concurrent=<number>            Max concurrent tests (default: 5)
 *   --timeout=<number>               Test timeout in ms (default: 30000)
 *   --priority=high|medium|low       Filter by priority (optional)
 *   --category=<category>            Filter by category (optional)
 *   --verbose                        Enable verbose logging
 *   --help                          Show this help message
 */

class QATestRunner {
    constructor() {
        this.args = this.parseArguments();
        this.config = {
            testType: this.args.type || 'all',
            outputFormat: this.args.format || 'json',
            outputFile: this.args.output,
            maxConcurrent: parseInt(this.args.concurrent) || 5,
            timeout: parseInt(this.args.timeout) || 30000,
            priorityFilter: this.args.priority,
            categoryFilter: this.args.category,
            verbose: this.args.verbose || false
        };
        
        this.startTime = Date.now();
        this.results = null;
        this.logger = new ConsoleLogger(this.config.verbose);
    }

    parseArguments() {
        const args = {};
        process.argv.slice(2).forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, value] = arg.substring(2).split('=');
                args[key] = value === undefined ? true : value;
            }
        });
        return args;
    }

    async run() {
        try {
            if (this.args.help) {
                this.showHelp();
                return;
            }

            this.logger.info('🚀 Auto-Bolt QA Test Runner Starting');
            this.logger.info(`📋 Configuration: ${JSON.stringify(this.config, null, 2)}`);

            // Validate environment
            await this.validateEnvironment();

            // Initialize components
            await this.initialize();

            // Run tests based on type
            switch (this.config.testType) {
                case 'smoke':
                    this.results = await this.runSmokeTests();
                    break;
                case 'validation':
                    this.results = await this.runValidationTests();
                    break;
                case 'all':
                default:
                    this.results = await this.runAllTests();
                    break;
            }

            // Generate and output results
            await this.outputResults();

            // Show summary
            this.showSummary();

            this.logger.info('✅ QA Test Runner completed successfully');
            process.exit(0);

        } catch (error) {
            this.logger.error(`❌ Test runner failed: ${error.message}`);
            if (this.config.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    async validateEnvironment() {
        this.logger.info('🔍 Validating environment...');
        
        // Check if we're in the correct directory
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync('directories/master-directory-list.json')) {
            throw new Error('master-directory-list.json not found. Please run from the auto-bolt-extension directory.');
        }
        
        if (!fs.existsSync('qa-validation-system.js')) {
            throw new Error('qa-validation-system.js not found. Please ensure all QA files are present.');
        }

        this.logger.info('✅ Environment validation passed');
    }

    async initialize() {
        this.logger.info('🏗️ Initializing QA components...');

        // Load required modules
        const fs = require('fs');
        
        // Since we're in Node.js, we need to create mock browser APIs
        this.setupMockBrowserAPIs();
        
        // Load the QA modules
        require('./qa-validation-system.js');
        require('./automated-test-suite.js');
        
        // Initialize validator
        this.validator = new global.DirectoryQAValidator();
        await this.validator.init();
        
        // Initialize test suite
        this.testSuite = new global.AutoBoltTestSuite();
        this.testSuite.testConfig.maxConcurrentTests = this.config.maxConcurrent;
        this.testSuite.testConfig.timeout = this.config.timeout;
        await this.testSuite.initialize();

        this.logger.info('✅ QA components initialized');
    }

    setupMockBrowserAPIs() {
        // Mock fetch for Node.js environment
        const fetch = require('node-fetch');
        global.fetch = fetch;
        
        // Mock document for selector validation
        global.document = {
            querySelector: (selector) => {
                // Basic CSS selector validation
                try {
                    // This is a simplified validation - real browsers are more forgiving
                    if (!selector || typeof selector !== 'string') {
                        throw new Error('Invalid selector');
                    }
                    return null; // We don't actually need to find elements
                } catch (error) {
                    throw new Error('Invalid CSS selector syntax');
                }
            }
        };
        
        // Mock chrome storage API
        global.chrome = {
            storage: {
                local: {
                    get: async (keys) => ({}),
                    set: async (data) => {},
                    clear: async () => {}
                }
            }
        };
    }

    async runSmokeTests() {
        this.logger.info('🔥 Running smoke tests...');
        
        const highPriorityDirs = this.validator.masterDirectories.filter(dir => dir.priority === 'high');
        this.logger.info(`📊 Testing ${highPriorityDirs.length} high-priority directories`);
        
        return await this.testSuite.runTestCategory({
            name: 'Smoke Tests',
            description: 'High-priority directory validation',
            directories: highPriorityDirs,
            enabled: true
        });
    }

    async runValidationTests() {
        this.logger.info('🔍 Running directory validation tests...');
        
        let directories = this.validator.masterDirectories;
        
        // Apply filters
        if (this.config.priorityFilter) {
            directories = directories.filter(dir => dir.priority === this.config.priorityFilter);
            this.logger.info(`📋 Filtered to ${directories.length} ${this.config.priorityFilter}-priority directories`);
        }
        
        if (this.config.categoryFilter) {
            directories = directories.filter(dir => dir.category === this.config.categoryFilter);
            this.logger.info(`📋 Filtered to ${directories.length} directories in ${this.config.categoryFilter} category`);
        }
        
        return await this.validator.validateAllDirectories();
    }

    async runAllTests() {
        this.logger.info('🎯 Running comprehensive test suite...');
        
        return await this.testSuite.runAllTests();
    }

    async outputResults() {
        this.logger.info(`📄 Generating ${this.config.outputFormat.toUpperCase()} report...`);
        
        let output;
        const reportGenerator = new global.TestReportGenerator();
        
        switch (this.config.outputFormat) {
            case 'csv':
                output = await reportGenerator.generateCSVReport(this.results);
                break;
            case 'html':
                output = await reportGenerator.generateHTMLDashboard(this.results);
                break;
            case 'json':
            default:
                output = JSON.stringify(this.results, null, 2);
                break;
        }
        
        if (this.config.outputFile) {
            const fs = require('fs');
            fs.writeFileSync(this.config.outputFile, output);
            this.logger.info(`💾 Results saved to: ${this.config.outputFile}`);
        } else {
            console.log(output);
        }
    }

    showSummary() {
        const executionTime = Date.now() - this.startTime;
        const summary = this.calculateSummary();
        
        console.log('\n' + '='.repeat(60));
        console.log('🤖 AUTO-BOLT QA TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Execution Time: ${Math.round(executionTime / 1000)}s`);
        console.log(`📁 Total Directories: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed} (${Math.round((summary.passed / summary.total) * 100)}%)`);
        console.log(`❌ Failed: ${summary.failed} (${Math.round((summary.failed / summary.total) * 100)}%)`);
        console.log(`⏭️  Skipped: ${summary.skipped} (${Math.round((summary.skipped / summary.total) * 100)}%)`);
        console.log(`🔥 Success Rate: ${Math.round((summary.passed / summary.total) * 100)}%`);
        
        if (summary.recommendations > 0) {
            console.log(`💡 Recommendations: ${summary.recommendations}`);
        }
        
        if (summary.criticalIssues > 0) {
            console.log(`⚠️  Critical Issues: ${summary.criticalIssues}`);
        }
        
        console.log('='.repeat(60));
        
        // Exit code based on results
        if (summary.failed > 0 || summary.criticalIssues > 0) {
            console.log('⚠️  Some tests failed - check results for details');
            process.exitCode = 1;
        } else if (summary.passed === 0) {
            console.log('⚠️  No tests passed - possible configuration issue');
            process.exitCode = 2;
        } else {
            console.log('🎉 All tests completed successfully!');
        }
    }

    calculateSummary() {
        if (!this.results) {
            return { total: 0, passed: 0, failed: 0, skipped: 0, recommendations: 0, criticalIssues: 0 };
        }
        
        let total = 0, passed = 0, failed = 0, skipped = 0;
        let recommendations = 0, criticalIssues = 0;
        
        // Handle different result structures
        if (this.results.directories) {
            // Validation results
            this.results.directories.forEach(dir => {
                total++;
                switch (dir.overallStatus) {
                    case 'passed': passed++; break;
                    case 'failed': case 'error': 
                        failed++;
                        if (dir.testResults?.URL_ACCESSIBILITY?.status === 'failed' ||
                            dir.testResults?.FIELD_SELECTORS?.status === 'failed') {
                            criticalIssues++;
                        }
                        break;
                    case 'skipped': case 'warning': skipped++; break;
                }
                recommendations += (dir.recommendations?.length || 0);
            });
        } else if (this.results.categories) {
            // Test suite results
            Object.values(this.results.categories).forEach(category => {
                if (category.results) {
                    category.results.forEach(dir => {
                        total++;
                        switch (dir.overallStatus) {
                            case 'passed': passed++; break;
                            case 'failed': case 'error': 
                                failed++;
                                if (dir.error && dir.error.includes('URL') || dir.error.includes('timeout')) {
                                    criticalIssues++;
                                }
                                break;
                            case 'skipped': case 'warning': skipped++; break;
                        }
                        recommendations += (dir.recommendations?.length || 0);
                    });
                }
            });
            
            recommendations += (this.results.recommendations?.length || 0);
        } else if (this.results.results) {
            // Single category result
            this.results.results.forEach(dir => {
                total++;
                switch (dir.overallStatus) {
                    case 'passed': passed++; break;
                    case 'failed': case 'error': failed++; break;
                    case 'skipped': case 'warning': skipped++; break;
                }
                recommendations += (dir.recommendations?.length || 0);
            });
        }
        
        return { total, passed, failed, skipped, recommendations, criticalIssues };
    }

    showHelp() {
        console.log(`
🤖 Auto-Bolt QA Test Runner

Usage: node run-qa-tests.js [options]

Options:
  --type=TYPE              Test type to run: all, smoke, validation (default: all)
  --format=FORMAT          Output format: json, csv, html (default: json)  
  --output=FILE            Output file path (default: stdout)
  --concurrent=N           Max concurrent tests (default: 5)
  --timeout=MS             Test timeout in milliseconds (default: 30000)
  --priority=PRIORITY      Filter by priority: high, medium, low
  --category=CATEGORY      Filter by category name
  --verbose                Enable verbose logging
  --help                   Show this help message

Examples:
  node run-qa-tests.js --type=smoke --format=html --output=smoke-report.html
  node run-qa-tests.js --type=validation --priority=high --verbose
  node run-qa-tests.js --format=csv --output=results.csv
  node run-qa-tests.js --category=search-engines --concurrent=3

Test Types:
  all          Run complete test suite with all validation categories
  smoke        Run smoke tests on high-priority directories only  
  validation   Run directory validation tests (URL, forms, selectors)

Output Formats:
  json         Detailed JSON report with all test data
  csv          CSV format suitable for spreadsheet analysis
  html         Interactive HTML dashboard with visualizations

Exit Codes:
  0            All tests passed
  1            Some tests failed
  2            No tests passed (configuration issue)
        `);
    }
}

/**
 * Console Logger with colored output
 */
class ConsoleLogger {
    constructor(verbose = false) {
        this.verbose = verbose;
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    log(level, message, color = 'white') {
        const timestamp = new Date().toISOString();
        const colorCode = this.colors[color] || this.colors.white;
        console.log(`${colorCode}[${timestamp}] [${level}] ${message}${this.colors.reset}`);
    }

    error(message) {
        this.log('ERROR', message, 'red');
    }

    warn(message) {
        this.log('WARN', message, 'yellow');
    }

    info(message) {
        this.log('INFO', message, 'blue');
    }

    debug(message) {
        if (this.verbose) {
            this.log('DEBUG', message, 'cyan');
        }
    }

    success(message) {
        this.log('SUCCESS', message, 'green');
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new QATestRunner();
    runner.run();
}

module.exports = QATestRunner;