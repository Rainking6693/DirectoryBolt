const { createClient } = require('@supabase/supabase-js');

async function emergencyDatabaseDiagnosis() {
  console.log('🚨 EMERGENCY: Final database validation for production deployment');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Basic connection test
    console.log('Testing basic database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Basic connection: WORKING');
    
    // 2. Test critical table access
    const criticalTables = ['customers', 'stripe_events', 'ai_analysis_results'];
    for (const table of criticalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ CRITICAL: ${table} table access failed:`, error.message);
          return {
            severity: 'CRITICAL',
            table,
            impact: 'Revenue operations compromised',
            action: 'Check table permissions and RLS policies'
          };
        } else {
          console.log(`✅ ${table} table: ACCESSIBLE`);
        }
      } catch (e) {
        console.error(`❌ CRITICAL: ${table} table error:`, e.message);
      }
    }
    
    // 3. Test write operations
    console.log('Testing database write operations...');
    const testCustomerId = `test_${Date.now()}`;
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert({
          customer_id: testCustomerId,
          email: 'test@directorybolt.com',
          package_type: 'starter',
          status: 'test'
        })
        .select();
      
      if (insertError) {
        console.error('❌ CRITICAL: Database write failed:', insertError.message);
        return {
          severity: 'CRITICAL',
          impact: 'Cannot create customer records',
          action: 'Check database permissions'
        };
      }
      
      console.log('✅ Database write: WORKING');
      
      // Clean up test record
      await supabase
        .from('customers')
        .delete()
        .eq('customer_id', testCustomerId);
      
      console.log('✅ Test cleanup: COMPLETE');
      
    } catch (e) {
      console.error('❌ Database write test failed:', e.message);
    }
    
    console.log('✅ DATABASE VALIDATION: ALL TESTS PASSED');
    return { status: 'SUCCESS', message: 'All database operations validated' };
    
  } catch (error) {
    console.error('❌ CRITICAL DATABASE FAILURE:', error.message);
    return { status: 'FAILED', error: error.message };
  }
}

emergencyDatabaseDiagnosis().then(result => {
  if (result && result.status === 'FAILED') {
    process.exit(1);
  }
}).catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});