#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple Chrome Extension Builder
 * Creates production-ready package without external dependencies
 */

console.log('🚀 Building Auto-Bolt Chrome Extension...');

const sourceDir = path.join(__dirname, '..');
const buildDir = path.join(sourceDir, 'build');
const packageDir = path.join(buildDir, 'auto-bolt-extension');

// Clean and create build directory
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(packageDir, { recursive: true });

console.log('📁 Created build directory');

// Core files to copy
const coreFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'content.js',
  'background-batch.js',
  'directory-form-filler.js',
  'directory-registry.js',
  'queue-processor.js',
  'onboarding.html'
];

// Copy core files
console.log('📋 Copying core files...');
for (const file of coreFiles) {
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(packageDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ⚠ Missing: ${file}`);
  }
}

// Copy directories
console.log('📁 Copying directories...');
const directories = ['icons', 'directories'];

for (const dir of directories) {
  const srcPath = path.join(sourceDir, dir);
  const destPath = path.join(packageDir, dir);
  
  if (fs.existsSync(srcPath)) {
    copyDirectory(srcPath, destPath);
    console.log(`  ✓ ${dir}/`);
  } else {
    console.log(`  ⚠ Missing: ${dir}/`);
  }
}

// Optimize files for production
console.log('⚡ Optimizing files...');

// Read manifest to get version
const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, 'manifest.json'), 'utf8'));

// Remove development key from manifest
if (manifest.key) {
  delete manifest.key;
  fs.writeFileSync(path.join(packageDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

// Generate build info
const buildInfo = {
  buildDate: new Date().toISOString(),
  version: manifest.version,
  environment: 'production',
  directories: getDirectoryCount(),
  files: getFileList(packageDir)
};

fs.writeFileSync(
  path.join(packageDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('📄 Generated build info');

// Get package size
const packageSize = getDirectorySize(packageDir);
const packageSizeKB = Math.round(packageSize / 1024);

console.log('✅ Build completed successfully!');
console.log(`📊 Statistics:`);
console.log(`   Version: ${manifest.version}`);
console.log(`   Directories: ${buildInfo.directories}`);
console.log(`   Files: ${buildInfo.files.length}`);
console.log(`   Size: ${packageSizeKB}KB`);
console.log(`📦 Package location: ${packageDir}`);

// Helper functions
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getDirectoryCount() {
  const directoryFile = path.join(packageDir, 'directories', 'master-directory-list.json');
  if (fs.existsSync(directoryFile)) {
    const data = JSON.parse(fs.readFileSync(directoryFile, 'utf8'));
    return data.directories ? data.directories.length : 0;
  }
  return 0;
}

function getFileList(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      files.push(...getFileList(itemPath).map(f => path.join(item, f)));
    } else {
      files.push(item);
    }
  }
  
  return files;
}

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