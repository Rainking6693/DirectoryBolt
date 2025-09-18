/**
 * DirectoryBolt Customer Migration to Supabase
 * CRITICAL: Migrate customer data from Google Sheets to Supabase
 * 
 * This script:
 * 1. Reads existing customer data from Google Sheets
 * 2. Creates customers in Supabase with proper structure
 * 3. Generates customer IDs in DIR-YYYYMMDD-XXXXXX format
 * 4. Maps all data fields appropriately
 * 5. Creates comprehensive migration report
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

console.log('🚀 DirectoryBolt Customer Migration to Supabase');
console.log('=' .repeat(60));

class CustomerMigrationService {
  constructor() {
    this.supabase = null;
    this.googleSheet = null;
    this.migrationReport = {
      startTime: new Date().toISOString(),
      sourceCustomers: 0,
      migratedCustomers: 0,
      skippedCustomers: 0,
      errors: [],
      customerMapping: [],
      endTime: null
    };
  }

  async initialize() {
    console.log('🔧 Initializing connections...');
    
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase connection initialized');

    // Initialize Google Sheets
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.googleSheet = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await this.googleSheet.loadInfo();
    
    console.log('✅ Google Sheets connection initialized');
    console.log(`📊 Sheet: "${this.googleSheet.title}"`);
  }

  async readGoogleSheetsCustomers() {
    console.log('\n📖 Reading customer data from Google Sheets...');
    
    const sheet = this.googleSheet.sheetsByTitle['Customers'] || this.googleSheet.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    console.log(`📋 Found ${rows.length} customer records in Google Sheets`);
    this.migrationReport.sourceCustomers = rows.length;

    const customers = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Map Google Sheets columns to our schema
      const customer = {
        // Original data from Google Sheets
        originalRowIndex: i + 2, // +2 because sheets are 1-indexed and have header
        firstName: row.get('First Name') || row.get('first_name') || '',
        lastName: row.get('Last Name') || row.get('last_name') || '',
        businessName: row.get('Business Name') || row.get('business_name') || row.get('Company Name') || 'Unknown Business',
        email: row.get('Email') || row.get('email') || '',
        phone: row.get('Phone') || row.get('phone') || '',
        website: row.get('Website') || row.get('website') || '',
        address: row.get('Address') || row.get('address') || '',
        city: row.get('City') || row.get('city') || '',
        state: row.get('State') || row.get('state') || '',
        zip: row.get('ZIP') || row.get('zip') || row.get('Zip Code') || '',
        country: row.get('Country') || row.get('country') || 'USA',
        packageType: this.normalizePackageType(row.get('Package') || row.get('package_type') || row.get('Plan') || 'starter'),
        status: this.normalizeStatus(row.get('Status') || row.get('status') || 'active'),
        directoriesSubmitted: parseInt(row.get('Directories Submitted') || row.get('directories_submitted') || '0') || 0,
        failedDirectories: parseInt(row.get('Failed Directories') || row.get('failed_directories') || '0') || 0,
        createdAt: this.parseDate(row.get('Created At') || row.get('created_at') || row.get('Date')),
        
        // Additional metadata from other columns
        metadata: this.extractMetadata(row)
      };

      // Only add customers with at least business name and email
      if (customer.businessName && customer.email) {
        customers.push(customer);
      } else {
        console.log(`⚠️  Skipping row ${customer.originalRowIndex}: missing required data`);
        this.migrationReport.skippedCustomers++;
      }
    }

    console.log(`✅ Processed ${customers.length} valid customers from Google Sheets`);
    return customers;
  }

  normalizePackageType(packageType) {
    if (!packageType) return 'starter';
    
    const normalized = packageType.toLowerCase().trim();
    const mapping = {
      'starter': 'starter',
      'basic': 'starter',
      'growth': 'growth',
      'professional': 'professional',
      'pro': 'professional',
      'premium': 'professional',
      'enterprise': 'enterprise',
      'business': 'enterprise'
    };
    
    return mapping[normalized] || 'starter';
  }

  normalizeStatus(status) {
    if (!status) return 'active';
    
    const normalized = status.toLowerCase().trim();
    const mapping = {
      'active': 'active',
      'pending': 'pending',
      'in-progress': 'in-progress',
      'processing': 'in-progress',
      'completed': 'completed',
      'done': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'paused': 'paused',
      'cancelled': 'cancelled',
      'canceled': 'cancelled'
    };
    
    return mapping[normalized] || 'active';
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      return new Date();
    }
  }

  extractMetadata(row) {
    const metadata = {};
    
    // Extract any additional columns that don't fit our main schema
    const standardColumns = [
      'First Name', 'first_name', 'Last Name', 'last_name',
      'Business Name', 'business_name', 'Company Name',
      'Email', 'email', 'Phone', 'phone', 'Website', 'website',
      'Address', 'address', 'City', 'city', 'State', 'state',
      'ZIP', 'zip', 'Zip Code', 'Country', 'country',
      'Package', 'package_type', 'Plan', 'Status', 'status',
      'Directories Submitted', 'directories_submitted',
      'Failed Directories', 'failed_directories',
      'Created At', 'created_at', 'Date'
    ];

    for (const [key, value] of Object.entries(row._rawData)) {
      if (!standardColumns.includes(key) && value) {
        metadata[key.toLowerCase().replace(/\s+/g, '_')] = value;
      }
    }

    return metadata;
  }

  generateCustomerId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomStr = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `DIR-${dateStr}-${randomStr}`;
  }

  async migrateCustomersToSupabase(customers) {
    console.log('\n💾 Migrating customers to Supabase...');
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const customerId = this.generateCustomerId();
      
      console.log(`\n${i + 1}/${customers.length}. Migrating: ${customer.businessName}`);
      console.log(`   Customer ID: ${customerId}`);
      
      try {
        // Prepare customer data for Supabase
        const supabaseCustomer = {
          customer_id: customerId,
          first_name: customer.firstName,
          last_name: customer.lastName,
          business_name: customer.businessName,
          email: customer.email,
          phone: customer.phone,
          website: customer.website,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zip,
          country: customer.country,
          package_type: customer.packageType,
          status: customer.status,
          directories_submitted: customer.directoriesSubmitted,
          failed_directories: customer.failedDirectories,
          processing_metadata: {},
          metadata: {
            ...customer.metadata,
            migrated_from_google_sheets: true,
            original_row_index: customer.originalRowIndex,
            migration_date: new Date().toISOString()
          },
          created_at: customer.createdAt.toISOString()
        };

        // Insert customer into Supabase
        const { data, error } = await this.supabase
          .from('customers')
          .insert([supabaseCustomer])
          .select();

        if (error) {
          throw error;
        }

        console.log('   ✅ Successfully migrated');
        
        this.migrationReport.migratedCustomers++;
        this.migrationReport.customerMapping.push({
          originalRowIndex: customer.originalRowIndex,
          businessName: customer.businessName,
          email: customer.email,
          newCustomerId: customerId,
          supabaseId: data[0]?.id
        });

      } catch (error) {
        console.log(`   ❌ Migration failed: ${error.message}`);
        
        this.migrationReport.errors.push({
          customerIndex: i + 1,
          businessName: customer.businessName,
          email: customer.email,
          error: error.message,
          customerId: customerId
        });
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async testSupabaseConnection() {
    console.log('\n🧪 Testing Supabase customer table...');
    
    try {
      // Test if we can query the customers table
      const { data, error, count } = await this.supabase
        .from('customers')
        .select('customer_id', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Customers table test failed: ${error.message}`);
        return false;
      }

      console.log(`✅ Customers table exists with ${count || 0} records`);
      return true;

    } catch (error) {
      console.log(`❌ Supabase connection test failed: ${error.message}`);
      return false;
    }
  }

  async testCustomerIdGeneration() {
    console.log('\n🔧 Testing customer ID generation...');
    
    try {
      // Try to call the generate_customer_id function
      const { data, error } = await this.supabase.rpc('generate_customer_id');
      
      if (error) {
        console.log(`⚠️  Function test failed: ${error.message}`);
        console.log('   Using fallback ID generation');
        
        // Test fallback generation
        const fallbackId = this.generateCustomerId();
        console.log(`✅ Fallback ID generated: ${fallbackId}`);
        return true;
      }

      console.log(`✅ Function generated ID: ${data}`);
      return true;

    } catch (error) {
      console.log(`❌ Customer ID generation test failed: ${error.message}`);
      return false;
    }
  }

  async generateMigrationReport() {
    this.migrationReport.endTime = new Date().toISOString();
    
    const reportPath = `migration-report-${Date.now()}.json`;
    const reportContent = JSON.stringify(this.migrationReport, null, 2);
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📊 Migration report saved: ${reportPath}`);

    // Print summary
    console.log('\n📈 MIGRATION SUMMARY');
    console.log('=' .repeat(30));
    console.log(`📥 Source customers: ${this.migrationReport.sourceCustomers}`);
    console.log(`✅ Successfully migrated: ${this.migrationReport.migratedCustomers}`);
    console.log(`⚠️  Skipped customers: ${this.migrationReport.skippedCustomers}`);
    console.log(`❌ Failed migrations: ${this.migrationReport.errors.length}`);
    
    if (this.migrationReport.errors.length > 0) {
      console.log('\n❌ MIGRATION ERRORS:');
      this.migrationReport.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.businessName} (${error.email}): ${error.error}`);
      });
    }

    return reportPath;
  }

  async migrate() {
    try {
      await this.initialize();
      
      // Test connections first
      const supabaseReady = await this.testSupabaseConnection();
      if (!supabaseReady) {
        throw new Error('Supabase customers table is not ready. Please run schema deployment first.');
      }

      await this.testCustomerIdGeneration();
      
      // Read and migrate data
      const customers = await this.readGoogleSheetsCustomers();
      
      if (customers.length === 0) {
        console.log('⚠️  No customers to migrate');
        return;
      }

      await this.migrateCustomersToSupabase(customers);
      
      // Generate report
      const reportPath = await this.generateMigrationReport();
      
      console.log('\n🎉 MIGRATION COMPLETED!');
      console.log(`📊 Full report: ${reportPath}`);
      
      if (this.migrationReport.migratedCustomers > 0) {
        console.log(`\n✅ ${this.migrationReport.migratedCustomers} customers successfully migrated to Supabase`);
        console.log('🔄 APIs can now be updated to use Supabase instead of Google Sheets');
      }

    } catch (error) {
      console.error('\n💥 MIGRATION FAILED:', error.message);
      console.error('Full error:', error.stack);
      
      this.migrationReport.errors.push({
        type: 'CRITICAL_ERROR',
        message: error.message,
        stack: error.stack
      });
      
      await this.generateMigrationReport();
      throw error;
    }
  }
}

// Main execution
async function main() {
  const migration = new CustomerMigrationService();
  
  try {
    await migration.migrate();
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

module.exports = { CustomerMigrationService };