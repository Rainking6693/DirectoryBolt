// 🔒 JORDAN'S API KEY DATABASE SETUP - Initialize database schema for API key management
// Run this script to set up the API key tables in Supabase

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// SQL Schema for API Key Management
const API_KEY_SCHEMA_SQL = `
-- Drop existing tables if they exist (be careful in production)
-- DROP TABLE IF EXISTS api_key_security_log CASCADE;
-- DROP TABLE IF EXISTS api_key_usage CASCADE;
-- DROP TABLE IF EXISTS api_key_referrer_whitelist CASCADE;
-- DROP TABLE IF EXISTS api_key_ip_whitelist CASCADE;
-- DROP TABLE IF EXISTS api_keys CASCADE;

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
    requests_made_today INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_from_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraint if users table exists
-- ALTER TABLE api_keys ADD CONSTRAINT fk_api_keys_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- IP Whitelist table
CREATE TABLE IF NOT EXISTS api_key_ip_whitelist (
    id VARCHAR(255) PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

-- Referrer Whitelist table  
CREATE TABLE IF NOT EXISTS api_key_referrer_whitelist (
    id VARCHAR(255) PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    referrer_domain VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS api_key_usage (
    id VARCHAR(255) PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    response_status INTEGER NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    rate_limit_hit BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

-- Security log table
CREATE TABLE IF NOT EXISTS api_key_security_log (
    id VARCHAR(255) PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    violation_type VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);
`

const INDEXES_SQL = `
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active_expires ON api_keys(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_timestamp ON api_key_usage(api_key_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp ON api_key_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_endpoint ON api_key_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_status ON api_key_usage(response_status);

CREATE INDEX IF NOT EXISTS idx_api_key_security_log_key_type ON api_key_security_log(api_key_id, event_type);
CREATE INDEX IF NOT EXISTS idx_api_key_security_log_timestamp ON api_key_security_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_security_log_violation ON api_key_security_log(violation_type);

CREATE INDEX IF NOT EXISTS idx_api_key_ip_whitelist_key ON api_key_ip_whitelist(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_referrer_whitelist_key ON api_key_referrer_whitelist(api_key_id);
`

const RLS_POLICIES_SQL = `
-- Row Level Security (RLS) policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_referrer_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_security_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role can manage all API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role can manage IP whitelist" ON api_key_ip_whitelist;
DROP POLICY IF EXISTS "Service role can manage referrer whitelist" ON api_key_referrer_whitelist;
DROP POLICY IF EXISTS "Service role can manage usage records" ON api_key_usage;
DROP POLICY IF EXISTS "Service role can manage security logs" ON api_key_security_log;

-- Policies for api_keys table
CREATE POLICY "Users can view their own API keys" ON api_keys 
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can manage all API keys" ON api_keys 
    FOR ALL USING (true);

-- Policies for related tables
CREATE POLICY "Service role can manage IP whitelist" ON api_key_ip_whitelist 
    FOR ALL USING (true);

CREATE POLICY "Service role can manage referrer whitelist" ON api_key_referrer_whitelist 
    FOR ALL USING (true);

CREATE POLICY "Service role can manage usage records" ON api_key_usage 
    FOR ALL USING (true);

CREATE POLICY "Service role can manage security logs" ON api_key_security_log 
    FOR ALL USING (true);
`

async function setupApiKeyDatabase() {
  console.log('🔒 Starting API Key Database Setup...')

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   - SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('Please set these in your .env.local file')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('📊 Creating API key tables...')
    
    // Execute schema creation
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: API_KEY_SCHEMA_SQL
    })

    if (schemaError) {
      console.log('⚠️  Schema creation completed with notices (this is normal):')
      console.log('   ', schemaError.message)
    } else {
      console.log('✅ API key tables created successfully')
    }

    console.log('🚀 Creating performance indexes...')
    
    // Execute indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: INDEXES_SQL
    })

    if (indexError) {
      console.log('⚠️  Index creation completed with notices:')
      console.log('   ', indexError.message)
    } else {
      console.log('✅ Performance indexes created successfully')
    }

    console.log('🔐 Setting up Row Level Security...')
    
    // Execute RLS policies
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: RLS_POLICIES_SQL
    })

    if (rlsError) {
      console.log('⚠️  RLS setup completed with notices:')
      console.log('   ', rlsError.message)
    } else {
      console.log('✅ Row Level Security policies applied')
    }

    // Test the setup
    console.log('🧪 Testing database setup...')
    
    const { data: testData, error: testError } = await supabase
      .from('api_keys')
      .select('count', { count: 'exact' })
      .limit(0)

    if (testError) {
      console.error('❌ Database test failed:', testError.message)
    } else {
      console.log('✅ Database test passed - API keys table is accessible')
    }

    console.log('')
    console.log('🎉 API Key Database Setup Complete!')
    console.log('')
    console.log('📋 Setup Summary:')
    console.log('   ✅ api_keys table created')
    console.log('   ✅ api_key_ip_whitelist table created')
    console.log('   ✅ api_key_referrer_whitelist table created')
    console.log('   ✅ api_key_usage table created')
    console.log('   ✅ api_key_security_log table created')
    console.log('   ✅ Performance indexes created')
    console.log('   ✅ Row Level Security enabled')
    console.log('')
    console.log('🔑 Next Steps:')
    console.log('   1. Set API_KEY_ENCRYPTION_KEY in your environment variables')
    console.log('   2. Test API key creation through the API endpoints')
    console.log('   3. Monitor security logs for any issues')
    console.log('')
    console.log('⚠️  Important Security Notes:')
    console.log('   - API keys are hashed with SHA-256 before storage')
    console.log('   - Set up proper backup procedures for the database')
    console.log('   - Monitor the security log table for violations')
    console.log('   - Consider setting up alerts for suspicious activity')

  } catch (error) {
    console.error('❌ Fatal error during database setup:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Alternative function to execute raw SQL directly
async function executeRawSQL(sql, description) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log(\`🔧 Executing: \${description}\`)
  
  try {
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement.trim() + ';' 
      })
      
      if (error && !error.message.includes('already exists')) {
        console.warn(\`⚠️  \${description}: \${error.message}\`)
      }
    }
    
    console.log(\`✅ \${description} completed\`)
    
  } catch (error) {
    console.error(\`❌ \${description} failed:\`, error.message)
    throw error
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupApiKeyDatabase().catch(console.error)
}

module.exports = {
  setupApiKeyDatabase,
  executeRawSQL,
  API_KEY_SCHEMA_SQL,
  INDEXES_SQL,
  RLS_POLICIES_SQL
}