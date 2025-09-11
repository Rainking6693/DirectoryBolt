#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

/**
 * Chrome Web Store Validation Tool
 * Validates extension package against Chrome Web Store requirements
 */

class ChromeWebStoreValidator {
  constructor(packagePath) {
    this.packagePath = packagePath;
    this.tempDir = path.join(__dirname, '..', 'temp-validation');
    this.validationResults = {
      passed: [],
      warnings: [],
      errors: [],
      score: 0
    };
  }

  async validate() {
    console.log('🔍 Validating Chrome Web Store package...');
    console.log(`📦 Package: ${path.basename(this.packagePath)}`);
    
    try {
      await this.extractPackage();
      await this.validateManifest();
      await this.validateIcons();
      await this.validatePermissions();
      await this.validateContent();
      await this.validateSize();
      await this.validateSecurity();
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async extractPackage() {
    console.log('📂 Extracting package...');
    
    if (!fs.existsSync(this.packagePath)) {
      throw new Error('Package file not found');
    }

    // Create temp directory
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.tempDir, { recursive: true });

    // Extract ZIP
    const zip = new AdmZip(this.packagePath);
    zip.extractAllTo(this.tempDir, true);
    
    this.addPassed('Package extraction successful');
  }

  async validateManifest() {
    console.log('📋 Validating manifest.json...');
    
    const manifestPath = path.join(this.tempDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      this.addError('manifest.json not found');
      return;
    }

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      this.addError('manifest.json is not valid JSON');
      return;
    }

    // Required fields
    const requiredFields = [
      'manifest_version',
      'name',
      'version',
      'description'
    ];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        this.addError(`Missing required field: ${field}`);
      }
    }

    // Manifest version
    if (manifest.manifest_version !== 3) {
      this.addError('manifest_version must be 3');
    } else {
      this.addPassed('Manifest version 3 confirmed');
    }

    // Name validation
    if (manifest.name) {
      if (manifest.name.length > 45) {
        this.addError('Extension name exceeds 45 characters');
      }
      if (manifest.name.length < 3) {
        this.addError('Extension name must be at least 3 characters');
      }
      if (/^(chrome|google|extension|app)$/i.test(manifest.name)) {
        this.addError('Extension name contains restricted words');
      }
    }

    // Description validation
    if (manifest.description) {
      if (manifest.description.length > 132) {
        this.addError('Description exceeds 132 characters');
      }
      if (manifest.description.length < 10) {
        this.addWarning('Description is very short (less than 10 characters)');
      }
    }

    // Version validation
    if (manifest.version && !/^\d+(\.\d+)*$/.test(manifest.version)) {
      this.addError('Version format is invalid (must be dot-separated integers)');
    }

    // Permissions validation
    if (manifest.permissions) {
      const suspiciousPermissions = [
        'tabs',
        'history',
        'bookmarks',
        'cookies',
        'browsingData',
        'management'
      ];
      
      for (const permission of manifest.permissions) {
        if (suspiciousPermissions.includes(permission)) {
          this.addWarning(`Suspicious permission detected: ${permission}`);
        }
      }
    }

    // Host permissions validation
    if (manifest.host_permissions) {
      for (const permission of manifest.host_permissions) {
        if (permission === '<all_urls>' || permission === '*://*/*') {
          this.addWarning('Broad host permissions detected - may require additional review');
        }
      }
    }

    this.addPassed('Manifest validation completed');
  }

  async validateIcons() {
    console.log('🎨 Validating icons...');
    
    const requiredSizes = [16, 48, 128];
    const iconDir = path.join(this.tempDir, 'icons');
    
    if (!fs.existsSync(iconDir)) {
      this.addError('Icons directory not found');
      return;
    }

    for (const size of requiredSizes) {
      const iconPath = path.join(iconDir, `icon${size}.png`);
      
      if (!fs.existsSync(iconPath)) {
        this.addError(`Missing required icon: icon${size}.png`);
        continue;
      }

      // Check file size (basic validation)
      const stats = fs.statSync(iconPath);
      if (stats.size > 1024 * 1024) { // 1MB
        this.addWarning(`Icon ${size}x${size} is very large: ${Math.round(stats.size / 1024)}KB`);
      }

      this.addPassed(`Icon ${size}x${size} found`);
    }
  }

  async validatePermissions() {
    console.log('🔐 Validating permissions...');
    
    const manifestPath = path.join(this.tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check for minimal permissions principle
    const allPermissions = [
      ...(manifest.permissions || []),
      ...(manifest.host_permissions || [])
    ];

    if (allPermissions.length === 0) {
      this.addWarning('No permissions declared - extension may not function properly');
    }

    // Validate permission usage in code
    const jsFiles = this.findFiles(this.tempDir, '.js');
    const usedApis = new Set();

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Common Chrome API usage patterns
      const apiPatterns = {
        'storage': /chrome\.storage/g,
        'tabs': /chrome\.tabs/g,
        'activeTab': /chrome\.tabs\.query.*active.*true/g,
        'scripting': /chrome\.scripting/g,
        'alarms': /chrome\.alarms/g,
        'notifications': /chrome\.notifications/g
      };

      for (const [api, pattern] of Object.entries(apiPatterns)) {
        if (pattern.test(content)) {
          usedApis.add(api);
        }
      }
    }

    // Check if declared permissions match used APIs
    const declaredPermissions = new Set(manifest.permissions || []);
    
    for (const usedApi of usedApis) {
      if (!declaredPermissions.has(usedApi) && usedApi !== 'activeTab') {
        this.addWarning(`Code uses ${usedApi} API but permission not declared`);
      }
    }

    this.addPassed('Permission validation completed');
  }

  async validateContent() {
    console.log('📄 Validating content...');
    
    // Check for required files
    const requiredFiles = [
      'popup.html',
      'popup.js',
      'content.js',
      'background-batch.js'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.tempDir, file))) {
        this.addError(`Missing required file: ${file}`);
      } else {
        this.addPassed(`Required file found: ${file}`);
      }
    }

    // Validate HTML files
    const htmlFiles = this.findFiles(this.tempDir, '.html');
    for (const file of htmlFiles) {
      await this.validateHtmlFile(file);
    }

    // Validate JavaScript files
    const jsFiles = this.findFiles(this.tempDir, '.js');
    for (const file of jsFiles) {
      await this.validateJsFile(file);
    }
  }

  async validateHtmlFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check for inline scripts
    if (/<script[^>]*>(?!\s*<\/script>)/.test(content)) {
      this.addError(`Inline scripts found in ${fileName} - violates CSP`);
    }

    // Check for inline styles (warning)
    if (/style\s*=\s*["'][^"']*["']/.test(content)) {
      this.addWarning(`Inline styles found in ${fileName} - consider using external CSS`);
    }

    // Check for eval or similar
    if (/\beval\s*\(/.test(content)) {
      this.addError(`eval() usage found in ${fileName} - not allowed`);
    }
  }

  async validateJsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check for eval
    if (/\beval\s*\(/.test(content)) {
      this.addError(`eval() usage found in ${fileName} - not allowed`);
    }

    // Check for Function constructor
    if (/new\s+Function\s*\(/.test(content)) {
      this.addError(`Function constructor found in ${fileName} - not allowed`);
    }

    // Check for dangerous innerHTML usage
    if (/\.innerHTML\s*=\s*[^"']/.test(content)) {
      this.addWarning(`Dynamic innerHTML usage in ${fileName} - potential XSS risk`);
    }

    // Check for console.log in production
    const consoleCount = (content.match(/console\.log\s*\(/g) || []).length;
    if (consoleCount > 5) {
      this.addWarning(`Many console.log statements in ${fileName} (${consoleCount}) - consider removing for production`);
    }

    // Check for hardcoded URLs/secrets
    const urlPattern = /https?:\/\/(?!auto-bolt\.netlify\.app)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const hardcodedUrls = content.match(urlPattern);
    if (hardcodedUrls && hardcodedUrls.length > 0) {
      this.addWarning(`Hardcoded URLs found in ${fileName}: ${hardcodedUrls.join(', ')}`);
    }
  }

  async validateSize() {
    console.log('📏 Validating package size...');
    
    const stats = fs.statSync(this.packagePath);
    const sizeMB = stats.size / (1024 * 1024);
    const sizeKB = stats.size / 1024;
    
    // Chrome Web Store limits
    if (sizeMB > 128) {
      this.addError(`Package size (${sizeMB.toFixed(2)}MB) exceeds 128MB limit`);
    } else if (sizeMB > 50) {
      this.addWarning(`Large package size (${sizeMB.toFixed(2)}MB) - consider optimization`);
    } else {
      this.addPassed(`Package size OK: ${sizeKB.toFixed(1)}KB`);
    }

    // Check individual file sizes
    const allFiles = this.findFiles(this.tempDir, ['.js', '.html', '.css', '.json']);
    for (const file of allFiles) {
      const fileStats = fs.statSync(file);
      const fileKB = fileStats.size / 1024;
      
      if (fileKB > 1024) { // 1MB
        this.addWarning(`Large file: ${path.basename(file)} (${fileKB.toFixed(1)}KB)`);
      }
    }
  }

  async validateSecurity() {
    console.log('🔒 Validating security...');
    
    // Check CSP
    const manifestPath = path.join(this.tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.content_security_policy) {
      const csp = manifest.content_security_policy.extension_pages;
      if (!csp.includes("'self'")) {
        this.addError('CSP must include \'self\' for extension pages');
      }
      if (csp.includes("'unsafe-eval'")) {
        this.addError('CSP includes unsafe-eval - not allowed');
      }
      if (csp.includes("'unsafe-inline'")) {
        this.addWarning('CSP includes unsafe-inline - consider removing');
      }
    } else {
      this.addWarning('No Content Security Policy defined');
    }

    // Check for external resources
    const allFiles = this.findFiles(this.tempDir, ['.html', '.css', '.js']);
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file);
      
      // Check for external CDN links
      const cdnPattern = /(https?:)?\/\/[^\/]*\.(googleapis|cloudflare|jsdelivr|unpkg|cdnjs)/g;
      const cdnMatches = content.match(cdnPattern);
      if (cdnMatches) {
        this.addWarning(`External CDN resources found in ${fileName}: ${cdnMatches.join(', ')}`);
      }
    }

    this.addPassed('Security validation completed');
  }

  async generateReport() {
    console.log('\n📊 Validation Report');
    console.log('='.repeat(50));
    
    // Calculate score
    const totalChecks = this.validationResults.passed.length + 
                       this.validationResults.warnings.length + 
                       this.validationResults.errors.length;
    
    const passedWeight = 1;
    const warningWeight = 0.5;
    const errorWeight = 0;
    
    const weightedScore = (
      this.validationResults.passed.length * passedWeight +
      this.validationResults.warnings.length * warningWeight +
      this.validationResults.errors.length * errorWeight
    ) / totalChecks;
    
    this.validationResults.score = Math.round(weightedScore * 100);
    
    // Display results
    console.log(`\n✅ PASSED (${this.validationResults.passed.length})`);
    this.validationResults.passed.forEach(item => console.log(`  ✓ ${item}`));
    
    if (this.validationResults.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.validationResults.warnings.length})`);
      this.validationResults.warnings.forEach(item => console.log(`  ⚠ ${item}`));
    }
    
    if (this.validationResults.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.validationResults.errors.length})`);
      this.validationResults.errors.forEach(item => console.log(`  ✗ ${item}`));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 OVERALL SCORE: ${this.validationResults.score}%`);
    
    if (this.validationResults.errors.length === 0) {
      if (this.validationResults.score >= 90) {
        console.log('🎉 EXCELLENT - Ready for Chrome Web Store!');
      } else if (this.validationResults.score >= 75) {
        console.log('👍 GOOD - Minor issues to address');
      } else {
        console.log('⚠️  NEEDS IMPROVEMENT - Address warnings before publishing');
      }
    } else {
      console.log('🚫 FAILED - Fix errors before submitting to Chrome Web Store');
      process.exit(1);
    }
    
    // Save detailed report
    await this.saveDetailedReport();
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      package: path.basename(this.packagePath),
      score: this.validationResults.score,
      summary: {
        passed: this.validationResults.passed.length,
        warnings: this.validationResults.warnings.length,
        errors: this.validationResults.errors.length
      },
      results: this.validationResults,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '..', 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Detailed report saved: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.validationResults.errors.length > 0) {
      recommendations.push('Fix all errors before submitting to Chrome Web Store');
    }
    
    if (this.validationResults.warnings.length > 5) {
      recommendations.push('Address warnings to improve store approval chances');
    }
    
    recommendations.push('Test extension thoroughly in different browsers and scenarios');
    recommendations.push('Prepare detailed store listing with screenshots and description');
    recommendations.push('Consider creating promotional materials for better discoverability');
    
    return recommendations;
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

  addPassed(message) {
    this.validationResults.passed.push(message);
  }

  addWarning(message) {
    this.validationResults.warnings.push(message);
  }

  addError(message) {
    this.validationResults.errors.push(message);
  }

  async cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

// CLI execution
if (require.main === module) {
  const packagePath = process.argv[2];
  
  if (!packagePath) {
    console.error('Usage: node chrome-web-store-validator.js <package.zip>');
    process.exit(1);
  }
  
  const validator = new ChromeWebStoreValidator(packagePath);
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = ChromeWebStoreValidator;