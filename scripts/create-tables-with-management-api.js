// Create AutoBolt tables using Supabase Management API
const https = require('https')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const managementApiKey = process.env.SUPABASE_MANAGEMENT_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

if (!managementApiKey) {
  console.error('❌ Missing Supabase Management API key')
  console.log('📋 Please add SUPABASE_MANAGEMENT_API_KEY to your .env.local file')
  console.log('📋 Get your token from: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

// Extract project ID from URL
const projectId = supabaseUrl.split('//')[1].split('.')[0]
console.log(`📋 Project ID: ${projectId}`)

async function createTableViaManagementAPI(tableName, sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql
    })

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectId}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${managementApiKey}`,
        'apikey': managementApiKey
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200) {
            resolve(result)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`))
        }
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    req.write(postData)
    req.end()
  })
}

async function createAutoBoltTables() {
  console.log('🏗️ Creating AutoBolt tables via Management API...')
  
  const tables = [
    {
      name: 'autobolt_processing_queue',
      sql: `
        CREATE TABLE autobolt_processing_queue (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id VARCHAR(50) NOT NULL,
          business_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          package_type VARCHAR(50) NOT NULL,
          directory_limit INTEGER NOT NULL,
          priority_level INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'queued',
          action VARCHAR(50) DEFAULT 'start_processing',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by VARCHAR(100) DEFAULT 'staff_dashboard',
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `
    },
    {
      name: 'autobolt_extension_status',
      sql: `
        CREATE TABLE autobolt_extension_status (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          extension_id VARCHAR(100) UNIQUE NOT NULL,
          status VARCHAR(50) DEFAULT 'offline',
          last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          current_customer_id VARCHAR(50),
          current_queue_id UUID,
          processing_started_at TIMESTAMP WITH TIME ZONE,
          directories_processed INTEGER DEFAULT 0,
          directories_failed INTEGER DEFAULT 0,
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'autobolt_processing_history',
      sql: `
        CREATE TABLE autobolt_processing_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          queue_id UUID,
          customer_id VARCHAR(50) NOT NULL,
          session_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
          session_completed_at TIMESTAMP WITH TIME ZONE,
          total_directories INTEGER NOT NULL,
          directories_completed INTEGER DEFAULT 0,
          directories_failed INTEGER DEFAULT 0,
          success_rate DECIMAL(5,2) DEFAULT 0.00,
          processing_time_seconds INTEGER,
          status VARCHAR(50) DEFAULT 'in_progress',
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ]

  for (const table of tables) {
    try {
      console.log(`📝 Creating ${table.name} table...`)
      const result = await createTableViaManagementAPI(table.name, table.sql)
      console.log(`✅ Created ${table.name} table successfully`)
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ ${table.name} table already exists`)
      } else {
        console.log(`❌ Failed to create ${table.name}: ${error.message}`)
      }
    }
  }

  // Create indexes
  console.log('📝 Creating indexes...')
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_autobolt_queue_customer_id ON autobolt_processing_queue(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_autobolt_queue_status ON autobolt_processing_queue(status);',
    'CREATE INDEX IF NOT EXISTS idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);',
    'CREATE INDEX IF NOT EXISTS idx_extension_status_extension_id ON autobolt_extension_status(extension_id);',
    'CREATE INDEX IF NOT EXISTS idx_processing_history_customer_id ON autobolt_processing_history(customer_id);'
  ]

  for (const indexSQL of indexes) {
    try {
      await createTableViaManagementAPI('index', indexSQL)
      console.log('✅ Index created successfully')
    } catch (error) {
      console.log(`⚠️ Index creation warning: ${error.message}`)
    }
  }

  // Enable RLS
  console.log('📝 Enabling RLS...')
  const rlsStatements = [
    'ALTER TABLE autobolt_processing_queue ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE autobolt_extension_status ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE autobolt_processing_history ENABLE ROW LEVEL SECURITY;'
  ]

  for (const rlsSQL of rlsStatements) {
    try {
      await createTableViaManagementAPI('rls', rlsSQL)
      console.log('✅ RLS enabled successfully')
    } catch (error) {
      console.log(`⚠️ RLS warning: ${error.message}`)
    }
  }

  // Create RLS policies
  console.log('📝 Creating RLS policies...')
  const policies = [
    'CREATE POLICY "Service role can access all autobolt data" ON autobolt_processing_queue FOR ALL USING (true);',
    'CREATE POLICY "Service role can access all extension status" ON autobolt_extension_status FOR ALL USING (true);',
    'CREATE POLICY "Service role can access all processing history" ON autobolt_processing_history FOR ALL USING (true);'
  ]

  for (const policySQL of policies) {
    try {
      await createTableViaManagementAPI('policy', policySQL)
      console.log('✅ Policy created successfully')
    } catch (error) {
      console.log(`⚠️ Policy warning: ${error.message}`)
    }
  }
}

async function testTables() {
  console.log('🧪 Testing AutoBolt tables...')
  
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

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
    console.log('📋 Some tables are missing')
  }

  return allTablesExist
}

async function main() {
  console.log('🚀 Starting AutoBolt table creation via Management API...')
  try {
    await createAutoBoltTables()
    await testTables()
    console.log('✅ AutoBolt table creation complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('📋 Please check your Supabase Management API key')
    console.log('📋 Get your token from: https://supabase.com/dashboard/account/tokens')
  }
}

main().catch(console.error)
