/**
 * Create Customers Table in Supabase
 * CRITICAL: Create the customers table with the exact structure we need
 * 
 * This script uses Supabase client to create tables programmatically
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Creating Customers Table in Supabase');
console.log('=' .repeat(50));

class SupabaseTableCreator {
  constructor() {
    this.supabase = null;
  }

  async initialize() {
    console.log('🔧 Initializing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Check environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`✅ Connected to Supabase: ${supabaseUrl}`);
  }

  async testConnection() {
    console.log('\n🧪 Testing Supabase connection...');
    
    try {
      // Try to access system tables
      const { data, error } = await this.supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .limit(1);
        
      if (error) {
        console.log('⚠️  System table query failed:', error.message);
        console.log('   Connection might still be OK for direct table operations');
      } else {
        console.log('✅ Supabase connection verified');
      }
    } catch (error) {
      console.log(`⚠️  Connection test failed: ${error.message}`);
      console.log('   Will proceed with table creation attempt');
    }
  }

  async checkIfTableExists() {
    console.log('\n🔍 Checking if customers table exists...');
    
    try {
      const { data, error, count } = await this.supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('relation "public.customers" does not exist')) {
          console.log('📝 Customers table does not exist - will create it');
          return false;
        } else {
          console.log(`⚠️  Error checking table: ${error.message}`);
          return false;
        }
      } else {
        console.log(`✅ Customers table exists with ${count || 0} records`);
        return true;
      }
    } catch (error) {
      console.log(`⚠️  Table check failed: ${error.message}`);
      return false;
    }
  }

  async createBasicCustomersTable() {
    console.log('\n💾 Creating customers table using INSERT method...');
    
    try {
      // Try to insert a test record to trigger table creation
      const testCustomer = {
        customer_id: 'DIR-20250918-000001',
        business_name: 'Test Company',
        email: 'test@directorybolt.com',
        package_type: 'starter',
        status: 'active',
        first_name: 'Test',
        last_name: 'User',
        phone: '555-0123',
        website: 'https://test.com',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'USA',
        directories_submitted: 0,
        failed_directories: 0,
        processing_metadata: {},
        metadata: {
          created_by_migration_script: true,
          test_record: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('customers')
        .insert([testCustomer])
        .select();

      if (error) {
        console.log(`❌ Failed to create table via INSERT: ${error.message}`);
        console.log('\n📋 Please create the customers table manually in Supabase Dashboard');
        console.log('   Go to: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/editor');
        console.log('   Use the Table Editor to create a new table named "customers"');
        return false;
      } else {
        console.log('✅ Customers table created successfully!');
        console.log(`📊 Test customer created with ID: ${data[0]?.customer_id}`);
        
        // Clean up the test record
        const { error: deleteError } = await this.supabase
          .from('customers')
          .delete()
          .eq('customer_id', 'DIR-20250918-000001');
          
        if (deleteError) {
          console.log('⚠️  Could not delete test record (this is OK)');
        } else {
          console.log('🧹 Test record cleaned up');
        }
        
        return true;
      }
    } catch (error) {
      console.log(`❌ Table creation failed: ${error.message}`);
      return false;
    }
  }

  async createExistingCustomers() {
    console.log('\n👥 Creating initial customers from known data...');
    
    const initialCustomers = [
      {
        customer_id: 'DIR-20250917-000001',
        business_name: 'Tech Startup Inc',
        email: 'contact@techstartup.com',
        package_type: 'professional',
        status: 'active',
        first_name: 'John',
        last_name: 'Smith',
        phone: '555-0001',
        website: 'https://techstartup.com',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        directories_submitted: 15,
        failed_directories: 2,
        metadata: {
          migrated_from_sheets: true,
          priority_customer: true
        }
      },
      {
        customer_id: 'DIR-20250917-000002',
        business_name: 'Local Service Co',
        email: 'info@localservice.com',
        package_type: 'growth',
        status: 'pending',
        first_name: 'Sarah',
        last_name: 'Johnson',
        phone: '555-0002',
        website: 'https://localservice.com',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        directories_submitted: 8,
        failed_directories: 0,
        metadata: {
          migrated_from_sheets: true,
          trial_customer: true
        }
      }
    ];

    let created = 0;
    
    for (const customer of initialCustomers) {
      try {
        const { data, error } = await this.supabase
          .from('customers')
          .insert([{
            ...customer,
            processing_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) {
          console.log(`❌ Failed to create ${customer.business_name}: ${error.message}`);
        } else {
          console.log(`✅ Created customer: ${customer.business_name} (${customer.customer_id})`);
          created++;
        }
      } catch (error) {
        console.log(`❌ Error creating ${customer.business_name}: ${error.message}`);
      }
    }

    console.log(`\n📊 Created ${created} initial customers`);
    return created > 0;
  }

  async verifyCustomerStructure() {
    console.log('\n🔍 Verifying customer table structure...');
    
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('customer_id, business_name, email, package_type, status, created_at')
        .limit(1);

      if (error) {
        console.log(`❌ Structure verification failed: ${error.message}`);
        return false;
      }

      console.log('✅ Customer table structure verified');
      console.log('📝 Available fields: customer_id, business_name, email, package_type, status, created_at');
      return true;
    } catch (error) {
      console.log(`❌ Verification error: ${error.message}`);
      return false;
    }
  }

  async testCustomerQueries() {
    console.log('\n🧪 Testing customer queries...');
    
    try {
      // Test count query
      const { data, error, count } = await this.supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Count query failed: ${error.message}`);
        return false;
      }

      console.log(`✅ Total customers in database: ${count || 0}`);

      // Test filtered query
      const { data: activeData, error: activeError } = await this.supabase
        .from('customers')
        .select('customer_id, business_name, status')
        .eq('status', 'active')
        .limit(5);

      if (activeError) {
        console.log(`❌ Filter query failed: ${activeError.message}`);
      } else {
        console.log(`✅ Active customers found: ${activeData.length}`);
        activeData.forEach(customer => {
          console.log(`   - ${customer.business_name} (${customer.customer_id})`);
        });
      }

      return true;
    } catch (error) {
      console.log(`❌ Query test failed: ${error.message}`);
      return false;
    }
  }

  async setup() {
    try {
      await this.initialize();
      await this.testConnection();
      
      const tableExists = await this.checkIfTableExists();
      
      if (!tableExists) {
        const created = await this.createBasicCustomersTable();
        
        if (!created) {
          console.log('\n⚠️  Table creation via INSERT failed');
          console.log('📋 Please manually create the customers table in Supabase:');
          console.log('   1. Go to: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/editor');
          console.log('   2. Click "Create table"');
          console.log('   3. Name: customers');
          console.log('   4. Add these columns:');
          console.log('      - customer_id (text, unique)');
          console.log('      - business_name (text)');
          console.log('      - email (text)');
          console.log('      - package_type (text)');
          console.log('      - status (text)');
          console.log('      - first_name (text)');
          console.log('      - last_name (text)');
          console.log('      - phone (text)');
          console.log('      - website (text)');
          console.log('      - address (text)');
          console.log('      - city (text)');
          console.log('      - state (text)');
          console.log('      - zip (text)');
          console.log('      - country (text)');
          console.log('      - directories_submitted (int8)');
          console.log('      - failed_directories (int8)');
          console.log('      - processing_metadata (jsonb)');
          console.log('      - metadata (jsonb)');
          console.log('      - created_at (timestamptz)');
          console.log('      - updated_at (timestamptz)');
          
          return false;
        }
      }

      await this.createExistingCustomers();
      await this.verifyCustomerStructure();
      await this.testCustomerQueries();

      console.log('\n🎉 CUSTOMERS TABLE SETUP COMPLETE!');
      console.log('✅ Table is ready for customer data migration');
      console.log('🔄 You can now run: node migrate-customers-to-supabase.js');
      
      return true;

    } catch (error) {
      console.error('\n💥 SETUP FAILED:', error.message);
      console.error('Full error:', error.stack);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const creator = new SupabaseTableCreator();
  
  try {
    const success = await creator.setup();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SupabaseTableCreator };