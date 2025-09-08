/**
 * Complete Directory Knowledge Base Testing Suite
 * Master test runner for all testing sections 2.1-2.6
 */

const DirectoryKnowledgeBaseTestFramework = require('./directory-knowledge-base-testing-framework');
const SEOTechnicalTester = require('./seo-technical-testing');
const UserExperienceTestFramework = require('./user-experience-testing');
const PerformanceAnalyticsTestFramework = require('./performance-analytics-testing');
const ContentMaintenanceTestFramework = require('./content-maintenance-testing');

const fs = require('fs');
const path = require('path');

class CompleteTesting {
    constructor() {
        this.startTime = new Date();
        this.allResults = {};
        this.reportsPath = path.join(__dirname, '../reports');
    }

    async runCompleteTestingSuite() {
        console.log('🚀 DIRECTORYBOLT DIRECTORY KNOWLEDGE BASE');
        console.log('📋 COMPLETE TESTING PROTOCOL - SECTIONS 2.1-2.6');
        console.log('='.repeat(70));
        console.log(`🕐 Started: ${this.startTime.toISOString()}`);
        console.log('='.repeat(70));
        console.log('');

        try {
            // Section 2.1: Content Quality Assurance Testing
            console.log('📝 SECTION 2.1: CONTENT QUALITY ASSURANCE TESTING');
            console.log('='.repeat(55));
            const contentTester = new DirectoryKnowledgeBaseTestFramework();
            await contentTester.runContentQualityTests();
            this.allResults.contentQuality = contentTester.testResults.contentQuality;
            console.log('✅ Section 2.1 Complete\n');

            // Section 2.2: SEO Technical Testing
            console.log('🔍 SECTION 2.2: SEO TECHNICAL TESTING');
            console.log('='.repeat(40));
            const seoTester = new SEOTechnicalTester();
            await seoTester.runAllSEOTests();
            this.allResults.seoTechnical = seoTester.testResults;
            console.log('✅ Section 2.2 Complete\n');

            // Section 2.3: User Experience Testing
            console.log('👥 SECTION 2.3: USER EXPERIENCE TESTING');
            console.log('='.repeat(42));
            const uxTester = new UserExperienceTestFramework();
            await uxTester.runAllUXTests();
            this.allResults.userExperience = uxTester.testResults;
            console.log('✅ Section 2.3 Complete\n');

            // Section 2.4 & 2.5: Performance and Analytics Testing
            console.log('⚡ SECTION 2.4 & 2.5: PERFORMANCE & ANALYTICS TESTING');
            console.log('='.repeat(57));
            const perfAnalyticsTester = new PerformanceAnalyticsTestFramework();
            await perfAnalyticsTester.runAllTests();
            this.allResults.performance = perfAnalyticsTester.testResults.performance;
            this.allResults.analytics = perfAnalyticsTester.testResults.analytics;
            console.log('✅ Section 2.4 & 2.5 Complete\n');

            // Section 2.6: Content Maintenance Testing
            console.log('🔧 SECTION 2.6: CONTENT MAINTENANCE TESTING');
            console.log('='.repeat(45));
            const maintenanceTester = new ContentMaintenanceTestFramework();
            await maintenanceTester.runAllMaintenanceTests();
            this.allResults.maintenance = maintenanceTester.testResults;
            console.log('✅ Section 2.6 Complete\n');

            // Generate comprehensive report
            await this.generateComprehensiveReport();

        } catch (error) {
            console.error('❌ Testing suite error:', error.message);
            throw error;
        }
    }

