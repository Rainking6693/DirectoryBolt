/**
 * MASTER TEST EXECUTION SUITE
 * Executes all comprehensive tests for DirectoryBolt system validation
 * Generates unified report for Blake's double audit
 */

const fs = require('fs');
const path = require('path');

// Import test suites
const DirectoryBoltTestSuite = require('./comprehensive-test-suite');
const CustomerDataValidator = require('./customer-data-validation-test');
const SecurityAuditSuite = require('./security-audit-test');

class MasterTestExecutor {
    constructor() {
        this.startTime = Date.now();
        this.results = {
            timestamp: new Date().toISOString(),
            executionTime: 0,
            environment: process.env.NODE_ENV || 'development',
            testSuites: {},
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                criticalIssues: []
            },
            recommendations: [],
            nextSteps: []
        };
    }

    /**
     * Execute all test suites in sequence
     */
    async executeAllTests() {
        console.log('🚀 DIRECTORYBOLT COMPREHENSIVE TESTING SUITE');
        console.log('Target Customer ID: DIR-202597-recwsFS91NG2O90xi');
        console.log('Testing for Blake\'s Double Audit');
        console.log('='.repeat(80));

        try {
            // 1. Run comprehensive functionality tests
            console.log('\n📋 PHASE 1: COMPREHENSIVE FUNCTIONALITY TESTING');
            console.log('='.repeat(50));
            const functionalityTests = new DirectoryBoltTestSuite();
            this.results.testSuites.functionality = await functionalityTests.runAllTests();

            // 2. Run customer data validation
            console.log('\n📋 PHASE 2: CUSTOMER DATA VALIDATION');
            console.log('='.repeat(50));
            const customerDataTests = new CustomerDataValidator();
            this.results.testSuites.customerData = await customerDataTests.runAllTests();

            // 3. Run security audit
            console.log('\n📋 PHASE 3: SECURITY AUDIT');
            console.log('='.repeat(50));
            const securityAudit = new SecurityAuditSuite();
            this.results.testSuites.security = await securityAudit.runCompleteAudit();

            // 4. Generate unified analysis
            this.analyzeResults();

            // 5. Generate final report
            const report = this.generateFinalReport();
            
            // 6. Save report
            this.saveReport(report);

            return report;

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            this.results.executionError = error.message;
            throw error;
        } finally {
            this.results.executionTime = Date.now() - this.startTime;
        }
    }

    /**
     * Analyze results from all test suites
     */
    analyzeResults() {
        console.log('\n📊 ANALYZING RESULTS ACROSS ALL TEST SUITES');
        console.log('='.repeat(50));

        // Functionality test analysis
        if (this.results.testSuites.functionality) {
            const func = this.results.testSuites.functionality.summary;
            this.results.summary.totalTests += func.total;
            this.results.summary.passed += func.passed;
            this.results.summary.failed += func.failed;
            
            if (func.critical_issues) {
                this.results.summary.criticalIssues.push(...func.critical_issues);
            }
        }

        // Customer data test analysis
        if (this.results.testSuites.customerData) {
            const customer = this.results.testSuites.customerData.summary;
            this.results.summary.totalTests += customer.total;
            this.results.summary.passed += customer.passed;
            this.results.summary.failed += customer.failed;
            this.results.summary.warnings += customer.warnings || 0;
        }

        // Security audit analysis
        if (this.results.testSuites.security) {
            const security = this.results.testSuites.security.summary;
            this.results.summary.totalTests += security.totalFindings;
            
            // Map security findings to our summary
            const criticalFindings = this.results.testSuites.security.findings.filter(f => f.severity === 'CRITICAL');
            const highFindings = this.results.testSuites.security.findings.filter(f => f.severity === 'HIGH');
            
            this.results.summary.criticalIssues.push(...criticalFindings);
            this.results.summary.failed += criticalFindings.length + highFindings.length;
        }

        // Generate analysis summary
        console.log(`Total Tests Executed: ${this.results.summary.totalTests}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`Warnings: ${this.results.summary.warnings}`);
        console.log(`Critical Issues: ${this.results.summary.criticalIssues.length}`);
    }

    /**
     * Generate comprehensive final report
     */
    generateFinalReport() {
        console.log('\n📄 GENERATING COMPREHENSIVE FINAL REPORT');
        console.log('='.repeat(50));

        const report = {
            ...this.results,
            executionSummary: this.generateExecutionSummary(),
            criticalFindings: this.consolidateCriticalFindings(),
            workingFunctionality: this.identifyWorkingFunctionality(),
            brokenFunctionality: this.identifyBrokenFunctionality(),
            securityStatus: this.assessSecurityStatus(),
            reproductionSteps: this.generateReproductionSteps(),
            blakeAuditReadiness: this.assessBlakeAuditReadiness()
        };

        // Add final recommendations
        report.recommendations = this.generateFinalRecommendations();

        return report;
    }

    /**
     * Generate execution summary
     */
    generateExecutionSummary() {
        const passed = this.results.summary.passed;
        const failed = this.results.summary.failed;
        const total = this.results.summary.totalTests;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        return {
            executionTime: `${Math.round(this.results.executionTime / 1000)}s`,
            successRate: `${successRate}%`,
            overallStatus: this.determineOverallStatus(),
            readyForProduction: this.results.summary.criticalIssues.length === 0 && failed < 3
        };
    }

    /**
     * Determine overall system status
     */
    determineOverallStatus() {
        const critical = this.results.summary.criticalIssues.length;
        const failed = this.results.summary.failed;

        if (critical > 0) return 'CRITICAL_ISSUES_FOUND';
        if (failed > 5) return 'MULTIPLE_FAILURES';
        if (failed > 0) return 'ISSUES_FOUND';
        return 'HEALTHY';
    }

    /**
     * Consolidate critical findings from all test suites
     */
    consolidateCriticalFindings() {
        const findings = [];

        // Add functionality critical issues
        if (this.results.testSuites.functionality?.summary?.critical_issues) {
            findings.push(...this.results.testSuites.functionality.summary.critical_issues.map(issue => ({
                source: 'Functionality Tests',
                category: 'System Functionality',
                issue: issue.testName,
                details: issue.details,
                severity: 'CRITICAL'
            })));
        }

        // Add customer data critical issues
        if (this.results.testSuites.customerData?.results) {
            const criticalCustomerIssues = this.results.testSuites.customerData.results.filter(r => r.status === 'FAIL');
            findings.push(...criticalCustomerIssues.map(issue => ({
                source: 'Customer Data Validation',
                category: 'Data Integrity',
                issue: issue.test,
                details: issue.message,
                severity: 'HIGH'
            })));
        }

        // Add security critical issues
        if (this.results.testSuites.security?.findings) {
            const criticalSecurityIssues = this.results.testSuites.security.findings.filter(f => 
                f.severity === 'CRITICAL' || f.severity === 'HIGH'
            );
            findings.push(...criticalSecurityIssues.map(issue => ({
                source: 'Security Audit',
                category: 'Security',
                issue: issue.finding,
                details: issue.details,
                severity: issue.severity,
                recommendation: issue.recommendation
            })));
        }

        return findings;
    }

    /**
     * Identify working functionality
     */
    identifyWorkingFunctionality() {
        const working = [];

        // From functionality tests
        if (this.results.testSuites.functionality?.testResults) {
            const passing = this.results.testSuites.functionality.testResults.filter(t => t.status === 'PASS');
            working.push(...passing.map(t => ({
                component: 'System Functionality',
                feature: t.testName,
                status: 'Working',
                details: t.details
            })));
        }

        // From customer data tests
        if (this.results.testSuites.customerData?.results) {
            const passing = this.results.testSuites.customerData.results.filter(r => r.status === 'PASS');
            working.push(...passing.map(r => ({
                component: 'Customer Data',
                feature: r.test,
                status: 'Working',
                details: r.message
            })));
        }

        return working;
    }

    /**
     * Identify broken functionality
     */
    identifyBrokenFunctionality() {
        const broken = [];

        // From functionality tests
        if (this.results.testSuites.functionality?.testResults) {
            const failing = this.results.testSuites.functionality.testResults.filter(t => t.status === 'FAIL');
            broken.push(...failing.map(t => ({
                component: 'System Functionality',
                feature: t.testName,
                status: 'Broken',
                issue: t.details,
                critical: t.isCritical || false
            })));
        }

        // From customer data tests
        if (this.results.testSuites.customerData?.results) {
            const failing = this.results.testSuites.customerData.results.filter(r => r.status === 'FAIL');
            broken.push(...failing.map(r => ({
                component: 'Customer Data',
                feature: r.test,
                status: 'Broken',
                issue: r.message,
                critical: true // Customer data issues are always critical
            })));
        }

        return broken;
    }

    /**
     * Assess security status
     */
    assessSecurityStatus() {
        if (!this.results.testSuites.security) {
            return { status: 'NOT_TESTED', riskLevel: 'UNKNOWN' };
        }

        const security = this.results.testSuites.security.summary;
        return {
            status: 'TESTED',
            riskLevel: security.riskLevel,
            totalFindings: security.totalFindings,
            severityBreakdown: security.severityBreakdown,
            criticalSecurityIssues: security.severityBreakdown.CRITICAL || 0,
            highSecurityIssues: security.severityBreakdown.HIGH || 0
        };
    }

    /**
     * Generate reproduction steps for issues
     */
    generateReproductionSteps() {
        const steps = [];

        // Add steps for critical issues
        this.consolidateCriticalFindings().forEach((finding, index) => {
            steps.push({
                issueNumber: index + 1,
                category: finding.category,
                issue: finding.issue,
                reproductionSteps: this.generateStepsForIssue(finding),
                expectedBehavior: this.generateExpectedBehavior(finding),
                actualBehavior: finding.details
            });
        });

        return steps;
    }

    /**
     * Generate specific reproduction steps for an issue
     */
    generateStepsForIssue(finding) {
        if (finding.category === 'System Functionality') {
            return [
                'Navigate to the DirectoryBolt application',
                'Access the extension validation endpoint',
                'Submit the real customer ID: DIR-202597-recwsFS91NG2O90xi',
                'Observe the response and data returned'
            ];
        } else if (finding.category === 'Data Integrity') {
            return [
                'Connect to the Airtable database',
                'Query for customer ID: DIR-202597-recwsFS91NG2O90xi',
                'Examine the returned data structure and field mapping',
                'Verify data accuracy and completeness'
            ];
        } else if (finding.category === 'Security') {
            return [
                'Review the codebase for the identified security issue',
                'Attempt to access the vulnerable endpoint or component',
                'Verify the security vulnerability exists',
                'Document the potential impact'
            ];
        }

        return ['Manual investigation required'];
    }

    /**
     * Generate expected behavior description
     */
    generateExpectedBehavior(finding) {
        if (finding.category === 'System Functionality') {
            return 'System should properly validate and return accurate customer data';
        } else if (finding.category === 'Data Integrity') {
            return 'Customer data should be properly mapped, complete, and accurate';
        } else if (finding.category === 'Security') {
            return 'System should be secure with no exposed credentials or vulnerabilities';
        }

        return 'System should function as intended';
    }

    /**
     * Assess readiness for Blake's audit
     */
    assessBlakeAuditReadiness() {
        const critical = this.results.summary.criticalIssues.length;
        const failed = this.results.summary.failed;
        const securityRisk = this.results.testSuites.security?.summary?.riskLevel;

        let readiness = 'READY';
        const blockers = [];

        if (critical > 0) {
            readiness = 'NOT_READY';
            blockers.push(`${critical} critical issues must be resolved`);
        }

        if (failed > 3) {
            readiness = 'NOT_READY';
            blockers.push(`Too many failed tests (${failed})`);
        }

        if (securityRisk === 'CRITICAL' || securityRisk === 'HIGH') {
            readiness = 'NOT_READY';
            blockers.push(`Security risk level too high: ${securityRisk}`);
        }

        return {
            status: readiness,
            blockers,
            estimatedFixTime: this.estimateFixTime(critical, failed),
            priorityActions: this.generatePriorityActions()
        };
    }

    /**
     * Estimate time to fix issues
     */
    estimateFixTime(critical, failed) {
        let hours = 0;
        hours += critical * 4; // 4 hours per critical issue
        hours += failed * 1;   // 1 hour per regular failed test

        if (hours <= 4) return '2-4 hours';
        if (hours <= 8) return '4-8 hours';
        if (hours <= 16) return '1-2 days';
        return '2+ days';
    }

    /**
     * Generate priority actions
     */
    generatePriorityActions() {
        const actions = [];

        if (this.results.summary.criticalIssues.length > 0) {
            actions.push('URGENT: Fix all critical system and security issues');
        }

        actions.push('Verify real customer data is properly displayed');
        actions.push('Ensure field mapping corrections are working');
        actions.push('Test authentication flow with real customer');
        actions.push('Secure any exposed API endpoints');

        return actions;
    }

    /**
     * Generate final recommendations
     */
    generateFinalRecommendations() {
        const recommendations = [];

        // Based on test results
        if (this.results.summary.criticalIssues.length > 0) {
            recommendations.push('CRITICAL: Do not proceed to production until all critical issues are resolved');
        }

        if (this.results.testSuites.security?.summary?.riskLevel === 'CRITICAL') {
            recommendations.push('SECURITY: Immediate security review and fixes required');
        }

        // General recommendations
        recommendations.push('Implement comprehensive error handling for all API endpoints');
        recommendations.push('Add automated testing to CI/CD pipeline');
        recommendations.push('Set up monitoring and alerting for production');
        recommendations.push('Create deployment checklist based on test results');

        // Customer-specific recommendations
        recommendations.push('Verify customer ID DIR-202597-recwsFS91NG2O90xi data accuracy in production');
        recommendations.push('Test extension authentication with multiple real customers');

        return recommendations;
    }

    /**
     * Save comprehensive report
     */
    saveReport(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `COMPREHENSIVE_TEST_REPORT_${timestamp}.json`;
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`\n📄 COMPREHENSIVE REPORT SAVED: ${reportPath}`);

            // Also create a markdown summary
            const markdownPath = `TEST_SUMMARY_${timestamp}.md`;
            const markdown = this.generateMarkdownSummary(report);
            fs.writeFileSync(markdownPath, markdown);
            console.log(`📄 MARKDOWN SUMMARY SAVED: ${markdownPath}`);

            return { reportPath, markdownPath };
        } catch (error) {
            console.error('❌ Failed to save report:', error);
            throw error;
        }
    }

    /**
     * Generate markdown summary for easy reading
     */
    generateMarkdownSummary(report) {
        const summary = report.executionSummary;
        const critical = report.criticalFindings;

        return `# DirectoryBolt Comprehensive Test Report

## Executive Summary
- **Execution Time**: ${summary.executionTime}
- **Success Rate**: ${summary.successRate}
- **Overall Status**: ${summary.overallStatus}
- **Ready for Production**: ${summary.readyForProduction ? 'YES' : 'NO'}

## Test Results Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Warnings**: ${report.summary.warnings}
- **Critical Issues**: ${report.summary.criticalIssues.length}

## Critical Findings
${critical.length === 0 ? 'No critical issues found.' : critical.map((issue, index) => 
`### ${index + 1}. ${issue.issue}
- **Category**: ${issue.category}
- **Severity**: ${issue.severity}
- **Details**: ${issue.details}
${issue.recommendation ? `- **Recommendation**: ${issue.recommendation}` : ''}
`).join('\n')}

## Blake Audit Readiness
- **Status**: ${report.blakeAuditReadiness.status}
- **Estimated Fix Time**: ${report.blakeAuditReadiness.estimatedFixTime}

### Blockers
${report.blakeAuditReadiness.blockers.length === 0 ? 'None' : report.blakeAuditReadiness.blockers.map(b => `- ${b}`).join('\n')}

### Priority Actions
${report.blakeAuditReadiness.priorityActions.map(a => `- ${a}`).join('\n')}

## Security Status
- **Risk Level**: ${report.securityStatus.riskLevel}
- **Critical Security Issues**: ${report.securityStatus.criticalSecurityIssues || 0}
- **High Security Issues**: ${report.securityStatus.highSecurityIssues || 0}

## Working Functionality
${report.workingFunctionality.slice(0, 10).map(w => `- ${w.feature}: ${w.status}`).join('\n')}

## Broken Functionality  
${report.brokenFunctionality.length === 0 ? 'None identified' : report.brokenFunctionality.map(b => `- ${b.feature}: ${b.issue}`).join('\n')}

## Final Recommendations
${report.recommendations.map(r => `- ${r}`).join('\n')}

---
*Report generated on ${report.timestamp}*
*Customer ID tested: DIR-202597-recwsFS91NG2O90xi*
`;
    }

    /**
     * Print final summary to console
     */
    printFinalSummary(report) {
        console.log('\n' + '='.repeat(80));
        console.log('🎯 FINAL TESTING SUMMARY FOR BLAKE\'S AUDIT');
        console.log('='.repeat(80));
        
        console.log(`\n📊 RESULTS:`);
        console.log(`   Success Rate: ${report.executionSummary.successRate}`);
        console.log(`   Overall Status: ${report.executionSummary.overallStatus}`);
        console.log(`   Critical Issues: ${report.summary.criticalIssues.length}`);
        console.log(`   Production Ready: ${report.executionSummary.readyForProduction ? 'YES' : 'NO'}`);

        console.log(`\n🔍 BLAKE AUDIT STATUS:`);
        console.log(`   Readiness: ${report.blakeAuditReadiness.status}`);
        console.log(`   Fix Time Estimate: ${report.blakeAuditReadiness.estimatedFixTime}`);

        if (report.blakeAuditReadiness.blockers.length > 0) {
            console.log('\n🚫 BLOCKERS:');
            report.blakeAuditReadiness.blockers.forEach((blocker, index) => {
                console.log(`   ${index + 1}. ${blocker}`);
            });
        }

        console.log('\n📋 NEXT STEPS:');
        report.blakeAuditReadiness.priorityActions.slice(0, 5).forEach((action, index) => {
            console.log(`   ${index + 1}. ${action}`);
        });

        console.log('\n' + '='.repeat(80));
    }
}

// Export for use as module
module.exports = MasterTestExecutor;

// Run tests if called directly
if (require.main === module) {
    const executor = new MasterTestExecutor();
    executor.executeAllTests().then(report => {
        executor.printFinalSummary(report);
        process.exit(report.executionSummary.readyForProduction ? 0 : 1);
    }).catch(error => {
        console.error('❌ Master test execution failed:', error);
        process.exit(1);
    });
}