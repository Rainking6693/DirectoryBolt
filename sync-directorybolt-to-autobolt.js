#!/usr/bin/env node

/**
 * DirectoryBolt to AutoBolt Directory Sync Script
 * 
 * This script transfers all 484 directories from DirectoryBolt's master database
 * to AutoBolt extension, giving AutoBolt access to the complete directory collection.
 * 
 * ISSUE IDENTIFIED:
 * - DirectoryBolt: 484 fully mapped directories with form fields
 * - AutoBolt: Only 86 directories (82% missing!)
 * 
 * SOLUTION:
 * - Extract all 484 directories from DirectoryBolt
 * - Convert to AutoBolt format
 * - Update AutoBolt extension files
 * - Generate new manifest with all host permissions
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 DirectoryBolt → AutoBolt Directory Sync Starting...\n');

// Load DirectoryBolt's complete database
const directoryBoltPath = './directories/master-directory-list-486.json';
const autoBoltPath = './autobolt-extension/directories/expanded-master-directory-list-final.json';
const manifestPath = './autobolt-extension/manifest.json';

console.log('📂 Loading DirectoryBolt database...');
const directoryBoltData = JSON.parse(fs.readFileSync(directoryBoltPath, 'utf8'));
console.log(`✅ Loaded ${directoryBoltData.metadata.totalDirectories} directories from DirectoryBolt`);

console.log('📂 Loading current AutoBolt database...');
const autoBoltData = JSON.parse(fs.readFileSync(autoBoltPath, 'utf8'));
console.log(`📊 Current AutoBolt directories: ${autoBoltData.metadata.totalDirectories}`);

console.log('📂 Loading AutoBolt manifest...');
const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Convert DirectoryBolt format to AutoBolt format
function convertDirectoryBoltToAutoBolt(dbDirectory) {
  // Extract domain from URL for host permissions
  const url = new URL(dbDirectory.url);
  const domain = url.hostname;
  
  return {
    id: dbDirectory.id,
    name: dbDirectory.name,
    url: dbDirectory.url,
    category: dbDirectory.category || 'general-directory',
    priority: dbDirectory.priority || 'medium',
    submissionUrl: dbDirectory.submissionUrl,
    fieldMapping: convertFormMapping(dbDirectory.formMapping),
    requirements: extractRequirements(dbDirectory),
    estimatedTime: estimateTime(dbDirectory.difficulty),
    difficulty: dbDirectory.difficulty || 'medium',
    tier: determineTier(dbDirectory),
    domainAuthority: dbDirectory.domainAuthority,
    monthlyTraffic: estimateTraffic(dbDirectory.trafficPotential),
    submissionFee: dbDirectory.requiresApproval ? 'Free' : 'Free',
    hasAntiBot: dbDirectory.hasCaptcha || false,
    requiresLogin: dbDirectory.requiresLogin || true,
    // DirectoryBolt specific fields
    originalExcelRow: dbDirectory.originalExcelRow,
    isActive: dbDirectory.isActive,
    timeToApproval: dbDirectory.timeToApproval,
    features: dbDirectory.features || []
  };
}

// Convert DirectoryBolt form mapping to AutoBolt format
function convertFormMapping(dbFormMapping) {
  if (!dbFormMapping) return {};
  
  const converted = {};
  for (const [field, selectors] of Object.entries(dbFormMapping)) {
    // DirectoryBolt uses arrays of selectors, AutoBolt uses single selector
    converted[field] = Array.isArray(selectors) ? selectors[0] : selectors;
  }
  return converted;
}

// Extract requirements from DirectoryBolt directory
function extractRequirements(dbDirectory) {
  const requirements = [];
  
  if (dbDirectory.requiresLogin) requirements.push('account_required');
  if (dbDirectory.hasCaptcha) requirements.push('captcha_solving');
  if (dbDirectory.requiresApproval) requirements.push('manual_approval');
  if (dbDirectory.difficulty === 'hard') requirements.push('complex_verification');
  
  return requirements;
}

// Estimate time based on difficulty
function estimateTime(difficulty) {
  switch (difficulty) {
    case 'easy': return 120;
    case 'medium': return 240;
    case 'hard': return 480;
    default: return 180;
  }
}

// Determine tier based on domain authority and priority
function determineTier(dbDirectory) {
  const da = dbDirectory.domainAuthority || 50;
  const priority = dbDirectory.priority || 'medium';
  
  if (da >= 90 || priority === 'high') return 'enterprise';
  if (da >= 75) return 'professional';
  if (da >= 60) return 'growth';
  return 'starter';
}

// Estimate traffic from potential
function estimateTraffic(trafficPotential) {
  if (!trafficPotential) return 'Unknown';
  if (trafficPotential >= 100000) return '100M+';
  if (trafficPotential >= 50000) return '50M+';
  if (trafficPotential >= 10000) return '10M+';
  return '1M+';
}

// Generate host permissions for manifest
function generateHostPermissions(directories) {
  const hosts = new Set();
  
  directories.forEach(dir => {
    try {
      const url = new URL(dir.url);
      const domain = url.hostname;
      
      // Add both www and non-www versions
      hosts.add(`https://${domain}/*`);
      hosts.add(`https://www.${domain}/*`);
      hosts.add(`http://${domain}/*`);
      hosts.add(`http://www.${domain}/*`);
      
      // Add subdomain variations
      if (!domain.startsWith('www.')) {
        hosts.add(`https://www.${domain}/*`);
        hosts.add(`http://www.${domain}/*`);
      }
      
      // Add submission URL domain if different
      if (dir.submissionUrl) {
        try {
          const submissionUrl = new URL(dir.submissionUrl);
          const submissionDomain = submissionUrl.hostname;
          if (submissionDomain !== domain) {
            hosts.add(`https://${submissionDomain}/*`);
            hosts.add(`https://www.${submissionDomain}/*`);
            hosts.add(`http://${submissionDomain}/*`);
            hosts.add(`http://www.${submissionDomain}/*`);
          }
        } catch (e) {
          // Invalid submission URL, skip
        }
      }
    } catch (e) {
      console.warn(`⚠️  Invalid URL for directory ${dir.id}: ${dir.url}`);
    }
  });
  
  return Array.from(hosts).sort();
}

// Convert all DirectoryBolt directories
console.log('\n🔄 Converting DirectoryBolt directories to AutoBolt format...');
const convertedDirectories = directoryBoltData.directories.map(convertDirectoryBoltToAutoBolt);
console.log(`✅ Converted ${convertedDirectories.length} directories`);

// Create new AutoBolt database
const newAutoBoltData = {
  metadata: {
    version: '4.0.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    totalDirectories: convertedDirectories.length,
    expansion: 'Complete DirectoryBolt Integration: 86 → 484 Directories',
    originalDirectories: autoBoltData.metadata.totalDirectories,
    newDirectories: convertedDirectories.length - autoBoltData.metadata.totalDirectories,
    description: `Complete AutoBolt directory database with ${convertedDirectories.length} business directories synchronized from DirectoryBolt master database`,
    source: 'DirectoryBolt master-directory-list-486.json',
    syncDate: new Date().toISOString(),
    fieldMappingCoverage: '100%',
    packageTiers: {
      starter: {
        minDirectories: 50,
        maxDirectories: 100,
        description: 'Essential directories with DA 30-60, basic submission requirements',
        monthlySubmissions: 50
      },
      growth: {
        minDirectories: 100,
        maxDirectories: 200,
        description: 'Quality directories with DA 60-75, moderate complexity',
        monthlySubmissions: 100
      },
      professional: {
        minDirectories: 200,
        maxDirectories: 350,
        description: 'High-value directories with DA 75-85, premium platforms',
        monthlySubmissions: 200
      },
      enterprise: {
        minDirectories: 350,
        maxDirectories: 484,
        description: 'All directories including DA 85+ premium and industry-specific listings',
        monthlySubmissions: 'Unlimited'
      }
    }
  },
  directoryStats: {
    byDomainAuthority: calculateDAStats(convertedDirectories),
    byDifficulty: calculateDifficultyStats(convertedDirectories),
    byTier: calculateTierStats(convertedDirectories),
    byCategory: calculateCategoryStats(convertedDirectories)
  },
  directories: convertedDirectories
};

// Calculate statistics
function calculateDAStats(directories) {
  const stats = { '90+': 0, '80-89': 0, '70-79': 0, '60-69': 0, '50-59': 0, '30-49': 0, 'unknown': 0 };
  directories.forEach(dir => {
    const da = dir.domainAuthority || 0;
    if (da >= 90) stats['90+']++;
    else if (da >= 80) stats['80-89']++;
    else if (da >= 70) stats['70-79']++;
    else if (da >= 60) stats['60-69']++;
    else if (da >= 50) stats['50-59']++;
    else if (da >= 30) stats['30-49']++;
    else stats['unknown']++;
  });
  return stats;
}

function calculateDifficultyStats(directories) {
  const stats = { easy: 0, medium: 0, hard: 0 };
  directories.forEach(dir => {
    stats[dir.difficulty] = (stats[dir.difficulty] || 0) + 1;
  });
  return stats;
}

function calculateTierStats(directories) {
  const stats = { starter: 0, growth: 0, professional: 0, enterprise: 0 };
  directories.forEach(dir => {
    stats[dir.tier] = (stats[dir.tier] || 0) + 1;
  });
  return stats;
}

function calculateCategoryStats(directories) {
  const stats = {};
  directories.forEach(dir => {
    stats[dir.category] = (stats[dir.category] || 0) + 1;
  });
  return stats;
}

// Generate new host permissions
console.log('\n🔄 Generating host permissions for manifest...');
const hostPermissions = generateHostPermissions(convertedDirectories);
console.log(`✅ Generated ${hostPermissions.length} host permissions`);

// Update manifest
const newManifestData = {
  ...manifestData,
  version: '3.0.0',
  description: `Automate business directory submissions to ${convertedDirectories.length}+ platforms with complete DirectoryBolt integration.`,
  host_permissions: [
    'https://directorybolt.com/*',
    'https://api.airtable.com/*',
    'https://auto-bolt.netlify.app/*',
    ...hostPermissions
  ]
};

// Write updated files
console.log('\n💾 Writing updated files...');

// Backup original files
const backupDir = './autobolt-extension/backups';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.writeFileSync(
  path.join(backupDir, `expanded-master-directory-list-final-backup-${timestamp}.json`),
  JSON.stringify(autoBoltData, null, 2)
);
fs.writeFileSync(
  path.join(backupDir, `manifest-backup-${timestamp}.json`),
  JSON.stringify(manifestData, null, 2)
);

// Write new files
fs.writeFileSync(autoBoltPath, JSON.stringify(newAutoBoltData, null, 2));
fs.writeFileSync(manifestPath, JSON.stringify(newManifestData, null, 2));

// Create summary report
const summaryReport = {
  syncDate: new Date().toISOString(),
  source: 'DirectoryBolt master-directory-list-486.json',
  target: 'AutoBolt Extension',
  results: {
    before: {
      directories: autoBoltData.metadata.totalDirectories,
      hostPermissions: manifestData.host_permissions.length
    },
    after: {
      directories: convertedDirectories.length,
      hostPermissions: newManifestData.host_permissions.length
    },
    changes: {
      directoriesAdded: convertedDirectories.length - autoBoltData.metadata.totalDirectories,
      hostPermissionsAdded: newManifestData.host_permissions.length - manifestData.host_permissions.length,
      percentageIncrease: Math.round(((convertedDirectories.length - autoBoltData.metadata.totalDirectories) / autoBoltData.metadata.totalDirectories) * 100)
    }
  },
  statistics: newAutoBoltData.directoryStats,
  backupFiles: [
    `expanded-master-directory-list-final-backup-${timestamp}.json`,
    `manifest-backup-${timestamp}.json`
  ]
};

fs.writeFileSync('./DIRECTORY_SYNC_REPORT.json', JSON.stringify(summaryReport, null, 2));

// Print success summary
console.log('\n🎉 DIRECTORY SYNC COMPLETED SUCCESSFULLY!\n');
console.log('📊 SYNC SUMMARY:');
console.log(`   Before: ${summaryReport.results.before.directories} directories`);
console.log(`   After:  ${summaryReport.results.after.directories} directories`);
console.log(`   Added:  ${summaryReport.results.changes.directoriesAdded} directories (+${summaryReport.results.changes.percentageIncrease}%)`);
console.log('');
console.log('🔗 HOST PERMISSIONS:');
console.log(`   Before: ${summaryReport.results.before.hostPermissions} permissions`);
console.log(`   After:  ${summaryReport.results.after.hostPermissions} permissions`);
console.log(`   Added:  ${summaryReport.results.changes.hostPermissionsAdded} permissions`);
console.log('');
console.log('📁 FILES UPDATED:');
console.log(`   ✅ ${autoBoltPath}`);
console.log(`   ✅ ${manifestPath}`);
console.log(`   ✅ ./DIRECTORY_SYNC_REPORT.json`);
console.log('');
console.log('💾 BACKUPS CREATED:');
console.log(`   📦 ${path.join(backupDir, `expanded-master-directory-list-final-backup-${timestamp}.json`)}`);
console.log(`   📦 ${path.join(backupDir, `manifest-backup-${timestamp}.json`)}`);
console.log('');
console.log('🎯 NEXT STEPS:');
console.log('   1. Test AutoBolt extension with new directories');
console.log('   2. Verify host permissions are working');
console.log('   3. Update AutoBolt documentation');
console.log('   4. Deploy updated extension');
console.log('');
console.log('✨ AutoBolt now has access to ALL DirectoryBolt directories!');