#!/usr/bin/env node

/**
 * DIRECT SUPABASE SCHEMA EXECUTION
 * 
 * This script executes the database schema by creating tables individually
 * using Supabase's REST API approach
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

class DirectSchemaExecutor {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  async executeCustomerTable() {
    console.log('🔧 Creating customers table using direct SQL...');
    
    // Since we can't execute raw SQL through the client API,
    // let's create a comprehensive SQL file for manual execution
    const sqlSchema = fs.readFileSync('./lib/database/supabase-schema.sql', 'utf8');
    
    console.log('\n📋 MANUAL DEPLOYMENT REQUIRED');
    console.log('=' .repeat(50));
    console.log('\n🎯 YOU MUST EXECUTE THIS SQL MANUALLY:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/sql');
    console.log('2. Copy the ENTIRE SQL schema below');
    console.log('3. Paste into Supabase SQL Editor');
    console.log('4. Click RUN');
    console.log('\n' + '='.repeat(80));
    console.log('📄 SQL SCHEMA TO EXECUTE:');
    console.log('='.repeat(80));
    console.log(sqlSchema);
    console.log('='.repeat(80));
    
    // Save the complete SQL to a separate file for easy copying
    const deploymentSQLPath = './EXECUTE_THIS_SQL_IN_SUPABASE.sql';
    fs.writeFileSync(deploymentSQLPath, sqlSchema);
    console.log(`\n📄 SQL saved to: ${deploymentSQLPath}`);
    console.log('💡 You can copy the SQL from this file and paste it into Supabase Dashboard');
    
    return false;
  }

  async testTables() {
    console.log('\n🧪 Testing if tables exist...');
    
    const tables = ['customers', 'queue_history', 'customer_notifications', 'directory_submissions'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results[table] = { exists: false, error: error.message };
          console.log(`❌ ${table}: Not found`);
        } else {
          results[table] = { exists: true };
          console.log(`✅ ${table}: Exists`);
        }
      } catch (err) {
        results[table] = { exists: false, error: err.message };
        console.log(`❌ ${table}: Error - ${err.message}`);
      }
    }
    
    const allExist = Object.values(results).every(r => r.exists);
    
    if (allExist) {
      console.log('\n🎉 All tables exist! Schema deployment is complete.');
      return true;
    } else {
      console.log('\n⚠️  Some tables are missing. Manual SQL execution required.');
      return false;
    }
  }

  async execute() {
    console.log('🚀 Direct Supabase Schema Executor');
    console.log('=' .repeat(40));
    
    // Test if tables already exist
    const tablesExist = await this.testTables();
    
    if (tablesExist) {
      console.log('\n✅ Schema is already deployed!');
      return true;
    }
    
    // Generate manual deployment instructions
    await this.executeCustomerTable();
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Execute the SQL in Supabase Dashboard (see instructions above)');
    console.log('2. Run: node complete-supabase-deployment.js');
    console.log('3. The automated migration will then proceed');
    
    return false;
  }
}

async function main() {
  const executor = new DirectSchemaExecutor();
  
  try {
    const success = await executor.execute();
    process.exit(success ? 0 : 2);
  } catch (error) {
    console.error('Execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DirectSchemaExecutor };