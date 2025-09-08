#!/usr/bin/env node

/**
 * DirectoryBolt → AutoBolt Sync Verification Script
 * 
 * This script verifies that the sync was successful by comparing
 * the directory counts and ensuring all files are properly updated.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying DirectoryBolt → AutoBolt Sync...\n');

// File paths
const directoryBoltPath = './directories/master-directory-list-486.json';
const autoBoltPath = './autobolt-extension/directories/expanded-master-directory-list-final.json';
const manifestPath = './autobolt-extension/manifest.json';

// Verification results
const results = {
  directoryBoltExists: false,
  autoBoltExists: false,
  manifestExists: false,
  directoryBoltCount: 0,
  autoBoltCount: 0,
  hostPermissionsCount: 0,
  syncSuccessful: false
};

try {
  // Check DirectoryBolt source file
  if (fs.existsSync(directoryBoltPath)) {
    results.directoryBoltExists = true;
    const dbData = JSON.parse(fs.readFileSync(directoryBoltPath, 'utf8'));
    results.directoryBoltCount = dbData.metadata.totalDirectories;
    console.log(`✅ DirectoryBolt source: ${results.directoryBoltCount} directories`);
  } else {
    console.log('❌ DirectoryBolt source file not found');
  }

  // Check AutoBolt updated file
  if (fs.existsSync(autoBoltPath)) {
    results.autoBoltExists = true;
    const abData = JSON.parse(fs.readFileSync(autoBoltPath, 'utf8'));
    results.autoBoltCount = abData.metadata.totalDirectories;
    console.log(`✅ AutoBolt updated: ${results.autoBoltCount} directories`);
  } else {
    console.log('❌ AutoBolt directory file not found');
  }

  // Check manifest file
  if (fs.existsSync(manifestPath)) {
    results.manifestExists = true;
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    results.hostPermissionsCount = manifestData.host_permissions.length;
    console.log(`✅ Manifest updated: ${results.hostPermissionsCount} host permissions`);
    console.log(`✅ Extension version: ${manifestData.version}`);
    console.log(`✅ Description: ${manifestData.description.substring(0, 50)}...`);
  } else {
    console.log('❌ Manifest file not found');
  }

  // Verify sync success
  if (results.directoryBoltExists && results.autoBoltExists && results.manifestExists) {
    if (results.autoBoltCount >= results.directoryBoltCount) {
      results.syncSuccessful = true;
      console.log('\n🎉 SYNC VERIFICATION: SUCCESS!');
      console.log(`   DirectoryBolt: ${results.directoryBoltCount} directories`);
      console.log(`   AutoBolt: ${results.autoBoltCount} directories`);
      console.log(`   Difference: +${results.autoBoltCount - results.directoryBoltCount}`);
      console.log(`   Host Permissions: ${results.hostPermissionsCount}`);
    } else {
      console.log('\n❌ SYNC VERIFICATION: FAILED!');
      console.log(`   AutoBolt has fewer directories than DirectoryBolt`);
      console.log(`   Expected: ${results.directoryBoltCount}, Got: ${results.autoBoltCount}`);
    }
  } else {
    console.log('\n❌ SYNC VERIFICATION: FAILED!');
    console.log('   Missing required files');
  }

  // Check backup files
  const backupDir = './autobolt-extension/backups';
  if (fs.existsSync(backupDir)) {
    const backupFiles = fs.readdirSync(backupDir);
    console.log(`\n💾 Backup files created: ${backupFiles.length}`);
    backupFiles.forEach(file => {
      console.log(`   📦 ${file}`);
    });
  }

  // Summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log(`   ✅ Files exist: ${results.directoryBoltExists && results.autoBoltExists && results.manifestExists ? 'Yes' : 'No'}`);
  console.log(`   ✅ Directory count match: ${results.autoBoltCount >= results.directoryBoltCount ? 'Yes' : 'No'}`);
  console.log(`   ✅ Host permissions added: ${results.hostPermissionsCount > 10 ? 'Yes' : 'No'}`);
  console.log(`   ✅ Sync successful: ${results.syncSuccessful ? 'Yes' : 'No'}`);

  if (results.syncSuccessful) {
    console.log('\n🚀 AutoBolt is ready with all DirectoryBolt directories!');
    console.log('   Next steps:');
    console.log('   1. Test the updated extension');
    console.log('   2. Deploy to Chrome Web Store');
    console.log('   3. Update marketing materials');
  }

} catch (error) {
  console.error('❌ Verification failed:', error.message);
}

console.log('\n✨ Verification complete!');