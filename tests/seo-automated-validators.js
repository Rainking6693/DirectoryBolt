/**
 * Automated SEO Validators for DirectoryBolt
 * 
 * Specialized validators for specific SEO components that can be run
 * independently or integrated into CI/CD pipelines.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');

class SEOAutomatedValidators {
    constructor(baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.timeout = 15000;
    }

    // ROBOTS.TXT VALIDATOR
    async validateRobotsTxt() {
        console.log('🤖 Validating robots.txt...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/robots.txt`, { timeout: this.timeout });
            const content = response.data;
            
            const validation = {
                accessible: response.status === 200,
                hasUserAgent: content.includes('User-agent:'),
                hasSitemap: content.includes('Sitemap:'),
                hasDisallow: content.includes('Disallow:'),
                isEmpty: content.trim().length === 0,
                size: content.length
            };

            // Validate specific requirements
            const errors = [];
            const warnings = [];

            if (!validation.accessible) {
                errors.push('robots.txt is not accessible at /robots.txt');
            }

            if (validation.isEmpty) {
                errors.push('robots.txt is empty');
            }

            if (!validation.hasUserAgent) {
                errors.push('Missing User-agent directive');
            }

            if (!validation.hasSitemap) {
                warnings.push('No Sitemap directive found');
            }

            if (validation.size > 500000) { // 500KB limit
                errors.push('robots.txt file too large (>500KB)');
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                details: validation,
                content: content.substring(0, 200) + (content.length > 200 ? '...' : '')
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Failed to fetch robots.txt: ${error.message}`],
                warnings: [],
                details: { accessible: false }
            };
        }
    }

    // SITEMAP.XML VALIDATOR
    async validateSitemapXml() {
        console.log('🗺️ Validating sitemap.xml...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/sitemap.xml`, { timeout: this.timeout });
            const content = response.data;
            
            const validation = {
                accessible: response.status === 200,
                isValidXML: content.includes('<?xml') && content.includes('<urlset'),
                hasNamespace: content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
                urlCount: (content.match(/<url>/g) || []).length,
                hasLastMod: content.includes('<lastmod>'),
                hasPriority: content.includes('<priority>'),
                hasChangeFreq: content.includes('<changefreq>'),
                size: content.length
            };

            const errors = [];
            const warnings = [];

            if (!validation.accessible) {
                errors.push('sitemap.xml is not accessible at /sitemap.xml');
                return { valid: false, errors, warnings, details: validation };
            }

            if (!validation.isValidXML) {
                errors.push('Invalid XML format');
            }

            if (!validation.hasNamespace) {
                errors.push('Missing required XML namespace');
            }

            if (validation.urlCount === 0) {
                errors.push('No URLs found in sitemap');
            }

            if (validation.urlCount > 50000) {
                errors.push('Too many URLs (>50,000)');
            }

            if (validation.size > 50000000) { // 50MB limit
                errors.push('Sitemap file too large (>50MB)');
            }

            if (!validation.hasLastMod) {
                warnings.push('Missing lastmod tags (recommended for better indexing)');
            }

            // Validate URL structure
            const urlMatches = content.match(/<loc>(.*?)<\/loc>/g);
            if (urlMatches) {
                const invalidUrls = urlMatches.filter(url => {
                    const urlContent = url.replace(/<\/?loc>/g, '');
                    return !urlContent.startsWith('http') || urlContent.length > 2048;
                });
                
                if (invalidUrls.length > 0) {
                    errors.push(`${invalidUrls.length} invalid URLs found`);
                }
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                details: validation
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Failed to fetch sitemap.xml: ${error.message}`],
                warnings: [],
                details: { accessible: false }
            };
        }
    }

    // STRUCTURED DATA VALIDATOR
    async validateStructuredData(path = '/') {
        console.log(`📊 Validating structured data for ${path}...`);
        
        try {
            const response = await axios.get(`${this.baseUrl}${path}`, { timeout: this.timeout });
            const $ = cheerio.load(response.data);
            
            const jsonLdScripts = $('script[type="application/ld+json"]');
            const structuredData = [];
            const errors = [];
            const warnings = [];

            if (jsonLdScripts.length === 0) {
                errors.push('No JSON-LD structured data found');
                return {
                    valid: false,
                    errors,
                    warnings,
                    details: { count: 0, types: [] }
                };
            }

            // Parse each JSON-LD script
            jsonLdScripts.each((i, script) => {
                try {
                    const data = JSON.parse($(script).html());
                    structuredData.push(data);
                } catch (e) {
                    errors.push(`Invalid JSON-LD syntax in script ${i + 1}: ${e.message}`);
                }
            });

            // Validate schema types and required fields
            const schemaTypes = structuredData.map(data => data['@type']).filter(Boolean);
            const requiredSchemas = ['Organization', 'WebSite'];
            
            requiredSchemas.forEach(requiredType => {
                const hasSchema = structuredData.some(data => 
                    data['@type'] === requiredType || 
                    (requiredType === 'Organization' && data['@type'] === 'LocalBusiness')
                );
                
                if (!hasSchema) {
                    warnings.push(`Missing recommended ${requiredType} schema`);
                }
            });

            // Validate Organization/LocalBusiness schema
            const orgSchema = structuredData.find(data => 
                data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness'
            );
            
            if (orgSchema) {
                const requiredFields = ['@context', '@type', 'name', 'url'];
                const missingFields = requiredFields.filter(field => !orgSchema[field]);
                
                if (missingFields.length > 0) {
                    errors.push(`Organization schema missing fields: ${missingFields.join(', ')}`);
                }
            }

            // Validate WebSite schema
            const websiteSchema = structuredData.find(data => data['@type'] === 'WebSite');
            if (websiteSchema) {
                if (!websiteSchema.potentialAction) {
                    warnings.push('WebSite schema missing search action');
                }
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                details: {
                    count: structuredData.length,
                    types: schemaTypes,
                    schemas: structuredData
                }
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Failed to validate structured data: ${error.message}`],
                warnings: [],
                details: { count: 0, types: [] }
            };
        }
    }

    // META TAGS VALIDATOR
    async validateMetaTags(path = '/') {
        console.log(`🏷️ Validating meta tags for ${path}...`);
        
        try {
            const response = await axios.get(`${this.baseUrl}${path}`, { timeout: this.timeout });
            const $ = cheerio.load(response.data);
            
            const errors = [];
            const warnings = [];
            const details = {};

            // Title tag validation
            const title = $('title').text();
            details.title = { text: title, length: title.length };
            
            if (!title) {
                errors.push('Missing title tag');
            } else {
                if (title.length < 30) errors.push('Title too short (<30 chars)');
                if (title.length > 60) warnings.push('Title may be truncated (>60 chars)');
            }

            // Meta description validation
            const description = $('meta[name="description"]').attr('content');
            details.description = { text: description, length: description ? description.length : 0 };
            
            if (!description) {
                errors.push('Missing meta description');
            } else {
                if (description.length < 120) warnings.push('Description too short (<120 chars)');
                if (description.length > 160) warnings.push('Description may be truncated (>160 chars)');
            }

            // Essential meta tags
            const essentialTags = {
                viewport: $('meta[name="viewport"]').attr('content'),
                charset: $('meta[charset]').attr('charset'),
                robots: $('meta[name="robots"]').attr('content')
            };
            
            details.essential = essentialTags;
            
            if (!essentialTags.viewport) errors.push('Missing viewport meta tag');
            if (!essentialTags.charset) errors.push('Missing charset declaration');
            if (!essentialTags.robots) warnings.push('Missing robots meta tag');

            // Open Graph tags
            const ogTags = {
                title: $('meta[property="og:title"]').attr('content'),
                description: $('meta[property="og:description"]').attr('content'),
                type: $('meta[property="og:type"]').attr('content'),
                image: $('meta[property="og:image"]').attr('content'),
                url: $('meta[property="og:url"]').attr('content')
            };
            
            details.openGraph = ogTags;
            
            Object.entries(ogTags).forEach(([key, value]) => {
                if (!value) warnings.push(`Missing og:${key} tag`);
            });

            // Twitter Card tags
            const twitterTags = {
                card: $('meta[name="twitter:card"]').attr('content'),
                title: $('meta[name="twitter:title"]').attr('content'),
                description: $('meta[name="twitter:description"]').attr('content')
            };
            
            details.twitter = twitterTags;
            
            if (!twitterTags.card) warnings.push('Missing Twitter Card tags');

            // Canonical link
            const canonical = $('link[rel="canonical"]').attr('href');
            details.canonical = canonical;
            
            if (!canonical) {
                warnings.push('Missing canonical link');
            } else if (!canonical.startsWith('http')) {
                errors.push('Canonical URL must be absolute');
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                details
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Failed to validate meta tags: ${error.message}`],
                warnings: [],
                details: {}
            };
        }
    }

    // HEADING HIERARCHY VALIDATOR
    async validateHeadingHierarchy(path = '/') {
        console.log(`📝 Validating heading hierarchy for ${path}...`);
        
        try {
            const response = await axios.get(`${this.baseUrl}${path}`, { timeout: this.timeout });
            const $ = cheerio.load(response.data);
            
            const headings = [];
            const errors = [];
            const warnings = [];

            // Extract all headings
            for (let i = 1; i <= 6; i++) {
                $(`h${i}`).each((index, element) => {
                    const text = $(element).text().trim();
                    headings.push({
                        level: i,
                        text,
                        hasText: text.length > 0,
                        position: headings.length
                    });
                });
            }

            if (headings.length === 0) {
                errors.push('No headings found on page');
                return {
                    valid: false,
                    errors,
                    warnings,
                    details: { count: 0, distribution: {} }
                };
            }

            // H1 validation
            const h1Headings = headings.filter(h => h.level === 1);
            
            if (h1Headings.length === 0) {
                errors.push('No H1 tag found');
            } else if (h1Headings.length > 1) {
                errors.push(`Multiple H1 tags found (${h1Headings.length})`);
            } else {
                const h1Text = h1Headings[0].text;
                if (h1Text.length < 20) warnings.push('H1 text is quite short');
                if (h1Text.length > 70) warnings.push('H1 text is quite long');
            }

            // Check for empty headings
            const emptyHeadings = headings.filter(h => !h.hasText);
            if (emptyHeadings.length > 0) {
                errors.push(`${emptyHeadings.length} empty headings found`);
            }

            // Check hierarchy structure
            const levels = headings.map(h => h.level);
            const hierarchyIssues = [];
            
            for (let i = 1; i < levels.length; i++) {
                const current = levels[i];
                const previous = levels[i - 1];
                
                if (current > previous + 1) {
                    hierarchyIssues.push(`Skipped from H${previous} to H${current} at position ${i + 1}`);
                }
            }
            
            if (hierarchyIssues.length > 0) {
                warnings.push(...hierarchyIssues);
            }

            // Distribution analysis
            const distribution = {};
            for (let i = 1; i <= 6; i++) {
                distribution[`h${i}`] = headings.filter(h => h.level === i).length;
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                details: {
                    count: headings.length,
                    distribution,
                    headings: headings.map(h => ({ level: h.level, text: h.text.substring(0, 50) })),
                    h1Text: h1Headings.length > 0 ? h1Headings[0].text : null
                }
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Failed to validate heading hierarchy: ${error.message}`],
                warnings: [],
                details: { count: 0, distribution: {} }
            };
        }
    }

    // PERFORMANCE VALIDATOR
    async validatePerformance(path = '/') {
        console.log(`⚡ Validating performance optimizations for ${path}...`);
        
        try {
            const startTime = performance.now();
            const response = await axios.get(`${this.baseUrl}${path}`, { timeout: this.timeout });
            const loadTime = performance.now() - startTime;
            
            const $ = cheerio.load(response.data);
            const errors = [];
            const warnings = [];
            const details = {};

            // Response time analysis
            details.loadTime = Math.round(loadTime);
            details.loadTimeRating = loadTime < 1000 ? 'excellent' : 
                                   loadTime < 2000 ? 'good' : 
                                   loadTime < 3000 ? 'fair' : 'poor';

            if (loadTime > 3000) {
                warnings.push(`Slow response time: ${Math.round(loadTime)}ms`);
            }

            // Headers analysis
            const headers = response.headers;
            details.compression = {
                hasGzip: headers['content-encoding'] === 'gzip',
                hasBrotli: headers['content-encoding'] === 'br',
                cacheControl: headers['cache-control'],
                hasEtag: !!headers.etag
            };

            if (!details.compression.hasGzip && !details.compression.hasBrotli) {
                warnings.push('No compression detected');
            }

            if (!details.compression.cacheControl) {
                warnings.push('Missing cache-control header');
            }

            // Resource analysis
            const resources = {
                stylesheets: $('link[rel="stylesheet"]').length,
                scripts: $('script[src]').length,
                images: $('img').length,
                inlineStyles: $('style').length,
                inlineScripts: $('script:not([src])').length
            };

            details.resources = resources;

            if (resources.stylesheets > 5) warnings.push(`Many CSS files: ${resources.stylesheets}`);
            if (resources.scripts > 10) warnings.push(`Many JS files: ${resources.scripts}`);
            if (resources.inlineStyles > 3) warnings.push(`Many inline styles: ${resources.inlineStyles}`);

            // Optimization features
            const optimizations = {
                hasPreconnect: $('link[rel="preconnect"]').length > 0,
                hasDnsPrefetch: $('link[rel="dns-prefetch"]').length > 0,
                hasPreload: $('link[rel="preload"]').length > 0,
                hasDeferredScripts: $('script[defer]').length > 0,
                hasAsyncScripts: $('script[async]').length > 0,
                hasLazyImages: $('img[loading="lazy"]').length > 0
            };

            details.optimizations = optimizations;

            if (!optimizations.hasPreconnect && !optimizations.hasDnsPrefetch) {
                warnings.push('No preconnect/dns-prefetch optimizations found');
            }

            if (!optimizations.hasDeferredScripts && !optimizations.hasAsyncScripts) {
                warnings.push('No async/defer script loading found');
            }

            // Image optimization
            const images = [];
            $('img').each((i, img) => {
                const $img = $(img);
                images.push({
                    hasAlt: !!$img.attr('alt'),
                    hasDimensions: !!$img.attr('width') && !!$img.attr('height'),
                    hasLazyLoading: $img.attr('loading') === 'lazy'
                });
            });

            const imageIssues = {
                missingAlt: images.filter(img => !img.hasAlt).length,
                missingDimensions: images.filter(img => !img.hasDimensions).length,
                missingLazyLoading: images.filter(img => !img.hasLazyLoading).length
            };

            details.imageOptimization = imageIssues;

            if (imageIssues.missingAlt > 0) {
                warnings.push(`${imageIssues.missingAlt} images missing alt text`);
            }

            if (imageIssues.missingDimensions > 0) {
                warnings.push(`${imageIssues.missingDimensions} images missing dimensions`);
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings,
                details
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Failed to validate performance: ${error.message}`],
                warnings: [],
                details: {}
            };
        }
    }

    // COMPREHENSIVE VALIDATION
    async runAllValidations(path = '/') {
        console.log('🔍 Running all SEO validations...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            url: `${this.baseUrl}${path}`,
            validations: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                hasWarnings: false
            }
        };

        const validators = [
            { name: 'robotsTxt', fn: () => this.validateRobotsTxt() },
            { name: 'sitemapXml', fn: () => this.validateSitemapXml() },
            { name: 'structuredData', fn: () => this.validateStructuredData(path) },
            { name: 'metaTags', fn: () => this.validateMetaTags(path) },
            { name: 'headingHierarchy', fn: () => this.validateHeadingHierarchy(path) },
            { name: 'performance', fn: () => this.validatePerformance(path) }
        ];

        for (const validator of validators) {
            try {
                console.log(`Running ${validator.name} validation...`);
                const result = await validator.fn();
                results.validations[validator.name] = result;
                
                results.summary.total++;
                if (result.valid) {
                    results.summary.passed++;
                    console.log(`✅ ${validator.name}: PASS`);
                } else {
                    results.summary.failed++;
                    console.log(`❌ ${validator.name}: FAIL`);
                    console.log(`   Errors: ${result.errors.join(', ')}`);
                }
                
                if (result.warnings && result.warnings.length > 0) {
                    results.summary.hasWarnings = true;
                    console.log(`   Warnings: ${result.warnings.join(', ')}`);
                }
                
                console.log();
                
            } catch (error) {
                results.validations[validator.name] = {
                    valid: false,
                    errors: [`Validation failed: ${error.message}`],
                    warnings: [],
                    details: {}
                };
                results.summary.failed++;
                console.log(`💥 ${validator.name}: ERROR - ${error.message}\n`);
            }
        }

        // Generate summary
        const successRate = (results.summary.passed / results.summary.total * 100).toFixed(1);
        results.summary.successRate = parseFloat(successRate);

        console.log('='.repeat(60));
        console.log('📊 SEO VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Validations: ${results.summary.total}`);
        console.log(`✅ Passed: ${results.summary.passed}`);
        console.log(`❌ Failed: ${results.summary.failed}`);
        console.log(`⚠️  Has Warnings: ${results.summary.hasWarnings ? 'Yes' : 'No'}`);
        console.log(`🎯 Success Rate: ${successRate}%`);
        
        if (results.summary.successRate >= 90) {
            console.log('🏆 SEO Status: EXCELLENT');
        } else if (results.summary.successRate >= 75) {
            console.log('🎯 SEO Status: GOOD');
        } else if (results.summary.successRate >= 50) {
            console.log('⚠️  SEO Status: NEEDS IMPROVEMENT');
        } else {
            console.log('🚨 SEO Status: CRITICAL ISSUES');
        }
        
        console.log('='.repeat(60));

        return results;
    }
}

// Export for use in other modules
module.exports = SEOAutomatedValidators;

// CLI execution
if (require.main === module) {
    const baseUrl = process.argv[2] || process.env.TEST_BASE_URL || 'http://localhost:3000';
    const path = process.argv[3] || '/';
    
    console.log(`🔍 Starting SEO validation for: ${baseUrl}${path}\n`);
    
    const validator = new SEOAutomatedValidators(baseUrl);
    
    validator.runAllValidations(path)
        .then(results => {
            // Save results to file if specified
            if (process.env.OUTPUT_FILE) {
                require('fs').writeFileSync(
                    process.env.OUTPUT_FILE,
                    JSON.stringify(results, null, 2)
                );
                console.log(`\n💾 Results saved to: ${process.env.OUTPUT_FILE}`);
            }
            
            // Exit with appropriate code
            const exitCode = results.summary.failed > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('🚨 Validation suite failed:', error.message);
            process.exit(1);
        });
}