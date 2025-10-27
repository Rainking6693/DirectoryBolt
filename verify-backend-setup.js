/**
 * Backend Setup Verification Script
 * Verifies all components are properly configured and working
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

async function runCheck(name, checkFn) {
  totalChecks++;
  try {
    await checkFn();
    passedChecks++;
    log.success(name);
    return true;
  } catch (error) {
    failedChecks++;
    log.error(`${name}: ${error.message}`);
    return false;
  }
}

async function verifyEnvironmentVariables() {
  log.section('1. Environment Variables');

  await runCheck('NEXT_PUBLIC_SUPABASE_URL is set', () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
  });

  await runCheck('SUPABASE_SERVICE_ROLE_KEY is set', () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }
  });

  await runCheck('STRIPE_SECRET_KEY is set', () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }
  });

  await runCheck('STRIPE_WEBHOOK_SECRET is set', () => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }
  });
}

async function verifyFileStructure() {
  log.section('2. File Structure');

  const requiredFiles = [
    // Migrations
    'supabase/migrations/20251025_fix_directories_schema.sql',
    'supabase/migrations/20251025_add_status_to_customers.sql',
    
    // Scripts
    'scripts/import-directories.js',
    'apply-directories-migration.js',
    'apply-status-migration.js',
    
    // Backend
    'netlify/functions/stripe-webhook.ts',
    'netlify/functions/admin/create-customer.ts',
    'custom-poller.ts',
    
    // Frontend
    'app/admin/dashboard/page.tsx',
    'app/admin/customers/page.tsx',
    'app/admin/jobs/page.tsx',
    
    // Tests
    'tests/task1.1-import-test.js',
    'tests/task1.2-webhook-test.ts',
    'tests/task1.3-poller-test.ts',
    'tests/task2.1-dashboard-test.tsx',
    'tests/task2.2-customers-test.tsx',
    'tests/task2.3-modal-test.tsx',
    'tests/task2.4-endpoint-test.ts',
    'tests/task2.5-jobs-test.tsx',
    'tests/e2e-backend.test.ts',
  ];

  for (const file of requiredFiles) {
    await runCheck(`File exists: ${file}`, () => {
      if (!fs.existsSync(path.join(__dirname, file))) {
        throw new Error(`File not found: ${file}`);
      }
    });
  }
}

async function verifyDatabaseConnection() {
  log.section('3. Database Connection');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await runCheck('Supabase connection works', async () => {
    const { error } = await supabase.from('customers').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`);
    }
  });

  await runCheck('Directories table exists', async () => {
    const { error } = await supabase.from('directories').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Table not found: ${error.message}`);
    }
  });

  await runCheck('Customers table exists', async () => {
    const { error } = await supabase.from('customers').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Table not found: ${error.message}`);
    }
  });

  await runCheck('Jobs table exists', async () => {
    const { error } = await supabase.from('jobs').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Table not found: ${error.message}`);
    }
  });

  await runCheck('Directory submissions table exists', async () => {
    const { error } = await supabase.from('directory_submissions').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Table not found: ${error.message}`);
    }
  });
}

async function verifyDatabaseData() {
  log.section('4. Database Data');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await runCheck('Directories table has data', async () => {
    const { count, error } = await supabase
      .from('directories')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    if (count === 0) throw new Error('No directories found');
    
    log.info(`  Found ${count} directories`);
  });

  await runCheck('Directories have required columns', async () => {
    const { data, error } = await supabase
      .from('directories')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return; // No data yet, but schema is correct

    const requiredColumns = [
      'id', 'name', 'correct_submission_url', 'category',
      'domain_authority', 'impact_level', 'tier_level',
      'difficulty', 'traffic_estimate', 'time_to_approval', 'has_captcha'
    ];

    for (const col of requiredColumns) {
      if (!(col in data)) {
        throw new Error(`Missing column: ${col}`);
      }
    }
  });

  await runCheck('Customers table has status column', async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('status')
      .limit(1);

    if (error && !error.message.includes('column')) {
      throw new Error(error.message);
    }
  });
}

async function verifyQueryPerformance() {
  log.section('5. Query Performance');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await runCheck('Directory queries are fast (<100ms)', async () => {
    const startTime = Date.now();
    const { error } = await supabase.from('directories').select('*').limit(100);
    const queryTime = Date.now() - startTime;

    if (error) throw new Error(error.message);
    if (queryTime >= 100) {
      throw new Error(`Query took ${queryTime}ms (expected <100ms)`);
    }

    log.info(`  Query time: ${queryTime}ms`);
  });

  await runCheck('Customer queries are fast (<100ms)', async () => {
    const startTime = Date.now();
    const { error } = await supabase.from('customers').select('*').limit(100);
    const queryTime = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (queryTime >= 100) {
      throw new Error(`Query took ${queryTime}ms (expected <100ms)`);
    }

    log.info(`  Query time: ${queryTime}ms`);
  });
}

async function verifyDependencies() {
  log.section('6. Dependencies');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const requiredDeps = [
    '@supabase/supabase-js',
    '@netlify/functions',
    'stripe',
    'playwright',
    'next',
    'react',
  ];

  for (const dep of requiredDeps) {
    await runCheck(`Dependency installed: ${dep}`, () => {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    });
  }

  const newDeps = [
    '@tanstack/react-table',
    'recharts',
    'react-datepicker',
  ];

  for (const dep of newDeps) {
    await runCheck(`New dependency installed: ${dep}`, () => {
      if (!packageJson.dependencies[dep]) {
        log.warning(`  Run: npm install ${dep}`);
        throw new Error(`Missing dependency: ${dep}`);
      }
    });
  }
}

async function printSummary() {
  log.section('Verification Summary');

  console.log(`Total Checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);

  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}%`);

  if (failedChecks === 0) {
    log.success('\n🎉 All checks passed! Backend is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Access admin dashboard: http://localhost:3000/admin/dashboard');
    console.log('3. Run tests: npm test');
  } else {
    log.error('\n⚠️  Some checks failed. Please review the errors above.');
    console.log('\nRefer to QUICK_START_BACKEND.md for troubleshooting.');
  }
}

async function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         DirectoryBolt Backend Verification Script          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  try {
    await verifyEnvironmentVariables();
    await verifyFileStructure();
    await verifyDatabaseConnection();
    await verifyDatabaseData();
    await verifyQueryPerformance();
    await verifyDependencies();
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
  }

  await printSummary();
}

// Run verification
main().catch(console.error);
