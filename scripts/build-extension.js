#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

/**
 * Auto-Bolt Extension Build Script
 * Creates production-ready Chrome Web Store package
 */

class ExtensionBuilder {
  constructor() {
    this.buildDir = path.join(__dirname, '..', 'build');
    this.sourceDir = path.join(__dirname, '..');
    this.packageDir = path.join(this.buildDir, 'auto-bolt-extension');
    this.manifest = null;
  }

  async build() {
    console.log('🚀 Building Auto-Bolt Chrome Extension...');
    
    try {
      await this.validateSource();
      await this.createBuildDirectory();
      await this.copyFiles();
      await this.optimizeFiles();
      await this.generateBuildInfo();
      await this.createPackage();
      await this.validatePackage();
      
      console.log('✅ Extension build completed successfully!');
      console.log(`📦 Package created: ${this.getPackagePath()}`);
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async validateSource() {
    console.log('🔍 Validating source files...');
    
    // Load and validate manifest
    const manifestPath = path.join(this.sourceDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json not found');
    }
    
    this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!this.manifest[field]) {
        throw new Error(`Missing required field in manifest: ${field}`);
      }
    }
    
    // Validate manifest version
    if (this.manifest.manifest_version !== 3) {
      throw new Error('Manifest version must be 3 for Chrome Web Store');
    }
    
    // Check required files
    const requiredFiles = [
      'popup.html',
      'popup.js',
      'content.js',
      'background-batch.js',
      'icons/icon16.png',
      'icons/icon48.png',
      'icons/icon128.png',
      'directories/master-directory-list.json'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.sourceDir, file))) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    
    // Validate directory data
    const directoryData = JSON.parse(
      fs.readFileSync(path.join(this.sourceDir, 'directories/master-directory-list.json'), 'utf8')
    );
    
    if (!directoryData.directories || directoryData.directories.length < 50) {
      throw new Error('Insufficient directory data - need at least 50 directories');
    }
    
    console.log(`✅ Validation passed - ${directoryData.directories.length} directories available`);
  }

  async createBuildDirectory() {
    console.log('📁 Creating build directory...');
    
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(this.buildDir, { recursive: true });
    fs.mkdirSync(this.packageDir, { recursive: true });
  }

  async copyFiles() {
    console.log('📋 Copying extension files...');
    
    // Core files
    const coreFiles = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'popup.css',
      'content.js',
      'background-batch.js',
      'directory-form-filler.js',
      'directory-registry.js',
      'queue-processor.js'
    ];
    
    for (const file of coreFiles) {
      if (fs.existsSync(path.join(this.sourceDir, file))) {
        this.copyFile(file, file);
      }
    }
    
    // Enhanced popup files (if they exist)
    const enhancedFiles = [
      'enhanced-popup.html',
      'enhanced-popup.js',
      'enhanced-popup.css'
    ];
    
    for (const file of enhancedFiles) {
      if (fs.existsSync(path.join(this.sourceDir, file))) {
        this.copyFile(file, file);
      }
    }
    
    // Copy directories
    this.copyDirectory('icons', 'icons');
    this.copyDirectory('directories', 'directories');
    
    console.log('✅ Files copied successfully');
  }

  copyFile(src, dest) {
    const srcPath = path.join(this.sourceDir, src);
    const destPath = path.join(this.packageDir, dest);
    
    // Create directory if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(srcPath, destPath);
  }

  copyDirectory(src, dest) {
    const srcPath = path.join(this.sourceDir, src);
    const destPath = path.join(this.packageDir, dest);
    
    if (!fs.existsSync(srcPath)) {
      return;
    }
    
    fs.mkdirSync(destPath, { recursive: true });
    
    const items = fs.readdirSync(srcPath);
    for (const item of items) {
      const srcItem = path.join(srcPath, item);
      const destItem = path.join(destPath, item);
      
      if (fs.statSync(srcItem).isDirectory()) {
        this.copyDirectory(path.join(src, item), path.join(dest, item));
      } else {
        fs.copyFileSync(srcItem, destItem);
      }
    }
  }

  async optimizeFiles() {
    console.log('⚡ Optimizing files...');
    
    // Remove development files and comments
    const jsFiles = this.findFiles(this.packageDir, '.js');
    
    for (const file of jsFiles) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Remove console.log statements in production
      content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
      
      // Remove debug comments
      content = content.replace(/\/\*\s*DEBUG[\s\S]*?\*\//g, '');
      content = content.replace(/\/\/\s*DEBUG.*/g, '');
      
      fs.writeFileSync(file, content);
    }
    
    // Optimize manifest for production
    const manifestPath = path.join(this.packageDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Remove development-specific fields
    delete manifest.key;
    
    // Ensure production-ready permissions
    if (manifest.host_permissions) {
      manifest.host_permissions = manifest.host_permissions.filter(
        perm => !perm.includes('localhost') && !perm.includes('127.0.0.1')
      );
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Files optimized');
  }

  async generateBuildInfo() {
    console.log('📄 Generating build info...');
    
    const buildInfo = {
      buildDate: new Date().toISOString(),
      version: this.manifest.version,
      environment: 'production',
      gitCommit: process.env.GITHUB_SHA || 'unknown',
      buildNumber: process.env.GITHUB_RUN_NUMBER || Date.now().toString(),
      directories: this.getDirectoryCount(),
      checksums: await this.generateChecksums()
    };
    
    fs.writeFileSync(
      path.join(this.packageDir, 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );
    
    console.log(`✅ Build info generated - Build #${buildInfo.buildNumber}`);
  }

  getDirectoryCount() {
    const directoryData = JSON.parse(
      fs.readFileSync(path.join(this.packageDir, 'directories/master-directory-list.json'), 'utf8')
    );
    return directoryData.directories.length;
  }

  async generateChecksums() {
    const checksums = {};
    const files = this.findFiles(this.packageDir, ['.js', '.html', '.css', '.json']);
    
    for (const file of files) {
      const content = fs.readFileSync(file);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const relativePath = (file && this.packageDir) ? path.relative(this.packageDir, file) : (file || 'unknown file');
      checksums[relativePath] = hash;
    }
    
    return checksums;
  }

  findFiles(dir, extensions) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        files.push(...this.findFiles(itemPath, extensions));
      } else {
        const ext = path.extname(item);
        if (Array.isArray(extensions) ? extensions.includes(ext) : ext === extensions) {
          files.push(itemPath);
        }
      }
    }
    
    return files;
  }

  async createPackage() {
    console.log('📦 Creating ZIP package...');
    
    const packagePath = this.getPackagePath();
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        const sizeKB = Math.round(archive.pointer() / 1024);
        console.log(`✅ Package created: ${sizeKB} KB`);
        resolve();
      });
      
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.directory(this.packageDir, false);
      archive.finalize();
    });
  }

  getPackagePath() {
    return path.join(this.buildDir, `auto-bolt-v${this.manifest.version}.zip`);
  }

  async validatePackage() {
    console.log('✅ Validating package...');
    
    const packagePath = this.getPackagePath();
    const stats = fs.statSync(packagePath);
    
    // Check size limits
    const maxSize = 128 * 1024 * 1024; // 128MB Chrome Web Store limit
    if (stats.size > maxSize) {
      throw new Error(`Package too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: 128MB)`);
    }
    
    // Additional validations could be added here
    console.log(`✅ Package validation passed (${Math.round(stats.size / 1024)}KB)`);
  }
}

// CLI execution
if (require.main === module) {
  const builder = new ExtensionBuilder();
  builder.build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

module.exports = ExtensionBuilder;