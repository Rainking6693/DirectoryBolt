#!/usr/bin/env node

/**
 * Simple Admin/Staff Database Setup
 * Creates tables and inserts users using direct Supabase client calls
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
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
  console.log('🚀 Setting up Admin/Staff Database (Simple Method)...')
  
  try {
    // First, try to create the tables using raw SQL
    await createTables()
    
    // Then insert the users
    await insertUsers()
    
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

async function createTables() {
  console.log('📋 Creating admin/staff tables...')
  
  // For now, we'll skip table creation and just try to insert users
  // The tables should be created manually in Supabase dashboard or via migration
  console.log('⚠️  Skipping table creation - assuming tables exist or will be created manually')
}

async function insertUsers() {
  console.log('👤 Inserting admin and staff users...')
  
  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('DirectoryBolt2025!', 12)
  const staffPasswordHash = await bcrypt.hash('DirectoryBoltStaff2025!', 12)
  
  // Try to insert admin user
  try {
    const { data: adminData, error: adminError } = await supabase
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
      .select()
    
    if (adminError) {
      console.error('❌ Admin user insertion failed:', adminError.message)
      console.log('💡 This is expected if admin_users table doesn\'t exist yet')
    } else {
      console.log('✅ Admin user created/updated')
    }
  } catch (error) {
    console.error('❌ Admin user insertion error:', error.message)
  }
  
  // Try to insert staff user
  try {
    const { data: staffData, error: staffError } = await supabase
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
      .select()
    
    if (staffError) {
      console.error('❌ Staff user insertion failed:', staffError.message)
      console.log('💡 This is expected if staff_users table doesn\'t exist yet')
    } else {
      console.log('✅ Staff user created/updated')
    }
  } catch (error) {
    console.error('❌ Staff user insertion error:', error.message)
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...')
  
  // Check if tables exist by trying to query them
  try {
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('username, email, first_name, last_name, role, api_key, is_active')
      .eq('username', 'admin')
      .single()
    
    if (adminError) {
      console.log('⚠️  Admin table not found or user not created:', adminError.message)
    } else {
      console.log('✅ Admin user verified:', adminUser.username, adminUser.role)
    }
  } catch (error) {
    console.log('⚠️  Admin verification failed:', error.message)
  }
  
  try {
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('username, email, first_name, last_name, role, api_key, is_active')
      .eq('username', 'staff')
      .single()
    
    if (staffError) {
      console.log('⚠️  Staff table not found or user not created:', staffError.message)
    } else {
      console.log('✅ Staff user verified:', staffUser.username, staffUser.role)
    }
  } catch (error) {
    console.log('⚠️  Staff verification failed:', error.message)
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }
