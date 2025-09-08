const { execSync } = require('child_process');
const path = require('path');

try {
  // Change to directories folder and run the expansion script
  process.chdir('./directories');
  console.log('🚀 Starting directory expansion...');
  console.log('📂 Working directory:', process.cwd());
  
  const result = execSync('node create-expanded-directory-list.js', { encoding: 'utf8' });
  console.log(result);
  
  console.log('✅ Directory expansion completed successfully!');
  console.log('📁 New file created: master-directory-list-expanded-594.json');
  
} catch (error) {
  console.error('❌ Error during expansion:', error.message);
  console.error('📍 Current directory:', process.cwd());
  console.error('📋 Error details:', error.toString());
}