// Create a simple AutoBolt submissions table for tracking directory submissions
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const managementApiKey = process.env.SUPABASE_MANAGEMENT_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !managementApiKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

// Extract project ID from URL
const projectId = supabaseUrl.split('//')[1].split('.')[0]
console.log(`📋 Project ID: ${projectId}`)

async function createAutoBoltSubmissionsTable() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS autobolt_submissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        directory_name VARCHAR(255) NOT NULL,
        directory_url VARCHAR(500),
        submission_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP WITH TIME ZONE,
        approved_at TIMESTAMP WITH TIME ZONE,
        listing_url VARCHAR(500),
        rejection_reason TEXT,
        processing_time_seconds INTEGER,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

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

    const req = require('https').request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200 || res.statusCode === 201) {
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

async function createIndexes() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE INDEX IF NOT EXISTS idx_autobolt_submissions_customer_id ON autobolt_submissions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_autobolt_submissions_status ON autobolt_submissions(submission_status);
      CREATE INDEX IF NOT EXISTS idx_autobolt_submissions_directory_name ON autobolt_submissions(directory_name);
    `

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

    const req = require('https').request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200 || res.statusCode === 201) {
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

async function enableRLS() {
  return new Promise((resolve, reject) => {
    const sql = `
      ALTER TABLE autobolt_submissions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Service role can access all autobolt submissions" ON autobolt_submissions FOR ALL USING (true);
    `

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

    const req = require('https').request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200 || res.statusCode === 201) {
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

async function testTable() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { data, error } = await supabase
      .from('autobolt_submissions')
      .select('*')
      .limit(1)

    if (error && error.message.includes('Could not find the table')) {
      console.log('❌ autobolt_submissions table does not exist')
      return false
    } else if (error) {
      console.log('⚠️ autobolt_submissions table has issues:', error.message)
      return false
    } else {
      console.log('✅ autobolt_submissions table exists and is accessible')
      return true
    }
  } catch (err) {
    console.log('❌ autobolt_submissions table error:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Creating AutoBolt submissions table...')
  
  try {
    console.log('📝 Creating autobolt_submissions table...')
    await createAutoBoltSubmissionsTable()
    console.log('✅ autobolt_submissions table created successfully')
    
    console.log('📝 Creating indexes...')
    await createIndexes()
    console.log('✅ Indexes created successfully')
    
    console.log('📝 Enabling RLS...')
    await enableRLS()
    console.log('✅ RLS enabled successfully')
    
    console.log('🧪 Testing table...')
    const tableExists = await testTable()
    
    if (tableExists) {
      console.log('🎉 AutoBolt submissions table is ready!')
    } else {
      console.log('❌ Table creation failed')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main().catch(console.error)
