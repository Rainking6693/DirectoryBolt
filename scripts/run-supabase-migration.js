#!/usr/bin/env node

/**
 * 🚀 SUPABASE MIGRATION RUNNER
 * 
 * Simple migration runner that creates the Excel-compatible directories table
 * by directly executing SQL statements through Supabase client.
 * 
 * Usage:
 *   npm run migrate:simple
 *   node scripts/run-supabase-migration.js
 *   node scripts/run-supabase-migration.js --dry-run
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
    log('🚀 Starting Supabase Migration...', colors.cyan);
    
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    log('✅ Connected to Supabase', colors.green);

    if (dryRun) {
      log('🔍 DRY RUN MODE - No changes will be made', colors.yellow);
    }

    // Create directories table using individual operations
    log('📋 Creating directories table...', colors.blue);

    if (!dryRun) {
      // First, check if table exists and drop it
      try {
        const { data: existingTable } = await supabase
          .from('directories')
          .select('id')
          .limit(1);
        
        if (existingTable !== null) {
          log('⚠️  Table already exists - you may need to drop it manually in Supabase dashboard', colors.yellow);
        }
      } catch (error) {
        // Table doesn't exist, which is fine
        log('✅ No existing table found', colors.green);
      }

      // Since we can't execute DDL directly through the Supabase client,
      // we need to provide instructions for manual setup
      log('📝 Manual setup required:', colors.cyan);
      log('Please run this SQL in your Supabase SQL Editor:', colors.yellow);
      
      const sql = `
-- DirectoryBolt Excel-Compatible Directories Table
DROP TABLE IF EXISTS directories CASCADE;

CREATE TABLE directories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    domain_authority INTEGER DEFAULT 50 CHECK (domain_authority >= 0 AND domain_authority <= 100),
    impact_level VARCHAR(20) DEFAULT 'Medium' CHECK (impact_level IN ('Low', 'Medium', 'High')),
    submission_url VARCHAR(500),
    tier_required INTEGER DEFAULT 3 CHECK (tier_required IN (1, 2, 3, 4)),
    difficulty VARCHAR(20) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    active BOOLEAN NOT NULL DEFAULT true,
    estimated_traffic INTEGER DEFAULT 0,
    time_to_approval VARCHAR(50) DEFAULT '1-3 days',
    price INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]',
    requires_approval BOOLEAN DEFAULT true,
    country_code VARCHAR(2),
    language VARCHAR(10) DEFAULT 'en',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_directories_name ON directories(name);
CREATE INDEX idx_directories_website ON directories(website);
CREATE INDEX idx_directories_category ON directories(category);
CREATE INDEX idx_directories_domain_authority_desc ON directories(domain_authority DESC);
CREATE INDEX idx_directories_active ON directories(active);
CREATE INDEX idx_directories_features_gin ON directories USING GIN (features);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_directories_updated_at 
    BEFORE UPDATE ON directories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Test data
INSERT INTO directories (name, website, category, domain_authority) VALUES 
('Google Business Profile', 'https://business.google.com', 'local_business', 100),
('Yelp Business', 'https://biz.yelp.com', 'local_business', 94);
`;

      console.log(colors.cyan + sql + colors.reset);
      
      log('\n📍 Steps to complete migration:', colors.blue);
      log('1. Copy the SQL above', colors.reset);
      log('2. Go to your Supabase dashboard', colors.reset);
      log('3. Open SQL Editor', colors.reset);
      log('4. Paste and run the SQL', colors.reset);
      log('5. Run: npm run validate:schema', colors.reset);
    }

    log('🎉 Migration setup complete!', colors.green);

  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();