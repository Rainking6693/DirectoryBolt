// Apply AutoBolt SQL to Supabase database
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyAutoBoltSQL() {
  console.log('🏗️ Applying AutoBolt SQL to Supabase database...')
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('supabase-autobolt-simple.sql', 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`)
        
        // Try to execute via RPC first
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.log(`⚠️ RPC execution failed: ${error.message}`)
          
          // Try alternative approach - test if table exists
          if (statement.includes('CREATE TABLE')) {
            const tableName = extractTableName(statement)
            if (tableName) {
              console.log(`📝 Testing if table ${tableName} exists...`)
              const { error: testError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1)
              
              if (testError && testError.message.includes('Could not find the table')) {
                console.log(`❌ Table ${tableName} does not exist - needs manual creation`)
              } else {
                console.log(`✅ Table ${tableName} already exists`)
              }
            }
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
        
      } catch (err) {
        console.log(`❌ Error executing statement ${i + 1}: ${err.message}`)
      }
    }
    
    // Test all tables
    console.log('🧪 Testing AutoBolt tables...')
    await testAutoBoltTables()
    
  } catch (error) {
    console.error('❌ Error applying AutoBolt SQL:', error)
  }
}

function extractTableName(statement) {
  const match = statement.match(/CREATE TABLE\s+(\w+)/i)
  return match ? match[1] : null
}

async function testAutoBoltTables() {
  const tables = [
    'autobolt_processing_queue',
    'autobolt_extension_status',
    'autobolt_processing_history'
  ]
  
  let allTablesExist = true
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error && error.message.includes('Could not find the table')) {
        console.log(`❌ ${tableName} - NOT FOUND`)
        allTablesExist = false
      } else if (error) {
        console.log(`⚠️ ${tableName} - EXISTS but has issues: ${error.message}`)
      } else {
        console.log(`✅ ${tableName} - EXISTS and accessible`)
      }
    } catch (err) {
      console.log(`❌ ${tableName} - ERROR: ${err.message}`)
      allTablesExist = false
    }
  }
  
  if (allTablesExist) {
    console.log('🎉 All AutoBolt tables are ready!')
  } else {
    console.log('📋 Some tables are missing - manual creation required')
    console.log('📄 Please run the SQL from supabase-autobolt-simple.sql in Supabase SQL Editor')
  }
  
  return allTablesExist
}

async function main() {
  console.log('🚀 Starting AutoBolt SQL application...')
  await applyAutoBoltSQL()
  console.log('✅ AutoBolt SQL application complete!')
}

main().catch(console.error)
