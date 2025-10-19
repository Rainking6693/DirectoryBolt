/**
 * Get a test directory for selector discovery
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kolgqfjgncdwddziqloz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc';

async function getTestDirectory() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get a directory with a submission URL
  const { data, error } = await supabase
    .from('directories')
    .select('id, name, submission_url, field_selectors, selectors_updated_at')
    .not('submission_url', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error fetching directories:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No directories with submission URLs found.');
    process.exit(0);
  }

  console.log(`Found ${data.length} directories:\n`);
  data.forEach((dir, i) => {
    console.log(`${i + 1}. ${dir.name}`);
    console.log(`   ID: ${dir.id}`);
    console.log(`   URL: ${dir.submission_url}`);
    console.log(`   Has selectors: ${dir.field_selectors && Object.keys(dir.field_selectors).length > 0 ? 'Yes' : 'No'}`);
    console.log(`   Last updated: ${dir.selectors_updated_at || 'Never'}`);
    console.log();
  });

  console.log(`\nTo test discovery on a directory, run:`);
  console.log(`node run-discovery.js single ${data[0].id}`);
}

getTestDirectory();
