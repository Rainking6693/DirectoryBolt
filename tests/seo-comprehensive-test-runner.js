/**
 * Comprehensive SEO Test Runner for DirectoryBolt
 * 
 * Orchestrates all SEO testing suites including:
 * - Internal validation suite
 * - Automated validators
 * - External API validations
 * - CI/CD integration support
 * - Detailed reporting
 * 
 * Usage:
 *   node tests/seo-comprehensive-test-runner.js
 *   TEST_BASE_URL=https://directorybolt.com node tests/seo-comprehensive-test-runner.js
 *   NODE_ENV=production PAGESPEED_API_KEY=xxx node tests/seo-comprehensive-test-runner.js
 */

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Import our test suites
const SEOValidationSuite = require('./seo-validation-suite');
const SEOAutomatedValidators = require('./seo-automated-validators');
const SEOExternalValidators = require('./seo-external-validators');

class SEOComprehensiveTestRunner {
    constructor(config = {}) {
        this.config = {
            baseUrl: config.baseUrl || process.env.TEST_BASE_URL || process.env.SITE_URL || 'http://localhost:3000',
            pageSpeedApiKey: config.pageSpeedApiKey || process.env.PAGESPEED_API_KEY,
            outputDir: config.outputDir || process.env.OUTPUT_DIR || './test-results',
            runExternal: config.runExternal !== false && process.env.RUN_EXTERNAL !== 'false',
            verbose: config.verbose !== false && process.env.VERBOSE !== 'false',
            parallel: config.parallel !== false && process.env.PARALLEL !== 'false',
            timeout: config.timeout || parseInt(process.env.TIMEOUT) || 300000, // 5 minutes
            environment: config.environment || process.env.NODE_ENV || 'development'
        };

        this.results = {
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            baseUrl: this.config.baseUrl,
            config: this.config,
            suites: {},
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                errorTests: 0,
                duration: 0,
                successRate: 0
            },
            recommendations: [],
            cicdIntegration: {
                exitCode: 0,
                shouldDeploy: false,
                criticalIssues: []
            }
        };

