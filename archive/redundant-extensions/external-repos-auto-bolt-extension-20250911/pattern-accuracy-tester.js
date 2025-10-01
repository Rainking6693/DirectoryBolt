/**
 * Pattern Accuracy Tester for Auto-Bolt Chrome Extension
 * Tests URL pattern matching accuracy across all supported directory sites
 * Validates that patterns match intended URLs and don't over-match
 */

class PatternAccuracyTester {
    constructor() {
        this.testResults = [];
        this.manifestPatterns = [];
        
        // Test URLs from actual directory sites (both should match and should not match)
        this.testUrls = {
            shouldMatch: [
                // Google Business
                'https://business.google.com/create',
                'https://business.google.com/manage',
                'https://business.google.com/dashboard',
                
                // Amazon Seller
                'https://sellercentral.amazon.com/ap/register',
                'https://sellercentral.amazon.com/dashboard',
                'https://business.amazon.com/en/register',
                
                // YouTube
                'https://www.youtube.com/channel_switcher',
                'https://youtube.com/account',
                
                // Facebook Business
                'https://business.facebook.com/overview',
                'https://www.facebook.com/pages/create',
                
                // LinkedIn
                'https://www.linkedin.com/company/setup/new/',
                'https://linkedin.com/company/add',
                
                // Indeed
                'https://employers.indeed.com/p',
                'https://employers.indeed.com/c/info',
                
                // TripAdvisor
                'https://www.tripadvisor.com/Owners/Claim',
                'https://tripadvisor.com/Owners/dashboard',
                
                // Crunchbase
                'https://www.crunchbase.com/organization/add',
                'https://crunchbase.com/search/organizations',
                
                // Better Business Bureau
                'https://www.bbb.org/get-accredited',
                'https://bbb.org/directory',
                
                // Product Hunt
                'https://www.producthunt.com/posts/new',
                'https://producthunt.com/dashboard',
                
                // Trustpilot
                'https://business.trustpilot.com/signup',
                'https://www.trustpilot.com/business',
                
                // Yellow Pages
                'https://www.yellowpages.com/business/add',
                'https://listings.yellowpages.com/claim',
                
                // Wellfound (AngelList)
                'https://wellfound.com/company/create',
                'https://www.wellfound.com/jobs',
                
                // Glassdoor
                'https://www.glassdoor.com/employers/account/create-profile.htm',
                'https://glassdoor.com/business',
                
                // Bing Places
                'https://www.bingplaces.com/dashboard/addlisting',
                'https://bingplaces.com/business',
                
                // Angi (Angie's List)
                'https://www.angi.com/companyaccount/',
                'https://angi.com/pro',
                
                // Capterra
                'https://www.capterra.com/vendors/add-product',
                'https://capterra.com/directory',
                
                // G2
                'https://www.g2.com/products/create',
                'https://g2.com/vendor',
                
                // Yelp
                'https://business.yelp.com/signup',
                'https://www.yelp.com/biz/add',
                'https://yelp.com/advertise',
                
                // Apple Maps
                'https://mapsconnect.apple.com/business',
                
                // Foursquare
                'https://business.foursquare.com/venues/new',
                'https://www.foursquare.com/business',
                
                // Medium
                'https://medium.com/p/write',
                'https://www.medium.com/new-story',
                
                // Dev.to
                'https://dev.to/new',
                'https://www.dev.to/dashboard',
                
                // Reddit
                'https://www.reddit.com/submit',
                'https://reddit.com/submit?url=test',
                
                // GitHub
                'https://github.com/sindresorhus/awesome/pulls',
                
                // Additional patterns
                'https://stackshare.io/tools/new',
                'https://alternativeto.net/software/new/',
                'https://betalist.com/submit',
                'https://www.indiehackers.com/products/new',
                'https://news.ycombinator.com/submit'
            ],
            
            shouldNotMatch: [
                // Non-business pages that should NOT match
                'https://www.google.com/search?q=test',
                'https://amazon.com/dp/product123',
                'https://www.youtube.com/watch?v=video123',
                'https://www.facebook.com/profile/user123',
                'https://www.linkedin.com/in/profile123',
                'https://indeed.com/jobs?q=developer',
                'https://www.tripadvisor.com/Hotel_Review-123',
                
                // Other non-directory sites
                'https://www.wikipedia.org/wiki/test',
                'https://stackoverflow.com/questions/123',
                'https://github.com/user/repo',
                'https://news.ycombinator.com/item?id=123',
                'https://reddit.com/r/programming',
                'https://medium.com/@user/article-123',
                
                // Authentication/sensitive pages
                'https://accounts.google.com/signin',
                'https://www.facebook.com/login',
                'https://linkedin.com/login',
                'https://amazon.com/ap/signin',
                
                // Completely different domains
                'https://www.netflix.com/browse',
                'https://twitter.com/home',
                'https://www.paypal.com/signin',
                'https://www.microsoft.com/office',
                
                // HTTP (not HTTPS) - should not match
                'http://business.google.com/create',
                'http://www.yellowpages.com/business'
            ]
        };
    }
    
