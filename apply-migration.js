const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres.kolgqfjgncdwddziqloz:DirectoryBolt2025!@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✓ Connected\n');

    const migrationSQL = fs.readFileSync('supabase/migrations/20251007_add_business_fields_to_jobs.sql', 'utf8');

    console.log('Migration SQL to execute:');
    console.log(migrationSQL);
    console.log('\n=== Executing migration ===\n');

    await client.query(migrationSQL);
    console.log('✓ Migration applied successfully!\n');

    console.log('=== Verifying columns ===\n');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'jobs'
      AND column_name IN (
        'business_name', 'email', 'phone', 'website', 'address',
        'city', 'state', 'zip', 'description', 'category',
        'directory_limit', 'package_type'
      )
      ORDER BY column_name
    `);

    console.log('Columns now in jobs table:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });

    console.log(`\nTotal columns verified: ${result.rows.length}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