    async generateComprehensiveReport() {
        const endTime = new Date();
        const duration = Math.round((endTime - this.startTime) / 1000);

        console.log('📊 COMPREHENSIVE TESTING REPORT');
        console.log('='.repeat(70));
        console.log('');

        // Calculate overall statistics
        const sections = [
            { name: 'Content Quality', key: 'contentQuality' },
            { name: 'SEO Technical', key: 'seoTechnical' },
            { name: 'User Experience', key: 'userExperience' },
            { name: 'Performance', key: 'performance' },
            { name: 'Analytics', key: 'analytics' },
            { name: 'Maintenance', key: 'maintenance' }
        ];

        let totalTests = 0;
        let totalPassed = 0;
        const sectionResults = [];

        sections.forEach(section => {
            const data = this.allResults[section.key];
            let sectionPassed = 0;
            let sectionTotal = 0;

            if (Array.isArray(data)) {
                // For arrays of test results
                sectionTotal = data.length;
                sectionPassed = data.filter(test => test.passed).length;
            } else if (data && typeof data === 'object') {
                // For objects with passed/failed counts
                if (data.passed !== undefined && data.failed !== undefined) {
                    sectionPassed = data.passed;
                    sectionTotal = data.passed + data.failed;
                } else if (data.tests) {
                    // For objects with tests array
                    sectionTotal = data.tests.length;
                    sectionPassed = data.tests.filter(test => test.status === 'PASS').length;
                }
            }

            totalTests += sectionTotal;
            totalPassed += sectionPassed;

            const passRate = sectionTotal > 0 ? ((sectionPassed / sectionTotal) * 100).toFixed(1) : 0;
            
            sectionResults.push({
                name: section.name,
                passed: sectionPassed,
                total: sectionTotal,
                passRate: parseFloat(passRate)
            });

            console.log(`${section.name}: ${sectionPassed}/${sectionTotal} (${passRate}%)`);
        });

        const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

        console.log('');
        console.log('='.repeat(70));
        console.log(`OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed (${overallPassRate}%)`);
        console.log(`TESTING DURATION: ${duration} seconds`);
        console.log('='.repeat(70));
        console.log('');

        // Production readiness assessment
        this.assessProductionReadiness(parseFloat(overallPassRate), sectionResults);

        // Generate detailed recommendations
        this.generateRecommendations(sectionResults);

        // Save comprehensive report
        await this.saveComprehensiveReport({
            executionSummary: {
                startTime: this.startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: duration,
                totalTests,
                totalPassed,
                overallPassRate: parseFloat(overallPassRate)
            },
            sectionResults,
            detailedResults: this.allResults,
            recommendations: this.generateRecommendationsList(sectionResults)
        });
    }

    assessProductionReadiness(overallPassRate, sectionResults) {
        console.log('🎯 PRODUCTION READINESS ASSESSMENT');
        console.log('='.repeat(40));
        console.log('');

        // Critical sections that must pass for production
        const criticalSections = ['Content Quality', 'SEO Technical', 'User Experience'];
        const criticalPassRates = sectionResults
            .filter(section => criticalSections.includes(section.name))
            .map(section => section.passRate);
        
        const criticalAverage = criticalPassRates.length > 0 
            ? criticalPassRates.reduce((sum, rate) => sum + rate, 0) / criticalPassRates.length
            : 0;

        console.log(`Critical Systems Average: ${criticalAverage.toFixed(1)}%`);
        console.log(`Overall System Health: ${overallPassRate}%`);
        console.log('');

        if (overallPassRate >= 90 && criticalAverage >= 85) {
            console.log('🎉 PRODUCTION READY!');
            console.log('   • Directory Knowledge Base system is ready for production deployment');
            console.log('   • All critical systems meet quality standards');
            console.log('   • Minor optimizations can be addressed post-launch');
        } else if (overallPassRate >= 80 && criticalAverage >= 75) {
            console.log('⚠️  NEAR PRODUCTION READY');
            console.log('   • Directory Knowledge Base system needs minor improvements');
            console.log('   • Address high-priority issues before production deployment');
            console.log('   • Consider phased rollout approach');
        } else if (overallPassRate >= 70) {
            console.log('🔧 REQUIRES SIGNIFICANT WORK');
            console.log('   • Multiple systems need improvement before production');
            console.log('   • Focus on critical sections first');
            console.log('   • Extended development phase recommended');
        } else {
            console.log('❌ NOT READY FOR PRODUCTION');
            console.log('   • Major system failures detected');
            console.log('   • Comprehensive review and rebuild required');
            console.log('   • Do not deploy in current state');
        }
        console.log('');
    }

    generateRecommendations(sectionResults) {
        console.log('💡 PRIORITY RECOMMENDATIONS');
        console.log('='.repeat(30));
        console.log('');

        const lowPerformingSections = sectionResults
            .filter(section => section.passRate < 80)
            .sort((a, b) => a.passRate - b.passRate);

        if (lowPerformingSections.length === 0) {
            console.log('✅ All sections performing well!');
            console.log('   • Continue monitoring and maintenance');
            console.log('   • Consider advanced optimization features');
        } else {
            console.log('🔥 HIGH PRIORITY:');
            lowPerformingSections.forEach((section, index) => {
                console.log(`   ${index + 1}. ${section.name} (${section.passRate}%)`);
                console.log(`      • ${section.passed}/${section.total} tests passing`);
                console.log(`      • Requires immediate attention`);
            });
        }

        console.log('');
        console.log('📈 OPTIMIZATION OPPORTUNITIES:');
        const goodSections = sectionResults
            .filter(section => section.passRate >= 80 && section.passRate < 95)
            .sort((a, b) => b.passRate - a.passRate);

        if (goodSections.length > 0) {
            goodSections.forEach(section => {
                console.log(`   • ${section.name}: ${section.passRate}% (can reach 95%+)`);
            });
        } else {
            console.log('   • All sections either need major work or are already optimized');
        }
        console.log('');
    }