    /**
     * Load patterns from manifest.json
     */
    async loadManifestPatterns() {
        try {
            const manifestResponse = await fetch(chrome.runtime.getURL('manifest.json'));
            const manifest = await manifestResponse.json();
            
            const contentScripts = manifest.content_scripts || [];
            this.manifestPatterns = contentScripts.reduce((patterns, script) => {
                return patterns.concat(script.matches || []);
            }, []);
            
            console.log(`📋 Loaded ${this.manifestPatterns.length} patterns from manifest`);
            return this.manifestPatterns;
            
        } catch (error) {
            console.error('❌ Failed to load manifest patterns:', error);
            return [];
        }
    }
    
    /**
     * Test if a URL matches any pattern
     */
    testUrlAgainstPatterns(url, patterns = this.manifestPatterns) {
        const matches = [];
        
        for (const pattern of patterns) {
            if (this.urlMatchesPattern(url, pattern)) {
                matches.push(pattern);
            }
        }
        
        return {
            url,
            matches,
            matchCount: matches.length,
            hasMatch: matches.length > 0
        };
    }
    
    /**
     * Check if URL matches a specific pattern
     */
    urlMatchesPattern(url, pattern) {
        try {
            // Convert pattern to regex
            const regexPattern = pattern
                .replace(/\./g, '\\.')  // Escape dots
                .replace(/\*/g, '.*');  // Convert * to .*
            
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(url);
            
        } catch (error) {
            console.warn('Pattern matching error:', error, { url, pattern });
            return false;
        }
    }
    
    /**
     * Run comprehensive accuracy test
     */
    async runAccuracyTest() {
        console.log('🎯 Starting Pattern Accuracy Test...');
        
        // Load patterns
        await this.loadManifestPatterns();
        
        this.testResults = {
            shouldMatch: {
                passed: 0,
                failed: 0,
                results: []
            },
            shouldNotMatch: {
                passed: 0,
                failed: 0,
                results: []
            },
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                accuracy: 0
            }
        };
        
        // Test URLs that should match
        console.log('🔍 Testing URLs that SHOULD match patterns...');
        for (const url of this.testUrls.shouldMatch) {
            const result = this.testUrlAgainstPatterns(url);
            
            if (result.hasMatch) {
                this.testResults.shouldMatch.passed++;
                console.log(`✅ PASS: ${url} matched ${result.matchCount} patterns`);
            } else {
                this.testResults.shouldMatch.failed++;
                console.warn(`❌ FAIL: ${url} matched NO patterns`);
            }
            
            this.testResults.shouldMatch.results.push({
                url,
                expected: true,
                actual: result.hasMatch,
                passed: result.hasMatch,
                matchingPatterns: result.matches
            });
        }
        
        // Test URLs that should NOT match
        console.log('🔍 Testing URLs that should NOT match patterns...');
        for (const url of this.testUrls.shouldNotMatch) {
            const result = this.testUrlAgainstPatterns(url);
            
            if (!result.hasMatch) {
                this.testResults.shouldNotMatch.passed++;
                console.log(`✅ PASS: ${url} correctly matched NO patterns`);
            } else {
                this.testResults.shouldNotMatch.failed++;
                console.warn(`❌ FAIL: ${url} incorrectly matched ${result.matchCount} patterns:`, result.matches);
            }
            
            this.testResults.shouldNotMatch.results.push({
                url,
                expected: false,
                actual: result.hasMatch,
                passed: !result.hasMatch,
                matchingPatterns: result.matches
            });
        }
        
        // Calculate summary
        const totalShouldMatch = this.testUrls.shouldMatch.length;
        const totalShouldNotMatch = this.testUrls.shouldNotMatch.length;
        const totalTests = totalShouldMatch + totalShouldNotMatch;
        const totalPassed = this.testResults.shouldMatch.passed + this.testResults.shouldNotMatch.passed;
        const accuracy = (totalPassed / totalTests * 100).toFixed(2);
        
        this.testResults.summary = {
            totalTests,
            passedTests: totalPassed,
            failedTests: totalTests - totalPassed,
            accuracy: parseFloat(accuracy),
            shouldMatchAccuracy: (this.testResults.shouldMatch.passed / totalShouldMatch * 100).toFixed(2),
            shouldNotMatchAccuracy: (this.testResults.shouldNotMatch.passed / totalShouldNotMatch * 100).toFixed(2)
        };
        
