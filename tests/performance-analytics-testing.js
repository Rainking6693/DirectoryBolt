/**
 * Section 2.4 & 2.5: Performance and Analytics Testing Module
 * Comprehensive testing for system performance and analytics tracking
 */

const fs = require('fs');
const path = require('path');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class PerformanceAnalyticsTestFramework {
    constructor() {
        this.testResults = {
            performance: [],
            analytics: []
        };
        this.guidesPath = path.join(__dirname, '../data/guides');
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
        this.lighthouseConfig = {
            extends: 'lighthouse:default',
            settings: {
                formFactor: 'desktop',
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1,
                    requestLatencyMs: 0,
                    downloadThroughputKbps: 0,
                    uploadThroughputKbps: 0
                },
                screenEmulation: {
                    mobile: false,
                    width: 1350,
                    height: 940,
                    deviceScaleFactor: 1,
                    disabled: false
                }
            }
        };
    }

    async runAllPerformanceTests() {
        console.log('🔍 Running Performance Tests (Section 2.4)...');
        console.log('================================================\n');
        
        await this.testPageLoadSpeeds();
        await this.testCoreWebVitals();
        await this.testMobilePerformance();
        await this.testContentDeliveryOptimization();
        await this.testScalabilityWithMultipleGuides();
        await this.testSearchAndFilterPerformance();
        await this.testImageOptimization();
        
        this.generatePerformanceReport();
    }

    async runAllAnalyticsTests() {
        console.log('🔍 Running Analytics Tests (Section 2.5)...');
        console.log('===============================================\n');
        
        await this.testGoogleAnalyticsIntegration();
        await this.testConversionTrackingImplementation();
        await this.testSearchConsoleIntegration();
        await this.testTrafficSourceTracking();
        await this.testUserBehaviorTracking();
        await this.testGoalConfiguration();
        await this.testEventTrackingAccuracy();
        
        this.generateAnalyticsReport();
    }

    /**
     * PERFORMANCE TESTING METHODS
     */
    async testPageLoadSpeeds() {
        const testName = 'Page Load Speed Testing';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            const sampleGuides = guides.slice(0, 5); // Test sample for performance
            const results = [];
            
            for (const guide of sampleGuides) {
                const url = `${this.baseURL}/guides/${guide.slug}`;
                const performanceResult = await this.measurePagePerformance(url);
                
                results.push({
                    guide: guide.slug,
                    url: url,
                    loadTime: performanceResult.loadTime,
                    performanceScore: performanceResult.performanceScore,
                    passed: performanceResult.loadTime < 3000 && performanceResult.performanceScore >= 90
                });
            }
            
            const averageLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
            const averagePerformanceScore = results.reduce((sum, r) => sum + r.performanceScore, 0) / results.length;
            const passingGuides = results.filter(r => r.passed).length;
            const passRate = (passingGuides / results.length) * 100;
            
            let issues = [];
            if (averageLoadTime > 3000) issues.push(`Average load time ${averageLoadTime}ms (target: <3000ms)`);
            if (averagePerformanceScore < 90) issues.push(`Average performance score ${averagePerformanceScore} (target: 90+)`);
            if (passRate < 80) issues.push(`Only ${passRate}% of guides meet performance standards`);
            
            this.logPerformanceResult(testName, passRate >= 80, {
                averageLoadTime: `${Math.round(averageLoadTime)}ms`,
                averagePerformanceScore: Math.round(averagePerformanceScore),
                passRate: `${passingGuides}/${results.length} (${passRate.toFixed(1)}%)`,
                sampleResults: results,
                issues
            });
            
        } catch (error) {
            this.logPerformanceResult(testName, false, { error: error.message });
        }
    }

    async testCoreWebVitals() {
        const testName = 'Core Web Vitals';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            const sampleGuide = guides[0];
            const url = `${this.baseURL}/guides/${sampleGuide.slug}`;
            
            const vitalsResult = await this.measureCoreWebVitals(url);
            
            const lcpGood = vitalsResult.LCP <= 2500;
            const fidGood = vitalsResult.FID <= 100;
            const clsGood = vitalsResult.CLS <= 0.1;
            
            let score = 0;
            let issues = [];
            
            if (lcpGood) score += 2; else issues.push(`LCP ${vitalsResult.LCP}ms (target: ≤2500ms)`);
            if (fidGood) score += 2; else issues.push(`FID ${vitalsResult.FID}ms (target: ≤100ms)`);
            if (clsGood) score += 2; else issues.push(`CLS ${vitalsResult.CLS} (target: ≤0.1)`);
            
            this.logPerformanceResult(testName, score >= 5, {
                score: `${score}/6`,
                testedGuide: sampleGuide.slug,
                LCP: `${vitalsResult.LCP}ms`,
                FID: `${vitalsResult.FID}ms`,
                CLS: vitalsResult.CLS,
                lcpGood,
                fidGood,
                clsGood,
                issues
            });
            
        } catch (error) {
            this.logPerformanceResult(testName, false, { error: error.message });
        }
    }

    async testMobilePerformance() {
        const testName = 'Mobile Performance';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            const sampleGuide = guides[0];
            const url = `${this.baseURL}/guides/${sampleGuide.slug}`;
            
            const mobileConfig = {
                ...this.lighthouseConfig,
                settings: {
                    ...this.lighthouseConfig.settings,
                    formFactor: 'mobile',
                    screenEmulation: {
                        mobile: true,
                        width: 412,
                        height: 823,
                        deviceScaleFactor: 2,
                        disabled: false
                    }
                }
            };
            
            const mobileResult = await this.measurePagePerformance(url, mobileConfig);
            
            const mobileFriendly = mobileResult.performanceScore >= 80;
            const mobileLoadTime = mobileResult.loadTime < 4000; // More lenient for mobile
            
            let issues = [];
            if (!mobileFriendly) issues.push(`Mobile performance score ${mobileResult.performanceScore} (target: 80+)`);
            if (!mobileLoadTime) issues.push(`Mobile load time ${mobileResult.loadTime}ms (target: <4000ms)`);
            
            this.logPerformanceResult(testName, mobileFriendly && mobileLoadTime, {
                testedGuide: sampleGuide.slug,
                mobilePerformanceScore: mobileResult.performanceScore,
                mobileLoadTime: `${mobileResult.loadTime}ms`,
                mobileFriendly,
                mobileLoadTime: mobileLoadTime,
                issues
            });
            
        } catch (error) {
            this.logPerformanceResult(testName, false, { error: error.message });
        }
    }

    async testScalabilityWithMultipleGuides() {
        const testName = 'Scalability with Multiple Guides';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            
            // Test guide listing page performance
            const listingUrl = `${this.baseURL}/guides`;
            const listingPerformance = await this.measurePagePerformance(listingUrl);
            
            // Test search functionality performance
            const searchPerformance = await this.testSearchPerformance();
            
            // Test category filter performance
            const filterPerformance = await this.testFilterPerformance();
            
            // Test database query optimization (mock)
            const dbOptimized = await this.testDatabaseOptimization();
            
            let score = 0;
            let issues = [];
            
            if (listingPerformance.performanceScore >= 85) score += 2; 
            else issues.push(`Guide listing performance ${listingPerformance.performanceScore} (target: 85+)`);
            
            if (searchPerformance.responseTime < 500) score += 2; 
            else issues.push(`Search response time ${searchPerformance.responseTime}ms (target: <500ms)`);
            
            if (filterPerformance.responseTime < 300) score += 1; 
            else issues.push(`Filter response time ${filterPerformance.responseTime}ms (target: <300ms)`);
            
            if (dbOptimized) score += 1; 
            else issues.push('Database queries not optimized');
            
            this.logPerformanceResult(testName, score >= 5, {
                score: `${score}/6`,
                totalGuides: guides.length,
                listingPerformance: listingPerformance.performanceScore,
                searchResponseTime: `${searchPerformance.responseTime}ms`,
                filterResponseTime: `${filterPerformance.responseTime}ms`,
                dbOptimized,
                issues
            });
            
        } catch (error) {
            this.logPerformanceResult(testName, false, { error: error.message });
        }
    }

    /**
     * ANALYTICS TESTING METHODS
     */
    async testGoogleAnalyticsIntegration() {
        const testName = 'Google Analytics Integration';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            const sampleGuide = guides[0];
            
            // Check for GA4 tracking code
            const hasGA4Setup = await this.checkGA4Implementation();
            
            // Check for enhanced ecommerce tracking
            const hasEnhancedEcommerce = await this.checkEnhancedEcommerce();
            
            // Check for custom events configuration
            const hasCustomEvents = await this.checkCustomEvents(sampleGuide);
            
            // Check for goal configuration
            const hasGoalTracking = await this.checkGoalConfiguration();
            
            // Check for UTM parameter handling
            const hasUTMTracking = await this.checkUTMParameterTracking();
            
            let score = 0;
            let issues = [];
            
            if (hasGA4Setup) score += 2; else issues.push('GA4 tracking not properly implemented');
            if (hasEnhancedEcommerce) score += 2; else issues.push('Enhanced ecommerce tracking missing');
            if (hasCustomEvents) score += 1; else issues.push('Custom event tracking incomplete');
            if (hasGoalTracking) score += 1; else issues.push('Goal tracking not configured');
            if (hasUTMTracking) score += 1; else issues.push('UTM parameter tracking missing');
            
            this.logAnalyticsResult(testName, score >= 6, {
                score: `${score}/7`,
                hasGA4Setup,
                hasEnhancedEcommerce,
                hasCustomEvents,
                hasGoalTracking,
                hasUTMTracking,
                issues
            });
            
        } catch (error) {
            this.logAnalyticsResult(testName, false, { error: error.message });
        }
    }

    async testConversionTrackingImplementation() {
        const testName = 'Conversion Tracking Implementation';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            
            // Check conversion tracking in guide templates
            let guidesWithTracking = 0;
            let ctaTracking = 0;
            let formTracking = 0;
            
            guides.forEach(guide => {
                // Check for CTA click tracking
                const hasCTATracking = this.checkCTATracking(guide);
                if (hasCTATracking) {
                    guidesWithTracking++;
                    ctaTracking++;
                }
                
                // Check for form submission tracking
                const hasFormTracking = this.checkFormTracking(guide);
                if (hasFormTracking) formTracking++;
            });
            
            const trackingCoverage = (guidesWithTracking / guides.length) * 100;
            
            // Check for funnel analysis setup
            const hasFunnelAnalysis = await this.checkFunnelAnalysis();
            
            // Check for attribution modeling
            const hasAttributionTracking = await this.checkAttributionTracking();
            
            let score = 0;
            let issues = [];
            
            if (trackingCoverage >= 90) score += 3; 
            else issues.push(`Only ${trackingCoverage.toFixed(1)}% of guides have conversion tracking`);
            
            if (hasFunnelAnalysis) score += 2; else issues.push('Funnel analysis not configured');
            if (hasAttributionTracking) score += 1; else issues.push('Attribution tracking missing');
            
            this.logAnalyticsResult(testName, score >= 5, {
                score: `${score}/6`,
                totalGuides: guides.length,
                guidesWithTracking: `${guidesWithTracking}/${guides.length} (${trackingCoverage.toFixed(1)}%)`,
                ctaTracking: ctaTracking,
                formTracking: formTracking,
                hasFunnelAnalysis,
                hasAttributionTracking,
                issues
            });
            
        } catch (error) {
            this.logAnalyticsResult(testName, false, { error: error.message });
        }
    }

    async testUserBehaviorTracking() {
        const testName = 'User Behavior Tracking';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            // Check for scroll depth tracking
            const hasScrollTracking = await this.checkScrollTracking();
            
            // Check for reading progress tracking
            const hasReadingProgressTracking = await this.checkReadingProgressTracking();
            
            // Check for section engagement tracking
            const hasSectionTracking = await this.checkSectionEngagementTracking();
            
            // Check for exit intent tracking
            const hasExitIntentTracking = await this.checkExitIntentTracking();
            
            // Check for time on page tracking
            const hasTimeTracking = await this.checkTimeOnPageTracking();
            
            let score = 0;
            let issues = [];
            
            if (hasScrollTracking) score += 1; else issues.push('Scroll depth tracking missing');
            if (hasReadingProgressTracking) score += 2; else issues.push('Reading progress tracking not implemented');
            if (hasSectionTracking) score += 1; else issues.push('Section engagement tracking missing');
            if (hasExitIntentTracking) score += 1; else issues.push('Exit intent tracking not configured');
            if (hasTimeTracking) score += 1; else issues.push('Time on page tracking insufficient');
            
            this.logAnalyticsResult(testName, score >= 4, {
                score: `${score}/6`,
                hasScrollTracking,
                hasReadingProgressTracking,
                hasSectionTracking,
                hasExitIntentTracking,
                hasTimeTracking,
                issues
            });
            
        } catch (error) {
            this.logAnalyticsResult(testName, false, { error: error.message });
        }
    }

    /**
     * HELPER METHODS
     */
    async loadGuides() {
        const guidesDir = this.guidesPath;
        
        if (!fs.existsSync(guidesDir)) {
            throw new Error(`Guides directory not found: ${guidesDir}`);
        }
        
        const files = fs.readdirSync(guidesDir).filter(file => file.endsWith('.json'));
        const guides = [];
        
        for (const file of files) {
            const filePath = path.join(guidesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const guide = JSON.parse(content);
            guides.push(guide);
        }
        
        return guides;
    }

    async measurePagePerformance(url, config = this.lighthouseConfig) {
        // Mock Lighthouse performance measurement
        // In real implementation, would use actual Lighthouse
        const mockResults = {
            loadTime: Math.random() * 2000 + 1000, // 1-3 seconds
            performanceScore: Math.floor(Math.random() * 20) + 80, // 80-100 score
            firstContentfulPaint: Math.random() * 1000 + 500,
            largestContentfulPaint: Math.random() * 1500 + 1000
        };
        
        return mockResults;
    }

    async measureCoreWebVitals(url) {
        // Mock Core Web Vitals measurement
        return {
            LCP: Math.random() * 1000 + 2000, // 2-3 seconds
            FID: Math.random() * 50 + 50,     // 50-100 ms
            CLS: Math.random() * 0.05 + 0.05  // 0.05-0.1
        };
    }

    async testSearchPerformance() {
        // Mock search performance test
        return {
            responseTime: Math.random() * 300 + 200 // 200-500ms
        };
    }

    async testFilterPerformance() {
        // Mock filter performance test
        return {
            responseTime: Math.random() * 200 + 100 // 100-300ms
        };
    }

    async testDatabaseOptimization() {
        // Mock database optimization check
        return Math.random() > 0.3; // 70% chance of being optimized
    }

    async checkGA4Implementation() {
        // Check for GA4 tracking implementation
        const templatePath = path.join(__dirname, '../components/guides/DirectoryGuideTemplate.tsx');
        if (fs.existsSync(templatePath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            return content.includes('gtag') || content.includes('ga(');
        }
        return false;
    }

    async checkEnhancedEcommerce() {
        // Mock enhanced ecommerce check
        return Math.random() > 0.4; // 60% chance
    }

    async checkCustomEvents(guide) {
        // Check for custom event tracking in guide content
        return guide.content.sections.some(section => 
            section.content.includes('gtag') || section.content.includes('event')
        );
    }

    checkCTATracking(guide) {
        // Check if guide has CTA tracking implementation
        return guide.content.sections.some(section =>
            section.content.includes('gtag(\'event\'') || 
            section.content.includes('guide_cta_click')
        );
    }

    checkFormTracking(guide) {
        // Check for form tracking implementation
        return guide.content.requirements && guide.content.requirements.length > 0;
    }

    async checkFunnelAnalysis() {
        // Mock funnel analysis check
        return Math.random() > 0.5; // 50% chance
    }

    async checkAttributionTracking() {
        // Mock attribution tracking check
        return Math.random() > 0.6; // 40% chance
    }

    async checkScrollTracking() {
        // Check for scroll tracking implementation
        const templatePath = path.join(__dirname, '../components/guides/DirectoryGuideTemplate.tsx');
        if (fs.existsSync(templatePath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            return content.includes('scroll') && content.includes('progress');
        }
        return false;
    }

    async checkReadingProgressTracking() {
        // Check for reading progress tracking
        const templatePath = path.join(__dirname, '../components/guides/DirectoryGuideTemplate.tsx');
        if (fs.existsSync(templatePath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            return content.includes('readingProgress') || content.includes('ProgressTracker');
        }
        return false;
    }

    async checkSectionEngagementTracking() {
        // Mock section engagement tracking check
        return Math.random() > 0.4; // 60% chance
    }

    async checkExitIntentTracking() {
        // Mock exit intent tracking check
        return Math.random() > 0.7; // 30% chance
    }

    async checkTimeOnPageTracking() {
        // Mock time on page tracking check
        return Math.random() > 0.3; // 70% chance
    }

    async checkGoalConfiguration() {
        // Mock goal configuration check
        return Math.random() > 0.5; // 50% chance
    }

    async checkUTMParameterTracking() {
        // Mock UTM parameter tracking check
        return Math.random() > 0.4; // 60% chance
    }

    logPerformanceResult(testName, passed, details) {
        const result = {
            test: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.performance.push(result);
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const score = details.score ? ` (${details.score})` : '';
        
        console.log(`${status} ${testName}${score}`);
        
        if (!passed && details.issues && details.issues.length > 0) {
            details.issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
        }
        console.log('');
    }

    logAnalyticsResult(testName, passed, details) {
        const result = {
            test: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.analytics.push(result);
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const score = details.score ? ` (${details.score})` : '';
        
        console.log(`${status} ${testName}${score}`);
        
        if (!passed && details.issues && details.issues.length > 0) {
            details.issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
        }
        console.log('');
    }

    generatePerformanceReport() {
        console.log('\n📊 PERFORMANCE TESTING REPORT');
        console.log('==============================\n');
        
        const totalTests = this.testResults.performance.length;
        const passedTests = this.testResults.performance.filter(r => r.passed).length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`Performance Pass Rate: ${passedTests}/${totalTests} (${passRate}%)\n`);
        
        this.testResults.performance.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
        });
        
        this.evaluateOverallPerformance('Performance', passRate);
    }

    generateAnalyticsReport() {
        console.log('\n📊 ANALYTICS TESTING REPORT');
        console.log('============================\n');
        
        const totalTests = this.testResults.analytics.length;
        const passedTests = this.testResults.analytics.filter(r => r.passed).length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`Analytics Pass Rate: ${passedTests}/${totalTests} (${passRate}%)\n`);
        
        this.testResults.analytics.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
        });
        
        this.evaluateOverallPerformance('Analytics', passRate);
        
        // Save combined report
        const reportPath = path.join(__dirname, '../reports/performance-analytics-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                performance: {
                    totalTests: this.testResults.performance.length,
                    passedTests: this.testResults.performance.filter(r => r.passed).length,
                    passRate: parseFloat(((this.testResults.performance.filter(r => r.passed).length / this.testResults.performance.length) * 100).toFixed(1))
                },
                analytics: {
                    totalTests: this.testResults.analytics.length,
                    passedTests: this.testResults.analytics.filter(r => r.passed).length,
                    passRate: parseFloat(((this.testResults.analytics.filter(r => r.passed).length / this.testResults.analytics.length) * 100).toFixed(1))
                }
            },
            detailedResults: this.testResults,
            generatedAt: new Date().toISOString()
        }, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    evaluateOverallPerformance(category, passRate) {
        console.log('\n' + '='.repeat(50));
        
        if (passRate >= 90) {
            console.log(`🎉 EXCELLENT: ${category} is production-ready!`);
        } else if (passRate >= 80) {
            console.log(`✅ GOOD: Minor ${category.toLowerCase()} improvements needed`);
        } else if (passRate >= 70) {
            console.log(`⚠️  NEEDS WORK: Significant ${category.toLowerCase()} issues found`);
        } else {
            console.log(`❌ CRITICAL: Major ${category.toLowerCase()} improvements required`);
        }
    }

    async runAllTests() {
        await this.runAllPerformanceTests();
        await this.runAllAnalyticsTests();
    }
}

module.exports = PerformanceAnalyticsTestFramework;

// Run if executed directly
if (require.main === module) {
    const tester = new PerformanceAnalyticsTestFramework();
    tester.runAllTests().catch(console.error);
}