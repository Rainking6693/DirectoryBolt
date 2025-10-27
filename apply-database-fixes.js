/**
 * Apply Database Schema Fixes
 * Automatically applies all fixes identified by the verification script
 */

const { Client } = require('pg');
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

async function applyFixes() {
  log.section('DirectoryBolt Database Schema Fixes');

  // Parse Supabase connection string
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://postgres:${process.env.SUPABASE_PASSWORD || 'Chartres6693!23$'}@${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    log.info('Connecting to Supabase database...');
    await client.connect();
    log.success('Connected successfully\n');

    // Fix #1: Add UUID id to customers table
    log.section('Fix #1: Adding UUID id column to customers table');
    
    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();
    `);
    log.success('Added id column');

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'customers_id_unique' 
          AND conrelid = 'customers'::regclass
        ) THEN
          ALTER TABLE customers ADD CONSTRAINT customers_id_unique UNIQUE (id);
        END IF;
      END $$;
    `);
    log.success('Added unique constraint on id');

    // Fix #2: Add correct_submission_url alias
    log.section('Fix #2: Adding correct_submission_url alias to directories');

    await client.query(`
      ALTER TABLE directories 
      ADD COLUMN IF NOT EXISTS correct_submission_url text;
    `);
    log.success('Added correct_submission_url column');

    const updateResult = await client.query(`
      UPDATE directories 
      SET correct_submission_url = submission_url 
      WHERE correct_submission_url IS NULL;
    `);
    log.success(`Updated ${updateResult.rowCount} rows with submission URLs`);

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'directories_correct_submission_url_key' 
          AND conrelid = 'directories'::regclass
        ) THEN
          ALTER TABLE directories 
          ADD CONSTRAINT directories_correct_submission_url_key 
          UNIQUE (correct_submission_url);
        END IF;
      END $$;
    `);
    log.success('Added unique constraint on correct_submission_url');

    // Fix #3: Add status column to customers
    log.section('Fix #3: Adding status column to customers');

    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
      CHECK (status IN ('active', 'inactive', 'suspended'));
    `);
    log.success('Added status column');

    const statusUpdateResult = await client.query(`
      UPDATE customers 
      SET status = 'active' 
      WHERE status IS NULL;
    `);
    log.success(`Updated ${statusUpdateResult.rowCount} customers with active status`);

    // Fix #4: Add Stripe columns
    log.section('Fix #4: Adding Stripe integration columns');

    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS stripe_customer_id text,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
      ADD COLUMN IF NOT EXISTS subscription_status text;
    `);
    log.success('Added Stripe columns');

    // Fix #5: Create performance indexes
    log.section('Fix #5: Creating performance indexes');

    const indexes = [
      // Directories
      'CREATE INDEX IF NOT EXISTS idx_directories_id ON directories (id)',
      'CREATE INDEX IF NOT EXISTS idx_directories_name ON directories (name)',
      'CREATE INDEX IF NOT EXISTS idx_directories_submission_url ON directories (submission_url)',
      'CREATE INDEX IF NOT EXISTS idx_directories_correct_submission_url ON directories (correct_submission_url)',
      'CREATE INDEX IF NOT EXISTS idx_directories_category ON directories (category)',
      'CREATE INDEX IF NOT EXISTS idx_directories_active ON directories (active)',
      
      // Customers
      'CREATE INDEX IF NOT EXISTS idx_customers_id ON customers (id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers (business_name)',
      'CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status)',
      'CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC)',
      
      // Jobs
      'CREATE INDEX IF NOT EXISTS idx_jobs_id ON jobs (id)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs (customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC)',
      
      // Directory Submissions
      'CREATE INDEX IF NOT EXISTS idx_directory_submissions_id ON directory_submissions (id)',
      'CREATE INDEX IF NOT EXISTS idx_directory_submissions_job_id ON directory_submissions (job_id)',
      'CREATE INDEX IF NOT EXISTS idx_directory_submissions_status ON directory_submissions (status)',
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    log.success(`Created ${indexes.length} indexes`);

    // Fix #6: Analyze tables
    log.section('Fix #6: Optimizing tables');

    await client.query('ANALYZE directories');
    await client.query('ANALYZE customers');
    await client.query('ANALYZE jobs');
    await client.query('ANALYZE directory_submissions');
    log.success('Analyzed all tables');

    await client.query('VACUUM ANALYZE directories');
    await client.query('VACUUM ANALYZE customers');
    await client.query('VACUUM ANALYZE jobs');
    await client.query('VACUUM ANALYZE directory_submissions');
    log.success('Vacuumed all tables');

    // Verification
    log.section('Verification');

    // Check customers table
    const customersCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('id', 'status', 'stripe_customer_id')
    `);
    log.info(`Customers table has ${customersCheck.rows.length}/3 required columns`);

    // Check directories table
    const directoriesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'directories' 
      AND column_name = 'correct_submission_url'
    `);
    log.info(`Directories table has correct_submission_url: ${directoriesCheck.rows.length > 0 ? 'Yes' : 'No'}`);

    // Check indexes
    const indexCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename IN ('directories', 'customers', 'jobs', 'directory_submissions')
    `);
    log.info(`Total indexes created: ${indexCount.rows[0].count}`);

    // Check row counts
    const counts = await client.query(`
      SELECT 
        'directories' as table_name, 
        COUNT(*) as row_count 
      FROM directories
      UNION ALL
      SELECT 
        'customers' as table_name, 
        COUNT(*) as row_count 
      FROM customers
      UNION ALL
      SELECT 
        'jobs' as table_name, 
        COUNT(*) as row_count 
      FROM jobs
      UNION ALL
      SELECT 
        'directory_submissions' as table_name, 
        COUNT(*) as row_count 
      FROM directory_submissions
    `);

    console.log('\nTable Row Counts:');
    console.table(counts.rows);

    log.section('✨ All fixes applied successfully!');
    log.success('Database schema is now up to date');
    log.info('Next step: Run "node verify-backend-setup.js" to confirm');

  } catch (error) {
    log.error(`Failed to apply fixes: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    log.info('Database connection closed');
  }
}

// Run fixes
applyFixes();
