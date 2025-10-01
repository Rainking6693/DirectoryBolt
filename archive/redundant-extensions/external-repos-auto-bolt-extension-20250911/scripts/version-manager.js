#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Auto-Bolt Version Management System
 * Handles semantic versioning and auto-update functionality
 */

class VersionManager {
  constructor() {
    this.manifestPath = path.join(__dirname, '..', 'manifest.json');
    this.packagePath = path.join(__dirname, '..', 'backend', 'package.json');
    this.versionHistoryPath = path.join(__dirname, '..', 'version-history.json');
  }

  async updateVersion(type = 'patch') {
    try {
      console.log(`🔄 Updating version (${type})...`);
      
      const currentVersion = this.getCurrentVersion();
      const newVersion = this.incrementVersion(currentVersion, type);
      
      await this.updateManifest(newVersion);
      await this.updatePackageJson(newVersion);
      await this.recordVersionHistory(currentVersion, newVersion, type);
      
      console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);
      return newVersion;
    } catch (error) {
      console.error('❌ Version update failed:', error.message);
      process.exit(1);
    }
  }

  getCurrentVersion() {
    const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    return manifest.version;
  }

  incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${parts[0] + 1}.0.0`;
      case 'minor':
        return `${parts[0]}.${parts[1] + 1}.0`;
      case 'patch':
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      default:
        throw new Error(`Invalid version type: ${type}`);
    }
  }

  async updateManifest(newVersion) {
    const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    manifest.version = newVersion;
    
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📝 Updated manifest.json to ${newVersion}`);
  }

  async updatePackageJson(newVersion) {
    if (fs.existsSync(this.packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      packageJson.version = newVersion;
      
      fs.writeFileSync(this.packagePath, JSON.stringify(packageJson, null, 2));
      console.log(`📝 Updated package.json to ${newVersion}`);
    }
  }

  async recordVersionHistory(oldVersion, newVersion, type) {
    let history = [];
    
    if (fs.existsSync(this.versionHistoryPath)) {
      history = JSON.parse(fs.readFileSync(this.versionHistoryPath, 'utf8'));
    }
    
    const entry = {
      version: newVersion,
      previousVersion: oldVersion,
      type: type,
      date: new Date().toISOString(),
      changes: [],
      breaking: type === 'major',
      features: type === 'minor' ? [] : undefined,
      fixes: type === 'patch' ? [] : undefined
    };
    
    history.unshift(entry);
    
    // Keep last 50 entries
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    fs.writeFileSync(this.versionHistoryPath, JSON.stringify(history, null, 2));
    console.log(`📚 Recorded version history entry`);
  }

  async generateUpdateManifest() {
    console.log('📦 Generating update manifest...');
    
    const currentVersion = this.getCurrentVersion();
    const history = this.getVersionHistory();
    
    const updateManifest = {
      version: currentVersion,
      updateUrl: 'https://auto-bolt.netlify.app/api/updates',
      minChromiumVersion: '88.0.0.0',
      updateInfo: {
        releaseDate: new Date().toISOString(),
        downloadUrl: `https://auto-bolt.netlify.app/downloads/auto-bolt-v${currentVersion}.zip`,
        changelog: this.getChangelog(5), // Last 5 versions
        criticalUpdate: false,
        rolloutPercentage: 100
      }
    };
    
    const updateManifestPath = path.join(__dirname, '..', 'backend', 'dist', 'update-manifest.json');
    fs.writeFileSync(updateManifestPath, JSON.stringify(updateManifest, null, 2));
    
    console.log('✅ Update manifest generated');
    return updateManifest;
  }

  getVersionHistory() {
    if (fs.existsSync(this.versionHistoryPath)) {
      return JSON.parse(fs.readFileSync(this.versionHistoryPath, 'utf8'));
    }
    return [];
  }

  getChangelog(count = 10) {
    const history = this.getVersionHistory();
    return history.slice(0, count).map(entry => ({
      version: entry.version,
      date: entry.date,
      type: entry.type,
      changes: entry.changes || [],
      breaking: entry.breaking || false
    }));
  }

  async validateVersion(version) {
    // Semantic version validation
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
    if (!semverRegex.test(version)) {
      throw new Error('Invalid semantic version format');
    }
    
    // Check if version is higher than current
    const current = this.getCurrentVersion();
    if (this.compareVersions(version, current) <= 0) {
      throw new Error('New version must be higher than current version');
    }
    
    return true;
  }

  compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (aParts[i] > bParts[i]) return 1;
      if (aParts[i] < bParts[i]) return -1;
    }
    
    return 0;
  }

  async createReleaseNotes(version) {
    console.log(`📝 Creating release notes for v${version}...`);
    
    const history = this.getVersionHistory();
    const currentRelease = history.find(h => h.version === version);
    
    if (!currentRelease) {
      throw new Error('Version not found in history');
    }
    
    const releaseNotes = {
      version: version,
      title: `Auto-Bolt v${version}`,
      date: currentRelease.date,
      type: currentRelease.type,
      description: this.generateReleaseDescription(currentRelease),
      features: currentRelease.features || [],
      fixes: currentRelease.fixes || [],
      changes: currentRelease.changes || [],
      breaking: currentRelease.breaking || false,
      downloadUrl: `https://auto-bolt.netlify.app/downloads/auto-bolt-v${version}.zip`,
      installGuide: 'https://auto-bolt.netlify.app/docs/installation'
    };
    
    const releaseNotesPath = path.join(__dirname, '..', 'releases', `v${version}.json`);
    const releaseDir = path.dirname(releaseNotesPath);
    
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }
    
    fs.writeFileSync(releaseNotesPath, JSON.stringify(releaseNotes, null, 2));
    
    console.log(`✅ Release notes created: ${releaseNotesPath}`);
    return releaseNotes;
  }

  generateReleaseDescription(release) {
    const descriptions = {
      major: 'Major release with significant new features and improvements.',
      minor: 'Feature release with new capabilities and enhancements.',
      patch: 'Bug fix release with stability improvements.'
    };
    
    return descriptions[release.type] || 'Release with various improvements.';
  }

  async addChangelogEntry(version, changes) {
    console.log(`📝 Adding changelog entry for v${version}...`);
    
    const history = this.getVersionHistory();
    const versionEntry = history.find(h => h.version === version);
    
    if (!versionEntry) {
      throw new Error('Version not found in history');
    }
    
    versionEntry.changes = Array.isArray(changes) ? changes : [changes];
    
    fs.writeFileSync(this.versionHistoryPath, JSON.stringify(history, null, 2));
    console.log('✅ Changelog entry added');
  }

  async generateAutoUpdateCode() {
    console.log('🔄 Generating auto-update code...');
    
    const autoUpdateCode = `
/**
 * Auto-Bolt Extension Auto-Update System
 * Handles version checking and update notifications
 */

class AutoUpdater {
  constructor() {
    this.updateUrl = 'https://auto-bolt.netlify.app/api/updates';
    this.currentVersion = chrome.runtime.getManifest().version;
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  async checkForUpdates() {
    try {
      const response = await fetch(this.updateUrl);
      const updateInfo = await response.json();
      
      if (this.compareVersions(updateInfo.version, this.currentVersion) > 0) {
        this.notifyUpdate(updateInfo);
        return updateInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Update check failed:', error);
      return null;
    }
  }

  compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (aParts[i] > bParts[i]) return 1;
      if (aParts[i] < bParts[i]) return -1;
    }
    
    return 0;
  }

  notifyUpdate(updateInfo) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Auto-Bolt Update Available',
      message: \`Version \${updateInfo.version} is available. Click to update.\`,
      buttons: [{ title: 'Update Now' }, { title: 'Later' }]
    });
  }

  startPeriodicCheck() {
    setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
    
    // Check immediately on startup
    this.checkForUpdates();
  }
}

// Initialize auto-updater
const autoUpdater = new AutoUpdater();
autoUpdater.startPeriodicCheck();
`;
    
    const autoUpdatePath = path.join(__dirname, '..', 'auto-updater.js');
    fs.writeFileSync(autoUpdatePath, autoUpdateCode);
    
    console.log('✅ Auto-update code generated');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const versionManager = new VersionManager();

  switch (command) {
    case 'update':
      const type = args[1] || 'patch';
      versionManager.updateVersion(type);
      break;
      
    case 'manifest':
      versionManager.generateUpdateManifest();
      break;
      
    case 'notes':
      const version = args[1] || versionManager.getCurrentVersion();
      versionManager.createReleaseNotes(version);
      break;
      
    case 'changelog':
      const changelogVersion = args[1];
      const changes = args.slice(2);
      if (changelogVersion && changes.length > 0) {
        versionManager.addChangelogEntry(changelogVersion, changes);
      } else {
        console.log('Usage: version-manager changelog <version> <change1> [change2] ...');
      }
      break;
      
    case 'auto-update':
      versionManager.generateAutoUpdateCode();
      break;
      
    case 'current':
      console.log(versionManager.getCurrentVersion());
      break;
      
    default:
      console.log(`
Auto-Bolt Version Manager

Usage:
  node version-manager.js update [major|minor|patch]  Update version
  node version-manager.js manifest                    Generate update manifest
  node version-manager.js notes [version]             Create release notes
  node version-manager.js changelog <ver> <changes>   Add changelog entry
  node version-manager.js auto-update                 Generate auto-update code
  node version-manager.js current                     Show current version
`);
      break;
  }
}

module.exports = VersionManager;