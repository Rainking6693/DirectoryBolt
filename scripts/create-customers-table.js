#!/usr/bin/env node

/**
 * 🚀 CUSTOMERS TABLE MIGRATION
 * 
 * Creates the customers table in Supabase with the schema needed for the migration.
 * This script sets up the customers table structure from migration 011_create_customers_table.sql
 * 
 * Usage:
 *   node scripts/create-customers-table.js
 *   node scripts/create-customers-table.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  try {
    log('🚀 Creating Supabase Customers Table...', colors.cyan);
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log('✅ Connected to Supabase', colors.green);

    if (dryRun) {
      log('🔍 DRY RUN MODE - No changes will be made', colors.yellow);
    }

    // Check if customers table exists
    log('📋 Checking if customers table exists...', colors.blue);

    try {
      const { data: existingTable } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (existingTable !== null) {
        log('✅ Customers table already exists!', colors.green);
        log('📊 Testing with a sample query...', colors.blue);
        
        // Test the table structure
        const { count, error } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          log(`⚠️  Table exists but has issues: ${error.message}`, colors.yellow);
        } else {
          log(`✅ Table is working correctly. Current customer count: ${count || 0}`, colors.green);
          return;
        }
      }
    } catch (error) {
      log('ℹ️  Customers table does not exist yet. Creating...', colors.blue);
    }

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', '011_create_customers_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    log('📝 Migration SQL loaded from: migrations/011_create_customers_table.sql', colors.blue);

    if (!dryRun) {
      log('⚠️  Since Supabase client cannot execute DDL directly, please manually run this SQL:', colors.yellow);
      log('📍 Steps to complete setup:', colors.blue);
      log('1. Copy the SQL below', colors.reset);
      log('2. Go to your Supabase dashboard > SQL Editor', colors.reset);
      log('3. Paste and run the SQL', colors.reset);
      log('4. Run this script again to verify', colors.reset);
      
      console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset);
      console.log(colors.cyan + 'CUSTOMERS TABLE MIGRATION SQL:' + colors.reset);
      console.log(colors.cyan + '='.repeat(80) + colors.reset);
      console.log(migrationSQL);
      console.log(colors.cyan + '='.repeat(80) + colors.reset + '\n');
      
      log('🔗 Direct link to Supabase SQL Editor:', colors.blue);
      log(`   ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql`, colors.cyan);
    } else {
      log('📄 Migration SQL preview (first 500 characters):', colors.blue);
      console.log(colors.cyan + migrationSQL.substring(0, 500) + '...' + colors.reset);
    }

    log('🎉 Migration setup instructions provided!', colors.green);

  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, colors.red);
    console.error('Full error:', error);
    process.exit(1);
  }
}

main();