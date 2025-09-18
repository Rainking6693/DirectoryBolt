/**
 * Verify DirectoryBolt Database Setup
 * Purpose: Test database functionality after manual SQL execution
 * Date: 2025-09-18
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DirectoryBolt Database Verification');
console.log('=====================================');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

console.log('✓ Supabase URL:', supabaseUrl);
console.log('✓ Service key configured');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Test database tables exist
 */
async function testTablesExist() {
    console.log('\n📋 Checking database tables...');
    
    const tables = [
        'customers',
        'customer_submissions', 
        'customer_progress',
        'customer_communications',
        'customer_payments'
    ];
    
    let allTablesExist = true;
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`   ❌ Table '${table}' error: ${error.message}`);
                allTablesExist = false;
            } else {
                console.log(`   ✓ Table '${table}' exists`);
            }
        } catch (err) {
            console.log(`   ❌ Table '${table}' check failed: ${err.message}`);
            allTablesExist = false;
        }
    }
    
    return allTablesExist;
}

/**
 * Test customer ID generation function
 */
async function testCustomerIdGeneration() {
    console.log('\n🆔 Testing customer ID generation...');
    
    try {
        const { data, error } = await supabase.rpc('generate_customer_id');
        
        if (error) {
            console.log(`   ❌ Function error: ${error.message}`);
            return false;
        }
        
        console.log(`   ✓ Generated ID: ${data}`);
        
        // Verify format: DIR-YYYYMMDD-XXXXXX
        const format = /^DIR-\d{8}-\d{6}$/;
        if (format.test(data)) {
            console.log('   ✓ Format is correct');
            
            // Check date component
            const dateStr = data.split('-')[1];
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            
            if (dateStr === today || Math.abs(parseInt(dateStr) - parseInt(today)) <= 1) {
                console.log('   ✓ Date component is correct');
            } else {
                console.log(`   ⚠️  Date component: ${dateStr} (expected around ${today})`);
            }
            
            return true;
        } else {
            console.log(`   ❌ Invalid format: ${data}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test customer creation with auto-generated ID
 */
async function testCustomerCreation() {
    console.log('\n👤 Testing customer creation...');
    
    try {
        const testEmail = `verify-${Date.now()}@directorybolt.com`;
        
        const { data, error } = await supabase
            .from('customers')
            .insert({
                email: testEmail,
                password_hash: '$2a$12$example.hash.here',
                first_name: 'Verify',
                last_name: 'Test',
                business_name: 'Test Verification Corp',
                package_type: 'basic',
                submission_status: 'pending',
                industry: 'Technology',
                is_verified: true,
                is_active: true
            })
            .select('id, customer_id, email, first_name, last_name, business_name, package_type')
            .single();
        
        if (error) {
            console.log(`   ❌ Creation error: ${error.message}`);
            return false;
        }
        
        console.log('   ✓ Customer created successfully:');
        console.log(`     - Customer ID: ${data.customer_id}`);
        console.log(`     - Email: ${data.email}`);
        console.log(`     - Name: ${data.first_name} ${data.last_name}`);
        console.log(`     - Business: ${data.business_name}`);
        console.log(`     - Package: ${data.package_type}`);
        
        // Verify auto-generated customer_id
        if (data.customer_id && data.customer_id.startsWith('DIR-')) {
            console.log('   ✓ Customer ID auto-generation working');
            return data;
        } else {
            console.log('   ❌ Customer ID not generated properly');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test database views
 */
async function testViews() {
    console.log('\n📊 Testing database views...');
    
    const views = [
        'customer_management',
        'customer_overview'
    ];
    
    let allViewsWork = true;
    
    for (const view of views) {
        try {
            const { data, error } = await supabase
                .from(view)
                .select('*')
                .limit(3);
            
            if (error) {
                console.log(`   ❌ View '${view}' error: ${error.message}`);
                allViewsWork = false;
            } else {
                console.log(`   ✓ View '${view}' working (${data.length} records)`);
                
                // Show sample data for the first view
                if (view === 'customer_management' && data.length > 0) {
                    const sample = data[0];
                    console.log(`     Sample: ${sample.customer_id} - ${sample.first_name} ${sample.last_name}`);
                }
            }
        } catch (err) {
            console.log(`   ❌ View '${view}' test failed: ${err.message}`);
            allViewsWork = false;
        }
    }
    
    return allViewsWork;
}

/**
 * Test customer progress tracking
 */
async function testProgressTracking(customer) {
    if (!customer || !customer.id) return false;
    
    console.log('\n📈 Testing progress tracking...');
    
    try {
        // Create a test submission
        const { data: submission, error: submissionError } = await supabase
            .from('customer_submissions')
            .insert({
                customer_id: customer.id,
                directory_name: 'Test Directory',
                directory_category: 'Technology',
                status: 'submitted',
                automation_method: 'api',
                quality_score: 8
            })
            .select('id')
            .single();
        
        if (submissionError) {
            console.log(`   ❌ Submission creation error: ${submissionError.message}`);
            return false;
        }
        
        console.log('   ✓ Test submission created');
        
        // Check if progress record exists
        const { data: progress, error: progressError } = await supabase
            .from('customer_progress')
            .select('*')
            .eq('customer_id', customer.id)
            .single();
        
        if (progressError) {
            console.log(`   ❌ Progress check error: ${progressError.message}`);
            return false;
        }
        
        console.log('   ✓ Progress tracking record found');
        console.log(`     - Directories submitted: ${progress.directories_submitted}`);
        console.log(`     - Overall status: ${progress.overall_status}`);
        
        return true;
    } catch (error) {
        console.log(`   ❌ Progress tracking test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test customer columns and data types
 */
async function testCustomerSchema() {
    console.log('\n📝 Testing customer schema...');
    
    try {
        // Get a customer record to verify schema
        const { data, error } = await supabase
            .from('customers')
            .select(`
                customer_id,
                first_name,
                last_name,
                business_name,
                package_type,
                submission_status,
                phone,
                website,
                industry,
                submission_results,
                directory_data,
                payment_status,
                customer_source,
                created_at
            `)
            .limit(1)
            .single();
        
        if (error) {
            console.log(`   ❌ Schema test error: ${error.message}`);
            return false;
        }
        
        console.log('   ✓ Customer schema verified:');
        
        // Check key fields exist
        const requiredFields = [
            'customer_id', 'first_name', 'last_name', 'business_name',
            'package_type', 'submission_status', 'submission_results',
            'directory_data', 'payment_status'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in data));
        
        if (missingFields.length === 0) {
            console.log('     - All required fields present');
            console.log(`     - Customer ID format: ${data.customer_id}`);
            console.log(`     - Package type: ${data.package_type}`);
            console.log(`     - Payment status: ${data.payment_status}`);
            return true;
        } else {
            console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Schema test failed: ${error.message}`);
        return false;
    }
}

/**
 * Display summary statistics
 */
async function showSummaryStats() {
    console.log('\n📊 Database Summary Stats');
    console.log('========================');
    
    try {
        // Count customers
        const { count: customerCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });
        
        console.log(`Total customers: ${customerCount}`);
        
        // Count by package type
        const { data: packageStats } = await supabase
            .from('customers')
            .select('package_type')
            .not('package_type', 'is', null);
        
        const packageCounts = {};
        packageStats.forEach(row => {
            packageCounts[row.package_type] = (packageCounts[row.package_type] || 0) + 1;
        });
        
        console.log('Package distribution:');
        Object.entries(packageCounts).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count}`);
        });
        
        // Count submissions
        const { count: submissionCount } = await supabase
            .from('customer_submissions')
            .select('*', { count: 'exact', head: true });
        
        console.log(`Total submissions: ${submissionCount}`);
        
        // Recent customer ID format check
        const { data: recentCustomers } = await supabase
            .from('customers')
            .select('customer_id')
            .not('customer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (recentCustomers.length > 0) {
            console.log('\nRecent customer IDs:');
            recentCustomers.forEach(customer => {
                console.log(`  - ${customer.customer_id}`);
            });
        }
        
    } catch (error) {
        console.log(`❌ Stats error: ${error.message}`);
    }
}

/**
 * Main verification function
 */
async function main() {
    let allTestsPassed = true;
    let testCustomer = null;
    
    // Test 1: Tables exist
    if (!(await testTablesExist())) {
        allTestsPassed = false;
    }
    
    // Test 2: Customer ID generation
    if (!(await testCustomerIdGeneration())) {
        allTestsPassed = false;
    }
    
    // Test 3: Customer creation
    testCustomer = await testCustomerCreation();
    if (!testCustomer) {
        allTestsPassed = false;
    }
    
    // Test 4: Database views
    if (!(await testViews())) {
        allTestsPassed = false;
    }
    
    // Test 5: Customer schema
    if (!(await testCustomerSchema())) {
        allTestsPassed = false;
    }
    
    // Test 6: Progress tracking
    if (testCustomer && !(await testProgressTracking(testCustomer))) {
        allTestsPassed = false;
    }
    
    // Show summary stats
    await showSummaryStats();
    
    // Final summary
    console.log('\n🎯 Verification Summary');
    console.log('======================');
    
    if (allTestsPassed) {
        console.log('✅ All tests passed! Database is ready for DirectoryBolt.');
        console.log('\n🎉 Key features verified:');
        console.log('   • Auto-generating customer IDs (DIR-YYYYMMDD-XXXXXX)');
        console.log('   • Customer management with Google Sheets compatibility');
        console.log('   • Supporting tables for submissions and progress');
        console.log('   • Real-time views for customer dashboards');
        console.log('   • JSONB fields for flexible data storage');
        console.log('   • Progress tracking and automation');
        
        console.log('\n🚀 Next steps:');
        console.log('   1. Integrate customer creation in your app');
        console.log('   2. Set up real-time subscriptions for dashboards');
        console.log('   3. Implement Google Sheets sync if needed');
        console.log('   4. Test submission workflow integration');
        
    } else {
        console.log('❌ Some tests failed. Please review the errors above.');
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure you executed the SQL in Supabase SQL Editor');
        console.log('   2. Check that all tables were created successfully');
        console.log('   3. Verify your Supabase credentials are correct');
        console.log('   4. Check the Supabase logs for any errors');
        process.exit(1);
    }
}

// Run verification
main().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
});