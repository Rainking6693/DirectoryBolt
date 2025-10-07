const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.kolgqfjgncdwddziqloz',
    password: 'DirectoryBolt2025!',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✓ Connected\n');

    const migrationSQL = fs.readFileSync('temp_migration.sql', 'utf8');

    console.log('=== Executing Migration ===\n');
    console.log(migrationSQL);
    console.log('\n');

    await client.query(migrationSQL);
    console.log('✓ Migration applied successfully!\n');

    console.log('=== Verifying Columns ===\n');

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

    console.log('Columns in jobs table:');
    result.rows.forEach(row => {
      const def = row.column_default || 'none';
      console.log(`  ✓ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable}, default: ${def})`);
    });

    console.log(`\n✓ Total columns verified: ${result.rows.length}/12`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

runMigration();
