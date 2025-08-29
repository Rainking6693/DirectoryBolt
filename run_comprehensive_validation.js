#!/usr/bin/env node

/**
 * COMPREHENSIVE VALIDATION TEST RUNNER
 * ===================================
 * 
 * Master script to run all comprehensive validation tests for agent fixes.
 * This script provides different execution modes and handles dependencies.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveValidationRunner {
    constructor() {
        this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
        this.mode = process.argv[2] || 'full';
        this.verbose = process.argv.includes('--verbose') || process.env.VERBOSE === 'true';
        
        this.testSuites = {
            security: './security_vulnerability_validation.js',
            stripe: './stripe_payment_flow_validation.js',
            comprehensive: './comprehensive_post_fix_validation_suite.js',
            master: './comprehensive_agent_fix_validator.js'
        };
    }

    async run() {
        console.log('🚀 COMPREHENSIVE VALIDATION TEST RUNNER');
        console.log('======================================');
        console.log(`Mode: ${this.mode}`);
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`Verbose: ${this.verbose}\n`);

        try {
            // Check prerequisites
            await this.checkPrerequisites();
            
            // Run tests based on mode
            switch (this.mode) {
                case 'security':
                    await this.runSecurityTests();
                    break;
                case 'stripe':
                    await this.runStripeTests();
                    break;
                case 'quick':
                    await this.runQuickValidation();
                    break;
                case 'full':
                default:
                    await this.runFullValidation();
                    break;
            }
            
        } catch (error) {
            console.error('❌ Validation runner failed:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking Prerequisites...');
        
        // Check if test files exist
        const missingFiles = [];
        Object.entries(this.testSuites).forEach(([name, file]) => {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        });
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing test files: ${missingFiles.join(', ')}`);
        }
        
        // Check if application is running (for integration tests)
        if (this.mode === 'full' || this.mode === 'quick') {
            try {
                const response = await fetch(this.baseUrl, { timeout: 5000 });
                console.log(`✅ Application is running at ${this.baseUrl}`);
            } catch (error) {
                console.log(`⚠️  Application may not be running at ${this.baseUrl}`);
                console.log('   Some integration tests may fail');
            }
        }
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`✅ Node.js version: ${nodeVersion}`);
        
        // Check for required dependencies
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = ['puppeteer'];
        
        const missingDeps = requiredDeps.filter(dep => 
            !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
        );
        
        if (missingDeps.length > 0) {
            console.log(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
            console.log('   Some tests may fail');
        }
        
        console.log('✅ Prerequisites check completed\n');
    }

    async runSecurityTests() {
        console.log('🛡️  Running Security Vulnerability Validation...\n');
        return this.executeTestSuite(this.testSuites.security);
    }

    async runStripeTests() {
        console.log('💳 Running Stripe Payment Flow Validation...\n');
        return this.executeTestSuite(this.testSuites.stripe);
    }

    async runQuickValidation() {
        console.log('⚡ Running Quick Validation (Security + Stripe)...\n');
        
        const results = [];
        
        try {
            console.log('1️⃣  Security Tests...');
            const securityResult = await this.executeTestSuite(this.testSuites.security);
            results.push({ name: 'Security', success: securityResult === 0 });
        } catch (error) {
            results.push({ name: 'Security', success: false, error: error.message });
        }
        
        try {
            console.log('\n2️⃣  Stripe Integration Tests...');
            const stripeResult = await this.executeTestSuite(this.testSuites.stripe);
            results.push({ name: 'Stripe', success: stripeResult === 0 });
        } catch (error) {
            results.push({ name: 'Stripe', success: false, error: error.message });
        }
        
        this.printQuickResults(results);
        
        const allPassed = results.every(r => r.success);
        process.exit(allPassed ? 0 : 1);
    }

    async runFullValidation() {
        console.log('🔄 Running Full Comprehensive Validation...\n');
        
        // Run the master comprehensive validator
        return this.executeTestSuite(this.testSuites.master);
    }

    async executeTestSuite(testFile) {
        return new Promise((resolve, reject) => {
            const testProcess = spawn('node', [testFile], {
                stdio: this.verbose ? 'inherit' : ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    TEST_BASE_URL: this.baseUrl,
                    VERBOSE: this.verbose.toString()
                }
            });

            let stdout = '';
            let stderr = '';

            if (!this.verbose) {
                testProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                testProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            testProcess.on('close', (code) => {
                if (!this.verbose && (stdout || stderr)) {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(stderr);
                }

                if (code === 0) {
                    console.log(`✅ Test suite completed successfully`);
                    resolve(code);
                } else {
                    console.log(`❌ Test suite failed with exit code ${code}`);
                    resolve(code); // Don't reject, let caller handle
                }
            });

            testProcess.on('error', (error) => {
                console.error(`❌ Failed to run test suite: ${error.message}`);
                reject(error);
            });
        });
    }

    printQuickResults(results) {
        console.log('\n📊 QUICK VALIDATION RESULTS');
        console.log('===========================');
        
        results.forEach(result => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${result.name}: ${status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        const passedCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        console.log(`\nOverall: ${passedCount}/${totalCount} test suites passed`);
        
        if (passedCount === totalCount) {
            console.log('🎉 All quick validation tests passed!');
        } else {
            console.log('⚠️  Some validation tests failed. Run full validation for details.');
        }
    }

    showUsage() {
        console.log(`
COMPREHENSIVE VALIDATION TEST RUNNER
====================================

Usage: node run_comprehensive_validation.js [mode] [options]

Modes:
  full        Run all comprehensive validation tests (default)
  quick       Run security and stripe tests only
  security    Run security vulnerability validation only
  stripe      Run stripe payment flow validation only

Options:
  --verbose   Show detailed output from all tests

Environment Variables:
  TEST_BASE_URL   Base URL for testing (default: http://localhost:3000)
  VERBOSE         Enable verbose output (true/false)

Examples:
  node run_comprehensive_validation.js
  node run_comprehensive_validation.js quick --verbose
  TEST_BASE_URL=http://localhost:3001 node run_comprehensive_validation.js security
        `);
    }
}

// Handle command line execution
if (require.main === module) {
    const runner = new ComprehensiveValidationRunner();
    
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        runner.showUsage();
        process.exit(0);
    }
    
    runner.run().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = ComprehensiveValidationRunner;