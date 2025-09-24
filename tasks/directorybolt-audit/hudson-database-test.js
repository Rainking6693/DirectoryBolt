// Hudson's Database Validation Test
// Verifying Emily's claims about database schema and functionality

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function hudsonDatabaseValidation() {
  console.log('🔒 HUDSON\'S SECURITY AUDIT - Database Validation');
  console.log('================================================');
  
  const results = {
    connection: false,
    tables: {
      autobolt_processing_queue: false,
      directory_submissions: false,
      autobolt_extension_status: false,
      autobolt_processing_history: false
    },
    functions: {
      get_queue_stats: false,
      get_customer_progress: false,
      get_next_job_in_queue: false,
      get_job_progress_for_staff: false,
      complete_autobolt_job: false,
      update_job_progress: false,
      update_updated_at_column: false
    },
    indexes: 0,
    security: {
      rls_enabled: false,
      policies_exist: false
    }
  };

  try {
    // Test database connection
    console.log('\\n1. 🔍 Testing Database Connection...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials');
      console.log('   SUPABASE_URL:', !!supabaseUrl);
      console.log('   SERVICE_KEY:', !!supabaseServiceKey);
      return results;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return results;
    }
    
    results.connection = true;
    console.log('✅ Database connection successful');
    
    // Test Emily's claimed tables
    console.log('\\n2. 🔍 Validating Emily\\'s Claimed Tables...');
    const claimedTables = [
      'autobolt_processing_queue',
      'directory_submissions', 
      'autobolt_extension_status',
      'autobolt_processing_history'
    ];
    
    for (const tableName of claimedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          results.tables[tableName] = true;
          console.log(`   ✅ ${tableName} - EXISTS`);
        } else {
          console.log(`   ❌ ${tableName} - NOT FOUND (${error.message})`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName} - ERROR: ${err.message}`);
      }
    }
    
    // Test Emily's claimed functions
    console.log('\\n3. 🔍 Validating Emily\\'s Claimed Functions...');
    const claimedFunctions = [
      'get_queue_stats',
      'get_customer_progress', 
      'get_next_job_in_queue',
      'get_job_progress_for_staff',
      'complete_autobolt_job',
      'update_job_progress'
    ];
    
    for (const funcName of claimedFunctions) {
      try {
        // Test if function exists by calling it (some may fail due to parameters)
        if (funcName === 'get_queue_stats') {
          const { data, error } = await supabase.rpc(funcName);
          results.functions[funcName] = !error;
          console.log(`   ${!error ? '✅' : '❌'} ${funcName} - ${!error ? 'EXISTS' : error.message}`);
        } else if (funcName === 'get_job_progress_for_staff') {
          const { data, error } = await supabase.rpc(funcName);
          results.functions[funcName] = !error;
          console.log(`   ${!error ? '✅' : '❌'} ${funcName} - ${!error ? 'EXISTS' : error.message}`);
        } else {
          // For functions requiring parameters, just check if they exist in schema
          const { data, error } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_name', funcName)
            .eq('routine_schema', 'public');
          
          const exists = data && data.length > 0;
          results.functions[funcName] = exists;
          console.log(`   ${exists ? '✅' : '❌'} ${funcName} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
        }
      } catch (err) {
        console.log(`   ❌ ${funcName} - ERROR: ${err.message}`);
      }
    }
    
    // Check for indexes
    console.log('\\n4. 🔍 Validating Performance Indexes...');
    try {
      const { data: indexes, error } = await supabase
        .from('pg_indexes')
        .select('indexname, tablename')
        .in('tablename', claimedTables);
      
      if (!error && indexes) {
        results.indexes = indexes.length;
        console.log(`   ✅ Found ${indexes.length} indexes`);
        indexes.forEach(idx => {
          console.log(`      - ${idx.indexname} on ${idx.tablename}`);
        });
      } else {
        console.log(`   ❌ Could not retrieve indexes: ${error?.message}`);
      }
    } catch (err) {
      console.log(`   ❌ Index check failed: ${err.message}`);
    }
    
    // Check RLS security
    console.log('\\n5. 🔍 Security Validation (RLS Policies)...');
    try {
      for (const tableName of claimedTables) {
        const { data: rlsData, error } = await supabase
          .from('pg_tables')
          .select('rowsecurity')
          .eq('tablename', tableName)
          .eq('schemaname', 'public');
        
        if (!error && rlsData && rlsData.length > 0) {
          const hasRLS = rlsData[0].rowsecurity;
          if (hasRLS) {
            results.security.rls_enabled = true;
            console.log(`   ✅ ${tableName} - RLS enabled`);
          } else {
            console.log(`   ⚠️  ${tableName} - RLS disabled`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ RLS check failed: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
  }
  
  // Generate Hudson's verdict
  console.log('\\n🔒 HUDSON\\'S SECURITY VERDICT');
  console.log('==============================');
  
  const tablesExist = Object.values(results.tables).filter(Boolean).length;
  const functionsExist = Object.values(results.functions).filter(Boolean).length;
  
  console.log(`Database Connection: ${results.connection ? '✅' : '❌'}`);
  console.log(`Tables Found: ${tablesExist}/4 (${tablesExist === 4 ? '✅' : '❌'})`);
  console.log(`Functions Found: ${functionsExist}/6 (${functionsExist >= 4 ? '✅' : '❌'})`);
  console.log(`Indexes Found: ${results.indexes} (Emily claimed 11)`);
  console.log(`Security (RLS): ${results.security.rls_enabled ? '✅' : '❌'}`);
  
  // Final assessment
  const overallScore = (
    (results.connection ? 25 : 0) +
    (tablesExist * 15) +
    (functionsExist * 8) +
    (results.indexes > 5 ? 15 : results.indexes * 3) +
    (results.security.rls_enabled ? 10 : 0)
  );
  
  console.log(`\\nOverall Score: ${overallScore}/100`);
  
  if (overallScore >= 80) {
    console.log('🎉 HUDSON VERDICT: APPROVED - Emily\\'s database claims are substantially verified');
  } else if (overallScore >= 60) {
    console.log('⚠️  HUDSON VERDICT: PARTIAL - Some issues but core functionality exists');
  } else {
    console.log('❌ HUDSON VERDICT: REJECTED - Significant issues with Emily\\'s claims');
  }
  
  return results;
}

// Run Hudson's validation
hudsonDatabaseValidation().catch(console.error);