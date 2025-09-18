#!/usr/bin/env node

/**
 * DIRECT POSTGRESQL SQL EXECUTOR FOR SUPABASE
 * Executes SQL directly via PostgreSQL connection
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function executeSQL() {
  console.log('🚀 EXECUTING SQL DIRECTLY VIA POSTGRESQL...');
  
  try {
    // Install pg if not available
    let pg;
    try {
      pg = require('pg');
    } catch (error) {
      console.log('📦 Installing PostgreSQL client...');
      const { execSync } = require('child_process');
      execSync('npm install pg', { stdio: 'inherit' });
      pg = require('pg');
    }
    
    const { Client } = pg;
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    console.log('🔗 Connecting to PostgreSQL database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    console.log('📖 Reading SQL schema file...');
    const sqlContent = fs.readFileSync('EXECUTE_THIS_SQL_IN_SUPABASE.sql', 'utf8');
    
    console.log('🔨 Executing complete SQL schema...');
    const result = await client.query(sqlContent);
    
    console.log('✅ SQL EXECUTION COMPLETED SUCCESSFULLY');
    console.log(`📊 Result: ${result.command || 'Multiple commands executed'}`);
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('customers', 'queue_history', 'customer_notifications', 'directory_submissions', 'analytics_events', 'batch_operations')
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    await client.end();
    console.log('🎯 SQL EXECUTION AND VERIFICATION COMPLETE');
    
    return { success: true, tablesCreated: tables.rows.length };
    
  } catch (error) {
    console.error('💥 SQL EXECUTION FAILED:', error.message);
    throw error;
  }
}

if (require.main === module) {
  executeSQL()
    .then((result) => {
      console.log('🏆 DATABASE SCHEMA DEPLOYMENT SUCCESSFUL');
      console.log(`✅ ${result.tablesCreated} tables verified`);
    })
    .catch(error => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { executeSQL };