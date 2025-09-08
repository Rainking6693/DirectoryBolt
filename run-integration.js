const { execSync } = require('child_process');
const path = require('path');

try {
  // Change to directories folder and run the integration script
  process.chdir('./directories');
  console.log('🚀 Starting directory integration...');
  
  const result = execSync('node integrate-new-directories.js', { encoding: 'utf8' });
  console.log(result);
  
  console.log('✅ Directory integration completed successfully!');
} catch (error) {
  console.error('❌ Error during integration:', error.message);
}