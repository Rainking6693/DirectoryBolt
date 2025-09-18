const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabaseSchema() {
  console.log('🔄 Setting up Supabase database schema...');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.log('SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
      return;
    }
    
    console.log('✅ Environment variables loaded');
    console.log('   Supabase URL:', supabaseUrl);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'lib', 'database', 'supabase-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return;
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema SQL loaded from:', schemaPath);
    console.log('   SQL length:', schemaSql.length, 'characters');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📝 Executing', statements.length, 'SQL statements...');
    
    // Execute each statement individually
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\\n[${i + 1}/${statements.length}] Executing statement...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          console.log('   Statement:', statement.substring(0, 100) + '...');
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} successful`);
          successCount++;
        }
      } catch (err) {
        // If rpc doesn't work, try direct execution (might not work with DDL)
        console.log(`⚠️  RPC failed, trying alternative approach...`);
        
        // For basic table creation, we can try a different approach
        if (statement.includes('CREATE TABLE')) {
          try {
            // Extract table name and try a simple test query
            const match = statement.match(/CREATE TABLE.*?(\w+)/i);
            if (match) {
              const tableName = match[1];
              console.log(`   Checking if table ${tableName} exists...`);
              
              const { data, error } = await supabase.from(tableName).select('*').limit(0);
              if (!error) {
                console.log(`✅ Table ${tableName} already exists`);
                successCount++;
              } else {
                console.error(`❌ Table ${tableName} does not exist and creation failed`);
                errorCount++;
              }
            }
          } catch (tableError) {
            console.error(`❌ Table check failed:`, tableError.message);
            errorCount++;
          }
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\\n📊 Schema setup summary:');
    console.log('   Successful statements:', successCount);
    console.log('   Failed statements:', errorCount);
    console.log('   Total statements:', statements.length);
    
    // Test basic connectivity to key tables
    console.log('\\n🔍 Testing table accessibility...');
    const testTables = ['customers', 'queue_history', 'customer_notifications'];
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Accessible (${data?.length || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    if (errorCount === 0) {
      console.log('\\n🎉 Database schema setup completed successfully!');
    } else {
      console.log('\\n⚠️  Database schema setup completed with some errors.');
      console.log('   You may need to manually execute failed statements in Supabase dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\\n').slice(0, 5).join('\\n')
    });
  }
}

// Run the setup
setupSupabaseSchema();