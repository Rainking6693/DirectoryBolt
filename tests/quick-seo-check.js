/**
 * Quick SEO Health Check for DirectoryBolt
 * 
 * A lightweight script to quickly validate the most critical SEO elements
 * Perfect for development and quick validation checks.
 * 
 * Usage:
 *   node tests/quick-seo-check.js
 *   node tests/quick-seo-check.js https://directorybolt.com
 */

const axios = require('axios');
const cheerio = require('cheerio');

class QuickSEOCheck {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.results = [];
    }

    async runQuickCheck() {
        console.log(`🔍 Quick SEO Health Check for: ${this.baseUrl}\n`);

        await this.checkHomePage();
        await this.checkRobotsTxt();
        await this.checkSitemapXml();
        
        this.printResults();
        return this.getScore();
    }

    async checkHomePage() {
        try {
            console.log('📄 Checking homepage SEO elements...');
            const response = await axios.get(this.baseUrl, { timeout: 10000 });
            const $ = cheerio.load(response.data);

            // Title tag
            const title = $('title').text();
            this.addResult('Title tag', !!title, title ? `"${title.substring(0, 50)}..."` : 'Missing');
            
            // Meta description
            const description = $('meta[name="description"]').attr('content');
            this.addResult('Meta description', !!description, description ? `"${description.substring(0, 50)}..."` : 'Missing');

            // H1 tag
            const h1 = $('h1').text();
            const h1Count = $('h1').length;
            this.addResult('H1 tag', h1Count === 1, h1Count === 1 ? `"${h1.substring(0, 50)}..."` : h1Count === 0 ? 'Missing' : `Multiple H1s (${h1Count})`);

            // Viewport meta
            const viewport = $('meta[name="viewport"]').attr('content');
            this.addResult('Viewport meta', !!viewport, viewport || 'Missing');

            // Canonical link
            const canonical = $('link[rel="canonical"]').attr('href');
            this.addResult('Canonical link', !!canonical, canonical || 'Missing');

            // Open Graph
            const ogTitle = $('meta[property="og:title"]').attr('content');
            const ogDescription = $('meta[property="og:description"]').attr('content');
            this.addResult('Open Graph', !!(ogTitle && ogDescription), ogTitle ? 'Present' : 'Missing');

            // Structured data
            const jsonLd = $('script[type="application/ld+json"]');
            this.addResult('Structured data', jsonLd.length > 0, jsonLd.length > 0 ? `${jsonLd.length} schema(s)` : 'Missing');

            // Performance hints
            const preconnect = $('link[rel="preconnect"]').length;
            const defer = $('script[defer]').length;
            this.addResult('Performance hints', preconnect > 0 || defer > 0, `${preconnect} preconnect, ${defer} defer`);

            console.log('✅ Homepage check completed\n');

        } catch (error) {
            console.log(`❌ Homepage check failed: ${error.message}\n`);
            this.addResult('Homepage accessibility', false, error.message);
        }
    }

    async checkRobotsTxt() {
        try {
            console.log('🤖 Checking robots.txt...');
            const response = await axios.get(`${this.baseUrl}/robots.txt`, { timeout: 5000 });
            
            const content = response.data;
            const hasUserAgent = content.includes('User-agent:');
            const hasSitemap = content.includes('Sitemap:');
            
            this.addResult('robots.txt accessible', response.status === 200, `${content.split('\n').length} lines`);
            this.addResult('robots.txt format', hasUserAgent, hasUserAgent ? 'Valid format' : 'Missing User-agent');
            this.addResult('Sitemap in robots.txt', hasSitemap, hasSitemap ? 'Present' : 'Missing');

            console.log('✅ robots.txt check completed\n');

        } catch (error) {
            console.log(`❌ robots.txt check failed: ${error.message}\n`);
            this.addResult('robots.txt accessible', false, error.response?.status || 'Connection failed');
        }
    }

    async checkSitemapXml() {
        try {
            console.log('🗺️  Checking sitemap.xml...');
            const response = await axios.get(`${this.baseUrl}/sitemap.xml`, { timeout: 5000 });
            
            const content = response.data;
            const isXml = content.includes('<?xml') && content.includes('<urlset');
            const urlCount = (content.match(/<url>/g) || []).length;
            
            this.addResult('sitemap.xml accessible', response.status === 200, `${Math.round(content.length / 1024)}KB`);
            this.addResult('sitemap.xml format', isXml, isXml ? 'Valid XML' : 'Invalid format');
            this.addResult('Sitemap URLs', urlCount > 0, `${urlCount} URLs`);

            console.log('✅ sitemap.xml check completed\n');

        } catch (error) {
            console.log(`❌ sitemap.xml check failed: ${error.message}\n`);
            this.addResult('sitemap.xml accessible', false, error.response?.status || 'Connection failed');
        }
    }

    addResult(test, passed, details) {
        this.results.push({
            test,
            passed,
            details,
            status: passed ? '✅' : '❌'
        });
    }

    printResults() {
        console.log('📊 SEO HEALTH CHECK RESULTS');
        console.log('='.repeat(60));
        
        // Print individual results
        this.results.forEach(result => {
            console.log(`${result.status} ${result.test}`);
            if (result.details) {
                console.log(`   ${result.details}`);
            }
        });

        console.log('\n' + '='.repeat(60));
        
        // Summary
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const score = Math.round((passed / total) * 100);
        
        console.log(`📈 SUMMARY: ${passed}/${total} checks passed (${score}%)`);
        
        // Health assessment
        if (score >= 90) {
            console.log('🏆 SEO Health: EXCELLENT - Ready to go!');
        } else if (score >= 75) {
            console.log('🎯 SEO Health: GOOD - Minor issues to address');
        } else if (score >= 50) {
            console.log('⚠️  SEO Health: NEEDS WORK - Several issues found');
        } else {
            console.log('🚨 SEO Health: CRITICAL - Major issues need fixing');
        }

        // Priority recommendations
        const failed = this.results.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('\n💡 PRIORITY FIXES:');
            failed.forEach((result, i) => {
                console.log(`   ${i + 1}. ${result.test}: ${result.details}`);
            });
        }

        console.log('\n🔧 NEXT STEPS:');
        if (score < 75) {
            console.log('   1. Fix critical issues above');
            console.log('   2. Run comprehensive test: npm run seo:test');
        } else {
            console.log('   1. Run full test suite: npm run seo:test');
            console.log('   2. Test with external APIs: npm run seo:test:external');
        }

        console.log('   3. Monitor performance: npm run seo:test:production');
        console.log('='.repeat(60));
    }

    getScore() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        return {
            passed,
            total,
            score: Math.round((passed / total) * 100),
            results: this.results
        };
    }
}

// CLI execution
if (require.main === module) {
    const baseUrl = process.argv[2] || process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    console.log('🚀 Starting Quick SEO Health Check...\n');
    
    const checker = new QuickSEOCheck(baseUrl);
    
    checker.runQuickCheck()
        .then(result => {
            // Exit with error code if score is below threshold
            const exitCode = result.score >= 60 ? 0 : 1;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('\n🚨 Quick SEO check failed:', error.message);
            process.exit(1);
        });
}

module.exports = QuickSEOCheck;