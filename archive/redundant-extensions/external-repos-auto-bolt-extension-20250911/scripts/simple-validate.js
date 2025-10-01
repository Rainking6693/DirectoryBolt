#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple Chrome Web Store Validator
 * Basic validation without external dependencies
 */

console.log('🔍 Validating Chrome Extension...');

const sourceDir = path.join(__dirname, '..');
const buildDir = path.join(sourceDir, 'build', 'auto-bolt-extension');

let errors = 0;
let warnings = 0;
let passes = 0;

function addError(message) {
  console.log(`❌ ERROR: ${message}`);
  errors++;
}

function addWarning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  warnings++;
}

function addPass(message) {
  console.log(`✅ PASS: ${message}`);
  passes++;
}

// Check if build exists
if (!fs.existsSync(buildDir)) {
  addError('Build directory not found. Run build script first.');
  process.exit(1);
}

// Validate manifest.json
console.log('\n📋 Validating manifest.json...');
const manifestPath = path.join(buildDir, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  addError('manifest.json not found');
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Required fields
    if (!manifest.manifest_version) addError('Missing manifest_version');
    else if (manifest.manifest_version !== 3) addError('manifest_version must be 3');
    else addPass('Manifest version 3 confirmed');
    
    if (!manifest.name) addError('Missing extension name');
    else {
      if (manifest.name.length > 45) addError('Extension name too long (>45 chars)');
      else if (manifest.name.length < 3) addError('Extension name too short (<3 chars)');
      else addPass(`Extension name OK: "${manifest.name}"`);
    }
    
    if (!manifest.version) addError('Missing version');
    else {
      if (!/^\d+(\.\d+)*$/.test(manifest.version)) addError('Invalid version format');
      else addPass(`Version OK: ${manifest.version}`);
    }
    
    if (!manifest.description) addError('Missing description');
    else {
      if (manifest.description.length > 132) addError('Description too long (>132 chars)');
      else if (manifest.description.length < 10) addWarning('Description very short (<10 chars)');
      else addPass('Description length OK');
    }
    
  } catch (error) {
    addError('manifest.json is not valid JSON');
  }
}

// Validate icons
console.log('\n🎨 Validating icons...');
const iconSizes = [16, 48, 128];
const iconsDir = path.join(buildDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  addError('Icons directory not found');
} else {
  for (const size of iconSizes) {
    const iconPath = path.join(iconsDir, `icon${size}.png`);
    if (!fs.existsSync(iconPath)) {
      addError(`Missing icon: icon${size}.png`);
    } else {
      addPass(`Icon found: icon${size}.png`);
    }
  }
}

// Validate required files
console.log('\n📄 Validating required files...');
const requiredFiles = [
  'popup.html',
  'popup.js',
  'content.js',
  'background-batch.js'
];

for (const file of requiredFiles) {
  const filePath = path.join(buildDir, file);
  if (!fs.existsSync(filePath)) {
    addError(`Missing required file: ${file}`);
  } else {
    addPass(`Required file found: ${file}`);
  }
}

// Validate directories data
console.log('\n📁 Validating directory data...');
const directoriesPath = path.join(buildDir, 'directories', 'master-directory-list.json');

if (!fs.existsSync(directoriesPath)) {
  addError('Directory data file not found');
} else {
  try {
    const data = JSON.parse(fs.readFileSync(directoriesPath, 'utf8'));
    if (!data.directories || !Array.isArray(data.directories)) {
      addError('Invalid directory data structure');
    } else {
      const count = data.directories.length;
      if (count < 50) {
        addWarning(`Low directory count: ${count} (expected 50+)`);
      } else {
        addPass(`Directory count OK: ${count} directories`);
      }
    }
  } catch (error) {
    addError('Directory data is not valid JSON');
  }
}

// Check file sizes
console.log('\n📏 Validating file sizes...');
const totalSize = getDirectorySize(buildDir);
const totalSizeKB = Math.round(totalSize / 1024);
const totalSizeMB = totalSize / (1024 * 1024);

if (totalSizeMB > 128) {
  addError(`Package too large: ${totalSizeMB.toFixed(2)}MB (max: 128MB)`);
} else if (totalSizeMB > 50) {
  addWarning(`Large package: ${totalSizeMB.toFixed(2)}MB (consider optimization)`);
} else {
  addPass(`Package size OK: ${totalSizeKB}KB`);
}

// Security checks
console.log('\n🔒 Basic security validation...');
const jsFiles = findFiles(buildDir, '.js');

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const fileName = path.basename(file);
  
  if (/\beval\s*\(/.test(content)) {
    addError(`eval() found in ${fileName} - not allowed`);
  }
  
  if (/new\s+Function\s*\(/.test(content)) {
    addError(`Function constructor found in ${fileName} - not allowed`);
  }
  
  const consoleCount = (content.match(/console\.log\s*\(/g) || []).length;
  if (consoleCount > 5) {
    addWarning(`Many console.log statements in ${fileName}: ${consoleCount}`);
  }
}

addPass('Basic security checks completed');

// Generate report
console.log('\n📊 Validation Summary');
console.log('='.repeat(40));
console.log(`✅ Passed: ${passes}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Errors: ${errors}`);

const total = passes + warnings + errors;
const score = Math.round(((passes + warnings * 0.5) / total) * 100);

console.log(`📊 Score: ${score}%`);

if (errors === 0) {
  if (score >= 90) {
    console.log('🎉 EXCELLENT - Ready for Chrome Web Store!');
  } else if (score >= 75) {
    console.log('👍 GOOD - Minor issues to address');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT - Address warnings');
  }
} else {
  console.log('🚫 FAILED - Fix errors before submission');
  process.exit(1);
}

// Helper functions
function getDirectorySize(dir) {
  let size = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(itemPath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}

function findFiles(dir, extension) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      files.push(...findFiles(itemPath, extension));
    } else if (path.extname(item) === extension) {
      files.push(itemPath);
    }
  }
  
  return files;
}