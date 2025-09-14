#!/usr/bin/env node

/**
 * JSON Validation Script for DirectoryBolt Guides
 * Identifies and fixes JSON parsing errors in guide files
 */

const fs = require('fs');
const path = require('path');

class JSONGuideValidator {
    constructor() {
        this.guidesPath = path.join(__dirname, 'data', 'guides');
        this.errors = [];
        this.validFiles = [];
        this.fixedFiles = [];
    }

    async validateAllGuides() {
        console.log('🔍 Validating JSON Guide Files...');
        console.log('=' .repeat(50));
        
        if (!fs.existsSync(this.guidesPath)) {
            console.error(`❌ Guides directory not found: ${this.guidesPath}`);
            return false;
        }

        const files = fs.readdirSync(this.guidesPath)
            .filter(file => file.endsWith('.json'));

        console.log(`Found ${files.length} JSON guide files to validate\n`);

        for (const file of files) {
            await this.validateFile(file);
        }

        this.generateReport();
        return this.errors.length === 0;
    }

    async validateFile(filename) {
        const filePath = path.join(this.guidesPath, filename);
        
        try {
            console.log(`Validating: ${filename}`);
            
            // Read file content
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for common issues
            const issues = this.checkCommonIssues(content, filename);
            
            if (issues.length > 0) {
                console.log(`  ⚠️  Pre-parse issues found:`);
                issues.forEach(issue => console.log(`    • ${issue}`));
                
                // Try to fix common issues
                const fixedContent = this.fixCommonIssues(content);
                
                if (fixedContent !== content) {
                    console.log(`  🔧 Attempting to fix issues...`);
                    
                    try {
                        // Test if fixed content parses
                        JSON.parse(fixedContent);
                        
                        // Save fixed content
                        fs.writeFileSync(filePath, fixedContent, 'utf8');
                        console.log(`  ✅ Fixed and saved: ${filename}`);
                        this.fixedFiles.push(filename);
                        this.validFiles.push(filename);
                        return;
                    } catch (fixError) {
                        console.log(`  ❌ Fix attempt failed: ${fixError.message}`);
                    }
                }
            }
            
            // Try to parse JSON
            const parsed = JSON.parse(content);
            
            // Validate structure
            const structureValid = this.validateStructure(parsed, filename);
            
            if (structureValid) {
                console.log(`  ✅ Valid JSON and structure`);
                this.validFiles.push(filename);
            }
            
        } catch (error) {
            console.log(`  ❌ JSON Parse Error: ${error.message}`);
            
            this.errors.push({
                file: filename,
                error: error.message,
                line: this.getErrorLine(error.message),
                type: 'JSON_PARSE_ERROR'
            });
            
            // Try to identify the specific issue
            this.diagnoseJSONError(filePath, error);
        }
        
        console.log('');
    }

    checkCommonIssues(content, filename) {
        const issues = [];
        
        // Check for truncated files
        if (!content.trim().endsWith('}')) {
            issues.push('File appears to be truncated (missing closing brace)');
        }
        
        // Check for unmatched braces
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        // Check for unmatched brackets
        const openBrackets = (content.match(/\\[/g) || []).length;
        const closeBrackets = (content.match(/\\]/g) || []).length;
        if (openBrackets !== closeBrackets) {
            issues.push(`Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`);
        }
        
        // Check for trailing commas
        if (content.includes(',}') || content.includes(',]')) {
            issues.push('Trailing commas found');
        }
        
        // Check for unescaped quotes in strings
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (line.includes('"') && line.includes('\\"') === false) {
                const quoteCount = (line.match(/"/g) || []).length;
                if (quoteCount % 2 !== 0) {
                    issues.push(`Possible unescaped quote on line ${index + 1}`);
                }
            }
        });
        
        return issues;
    }

