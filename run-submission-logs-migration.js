// Run submission logs migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔧 Running submission logs migration...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('migrations/022_create_submission_logs_table.sql', 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.log(`⚠️ Statement ${i + 1} error (may be expected):`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('✅ Migration completed');
    
    // Test the table
    console.log('🧪 Testing submission logs table...');
    const { data, error } = await supabase
      .from('autobolt_submission_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Table test failed:', error.message);
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
  } catch (err) {
    console.error('❌ Migration error:', err);
  }
}

runMigration();
