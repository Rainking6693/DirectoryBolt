/**
 * Run Database Migrations for DirectoryBolt
 * Purpose: Execute SQL migrations directly using raw PostgreSQL connection
 * Date: 2025-09-18
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 DirectoryBolt Database Migration Runner');
console.log('==========================================');

if (!databaseUrl && !supabaseUrl) {
    console.error('❌ Missing database configuration');
    process.exit(1);
}

console.log('✓ Database configuration found');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Execute SQL directly using Supabase
 */
async function executeSQL(sql, description = '') {
    try {
        console.log(`   📝 ${description || 'Executing SQL'}...`);
        
        // For simple SQL statements, we can use the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql_query: sql })
        });
        
        if (!response.ok) {
            // Try alternative approach using raw SQL execution
            const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
            
            if (error) {
                console.log(`   ❌ Error: ${error.message}`);
                return false;
            }
        }
        
        console.log(`   ✓ Success`);
        return true;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Create basic required functions first
 */
async function setupBasicFunctions() {
    console.log('\n🔧 Setting up basic functions...');
    
    // Create update_updated_at_column function
    const updateFunction = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `;
    
    await executeSQL(updateFunction, 'Creating update_updated_at_column function');
    return true;
}

/**
 * Execute customer ID generation migration
 */
async function createCustomerIdGeneration() {
    console.log('\n🆔 Creating customer ID generation...');
    
    // Create sequence
    await executeSQL(
        'CREATE SEQUENCE IF NOT EXISTS customer_id_sequence START 1;',
        'Creating customer ID sequence'
    );
    
    // Create function
    const generateFunction = `
        CREATE OR REPLACE FUNCTION generate_customer_id()
        RETURNS TEXT AS $$
        DECLARE
            date_part TEXT;
            sequence_part TEXT;
            customer_id TEXT;
            attempts INTEGER := 0;
            max_attempts INTEGER := 100;
        BEGIN
            date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
            
            LOOP
                sequence_part := LPAD(nextval('customer_id_sequence')::TEXT, 6, '0');
                customer_id := 'DIR-' || date_part || '-' || sequence_part;
                
                IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = customer_id) THEN
                    RETURN customer_id;
                END IF;
                
                attempts := attempts + 1;
                IF attempts >= max_attempts THEN
                    RAISE EXCEPTION 'Unable to generate unique customer ID after % attempts', max_attempts;
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
    `;
    
    await executeSQL(generateFunction, 'Creating generate_customer_id function');
    
    // Add customer_id column to customers table if it doesn't exist
    await executeSQL(
        'ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id VARCHAR(20);',
        'Adding customer_id column'
    );
    
    // Create unique index
    await executeSQL(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);',
        'Creating customer_id index'
    );
    
    // Create trigger function
    const triggerFunction = `
        CREATE OR REPLACE FUNCTION set_customer_id()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.customer_id IS NULL OR NEW.customer_id = '' THEN
                NEW.customer_id = generate_customer_id();
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `;
    
    await executeSQL(triggerFunction, 'Creating set_customer_id trigger function');
    
    // Create trigger
    await executeSQL(
        'DROP TRIGGER IF EXISTS trigger_set_customer_id ON customers;',
        'Dropping existing trigger'
    );
    
    await executeSQL(
        `CREATE TRIGGER trigger_set_customer_id
            BEFORE INSERT ON customers
            FOR EACH ROW
            EXECUTE FUNCTION set_customer_id();`,
        'Creating customer_id trigger'
    );
    
    return true;
}

/**
 * Add additional columns to customers table
 */
async function addCustomerColumns() {
    console.log('\n📋 Adding customer columns...');
    
    const columns = [
        'first_name VARCHAR(255)',
        'last_name VARCHAR(255)',
        'package_type VARCHAR(50) DEFAULT \'basic\'',
        'submission_status VARCHAR(50) DEFAULT \'pending\'',
        'business_name VARCHAR(255)',
        'phone VARCHAR(20)',
        'website VARCHAR(500)',
        'industry VARCHAR(100)',
        'address TEXT',
        'city VARCHAR(100)',
        'state VARCHAR(100)',
        'country VARCHAR(100)',
        'zip_code VARCHAR(20)',
        'business_description TEXT',
        'target_keywords TEXT',
        'logo_url VARCHAR(500)',
        'submission_results JSONB DEFAULT \'{}\'',
        'directory_data JSONB DEFAULT \'{}\'',
        'notes TEXT',
        'assigned_staff VARCHAR(255)',
        'estimated_completion_date TIMESTAMP WITH TIME ZONE',
        'payment_status VARCHAR(50) DEFAULT \'pending\'',
        'payment_date TIMESTAMP WITH TIME ZONE',
        'refund_status VARCHAR(50)',
        'refund_date TIMESTAMP WITH TIME ZONE',
        'customer_source VARCHAR(100)',
        'referral_code VARCHAR(50)'
    ];
    
    for (const column of columns) {
        await executeSQL(
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS ${column};`,
            `Adding ${column.split(' ')[0]} column`
        );
    }
    
    return true;
}

/**
 * Test customer ID generation
 */
async function testCustomerIdGeneration() {
    console.log('\n🧪 Testing customer ID generation...');
    
    try {
        const { data, error } = await supabase.rpc('generate_customer_id');
        
        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
        
        console.log(`   ✓ Generated customer ID: ${data}`);
        
        // Verify format
        const format = /^DIR-\d{8}-\d{6}$/;
        if (format.test(data)) {
            console.log('   ✓ Format is correct');
            return true;
        } else {
            console.log('   ❌ Format is incorrect');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
        return false;
    }
}

/**
 * Create a test customer
 */
async function createTestCustomer() {
    console.log('\n👤 Creating test customer...');
    
    try {
        const testEmail = `test-${Date.now()}@directorybolt.com`;
        
        const { data, error } = await supabase
            .from('customers')
            .insert({
                email: testEmail,
                password_hash: '$2a$12$example',
                first_name: 'Test',
                last_name: 'Customer',
                business_name: 'Test Corp',
                package_type: 'basic',
                submission_status: 'pending',
                is_verified: true,
                is_active: true
            })
            .select('id, customer_id, email, first_name, last_name')
            .single();
        
        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
        
        console.log('   ✓ Test customer created:');
        console.log(`     - Customer ID: ${data.customer_id}`);
        console.log(`     - Email: ${data.email}`);
        console.log(`     - Name: ${data.first_name} ${data.last_name}`);
        
        return true;
    } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
        return false;
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Setup basic functions
        await setupBasicFunctions();
        
        // Create customer ID generation
        await createCustomerIdGeneration();
        
        // Add customer columns
        await addCustomerColumns();
        
        // Test the functionality
        if (await testCustomerIdGeneration()) {
            await createTestCustomer();
        }
        
        console.log('\n✅ Database setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run the full test script: node scripts/test-supabase-connection.js');
        console.log('2. Check Supabase dashboard for the new tables and data');
        console.log('3. Test customer creation in your application');
        
    } catch (error) {
        console.error('💥 Setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup
main();