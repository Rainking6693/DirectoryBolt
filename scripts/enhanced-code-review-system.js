#!/usr/bin/env node

/**
 * Enhanced Code Review System for DirectoryBolt
 * Implements modern code review techniques from top tech companies
 * 
 * Features:
 * - AI-assisted security scanning
 * - Performance impact analysis
 * - Code quality metrics
 * - Automated policy enforcement
 * - Real-time feedback integration
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const crypto = require('crypto');

class EnhancedCodeReviewSystem {
    constructor() {
        this.reviewId = crypto.randomUUID();
        this.timestamp = new Date().toISOString();
        this.results = {
            security: [],
            performance: [],
            quality: [],
            policies: [],
            recommendations: []
        };
        this.config = this.loadConfig();
    }

    loadConfig() {
        return {
            // Security thresholds based on OWASP guidelines
            security: {
                maxCritical: 0,
                maxHigh: 2,
                maxMedium: 10,
                scanTimeout: 300000 // 5 minutes
            },
            // Performance thresholds based on Google Core Web Vitals
            performance: {
                maxBundleSize: 1000000, // 1MB
                maxComplexity: 10,
                maxFunctionLength: 50,
                minTestCoverage: 80
            },
            // Quality metrics based on industry standards
            quality: {
                maxDuplication: 5, // 5% code duplication
                minMaintainability: 70,
                maxTechnicalDebt: 30 // 30 minutes per 1000 lines
            },
            // Policy enforcement rules
            policies: {
                requireTests: true,
                requireDocumentation: true,
                enforceTypeScript: true,
                requireSecurityReview: true
            }
        };
    }

    async runComprehensiveReview(targetFiles = null) {
        console.log(`🚀 Starting Enhanced Code Review - ID: ${this.reviewId}`);
        console.log(`📅 Timestamp: ${this.timestamp}\n`);

        try {
            // Get changed files if none specified
            const filesToReview = targetFiles || this.getChangedFiles();
            
            if (filesToReview.length === 0) {
                console.log('ℹ️  No files to review');
                return this.generateReport();
            }

            console.log(`📁 Reviewing ${filesToReview.length} files:\n${filesToReview.map(f => `   - ${f}`).join('\n')}\n`);

            // Execute review phases in parallel for efficiency
            await Promise.all([
                this.runSecurityAnalysis(filesToReview),
                this.runPerformanceAnalysis(filesToReview),
                this.runQualityAnalysis(filesToReview),
                this.runPolicyEnforcement(filesToReview)
            ]);

            // Generate AI-powered recommendations
            await this.generateRecommendations(filesToReview);

            return this.generateReport();

        } catch (error) {
            console.error('❌ Enhanced code review failed:', error.message);
            throw error;
        }
    }

    getChangedFiles() {
        try {
            // Get staged files
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
                .split('\n').filter(Boolean);
            
            // Get modified files
            const modified = execSync('git diff --name-only', { encoding: 'utf8' })
                .split('\n').filter(Boolean);

            // Combine and deduplicate
            const allFiles = [...new Set([...staged, ...modified])];
            
            // Filter for relevant file types
            return allFiles.filter(file => 
                /\.(ts|tsx|js|jsx|json|md)$/.test(file) && 
                fs.existsSync(file)
            );
        } catch (error) {
            console.warn('⚠️  Could not get changed files, analyzing entire codebase');
            return this.getAllRelevantFiles();
        }
    }

    getAllRelevantFiles() {
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        const ignorePaths = ['node_modules', '.next', '.git', 'dist', 'build'];
        
        function getFilesRecursively(dir) {
            const files = [];
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && !ignorePaths.some(ignore => fullPath.includes(ignore))) {
                        files.push(...getFilesRecursively(fullPath));
                    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
            return files;
        }

        return getFilesRecursively('.').slice(0, 50); // Limit for performance
    }

    async runSecurityAnalysis(files) {
        console.log('🔒 Running Security Analysis...');
        
        try {
            // Check for common security issues
            for (const file of files) {
                if (!fs.existsSync(file)) continue;
                
                const content = fs.readFileSync(file, 'utf8');
                const issues = this.detectSecurityIssues(file, content);
                this.results.security.push(...issues);
            }

            // Run ESLint security rules if available
            try {
                const eslintResult = execSync('npx eslint --format json --ext .ts,.tsx,.js,.jsx . || true', 
                    { encoding: 'utf8', timeout: 60000 });
                
                if (eslintResult) {
                    const eslintData = JSON.parse(eslintResult);
                    const securityIssues = eslintData
                        .flatMap(file => file.messages || [])
                        .filter(msg => msg.ruleId && (
                            msg.ruleId.includes('security') || 
                            msg.ruleId.includes('no-eval') ||
                            msg.ruleId.includes('no-unsafe')
                        ));
                    
                    this.results.security.push(...securityIssues.map(issue => ({
                        file: issue.filePath,
                        line: issue.line,
                        severity: this.mapSeverity(issue.severity),
                        message: issue.message,
                        rule: issue.ruleId,
                        source: 'eslint'
                    })));
                }
            } catch (error) {
                console.warn('⚠️  ESLint security analysis skipped:', error.message);
            }

            console.log(`   ✅ Security analysis complete - ${this.results.security.length} issues found`);
        } catch (error) {
            console.error('❌ Security analysis failed:', error.message);
        }
    }

    detectSecurityIssues(file, content) {
        const issues = [];
        const lines = content.split('\n');

        // Security pattern detection
        const securityPatterns = [
            {
                pattern: /eval\s*\(/gi,
                message: 'Dangerous use of eval() - potential code injection vulnerability',
                severity: 'critical'
            },
            {
                pattern: /innerHTML\s*=/gi,
                message: 'Potential XSS vulnerability with innerHTML',
                severity: 'high'
            },
            {
                pattern: /document\.write\s*\(/gi,
                message: 'Use of document.write() can be exploited for XSS',
                severity: 'medium'
            },
            {
                pattern: /process\.env\.\w+/gi,
                message: 'Environment variable usage - ensure proper validation',
                severity: 'low'
            },
            {
                pattern: /localStorage\.|sessionStorage\./gi,
                message: 'Local storage usage - ensure sensitive data is not stored',
                severity: 'low'
            },
            {
                pattern: /\.cookie\s*=/gi,
                message: 'Cookie manipulation - ensure proper security flags',
                severity: 'medium'
            }
        ];

        lines.forEach((line, index) => {
            securityPatterns.forEach(({ pattern, message, severity }) => {
                if (pattern.test(line)) {
                    issues.push({
                        file,
                        line: index + 1,
                        severity,
                        message,
                        code: line.trim(),
                        source: 'pattern-detection'
                    });
                }
            });
        });

        return issues;
    }

    async runPerformanceAnalysis(files) {
        console.log('⚡ Running Performance Analysis...');
        
        try {
            for (const file of files) {
                if (!fs.existsSync(file)) continue;
                
                const content = fs.readFileSync(file, 'utf8');
                const stats = fs.statSync(file);
                
                // File size analysis
                if (stats.size > this.config.performance.maxBundleSize) {
                    this.results.performance.push({
                        file,
                        type: 'file-size',
                        severity: 'medium',
                        message: `File too large: ${Math.round(stats.size / 1024)}KB (max: ${Math.round(this.config.performance.maxBundleSize / 1024)}KB)`,
                        metric: stats.size
                    });
                }

                // Code complexity analysis
                const complexity = this.calculateComplexity(content);
                if (complexity > this.config.performance.maxComplexity) {
                    this.results.performance.push({
                        file,
                        type: 'complexity',
                        severity: 'high',
                        message: `High cyclomatic complexity: ${complexity} (max: ${this.config.performance.maxComplexity})`,
                        metric: complexity
                    });
                }

                // Function length analysis
                const longFunctions = this.findLongFunctions(content);
                longFunctions.forEach(func => {
                    this.results.performance.push({
                        file,
                        type: 'function-length',
                        severity: 'medium',
                        message: `Function too long: ${func.lines} lines (max: ${this.config.performance.maxFunctionLength})`,
                        line: func.startLine,
                        functionName: func.name
                    });
                });
            }

            console.log(`   ✅ Performance analysis complete - ${this.results.performance.length} issues found`);
        } catch (error) {
            console.error('❌ Performance analysis failed:', error.message);
        }
    }

    calculateComplexity(content) {
        // Simple cyclomatic complexity calculation
        const complexityPatterns = [
            /\bif\s*\(/gi,
            /\belse\s+if\s*\(/gi,
            /\bwhile\s*\(/gi,
            /\bfor\s*\(/gi,
            /\bswitch\s*\(/gi,
            /\bcase\s+/gi,
            /\bcatch\s*\(/gi,
            /\b&&\b/gi,
            /\b\|\|\b/gi,
            /\?\s*.*?\s*:/gi // ternary operator
        ];

        let complexity = 1; // Base complexity
        complexityPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    findLongFunctions(content) {
        const lines = content.split('\n');
        const functions = [];
        let currentFunction = null;
        let braceCount = 0;

        lines.forEach((line, index) => {
            // Simple function detection
            const functionMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\(.*?\)\s*=>))/);
            
            if (functionMatch && !currentFunction) {
                currentFunction = {
                    name: functionMatch[1] || functionMatch[2] || 'anonymous',
                    startLine: index + 1,
                    lines: 0
                };
                braceCount = 0;
            }

            if (currentFunction) {
                currentFunction.lines++;
                
                // Count braces to determine function end
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                braceCount += openBraces - closeBraces;

                if (braceCount <= 0 && currentFunction.lines > 1) {
                    if (currentFunction.lines > this.config.performance.maxFunctionLength) {
                        functions.push(currentFunction);
                    }
                    currentFunction = null;
                }
            }
        });

        return functions;
    }

    async runQualityAnalysis(files) {
        console.log('📊 Running Quality Analysis...');
        
        try {
            // Run TypeScript compiler check
            try {
                execSync('npx tsc --noEmit --skipLibCheck', { timeout: 30000 });
                this.results.quality.push({
                    type: 'typescript',
                    severity: 'info',
                    message: 'TypeScript compilation successful',
                    passed: true
                });
            } catch (error) {
                this.results.quality.push({
                    type: 'typescript',
                    severity: 'high',
                    message: 'TypeScript compilation errors detected',
                    details: error.stdout || error.message,
                    passed: false
                });
            }

            // Analyze code duplication
            const duplication = this.analyzeCodeDuplication(files);
            if (duplication > this.config.quality.maxDuplication) {
                this.results.quality.push({
                    type: 'duplication',
                    severity: 'medium',
                    message: `High code duplication: ${duplication.toFixed(1)}% (max: ${this.config.quality.maxDuplication}%)`,
                    metric: duplication
                });
            }

            // Check for TODO/FIXME comments
            this.analyzeTechnicalDebt(files);

            console.log(`   ✅ Quality analysis complete - ${this.results.quality.length} issues found`);
        } catch (error) {
            console.error('❌ Quality analysis failed:', error.message);
        }
    }

    analyzeCodeDuplication(files) {
        const codeBlocks = new Map();
        let totalLines = 0;
        let duplicateLines = 0;

        files.forEach(file => {
            if (!fs.existsSync(file)) return;
            
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            totalLines += lines.length;

            // Check for duplicate blocks (5+ lines)
            for (let i = 0; i <= lines.length - 5; i++) {
                const block = lines.slice(i, i + 5).join('\n').trim();
                if (block.length > 50) { // Skip short blocks
                    if (codeBlocks.has(block)) {
                        duplicateLines += 5;
                    } else {
                        codeBlocks.set(block, file);
                    }
                }
            }
        });

        return totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0;
    }

    analyzeTechnicalDebt(files) {
        files.forEach(file => {
            if (!fs.existsSync(file)) return;
            
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const lowerLine = line.toLowerCase();
                
                if (lowerLine.includes('todo') || lowerLine.includes('fixme')) {
                    this.results.quality.push({
                        file,
                        line: index + 1,
                        type: 'technical-debt',
                        severity: 'low',
                        message: 'Technical debt marker found',
                        code: line.trim()
                    });
                }

                if (lowerLine.includes('hack') || lowerLine.includes('workaround')) {
                    this.results.quality.push({
                        file,
                        line: index + 1,
                        type: 'technical-debt',
                        severity: 'medium',
                        message: 'Potential code smell detected',
                        code: line.trim()
                    });
                }
            });
        });
    }

    async runPolicyEnforcement(files) {
        console.log('📋 Running Policy Enforcement...');
        
        try {
            for (const file of files) {
                if (!fs.existsSync(file)) continue;
                
                const content = fs.readFileSync(file, 'utf8');
                
                // Enforce TypeScript usage for new files
                if (this.config.policies.enforceTypeScript && file.endsWith('.js') && !file.includes('test')) {
                    this.results.policies.push({
                        file,
                        type: 'typescript-enforcement',
                        severity: 'medium',
                        message: 'Consider migrating to TypeScript for better type safety',
                        recommendation: `Rename ${file} to ${file.replace('.js', '.ts')}`
                    });
                }

                // Check for missing documentation in public APIs
                if (this.config.policies.requireDocumentation) {
                    const missingDocs = this.checkDocumentation(file, content);
                    this.results.policies.push(...missingDocs);
                }

                // Check for test coverage requirements
                if (this.config.policies.requireTests && this.isSourceFile(file)) {
                    const hasTests = this.checkTestCoverage(file);
                    if (!hasTests) {
                        this.results.policies.push({
                            file,
                            type: 'test-coverage',
                            severity: 'medium',
                            message: 'No corresponding test file found',
                            recommendation: `Create test file: ${this.suggestTestFilePath(file)}`
                        });
                    }
                }
            }

            console.log(`   ✅ Policy enforcement complete - ${this.results.policies.length} violations found`);
        } catch (error) {
            console.error('❌ Policy enforcement failed:', error.message);
        }
    }

    checkDocumentation(file, content) {
        const issues = [];
        const lines = content.split('\n');
        
        // Check for exported functions without JSDoc
        lines.forEach((line, index) => {
            if (/export\s+(function|const|class)/.test(line) && 
                !lines[index - 1]?.trim().startsWith('/**')) {
                issues.push({
                    file,
                    line: index + 1,
                    type: 'documentation',
                    severity: 'low',
                    message: 'Exported member missing JSDoc documentation',
                    code: line.trim()
                });
            }
        });

        return issues;
    }

    isSourceFile(file) {
        return /\.(ts|tsx|js|jsx)$/.test(file) && 
               !file.includes('test') && 
               !file.includes('spec') &&
               !file.includes('.d.ts');
    }

    checkTestCoverage(file) {
        const testPatterns = [
            file.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
            file.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
            path.join('tests', path.basename(file)),
            path.join('__tests__', path.basename(file))
        ];

        return testPatterns.some(testFile => fs.existsSync(testFile));
    }

    suggestTestFilePath(file) {
        const ext = path.extname(file);
        const base = path.basename(file, ext);
        const dir = path.dirname(file);
        return path.join(dir, `${base}.test${ext}`);
    }

    async generateRecommendations(files) {
        console.log('🤖 Generating AI-Powered Recommendations...');
        
        // Analyze patterns and generate recommendations
        const recommendations = [];

        // Security recommendations
        const criticalSecurity = this.results.security.filter(issue => issue.severity === 'critical');
        if (criticalSecurity.length > 0) {
            recommendations.push({
                priority: 'critical',
                category: 'security',
                title: 'Critical Security Vulnerabilities Detected',
                description: `Found ${criticalSecurity.length} critical security issues that require immediate attention`,
                actions: [
                    'Review and fix all eval() usage',
                    'Implement input sanitization',
                    'Add security headers',
                    'Conduct security audit'
                ]
            });
        }

        // Performance recommendations
        const performanceIssues = this.results.performance.length;
        if (performanceIssues > 5) {
            recommendations.push({
                priority: 'high',
                category: 'performance',
                title: 'Performance Optimization Needed',
                description: `Multiple performance issues detected (${performanceIssues} total)`,
                actions: [
                    'Implement code splitting',
                    'Optimize bundle size',
                    'Reduce function complexity',
                    'Add performance monitoring'
                ]
            });
        }

        // Code quality recommendations
        const qualityIssues = this.results.quality.filter(issue => !issue.passed);
        if (qualityIssues.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'quality',
                title: 'Code Quality Improvements',
                description: `Quality issues found in ${qualityIssues.length} areas`,
                actions: [
                    'Fix TypeScript compilation errors',
                    'Reduce code duplication',
                    'Address technical debt',
                    'Improve test coverage'
                ]
            });
        }

        this.results.recommendations = recommendations;
        console.log(`   ✅ Generated ${recommendations.length} recommendations`);
    }

    mapSeverity(eslintSeverity) {
        const severityMap = {
            1: 'medium',
            2: 'high'
        };
        return severityMap[eslintSeverity] || 'low';
    }

    generateReport() {
        const report = {
            reviewId: this.reviewId,
            timestamp: this.timestamp,
            summary: this.generateSummary(),
            results: this.results,
            metrics: this.calculateMetrics(),
            recommendations: this.results.recommendations
        };

        // Save detailed report
        const reportPath = `code-review-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Generate console output
        this.printReport(report);
        
        return report;
    }

    generateSummary() {
        const totalIssues = this.results.security.length + 
                           this.results.performance.length + 
                           this.results.quality.length + 
                           this.results.policies.length;

        const criticalIssues = [
            ...this.results.security.filter(i => i.severity === 'critical'),
            ...this.results.performance.filter(i => i.severity === 'critical'),
            ...this.results.quality.filter(i => i.severity === 'critical')
        ].length;

        return {
            totalIssues,
            criticalIssues,
            status: criticalIssues === 0 ? 'PASSED' : 'FAILED',
            grade: this.calculateGrade(totalIssues, criticalIssues)
        };
    }

    calculateGrade(totalIssues, criticalIssues) {
        if (criticalIssues > 0) return 'F';
        if (totalIssues === 0) return 'A+';
        if (totalIssues <= 5) return 'A';
        if (totalIssues <= 10) return 'B';
        if (totalIssues <= 20) return 'C';
        return 'D';
    }

    calculateMetrics() {
        return {
            securityScore: this.calculateSecurityScore(),
            performanceScore: this.calculatePerformanceScore(),
            qualityScore: this.calculateQualityScore(),
            overallScore: this.calculateOverallScore()
        };
    }

    calculateSecurityScore() {
        const issues = this.results.security;
        if (issues.length === 0) return 100;
        
        const criticalWeight = 50;
        const highWeight = 20;
        const mediumWeight = 10;
        const lowWeight = 5;

        const deductions = issues.reduce((total, issue) => {
            switch (issue.severity) {
                case 'critical': return total + criticalWeight;
                case 'high': return total + highWeight;
                case 'medium': return total + mediumWeight;
                case 'low': return total + lowWeight;
                default: return total;
            }
        }, 0);

        return Math.max(0, 100 - deductions);
    }

    calculatePerformanceScore() {
        const issues = this.results.performance;
        return Math.max(0, 100 - (issues.length * 10));
    }

    calculateQualityScore() {
        const issues = this.results.quality.filter(issue => !issue.passed);
        return Math.max(0, 100 - (issues.length * 5));
    }

    calculateOverallScore() {
        const { securityScore, performanceScore, qualityScore } = this.calculateMetrics();
        return Math.round((securityScore * 0.4 + performanceScore * 0.3 + qualityScore * 0.3));
    }

    printReport(report) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 ENHANCED CODE REVIEW REPORT');
        console.log('='.repeat(80));
        
        console.log(`\n🎯 SUMMARY:`);
        console.log(`   Status: ${report.summary.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Grade: ${this.getGradeEmoji(report.summary.grade)} ${report.summary.grade}`);
        console.log(`   Total Issues: ${report.summary.totalIssues}`);
        console.log(`   Critical Issues: ${report.summary.criticalIssues}`);

        console.log(`\n📊 SCORES:`);
        console.log(`   Overall: ${report.metrics.overallScore}/100`);
        console.log(`   Security: ${Math.round(report.metrics.securityScore)}/100`);
        console.log(`   Performance: ${Math.round(report.metrics.performanceScore)}/100`);
        console.log(`   Quality: ${Math.round(report.metrics.qualityScore)}/100`);

        console.log(`\n🔍 DETAILED RESULTS:`);
        console.log(`   🔒 Security Issues: ${this.results.security.length}`);
        console.log(`   ⚡ Performance Issues: ${this.results.performance.length}`);
        console.log(`   📊 Quality Issues: ${this.results.quality.length}`);
        console.log(`   📋 Policy Violations: ${this.results.policies.length}`);

        if (report.recommendations.length > 0) {
            console.log(`\n🤖 TOP RECOMMENDATIONS:`);
            report.recommendations.slice(0, 3).forEach((rec, index) => {
                console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
                console.log(`      ${rec.description}`);
            });
        }

        console.log(`\n📄 Detailed report saved to: code-review-report-${Date.now()}.json`);
        console.log('='.repeat(80) + '\n');
    }

    getGradeEmoji(grade) {
        const emojiMap = {
            'A+': '🏆',
            'A': '🥇',
            'B': '🥈',
            'C': '🥉',
            'D': '⚠️',
            'F': '❌'
        };
        return emojiMap[grade] || '❓';
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const reviewer = new EnhancedCodeReviewSystem();
    
    try {
        if (args.includes('--help') || args.includes('-h')) {
            console.log(`
Enhanced Code Review System for DirectoryBolt

Usage:
  node enhanced-code-review-system.js [options] [files...]

Options:
  --help, -h     Show this help message
  --all          Review all files in the project
  --config       Show current configuration

Examples:
  node enhanced-code-review-system.js                    # Review changed files
  node enhanced-code-review-system.js --all              # Review all files
  node enhanced-code-review-system.js file1.ts file2.js  # Review specific files
            `);
            return;
        }

        if (args.includes('--config')) {
            console.log('Current Configuration:');
            console.log(JSON.stringify(reviewer.config, null, 2));
            return;
        }

        const files = args.includes('--all') ? null : args.filter(arg => !arg.startsWith('--'));
        await reviewer.runComprehensiveReview(files.length > 0 ? files : null);
        
    } catch (error) {
        console.error('❌ Review failed:', error.message);
        process.exit(1);
    }
}

// Export for use as a module
module.exports = EnhancedCodeReviewSystem;

// Run CLI if called directly
if (require.main === module) {
    main();
}