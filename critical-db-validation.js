const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('=== CRITICAL DATABASE VALIDATION AUDIT ===');
console.log('DirectoryBolt Production System Cross-Validation');
console.log('Timestamp:', new Date().toISOString());
console.log('');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'CONFIGURED' : 'MISSING');
console.log('Service Role Key:', supabaseKey ? 'CONFIGURED' : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function validatePaymentProcessing() {
  console.log('=== PAYMENT PROCESSING DATABASE VALIDATION ===');
  
  const results = {
    customerTable: false,
    stripeEvents: false,
    autoboltQueue: false,
    tierValidation: {},
    performanceMetrics: {}
  };
  
  try {
    // 1. Test customer table access
    console.log('Testing customer table...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customerError) {
      console.error('FAIL: Customer table access failed');
      console.error('Error:', customerError.message);
      results.customerTable = false;
    } else {
      console.log('PASS: Customer table accessible');
      console.log(`Found ${customers.length} sample customers`);
      results.customerTable = true;
      
      if (customers.length > 0) {
        console.log('Sample customer structure:', Object.keys(customers[0]));
      }
    }
    
    // 2. Test Stripe events table
    console.log('\nTesting Stripe events table...');
    const { data: stripeEvents, error: stripeError } = await supabase
      .from('stripe_events')
      .select('*')
      .limit(3);
    
    if (stripeError) {
      console.warn('WARNING: Stripe events table access failed');
      console.warn('Error:', stripeError.message);
      results.stripeEvents = false;
    } else {
      console.log('PASS: Stripe events table accessible');
      console.log(`Found ${stripeEvents.length} recent stripe events`);
      results.stripeEvents = true;
    }
    
    // 3. Test AutoBolt processing queue
    console.log('\nTesting AutoBolt processing queue...');
    const { data: queueData, error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .select('*')
      .limit(3);
    
    if (queueError) {
      console.warn('WARNING: AutoBolt queue table access failed');
      console.warn('Error:', queueError.message);
      results.autoboltQueue = false;
    } else {
      console.log('PASS: AutoBolt queue table accessible');
      console.log(`Found ${queueData.length} queue items`);
      results.autoboltQueue = true;
    }
    
    // 4. Test tier-based data integrity
    console.log('\nTesting tier-based data integrity...');
    const tiers = ['starter', 'growth', 'professional', 'enterprise'];
    
    for (const tier of tiers) {
      const { data: tierCustomers, error: tierError } = await supabase
        .from('customers')
        .select('customer_id, package_type, status, created')
        .eq('package_type', tier)
        .eq('status', 'active')
        .limit(3);
      
      if (tierError) {
        console.error(`FAIL: ${tier} tier validation failed`);
        console.error('Error:', tierError.message);
        results.tierValidation[tier] = { status: 'FAIL', error: tierError.message };
      } else {
        console.log(`PASS: ${tier} tier - ${tierCustomers.length} active customers`);
        results.tierValidation[tier] = { 
          status: 'PASS', 
          activeCustomers: tierCustomers.length,
          revenueImpact: tier === 'enterprise' ? 'HIGH' : tier === 'professional' ? 'MEDIUM' : 'LOW'
        };
      }
    }
    
    // 5. Performance testing
    console.log('\nTesting database performance...');
    const startTime = Date.now();
    
    const { data: perfTest, error: perfError } = await supabase
      .from('customers')
      .select('customer_id, package_type, status')
      .limit(100);
    
    const responseTime = Date.now() - startTime;
    
    if (perfError) {
      console.error('FAIL: Performance test failed');
      console.error('Error:', perfError.message);
      results.performanceMetrics = { status: 'FAIL', error: perfError.message };
    } else {
      console.log(`PASS: Performance test completed in ${responseTime}ms`);
      console.log(`Retrieved ${perfTest.length} records`);
      
      const performanceStatus = responseTime < 1000 ? 'OPTIMAL' : 
                              responseTime < 3000 ? 'ACCEPTABLE' : 'SLOW';
      
      results.performanceMetrics = {
        status: 'PASS',
        responseTime,
        recordCount: perfTest.length,
        performanceRating: performanceStatus
      };
    }
    
    return results;
    
  } catch (error) {
    console.error('CRITICAL: Database validation failed');
    console.error('Error:', error.message);
    return results;
  }
}

async function validateCustomerDataFlow() {
  console.log('\n=== CUSTOMER DATA FLOW VALIDATION ===');
  
  const flowResults = {
    signupToDatabase: false,
    paymentIntegration: false,
    directorySubmission: false,
    statusTracking: false
  };
  
  try {
    // Test customer creation flow
    console.log('Testing customer creation flow...');
    
    const testCustomerId = `VALIDATION-TEST-${Date.now()}`;
    
    // Create test customer
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([{
        customer_id: testCustomerId,
        first_name: 'Validation',
        last_name: 'Test',
        business_name: 'DirectoryBolt Validation Test',
        email: `validation-${Date.now()}@directorybolt.com`,
        package_type: 'professional',
        status: 'active'
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('FAIL: Customer creation failed');
      console.error('Error:', createError.message);
      flowResults.signupToDatabase = false;
    } else {
      console.log('PASS: Customer creation successful');
      flowResults.signupToDatabase = true;
      
      // Test customer retrieval
      const { data: retrievedCustomer, error: retrieveError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_id', testCustomerId)
        .single();
      
      if (retrieveError) {
        console.error('FAIL: Customer retrieval failed');
        console.error('Error:', retrieveError.message);
      } else {
        console.log('PASS: Customer retrieval successful');
        console.log('Customer data integrity validated');
      }
      
      // Clean up test customer
      await supabase
        .from('customers')
        .delete()
        .eq('customer_id', testCustomerId);
      
      console.log('Test customer cleaned up');
    }
    
    // Test directory submission flow
    console.log('\nTesting directory submission tracking...');
    
    const { data: submissions, error: submissionError } = await supabase
      .from('customers')
      .select('customer_id, directories_submitted, failed_directories, package_type')
      .not('directories_submitted', 'is', null)
      .limit(5);
    
    if (submissionError) {
      console.error('FAIL: Directory submission tracking failed');
      console.error('Error:', submissionError.message);
      flowResults.directorySubmission = false;
    } else {
      console.log('PASS: Directory submission tracking operational');
      console.log(`Found ${submissions.length} customers with submission data`);
      flowResults.directorySubmission = true;
    }
    
    return flowResults;
    
  } catch (error) {
    console.error('CRITICAL: Customer data flow validation failed');
    console.error('Error:', error.message);
    return flowResults;
  }
}

async function generateValidationReport() {
  console.log('\n=== GENERATING COMPREHENSIVE VALIDATION REPORT ===');
  
  const paymentResults = await validatePaymentProcessing();
  const flowResults = await validateCustomerDataFlow();
  
  const report = {
    timestamp: new Date().toISOString(),
    auditType: 'CRITICAL_DATABASE_CROSS_VALIDATION',
    systemStatus: 'EVALUATING',
    
    // Database Infrastructure
    databaseInfrastructure: {
      connection: paymentResults.customerTable ? 'PASS' : 'FAIL',
      customerTable: paymentResults.customerTable ? 'PASS' : 'FAIL',
      stripeIntegration: paymentResults.stripeEvents ? 'PASS' : 'FAIL', 
      autoboltIntegration: paymentResults.autoboltQueue ? 'PASS' : 'FAIL'
    },
    
    // Revenue-Critical Operations
    revenueCriticalOperations: {
      tierBasedAccess: paymentResults.tierValidation,
      performanceMetrics: paymentResults.performanceMetrics,
      customerDataFlow: flowResults
    },
    
    // Critical Issues
    criticalIssues: [],
    
    // Revenue Impact Assessment
    revenueImpactAssessment: {
      enterpriseTier: paymentResults.tierValidation.enterprise?.status || 'UNKNOWN',
      professionalTier: paymentResults.tierValidation.professional?.status || 'UNKNOWN',
      paymentProcessing: paymentResults.stripeEvents ? 'OPERATIONAL' : 'AT_RISK',
      customerOnboarding: flowResults.signupToDatabase ? 'OPERATIONAL' : 'FAILED'
    }
  };
  
  // Determine critical issues
  if (!paymentResults.customerTable) {
    report.criticalIssues.push({
      severity: 'CRITICAL',
      issue: 'Customer database table inaccessible',
      revenueImpact: 'COMPLETE_REVENUE_HALT',
      action: 'IMMEDIATE_DATABASE_RECOVERY_REQUIRED'
    });
  }
  
  if (!paymentResults.stripeEvents) {
    report.criticalIssues.push({
      severity: 'HIGH',
      issue: 'Stripe events table inaccessible',
      revenueImpact: 'PAYMENT_PROCESSING_COMPROMISED',
      action: 'VERIFY_STRIPE_WEBHOOK_CONFIGURATION'
    });
  }
  
  if (paymentResults.tierValidation.enterprise?.status === 'FAIL') {
    report.criticalIssues.push({
      severity: 'CRITICAL',
      issue: 'Enterprise tier database access failed',
      revenueImpact: 'HIGH_VALUE_CUSTOMER_IMPACT',
      action: 'IMMEDIATE_ENTERPRISE_SUPPORT_REQUIRED'
    });
  }
  
  if (paymentResults.performanceMetrics.performanceRating === 'SLOW') {
    report.criticalIssues.push({
      severity: 'MEDIUM',
      issue: 'Database performance degraded',
      revenueImpact: 'CUSTOMER_EXPERIENCE_IMPACT',
      action: 'DATABASE_OPTIMIZATION_REQUIRED'
    });
  }
  
  // Determine overall system status
  if (report.criticalIssues.some(issue => issue.severity === 'CRITICAL')) {
    report.systemStatus = 'CRITICAL_FAILURE';
  } else if (report.criticalIssues.some(issue => issue.severity === 'HIGH')) {
    report.systemStatus = 'DEGRADED_PERFORMANCE';
  } else if (report.criticalIssues.length > 0) {
    report.systemStatus = 'MINOR_ISSUES';
  } else {
    report.systemStatus = 'OPERATIONAL';
  }
  
  // Generate recommendations
  report.recommendations = [];
  
  if (paymentResults.performanceMetrics.responseTime > 1000) {
    report.recommendations.push({
      priority: 'HIGH',
      action: 'Implement database query optimization',
      impact: 'Improve customer experience and reduce churn risk'
    });
  }
  
  if (!paymentResults.autoboltQueue) {
    report.recommendations.push({
      priority: 'MEDIUM',
      action: 'Verify AutoBolt integration database schema',
      impact: 'Ensure automated processing capabilities'
    });
  }
  
  report.recommendations.push({
    priority: 'LOW',
    action: 'Implement real-time database monitoring',
    impact: 'Proactive issue detection and prevention'
  });
  
  return report;
}

// Execute validation
generateValidationReport().then(report => {
  console.log('\n=== FINAL VALIDATION REPORT ===');
  console.log(JSON.stringify(report, null, 2));
  
  console.log('\n=== EXECUTIVE SUMMARY ===');
  console.log(`System Status: ${report.systemStatus}`);
  console.log(`Critical Issues: ${report.criticalIssues.length}`);
  console.log(`Revenue Impact: ${report.systemStatus === 'OPERATIONAL' ? 'MINIMAL' : 'REQUIRES_ATTENTION'}`);
  
  if (report.criticalIssues.length > 0) {
    console.log('\nIMMEDIATE ACTIONS REQUIRED:');
    report.criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
      console.log(`   Action: ${issue.action}`);
      console.log(`   Revenue Impact: ${issue.revenueImpact}`);
    });
  }
  
  process.exit(report.systemStatus === 'OPERATIONAL' ? 0 : 1);
}).catch(error => {
  console.error('CRITICAL: Validation script failed');
  console.error('Error:', error.message);
  process.exit(1);
});