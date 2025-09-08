const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Executing directory expansion...');
console.log('📂 Current working directory:', process.cwd());

try {
  // Change to directories folder
  const directoriesPath = path.join(process.cwd(), 'directories');
  console.log('📁 Changing to directories folder:', directoriesPath);
  
  // Check if the script exists
  const scriptPath = path.join(directoriesPath, 'create-expanded-directory-list.js');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script not found at: ${scriptPath}`);
  }
  
  // Execute the script
  const result = execSync('node create-expanded-directory-list.js', { 
    cwd: directoriesPath,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Script output:');
  console.log(result);
  
  // Check if the output file was created
  const outputFile = path.join(directoriesPath, 'master-directory-list-expanded-594.json');
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    console.log(`📁 Output file created successfully: ${outputFile}`);
    console.log(`📊 File size: ${Math.round(stats.size / 1024)} KB`);
    
    // Read and validate the file
    const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    console.log(`📈 Total directories in expanded list: ${data.directories.length}`);
    console.log(`📋 Categories: ${Object.keys(data.metadata.categories).join(', ')}`);
  } else {
    console.log('❌ Output file was not created');
  }
  
} catch (error) {
  console.error('❌ Error executing expansion:', error.message);
  if (error.stdout) console.log('📤 stdout:', error.stdout);
  if (error.stderr) console.log('📥 stderr:', error.stderr);
}