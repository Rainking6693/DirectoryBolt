/**
 * Comprehensive SEO Testing Suite for DirectoryBolt
 * 
 * This suite validates all SEO implementations including:
 * - Meta tags validation
 * - Structured data verification
 * - Robots.txt and sitemap.xml accessibility
 * - Heading hierarchy validation
 * - Performance optimization checks
 * - GTM tracking verification
 * - Mobile-friendliness validation
 * 
 * Usage:
 *   node tests/seo-validation-suite.js
 *   TEST_BASE_URL=http://localhost:3000 node tests/seo-validation-suite.js
 *   NODE_ENV=production SITE_URL=https://directorybolt.com node tests/seo-validation-suite.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');

class SEOValidationSuite {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || process.env.TEST_BASE_URL || process.env.SITE_URL || 'http://localhost:3000';
        this.verbose = config.verbose !== false;
        this.timeout = config.timeout || 30000;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 0,
            details: []
        };
        
        // Remove trailing slash for consistency
        this.baseUrl = this.baseUrl.replace(/\/$/, '');
        
        console.log(`🔍 SEO Validation Suite initialized for: ${this.baseUrl}`);
        console.log(`⚙️  Timeout: ${this.timeout}ms | Verbose: ${this.verbose}`);
    }

    async runAllTests() {
        console.log('\n🚀 Starting Comprehensive SEO Validation Suite\n');
        const startTime = performance.now();

        try {
            // Test categories in logical order
            await this.testRobotsAndSitemap();
            await this.testMetaTags();
            await this.testStructuredData();
            await this.testHeadingHierarchy();
            await this.testPerformanceOptimizations();
            await this.testGTMTracking();
            await this.testMobileFriendliness();
            await this.testPageSpeedMetrics();
            await this.testSEOBestPractices();

        } catch (error) {
            this.logError('Suite execution failed', error);
            this.results.errors++;
        }

        const endTime = performance.now();
        this.printResults(endTime - startTime);
        
        return this.results;
    }

    // 1. ROBOTS.TXT AND SITEMAP.XML TESTS
    async testRobotsAndSitemap() {
        console.log('📋 Testing robots.txt and sitemap.xml accessibility...\n');

        // Test robots.txt
        await this.runTest('Robots.txt accessibility', async () => {
            const response = await this.makeRequest(`${this.baseUrl}/robots.txt`);
            
            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            const content = response.data;
            if (!content.includes('User-agent:')) {
                throw new Error('Missing User-agent directive');
            }

            if (!content.includes('Sitemap:')) {
                throw new Error('Missing Sitemap directive');
            }

            return {
                status: response.status,
                hasUserAgent: content.includes('User-agent:'),
                hasSitemap: content.includes('Sitemap:'),
                content: content.substring(0, 200) + '...'
            };
        });

        // Test sitemap.xml
        await this.runTest('Sitemap.xml accessibility', async () => {
            const response = await this.makeRequest(`${this.baseUrl}/sitemap.xml`);
            
            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            const content = response.data;
            if (!content.includes('<?xml') && !content.includes('<urlset')) {
                throw new Error('Invalid XML sitemap format');
            }

            // Count URLs in sitemap
            const urlMatches = content.match(/<url>/g);
            const urlCount = urlMatches ? urlMatches.length : 0;

            return {
                status: response.status,
                isValidXML: content.includes('<?xml') && content.includes('<urlset'),
                urlCount,
                hasLastMod: content.includes('<lastmod>'),
                hasPriority: content.includes('<priority>')
            };
        });

        // Test sitemap submission to Google
        await this.runTest('Sitemap Google Search Console compatibility', async () => {
            const response = await this.makeRequest(`${this.baseUrl}/sitemap.xml`);
            const content = response.data;

            // Check for Google Search Console requirements
            const checks = {
                hasNamespace: content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
                hasValidUrls: /<loc>https?:\/\/[^<]+<\/loc>/.test(content),
                underSizeLimit: content.length < 50000000, // 50MB limit
                underUrlLimit: (content.match(/<url>/g) || []).length <= 50000
            };

            if (!Object.values(checks).every(Boolean)) {
                throw new Error('Sitemap doesn\'t meet Google Search Console requirements');
            }

            return checks;
        });
    }

    // 2. META TAGS VALIDATION
    async testMetaTags() {
        console.log('🏷️  Testing comprehensive meta tags...\n');

        const html = await this.fetchPageHTML('/');
        const $ = cheerio.load(html);

        // Essential meta tags
        await this.runTest('Title tag validation', async () => {
            const title = $('title').text();
            if (!title || title.length === 0) {
                throw new Error('Missing title tag');
            }
            if (title.length > 60) {
                throw new Error(`Title too long: ${title.length} chars (recommended: <60)`);
            }
            if (title.length < 30) {
                throw new Error(`Title too short: ${title.length} chars (recommended: >30)`);
            }
            return { title, length: title.length };
        });

        await this.runTest('Meta description validation', async () => {
            const description = $('meta[name="description"]').attr('content');
            if (!description) {
                throw new Error('Missing meta description');
            }
            if (description.length > 160) {
                throw new Error(`Description too long: ${description.length} chars (recommended: <160)`);
            }
            if (description.length < 120) {
                throw new Error(`Description too short: ${description.length} chars (recommended: >120)`);
            }
            return { description, length: description.length };
        });

        // Open Graph tags
        await this.runTest('Open Graph meta tags', async () => {
            const ogTags = {
                'og:title': $('meta[property="og:title"]').attr('content'),
                'og:description': $('meta[property="og:description"]').attr('content'),
                'og:type': $('meta[property="og:type"]').attr('content'),
                'og:image': $('meta[property="og:image"]').attr('content'),
                'og:url': $('meta[property="og:url"]').attr('content')
            };

            const missing = Object.entries(ogTags)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missing.length > 0) {
                throw new Error(`Missing OG tags: ${missing.join(', ')}`);
            }

            return ogTags;
        });

        // Twitter Cards
        await this.runTest('Twitter Card meta tags', async () => {
            const twitterTags = {
                'twitter:card': $('meta[name="twitter:card"]').attr('content'),
                'twitter:title': $('meta[name="twitter:title"]').attr('content'),
                'twitter:description': $('meta[name="twitter:description"]').attr('content')
            };

            const missing = Object.entries(twitterTags)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missing.length > 0) {
                throw new Error(`Missing Twitter tags: ${missing.join(', ')}`);
            }

            return twitterTags;
        });

        // Technical meta tags
        await this.runTest('Technical meta tags', async () => {
            const technicalTags = {
                viewport: $('meta[name="viewport"]').attr('content'),
                charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content'),
                robots: $('meta[name="robots"]').attr('content'),
                canonical: $('link[rel="canonical"]').attr('href'),
                themeColor: $('meta[name="theme-color"]').attr('content')
            };

            const issues = [];
            if (!technicalTags.viewport) issues.push('Missing viewport meta tag');
            if (!technicalTags.charset) issues.push('Missing charset declaration');
            if (!technicalTags.robots) issues.push('Missing robots meta tag');
            if (!technicalTags.canonical) issues.push('Missing canonical link');

            if (issues.length > 0) {
                throw new Error(`Technical meta issues: ${issues.join(', ')}`);
            }

            return technicalTags;
        });
    }

    // 3. STRUCTURED DATA VALIDATION
    async testStructuredData() {
        console.log('🏗️  Testing structured data implementation...\n');

        const html = await this.fetchPageHTML('/');
        const $ = cheerio.load(html);

        await this.runTest('JSON-LD structured data presence', async () => {
            const jsonLdScripts = $('script[type="application/ld+json"]');
            
            if (jsonLdScripts.length === 0) {
                throw new Error('No JSON-LD structured data found');
            }

            const structuredData = [];
            jsonLdScripts.each((i, script) => {
                try {
                    const data = JSON.parse($(script).html());
                    structuredData.push(data);
                } catch (e) {
                    throw new Error(`Invalid JSON-LD syntax in script ${i + 1}`);
                }
            });

            return {
                count: jsonLdScripts.length,
                types: structuredData.map(data => data['@type']).filter(Boolean)
            };
        });

        await this.runTest('Organization schema validation', async () => {
            const jsonLdScripts = $('script[type="application/ld+json"]');
            let organizationSchema = null;

            jsonLdScripts.each((i, script) => {
                try {
                    const data = JSON.parse($(script).html());
                    if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') {
                        organizationSchema = data;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            });

            if (!organizationSchema) {
                throw new Error('No Organization or LocalBusiness schema found');
            }

            const required = ['@context', '@type', 'name', 'url'];
            const missing = required.filter(field => !organizationSchema[field]);

            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }

            return {
                type: organizationSchema['@type'],
                name: organizationSchema.name,
                hasLogo: !!organizationSchema.logo,
                hasSameAs: !!organizationSchema.sameAs,
                hasAddress: !!organizationSchema.address
            };
        });

        await this.runTest('WebSite schema with search action', async () => {
            const jsonLdScripts = $('script[type="application/ld+json"]');
            let websiteSchema = null;

            jsonLdScripts.each((i, script) => {
                try {
                    const data = JSON.parse($(script).html());
                    if (data['@type'] === 'WebSite') {
                        websiteSchema = data;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            });

            if (!websiteSchema) {
                throw new Error('No WebSite schema found');
            }

            return {
                hasSearchAction: !!websiteSchema.potentialAction,
                hasName: !!websiteSchema.name,
                hasUrl: !!websiteSchema.url
            };
        });
    }

    // 4. HEADING HIERARCHY VALIDATION
    async testHeadingHierarchy() {
        console.log('📑 Testing heading hierarchy structure...\n');

        const html = await this.fetchPageHTML('/');
        const $ = cheerio.load(html);

        await this.runTest('Heading hierarchy validation', async () => {
            const headings = [];
            
            for (let i = 1; i <= 6; i++) {
                $(`h${i}`).each((index, element) => {
                    headings.push({
                        level: i,
                        text: $(element).text().trim(),
                        hasText: $(element).text().trim().length > 0
                    });
                });
            }

            if (headings.length === 0) {
                throw new Error('No headings found on page');
            }

            // Check for H1
            const h1Count = headings.filter(h => h.level === 1).length;
            if (h1Count === 0) {
                throw new Error('No H1 tag found');
            }
            if (h1Count > 1) {
                throw new Error(`Multiple H1 tags found (${h1Count})`);
            }

            // Check for proper hierarchy
            const levels = headings.map(h => h.level);
            const hierarchyIssues = [];

            for (let i = 1; i < levels.length; i++) {
                const current = levels[i];
                const previous = levels[i - 1];
                
                if (current > previous + 1) {
                    hierarchyIssues.push(`Skipped from H${previous} to H${current}`);
                }
            }

            // Check for empty headings
            const emptyHeadings = headings.filter(h => !h.hasText);

            return {
                totalHeadings: headings.length,
                h1Count,
                hierarchy: levels,
                hierarchyIssues,
                emptyHeadings: emptyHeadings.length,
                headingDistribution: {
                    h1: headings.filter(h => h.level === 1).length,
                    h2: headings.filter(h => h.level === 2).length,
                    h3: headings.filter(h => h.level === 3).length,
                    h4: headings.filter(h => h.level === 4).length,
                    h5: headings.filter(h => h.level === 5).length,
                    h6: headings.filter(h => h.level === 6).length
                }
            };
        });

        await this.runTest('H1 content quality', async () => {
            const h1 = $('h1').first().text().trim();
            
            if (!h1) {
                throw new Error('H1 is empty');
            }

            const issues = [];
            if (h1.length < 20) issues.push(`H1 too short (${h1.length} chars)`);
            if (h1.length > 70) issues.push(`H1 too long (${h1.length} chars)`);
            if (!/[A-Za-z]/.test(h1)) issues.push('H1 contains no letters');

            if (issues.length > 0) {
                throw new Error(issues.join(', '));
            }

            return {
                text: h1,
                length: h1.length,
                containsKeywords: h1.toLowerCase().includes('directory')
            };
        });
    }

    // 5. PERFORMANCE OPTIMIZATION TESTS
    async testPerformanceOptimizations() {
        console.log('⚡ Testing performance optimizations...\n');

        await this.runTest('Critical CSS and resource loading', async () => {
            const html = await this.fetchPageHTML('/');
            const $ = cheerio.load(html);

            const metrics = {
                hasPreconnect: $('link[rel="preconnect"]').length > 0,
                hasDnsPrefetch: $('link[rel="dns-prefetch"]').length > 0,
                hasPreload: $('link[rel="preload"]').length > 0,
                hasDefer: $('script[defer]').length > 0,
                hasAsync: $('script[async]').length > 0,
                cssCount: $('link[rel="stylesheet"]').length,
                jsCount: $('script[src]').length,
                inlineStyles: $('style').length,
                inlineScripts: $('script:not([src])').length
            };

            const issues = [];
            if (!metrics.hasPreconnect && !metrics.hasDnsPrefetch) {
                issues.push('No preconnect or dns-prefetch found');
            }
            if (metrics.cssCount > 5) {
                issues.push(`Too many CSS files (${metrics.cssCount})`);
            }
            if (metrics.jsCount > 10) {
                issues.push(`Too many JS files (${metrics.jsCount})`);
            }

            return { ...metrics, issues };
        });

        await this.runTest('Image optimization', async () => {
            const html = await this.fetchPageHTML('/');
            const $ = cheerio.load(html);

            const images = [];
            $('img').each((i, img) => {
                const $img = $(img);
                images.push({
                    src: $img.attr('src'),
                    alt: $img.attr('alt'),
                    loading: $img.attr('loading'),
                    width: $img.attr('width'),
                    height: $img.attr('height')
                });
            });

            const issues = [];
            const missingAlt = images.filter(img => !img.alt).length;
            const missingDimensions = images.filter(img => !img.width || !img.height).length;
            const missingLazyLoading = images.filter(img => img.loading !== 'lazy').length;

            if (missingAlt > 0) issues.push(`${missingAlt} images missing alt text`);
            if (missingDimensions > 0) issues.push(`${missingDimensions} images missing dimensions`);

            return {
                totalImages: images.length,
                missingAlt,
                missingDimensions,
                missingLazyLoading,
                issues
            };
        });

        await this.runTest('Compression and caching headers', async () => {
            const response = await this.makeRequest(`${this.baseUrl}/`);
            const headers = response.headers;

            const compressionHeaders = {
                hasGzip: headers['content-encoding'] === 'gzip',
                hasBrotli: headers['content-encoding'] === 'br',
                cacheControl: headers['cache-control'],
                etag: !!headers.etag,
                lastModified: !!headers['last-modified']
            };

            const issues = [];
            if (!compressionHeaders.hasGzip && !compressionHeaders.hasBrotli) {
                issues.push('No compression detected');
            }
            if (!compressionHeaders.cacheControl) {
                issues.push('Missing cache-control header');
            }

            return { ...compressionHeaders, issues };
        });
    }

    // 6. GTM TRACKING VALIDATION
    async testGTMTracking() {
        console.log('📊 Testing Google Tag Manager implementation...\n');

        const html = await this.fetchPageHTML('/');
        const $ = cheerio.load(html);

        await this.runTest('GTM container installation', async () => {
            const gtmHeadScript = html.includes('googletagmanager.com/gtm.js');
            const gtmBodyScript = html.includes('googletagmanager.com/ns.html');
            const gtmContainerId = html.match(/GTM-[A-Z0-9]+/);

            if (!gtmHeadScript) {
                throw new Error('GTM head script not found');
            }

            const result = {
                hasHeadScript: gtmHeadScript,
                hasBodyScript: gtmBodyScript,
                containerId: gtmContainerId ? gtmContainerId[0] : null,
                isProperlyInstalled: gtmHeadScript && gtmBodyScript
            };

            if (!result.isProperlyInstalled) {
                throw new Error('GTM not properly installed (missing body script)');
            }

            return result;
        });

        await this.runTest('GTM dataLayer initialization', async () => {
            const hasDataLayer = html.includes('dataLayer') || html.includes('window.dataLayer');
            const dataLayerInit = html.match(/dataLayer\s*=\s*\[/);

            if (!hasDataLayer) {
                throw new Error('dataLayer not found');
            }

            return {
                hasDataLayer,
                hasInitialization: !!dataLayerInit,
                initializationCode: dataLayerInit ? dataLayerInit[0] : null
            };
        });

        await this.runTest('Enhanced ecommerce tracking setup', async () => {
            // Check for ecommerce-related GTM events
            const hasEcommerce = html.includes('ecommerce') || 
                                html.includes('purchase') || 
                                html.includes('add_to_cart');

            // This is a basic check - in production, you'd want to test actual event firing
            return {
                hasEcommerceEvents: hasEcommerce,
                note: 'Full ecommerce tracking requires runtime testing with GTM Preview mode'
            };
        });
    }

    // 7. MOBILE-FRIENDLINESS TESTS
    async testMobileFriendliness() {
        console.log('📱 Testing mobile-friendliness...\n');

        const html = await this.fetchPageHTML('/');
        const $ = cheerio.load(html);

        await this.runTest('Viewport meta tag', async () => {
            const viewport = $('meta[name="viewport"]').attr('content');
            
            if (!viewport) {
                throw new Error('Viewport meta tag missing');
            }

            const hasWidth = viewport.includes('width=device-width');
            const hasInitialScale = viewport.includes('initial-scale=1');

            if (!hasWidth || !hasInitialScale) {
                throw new Error('Viewport meta tag missing required attributes');
            }

            return {
                content: viewport,
                hasWidth,
                hasInitialScale,
                isOptimal: hasWidth && hasInitialScale
            };
        });

        await this.runTest('Touch-friendly design', async () => {
            // Check for common touch-unfriendly elements
            const clickableElements = $('button, a, input[type="button"], input[type="submit"]').length;
            const hasSmallText = html.includes('font-size: 12px') || html.includes('font-size:12px');
            
            return {
                clickableElements,
                hasSmallText,
                note: 'Manual testing recommended for tap target size validation'
            };
        });

        await this.runTest('Responsive design indicators', async () => {
            // Look for responsive design patterns
            const hasMediaQueries = html.includes('@media') || html.includes('media=');
            const hasFlexbox = html.includes('flex') || html.includes('grid');
            const hasResponsiveClasses = html.includes('sm:') || html.includes('md:') || html.includes('lg:');

            return {
                hasMediaQueries,
                hasFlexbox,
                hasResponsiveClasses: hasResponsiveClasses, // Tailwind classes
                isLikelyResponsive: hasMediaQueries || hasFlexbox || hasResponsiveClasses
            };
        });
    }

    // 8. PAGE SPEED METRICS
    async testPageSpeedMetrics() {
        console.log('🚀 Testing page speed metrics...\n');

        await this.runTest('Basic performance timing', async () => {
            const startTime = performance.now();
            await this.makeRequest(`${this.baseUrl}/`);
            const endTime = performance.now();
            
            const loadTime = endTime - startTime;
            
            const rating = loadTime < 1000 ? 'excellent' : 
                          loadTime < 2000 ? 'good' : 
                          loadTime < 3000 ? 'fair' : 'poor';

            return {
                loadTimeMs: Math.round(loadTime),
                rating,
                isAcceptable: loadTime < 3000
            };
        });

        await this.runTest('Resource count analysis', async () => {
            const html = await this.fetchPageHTML('/');
            const $ = cheerio.load(html);

            const resources = {
                stylesheets: $('link[rel="stylesheet"]').length,
                scripts: $('script[src]').length,
                images: $('img').length,
                fonts: $('link[rel="preload"][as="font"], @font-face').length,
                total: 0
            };

            resources.total = resources.stylesheets + resources.scripts + resources.images + resources.fonts;

            const issues = [];
            if (resources.total > 50) issues.push(`High resource count: ${resources.total}`);
            if (resources.scripts > 15) issues.push(`Too many scripts: ${resources.scripts}`);

            return { ...resources, issues };
        });

        await this.runTest('Critical resource optimization', async () => {
            const html = await this.fetchPageHTML('/');
            
            // Check for render-blocking resources
            const hasInlineCSS = html.includes('<style>');
            const hasAsyncScripts = html.includes('async') || html.includes('defer');
            const hasPreload = html.includes('rel="preload"');

            return {
                hasInlineCSS,
                hasAsyncScripts,
                hasPreload,
                isOptimized: hasInlineCSS && hasAsyncScripts
            };
        });
    }

    // 9. SEO BEST PRACTICES
    async testSEOBestPractices() {
        console.log('🎯 Testing SEO best practices...\n');

        const html = await this.fetchPageHTML('/');
        const $ = cheerio.load(html);

        await this.runTest('URL structure and canonicalization', async () => {
            const canonical = $('link[rel="canonical"]').attr('href');
            const currentUrl = this.baseUrl;

            const checks = {
                hasCanonical: !!canonical,
                canonicalMatchesUrl: canonical === currentUrl || canonical === `${currentUrl}/`,
                isHttps: currentUrl.startsWith('https://'),
                hasCleanUrl: !currentUrl.includes('?') && !currentUrl.includes('#')
            };

            return checks;
        });

        await this.runTest('Content quality indicators', async () => {
            const textContent = $('body').text();
            const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
            
            const hasEnoughContent = wordCount > 300;
            const hasKeywords = textContent.toLowerCase().includes('directory') && 
                               textContent.toLowerCase().includes('business');

            return {
                wordCount,
                hasEnoughContent,
                hasKeywords,
                contentQuality: hasEnoughContent && hasKeywords ? 'good' : 'needs improvement'
            };
        });

        await this.runTest('Internal linking structure', async () => {
            const internalLinks = [];
            const externalLinks = [];

            $('a[href]').each((i, link) => {
                const href = $(link).attr('href');
                if (href) {
                    if (href.startsWith('/') || href.includes(this.baseUrl)) {
                        internalLinks.push(href);
                    } else if (href.startsWith('http')) {
                        externalLinks.push(href);
                    }
                }
            });

            return {
                internalLinksCount: internalLinks.length,
                externalLinksCount: externalLinks.length,
                hasGoodInternalLinking: internalLinks.length > 3,
                linkRatio: internalLinks.length / (externalLinks.length || 1)
            };
        });

        await this.runTest('Social media integration', async () => {
            const socialLinks = [];
            
            $('a[href]').each((i, link) => {
                const href = $(link).attr('href');
                if (href && (href.includes('facebook.com') || 
                           href.includes('twitter.com') || 
                           href.includes('linkedin.com') || 
                           href.includes('instagram.com'))) {
                    socialLinks.push(href);
                }
            });

            const hasSocialShare = html.includes('share') || html.includes('social');

            return {
                socialLinksCount: socialLinks.length,
                hasSocialShare,
                platforms: socialLinks.map(link => {
                    if (link.includes('facebook')) return 'Facebook';
                    if (link.includes('twitter')) return 'Twitter';
                    if (link.includes('linkedin')) return 'LinkedIn';
                    if (link.includes('instagram')) return 'Instagram';
                    return 'Other';
                })
            };
        });
    }

    // UTILITY METHODS
    async fetchPageHTML(path = '/') {
        try {
            const response = await this.makeRequest(`${this.baseUrl}${path}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch ${path}: ${error.message}`);
        }
    }

    async makeRequest(url, config = {}) {
        return axios({
            method: 'GET',
            url,
            timeout: this.timeout,
            headers: {
                'User-Agent': 'DirectoryBolt-SEO-Validator/1.0',
                ...config.headers
            },
            ...config
        });
    }

    async runTest(testName, testFn) {
        this.results.total++;
        const startTime = performance.now();

        try {
            const result = await testFn();
            const duration = Math.round(performance.now() - startTime);
            
            this.results.passed++;
            this.results.details.push({
                name: testName,
                status: 'PASS',
                duration,
                result
            });

            if (this.verbose) {
                console.log(`✅ ${testName} (${duration}ms)`);
                if (result && typeof result === 'object') {
                    console.log(`   ${JSON.stringify(result, null, 2).replace(/\n/g, '\n   ')}`);
                }
                console.log();
            }
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            
            this.results.failed++;
            this.results.details.push({
                name: testName,
                status: 'FAIL',
                duration,
                error: error.message
            });

            if (this.verbose) {
                console.log(`❌ ${testName} (${duration}ms)`);
                console.log(`   Error: ${error.message}`);
                console.log();
            }
        }
    }

    logError(message, error) {
        console.error(`🚨 ${message}:`, error.message);
        if (this.verbose && error.stack) {
            console.error(error.stack);
        }
    }

    printResults(duration) {
        console.log('\n' + '='.repeat(80));
        console.log('🔍 SEO VALIDATION SUITE RESULTS');
        console.log('='.repeat(80));

        const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
        const durationSec = (duration / 1000).toFixed(1);

        console.log(`📊 OVERALL RESULTS:`);
        console.log(`   Total Tests: ${this.results.total}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   💥 Errors: ${this.results.errors}`);
        console.log(`   🎯 Success Rate: ${successRate}%`);
        console.log(`   ⏱️  Duration: ${durationSec}s`);
        console.log();

        // Category breakdown
        const categories = {
            'Robots & Sitemap': this.results.details.filter(d => d.name.toLowerCase().includes('robots') || d.name.toLowerCase().includes('sitemap')),
            'Meta Tags': this.results.details.filter(d => d.name.toLowerCase().includes('meta') || d.name.toLowerCase().includes('title')),
            'Structured Data': this.results.details.filter(d => d.name.toLowerCase().includes('schema') || d.name.toLowerCase().includes('structured')),
            'Heading Hierarchy': this.results.details.filter(d => d.name.toLowerCase().includes('heading') || d.name.toLowerCase().includes('h1')),
            'Performance': this.results.details.filter(d => d.name.toLowerCase().includes('performance') || d.name.toLowerCase().includes('speed') || d.name.toLowerCase().includes('optimization')),
            'GTM Tracking': this.results.details.filter(d => d.name.toLowerCase().includes('gtm') || d.name.toLowerCase().includes('tracking')),
            'Mobile-Friendly': this.results.details.filter(d => d.name.toLowerCase().includes('mobile') || d.name.toLowerCase().includes('responsive')),
            'Best Practices': this.results.details.filter(d => d.name.toLowerCase().includes('url') || d.name.toLowerCase().includes('content') || d.name.toLowerCase().includes('social'))
        };

        console.log(`📈 CATEGORY BREAKDOWN:`);
        Object.entries(categories).forEach(([category, tests]) => {
            if (tests.length > 0) {
                const passed = tests.filter(t => t.status === 'PASS').length;
                const rate = (passed / tests.length * 100).toFixed(0);
                const icon = rate >= 90 ? '🟢' : rate >= 70 ? '🟡' : '🔴';
                console.log(`   ${icon} ${category}: ${passed}/${tests.length} (${rate}%)`);
            }
        });

        console.log();

        // SEO Health Assessment
        console.log(`🏥 SEO HEALTH ASSESSMENT:`);
        if (successRate >= 95) {
            console.log(`   🏆 EXCELLENT: Your SEO implementation is outstanding`);
            console.log(`   🎉 Ready for production deployment`);
        } else if (successRate >= 85) {
            console.log(`   🎯 GOOD: SEO implementation is solid with minor issues`);
            console.log(`   📝 Address failed tests for optimal results`);
        } else if (successRate >= 70) {
            console.log(`   ⚠️  WARNING: SEO needs attention`);
            console.log(`   🔧 Several critical issues need fixing`);
        } else {
            console.log(`   🚨 CRITICAL: Major SEO problems detected`);
            console.log(`   🛠️  Extensive fixes required before launch`);
        }

        console.log();

        // Failed tests details
        const failedTests = this.results.details.filter(d => d.status === 'FAIL');
        if (failedTests.length > 0) {
            console.log(`🚨 FAILED TESTS REQUIRING ATTENTION:`);
            failedTests.forEach((test, index) => {
                console.log(`   ${index + 1}. ${test.name}`);
                console.log(`      Error: ${test.error}`);
            });
            console.log();
        }

        // Recommendations
        console.log(`💡 NEXT STEPS:`);
        if (failedTests.some(t => t.name.includes('robots') || t.name.includes('sitemap'))) {
            console.log(`   📋 Fix robots.txt and sitemap.xml issues first`);
        }
        if (failedTests.some(t => t.name.includes('GTM'))) {
            console.log(`   📊 Test GTM implementation with Preview mode`);
        }
        if (failedTests.some(t => t.name.includes('meta'))) {
            console.log(`   🏷️  Optimize meta tags for better SERP performance`);
        }
        if (failedTests.some(t => t.name.includes('performance'))) {
            console.log(`   ⚡ Run PageSpeed Insights for detailed performance analysis`);
        }
        console.log(`   🔍 Use Google Rich Results Test for structured data validation`);
        console.log(`   📱 Test mobile-friendliness with Google Mobile-Friendly Test`);
        console.log(`   📊 Submit sitemap to Google Search Console`);

        console.log('\n' + '='.repeat(80));

        return this.results;
    }
}

// CLI execution
if (require.main === module) {
    const config = {
        baseUrl: process.env.TEST_BASE_URL || process.env.SITE_URL,
        verbose: process.env.VERBOSE !== 'false',
        timeout: parseInt(process.env.TIMEOUT) || 30000
    };

    const suite = new SEOValidationSuite(config);
    
    suite.runAllTests()
        .then(results => {
            const exitCode = results.failed > 0 || results.errors > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('🚨 Suite execution failed:', error);
            process.exit(1);
        });
}

module.exports = SEOValidationSuite;