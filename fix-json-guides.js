#!/usr/bin/env node

/**
 * Fix JSON Guide Files - DirectoryBolt
 * Identifies and fixes JSON parsing errors in guide files
 */

const fs = require('fs');
const path = require('path');

const guidesPath = path.join(__dirname, 'data', 'guides');

console.log('🔧 Fixing JSON Guide Files...');
console.log('=' .repeat(40));

if (!fs.existsSync(guidesPath)) {
    console.error(`❌ Guides directory not found: ${guidesPath}`);
    process.exit(1);
}

const files = fs.readdirSync(guidesPath).filter(file => file.endsWith('.json'));
console.log(`Processing ${files.length} JSON files...\n`);

let fixedCount = 0;
let errorCount = 0;
let validCount = 0;

files.forEach(file => {
    const filePath = path.join(guidesPath, file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Try to parse first
        try {
            JSON.parse(content);
            console.log(`✅ ${file}: Already valid`);
            validCount++;
            return;
        } catch (parseError) {
            console.log(`🔧 ${file}: Attempting to fix...`);
            
            // Common fixes
            let fixed = content;
            
            // Remove trailing commas
            fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
            
            // Fix unescaped quotes in strings (basic fix)
            fixed = fixed.replace(/([^\\\\])\\"/g, '$1\\\\"');
            
            // Ensure proper ending
            fixed = fixed.trim();
            if (!fixed.endsWith('}')) {
                fixed += '}';
            }
            
            // Try to parse fixed content
            try {
                JSON.parse(fixed);
                
                // Save fixed content
                fs.writeFileSync(filePath, fixed, 'utf8');
                console.log(`✅ ${file}: Fixed and saved`);
                fixedCount++;
                
            } catch (fixError) {
                console.log(`❌ ${file}: Could not fix - ${fixError.message}`);
                errorCount++;
                
                // Show file details for manual fixing
                console.log(`   File size: ${content.length} chars`);
                console.log(`   Last 100 chars: "${content.slice(-100)}"`);
                
                // Check for common issues
                const openBraces = (content.match(/{/g) || []).length;
                const closeBraces = (content.match(/}/g) || []).length;
                if (openBraces !== closeBraces) {
                    console.log(`   Brace mismatch: ${openBraces} open, ${closeBraces} close`);
                }
            }
        }
        
    } catch (readError) {
        console.log(`❌ ${file}: Cannot read file - ${readError.message}`);
        errorCount++;
    }
});

console.log('\\n' + '=' .repeat(40));
console.log(`Results:`);
console.log(`  ✅ Valid: ${validCount}`);
console.log(`  🔧 Fixed: ${fixedCount}`);
console.log(`  ❌ Errors: ${errorCount}`);

if (errorCount > 0) {
    console.log('\\n⚠️  Manual fixes needed for files marked with ❌');
    console.log('Common issues to check:');
    console.log('  • Missing closing braces }');
    console.log('  • Unmatched quotes "');
    console.log('  • Trailing commas ,');
    console.log('  • Truncated files');
    process.exit(1);
} else {
    console.log('\\n🎉 All JSON files are now valid!');
    
    if (fixedCount > 0) {
        console.log('\\n📝 Next steps:');
        console.log('1. Test your Next.js build: npm run build');
        console.log('2. Verify guides load correctly');
        console.log('3. Commit the fixed files to git');
    }
    
    process.exit(0);
}