#!/usr/bin/env node

/**
 * 🚀 DIRECTORY DATABASE SEEDING SCRIPT
 * 
 * This script populates the DirectoryBolt database with 500+ high-value directories
 * organized by subscription tiers with domain authority and difficulty ratings.
 * 
 * Usage:
 *   npm run seed:directories
 *   node scripts/seed-directories.js --action=seed
 *   node scripts/seed-directories.js --action=validate --dry-run
 *   node scripts/seed-directories.js --action=reset --drop-existing
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for database access
 *   ADMIN_SEED_KEY - Admin key for seeding operations (optional in dev)
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

// Default configuration
const config = {
  action: options.action || 'seed',
  dryRun: options['dry-run'] || false,
  dropExisting: options['drop-existing'] || false,
  validateData: options['validate-data'] !== 'false',
  batchSize: parseInt(options['batch-size']) || 50,
  host: options.host || 'localhost:3000',
  secure: options.secure !== 'false'
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logProgress(message) {
  log(`🔄 ${message}`, colors.cyan);
}

function validateEnvironment() {
  logInfo('Validating environment variables...');
  
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  if (!process.env.ADMIN_SEED_KEY && process.env.NODE_ENV === 'production') {
    logWarning('ADMIN_SEED_KEY not set. This may cause authorization issues in production.');
  }
  
  logSuccess('Environment validation passed');
}

function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host.split(':')[0],
      port: config.host.split(':')[1] || (config.secure ? 443 : 80),
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Seeding-Script/1.0.0',
        ...(process.env.ADMIN_SEED_KEY && {
          'Authorization': `Bearer ${process.env.ADMIN_SEED_KEY}`
        })
      }
    };

    const protocol = config.secure ? https : require('http');
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runSeeding() {
  try {
    logInfo(`Starting directory seeding with action: ${config.action}`);
    logInfo(`Configuration: ${JSON.stringify(config, null, 2)}`);
    
    const requestData = {
      action: config.action,
      options: {
        dropExisting: config.dropExisting,
        validateData: config.validateData,
        batchSize: config.batchSize,
        dryRun: config.dryRun
      },
      adminKey: process.env.ADMIN_SEED_KEY
    };

    logProgress('Sending request to seeding API...');
    const response = await makeRequest('/api/directories/seed', requestData);

    if (response.status === 200 && response.data.success) {
      logSuccess(`✨ ${response.data.message}`);
      
      if (response.data.stats) {
        logInfo('📊 Database Statistics:');
        console.log(JSON.stringify(response.data.stats, null, 2));
      }
      
      if (response.data.data) {
        logInfo('📋 Operation Details:');
        console.log(JSON.stringify(response.data.data, null, 2));
      }
      
    } else {
      logError(`Request failed with status ${response.status}`);
      
      if (response.data.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach(error => logError(`  • ${error}`));
      }
      
      if (response.data.message) {
        logError(`Message: ${response.data.message}`);
      }
      
      process.exit(1);
    }

  } catch (error) {
    logError(`Seeding failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      logError('Could not connect to the application server.');
      logError('Make sure the Next.js development server is running:');
      logError('  npm run dev');
    }
    
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
${colors.cyan}DirectoryBolt Database Seeding Script${colors.reset}

${colors.white}USAGE:${colors.reset}
  node scripts/seed-directories.js [options]

${colors.white}ACTIONS:${colors.reset}
  --action=validate     Validate seed data without making changes
  --action=seed         Populate database with directory data (default)
  --action=stats        Show current database statistics
  --action=reset        Drop existing data and reseed

${colors.white}OPTIONS:${colors.reset}
  --dry-run             Validate operation without making database changes
  --drop-existing       Drop existing directories table before seeding
  --validate-data       Validate seed data before insertion (default: true)
  --batch-size=N        Insert records in batches of N (default: 50)
  --host=HOST:PORT      Target host for API requests (default: localhost:3000)
  --secure=false        Use HTTP instead of HTTPS
  --help                Show this help message

${colors.white}EXAMPLES:${colors.reset}
  ${colors.green}# Validate seed data${colors.reset}
  node scripts/seed-directories.js --action=validate --dry-run

  ${colors.green}# Populate database${colors.reset}
  node scripts/seed-directories.js --action=seed

  ${colors.green}# Reset and reseed database${colors.reset}
  node scripts/seed-directories.js --action=reset --drop-existing

  ${colors.green}# Get statistics${colors.reset}
  node scripts/seed-directories.js --action=stats

${colors.white}ENVIRONMENT VARIABLES:${colors.reset}
  ${colors.yellow}SUPABASE_URL${colors.reset}             Your Supabase project URL (required)
  ${colors.yellow}SUPABASE_SERVICE_ROLE_KEY${colors.reset} Service role key for database access (required)
  ${colors.yellow}ADMIN_SEED_KEY${colors.reset}           Admin key for seeding operations (optional in dev)

${colors.white}DIRECTORY DATA:${colors.reset}
  This script will populate your database with 500+ high-value directories including:
  • Tier 1 (Starter): Product Hunt, Crunchbase, G2.com, Google Business Profile
  • Tier 2 (Growth): AlternativeTo, Hacker News, SourceForge, AngelList
  • Tier 3 (Pro): TechCrunch, Inc.com, Forbes, VentureBeat
  • Tier 4 (Enterprise): NASDAQ, Wall Street Journal, Fortune, Harvard Business Review
  • Plus many more across all categories and industries

${colors.cyan}For more information, visit: https://github.com/your-repo/DirectoryBolt${colors.reset}
`);
}

async function main() {
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log(`
${colors.magenta}╔══════════════════════════════════════════╗
║           DirectoryBolt Seeder           ║
║     Database Population Script v1.0     ║
╚══════════════════════════════════════════╝${colors.reset}
`);

  // Validate environment
  validateEnvironment();

  // Show configuration
  logInfo('Script Configuration:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`  ${key}: ${colors.yellow}${value}${colors.reset}`);
  });
  console.log();

  // Confirm destructive operations
  if (config.action === 'reset' || config.dropExisting) {
    logWarning('This operation will DROP existing directory data!');
    
    if (!config.dryRun) {
      logWarning('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Run the seeding operation
  await runSeeding();

  logSuccess('🎉 Directory seeding script completed successfully!');
  
  if (config.action === 'seed' && !config.dryRun) {
    logInfo('Next steps:');
    console.log('  • Test the API: GET /api/directories');
    console.log('  • View directories in your admin dashboard');
    console.log('  • Verify database performance with large dataset');
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  config,
  validateEnvironment,
  makeRequest,
  runSeeding
};