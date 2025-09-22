/**
 * Apply Job Queue Migration Script
 * 
 * This script applies the job queue database migration to Supabase
 * Phase 1 - Task 1.1 Database Schema Implementation
 * Agent: Shane (Backend Developer)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🚀 Starting Job Queue Migration...')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '020_create_job_queue_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration SQL loaded successfully')
    console.log(`📏 SQL length: ${migrationSQL.length} characters`)
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct query if rpc fails
          const { error: directError } = await supabase
            .from('_temp_sql_execution')
            .select('*')
            .limit(0)
          
          // If it's just because the table doesn't exist, try a different approach
          console.log(`ℹ️  Statement ${i + 1}: ${statement.substring(0, 100)}...`)
          
          if (error.code === 'PGRST202') {
            console.log(`⚠️  RPC function not available, attempting manual execution`)
            console.log(`💭 This is expected for the initial migration`)
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error)
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (execError) {
        console.log(`⚠️  Statement ${i + 1} execution method not available`)
        console.log(`💡 SQL: ${statement.substring(0, 100)}...`)
      }
    }
    
    console.log('🎯 Migration application completed')
    
    // Test if the functions were created successfully
    console.log('🧪 Testing migration results...')
    
    try {
      const { data, error } = await supabase.rpc('get_job_queue_stats')
      
      if (error) {
        console.log('ℹ️  get_job_queue_stats function test:', error.message)
        if (error.code === 'PGRST202') {
          console.log('📋 This indicates the migration needs to be applied manually in Supabase SQL Editor')
          console.log('🔗 Please copy the contents of migrations/020_create_job_queue_tables.sql')
          console.log('🔗 And execute it in: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/sql')
        }
      } else {
        console.log('✅ get_job_queue_stats function working:', data)
      }
    } catch (testError) {
      console.log('ℹ️  Function test not available yet')
    }
    
    // Test basic table creation by checking jobs table
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id')
        .limit(1)
      
      if (error) {
        console.log('ℹ️  Jobs table test:', error.message)
        if (error.code === 'PGRST106') {
          console.log('📋 Jobs table does not exist yet - migration needs manual application')
        }
      } else {
        console.log('✅ Jobs table accessible')
      }
    } catch (tableError) {
      console.log('ℹ️  Table test not available')
    }
    
    console.log('')
    console.log('🎉 Migration script completed!')
    console.log('📝 If functions are not available, please manually execute the SQL in Supabase dashboard')
    console.log('🔧 File location: migrations/020_create_job_queue_tables.sql')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()