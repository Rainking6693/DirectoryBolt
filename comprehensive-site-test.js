const puppeteer = require('puppeteer');
const fs = require('fs');

// Comprehensive site testing suite
class ComprehensiveSiteTest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.testResults = {
            timestamp: new Date().toISOString(),
            overall: { passed: 0, failed: 0, warnings: 0 },
            tests: [],
            performance: {},
            console: { errors: [], warnings: [], cspErrors: [], networkErrors: [] }
        };
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 Starting Comprehensive Site Testing...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI
            devtools: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        this.page = await this.browser.newPage();
        
        // Set viewport for desktop testing
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Listen for console messages
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                this.testResults.console.errors.push(text);
                console.log('❌ Console Error:', text);
            } else if (type === 'warning') {
                this.testResults.console.warnings.push(text);
                console.log('⚠️ Console Warning:', text);
            }
        });

        // Listen for network failures
        this.page.on('requestfailed', request => {
            const failure = `${request.method()} ${request.url()} - ${request.failure().errorText}`;
            this.testResults.console.networkErrors.push(failure);
            console.log('🚨 Network Error:', failure);
        });

        // Listen for response errors
        this.page.on('response', response => {
            if (response.status() >= 400) {
                const error = `${response.status()} ${response.url()}`;
                this.testResults.console.networkErrors.push(error);
                console.log('🚨 HTTP Error:', error);
            }
        });
    }

    async testPage(url, pageName, tests = []) {
        console.log(`\n📄 Testing ${pageName} (${url})`);
        
        try {
            const startTime = Date.now();
            
            // Navigate to page
            await this.page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });

            const loadTime = Date.now() - startTime;
            this.testResults.performance[pageName] = { loadTime };

            console.log(`✅ ${pageName} loaded in ${loadTime}ms`);

            // Run page-specific tests
            for (const test of tests) {
                await this.runTest(test, pageName);
            }

            this.addTestResult(pageName, 'Page Load', true, `Loaded in ${loadTime}ms`);
            
        } catch (error) {
            console.log(`❌ Failed to load ${pageName}:`, error.message);
            this.addTestResult(pageName, 'Page Load', false, error.message);
        }
    }

    async runTest(test, pageName) {
        try {
            console.log(`  🧪 Running: ${test.name}`);
            const result = await test.run(this.page);
            
            if (result.success) {
                console.log(`  ✅ ${test.name}: ${result.message || 'PASSED'}`);
                this.addTestResult(pageName, test.name, true, result.message);
            } else {
                console.log(`  ❌ ${test.name}: ${result.message || 'FAILED'}`);
                this.addTestResult(pageName, test.name, false, result.message);
            }
        } catch (error) {
            console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
            this.addTestResult(pageName, test.name, false, error.message);
        }
    }

    addTestResult(page, testName, success, message) {
        this.testResults.tests.push({
            page,
            test: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });
        
        if (success) {
            this.testResults.overall.passed++;
        } else {
            this.testResults.overall.failed++;
        }
    }

    // Test definitions
    getHomepageTests() {
        return [
            {
                name: 'Title and Meta Tags',
                run: async (page) => {
                    const title = await page.title();
                    const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
                    
                    if (!title) return { success: false, message: 'No title found' };
                    if (!metaDescription) return { success: false, message: 'No meta description found' };
                    
                    return { success: true, message: `Title: "${title}", Description present` };
                }
            },
            {
                name: 'Hero Section Visible',
                run: async (page) => {
                    const heroVisible = await page.$('.hero, [data-testid="hero"], h1') !== null;
                    return { 
                        success: heroVisible, 
                        message: heroVisible ? 'Hero section found' : 'No hero section detected' 
                    };
                }
            },
            {
                name: 'Navigation Menu',
                run: async (page) => {
                    const nav = await page.$('nav, [role="navigation"], .navbar') !== null;
                    return { 
                        success: nav, 
                        message: nav ? 'Navigation found' : 'No navigation detected' 
                    };
                }
            },
            {
                name: 'CTA Buttons Present',
                run: async (page) => {
                    const buttons = await page.$$('button, .btn, [role="button"], a[href*="trial"], a[href*="signup"]');
                    return { 
                        success: buttons.length > 0, 
                        message: `Found ${buttons.length} interactive elements` 
                    };
                }
            },
            {
                name: 'No JavaScript Errors',
                run: async (page) => {
                    // Wait a bit for any async errors
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const errors = this.testResults.console.errors.filter(err => 
                        !err.includes('favicon') && 
                        !err.includes('Extension') &&
                        !err.includes('chrome-extension')
                    );
                    return { 
                        success: errors.length === 0, 
                        message: errors.length > 0 ? `${errors.length} JS errors found` : 'No JS errors' 
                    };
                }
            }
        ];
    }

    getPricingTests() {
        return [
            {
                name: 'Pricing Cards Visible',
                run: async (page) => {
                    const pricingCards = await page.$$('.pricing-card, [data-testid="pricing"], .price, .plan');
                    return { 
                        success: pricingCards.length > 0, 
                        message: `Found ${pricingCards.length} pricing elements` 
                    };
                }
            },
            {
                name: 'Stripe Buttons Present',
                run: async (page) => {
                    const stripeButtons = await page.$$('button[onclick*="stripe"], button[onclick*="checkout"], .stripe-button');
                    return { 
                        success: stripeButtons.length > 0, 
                        message: `Found ${stripeButtons.length} payment buttons` 
                    };
                }
            }
        ];
    }

    getAnalyzeTests() {
        return [
            {
                name: 'Analysis Form Present',
                run: async (page) => {
                    const form = await page.$('form, input[type="url"], input[name*="url"], input[name*="website"]') !== null;
                    return { 
                        success: form, 
                        message: form ? 'Analysis form found' : 'No analysis form detected' 
                    };
                }
            },
            {
                name: 'Submit Button Functional',
                run: async (page) => {
                    const submitBtn = await page.$('input[type="submit"], button[type="submit"], .submit-btn');
                    if (!submitBtn) return { success: false, message: 'No submit button found' };
                    
                    const isEnabled = await submitBtn.evaluate(btn => !btn.disabled);
                    return { 
                        success: isEnabled, 
                        message: isEnabled ? 'Submit button is enabled' : 'Submit button is disabled' 
                    };
                }
            }
        ];
    }

    async testMobileResponsiveness() {
        console.log('\n📱 Testing Mobile Responsiveness...');
        
        const viewports = [
            { width: 375, height: 667, name: 'iPhone SE' },
            { width: 768, height: 1024, name: 'iPad' },
            { width: 414, height: 896, name: 'iPhone XR' }
        ];

        for (const viewport of viewports) {
            try {
                await this.page.setViewport(viewport);
                await this.page.reload({ waitUntil: 'networkidle0' });
                
                // Check if content is properly responsive
                const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
                const viewportWidth = viewport.width;
                
                const isResponsive = bodyWidth <= viewportWidth * 1.1; // Allow 10% tolerance
                
                console.log(`  ${isResponsive ? '✅' : '❌'} ${viewport.name}: ${bodyWidth}px body width`);
                this.addTestResult('Mobile', viewport.name, isResponsive, `Body width: ${bodyWidth}px`);
                
            } catch (error) {
                console.log(`  ❌ ${viewport.name}: ${error.message}`);
                this.addTestResult('Mobile', viewport.name, false, error.message);
            }
        }

        // Reset to desktop
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async testPerformance() {
        console.log('\n⚡ Testing Performance...');
        
        try {
            // Test homepage performance
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            const performanceMetrics = await this.page.evaluate(() => {
                const perf = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: perf.loadEventEnd - perf.loadEventStart,
                    domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });

            const { loadTime, domContentLoaded, firstContentfulPaint } = performanceMetrics;
            
            console.log(`  ✅ Load Time: ${loadTime}ms`);
            console.log(`  ✅ DOM Content Loaded: ${domContentLoaded}ms`);
            console.log(`  ✅ First Contentful Paint: ${firstContentfulPaint}ms`);
            
            this.testResults.performance.metrics = performanceMetrics;
            this.addTestResult('Performance', 'Load Metrics', true, `Load: ${loadTime}ms, FCP: ${firstContentfulPaint}ms`);
            
        } catch (error) {
            console.log(`  ❌ Performance test failed: ${error.message}`);
            this.addTestResult('Performance', 'Load Metrics', false, error.message);
        }
    }

    async testUserFlows() {
        console.log('\n👤 Testing User Flows...');
        
        try {
            // Test "Start Free Trial" flow
            await this.page.goto(this.baseUrl);
            
            // Look for trial buttons
            const trialButtons = await this.page.$$('a[href*="trial"], a[href*="signup"], button:contains("trial"), button:contains("start")');
            
            if (trialButtons.length > 0) {
                console.log(`  ✅ Found ${trialButtons.length} trial/signup buttons`);
                this.addTestResult('User Flow', 'Trial Buttons', true, `${trialButtons.length} buttons found`);
            } else {
                console.log('  ⚠️ No trial/signup buttons found');
                this.addTestResult('User Flow', 'Trial Buttons', false, 'No trial buttons found');
            }

            // Test form interaction if present
            const forms = await this.page.$$('form');
            if (forms.length > 0) {
                console.log(`  ✅ Found ${forms.length} forms`);
                this.addTestResult('User Flow', 'Forms Present', true, `${forms.length} forms found`);
            }

        } catch (error) {
            console.log(`  ❌ User flow test failed: ${error.message}`);
            this.addTestResult('User Flow', 'General Test', false, error.message);
        }
    }

    async generateReport() {
        const reportPath = `./site-test-report-${Date.now()}.json`;
        const summaryPath = `./site-test-summary.md`;

        // Generate JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

        // Generate markdown summary
        const totalTests = this.testResults.overall.passed + this.testResults.overall.failed;
        const passRate = totalTests > 0 ? Math.round((this.testResults.overall.passed / totalTests) * 100) : 0;

        const summary = `# Site Testing Report - ${this.testResults.timestamp}

## Overview
- **Total Tests**: ${totalTests}
- **Passed**: ${this.testResults.overall.passed}
- **Failed**: ${this.testResults.overall.failed}
- **Pass Rate**: ${passRate}%

## Console Issues
- **JavaScript Errors**: ${this.testResults.console.errors.length}
- **Warnings**: ${this.testResults.console.warnings.length}
- **Network Errors**: ${this.testResults.console.networkErrors.length}

## Performance
${Object.entries(this.testResults.performance).map(([page, data]) => 
    `- **${page}**: ${data.loadTime}ms load time`
).join('\n')}

## Test Results by Page
${this.testResults.tests.map(test => 
    `- ${test.success ? '✅' : '❌'} **${test.page}** - ${test.test}: ${test.message}`
).join('\n')}

## Critical Issues
${this.testResults.console.errors.length > 0 ? 
    '### JavaScript Errors\n' + this.testResults.console.errors.map(err => `- ${err}`).join('\n') 
    : '✅ No critical JavaScript errors found'
}

${this.testResults.console.networkErrors.length > 0 ? 
    '\n### Network Errors\n' + this.testResults.console.networkErrors.map(err => `- ${err}`).join('\n') 
    : '\n✅ No network errors found'
}
`;

        fs.writeFileSync(summaryPath, summary);

        console.log(`\n📊 Report generated:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   Summary: ${summaryPath}`);

        return { reportPath, summaryPath, passRate };
    }

    async runFullSuite() {
        try {
            await this.init();

            // Test main pages
            await this.testPage(this.baseUrl, 'Homepage', this.getHomepageTests());
            await this.testPage(`${this.baseUrl}/pricing`, 'Pricing', this.getPricingTests());
            await this.testPage(`${this.baseUrl}/analyze`, 'Analyze', this.getAnalyzeTests());

            // Additional tests
            await this.testMobileResponsiveness();
            await this.testPerformance();
            await this.testUserFlows();

            const report = await this.generateReport();
            
            console.log(`\n🏁 Testing Complete!`);
            console.log(`📊 Pass Rate: ${report.passRate}%`);
            console.log(`${report.passRate >= 80 ? '🎉 Site is functioning well!' : '⚠️ Site needs attention'}`);

            return report;

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the test suite
if (require.main === module) {
    const tester = new ComprehensiveSiteTest();
    tester.runFullSuite()
        .then((report) => {
            console.log('\n✅ Test suite completed successfully');
            process.exit(report.passRate >= 80 ? 0 : 1);
        })
        .catch((error) => {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveSiteTest;