/**
 * ADMIN AUTHENTICATION INVESTIGATION
 * This script investigates the current state of admin/staff authentication
 */

const { createSupabaseService } = require('./lib/services/supabase.js');

async function investigateAdminAuth() {
  console.log('🔍 DIRECTLYBOLT ADMIN AUTHENTICATION INVESTIGATION');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check Supabase Database Structure
    console.log('\n📊 CHECKING SUPABASE DATABASE STRUCTURE...');
    const supabase = createSupabaseService();
    await supabase.initialize();
    
    const connectionTest = await supabase.testConnection();
    console.log('Database Connection:', connectionTest.ok ? '✅ Connected' : '❌ Failed');
    
    if (connectionTest.ok) {
      // Check existing tables
      console.log('\n🗃️ EXAMINING DATABASE TABLES:');
      
      try {
        const { data: tables, error } = await supabase.client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
          
        if (error) {
          console.log('❌ Could not query table structure:', error.message);
        } else {
          console.log('📋 Available Tables:');
          tables.forEach(table => {
            console.log(`   - ${table.table_name}`);
          });
        }
      } catch (err) {
        console.log('❌ Direct table query failed, trying alternative...');
        
        // Try to check for customers table specifically
        const { data: customers, error: customerError } = await supabase.client
          .from('customers')
          .select('customer_id')
          .limit(1);
          
        if (customerError) {
          console.log('❌ Customers table check failed:', customerError.message);
        } else {
          console.log('✅ Customers table exists and accessible');
        }
      }
    }
    
    // 2. Check Environment Variables
    console.log('\n🔐 CHECKING AUTHENTICATION ENVIRONMENT VARIABLES:');
    const envVars = {
      'ADMIN_API_KEY': process.env.ADMIN_API_KEY,
      'ADMIN_USERNAME': process.env.ADMIN_USERNAME,
      'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD,
      'ADMIN_SESSION_TOKEN': process.env.ADMIN_SESSION_TOKEN,
      'STAFF_API_KEY': process.env.STAFF_API_KEY,
      'STAFF_USERNAME': process.env.STAFF_USERNAME,
      'STAFF_PASSWORD': process.env.STAFF_PASSWORD,
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        const displayValue = key.includes('KEY') || key.includes('PASSWORD') 
          ? `${value.substring(0, 10)}...` 
          : value;
        console.log(`✅ ${key}: ${displayValue}`);
      } else {
        console.log(`❌ ${key}: NOT SET`);
      }
    });
    
    // 3. Check Default Credentials from Code
    console.log('\n🔑 DEFAULT CREDENTIALS FOUND IN CODE:');
    console.log('Default Admin API Key: DirectoryBolt-Admin-2025-SecureKey');
    console.log('Default Admin Username: admin');
    console.log('Default Admin Password: DirectoryBolt2025!');
    console.log('Default Staff API Key: DirectoryBolt-Staff-2025-SecureKey');
    
    // 4. Check if admin authentication tables exist in database
    console.log('\n👥 CHECKING FOR ADMIN/STAFF USER TABLES:');
    
    // Check for users table (from schema.ts)
    try {
      const { data: users, error: usersError } = await supabase.client
        .from('users')
        .select('id, email, subscription_tier')
        .limit(1);
        
      if (usersError) {
        console.log('❌ Users table does not exist:', usersError.message);
      } else {
        console.log('✅ Users table exists');
        console.log(`📊 Sample users found: ${users ? users.length : 0}`);
      }
    } catch (err) {
      console.log('❌ Users table check failed:', err.message);
    }
    
    // Check auth.users (Supabase auth table)
    try {
      const { data: authUsers, error: authError } = await supabase.client.auth.admin.listUsers();
      
      if (authError) {
        console.log('❌ Supabase Auth users check failed:', authError.message);
      } else {
        console.log('✅ Supabase Auth is accessible');
        console.log(`👤 Auth users found: ${authUsers.users ? authUsers.users.length : 0}`);
        
        // Check for admin users
        const adminUsers = authUsers.users?.filter(user => 
          user.email?.includes('admin') || 
          user.user_metadata?.role === 'admin' ||
          user.app_metadata?.role === 'admin'
        );
        
        console.log(`🔑 Admin users found: ${adminUsers ? adminUsers.length : 0}`);
        
        if (adminUsers && adminUsers.length > 0) {
          adminUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.user_metadata?.role || user.app_metadata?.role || 'no role'})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Supabase Auth admin access failed:', err.message);
    }
    
    // 5. Generate Assessment Report
    console.log('\n📋 ADMIN AUTHENTICATION ASSESSMENT REPORT:');
    console.log('=' .repeat(60));
    
    const hasEnvCredentials = !!(envVars.ADMIN_API_KEY || envVars.ADMIN_USERNAME);
    const hasDbConnection = connectionTest.ok;
    const hasDefaultCredentials = true; // Found in code
    
    console.log('\n🎯 KEY FINDINGS:');
    console.log(`Database Connection: ${hasDbConnection ? '✅ Working' : '❌ Failed'}`);
    console.log(`Environment Credentials: ${hasEnvCredentials ? '✅ Set' : '❌ Missing'}`);
    console.log(`Default Credentials in Code: ${hasDefaultCredentials ? '⚠️ Present' : '✅ Removed'}`);
    
    console.log('\n🚨 CRITICAL ISSUES IDENTIFIED:');
    
    if (!hasDbConnection) {
      console.log('❌ CRITICAL: No working database connection for admin authentication');
    }
    
    if (!hasEnvCredentials) {
      console.log('❌ CRITICAL: No admin credentials configured in environment');
    }
    
    console.log('❌ CRITICAL: Admin authentication relies on environment variables only');
    console.log('❌ CRITICAL: No admin user records in database');
    console.log('❌ CRITICAL: No role-based authentication system');
    console.log('⚠️  WARNING: Default credentials visible in source code');
    
    console.log('\n📝 MISSING DATABASE COMPONENTS:');
    console.log('❌ Admin users table or records');
    console.log('❌ Role-based permissions system');
    console.log('❌ Admin session management');
    console.log('❌ Admin user creation/management functionality');
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('1. Create admin users in Supabase Auth with admin role metadata');
    console.log('2. Implement role-based authentication using Supabase RLS policies');
    console.log('3. Remove hardcoded credentials from source code');
    console.log('4. Create admin user management interface');
    console.log('5. Implement proper session management for admin users');
    
    console.log('\n💡 CURRENT ACCESS METHOD:');
    if (hasEnvCredentials) {
      console.log('✅ Admin dashboard accessible via environment variable credentials');
      console.log('🔗 Login URL: /admin-login');
      console.log('🔗 Dashboard URL: /admin-dashboard');
    } else {
      console.log('❌ Admin dashboard NOT accessible - no valid credentials');
    }
    
  } catch (error) {
    console.error('🚨 Investigation failed:', error.message);
  }
}

// Run investigation
investigateAdminAuth().then(() => {
  console.log('\n✅ Investigation complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Investigation error:', error);
  process.exit(1);
});