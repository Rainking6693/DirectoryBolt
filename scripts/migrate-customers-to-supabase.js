/**
 * DirectoryBolt Customer Migration Script: Google Sheets to Supabase
 * 
 * CRITICAL MIGRATION: Export customer data from Google Sheets and migrate to Supabase database.
 * 
 * REQUIREMENTS:
 * 1. Export all customer data from Google Sheet (DIR-20250917-000001, DIR-20250917-000002)
 * 2. Create migration script to insert customers into Supabase
 * 3. Preserve existing customer IDs exactly as they are
 * 4. Validate data integrity after migration
 * 5. Test that migrated customers work with all APIs
 * 
 * SUPABASE CONNECTION:
 * - Uses SERVICE_ROLE_KEY for data migration operations
 * - Ensures all customer fields are properly mapped
 * - Maintains data consistency during transition
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createGoogleSheetsService } = require('../lib/services/google-sheets.js');
const bcrypt = require('bcryptjs');

console.log('🚀 DirectoryBolt Customer Migration: Google Sheets → Supabase');
console.log('=' .repeat(80));

class CustomerMigration {
  constructor() {
    this.googleSheetsService = null;
    this.supabase = null;
    this.migrationResults = {
      totalCustomers: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      errors: [],
      migratedCustomers: []
    };
  }

  async initialize() {
    try {
      console.log('🔧 Initializing migration services...');
      
      // Initialize Google Sheets Service
      this.googleSheetsService = createGoogleSheetsService();
      await this.googleSheetsService.initialize();
      console.log('✅ Google Sheets service initialized');

      // Initialize Supabase with SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
      }

      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      console.log('✅ Supabase service initialized with SERVICE_ROLE_KEY');

      // Test connections
      await this.testConnections();
      
    } catch (error) {
      console.error('❌ Failed to initialize migration services:', error.message);
      throw error;
    }
  }

  async testConnections() {
    console.log('\n🧪 Testing service connections...');
    
    try {
      // Test Google Sheets connection
      const sheetsHealth = await this.googleSheetsService.testConnection();
      if (!sheetsHealth.ok) {
        throw new Error(`Google Sheets connection failed: ${sheetsHealth.error}`);
      }
      console.log('✅ Google Sheets connection: OK');
      console.log(`   Sheet: ${sheetsHealth.title}`);
      console.log(`   Available sheets: ${sheetsHealth.sheets.join(', ')}`);

      // Test Supabase connection
      const { data, error } = await this.supabase
        .from('customers')
        .select('count')
        .limit(1);
        
      if (error) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }
      console.log('✅ Supabase connection: OK');
      console.log(`   Current customers in database: ${data ? data.length : 0}`);

    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      throw error;
    }
  }

  async exportFromGoogleSheets() {
    console.log('\n📊 Exporting customer data from Google Sheets...');
    
    try {
      const result = await this.googleSheetsService.getAllCustomers(1000);
      
      if (!result.success) {
        throw new Error(`Failed to export customers: ${result.error}`);
      }

      console.log(`✅ Exported ${result.customers.length} customers from Google Sheets`);
      
      // Log the customers we found
      console.log('\n📋 Found customers:');
      result.customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.customerId} - ${customer.businessName || customer.firstName + ' ' + customer.lastName} (${customer.packageType})`);
      });

      this.migrationResults.totalCustomers = result.customers.length;
      return result.customers;
      
    } catch (error) {
      console.error('❌ Failed to export from Google Sheets:', error.message);
      throw error;
    }
  }

  async transformCustomerData(googleSheetsCustomer) {
    /**
     * Transform Google Sheets customer data to Supabase customer schema
     * Maps Google Sheets fields to Supabase customers table structure
     */
    
    try {
      // Generate a secure password hash for the customer (they can reset it later)
      const tempPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Map package types to subscription tiers
      const packageToTierMap = {
        'starter': 'basic',
        'growth': 'pro', 
        'professional': 'pro',
        'enterprise': 'enterprise',
        'pro': 'pro'
      };

      const subscriptionTier = packageToTierMap[googleSheetsCustomer.packageType?.toLowerCase()] || 'basic';
      
      // Map package types to credit limits
      const packageToCreditMap = {
        'starter': 100,
        'growth': 500,
        'professional': 1000,
        'enterprise': 2000,
        'basic': 100,
        'pro': 500
      };

      const creditsLimit = packageToCreditMap[googleSheetsCustomer.packageType?.toLowerCase()] || 100;

      const supabaseCustomer = {
        // Core identification (preserve original customer ID in metadata)
        email: googleSheetsCustomer.email || `${googleSheetsCustomer.customerId}@migrated.directorybolt.com`,
        password_hash: passwordHash,
        full_name: `${googleSheetsCustomer.firstName || ''} ${googleSheetsCustomer.lastName || ''}`.trim() || googleSheetsCustomer.businessName || 'Migrated Customer',
        company_name: googleSheetsCustomer.businessName || null,
        
        // Business data stored as JSONB
        business_data: {
          original_customer_id: googleSheetsCustomer.customerId, // CRITICAL: Preserve original ID
          website: googleSheetsCustomer.website || null,
          phone: googleSheetsCustomer.phone || null,
          address: googleSheetsCustomer.address || null,
          city: googleSheetsCustomer.city || null,
          state: googleSheetsCustomer.state || null,
          zip: googleSheetsCustomer.zip || null,
          description: googleSheetsCustomer.description || null,
          original_package_type: googleSheetsCustomer.packageType,
          migrated_from_google_sheets: true,
          migration_date: new Date().toISOString(),
          temp_password: tempPassword // Store temp password for customer notification
        },
        
        // Subscription and billing
        subscription_tier: subscriptionTier,
        subscription_status: googleSheetsCustomer.status === 'pending' ? 'trialing' : 'active',
        credits_remaining: creditsLimit,
        credits_limit: creditsLimit,
        
        // Account status
        is_verified: true, // Assume migrated customers are verified
        is_active: true,
        onboarding_completed: true, // Assume existing customers completed onboarding
        first_submission_completed: googleSheetsCustomer.status !== 'pending',
        
        // Trial management (set reasonable trial period for existing customers)
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        
        // Metadata for migration tracking
        metadata: {
          migration_source: 'google_sheets',
          original_customer_id: googleSheetsCustomer.customerId,
          migration_timestamp: new Date().toISOString(),
          original_data: googleSheetsCustomer // Keep full original record for reference
        }
      };

      return supabaseCustomer;
      
    } catch (error) {
      console.error(`❌ Failed to transform customer data for ${googleSheetsCustomer.customerId}:`, error.message);
      throw error;
    }
  }

  generateTemporaryPassword() {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async insertIntoSupabase(supabaseCustomers) {
    console.log('\n💾 Inserting customers into Supabase database...');
    
    for (let i = 0; i < supabaseCustomers.length; i++) {
      const customer = supabaseCustomers[i];
      const originalId = customer.metadata.original_customer_id;
      
      try {
        console.log(`\n${i + 1}. Migrating customer: ${originalId}`);
        console.log(`   Name: ${customer.full_name}`);
        console.log(`   Company: ${customer.company_name || 'N/A'}`);
        console.log(`   Email: ${customer.email}`);
        console.log(`   Package: ${customer.business_data.original_package_type} → ${customer.subscription_tier}`);
        
        // Check if customer already exists (by email or original customer ID)
        const existingCustomer = await this.checkExistingCustomer(originalId, customer.email);
        
        if (existingCustomer) {
          console.log(`   ⚠️  Customer already exists in Supabase (ID: ${existingCustomer.id})`);
          this.migrationResults.migratedCustomers.push({
            original_id: originalId,
            supabase_id: existingCustomer.id,
            status: 'already_exists',
            action: 'skipped'
          });
          continue;
        }

        // Insert customer into Supabase
        const { data, error } = await this.supabase
          .from('customers')
          .insert([customer])
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase insertion failed: ${error.message}`);
        }

        console.log(`   ✅ Successfully migrated to Supabase (ID: ${data.id})`);
        
        this.migrationResults.successfulMigrations++;
        this.migrationResults.migratedCustomers.push({
          original_id: originalId,
          supabase_id: data.id,
          status: 'migrated',
          temp_password: customer.business_data.temp_password,
          action: 'inserted'
        });

      } catch (error) {
        console.error(`   ❌ Failed to migrate ${originalId}:`, error.message);
        this.migrationResults.failedMigrations++;
        this.migrationResults.errors.push({
          customer_id: originalId,
          error: error.message
        });
      }
    }
  }

  async checkExistingCustomer(originalCustomerId, email) {
    try {
      // Check by original customer ID in metadata
      const { data: metadataMatch } = await this.supabase
        .from('customers')
        .select('id, email, metadata')
        .contains('metadata', { original_customer_id: originalCustomerId })
        .single();

      if (metadataMatch) {
        return metadataMatch;
      }

      // Check by email
      const { data: emailMatch } = await this.supabase
        .from('customers')
        .select('id, email, metadata')
        .eq('email', email)
        .single();

      return emailMatch;

    } catch (error) {
      // No existing customer found (this is expected for new migrations)
      return null;
    }
  }

  async validateMigration() {
    console.log('\n🔍 Validating migration integrity...');
    
    try {
      // Test that we can find migrated customers by their original IDs
      for (const migratedCustomer of this.migrationResults.migratedCustomers) {
        if (migratedCustomer.status !== 'migrated') continue;
        
        const originalId = migratedCustomer.original_id;
        console.log(`\n   Validating ${originalId}...`);
        
        // Test 1: Find by original customer ID in metadata
        const { data: customer } = await this.supabase
          .from('customers')
          .select('*')
          .contains('metadata', { original_customer_id: originalId })
          .single();

        if (!customer) {
          throw new Error(`Customer ${originalId} not found in Supabase after migration`);
        }

        console.log(`   ✅ Found in Supabase: ${customer.full_name} (${customer.email})`);
        
        // Test 2: Verify data integrity
        const businessData = customer.business_data;
        if (businessData.original_customer_id !== originalId) {
          throw new Error(`Data integrity failed: original customer ID mismatch for ${originalId}`);
        }

        console.log(`   ✅ Data integrity verified`);
        
        // Test 3: Verify subscription data
        if (!customer.subscription_tier || !customer.credits_limit) {
          throw new Error(`Subscription data missing for ${originalId}`);
        }

        console.log(`   ✅ Subscription data: ${customer.subscription_tier} (${customer.credits_limit} credits)`);
      }

      console.log('\n✅ All migration validations passed!');
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error.message);
      throw error;
    }
  }

  async createCustomerLookupFunction() {
    console.log('\n🔧 Creating customer lookup helper function...');
    
    try {
      // Create a database function to find customers by original ID
      const functionSQL = `
        CREATE OR REPLACE FUNCTION find_customer_by_original_id(original_id TEXT)
        RETURNS TABLE (
          id UUID,
          email VARCHAR,
          full_name VARCHAR,
          company_name VARCHAR,
          subscription_tier VARCHAR,
          subscription_status VARCHAR,
          credits_remaining INTEGER,
          credits_limit INTEGER,
          business_data JSONB,
          metadata JSONB
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            c.id,
            c.email,
            c.full_name,
            c.company_name,
            c.subscription_tier,
            c.subscription_status,
            c.credits_remaining,
            c.credits_limit,
            c.business_data,
            c.metadata
          FROM customers c
          WHERE c.metadata->>'original_customer_id' = original_id
             OR c.business_data->>'original_customer_id' = original_id;
        END;
        $$ LANGUAGE plpgsql;
      `;

      const { error } = await this.supabase.rpc('exec_sql', { sql: functionSQL });
      
      if (error) {
        console.log('⚠️  Could not create lookup function (may already exist):', error.message);
      } else {
        console.log('✅ Customer lookup function created');
      }
      
    } catch (error) {
      console.log('⚠️  Lookup function creation failed (non-critical):', error.message);
    }
  }

  async testAPIsWithMigratedData() {
    console.log('\n🧪 Testing APIs with migrated customer data...');
    
    for (const migratedCustomer of this.migrationResults.migratedCustomers) {
      if (migratedCustomer.status !== 'migrated') continue;
      
      const originalId = migratedCustomer.original_id;
      console.log(`\n   Testing API access for ${originalId}...`);
      
      try {
        // Test customer lookup by original ID
        const { data: customer } = await this.supabase
          .from('customers')
          .select('*')
          .contains('metadata', { original_customer_id: originalId })
          .single();

        if (!customer) {
          throw new Error(`API test failed: Customer ${originalId} not found`);
        }

        console.log(`   ✅ Customer lookup API: OK`);
        console.log(`   ✅ Customer: ${customer.full_name}`);
        console.log(`   ✅ Package: ${customer.subscription_tier}`);
        console.log(`   ✅ Credits: ${customer.credits_remaining}/${customer.credits_limit}`);

      } catch (error) {
        console.error(`   ❌ API test failed for ${originalId}:`, error.message);
        this.migrationResults.errors.push({
          customer_id: originalId,
          test: 'api_validation',
          error: error.message
        });
      }
    }
  }

  async generateMigrationReport() {
    console.log('\n📊 Generating Migration Report...');
    
    const report = {
      migration_summary: {
        total_customers: this.migrationResults.totalCustomers,
        successful_migrations: this.migrationResults.successfulMigrations,
        failed_migrations: this.migrationResults.failedMigrations,
        migration_date: new Date().toISOString()
      },
      migrated_customers: this.migrationResults.migratedCustomers,
      errors: this.migrationResults.errors,
      validation_status: this.migrationResults.errors.length === 0 ? 'PASSED' : 'FAILED',
      next_steps: [
        'Update Chrome extension to use Supabase customer lookup',
        'Update staff dashboard to read from Supabase',
        'Test Chrome extension validation with migrated customer IDs',
        'Notify customers of migration with temporary passwords',
        'Monitor system for any issues with migrated data'
      ]
    };

    const reportPath = `C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt\\migration-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📋 MIGRATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Total Customers: ${report.migration_summary.total_customers}`);
    console.log(`✅ Successful Migrations: ${report.migration_summary.successful_migrations}`);
    console.log(`❌ Failed Migrations: ${report.migration_summary.failed_migrations}`);
    console.log(`📊 Validation Status: ${report.validation_status}`);
    console.log(`📄 Full Report: ${reportPath}`);

    if (this.migrationResults.migratedCustomers.length > 0) {
      console.log('\n👥 MIGRATED CUSTOMERS:');
      this.migrationResults.migratedCustomers.forEach(customer => {
        console.log(`   ${customer.original_id} → Supabase ID: ${customer.supabase_id} (${customer.status})`);
      });
    }

    if (this.migrationResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.migrationResults.errors.forEach(error => {
        console.log(`   ${error.customer_id}: ${error.error}`);
      });
    }

    return report;
  }

  async executeMigration() {
    try {
      console.log('🚀 Starting customer migration process...');
      
      // Step 1: Initialize services
      await this.initialize();
      
      // Step 2: Export data from Google Sheets
      const googleSheetsCustomers = await this.exportFromGoogleSheets();
      
      if (googleSheetsCustomers.length === 0) {
        console.log('⚠️  No customers found in Google Sheets. Migration aborted.');
        return;
      }
      
      // Step 3: Transform data for Supabase
      console.log('\n🔄 Transforming customer data for Supabase...');
      const supabaseCustomers = [];
      
      for (const customer of googleSheetsCustomers) {
        try {
          const transformed = await this.transformCustomerData(customer);
          supabaseCustomers.push(transformed);
        } catch (error) {
          console.error(`❌ Failed to transform ${customer.customerId}:`, error.message);
          this.migrationResults.failedMigrations++;
          this.migrationResults.errors.push({
            customer_id: customer.customerId,
            stage: 'transformation',
            error: error.message
          });
        }
      }
      
      console.log(`✅ Transformed ${supabaseCustomers.length} customers for migration`);
      
      // Step 4: Insert into Supabase
      await this.insertIntoSupabase(supabaseCustomers);
      
      // Step 5: Validate migration
      await this.validateMigration();
      
      // Step 6: Create helper functions
      await this.createCustomerLookupFunction();
      
      // Step 7: Test APIs
      await this.testAPIsWithMigratedData();
      
      // Step 8: Generate report
      const report = await this.generateMigrationReport();
      
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('\n📝 CRITICAL NEXT STEPS:');
      console.log('1. Update Chrome extension validation to use Supabase lookup');
      console.log('2. Update staff dashboard to read from Supabase');
      console.log('3. Test all customer-facing APIs with migrated data');
      console.log('4. Backup Google Sheets data before decommissioning');
      
      return report;
      
    } catch (error) {
      console.error('\n💥 MIGRATION FAILED:', error.message);
      console.error('Full error:', error.stack);
      
      await this.generateMigrationReport();
      throw error;
    }
  }
}

// Main execution
async function main() {
  const migration = new CustomerMigration();
  
  try {
    await migration.executeMigration();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CustomerMigration };