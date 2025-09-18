#!/usr/bin/env node

/**
 * Quick Code Review System for DirectoryBolt
 * Streamlined version for immediate feedback
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QuickCodeReview {
    constructor() {
        this.results = {
            security: [],
            quality: [],
            performance: [],
            summary: {}
        };
    }

    async review(files = null) {
        console.log('🚀 Quick Code Review Starting...');
        
        const targetFiles = files || this.getChangedFiles();
        
        if (targetFiles.length === 0) {
            console.log('✅ No files to review');
            return { status: 'PASSED', issues: 0 };
        }

        console.log(`📁 Reviewing ${targetFiles.length} files`);

        // Run quick checks
        this.checkSecurity(targetFiles);
        this.checkQuality(targetFiles);
        this.checkPerformance(targetFiles);

        const summary = this.generateSummary();
        this.printResults(summary);
        
        return summary;
    }

    getChangedFiles() {
        try {
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
                .split('\n').filter(Boolean);
            const modified = execSync('git diff --name-only', { encoding: 'utf8' })
                .split('\n').filter(Boolean);
            
            return [...new Set([...staged, ...modified])]
                .filter(file => /\.(ts|tsx|js|jsx)$/.test(file))
                .filter(file => fs.existsSync(file))
                .slice(0, 10); // Limit for quick review
        } catch (error) {
            return [];
        }
    }

    checkSecurity(files) {
        console.log('🔒 Security scan...');
        
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // Critical security patterns
            const patterns = [
                { pattern: /eval\s*\(/gi, severity: 'critical', message: 'Use of eval() detected' },
                { pattern: /innerHTML\s*=/gi, severity: 'high', message: 'Potential XSS with innerHTML' },
                { pattern: /process\.env\.\w+/gi, severity: 'medium', message: 'Environment variable usage' }
            ];

            patterns.forEach(({ pattern, severity, message }) => {
                if (pattern.test(content)) {
                    this.results.security.push({
                        file,
                        severity,
                        message,
                        line: this.findLineNumber(content, pattern)
                    });
                }
            });
        });
    }

    checkQuality(files) {
        console.log('📊 Quality check...');
        
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');

            // Check file size
            if (content.length > 50000) { // 50KB
                this.results.quality.push({
                    file,
                    severity: 'medium',
                    message: `Large file: ${Math.round(content.length / 1024)}KB`
                });
            }

            // Check for TODO/FIXME
            lines.forEach((line, index) => {
                if (/todo|fixme|hack/i.test(line)) {
                    this.results.quality.push({
                        file,
                        line: index + 1,
                        severity: 'low',
                        message: 'Technical debt marker found'
                    });
                }
            });
        });
    }

    checkPerformance(files) {
        console.log('⚡ Performance check...');
        
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // Simple complexity check
            const complexity = this.calculateComplexity(content);
            if (complexity > 15) {
                this.results.performance.push({
                    file,
                    severity: 'medium',
                    message: `High complexity: ${complexity}`
                });
            }

            // Check for console.log in production files
            if (!/test|spec/.test(file) && /console\.(log|warn|error)/.test(content)) {
                this.results.performance.push({
                    file,
                    severity: 'low',
                    message: 'Console statements in production code'
                });
            }
        });
    }

    calculateComplexity(content) {
        const patterns = [/\bif\s*\(/gi, /\belse\s+if\s*\(/gi, /\bwhile\s*\(/gi, /\bfor\s*\(/gi, /\bswitch\s*\(/gi];
        return patterns.reduce((count, pattern) => {
            const matches = content.match(pattern);
            return count + (matches ? matches.length : 0);
        }, 1);
    }

    findLineNumber(content, pattern) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
                return i + 1;
            }
        }
        return 1;
    }

    generateSummary() {
        const totalIssues = this.results.security.length + this.results.quality.length + this.results.performance.length;
        const criticalIssues = this.results.security.filter(i => i.severity === 'critical').length;
        const highIssues = this.results.security.filter(i => i.severity === 'high').length;

        return {
            status: criticalIssues === 0 ? 'PASSED' : 'FAILED',
            totalIssues,
            criticalIssues,
            highIssues,
            grade: this.calculateGrade(totalIssues, criticalIssues),
            breakdown: {
                security: this.results.security.length,
                quality: this.results.quality.length,
                performance: this.results.performance.length
            }
        };
    }

    calculateGrade(total, critical) {
        if (critical > 0) return 'F';
        if (total === 0) return 'A+';
        if (total <= 3) return 'A';
        if (total <= 7) return 'B';
        if (total <= 12) return 'C';
        return 'D';
    }

    printResults(summary) {
        console.log('\n' + '='.repeat(60));
        console.log('📋 QUICK CODE REVIEW RESULTS');
        console.log('='.repeat(60));
        
        const statusEmoji = summary.status === 'PASSED' ? '✅' : '❌';
        const gradeEmoji = { 'A+': '🏆', 'A': '🥇', 'B': '🥈', 'C': '🥉', 'D': '⚠️', 'F': '❌' }[summary.grade] || '❓';
        
        console.log(`\n${statusEmoji} Status: ${summary.status}`);
        console.log(`${gradeEmoji} Grade: ${summary.grade}`);
        console.log(`📊 Total Issues: ${summary.totalIssues}`);
        console.log(`🚨 Critical: ${summary.criticalIssues}`);
        console.log(`⚠️  High: ${summary.highIssues}`);
        
        console.log('\n📋 Breakdown:');
        console.log(`   🔒 Security: ${summary.breakdown.security}`);
        console.log(`   📊 Quality: ${summary.breakdown.quality}`);
        console.log(`   ⚡ Performance: ${summary.breakdown.performance}`);

        if (summary.criticalIssues > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            this.results.security.filter(i => i.severity === 'critical').forEach(issue => {
                console.log(`   ${issue.file}:${issue.line || '?'} - ${issue.message}`);
            });
        }

        console.log('\n' + '='.repeat(60));
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const reviewer = new QuickCodeReview();
    
    try {
        const files = args.length > 0 ? args : null;
        const result = await reviewer.review(files);
        
        // Exit with error code if critical issues found
        process.exit(result.criticalIssues > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Review failed:', error.message);
        process.exit(1);
    }
}

// Export for use as a module
module.exports = QuickCodeReview;

// Run CLI if called directly
if (require.main === module) {
    main();
}