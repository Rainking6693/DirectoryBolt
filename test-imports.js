// Test script to find problematic imports
const path = require('path');
const fs = require('fs');

console.log('Checking for problematic imports...');

// Check if formidable is still referenced anywhere
const checkFiles = [
  './pages/api/business-info/submit.ts',
  './pages/api-backup/business-info/submit.ts',
];

checkFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('formidable')) {
      console.log(`❌ Found formidable reference in ${file}`);
    } else {
      console.log(`✅ No formidable reference in ${file}`);
    }
  }
});

// Check package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
if (packageJson.dependencies?.formidable) {
  console.log('❌ formidable still in package.json dependencies');
} else {
  console.log('✅ formidable removed from package.json');
}

console.log('\nDone checking imports.');