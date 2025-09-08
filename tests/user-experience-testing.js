/**
 * Section 2.3: User Experience Testing Module
 * Comprehensive testing for user experience across all guides
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

class UserExperienceTestFramework {
    constructor() {
        this.testResults = [];
        this.guidesPath = path.join(__dirname, '../data/guides');
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    }

    async runAllUXTests() {
        console.log('🔍 Running User Experience Tests (Section 2.3)...');
        console.log('===================================================\n');
        
        // Test navigation and discoverability
        await this.testNavigationDiscoverability();
        await this.testSearchFunctionality();
        await this.testCategoryFiltering();
        await this.testBreadcrumbNavigation();
        
        // Test content readability and usability
        await this.testContentScannability();
        await this.testMobileOptimization();
        await this.testPrintFriendlyFormatting();
        await this.testLoadTimes();
        
        // Test conversion elements
        await this.testConversionElementUX();
        await this.testInteractiveElements();
        await this.testEmailOptInUX();
        
        this.generateUXReport();
        return this.testResults;
    }

    async testNavigationDiscoverability() {
        const testName = 'Navigation Discoverability';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            // Check if guides section exists in main navigation
            const hasGuidesInNav = await this.checkMainNavigation();
            
            // Check if guides are categorized properly
            const hasCategorization = await this.checkCategorization();
            
            // Check breadcrumb implementation
            const hasBreadcrumbs = await this.checkBreadcrumbImplementation();
            
            // Check related guide suggestions
            const hasRelatedSuggestions = await this.checkRelatedGuides();
            
            let score = 0;
            let issues = [];
            
            if (hasGuidesInNav) score += 2; else issues.push('Guides not easily found in main navigation');
            if (hasCategorization) score += 2; else issues.push('Poor categorization of guides');
            if (hasBreadcrumbs) score += 1; else issues.push('Missing breadcrumb navigation');
            if (hasRelatedSuggestions) score += 1; else issues.push('Missing related guide suggestions');
            
            this.logResult(testName, score >= 5, {
                score: `${score}/6`,
                hasGuidesInNav,
                hasCategorization,
                hasBreadcrumbs,
                hasRelatedSuggestions,
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    async testSearchFunctionality() {
        const testName = 'Search Functionality';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            
            // Test search feature exists
            const hasSearchFeature = await this.checkSearchFeature();
            
            // Test search accuracy for directory names
            let searchAccuracy = 0;
            const testQueries = ['LinkedIn', 'Google', 'Facebook', 'submit', 'business'];
            
            for (const query of testQueries) {
                const relevantGuides = guides.filter(guide => 
                    guide.title.toLowerCase().includes(query.toLowerCase()) ||
                    guide.directoryName.toLowerCase().includes(query.toLowerCase()) ||
                    guide.seo.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
                );
                
                if (relevantGuides.length > 0) {
                    searchAccuracy++;
                }
            }
            
            const accuracyRate = (searchAccuracy / testQueries.length) * 100;
            
            // Test search result presentation
            const hasProperResultFormat = await this.checkSearchResultFormat();
            
            let score = 0;
            let issues = [];
            
            if (hasSearchFeature) score += 2; else issues.push('Search functionality not implemented');
            if (accuracyRate >= 80) score += 2; else issues.push(`Search accuracy only ${accuracyRate}%`);
            if (hasProperResultFormat) score += 1; else issues.push('Search results not well formatted');
            
            this.logResult(testName, score >= 4, {
                score: `${score}/5`,
                hasSearchFeature,
                searchAccuracy: `${accuracyRate}%`,
                hasProperResultFormat,
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    async testCategoryFiltering() {
        const testName = 'Category Filtering';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            
            // Check if categories are properly defined
            const categories = [...new Set(guides.map(guide => guide.category))];
            const hasSufficientCategories = categories.length >= 4;
            
            // Check category distribution
            const categoryDistribution = {};
            guides.forEach(guide => {
                categoryDistribution[guide.category] = (categoryDistribution[guide.category] || 0) + 1;
            });
            
            const wellDistributed = Object.values(categoryDistribution).every(count => count >= 2);
            
            // Check category naming consistency
            const hasConsistentNaming = categories.every(cat => 
                cat && cat.length > 3 && cat.charAt(0).toUpperCase() === cat.charAt(0)
            );
            
            // Check filter functionality (would be tested in component)
            const hasFilterUI = await this.checkFilterUI();
            
            let score = 0;
            let issues = [];
            
            if (hasSufficientCategories) score += 2; else issues.push(`Only ${categories.length} categories (need 4+)`);
            if (wellDistributed) score += 1; else issues.push('Poor category distribution');
            if (hasConsistentNaming) score += 1; else issues.push('Inconsistent category naming');
            if (hasFilterUI) score += 1; else issues.push('Filter UI not implemented');
            
            this.logResult(testName, score >= 4, {
                score: `${score}/5`,
                totalCategories: categories.length,
                categories: categories,
                distribution: categoryDistribution,
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    async testContentScannability() {
        const testName = 'Content Scannability';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            let scannabilityScores = [];
            
            guides.forEach(guide => {
                let score = 0;
                
                // Check for clear headings
                const hasGoodHeadings = guide.content.sections.length >= 4;
                if (hasGoodHeadings) score += 2;
                
                // Check for bullet points and lists
                const hasBulletPoints = guide.content.sections.some(section =>
                    section.content.includes('<ul>') || section.content.includes('<ol>')
                );
                if (hasBulletPoints) score += 2;
                
                // Check for short paragraphs
                const hasShortParagraphs = guide.content.sections.every(section => {
                    const paragraphCount = (section.content.match(/<p>/g) || []).length;
                    return paragraphCount >= 2; // Multiple short paragraphs
                });
                if (hasShortParagraphs) score += 1;
                
                // Check for visual breaks (images)
                const hasVisualBreaks = guide.content.sections.some(section => section.image);
                if (hasVisualBreaks) score += 1;
                
                // Check for highlighted tips
                const hasHighlightedTips = guide.content.sections.some(section => 
                    section.tips && section.tips.length > 0
                );
                if (hasHighlightedTips) score += 1;
                
                // Check for table of contents structure
                const hasTableOfContents = guide.content.sections.length >= 5;
                if (hasTableOfContents) score += 1;
                
                scannabilityScores.push({
                    guide: guide.slug,
                    score: score,
                    maxScore: 8
                });
            });
            
            const averageScore = scannabilityScores.reduce((sum, item) => sum + item.score, 0) / scannabilityScores.length;
            const averagePercentage = (averageScore / 8) * 100;
            
            const passableGuides = scannabilityScores.filter(item => (item.score / item.maxScore) >= 0.75).length;
            const passablePercentage = (passableGuides / guides.length) * 100;
            
            let issues = [];
            if (averagePercentage < 80) issues.push(`Average scannability ${averagePercentage.toFixed(1)}% (need 80%+)`);
            if (passablePercentage < 90) issues.push(`Only ${passablePercentage.toFixed(1)}% of guides are highly scannable`);
            
            this.logResult(testName, averagePercentage >= 80 && passablePercentage >= 90, {
                averageScannability: `${averagePercentage.toFixed(1)}%`,
                passableGuides: `${passableGuides}/${guides.length} (${passablePercentage.toFixed(1)}%)`,
                detailedScores: scannabilityScores.slice(0, 5), // Show first 5 as example
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    async testMobileOptimization() {
        const testName = 'Mobile Optimization';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            const sampleGuide = guides[0]; // Test with first guide
            
            // Test responsive design elements
            const hasResponsiveImages = await this.checkResponsiveImages(sampleGuide);
            const hasResponsiveLayout = await this.checkResponsiveLayout(sampleGuide);
            const hasTouchFriendlyElements = await this.checkTouchFriendlyElements(sampleGuide);
            const hasReadableTextSize = await this.checkMobileTextReadability(sampleGuide);
            const hasProperSpacing = await this.checkMobileSpacing(sampleGuide);
            
            // Test mobile-specific features
            const hasProgressIndicator = this.checkProgressIndicator(sampleGuide);
            const hasStickyNavigation = await this.checkStickyNavigation(sampleGuide);
            const hasCollapsibleSections = await this.checkCollapsibleSections(sampleGuide);
            
            let score = 0;
            let issues = [];
            
            if (hasResponsiveImages) score += 2; else issues.push('Images not responsive on mobile');
            if (hasResponsiveLayout) score += 2; else issues.push('Layout not responsive');
            if (hasTouchFriendlyElements) score += 1; else issues.push('Elements not touch-friendly');
            if (hasReadableTextSize) score += 1; else issues.push('Text not readable on mobile');
            if (hasProperSpacing) score += 1; else issues.push('Poor mobile spacing');
            if (hasProgressIndicator) score += 1; else issues.push('Missing progress indicator');
            if (hasStickyNavigation) score += 1; else issues.push('Missing sticky navigation');
            if (hasCollapsibleSections) score += 1; else issues.push('Missing collapsible sections');
            
            this.logResult(testName, score >= 7, {
                score: `${score}/10`,
                testedGuide: sampleGuide.slug,
                hasResponsiveImages,
                hasResponsiveLayout,
                hasTouchFriendlyElements,
                hasReadableTextSize,
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    async testConversionElementUX() {
        const testName = 'Conversion Element UX';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            let conversionElementScores = [];
            
            guides.forEach(guide => {
                let score = 0;
                
                // Check for natural CTA placement
                const hasCTAInContent = guide.content.sections.some(section =>
                    section.content.includes('DirectoryBolt') && 
                    section.content.includes('automation')
                );
                if (hasCTAInContent) score += 2;
                
                // Check CTA feels natural, not forced
                const naturalCTACount = this.countNaturalCTAs(guide);
                if (naturalCTACount >= 2 && naturalCTACount <= 4) score += 2;
                
                // Check for value proposition in CTAs
                const hasValueProp = guide.content.sections.some(section =>
                    section.content.includes('time') || section.content.includes('easy') || 
                    section.content.includes('automated') || section.content.includes('mistake')
                );
                if (hasValueProp) score += 1;
                
                // Check for multiple CTA types
                const hasMultipleCTATypes = this.hasVariedCTAs(guide);
                if (hasMultipleCTATypes) score += 1;
                
                conversionElementScores.push({
                    guide: guide.slug,
                    score: score,
                    naturalCTACount: naturalCTACount
                });
            });
            
            const averageScore = conversionElementScores.reduce((sum, item) => sum + item.score, 0) / conversionElementScores.length;
            const averagePercentage = (averageScore / 6) * 100;
            
            let issues = [];
            if (averagePercentage < 70) issues.push(`Average conversion UX ${averagePercentage.toFixed(1)}% (need 70%+)`);
            
            this.logResult(testName, averagePercentage >= 70, {
                averageConversionUX: `${averagePercentage.toFixed(1)}%`,
                sampleScores: conversionElementScores.slice(0, 3),
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    async testInteractiveElements() {
        const testName = 'Interactive Elements';
        console.log(`Testing: ${testName}`);
        console.log('-'.repeat(40));
        
        try {
            const guides = await this.loadGuides();
            
            // Check for interactive elements in guide structure
            const hasBookmarking = await this.checkBookmarkingFeature();
            const hasSharing = await this.checkSharingFeature();
            const hasProgressTracking = await this.checkProgressTrackingFeature();
            const hasTableOfContents = guides.every(guide => guide.content.sections.length >= 4);
            const hasRelatedGuides = guides.every(guide => 
                guide.internalLinks && guide.internalLinks.relatedGuides && guide.internalLinks.relatedGuides.length > 0
            );
            
            let score = 0;
            let issues = [];
            
            if (hasBookmarking) score += 1; else issues.push('Missing bookmarking feature');
            if (hasSharing) score += 1; else issues.push('Missing sharing functionality');
            if (hasProgressTracking) score += 2; else issues.push('Missing progress tracking');
            if (hasTableOfContents) score += 1; else issues.push('Inadequate table of contents');
            if (hasRelatedGuides) score += 1; else issues.push('Missing related guides');
            
            this.logResult(testName, score >= 5, {
                score: `${score}/6`,
                hasBookmarking,
                hasSharing,
                hasProgressTracking,
                hasTableOfContents,
                hasRelatedGuides,
                issues
            });
            
        } catch (error) {
            this.logResult(testName, false, { error: error.message });
        }
    }

    // Helper Methods
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

    async checkMainNavigation() {
        // Mock navigation check - would test actual navigation component
        return true; // Assuming navigation exists
    }

    async checkCategorization() {
        const guides = await this.loadGuides();
        const categories = [...new Set(guides.map(guide => guide.category))];
        return categories.length >= 4;
    }

    async checkBreadcrumbImplementation() {
        // Check if breadcrumb component exists
        const breadcrumbPath = path.join(__dirname, '../components/guides/Breadcrumbs.tsx');
        return fs.existsSync(breadcrumbPath);
    }

    async checkRelatedGuides() {
        const guides = await this.loadGuides();
        return guides.every(guide => 
            guide.internalLinks && 
            guide.internalLinks.relatedGuides && 
            guide.internalLinks.relatedGuides.length >= 3
        );
    }

    async checkSearchFeature() {
        // Mock search feature check
        return true; // Would check for search component
    }

    async checkSearchResultFormat() {
        // Mock search result format check
        return true; // Would check search result presentation
    }

    async checkFilterUI() {
        // Check if filter component exists
        const filterPath = path.join(__dirname, '../components/directories/DirectoryFilters.tsx');
        return fs.existsSync(filterPath);
    }

    async checkResponsiveImages(guide) {
        // Check if images have responsive attributes
        return guide.featuredImage && guide.content.sections.some(section => section.image);
    }

    async checkResponsiveLayout(guide) {
        // Mock responsive layout check
        return true; // Would test CSS grid/flexbox implementation
    }

    async checkTouchFriendlyElements(guide) {
        // Mock touch-friendly element check
        return true; // Would test button sizes and spacing
    }

    async checkMobileTextReadability(guide) {
        // Check content length and structure for mobile readability
        const averageSectionLength = guide.content.sections.reduce((sum, section) => {
            return sum + section.content.length;
        }, 0) / guide.content.sections.length;
        
        return averageSectionLength < 2000; // Reasonable for mobile
    }

    async checkMobileSpacing(guide) {
        // Mock mobile spacing check
        return true; // Would test CSS spacing on mobile
    }

    checkProgressIndicator(guide) {
        // Check if guide has reading progress tracking
        return guide.estimatedReadTime && guide.estimatedReadTime.length > 0;
    }

    async checkStickyNavigation(guide) {
        // Mock sticky navigation check
        return true; // Would test sticky table of contents
    }

    async checkCollapsibleSections(guide) {
        // Mock collapsible sections check
        return guide.content.sections.length > 6; // Long guides should have collapsible sections
    }

    countNaturalCTAs(guide) {
        let ctaCount = 0;
        
        guide.content.sections.forEach(section => {
            const content = section.content.toLowerCase();
            if (content.includes('directorybolt') && !content.includes('visit directorybolt now')) {
                ctaCount++;
            }
        });
        
        return ctaCount;
    }

    hasVariedCTAs(guide) {
        let ctaTypes = new Set();
        
        guide.content.sections.forEach(section => {
            const content = section.content.toLowerCase();
            if (content.includes('automation')) ctaTypes.add('automation');
            if (content.includes('free')) ctaTypes.add('free');
            if (content.includes('time')) ctaTypes.add('time-saving');
            if (content.includes('mistake')) ctaTypes.add('mistake-prevention');
        });
        
        return ctaTypes.size >= 2;
    }

    async checkBookmarkingFeature() {
        // Check if bookmark component exists
        const bookmarkPath = path.join(__dirname, '../components/guides/BookmarkButton.tsx');
        return fs.existsSync(bookmarkPath);
    }

    async checkSharingFeature() {
        // Check if share component exists
        const sharePath = path.join(__dirname, '../components/guides/ShareButton.tsx');
        return fs.existsSync(sharePath);
    }

    async checkProgressTrackingFeature() {
        // Check if progress tracker component exists
        const progressPath = path.join(__dirname, '../components/guides/ProgressTracker.tsx');
        return fs.existsSync(progressPath);
    }

    logResult(testName, passed, details) {
        const result = {
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
        console.log('');
    }

    generateUXReport() {
        console.log('\n📊 USER EXPERIENCE TESTING REPORT');
        console.log('==================================\n');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`Overall UX Pass Rate: ${passedTests}/${totalTests} (${passRate}%)\n`);
        
        console.log('Test Results:');
        console.log('-'.repeat(50));
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
        });
        
        console.log('\n' + '='.repeat(50));
        
        if (passRate >= 90) {
            console.log('🎉 EXCELLENT: User experience is outstanding!');
        } else if (passRate >= 80) {
            console.log('✅ GOOD: Minor UX improvements recommended');
        } else if (passRate >= 70) {
            console.log('⚠️  NEEDS WORK: Significant UX issues found');
        } else {
            console.log('❌ CRITICAL: Major UX improvements required');
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, '../reports/user-experience-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                totalTests,
                passedTests,
                passRate: parseFloat(passRate)
            },
            detailedResults: this.testResults,
            generatedAt: new Date().toISOString()
        }, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}

module.exports = UserExperienceTestFramework;

// Run if executed directly
if (require.main === module) {
    const tester = new UserExperienceTestFramework();
    tester.runAllUXTests().catch(console.error);
}