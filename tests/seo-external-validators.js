/**
 * External SEO Validators for DirectoryBolt
 * 
 * Integrates with external validation services:
 * - Google Rich Results Test API
 * - PageSpeed Insights API
 * - Mobile-Friendly Test API
 * - Schema.org validation
 * 
 * Note: Requires API keys for some services
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

class SEOExternalValidators {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || process.env.TEST_BASE_URL || 'http://localhost:3000';
        this.pageSpeedApiKey = config.pageSpeedApiKey || process.env.PAGESPEED_API_KEY;
        this.timeout = config.timeout || 30000;
        
        // Remove trailing slash
        this.baseUrl = this.baseUrl.replace(/\/$/, '');
        
        console.log(`🌐 External SEO Validators initialized for: ${this.baseUrl}`);
    }

    // GOOGLE RICH RESULTS TEST
    async validateRichResults(url = null, source = 'url') {
        console.log('🔍 Testing Rich Results compatibility...');
        
        const testUrl = url || this.baseUrl;
        
        try {
            // Note: Google Rich Results Test doesn't have a public API
            // This is a simulation of what the validation would check
            const response = await axios.get(testUrl, { timeout: this.timeout });
            const html = response.data;
            
            // Extract JSON-LD structured data
            const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
            const structuredData = [];
            
            if (jsonLdMatches) {
                jsonLdMatches.forEach((match, index) => {
                    try {
                        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
                        const data = JSON.parse(jsonContent);
                        structuredData.push(data);
                    } catch (e) {
                        console.warn(`Invalid JSON-LD at position ${index}: ${e.message}`);
                    }
                });
            }

            // Validate common schema types
            const validationResults = {
                hasStructuredData: structuredData.length > 0,
                schemaTypes: structuredData.map(data => data['@type']).filter(Boolean),
                validSchemas: [],
                errors: [],
                warnings: []
            };

            structuredData.forEach((schema, index) => {
                const schemaType = schema['@type'];
                
                switch (schemaType) {
                    case 'Organization':
                    case 'LocalBusiness':
                        this.validateOrganizationSchema(schema, validationResults, index);
                        break;
                    case 'WebSite':
                        this.validateWebSiteSchema(schema, validationResults, index);
                        break;
                    case 'Product':
                        this.validateProductSchema(schema, validationResults, index);
                        break;
                    case 'Service':
                        this.validateServiceSchema(schema, validationResults, index);
                        break;
                    default:
                        validationResults.warnings.push(`Unknown schema type: ${schemaType} at index ${index}`);
                }
            });

            return {
                valid: validationResults.errors.length === 0,
                url: testUrl,
                structuredDataCount: structuredData.length,
                results: validationResults,
                recommendation: this.generateRichResultsRecommendations(validationResults)
            };

        } catch (error) {
            return {
                valid: false,
                url: testUrl,
                error: error.message,
                results: { hasStructuredData: false, errors: [`Failed to fetch URL: ${error.message}`] }
            };
        }
    }

    validateOrganizationSchema(schema, results, index) {
        const requiredFields = ['@context', '@type', 'name', 'url'];
        const recommendedFields = ['logo', 'contactPoint', 'address', 'sameAs'];
        
        const missingRequired = requiredFields.filter(field => !schema[field]);
        const missingRecommended = recommendedFields.filter(field => !schema[field]);

        if (missingRequired.length > 0) {
            results.errors.push(`Organization schema at index ${index} missing required fields: ${missingRequired.join(', ')}`);
        } else {
            results.validSchemas.push(`Organization (index ${index})`);
        }

        if (missingRecommended.length > 0) {
            results.warnings.push(`Organization schema at index ${index} missing recommended fields: ${missingRecommended.join(', ')}`);
        }

        // Validate logo format if present
        if (schema.logo && typeof schema.logo === 'string' && !schema.logo.startsWith('http')) {
            results.errors.push(`Organization schema at index ${index} has invalid logo URL`);
        }
    }

    validateWebSiteSchema(schema, results, index) {
        const requiredFields = ['@context', '@type', 'name', 'url'];
        const missingRequired = requiredFields.filter(field => !schema[field]);

        if (missingRequired.length > 0) {
            results.errors.push(`WebSite schema at index ${index} missing required fields: ${missingRequired.join(', ')}`);
        } else {
            results.validSchemas.push(`WebSite (index ${index})`);
        }

        // Check for search action
        if (!schema.potentialAction) {
            results.warnings.push(`WebSite schema at index ${index} missing search action (recommended for search box)`);
        }
    }

    validateProductSchema(schema, results, index) {
        const requiredFields = ['@context', '@type', 'name'];
        const missingRequired = requiredFields.filter(field => !schema[field]);

        if (missingRequired.length > 0) {
            results.errors.push(`Product schema at index ${index} missing required fields: ${missingRequired.join(', ')}`);
        } else {
            results.validSchemas.push(`Product (index ${index})`);
        }

        // Check for rich results fields
        if (!schema.offers && !schema.price) {
            results.warnings.push(`Product schema at index ${index} missing price information`);
        }

        if (!schema.image) {
            results.warnings.push(`Product schema at index ${index} missing image`);
        }
    }

    validateServiceSchema(schema, results, index) {
        const requiredFields = ['@context', '@type', 'name'];
        const missingRequired = requiredFields.filter(field => !schema[field]);

        if (missingRequired.length > 0) {
            results.errors.push(`Service schema at index ${index} missing required fields: ${missingRequired.join(', ')}`);
        } else {
            results.validSchemas.push(`Service (index ${index})`);
        }
    }

    generateRichResultsRecommendations(results) {
        const recommendations = [];

        if (!results.hasStructuredData) {
            recommendations.push('Add JSON-LD structured data to enable rich results');
        }

        if (results.errors.length > 0) {
            recommendations.push('Fix structured data errors to pass Rich Results validation');
        }

        if (!results.schemaTypes.includes('Organization') && !results.schemaTypes.includes('LocalBusiness')) {
            recommendations.push('Add Organization schema for better brand recognition');
        }

        if (!results.schemaTypes.includes('WebSite')) {
            recommendations.push('Add WebSite schema with search action for search box appearance');
        }

        if (results.schemaTypes.length < 2) {
            recommendations.push('Consider adding more relevant schema types for enhanced rich results');
        }

        return recommendations;
    }

    // PAGESPEED INSIGHTS API
    async validatePageSpeed(url = null, strategy = 'mobile') {
        console.log(`🚀 Testing PageSpeed Insights (${strategy})...`);
        
        if (!this.pageSpeedApiKey) {
            return {
                valid: false,
                error: 'PageSpeed Insights API key not configured',
                note: 'Set PAGESPEED_API_KEY environment variable to enable PageSpeed validation'
            };
        }

        const testUrl = url || this.baseUrl;
        const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

        try {
            const response = await axios.get(apiUrl, {
                params: {
                    url: testUrl,
                    strategy: strategy, // 'mobile' or 'desktop'
                    category: 'PERFORMANCE',
                    key: this.pageSpeedApiKey
                },
                timeout: 60000 // PageSpeed can take a while
            });

            const data = response.data;
            const lighthouse = data.lighthouseResult;
            const categories = lighthouse.categories;
            
            // Performance metrics
            const performanceScore = categories.performance.score * 100;
            const audits = lighthouse.audits;

            // Core Web Vitals
            const coreWebVitals = {
                FCP: audits['first-contentful-paint']?.numericValue,
                LCP: audits['largest-contentful-paint']?.numericValue,
                CLS: audits['cumulative-layout-shift']?.numericValue,
                FID: audits['max-potential-fid']?.numericValue,
                TTI: audits['interactive']?.numericValue
            };

            // Opportunities and diagnostics
            const opportunities = Object.entries(audits)
                .filter(([key, audit]) => audit.scoreDisplayMode === 'numeric' && audit.score < 0.9)
                .map(([key, audit]) => ({
                    id: key,
                    title: audit.title,
                    description: audit.description,
                    score: audit.score,
                    savings: audit.details?.overallSavingsMs || 0
                }))
                .sort((a, b) => b.savings - a.savings)
                .slice(0, 5);

            return {
                valid: performanceScore >= 75,
                url: testUrl,
                strategy,
                score: Math.round(performanceScore),
                rating: this.getPerformanceRating(performanceScore),
                coreWebVitals,
                opportunities,
                rawData: data,
                recommendations: this.generatePageSpeedRecommendations(performanceScore, opportunities)
            };

        } catch (error) {
            return {
                valid: false,
                url: testUrl,
                error: error.response?.data?.error?.message || error.message,
                strategy
            };
        }
    }

    getPerformanceRating(score) {
        if (score >= 90) return 'Fast';
        if (score >= 50) return 'Average';
        return 'Slow';
    }

    generatePageSpeedRecommendations(score, opportunities) {
        const recommendations = [];

        if (score < 50) {
            recommendations.push('Critical: Performance score is very low. Immediate optimization required.');
        } else if (score < 75) {
            recommendations.push('Warning: Performance score needs improvement for better user experience.');
        }

        opportunities.forEach(opp => {
            if (opp.savings > 500) {
                recommendations.push(`High Impact: ${opp.title} (saves ~${Math.round(opp.savings)}ms)`);
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('Great job! Performance score is good. Monitor regularly for regressions.');
        }

        return recommendations;
    }

    // MOBILE-FRIENDLY TEST
    async validateMobileFriendly(url = null) {
        console.log('📱 Testing mobile-friendliness...');
        
        const testUrl = url || this.baseUrl;

        try {
            // Since Google Mobile-Friendly Test API is deprecated,
            // we'll perform our own mobile-friendly checks
            const response = await axios.get(testUrl, { 
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
                }
            });

            const html = response.data;
            const mobileChecks = {
                hasViewportMeta: /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html),
                viewportContent: (html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)/i) || [])[1],
                hasResponsiveCSS: html.includes('@media') || html.includes('responsive'),
                hasFlexboxGrid: html.includes('flex') || html.includes('grid'),
                hasTouchOptimization: html.includes('touch-action') || html.includes('tap-highlight'),
                fontSizeCheck: !html.includes('font-size: 10px') && !html.includes('font-size:10px')
            };

            // Analyze viewport meta tag
            let viewportIssues = [];
            if (!mobileChecks.hasViewportMeta) {
                viewportIssues.push('Missing viewport meta tag');
            } else if (mobileChecks.viewportContent) {
                const viewport = mobileChecks.viewportContent;
                if (!viewport.includes('width=device-width')) {
                    viewportIssues.push('Viewport missing width=device-width');
                }
                if (!viewport.includes('initial-scale=1')) {
                    viewportIssues.push('Viewport missing initial-scale=1');
                }
                if (viewport.includes('maximum-scale') && viewport.includes('maximum-scale=1')) {
                    viewportIssues.push('Viewport restricts user scaling');
                }
            }

            const score = Object.values(mobileChecks).filter(Boolean).length;
            const maxScore = Object.keys(mobileChecks).length;
            const percentScore = (score / maxScore * 100);

            return {
                valid: viewportIssues.length === 0 && percentScore >= 80,
                url: testUrl,
                score: Math.round(percentScore),
                checks: mobileChecks,
                issues: viewportIssues,
                recommendations: this.generateMobileRecommendations(mobileChecks, viewportIssues)
            };

        } catch (error) {
            return {
                valid: false,
                url: testUrl,
                error: error.message
            };
        }
    }

    generateMobileRecommendations(checks, issues) {
        const recommendations = [];

        if (issues.length > 0) {
            recommendations.push(`Fix viewport issues: ${issues.join(', ')}`);
        }

        if (!checks.hasResponsiveCSS) {
            recommendations.push('Add responsive CSS with media queries');
        }

        if (!checks.hasFlexboxGrid) {
            recommendations.push('Consider using modern layout methods (Flexbox/Grid)');
        }

        if (!checks.hasTouchOptimization) {
            recommendations.push('Optimize for touch interactions');
        }

        if (!checks.fontSizeCheck) {
            recommendations.push('Ensure text is readable on mobile devices (avoid tiny fonts)');
        }

        if (recommendations.length === 0) {
            recommendations.push('Mobile optimization looks good! Test on real devices for best results.');
        }

        return recommendations;
    }

    // COMPREHENSIVE EXTERNAL VALIDATION
    async runAllExternalValidations(url = null) {
        console.log('🌐 Running all external SEO validations...\n');
        
        const testUrl = url || this.baseUrl;
        const startTime = performance.now();
        
        const results = {
            timestamp: new Date().toISOString(),
            url: testUrl,
            duration: 0,
            validations: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                avgScore: 0
            }
        };

        const validators = [
            {
                name: 'richResults',
                fn: () => this.validateRichResults(testUrl),
                weight: 1
            },
            {
                name: 'pageSpeedMobile',
                fn: () => this.validatePageSpeed(testUrl, 'mobile'),
                weight: 2
            },
            {
                name: 'pageSpeedDesktop',
                fn: () => this.validatePageSpeed(testUrl, 'desktop'),
                weight: 1
            },
            {
                name: 'mobileFriendly',
                fn: () => this.validateMobileFriendly(testUrl),
                weight: 1
            }
        ];

        let totalScore = 0;
        let totalWeight = 0;

        for (const validator of validators) {
            try {
                console.log(`\n🔄 Running ${validator.name} validation...`);
                const result = await validator.fn();
                results.validations[validator.name] = result;
                results.summary.total++;

                if (result.valid) {
                    results.summary.passed++;
                    console.log(`✅ ${validator.name}: PASS`);
                } else {
                    results.summary.failed++;
                    console.log(`❌ ${validator.name}: FAIL`);
                    if (result.error) {
                        console.log(`   Error: ${result.error}`);
                    }
                }

                // Calculate weighted score
                if (result.score !== undefined) {
                    totalScore += result.score * validator.weight;
                    totalWeight += validator.weight;
                    console.log(`   Score: ${result.score}/${validator.name === 'richResults' ? '100' : '100'}`);
                }

                if (result.recommendations && result.recommendations.length > 0) {
                    console.log(`   Recommendations:`);
                    result.recommendations.slice(0, 3).forEach(rec => {
                        console.log(`   • ${rec}`);
                    });
                }

            } catch (error) {
                results.validations[validator.name] = {
                    valid: false,
                    error: `Validation failed: ${error.message}`
                };
                results.summary.failed++;
                console.log(`💥 ${validator.name}: ERROR - ${error.message}`);
            }
        }

        // Calculate summary metrics
        const endTime = performance.now();
        results.duration = Math.round(endTime - startTime);
        results.summary.successRate = (results.summary.passed / results.summary.total * 100);
        results.summary.avgScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

        // Generate overall recommendations
        results.overallRecommendations = this.generateOverallRecommendations(results.validations);

        this.printExternalValidationSummary(results);

        return results;
    }

    generateOverallRecommendations(validations) {
        const recommendations = [];

        // Rich Results recommendations
        if (validations.richResults && !validations.richResults.valid) {
            recommendations.push('🔍 Fix structured data errors to enable rich search results');
        }

        // Performance recommendations
        const mobileScore = validations.pageSpeedMobile?.score || 0;
        const desktopScore = validations.pageSpeedDesktop?.score || 0;
        
        if (mobileScore < 75 || desktopScore < 75) {
            recommendations.push('⚡ Optimize page speed - critical for user experience and rankings');
        }

        // Mobile recommendations
        if (validations.mobileFriendly && !validations.mobileFriendly.valid) {
            recommendations.push('📱 Fix mobile-friendliness issues for better mobile search rankings');
        }

        // API key recommendations
        if (validations.pageSpeedMobile?.error?.includes('API key')) {
            recommendations.push('🔑 Configure PageSpeed Insights API key for detailed performance analysis');
        }

        if (recommendations.length === 0) {
            recommendations.push('🎉 All external validations look good! Continue monitoring regularly.');
        }

        return recommendations;
    }

    printExternalValidationSummary(results) {
        console.log('\n' + '='.repeat(70));
        console.log('🌐 EXTERNAL SEO VALIDATION SUMMARY');
        console.log('='.repeat(70));
        
        console.log(`📊 Results for: ${results.url}`);
        console.log(`⏱️  Duration: ${(results.duration / 1000).toFixed(1)}s`);
        console.log();
        
        console.log(`📈 Overall Metrics:`);
        console.log(`   Total Validations: ${results.summary.total}`);
        console.log(`   ✅ Passed: ${results.summary.passed}`);
        console.log(`   ❌ Failed: ${results.summary.failed}`);
        console.log(`   🎯 Success Rate: ${results.summary.successRate.toFixed(1)}%`);
        console.log(`   📊 Average Score: ${results.summary.avgScore}/100`);
        console.log();

        // Individual results
        console.log(`🔍 Validation Details:`);
        Object.entries(results.validations).forEach(([name, result]) => {
            const status = result.valid ? '✅ PASS' : '❌ FAIL';
            const score = result.score ? ` (${result.score}/100)` : '';
            console.log(`   ${name}: ${status}${score}`);
            
            if (result.error && result.error.includes('API key')) {
                console.log(`     ℹ️  API key required for full validation`);
            }
        });

        console.log();

        // Overall health assessment
        if (results.summary.successRate >= 90) {
            console.log(`🏆 SEO Status: EXCELLENT - Ready for production`);
        } else if (results.summary.successRate >= 75) {
            console.log(`🎯 SEO Status: GOOD - Minor optimizations recommended`);
        } else if (results.summary.successRate >= 50) {
            console.log(`⚠️  SEO Status: NEEDS WORK - Address critical issues`);
        } else {
            console.log(`🚨 SEO Status: CRITICAL - Major issues need fixing`);
        }

        console.log();

        // Top recommendations
        if (results.overallRecommendations.length > 0) {
            console.log(`💡 Top Recommendations:`);
            results.overallRecommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
        }

        console.log('\n' + '='.repeat(70));
    }
}

module.exports = SEOExternalValidators;

// CLI execution
if (require.main === module) {
    const config = {
        baseUrl: process.argv[2] || process.env.TEST_BASE_URL || 'http://localhost:3000',
        pageSpeedApiKey: process.env.PAGESPEED_API_KEY
    };

    console.log(`🌐 Starting external SEO validations for: ${config.baseUrl}\n`);

    const validator = new SEOExternalValidators(config);

    validator.runAllExternalValidations()
        .then(results => {
            // Save results if output file specified
            if (process.env.OUTPUT_FILE) {
                require('fs').writeFileSync(
                    process.env.OUTPUT_FILE,
                    JSON.stringify(results, null, 2)
                );
                console.log(`\n💾 Results saved to: ${process.env.OUTPUT_FILE}`);
            }

            // Exit with appropriate code
            const exitCode = results.summary.successRate < 75 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('🚨 External validation suite failed:', error.message);
            process.exit(1);
        });
}