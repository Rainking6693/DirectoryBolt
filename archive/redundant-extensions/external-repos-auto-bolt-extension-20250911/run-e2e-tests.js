/**
 * Command Line Runner for Auto-Bolt E2E Tests
 * Usage: node run-e2e-tests.js [options]
 */

const AutoBoltE2EAutomation = require('./e2e-automation-test');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
    constructor() {
        this.options = {
            verbose: false,
            generateReport: true,
            testTimeout: 300000, // 5 minutes
            outputDir: './test-results',
            logLevel: 'INFO'
        };
    }

    /**
     * Parse command line arguments
     */
    parseArguments() {
        const args = process.argv.slice(2);
        
        args.forEach((arg, index) => {
            switch (arg) {
                case '--verbose':
                case '-v':
                    this.options.verbose = true;
                    break;
                case '--no-report':
                    this.options.generateReport = false;
                    break;
                case '--timeout':
                    this.options.testTimeout = parseInt(args[index + 1]) * 1000;
                    break;
                case '--output-dir':
                    this.options.outputDir = args[index + 1];
                    break;
                case '--log-level':
                    this.options.logLevel = args[index + 1];
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                    break;
            }
        });
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log(`
🚀 Auto-Bolt E2E Test Runner

Usage: node run-e2e-tests.js [options]

Options:
  -v, --verbose         Enable verbose logging
  --no-report          Skip generating HTML/JSON reports
  --timeout <seconds>   Test timeout in seconds (default: 300)
  --output-dir <dir>    Output directory for test results (default: ./test-results)
  --log-level <level>   Log level: DEBUG, INFO, WARN, ERROR (default: INFO)
  -h, --help           Show this help message

Examples:
  node run-e2e-tests.js
  node run-e2e-tests.js --verbose --timeout 600
  node run-e2e-tests.js --no-report --log-level DEBUG
        `);
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        // Create output directory
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
            console.log(`📁 Created output directory: ${this.options.outputDir}`);
        }

        // Verify master directory list exists
        const masterListPath = path.join(__dirname, 'directories', 'master-directory-list.json');
        if (!fs.existsSync(masterListPath)) {
            throw new Error(`❌ Master directory list not found at: ${masterListPath}`);
        }

        console.log('✅ Test environment setup complete');
    }

    /**
     * Run E2E tests with timeout
     */
    async runTestsWithTimeout() {
        const automation = new AutoBoltE2EAutomation();
        
        // Set log level
        automation.logLevel = this.options.logLevel;

        return new Promise(async (resolve, reject) => {
            // Set timeout
            const timeoutId = setTimeout(() => {
                reject(new Error(`Test execution timed out after ${this.options.testTimeout / 1000} seconds`));
            }, this.options.testTimeout);

            try {
                console.log(`⏱️ Starting tests with ${this.options.testTimeout / 1000}s timeout`);
                
                await automation.init();
                const report = await automation.runCompleteE2ETest();
                
                clearTimeout(timeoutId);
                resolve(report);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Generate test summary
     */
    generateSummary(report) {
        const summary = `
🎯 AUTO-BOLT E2E TEST SUMMARY
════════════════════════════════════════

📊 OVERALL RESULTS
├── Total Directories: ${report.summary.totalDirectories}
├── Test Phases: ${report.summary.testPhases}
├── Successful Tests: ${report.summary.successfulTests}
├── Failed Tests: ${report.summary.failedTests}
├── Success Rate: ${report.summary.successRate}%
└── Total Duration: ${report.summary.totalDuration} seconds

📋 DIRECTORY ANALYSIS
├── Processable Directories: ${report.directoryAnalysis.processable}/${report.directoryAnalysis.totalDirectories}
├── Require Login: ${report.directoryAnalysis.requiresLogin}
├── Anti-Bot Protection: ${report.directoryAnalysis.hasAntiBot}
└── Have Submission Fees: ${report.directoryAnalysis.hasFees}

🔍 CATEGORY BREAKDOWN
${Object.entries(report.directoryAnalysis.byCategory || {})
    .map(([category, count]) => `├── ${category}: ${count} directories`)
    .join('\n')}

⚡ DIFFICULTY BREAKDOWN
${Object.entries(report.directoryAnalysis.byDifficulty || {})
    .map(([difficulty, count]) => `├── ${difficulty}: ${count} directories`)
    .join('\n')}

${report.recommendations.length > 0 ? `
💡 RECOMMENDATIONS (${report.recommendations.length})
${report.recommendations.map((rec, index) => 
    `├── [${rec.priority.toUpperCase()}] ${rec.issue}\n│   └── ${rec.recommendation}`
).join('\n')}
` : '✅ No recommendations - all tests passed!'}

════════════════════════════════════════
`;
        
        return summary;
    }

    /**
     * Save results to files
     */
    async saveResults(report, summary) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save JSON report
        const jsonPath = path.join(this.options.outputDir, `e2e-report-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        
        // Save text summary
        const summaryPath = path.join(this.options.outputDir, `e2e-summary-${timestamp}.txt`);
        fs.writeFileSync(summaryPath, summary);
        
        // Save CSV export for directories
        const csvContent = this.generateCSVReport(report);
        const csvPath = path.join(this.options.outputDir, `directory-analysis-${timestamp}.csv`);
        fs.writeFileSync(csvPath, csvContent);
        
        console.log(`📁 Results saved to:`);
        console.log(`   JSON Report: ${jsonPath}`);
        console.log(`   Summary: ${summaryPath}`);
        console.log(`   CSV Export: ${csvPath}`);
    }

    /**
     * Generate CSV report for directory analysis
     */
    generateCSVReport(report) {
        const headers = [
            'Directory ID',
            'Name',
            'Category',
            'Difficulty',
            'Priority',
            'Requires Login',
            'Has Anti-Bot',
            'Has Fees',
            'Processable'
        ];
        
        // This is a simplified CSV - in a real implementation, we'd load the actual directory data
        const csvRows = [headers.join(',')];
        
        // Add summary row
        csvRows.push([
            'SUMMARY',
            `Total: ${report.directoryAnalysis.totalDirectories}`,
            'Mixed',
            'Mixed',
            'Mixed',
            report.directoryAnalysis.requiresLogin,
            report.directoryAnalysis.hasAntiBot,
            report.directoryAnalysis.hasFees,
            report.directoryAnalysis.processable
        ].join(','));
        
        return csvRows.join('\n');
    }

    /**
     * Main execution method
     */
    async run() {
        console.log('🚀 Auto-Bolt E2E Test Runner Starting...\n');
        
        try {
            // Parse arguments
            this.parseArguments();
            
            // Setup environment
            await this.setupTestEnvironment();
            
            // Run tests
            console.log('🧪 Running E2E tests...\n');
            const startTime = Date.now();
            const report = await this.runTestsWithTimeout();
            const endTime = Date.now();
            
            // Generate summary
            const summary = this.generateSummary(report);
            console.log(summary);
            
            // Save results if requested
            if (this.options.generateReport) {
                await this.saveResults(report, summary);
            }
            
            // Final status
            const totalTime = Math.round((endTime - startTime) / 1000);
            if (report.summary.failedTests > 0) {
                console.log(`❌ E2E Tests completed with ${report.summary.failedTests} failures in ${totalTime}s`);
                process.exit(1);
            } else {
                console.log(`✅ E2E Tests completed successfully in ${totalTime}s`);
                process.exit(0);
            }
            
        } catch (error) {
            console.error(`❌ E2E Test Runner failed: ${error.message}`);
            
            if (this.options.verbose) {
                console.error('\nStack trace:');
                console.error(error.stack);
            }
            
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new E2ETestRunner();
    runner.run().catch(error => {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    });
}

module.exports = E2ETestRunner;