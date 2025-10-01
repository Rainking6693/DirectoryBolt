#!/usr/bin/env node
/**
 * Ensure No Netlify State Guard
 * Prevents .netlify directories from being committed to the repository
 * Only fails if .netlify directories are TRACKED by git (not just present locally)
 */

const { execSync } = require('child_process');

console.log('🔍 Checking for committed .netlify state...\n');

try {
  // Check if any .netlify paths are tracked by git
  const trackedFiles = execSync('git ls-files', { encoding: 'utf8' });
  const netlifyFiles = trackedFiles
    .split('\n')
    .filter(f => f.includes('.netlify/') || f === '.netlify');
  
  if (netlifyFiles.length > 0) {
    console.error('❌ Found tracked .netlify files in git (should NOT be committed):');
    console.error('');
    for (const f of netlifyFiles) {
      console.error(`   ✖ ${f}`);
    }
    console.error('');
    console.error('These files should be removed from git tracking:');
    console.error('Run: git rm -r --cached .netlify');
    console.error('');
    process.exit(1);
  }
  
  console.log('✅ No committed .netlify state detected');
  console.log('   (Local .netlify directories are OK - they are gitignored)\n');
  
} catch (error) {
  // If git command fails, assume we're not in a git repo or git is not available
  console.warn('⚠️  Could not check git status (git may not be available)');
  console.log('   Skipping .netlify state check\n');
}