        return this.testResults;
    }
    
    /**
     * Generate detailed test report
     */
    generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testConfiguration: {
                totalPatterns: this.manifestPatterns.length,
                shouldMatchUrls: this.testUrls.shouldMatch.length,
                shouldNotMatchUrls: this.testUrls.shouldNotMatch.length
            },
            results: this.testResults,
            recommendations: this.generateRecommendations(),
            patternAnalysis: this.analyzePatterns()
        };
        
        return report;
    }
    
    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Check for failing should-match URLs
        const failedShouldMatch = this.testResults.shouldMatch.results.filter(r => !r.passed);
        if (failedShouldMatch.length > 0) {
            recommendations.push({
                type: 'missing_coverage',
                priority: 'high',
                description: `${failedShouldMatch.length} directory URLs are not covered by current patterns`,
                action: 'Add patterns to cover missing URLs',
                affectedUrls: failedShouldMatch.map(r => r.url)
            });
        }
        
        // Check for over-matching (should-not-match URLs that matched)
        const failedShouldNotMatch = this.testResults.shouldNotMatch.results.filter(r => !r.passed);
        if (failedShouldNotMatch.length > 0) {
            recommendations.push({
                type: 'over_matching',
                priority: 'medium',
                description: `${failedShouldNotMatch.length} non-directory URLs are incorrectly matched`,
                action: 'Refine patterns to be more specific',
                affectedUrls: failedShouldNotMatch.map(r => ({ url: r.url, patterns: r.matchingPatterns }))
            });
        }
        
        // Check accuracy thresholds
        if (this.testResults.summary.accuracy < 95) {
            recommendations.push({
                type: 'low_accuracy',
                priority: 'high',
                description: `Overall accuracy is ${this.testResults.summary.accuracy}%, below 95% target`,
                action: 'Review and improve pattern matching accuracy',
                currentAccuracy: this.testResults.summary.accuracy
            });
        }
        
        return recommendations;
    }
    
    /**
     * Analyze pattern effectiveness and coverage
     */
    analyzePatterns() {
        const analysis = {
            patternCounts: {
                total: this.manifestPatterns.length,
                unique: [...new Set(this.manifestPatterns)].length,
                duplicates: this.manifestPatterns.length - [...new Set(this.manifestPatterns)].length
            },
            domainCoverage: this.analyzeDomainCoverage(),
            patternComplexity: this.analyzePatternComplexity(),
            redundancy: this.analyzePatternRedundancy()
        };
        
        return analysis;
    }
    
    /**
     * Analyze domain coverage
     */
    analyzeDomainCoverage() {
        const domains = new Set();
        
        this.manifestPatterns.forEach(pattern => {
            const match = pattern.match(/https:\/\/([^\/]+)/);
            if (match) {
                domains.add(match[1]);
            }
        });
        
        return {
            uniqueDomains: domains.size,
            domains: Array.from(domains).sort()
        };
    }
    
    /**
     * Analyze pattern complexity
     */
    analyzePatternComplexity() {
        const complexity = {
            simple: 0,      // Just domain + /*
            moderate: 0,    // Domain + path + /*
            complex: 0      // Multiple wildcards or complex paths
        };
        
        this.manifestPatterns.forEach(pattern => {
            const wildcards = (pattern.match(/\*/g) || []).length;
            const pathParts = pattern.split('/').length - 3; // Subtract protocol + empty + domain
            
            if (wildcards === 1 && pathParts <= 1) {
                complexity.simple++;
            } else if (wildcards <= 2 && pathParts <= 2) {
                complexity.moderate++;
            } else {
                complexity.complex++;
            }
        });
        
        return complexity;
    }
    
    /**
     * Analyze pattern redundancy
     */
    analyzePatternRedundancy() {
        const redundancyIssues = [];
        
        // Check for patterns that are subsets of others
        for (let i = 0; i < this.manifestPatterns.length; i++) {
            for (let j = i + 1; j < this.manifestPatterns.length; j++) {
                const pattern1 = this.manifestPatterns[i];
                const pattern2 = this.manifestPatterns[j];
                
                if (this.patternSubsumesOther(pattern1, pattern2)) {
                    redundancyIssues.push({
                        broader: pattern1,
                        narrower: pattern2,
                        recommendation: 'Consider removing narrower pattern as it\'s covered by broader one'
                    });
                }
            }
        }
        
        return {
            issueCount: redundancyIssues.length,
            issues: redundancyIssues
        };
    }
    
    /**
     * Check if one pattern subsumes another
     */
    patternSubsumesOther(broader, narrower) {
        // Simple check: if narrower would match broader's pattern
        try {
            const broaderRegex = broader
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            
            const regex = new RegExp(`^${broaderRegex}$`);
            return regex.test(narrower.replace(/\*/g, 'test'));
        } catch {
            return false;
        }
    }
    
    /**
     * Run complete pattern validation test
     */
    async runCompleteTest() {
        console.log('🚀 Running Complete Pattern Accuracy Test...');
        
        const testResults = await this.runAccuracyTest();
        const report = this.generateTestReport();
        
        // Log summary
        console.log(`📊 Test Results Summary:`);
        console.log(`  Total Tests: ${report.results.summary.totalTests}`);
        console.log(`  Passed: ${report.results.summary.passedTests}`);
        console.log(`  Failed: ${report.results.summary.failedTests}`);
        console.log(`  Overall Accuracy: ${report.results.summary.accuracy}%`);
        
        if (report.recommendations.length > 0) {
            console.log(`⚠️  Recommendations:`);
            report.recommendations.forEach(rec => {
                console.log(`  - ${rec.type}: ${rec.description}`);
            });
        } else {
            console.log('✅ All patterns are working correctly!');
        }
        
        return report;
    }
}

// Create singleton instance
const patternTester = new PatternAccuracyTester();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatternAccuracyTester;
}

// Global access for testing
globalThis.PatternAccuracyTester = PatternAccuracyTester;