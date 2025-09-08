/**
 * Section 2.2: SEO Technical Testing Module
 * Comprehensive testing for SEO optimization elements
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class SEOTechnicalTester {
    constructor() {
        this.testResults = [];
        this.guidesPath = path.join(__dirname, '../data/guides');
    }

    async runAllSEOTests() {
        console.log('🔍 Running SEO Technical Tests (Section 2.2)...');
        console.log('================================================\n');
        
        const guides = await this.loadGuides();
        
        for (const guide of guides) {
            console.log(`Testing: ${guide.directoryName} (${guide.slug})`);
            console.log('-'.repeat(50));
            
            await this.testTitleTagOptimization(guide);
            await this.testMetaDescriptionOptimization(guide);
            await this.testH1TagTargeting(guide);
            await this.testHeaderHierarchy(guide);
            await this.testKeywordIntegration(guide);
            await this.testHowToStructuredData(guide);
            await this.testFAQSchema(guide);
            await this.testOrganizationSchema(guide);
            await this.testBreadcrumbSchema(guide);
            await this.testCanonicalURLs(guide);
            await this.testInternalLinking(guide);
            await this.testPageSpeedOptimization(guide);
            
            console.log('');
        }

        this.generateSEOReport();
        return this.testResults;
    }

    async testTitleTagOptimization(guide) {
        const testName = 'Title Tag Optimization';
        try {
            const title = guide.seo.title;
            const expectedPattern = /^How to Submit to .+ - Complete Guide \| DirectoryBolt$/;
            
            // Check pattern match
            const patternMatch = expectedPattern.test(title);
            
            // Check length (50-60 characters is ideal)
            const length = title.length;
            const lengthOptimal = length >= 50 && length <= 60;
            
            // Check keyword presence
            const hasSubmitKeyword = title.toLowerCase().includes('submit');
            const hasDirectoryName = title.toLowerCase().includes(guide.directoryName.toLowerCase().split(' ')[0]);
            
            // Check brand inclusion
            const hasBrand = title.includes('DirectoryBolt');
            
            let score = 0;
            let issues = [];
            
            if (patternMatch) score += 2; else issues.push('Title doesn\'t follow expected pattern');
            if (lengthOptimal) score += 2; else issues.push(`Title length ${length} chars (optimal: 50-60)`);
            if (hasSubmitKeyword) score += 1; else issues.push('Missing "submit" keyword');
            if (hasDirectoryName) score += 1; else issues.push('Missing directory name');
            if (hasBrand) score += 1; else issues.push('Missing DirectoryBolt brand');
            
            this.logResult(guide.slug, testName, score >= 6, {
                score: `${score}/7`,
                title: title,
                length: length,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testMetaDescriptionOptimization(guide) {
        const testName = 'Meta Description Optimization';
        try {
            const description = guide.seo.description;
            const length = description.length;
            
            // Optimal length: 150-160 characters
            const lengthOptimal = length >= 150 && length <= 160;
            
            // Check keyword presence
            const keywords = guide.seo.keywords || [];
            const keywordCount = keywords.filter(keyword => 
                description.toLowerCase().includes(keyword.toLowerCase())
            ).length;
            
            // Check call-to-action presence
            const actionWords = ['complete', 'guide', 'learn', 'discover', 'master', 'step-by-step'];
            const hasCallToAction = actionWords.some(word => 
                description.toLowerCase().includes(word)
            );
            
            // Check compelling language
            const compellingWords = ['comprehensive', 'proven', 'expert', 'ultimate', 'complete'];
            const hasCompellingLanguage = compellingWords.some(word => 
                description.toLowerCase().includes(word)
            );
            
            let score = 0;
            let issues = [];
            
            if (lengthOptimal) score += 3; else issues.push(`Length ${length} chars (optimal: 150-160)`);
            if (keywordCount >= 2) score += 2; else issues.push(`Only ${keywordCount} keywords included`);
            if (hasCallToAction) score += 1; else issues.push('Missing call-to-action language');
            if (hasCompellingLanguage) score += 1; else issues.push('Missing compelling language');
            
            this.logResult(guide.slug, testName, score >= 5, {
                score: `${score}/7`,
                description: description,
                length: length,
                keywordCount: keywordCount,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testHowToStructuredData(guide) {
        const testName = 'HowTo Structured Data';
        try {
            // Check required fields for HowTo schema
            const hasName = guide.title && guide.title.length > 0;
            const hasDescription = guide.description && guide.description.length > 0;
            const hasImage = guide.featuredImage && guide.featuredImage.length > 0;
            const hasSteps = guide.content.sections && guide.content.sections.length >= 3;
            const hasSupplies = guide.content.requirements && guide.content.requirements.length > 0;
            const hasTools = guide.content.tools && guide.content.tools.length > 0;
            
            // Check step structure
            let validSteps = 0;
            if (guide.content.sections) {
                validSteps = guide.content.sections.filter(section => 
                    section.title && section.content && section.content.length > 100
                ).length;
            }
            
            // Check estimated time
            const hasEstimatedTime = guide.estimatedReadTime && guide.estimatedReadTime.length > 0;
            
            let score = 0;
            let issues = [];
            
            if (hasName) score += 1; else issues.push('Missing name/title');
            if (hasDescription) score += 1; else issues.push('Missing description');
            if (hasImage) score += 1; else issues.push('Missing featured image');
            if (hasSteps) score += 2; else issues.push('Insufficient steps (need 3+)');
            if (validSteps >= 3) score += 2; else issues.push(`Only ${validSteps} valid steps`);
            if (hasSupplies) score += 1; else issues.push('Missing supplies/requirements');
            if (hasTools) score += 1; else issues.push('Missing tools');
            if (hasEstimatedTime) score += 1; else issues.push('Missing estimated time');
            
            this.logResult(guide.slug, testName, score >= 7, {
                score: `${score}/10`,
                validSteps: validSteps,
                totalSections: guide.content.sections ? guide.content.sections.length : 0,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testH1TagTargeting(guide) {
        const testName = 'H1 Tag Keyword Targeting';
        try {
            const h1Text = guide.title;
            
            // Check for primary keyword "how to submit"
            const hasHowToSubmit = h1Text.toLowerCase().includes('how to') && 
                                  h1Text.toLowerCase().includes('submit');
            
            // Check for directory name
            const directoryWords = guide.directoryName.toLowerCase().split(' ');
            const hasDirectoryName = directoryWords.some(word => 
                h1Text.toLowerCase().includes(word) && word.length > 3
            );
            
            // Check length (should be concise but descriptive)
            const length = h1Text.length;
            const lengthAppropriate = length >= 40 && length <= 100;
            
            // Check for power words
            const powerWords = ['complete', 'ultimate', 'comprehensive', 'guide', 'optimization'];
            const hasPowerWords = powerWords.some(word => 
                h1Text.toLowerCase().includes(word)
            );
            
            let score = 0;
            let issues = [];
            
            if (hasHowToSubmit) score += 3; else issues.push('Missing "how to submit" keywords');
            if (hasDirectoryName) score += 2; else issues.push('Missing directory name');
            if (lengthAppropriate) score += 1; else issues.push(`H1 length ${length} chars (optimal: 40-100)`);
            if (hasPowerWords) score += 1; else issues.push('Missing power words');
            
            this.logResult(guide.slug, testName, score >= 5, {
                score: `${score}/7`,
                h1Text: h1Text,
                length: length,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testHeaderHierarchy(guide) {
        const testName = 'Header Hierarchy Structure';
        try {
            const sections = guide.content.sections || [];
            
            // Check if we have proper H2 structure
            const h2Count = sections.length;
            const hasMinimumH2s = h2Count >= 4;
            
            // Check H2 titles for keyword variations
            let keywordVariationCount = 0;
            const submitVariations = ['submit', 'submission', 'listing', 'register', 'create'];
            
            sections.forEach(section => {
                if (submitVariations.some(variation => 
                    section.title.toLowerCase().includes(variation)
                )) {
                    keywordVariationCount++;
                }
            });
            
            // Check for logical content flow
            const hasSetupSection = sections.some(section => 
                section.title.toLowerCase().includes('setup') || 
                section.title.toLowerCase().includes('create') ||
                section.title.toLowerCase().includes('start')
            );
            
            const hasOptimizationSection = sections.some(section => 
                section.title.toLowerCase().includes('optimiz') || 
                section.title.toLowerCase().includes('improve') ||
                section.title.toLowerCase().includes('enhance')
            );
            
            const hasAdvancedSection = sections.some(section => 
                section.title.toLowerCase().includes('advanced') || 
                section.title.toLowerCase().includes('tips') ||
                section.title.toLowerCase().includes('strategy')
            );
            
            let score = 0;
            let issues = [];
            
            if (hasMinimumH2s) score += 2; else issues.push(`Only ${h2Count} H2s (need 4+)`);
            if (keywordVariationCount >= 2) score += 2; else issues.push('Insufficient keyword variations in headers');
            if (hasSetupSection) score += 1; else issues.push('Missing setup/creation section');
            if (hasOptimizationSection) score += 1; else issues.push('Missing optimization section');
            if (hasAdvancedSection) score += 1; else issues.push('Missing advanced/tips section');
            
            this.logResult(guide.slug, testName, score >= 5, {
                score: `${score}/7`,
                h2Count: h2Count,
                keywordVariations: keywordVariationCount,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testKeywordIntegration(guide) {
        const testName = 'Natural Keyword Integration';
        try {
            const keywords = guide.seo.keywords || [];
            const allText = this.extractAllText(guide);
            const textLength = allText.length;
            
            let keywordDensities = {};
            let totalKeywordMentions = 0;
            
            // Calculate keyword density for each keyword
            keywords.forEach(keyword => {
                const mentions = this.countKeywordMentions(allText, keyword);
                const density = (mentions / textLength) * 1000; // per 1000 characters
                keywordDensities[keyword] = { mentions, density };
                totalKeywordMentions += mentions;
            });
            
            // Check for primary keyword presence
            const primaryKeywordDensity = keywordDensities[keywords[0]]?.density || 0;
            const primaryKeywordOptimal = primaryKeywordDensity >= 2 && primaryKeywordDensity <= 8;
            
            // Check for keyword stuffing
            const totalDensity = (totalKeywordMentions / textLength) * 1000;
            const noKeywordStuffing = totalDensity <= 15;
            
            // Check for long-tail keyword variations
            const longTailCount = keywords.filter(keyword => keyword.split(' ').length >= 3).length;
            
            let score = 0;
            let issues = [];
            
            if (keywords.length >= 5) score += 1; else issues.push(`Only ${keywords.length} keywords (need 5+)`);
            if (primaryKeywordOptimal) score += 2; else issues.push(`Primary keyword density ${primaryKeywordDensity.toFixed(2)} (optimal: 2-8)`);
            if (noKeywordStuffing) score += 2; else issues.push(`Potential keyword stuffing (density: ${totalDensity.toFixed(2)})`);
            if (longTailCount >= 2) score += 1; else issues.push(`Only ${longTailCount} long-tail keywords`);
            if (totalKeywordMentions >= 10) score += 1; else issues.push(`Only ${totalKeywordMentions} total keyword mentions`);
            
            this.logResult(guide.slug, testName, score >= 5, {
                score: `${score}/7`,
                totalKeywords: keywords.length,
                totalMentions: totalKeywordMentions,
                primaryDensity: primaryKeywordDensity.toFixed(2),
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testInternalLinking(guide) {
        const testName = 'Internal Linking Strategy';
        try {
            const hasRelatedGuides = guide.internalLinks?.relatedGuides && 
                                   guide.internalLinks.relatedGuides.length > 0;
            const hasRelatedDirectories = guide.internalLinks?.relatedDirectories && 
                                        guide.internalLinks.relatedDirectories.length > 0;
            
            // Check for service page links (would be in content)
            const hasServiceLinks = guide.content.sections.some(section =>
                section.content.includes('/analyze') ||
                section.content.includes('/pricing') ||
                section.content.includes('/services')
            );
            
            // Count related links
            const relatedGuidesCount = guide.internalLinks?.relatedGuides?.length || 0;
            const relatedDirectoriesCount = guide.internalLinks?.relatedDirectories?.length || 0;
            
            let score = 0;
            let issues = [];
            
            if (hasRelatedGuides) score += 2; else issues.push('Missing related guides');
            if (hasRelatedDirectories) score += 2; else issues.push('Missing related directories');
            if (hasServiceLinks) score += 2; else issues.push('Missing service page links');
            if (relatedGuidesCount >= 3) score += 1; else issues.push(`Only ${relatedGuidesCount} related guides`);
            if (relatedDirectoriesCount >= 3) score += 1; else issues.push(`Only ${relatedDirectoriesCount} related directories`);
            
            this.logResult(guide.slug, testName, score >= 6, {
                score: `${score}/8`,
                relatedGuides: relatedGuidesCount,
                relatedDirectories: relatedDirectoriesCount,
                hasServiceLinks: hasServiceLinks,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    async testCanonicalURLs(guide) {
        const testName = 'Canonical URL Implementation';
        try {
            // Check if canonical URL follows expected pattern
            const expectedCanonical = `https://directorybolt.com/guides/${guide.slug}`;
            const hasProperSlug = guide.slug && guide.slug.length > 0 && !guide.slug.includes(' ');
            
            // Check slug format
            const slugFormat = /^[a-z0-9-]+$/.test(guide.slug);
            const slugLength = guide.slug ? guide.slug.length : 0;
            const slugLengthOptimal = slugLength >= 10 && slugLength <= 60;
            
            let score = 0;
            let issues = [];
            
            if (hasProperSlug) score += 2; else issues.push('Missing or invalid slug');
            if (slugFormat) score += 2; else issues.push('Slug format not SEO-friendly');
            if (slugLengthOptimal) score += 1; else issues.push(`Slug length ${slugLength} (optimal: 10-60)`);
            
            this.logResult(guide.slug, testName, score >= 4, {
                score: `${score}/5`,
                slug: guide.slug,
                expectedCanonical: expectedCanonical,
                issues: issues
            });
            
        } catch (error) {
            this.logResult(guide.slug, testName, false, { error: error.message });
        }
    }

    // Helper Methods
    async loadGuides() {
        const guidesDir = this.guidesPath;
        
        if (!fs.existsSync(guidesDir)) {
            throw new Error(`Guides directory not found: ${guidesDir}`);
        }
        
        const files = fs.readdirSync(guidesDir)
            .filter(file => file.endsWith('.json'));
        
        const guides = [];
        
        for (const file of files) {
            const filePath = path.join(guidesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const guide = JSON.parse(content);
            guides.push(guide);
        }
        
        return guides;
    }

    extractAllText(guide) {
        let text = '';
        text += guide.title + ' ';
        text += guide.description + ' ';
        
        guide.content.sections.forEach(section => {
            text += section.title + ' ';
            text += section.content.replace(/<[^>]*>/g, ' ') + ' ';
            if (section.tips) {
                text += section.tips.join(' ') + ' ';
            }
        });
        
        return text.toLowerCase();
    }

    countKeywordMentions(text, keyword) {
        const regex = new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }

    logResult(guideSlug, testName, passed, details) {
        const result = {
            guide: guideSlug,
            test: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const score = details.score ? ` (${details.score})` : '';
        
        console.log(`${status} ${testName}${score}`);
        
        if (!passed && details.issues && details.issues.length > 0) {
            details.issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
        }
    }

    generateSEOReport() {
        console.log('\n📊 SEO TECHNICAL TESTING REPORT');
        console.log('================================\n');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`Overall SEO Pass Rate: ${passedTests}/${totalTests} (${passRate}%)\n`);
        
        // Group results by test type
        const testTypes = {};
        this.testResults.forEach(result => {
            if (!testTypes[result.test]) {
                testTypes[result.test] = { passed: 0, total: 0 };
            }
            testTypes[result.test].total++;
            if (result.passed) {
                testTypes[result.test].passed++;
            }
        });
        
        console.log('Test Type Breakdown:');
        console.log('-'.repeat(50));
        
        Object.entries(testTypes).forEach(([testType, stats]) => {
            const rate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`${testType}: ${stats.passed}/${stats.total} (${rate}%)`);
        });
        
        console.log('\n' + '='.repeat(50));
        
        if (passRate >= 90) {
            console.log('🎉 EXCELLENT: SEO optimization is production-ready!');
        } else if (passRate >= 80) {
            console.log('✅ GOOD: Minor SEO improvements needed');
        } else if (passRate >= 70) {
            console.log('⚠️  NEEDS WORK: Significant SEO issues found');
        } else {
            console.log('❌ CRITICAL: Major SEO optimization required');
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, '../reports/seo-technical-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                totalTests,
                passedTests,
                passRate: parseFloat(passRate),
                testTypes
            },
            detailedResults: this.testResults,
            generatedAt: new Date().toISOString()
        }, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}

module.exports = SEOTechnicalTester;

// Run if executed directly
if (require.main === module) {
    const tester = new SEOTechnicalTester();
    tester.runAllSEOTests().catch(console.error);
}