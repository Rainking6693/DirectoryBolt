const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function emergencyDatabaseAudit() {
  console.log('🚨 EMERGENCY DATABASE AUDIT - DirectoryBolt');
  console.log('==============================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');
  
  const results = {
    connection: null,
    tables: {},
    customerData: null,
    performance: {},
    criticalIssues: [],
    recommendations: []
  };
  
  // 1. CONFIGURATION CHECK
  console.log('🔍 STEP 1: Configuration Verification');
  console.log('-------------------------------------');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl ? '✅ CONFIGURED' : '❌ MISSING');
  console.log('Service Key:', supabaseKey ? '✅ CONFIGURED' : '❌ MISSING');
  console.log('Project ID:', supabaseUrl ? supabaseUrl.split('//')[1].split('.')[0] : 'N/A');
  
  if (!supabaseUrl || !supabaseKey) {
    results.criticalIssues.push('MISSING_SUPABASE_CONFIGURATION');
    console.error('❌ CRITICAL: Missing Supabase configuration');
    return results;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // 2. CONNECTION TEST
  console.log('\n🔌 STEP 2: Database Connection Test');
  console.log('-----------------------------------');
  
  try {
    const connectionStart = Date.now();
    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const connectionTime = Date.now() - connectionStart;
    results.performance.connectionTime = connectionTime;
    
    if (error) {
      results.criticalIssues.push(`CONNECTION_FAILED: ${error.message}`);
      console.error('❌ Connection failed:', error.message);
      return results;
    }
    
    results.connection = 'SUCCESS';
    console.log('✅ Database connection successful');
    console.log('   Response time:', connectionTime + 'ms');
    console.log('   Customer count:', count || 0);
    
    if (connectionTime > 2000) {
      results.criticalIssues.push('SLOW_CONNECTION_TIME');
      console.warn('⚠️  WARNING: Slow connection time (' + connectionTime + 'ms)');
    }
    
  } catch (error) {
    results.criticalIssues.push(`CONNECTION_ERROR: ${error.message}`);
    console.error('❌ CRITICAL CONNECTION ERROR:', error.message);
    return results;
  }
  
  // 3. TABLE STRUCTURE VERIFICATION
  console.log('\n📋 STEP 3: Table Structure Verification');
  console.log('---------------------------------------');
  
  const requiredTables = [
    'customers',
    'queue_history', 
    'customer_notifications',
    'directory_submissions',
    'analytics_events',
    'batch_operations'
  ];
  
  for (const table of requiredTables) {
    try {
      const start = Date.now();
      const { data, error } = await supabase.from(table).select('*').limit(1);
      const queryTime = Date.now() - start;
      
      if (error) {
        results.tables[table] = { status: 'ERROR', error: error.message, queryTime };
        console.log('❌ Table "' + table + '": ERROR - ' + error.message);
        
        if (table === 'customers') {
          results.criticalIssues.push('CUSTOMERS_TABLE_MISSING');
        }
      } else {
        results.tables[table] = { status: 'EXISTS', queryTime, recordCount: data?.length || 0 };
        console.log('✅ Table "' + table + '": EXISTS (' + queryTime + 'ms)');
        
        if (queryTime > 1000) {
          results.criticalIssues.push(`SLOW_QUERY_${table.toUpperCase()}`);
        }
      }
    } catch (e) {
      results.tables[table] = { status: 'CRITICAL_ERROR', error: e.message };
      console.log('❌ Table "' + table + '": CRITICAL ERROR - ' + e.message);
      results.criticalIssues.push(`TABLE_ACCESS_ERROR_${table.toUpperCase()}`);
    }
  }
  
  // 4. CUSTOMER DATA INTEGRITY CHECK
  console.log('\n👥 STEP 4: Customer Data Integrity Check');
  console.log('----------------------------------------');
  
  if (results.tables.customers?.status === 'EXISTS') {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('customer_id, email, business_name, status, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        results.criticalIssues.push(`CUSTOMER_DATA_ERROR: ${error.message}`);
        console.error('❌ Customer data query failed:', error.message);
      } else {
        results.customerData = {
          totalCustomers: customers.length,
          customers: customers
        };
        
        console.log('✅ Retrieved customer data successfully');
        console.log('   Total customers:', customers.length);
        
        // Check for data quality issues
        let dataIssues = 0;
        customers.forEach((customer, index) => {
          if (!customer.customer_id || !customer.customer_id.match(/^DIR-\d{8}-\d{6}$/)) {
            dataIssues++;
            console.warn('⚠️  Invalid customer ID format:', customer.customer_id);
          }
          if (!customer.email || customer.email === '') {
            dataIssues++;
            console.warn('⚠️  Missing email for customer:', customer.customer_id);
          }
        });
        
        if (dataIssues > 0) {
          results.criticalIssues.push(`DATA_QUALITY_ISSUES: ${dataIssues} issues found`);
        }
        
        console.log('   Data quality issues:', dataIssues);
      }
    } catch (error) {
      results.criticalIssues.push(`CUSTOMER_DATA_ACCESS_ERROR: ${error.message}`);
      console.error('❌ Critical error accessing customer data:', error.message);
    }
  }
  
  // 5. API ENDPOINT HEALTH CHECK
  console.log('\n🔗 STEP 5: API Endpoint Health Check');
  console.log('------------------------------------');
  
  const endpointTests = [
    { endpoint: '/api/health', method: 'GET' },
    { endpoint: '/api/health/supabase', method: 'GET' },
    { endpoint: '/api/customer/validate', method: 'POST', body: { customerId: 'DIR-20250918-000001' } }
  ];
  
  // We'll just verify the service functions work since we can't easily test HTTP endpoints
  try {
    // Test customer validation function
    const testCustomerId = results.customerData?.customers?.[0]?.customer_id;
    if (testCustomerId) {
      const { data: validationResult, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_id', testCustomerId)
        .single();
      
      if (error) {
        console.log('❌ Customer validation test failed:', error.message);
        results.criticalIssues.push('CUSTOMER_VALIDATION_FAILED');
      } else {
        console.log('✅ Customer validation working');
      }
    }
  } catch (error) {
    console.log('❌ API health check failed:', error.message);
    results.criticalIssues.push('API_HEALTH_CHECK_FAILED');
  }
  
  // 6. PERFORMANCE ANALYSIS
  console.log('\n⚡ STEP 6: Performance Analysis');
  console.log('------------------------------');
  
  const performanceThresholds = {
    connectionTime: 1000,  // 1 second
    queryTime: 500,        // 500ms
    criticalQueryTime: 2000 // 2 seconds
  };
  
  let performanceIssues = 0;
  
  if (results.performance.connectionTime > performanceThresholds.connectionTime) {
    performanceIssues++;
    console.warn('⚠️  Slow connection time:', results.performance.connectionTime + 'ms');
  }
  
  Object.entries(results.tables).forEach(([table, info]) => {
    if (info.queryTime > performanceThresholds.criticalQueryTime) {
      performanceIssues++;
      console.warn('⚠️  Critical slow query for table "' + table + '":', info.queryTime + 'ms');
    } else if (info.queryTime > performanceThresholds.queryTime) {
      console.warn('⚠️  Slow query for table "' + table + '":', info.queryTime + 'ms');
    }
  });
  
  if (performanceIssues === 0) {
    console.log('✅ Performance within acceptable limits');
  } else {
    results.criticalIssues.push(`PERFORMANCE_ISSUES: ${performanceIssues} slow operations detected`);
  }
  
  // 7. SUMMARY AND RECOMMENDATIONS
  console.log('\n📊 EMERGENCY AUDIT SUMMARY');
  console.log('===========================');
  
  const criticalIssuesCount = results.criticalIssues.length;
  
  if (criticalIssuesCount === 0) {
    console.log('🎉 ✅ SYSTEM STATUS: HEALTHY');
    console.log('    No critical issues detected');
    console.log('    Production system is stable');
  } else if (criticalIssuesCount <= 2) {
    console.log('⚠️  🟡 SYSTEM STATUS: MINOR ISSUES');
    console.log('    ' + criticalIssuesCount + ' issues require attention');
    console.log('    System operational but needs monitoring');
  } else if (criticalIssuesCount <= 5) {
    console.log('🚨 🟠 SYSTEM STATUS: SIGNIFICANT ISSUES');
    console.log('    ' + criticalIssuesCount + ' issues detected');
    console.log('    Immediate intervention recommended');
  } else {
    console.log('🔥 🔴 SYSTEM STATUS: CRITICAL FAILURE');
    console.log('    ' + criticalIssuesCount + ' critical issues detected');
    console.log('    IMMEDIATE ACTION REQUIRED');
  }
  
  console.log('');
  console.log('Critical Issues Found:', criticalIssuesCount);
  if (criticalIssuesCount > 0) {
    results.criticalIssues.forEach((issue, index) => {
      console.log('  ' + (index + 1) + '. ' + issue);
    });
  }
  
  // Recommendations
  console.log('');
  console.log('📋 IMMEDIATE RECOMMENDATIONS:');
  
  if (results.criticalIssues.includes('CUSTOMERS_TABLE_MISSING')) {
    console.log('  🔥 CRITICAL: Deploy database schema immediately');
    results.recommendations.push('DEPLOY_SCHEMA');
  }
  
  if (results.performance.connectionTime > 2000) {
    console.log('  🔥 CRITICAL: Database connection issues - check Supabase status');
    results.recommendations.push('CHECK_SUPABASE_STATUS');
  }
  
  if (criticalIssuesCount === 0) {
    console.log('  ✅ Continue monitoring system performance');
    console.log('  ✅ Set up automated health checks');
    console.log('  ✅ Consider implementing alerting');
    results.recommendations.push('SETUP_MONITORING');
  }
  
  console.log('');
  console.log('Audit completed at:', new Date().toISOString());
  
  return results;
}

// Run the audit
emergencyDatabaseAudit()
  .then(results => {
    console.log('\n📄 AUDIT COMPLETE - SAVING RESULTS');
    require('fs').writeFileSync(
      'emergency-audit-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('Results saved to: emergency-audit-results.json');
    
    // Exit with appropriate code
    process.exit(results.criticalIssues.length > 5 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n🔥 AUDIT FAILED:', error.message);
    process.exit(1);
  });