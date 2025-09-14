#!/usr/bin/env node

/**
 * Quick JSON Check for DirectoryBolt Guides
 * Quickly identifies JSON parsing errors
 */

const fs = require('fs');
const path = require('path');

const guidesPath = path.join(__dirname, 'data', 'guides');

console.log('🔍 Quick JSON Validation Check...');
console.log('=' .repeat(40));

if (!fs.existsSync(guidesPath)) {
    console.error(`❌ Guides directory not found: ${guidesPath}`);
    process.exit(1);
}

const files = fs.readdirSync(guidesPath).filter(file => file.endsWith('.json'));
console.log(`Checking ${files.length} JSON files...\n`);

let errorCount = 0;
let validCount = 0;

files.forEach(file => {
    const filePath = path.join(guidesPath, file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Quick checks
        if (content.length < 100) {
            console.log(`⚠️  ${file}: File too small (${content.length} chars)`);
            errorCount++;
            return;
        }
        
        if (!content.trim().endsWith('}')) {
            console.log(`⚠️  ${file}: Missing closing brace`);
            errorCount++;
            return;
        }
        
        // Try to parse
        JSON.parse(content);
        console.log(`✅ ${file}: Valid`);
        validCount++;
        
    } catch (error) {
        console.log(`❌ ${file}: ${error.message}`);
        errorCount++;
        
        // Show file size and ending for diagnosis
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(`   Size: ${content.length} chars`);
            console.log(`   Ends with: "${content.slice(-50)}"`);
        } catch (e) {
            console.log(`   Could not read file details`);
        }
    }
});

console.log('\n' + '=' .repeat(40));
console.log(`Results: ${validCount} valid, ${errorCount} errors`);

if (errorCount > 0) {
    console.log('\n🔧 To fix JSON errors:');
    console.log('1. Check files marked with ❌ above');
    console.log('2. Ensure files end with }');
    console.log('3. Check for unmatched braces { }');
    console.log('4. Remove trailing commas');
    console.log('5. Validate JSON syntax');
    process.exit(1);
} else {
    console.log('\n🎉 All JSON files are valid!');
    process.exit(0);
}