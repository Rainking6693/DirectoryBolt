const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kolgqfjgncdwddziqloz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc'
);

async function verifyMigration() {
  try {
    console.log('Querying jobs table schema...\n');

    // Try to select with all the new columns
    const { data, error } = await supabase
      .from('jobs')
      .select('id, business_name, email, phone, website, address, city, state, zip, description, category, directory_limit, package_type')
      .limit(1);

    if (error) {
      console.error('❌ Error querying jobs table:', error.message);
      console.error('\nThis likely means the columns do not exist yet.');
      process.exit(1);
    }

    console.log('✓ Migration verified successfully!\n');
    console.log('The following columns now exist in the jobs table:');
    console.log('  ✓ business_name');
    console.log('  ✓ email');
    console.log('  ✓ phone');
    console.log('  ✓ website');
    console.log('  ✓ address');
    console.log('  ✓ city');
    console.log('  ✓ state');
    console.log('  ✓ zip');
    console.log('  ✓ description');
    console.log('  ✓ category');
    console.log('  ✓ directory_limit');
    console.log('  ✓ package_type');

    if (data && data.length > 0) {
      console.log('\nSample row structure:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\n(No existing jobs in table to display)');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

verifyMigration();
