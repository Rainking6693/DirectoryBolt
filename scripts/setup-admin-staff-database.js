#!/usr/bin/env node

/**
 * Setup Admin/Staff Database Schema and Initial Users
 * This script creates the admin/staff tables and inserts BEN STONE as CEO
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Setting up Admin/Staff Database...')
  
  try {
    // Read and execute the admin-staff schema
    const schemaPath = path.join(__dirname, '..', 'lib', 'database', 'admin-staff-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📋 Executing admin-staff schema...')
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (schemaError) {
      console.error('❌ Schema execution failed:', schemaError)
      // Try executing the schema in parts
      await executeSchemaInParts()
    } else {
      console.log('✅ Schema executed successfully')
    }
    
    // Verify the setup
    await verifySetup()
    
    console.log('🎉 Admin/Staff database setup completed successfully!')
    console.log('')
    console.log('📋 Created Users:')
    console.log('👑 Admin: BEN STONE (CEO)')
    console.log('   Username: admin')
    console.log('   Password: DirectoryBolt2025!')
    console.log('   API Key: DirectoryBolt-Admin-2025-SecureKey')
    console.log('')
    console.log('👨‍💼 Staff: BEN STONE (Manager)')
    console.log('   Username: staff')
    console.log('   Password: DirectoryBoltStaff2025!')
    console.log('   API Key: DirectoryBolt-Staff-2025-SecureKey')
    console.log('')
    console.log('🔗 Login URLs:')
    console.log('   Admin: http://localhost:3000/admin-login')
    console.log('   Staff: http://localhost:3000/staff-login')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

async function executeSchemaInParts() {
  console.log('📋 Executing schema in parts...')
  
  const schemaParts = [
    // Create admin_users table
    `
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
      permissions JSONB DEFAULT '{}'::jsonb,
      api_key VARCHAR(255) UNIQUE,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP WITH TIME ZONE,
      login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES admin_users(id),
      metadata JSONB DEFAULT '{}'::jsonb
    );
    `,
    
    // Create staff_users table
    `
    CREATE TABLE IF NOT EXISTS staff_users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('staff', 'senior_staff', 'manager')),
      permissions JSONB DEFAULT '{}'::jsonb,
      api_key VARCHAR(255) UNIQUE,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP WITH TIME ZONE,
      login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES admin_users(id),
      metadata JSONB DEFAULT '{}'::jsonb
    );
    `,
    
    // Create user_sessions table
    `
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL,
      user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'staff')),
      session_token VARCHAR(255) UNIQUE NOT NULL,
      refresh_token VARCHAR(255) UNIQUE,
      ip_address INET,
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `
  ]
  
  for (const part of schemaParts) {
    const { error } = await supabase.rpc('exec_sql', { sql: part })
    if (error) {
      console.error('❌ Schema part failed:', error)
    } else {
      console.log('✅ Schema part executed')
    }
  }
  
  // Create indexes
  await createIndexes()
  
  // Insert users
  await insertUsers()
}

async function createIndexes() {
  console.log('📋 Creating indexes...')
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);',
    'CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);',
    'CREATE INDEX IF NOT EXISTS idx_admin_users_api_key ON admin_users(api_key);',
    'CREATE INDEX IF NOT EXISTS idx_staff_users_username ON staff_users(username);',
    'CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);',
    'CREATE INDEX IF NOT EXISTS idx_staff_users_api_key ON staff_users(api_key);',
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);'
  ]
  
  for (const index of indexes) {
    const { error } = await supabase.rpc('exec_sql', { sql: index })
    if (error) {
      console.error('❌ Index creation failed:', error)
    }
  }
}

async function insertUsers() {
  console.log('👤 Inserting admin and staff users...')
  
  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('DirectoryBolt2025!', 12)
  const staffPasswordHash = await bcrypt.hash('DirectoryBoltStaff2025!', 12)
  
  // Insert admin user
  const { error: adminError } = await supabase
    .from('admin_users')
    .upsert({
      username: 'admin',
      email: 'ben.stone@directorybolt.com',
      password_hash: adminPasswordHash,
      first_name: 'BEN',
      last_name: 'STONE',
      role: 'super_admin',
      api_key: 'DirectoryBolt-Admin-2025-SecureKey',
      permissions: {
        system: true,
        users: true,
        analytics: true,
        billing: true,
        support: true
      },
      is_active: true
    })
  
  if (adminError) {
    console.error('❌ Admin user insertion failed:', adminError)
  } else {
    console.log('✅ Admin user created/updated')
  }
  
  // Insert staff user
  const { error: staffError } = await supabase
    .from('staff_users')
    .upsert({
      username: 'staff',
      email: 'ben.stone@directorybolt.com',
      password_hash: staffPasswordHash,
      first_name: 'BEN',
      last_name: 'STONE',
      role: 'manager',
      api_key: 'DirectoryBolt-Staff-2025-SecureKey',
      permissions: {
        queue: true,
        processing: true,
        analytics: true,
        support: true
      },
      is_active: true
    })
  
  if (staffError) {
    console.error('❌ Staff user insertion failed:', staffError)
  } else {
    console.log('✅ Staff user created/updated')
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...')
  
  // Check admin user
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('username, email, first_name, last_name, role, api_key, is_active')
    .eq('username', 'admin')
    .single()
  
  if (adminError || !adminUser) {
    console.error('❌ Admin user verification failed:', adminError)
    return false
  }
  
  // Check staff user
  const { data: staffUser, error: staffError } = await supabase
    .from('staff_users')
    .select('username, email, first_name, last_name, role, api_key, is_active')
    .eq('username', 'staff')
    .single()
  
  if (staffError || !staffUser) {
    console.error('❌ Staff user verification failed:', staffError)
    return false
  }
  
  console.log('✅ Admin user verified:', adminUser.username, adminUser.role)
  console.log('✅ Staff user verified:', staffUser.username, staffUser.role)
  
  return true
}

// Run the setup
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }
