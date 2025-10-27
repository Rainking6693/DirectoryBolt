/**
 * Apply Status Column Migration Script
 * Adds status column to customers table
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
  console.log('🚀 Starting status column migration...\n');

  // Parse Supabase connection string
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://postgres:Chartres6693!23$@${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251025_add_status_to_customers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying migration: 20251025_add_status_to_customers.sql');
    
    // Execute migration
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Verify column exists
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'status';
    `);

    if (verifyResult.rows.length > 0) {
      console.log('📊 Status column details:');
      console.table(verifyResult.rows);
    } else {
      throw new Error('Status column was not created');
    }

    // Check customer count with status
    const countResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM customers 
      GROUP BY status;
    `);

    console.log('\n📈 Customer status distribution:');
    console.table(countResult.rows);

    // Verify index
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'customers' AND indexname = 'idx_customers_status';
    `);

    if (indexResult.rows.length > 0) {
      console.log('\n🔍 Index created:');
      console.table(indexResult.rows);
    }

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
applyMigration();