        console.log(`🚀 SEO Comprehensive Test Runner initialized`);
        console.log(`   Environment: ${this.config.environment}`);
        console.log(`   Target URL: ${this.config.baseUrl}`);
        console.log(`   Output Dir: ${this.config.outputDir}`);
        console.log(`   External Tests: ${this.config.runExternal ? 'Enabled' : 'Disabled'}`);
        console.log(`   PageSpeed API: ${this.config.pageSpeedApiKey ? 'Configured' : 'Not configured'}`);
    }

    async runAllTests() {
        console.log('\n🎯 Starting Comprehensive SEO Testing Suite');
        console.log('='.repeat(80));
        
        const startTime = performance.now();

        try {
            // Ensure output directory exists
            this.ensureOutputDirectory();

            // Run test suites
            if (this.config.parallel) {
                await this.runTestsInParallel();
            } else {
                await this.runTestsSequentially();
            }

            // Calculate final metrics
            this.calculateSummary();
            this.generateRecommendations();
            this.determineCICDAction();

            // Generate reports
            const endTime = performance.now();
            this.results.summary.duration = Math.round(endTime - startTime);
            
            await this.generateReports();
            this.printFinalSummary();

            return this.results;

        } catch (error) {
            console.error('🚨 Test suite execution failed:', error);
            this.results.cicdIntegration.exitCode = 2;
            this.results.cicdIntegration.criticalIssues.push(`Suite execution failed: ${error.message}`);
            throw error;
        }
    }

    async runTestsSequentially() {
        console.log('🔄 Running test suites sequentially...\n');

        // 1. Internal validation suite
        await this.runInternalValidationSuite();

        // 2. Automated validators
        await this.runAutomatedValidators();

        // 3. External validators (if enabled)
        if (this.config.runExternal) {
            await this.runExternalValidators();
        } else {
            console.log('⏩ Skipping external validators (disabled)\n');
        }
    }

    async runTestsInParallel() {
        console.log('⚡ Running test suites in parallel...\n');

        const promises = [
            this.runInternalValidationSuite(),
            this.runAutomatedValidators()
        ];

        if (this.config.runExternal) {
            promises.push(this.runExternalValidators());
        }

        await Promise.allSettled(promises);
    }

    async runInternalValidationSuite() {
        console.log('📋 Running Internal Validation Suite...');
        try {
            const suite = new SEOValidationSuite({
                baseUrl: this.config.baseUrl,
                verbose: false, // We'll handle output
                timeout: 30000
            });

            const results = await suite.runAllTests();
            this.results.suites.internal = {
                name: 'Internal Validation Suite',
                status: 'completed',
                results,
                duration: results.duration || 0
            };

            console.log(`✅ Internal Suite: ${results.passed}/${results.total} tests passed\n`);

        } catch (error) {
            console.log(`❌ Internal Suite failed: ${error.message}\n`);
            this.results.suites.internal = {
                name: 'Internal Validation Suite',
                status: 'error',
                error: error.message,
                duration: 0
            };
        }
    }

    async runAutomatedValidators() {
        console.log('🤖 Running Automated Validators...');
        try {
            const validators = new SEOAutomatedValidators(this.config.baseUrl);
            const results = await validators.runAllValidations();

            this.results.suites.automated = {
                name: 'Automated Validators',
                status: 'completed',
                results,
                duration: 0 // Add duration tracking if needed
            };

            console.log(`✅ Automated Validators: ${results.summary.passed}/${results.summary.total} validations passed\n`);

        } catch (error) {
            console.log(`❌ Automated Validators failed: ${error.message}\n`);
            this.results.suites.automated = {
                name: 'Automated Validators',
                status: 'error',
                error: error.message,
                duration: 0
            };
        }
    }

    async runExternalValidators() {
        console.log('🌐 Running External Validators...');
        try {
            const validators = new SEOExternalValidators({
                baseUrl: this.config.baseUrl,
                pageSpeedApiKey: this.config.pageSpeedApiKey,
                timeout: 60000
            });

            const results = await validators.runAllExternalValidations();

            this.results.suites.external = {
                name: 'External Validators',
                status: 'completed',
                results,
                duration: results.duration || 0
            };

            console.log(`✅ External Validators: ${results.summary.passed}/${results.summary.total} validations passed\n`);

        } catch (error) {
            console.log(`❌ External Validators failed: ${error.message}\n`);
            this.results.suites.external = {
                name: 'External Validators',
                status: 'error',
                error: error.message,
                duration: 0
            };
        }
    }

    calculateSummary() {
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let errorTests = 0;

        Object.values(this.results.suites).forEach(suite => {
            if (suite.status === 'error') {
                errorTests++;
                totalTests++;
                return;
            }

            const results = suite.results;
            if (results) {
                if (results.total !== undefined) {
                    // Internal validation suite format
                    totalTests += results.total;
                    passedTests += results.passed;
                    failedTests += results.failed;
                    errorTests += results.errors || 0;
                } else if (results.summary) {
                    // Automated/External validators format
                    totalTests += results.summary.total;
                    passedTests += results.summary.passed;
                    failedTests += results.summary.failed;
                }
            }
        });

        this.results.summary = {
            ...this.results.summary,
            totalTests,
            passedTests,
            failedTests,
            errorTests,
            successRate: totalTests > 0 ? (passedTests / totalTests * 100) : 0
        };
    }

    generateRecommendations() {
        const recommendations = [];
        const criticalIssues = [];

        // Analyze each suite for recommendations
        Object.entries(this.results.suites).forEach(([suiteName, suite]) => {
            if (suite.status === 'error') {
                criticalIssues.push(`${suite.name} failed to execute`);
                return;
            }

            const results = suite.results;
            if (!results) return;

            // Internal suite recommendations
            if (suiteName === 'internal' && results.details) {
                const failedTests = results.details.filter(d => d.status === 'FAIL');
                failedTests.forEach(test => {
                    if (test.name.toLowerCase().includes('robots')) {
                        recommendations.push('🤖 Fix robots.txt accessibility and content');
                    } else if (test.name.toLowerCase().includes('sitemap')) {
                        recommendations.push('🗺️ Fix sitemap.xml format and accessibility');
                    } else if (test.name.toLowerCase().includes('meta')) {
                        recommendations.push('🏷️ Optimize meta tags for better SERP performance');
                    } else if (test.name.toLowerCase().includes('structured')) {
                        recommendations.push('📊 Fix structured data validation errors');
                    } else if (test.name.toLowerCase().includes('heading')) {
                        recommendations.push('📝 Fix heading hierarchy issues');
                    } else if (test.name.toLowerCase().includes('performance')) {
                        recommendations.push('⚡ Optimize page performance metrics');
                    } else if (test.name.toLowerCase().includes('gtm')) {
                        recommendations.push('📈 Fix Google Tag Manager implementation');
                    }
                });
            }

            // Automated validators recommendations
            if (suiteName === 'automated' && results.validations) {
                Object.entries(results.validations).forEach(([validationType, validation]) => {
                    if (!validation.valid && validation.errors && validation.errors.length > 0) {
                        if (validationType === 'robotsTxt') {
                            recommendations.push('🤖 Create or fix robots.txt file');
                        } else if (validationType === 'sitemapXml') {
                            recommendations.push('🗺️ Create or fix sitemap.xml file');
                        } else if (validationType === 'metaTags') {
                            recommendations.push('🏷️ Add missing or fix invalid meta tags');
                        } else if (validationType === 'structuredData') {
                            recommendations.push('📊 Add or fix JSON-LD structured data');
                        }
                    }
                });
            }

            // External validators recommendations
            if (suiteName === 'external' && results.overallRecommendations) {
                recommendations.push(...results.overallRecommendations);
            }
        });

        // Remove duplicates and prioritize
        this.results.recommendations = [...new Set(recommendations)].slice(0, 10);

        // Identify critical issues for CI/CD
        if (this.results.summary.successRate < 50) {
            criticalIssues.push('Overall SEO success rate is below 50%');
        }

        if (this.results.suites.automated?.results?.validations?.robotsTxt?.valid === false) {
            criticalIssues.push('robots.txt is not accessible');
        }

        if (this.results.suites.automated?.results?.validations?.sitemapXml?.valid === false) {
            criticalIssues.push('sitemap.xml is not accessible');
        }

        this.results.cicdIntegration.criticalIssues = criticalIssues;
    }

    determineCICDAction() {
        const successRate = this.results.summary.successRate;
        const criticalIssues = this.results.cicdIntegration.criticalIssues.length;
        const environment = this.config.environment;

        // Determine exit code and deployment recommendation
        if (criticalIssues > 0) {
            this.results.cicdIntegration.exitCode = 1;
            this.results.cicdIntegration.shouldDeploy = false;
        } else if (successRate < 60) {
            this.results.cicdIntegration.exitCode = 1;
            this.results.cicdIntegration.shouldDeploy = environment !== 'production';
        } else if (successRate < 80) {
            this.results.cicdIntegration.exitCode = 0;
            this.results.cicdIntegration.shouldDeploy = environment !== 'production';
        } else {
            this.results.cicdIntegration.exitCode = 0;
            this.results.cicdIntegration.shouldDeploy = true;
        }

        // Override for development environment
        if (environment === 'development') {
            this.results.cicdIntegration.shouldDeploy = true;
        }
    }

    ensureOutputDirectory() {
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
    }

    async generateReports() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseName = `seo-test-results-${timestamp}`;

        // JSON report
        const jsonPath = path.join(this.config.outputDir, `${baseName}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

        // HTML report
        const htmlPath = path.join(this.config.outputDir, `${baseName}.html`);
        const htmlContent = this.generateHTMLReport();
        fs.writeFileSync(htmlPath, htmlContent);

        // CSV summary
        const csvPath = path.join(this.config.outputDir, `${baseName}-summary.csv`);
        const csvContent = this.generateCSVReport();
        fs.writeFileSync(csvPath, csvContent);

        // CI/CD report
        const cicdPath = path.join(this.config.outputDir, 'seo-cicd-report.json');
        fs.writeFileSync(cicdPath, JSON.stringify({
            timestamp: this.results.timestamp,
            environment: this.results.environment,
            successRate: this.results.summary.successRate,
            exitCode: this.results.cicdIntegration.exitCode,
            shouldDeploy: this.results.cicdIntegration.shouldDeploy,
            criticalIssues: this.results.cicdIntegration.criticalIssues,
            recommendations: this.results.recommendations.slice(0, 5)
        }, null, 2));

        console.log(`📊 Reports generated:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   HTML: ${htmlPath}`);
        console.log(`   CSV: ${csvPath}`);
        console.log(`   CI/CD: ${cicdPath}`);
    }

    generateHTMLReport() {
        const successRate = this.results.summary.successRate.toFixed(1);
        const statusColor = successRate >= 80 ? '#10b981' : successRate >= 60 ? '#f59e0b' : '#ef4444';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Test Results - DirectoryBolt</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #666; }
        .metric .value { font-size: 2em; font-weight: bold; color: ${statusColor}; }
        .suite { margin-bottom: 30px; }
        .suite h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .status { padding: 4px 12px; border-radius: 4px; color: white; font-size: 0.9em; }
        .status.passed { background: #10b981; }
        .status.failed { background: #ef4444; }
        .status.error { background: #f59e0b; }
        .recommendations { background: #fef3cd; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .recommendations h3 { color: #856404; margin-top: 0; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 SEO Comprehensive Test Results</h1>
            <p><strong>Target:</strong> ${this.results.baseUrl}</p>
            <p><strong>Environment:</strong> ${this.results.environment}</p>
            <p><strong>Timestamp:</strong> ${this.results.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Overall Success Rate</h3>
                <div class="value">${successRate}%</div>
            </div>
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${this.results.summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value" style="color: #10b981;">${this.results.summary.passedTests}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value" style="color: #ef4444;">${this.results.summary.failedTests}</div>
            </div>
        </div>

        ${Object.entries(this.results.suites).map(([suiteName, suite]) => `
        <div class="suite">
            <h2>${suite.name} <span class="status ${suite.status}">${suite.status.toUpperCase()}</span></h2>
            ${suite.status === 'error' ? 
                `<p style="color: #ef4444;"><strong>Error:</strong> ${suite.error}</p>` :
                this.generateSuiteHTML(suiteName, suite)
            }
        </div>
        `).join('')}

        ${this.results.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 Top Recommendations</h3>
            <ul>
                ${this.results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by DirectoryBolt SEO Test Suite • Duration: ${(this.results.summary.duration / 1000).toFixed(1)}s</p>
            <p>Exit Code: ${this.results.cicdIntegration.exitCode} • Should Deploy: ${this.results.cicdIntegration.shouldDeploy ? 'Yes' : 'No'}</p>
        </div>
    </div>
</body>
</html>`;
    }

    generateSuiteHTML(suiteName, suite) {
        if (!suite.results) return '<p>No results available.</p>';

        // Handle different result formats
        if (suiteName === 'internal' && suite.results.details) {
            return `
                <table>
                    <thead>
                        <tr><th>Test</th><th>Status</th><th>Duration</th></tr>
                    </thead>
                    <tbody>
                        ${suite.results.details.map(test => `
                            <tr>
                                <td>${test.name}</td>
                                <td><span class="status ${test.status.toLowerCase()}">${test.status}</span></td>
                                <td>${test.duration}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        if (suite.results.summary) {
            return `
                <p><strong>Summary:</strong> ${suite.results.summary.passed}/${suite.results.summary.total} tests passed (${suite.results.summary.successRate?.toFixed(1) || 'N/A'}%)</p>
                ${suite.results.validations ? this.generateValidationsHTML(suite.results.validations) : ''}
            `;
        }

        return '<p>Results format not recognized.</p>';
    }

    generateValidationsHTML(validations) {
        return `
            <table>
                <thead>
                    <tr><th>Validation</th><th>Status</th><th>Issues</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(validations).map(([name, validation]) => `
                        <tr>
                            <td>${name}</td>
                            <td><span class="status ${validation.valid ? 'passed' : 'failed'}">${validation.valid ? 'PASS' : 'FAIL'}</span></td>
                            <td>
                                ${validation.errors ? validation.errors.slice(0, 2).join(', ') : 'None'}
                                ${validation.warnings && validation.warnings.length > 0 ? ` (${validation.warnings.length} warnings)` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateCSVReport() {
        const rows = [
            'Suite,Test,Status,Duration,Error'
        ];

        Object.entries(this.results.suites).forEach(([suiteName, suite]) => {
            if (suite.status === 'error') {
                rows.push(`${suiteName},Suite Execution,ERROR,0,"${suite.error}"`);
                return;
            }

            if (suiteName === 'internal' && suite.results.details) {
                suite.results.details.forEach(test => {
                    rows.push(`${suiteName},"${test.name}",${test.status},${test.duration},"${test.error || ''}"`);
                });
            } else if (suite.results.validations) {
                Object.entries(suite.results.validations).forEach(([testName, validation]) => {
                    const status = validation.valid ? 'PASS' : 'FAIL';
                    const error = validation.errors ? validation.errors.join('; ') : '';
                    rows.push(`${suiteName},"${testName}",${status},0,"${error}"`);
                });
            }
        });

        return rows.join('\n');
    }

    printFinalSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 COMPREHENSIVE SEO TEST RESULTS');
        console.log('='.repeat(80));

        const summary = this.results.summary;
        const cicd = this.results.cicdIntegration;

        console.log(`📊 Final Metrics:`);
        console.log(`   Total Tests: ${summary.totalTests}`);
        console.log(`   ✅ Passed: ${summary.passedTests}`);
        console.log(`   ❌ Failed: ${summary.failedTests}`);
        console.log(`   💥 Errors: ${summary.errorTests}`);
        console.log(`   🎯 Success Rate: ${summary.successRate.toFixed(1)}%`);
        console.log(`   ⏱️  Duration: ${(summary.duration / 1000).toFixed(1)}s`);
        console.log();

        // SEO Health Status
        if (summary.successRate >= 90) {
            console.log(`🏆 SEO HEALTH: EXCELLENT`);
            console.log(`   Your SEO implementation is outstanding!`);
        } else if (summary.successRate >= 80) {
            console.log(`🎯 SEO HEALTH: GOOD`);
            console.log(`   Solid SEO foundation with room for minor improvements.`);
        } else if (summary.successRate >= 60) {
            console.log(`⚠️  SEO HEALTH: NEEDS IMPROVEMENT`);
            console.log(`   Several issues need attention before production.`);
        } else {
            console.log(`🚨 SEO HEALTH: CRITICAL`);
            console.log(`   Major SEO problems require immediate attention.`);
        }

        console.log();

        // CI/CD Integration
        console.log(`🔄 CI/CD Integration:`);
        console.log(`   Exit Code: ${cicd.exitCode}`);
        console.log(`   Should Deploy: ${cicd.shouldDeploy ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   Critical Issues: ${cicd.criticalIssues.length}`);

        if (cicd.criticalIssues.length > 0) {
            console.log(`   🚨 Critical Issues:`);
            cicd.criticalIssues.forEach((issue, i) => {
                console.log(`      ${i + 1}. ${issue}`);
            });
        }

        console.log();

        // Top Recommendations
        if (this.results.recommendations.length > 0) {
            console.log(`💡 TOP RECOMMENDATIONS:`);
            this.results.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
            console.log();
        }

        // Next Steps
        console.log(`🎯 NEXT STEPS:`);
        if (cicd.criticalIssues.length > 0) {
            console.log(`   1. Fix critical issues before deployment`);
            console.log(`   2. Re-run tests to verify fixes`);
        } else if (summary.successRate < 80) {
            console.log(`   1. Address failed tests for better SEO performance`);
            console.log(`   2. Consider deploying to staging first`);
        } else {
            console.log(`   1. Monitor SEO performance regularly`);
            console.log(`   2. Deploy with confidence`);
        }

        console.log(`   3. Submit sitemap to Google Search Console`);
        console.log(`   4. Monitor Core Web Vitals in production`);
        console.log(`   5. Set up automated SEO monitoring`);

        console.log('\n' + '='.repeat(80));
    }
}

// CLI execution
if (require.main === module) {
    const config = {
        baseUrl: process.argv[2] || process.env.TEST_BASE_URL,
        pageSpeedApiKey: process.env.PAGESPEED_API_KEY,
        environment: process.env.NODE_ENV || 'development',
        runExternal: process.env.RUN_EXTERNAL !== 'false',
        verbose: process.env.VERBOSE !== 'false',
        parallel: process.env.PARALLEL !== 'false',
        outputDir: process.env.OUTPUT_DIR || './seo-test-results'
    };

    console.log(`🚀 Starting comprehensive SEO testing...`);

    const runner = new SEOComprehensiveTestRunner(config);

    runner.runAllTests()
        .then(results => {
            console.log(`\n✨ Testing completed successfully!`);
            console.log(`📊 Reports saved to: ${config.outputDir}`);
            process.exit(results.cicdIntegration.exitCode);
        })
        .catch(error => {
            console.error('\n🚨 Testing failed:', error.message);
            if (process.env.VERBOSE === 'true') {
                console.error(error.stack);
            }
            process.exit(2);
        });
}

module.exports = SEOComprehensiveTestRunner;