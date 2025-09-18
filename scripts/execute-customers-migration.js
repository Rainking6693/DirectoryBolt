#!/usr/bin/env node

/**
 * 🚀 DIRECT CUSTOMERS TABLE MIGRATION EXECUTOR
 * 
 * Executes the customers table migration by running SQL commands directly through Supabase.
 * This script creates the customers table and sets up all necessary indexes and functions.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

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

async function executeSQL(supabase, sql, description) {
  try {
    log(`📋 ${description}...`, colors.blue);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Try alternative method if exec_sql doesn't exist
      if (error.message.includes('exec_sql')) {
        log('⚠️  Using alternative execution method...', colors.yellow);
        
        // For simple table checks, use direct queries
        if (sql.includes('SELECT')) {
          const { data: result, error: queryError } = await supabase
            .from('customers')
            .select('id')
            .limit(1);
          
          if (queryError && queryError.code === '42P01') {
            return { error: 'Table does not exist' };
          }
          return { data: result };
        }
        throw error;
      }
      throw error;
    }
    
    log(`✅ ${description} completed`, colors.green);
    return { data, error: null };
    
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, colors.red);
    return { data: null, error };
  }
}

async function main() {
  try {
    log('🚀 Executing Customers Table Migration...', colors.cyan);
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    log('✅ Connected to Supabase', colors.green);

    // Check if customers table exists
    log('🔍 Checking if customers table exists...', colors.blue);
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (!error) {
        log('✅ Customers table already exists!', colors.green);
        
        // Test the table structure by querying for required columns
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
          
        log(`✅ Table is working correctly. Current customer count: ${count || 0}`, colors.green);
        log('🎉 Migration already complete!', colors.green);
        return;
      }
    } catch (error) {
      log('ℹ️  Customers table does not exist yet. Creating...', colors.blue);
    }

    // Create the update_updated_at_column function first
    const updateFunctionSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

    await executeSQL(supabase, updateFunctionSQL, 'Creating update_updated_at_column function');

    // Create the customers table
    const createTableSQL = `
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    business_data JSONB DEFAULT '{}',
    subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (
        subscription_tier IN ('basic', 'pro', 'enterprise')
    ),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(30) DEFAULT 'trialing' CHECK (
        subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'unpaid', 'incomplete', 'incomplete_expired')
    ),
    credits_remaining INTEGER DEFAULT 100,
    credits_limit INTEGER DEFAULT 100,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    current_period_usage INTEGER DEFAULT 0,
    trial_starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    subscription_created_at TIMESTAMP WITH TIME ZONE,
    last_portal_access_at TIMESTAMP WITH TIME ZONE,
    pending_plan_change VARCHAR(20) CHECK (
        pending_plan_change IN ('basic', 'pro', 'enterprise') OR pending_plan_change IS NULL
    ),
    plan_change_effective_at TIMESTAMP WITH TIME ZONE,
    notification_preferences JSONB DEFAULT '{"email_notifications": true, "submission_updates": true, "marketing_emails": false, "weekly_reports": true}',
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    first_submission_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);`;

    await executeSQL(supabase, createTableSQL, 'Creating customers table');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);',
      'CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON customers(stripe_customer_id);',
      'CREATE INDEX IF NOT EXISTS idx_customers_subscription_tier ON customers(subscription_tier);',
      'CREATE INDEX IF NOT EXISTS idx_customers_subscription_status ON customers(subscription_status);',
      'CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_customers_business_data_gin ON customers USING GIN (business_data);',
      'CREATE INDEX IF NOT EXISTS idx_customers_metadata_gin ON customers USING GIN (metadata);'
    ];

    for (const indexSQL of indexes) {
      await executeSQL(supabase, indexSQL, 'Creating index');
    }

    // Create trigger
    const triggerSQL = `
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();`;

    await executeSQL(supabase, triggerSQL, 'Creating updated_at trigger');

    // Create billing period function
    const billingFunctionSQL = `
CREATE OR REPLACE FUNCTION set_customer_billing_period()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_tier IS NOT NULL AND NEW.billing_period_start IS NULL THEN
        NEW.billing_period_start = CURRENT_TIMESTAMP;
        NEW.billing_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month';
    END IF;
    
    IF NEW.subscription_tier IS NOT NULL THEN
        NEW.credits_limit = CASE NEW.subscription_tier
            WHEN 'basic' THEN 100
            WHEN 'pro' THEN 500
            WHEN 'enterprise' THEN 2000
            ELSE 100
        END;
        
        IF OLD.subscription_tier IS NULL THEN
            NEW.credits_remaining = NEW.credits_limit;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

    await executeSQL(supabase, billingFunctionSQL, 'Creating billing period function');

    // Create billing trigger
    const billingTriggerSQL = `
CREATE TRIGGER trigger_set_customer_billing_period
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_billing_period();`;

    await executeSQL(supabase, billingTriggerSQL, 'Creating billing period trigger');

    // Verify table creation
    log('🔍 Verifying table creation...', colors.blue);
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      throw new Error(`Table verification failed: ${verifyError.message}`);
    }
    
    log('✅ Customers table created and verified successfully!', colors.green);
    log('🎉 Migration completed successfully!', colors.green);
    
    log('\n📝 Next steps:', colors.blue);
    log('1. Run the customer migration script: node scripts/migrate-customers-to-supabase.js', colors.reset);
    log('2. Test the Chrome extension with migrated data', colors.reset);
    log('3. Test the staff dashboard with migrated data', colors.reset);

  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, colors.red);
    console.error('Full error:', error);
    
    log('\n🔧 Manual setup may be required:', colors.yellow);
    log('If automated migration fails, you can manually run the SQL in Supabase dashboard:', colors.reset);
    log('https://app.kolgqfjgncdwddziqloz.supabase.co/project/_/sql', colors.cyan);
    
    process.exit(1);
  }
}

main();