    generateRecommendationsList(sectionResults) {
        const recommendations = [];

        sectionResults.forEach(section => {
            if (section.passRate < 70) {
                recommendations.push({
                    priority: 'CRITICAL',
                    section: section.name,
                    issue: `Only ${section.passRate}% pass rate`,
                    action: 'Complete system review and rebuild required'
                });
            } else if (section.passRate < 85) {
                recommendations.push({
                    priority: 'HIGH',
                    section: section.name,
                    issue: `${section.passRate}% pass rate below production standard`,
                    action: 'Address failing tests before production deployment'
                });
            } else if (section.passRate < 95) {
                recommendations.push({
                    priority: 'MEDIUM',
                    section: section.name,
                    issue: `${section.passRate}% pass rate has room for improvement`,
                    action: 'Optimize for better performance and reliability'
                });
            }
        });

        return recommendations;
    }

    async saveComprehensiveReport(reportData) {
        // Ensure reports directory exists
        fs.mkdirSync(this.reportsPath, { recursive: true });

        // Save JSON report
        const jsonReportPath = path.join(this.reportsPath, 'comprehensive-testing-report.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

        // Generate and save markdown report
        const markdownReport = this.generateMarkdownReport(reportData);
        const mdReportPath = path.join(this.reportsPath, 'TESTING_REPORT.md');
        fs.writeFileSync(mdReportPath, markdownReport);

        console.log('📄 REPORTS GENERATED:');
        console.log(`   • JSON Report: ${jsonReportPath}`);
        console.log(`   • Markdown Report: ${mdReportPath}`);
        console.log('');
    }

    generateMarkdownReport(reportData) {
        const { executionSummary, sectionResults, recommendations } = reportData;
        
        return `# DirectoryBolt Directory Knowledge Base Testing Report

## Executive Summary

**Testing Duration:** ${executionSummary.duration} seconds  
**Overall Pass Rate:** ${executionSummary.overallPassRate}%  
**Total Tests:** ${executionSummary.totalPassed}/${executionSummary.totalTests}  
**Generated:** ${executionSummary.endTime}

## Section Results

| Section | Tests Passed | Total Tests | Pass Rate | Status |
|---------|--------------|-------------|-----------|---------|
${sectionResults.map(section => {
    const status = section.passRate >= 90 ? '🎉 Excellent' :
                  section.passRate >= 80 ? '✅ Good' :
                  section.passRate >= 70 ? '⚠️ Needs Work' : '❌ Critical';
    return `| ${section.name} | ${section.passed} | ${section.total} | ${section.passRate}% | ${status} |`;
}).join('\n')}

## Production Readiness

${executionSummary.overallPassRate >= 90 ? 
    '🎉 **PRODUCTION READY** - System meets all quality standards for production deployment.' :
  executionSummary.overallPassRate >= 80 ? 
    '⚠️ **NEAR PRODUCTION READY** - Minor improvements needed before deployment.' :
  executionSummary.overallPassRate >= 70 ? 
    '🔧 **REQUIRES WORK** - Significant improvements needed before production.' :
    '❌ **NOT READY** - Major system failures detected, rebuild required.'
}

## Priority Recommendations

${recommendations.length === 0 ? 'No critical issues found. Continue monitoring and maintenance.' : 
  recommendations.map((rec, index) => 
    `${index + 1}. **${rec.priority}** - ${rec.section}: ${rec.issue}  
   *Action:* ${rec.action}`
  ).join('\n\n')
}

## Testing Framework Coverage

✅ **Section 2.1:** Content Quality Assurance Testing  
✅ **Section 2.2:** SEO Technical Testing  
✅ **Section 2.3:** User Experience Testing  
✅ **Section 2.4:** Performance Testing  
✅ **Section 2.5:** Analytics Testing  
✅ **Section 2.6:** Content Maintenance Testing  

---

*Report generated by DirectoryBolt Testing Framework v1.0*
`;
    }
}

// Export for use as module
module.exports = CompleteTesting;

// Run complete testing suite if this file is executed directly
if (require.main === module) {
    const completeTesting = new CompleteTesting();
    completeTesting.runCompleteTestingSuite()
        .then(() => {
            console.log('🏁 Complete testing suite finished successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Complete testing suite failed:', error);
            process.exit(1);
        });
}