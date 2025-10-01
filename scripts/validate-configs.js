#!/usr/bin/env node
/**
 * Config Validation Script
 * Validates all JSON and TOML configuration files before build
 */

const fs = require('fs');
const path = require('path');

// Try to load TOML parser
let TOML = null;
try {
  TOML = require('@iarna/toml');
} catch (e) {
  // TOML parser not installed, will warn later
}

/**
 * Recursively walk directory tree
 */
function* walk(dir) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      
      // Skip node_modules, .next, and other build directories
      if (entry.isDirectory()) {
        if (/(^|\\|\/)node_modules(\\|\/|$)|(^|\\|\/)\\.next(\\|\/|$)|(^|\\|\/)out(\\|\/|$)/.test(p)) {
          continue;
        }
        yield* walk(p);
      } else {
        yield p;
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }
}

/**
 * Check if file should be excluded from validation
 */
function isExcluded(filePath) {
  return /node_modules|\\.next|out|package-lock\\.json|\\.netlify|archive|audit-report\.json/.test(filePath);
}

let hadError = false;
let validatedCount = 0;

console.log('🔍 Validating configuration files...\n');

// Validate JSON files
const jsonFiles = [];
for (const f of walk(process.cwd())) {
  if (!f.endsWith('.json') || isExcluded(f)) continue;
  jsonFiles.push(f);
}

console.log(`📄 Found ${jsonFiles.length} JSON files to validate\n`);

for (const f of jsonFiles) {
  try {
    const txt = fs.readFileSync(f, 'utf8');
    
    // Check for truncated JSON (common sign of corruption)
    if (txt.trim().endsWith(',') || txt.trim().endsWith('{') || txt.trim().endsWith('[')) {
      console.error(`✖ Truncated JSON: ${path.relative(process.cwd(), f)}`);
      console.error(`  File appears to be incomplete or corrupted`);
      hadError = true;
      continue;
    }
    
    JSON.parse(txt);
    validatedCount++;
  } catch (e) {
    const relativePath = path.relative(process.cwd(), f);
    console.error(`✖ Invalid JSON: ${relativePath}`);
    console.error(`  ${e.message}`);
    
    // Show first few characters for debugging
    const preview = fs.readFileSync(f, 'utf8').substring(0, 100).replace(/\n/g, '\\n');
    console.error(`  Preview: ${preview}...`);
    
    hadError = true;
  }
}

// Validate netlify.toml
const netlifyToml = path.join(process.cwd(), 'netlify.toml');
if (fs.existsSync(netlifyToml)) {
  if (!TOML) {
    console.warn('⚠️  TOML validator not installed (@iarna/toml)');
    console.warn('   Run: npm install --save-dev @iarna/toml');
    console.warn('   Skipping netlify.toml validation\n');
  } else {
    try {
      const txt = fs.readFileSync(netlifyToml, 'utf8');
      TOML.parse(txt);
      console.log(`✓ netlify.toml is valid TOML`);
      validatedCount++;
    } catch (e) {
      console.error(`✖ Invalid TOML: netlify.toml`);
      console.error(`  ${e.message}`);
      hadError = true;
    }
  }
}

console.log('');

if (hadError) {
  console.error('❌ Config validation failed');
  console.error('   Fix the errors above before building\n');
  process.exit(1);
}

console.log(`✅ Config validation passed (${validatedCount} files validated)\n`);