    fixCommonIssues(content) {
        let fixed = content;
        
        // Remove trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix common escape issues
        fixed = fixed.replace(/([^\\\\])\\"/g, '$1\\\\"');
        
        // Ensure file ends properly
        fixed = fixed.trim();
        if (!fixed.endsWith('}')) {
            fixed += '}';
        }
        
        return fixed;
    }

    validateStructure(parsed, filename) {
        const required = ['slug', 'title', 'description', 'directoryName', 'content'];
        const missing = required.filter(field => !parsed[field]);
        
        if (missing.length > 0) {
            console.log(`  ⚠️  Missing required fields: ${missing.join(', ')}`);
            return false;
        }
        
        // Check content structure
        if (!parsed.content.sections || !Array.isArray(parsed.content.sections)) {
            console.log(`  ⚠️  Invalid content.sections structure`);
            return false;
        }
        
        return true;
    }

    diagnoseJSONError(filePath, error) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Try to find the error location
            const errorMatch = error.message.match(/position (\\d+)/);
            if (errorMatch) {
                const position = parseInt(errorMatch[1]);
                let currentPos = 0;
                let errorLine = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    if (currentPos + lines[i].length >= position) {
                        errorLine = i + 1;
                        break;
                    }
                    currentPos += lines[i].length + 1; // +1 for newline
                }
                
                console.log(`  📍 Error likely around line ${errorLine}: "${lines[errorLine - 1]?.trim()}"`);
            }
            
            // Check for common patterns
            if (error.message.includes('Unexpected end of JSON input')) {
                console.log(`  💡 File appears to be incomplete or truncated`);
                console.log(`  📏 File size: ${content.length} characters`);
                console.log(`  🔚 Last 100 characters: "${content.slice(-100)}"`);
            }
            
        } catch (diagError) {
            console.log(`  ❌ Could not diagnose error: ${diagError.message}`);
        }
    }

    getErrorLine(errorMessage) {
        const lineMatch = errorMessage.match(/line (\\d+)/);
        const posMatch = errorMessage.match(/position (\\d+)/);
        return lineMatch ? parseInt(lineMatch[1]) : (posMatch ? parseInt(posMatch[1]) : null);
    }

    generateReport() {
        console.log('\\n📊 JSON VALIDATION REPORT');
        console.log('=' .repeat(50));
        
        const totalFiles = this.validFiles.length + this.errors.length;
        const validCount = this.validFiles.length;
        const errorCount = this.errors.length;
        const fixedCount = this.fixedFiles.length;
        
        console.log(`Total Files: ${totalFiles}`);
        console.log(`Valid Files: ${validCount}`);
        console.log(`Files with Errors: ${errorCount}`);
        console.log(`Files Fixed: ${fixedCount}`);
        console.log(`Success Rate: ${totalFiles > 0 ? ((validCount / totalFiles) * 100).toFixed(1) : 0}%`);
        
        if (this.errors.length > 0) {
            console.log('\\n❌ FILES WITH ERRORS:');
            console.log('-' .repeat(30));
            
            this.errors.forEach(error => {
                console.log(`${error.file}: ${error.error}`);
                if (error.line) {
                    console.log(`  Line: ${error.line}`);
                }
            });
        }
        
        if (this.fixedFiles.length > 0) {
            console.log('\\n🔧 FIXED FILES:');
            console.log('-' .repeat(30));
            this.fixedFiles.forEach(file => console.log(`✅ ${file}`));
        }
        
        console.log('\\n' + '=' .repeat(50));
        
        if (this.errors.length === 0) {
            console.log('🎉 ALL JSON FILES ARE VALID!');
        } else {
            console.log('⚠️  JSON VALIDATION ISSUES FOUND');
            console.log('\\nTo fix remaining issues:');
            console.log('1. Check the files listed above');
            console.log('2. Validate JSON syntax manually');
            console.log('3. Ensure all braces and brackets are matched');
            console.log('4. Remove trailing commas');
            console.log('5. Escape quotes properly in strings');
        }
        
        // Save report
        const reportPath = path.join(__dirname, 'json-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                totalFiles,
                validCount,
                errorCount,
                fixedCount,
                successRate: totalFiles > 0 ? ((validCount / totalFiles) * 100) : 0
            },
            validFiles: this.validFiles,
            errors: this.errors,
            fixedFiles: this.fixedFiles,
            timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`\\n📄 Detailed report saved to: ${reportPath}`);
    }
}

// Run validation
const validator = new JSONGuideValidator();
validator.validateAllGuides().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
});