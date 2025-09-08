const fs = require('fs');

console.log('🚀 Starting directory expansion process...');

// Check if the required files exist
const requiredFiles = ['master-directory-list-486.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.log('❌ Missing required files:', missingFiles);
  console.log('📂 Current directory contents:');
  console.log(fs.readdirSync('.').filter(f => f.endsWith('.json')));
  process.exit(1);
}

// Run the expansion
try {
  require('./create-expanded-directory-list.js');
} catch (error) {
  console.error('❌ Error running expansion:', error.message);
  console.error(error.stack);
}