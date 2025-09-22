/**
 * EMERGENCY DATABASE AUDIT - DirectoryBolt Production System
 * REVENUE-CRITICAL: Test live database connectivity and data integrity
 * Date: 2025-09-21
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🚨 EMERGENCY DATABASE AUDIT - DirectoryBolt');
console.log('============================================');
console.log('⏰ Timestamp:', new Date().toISOString());

// CRITICAL: Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('💥 CRITICAL FAILURE: Missing Supabase credentials');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ SET' : '❌ MISSING');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ SET' : '❌ MISSING');
    process.exit(1);
}

console.log('🔐 Database Credentials: VERIFIED');
console.log('📍 Supabase URL:', supabaseUrl);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test results tracker
const auditResults = {
    timestamp: new Date().toISOString(),
    connectivity: null,
    responseTime: null,
    schemaValidation: null,
    customerFlow: null,
    queueSystem: null,
    autoBoltIntegration: null,
    critical_errors: [],
    warnings: [],
    performance_metrics: {}
};

/**
 * CRITICAL TEST 1: Database Connectivity
 */
async function testConnectivity() {
    console.log('\n🔌 CRITICAL TEST 1: Database Connectivity');
    console.log('==========================================');
    
    const startTime = Date.now();
    
    try {
        // Test basic connection with actual customers table
        const { data, error } = await supabase
            .from('customers')
            .select('count')
            .limit(1);
        
        const responseTime = Date.now() - startTime;
        auditResults.responseTime = responseTime;
        
        if (error) {
            console.error('❌ DATABASE CONNECTION FAILED:', error.message);
            auditResults.connectivity = false;
            auditResults.critical_errors.push(`Database connection failed: ${error.message}`);
            return false;
        }
        
        console.log('✅ Database connection: OPERATIONAL');
        console.log(`⚡ Response time: ${responseTime}ms`, responseTime < 500 ? '(EXCELLENT)' : responseTime < 1000 ? '(ACCEPTABLE)' : '(SLOW - INVESTIGATE)');
        
        auditResults.connectivity = true;
        auditResults.performance_metrics.db_response_time = responseTime;
        
        return true;
    } catch (error) {
        console.error('💥 CRITICAL CONNECTIVITY FAILURE:', error.message);
        auditResults.connectivity = false;
        auditResults.critical_errors.push(`Connectivity failure: ${error.message}`);
        return false;
    }
}

/**
 * CRITICAL TEST 2: Schema Validation
 */
async function validateSchema() {
    console.log('\n📋 CRITICAL TEST 2: Schema Validation');
    console.log('=====================================');
    
    const tables = ['customers', 'queue_history', 'customer_notifications', 'batch_operations'];
    const schemaStatus = {};
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.error(`❌ Table '${table}': MISSING/ERROR - ${error.message}`);
                schemaStatus[table] = false;
                auditResults.critical_errors.push(`Table ${table} error: ${error.message}`);
            } else {
                console.log(`✅ Table '${table}': OPERATIONAL`);
                schemaStatus[table] = true;
            }
        } catch (error) {
            console.error(`💥 Table '${table}': CRITICAL ERROR - ${error.message}`);
            schemaStatus[table] = false;
            auditResults.critical_errors.push(`Table ${table} critical error: ${error.message}`);
        }
    }
    
    const allTablesOk = Object.values(schemaStatus).every(status => status);
    auditResults.schemaValidation = allTablesOk;
    
    return allTablesOk;
}

/**
 * CRITICAL TEST 3: Customer Registration Flow
 */
async function testCustomerFlow() {
    console.log('\n👤 CRITICAL TEST 3: Customer Registration Flow');
    console.log('==============================================');
    
    const testEmail = `test-emergency-${Date.now()}@directorybolt.com`;
    
    try {
        // Test customer creation
        const customerData = {
            email: testEmail,
            business_name: 'Emergency Test Corp',
            package_type: 'starter',
            status: 'pending',
            directories_submitted: 0,
            failed_directories: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert([customerData])
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ Customer creation FAILED:', insertError.message);
            auditResults.customerFlow = false;
            auditResults.critical_errors.push(`Customer creation failed: ${insertError.message}`);
            return false;
        }
        
        console.log('✅ Customer creation: OPERATIONAL');
        console.log('📧 Test customer email:', newCustomer.email);
        
        // Test customer retrieval
        const { data: retrievedCustomer, error: selectError } = await supabase
            .from('customers')
            .select('*')
            .eq('email', testEmail)
            .single();
        
        if (selectError) {
            console.error('❌ Customer retrieval FAILED:', selectError.message);
            auditResults.customerFlow = false;
            auditResults.critical_errors.push(`Customer retrieval failed: ${selectError.message}`);
            return false;
        }
        
        console.log('✅ Customer retrieval: OPERATIONAL');
        
        // Test customer update
        const { error: updateError } = await supabase
            .from('customers')
            .update({ status: 'active' })
            .eq('email', testEmail);
        
        if (updateError) {
            console.error('❌ Customer update FAILED:', updateError.message);
            auditResults.customerFlow = false;
            auditResults.critical_errors.push(`Customer update failed: ${updateError.message}`);
            return false;
        }
        
        console.log('✅ Customer update: OPERATIONAL');
        
        // Cleanup test customer
        await supabase
            .from('customers')
            .delete()
            .eq('email', testEmail);
        
        console.log('🧹 Test customer cleaned up');
        
        auditResults.customerFlow = true;
        return true;
        
    } catch (error) {
        console.error('💥 CUSTOMER FLOW CRITICAL ERROR:', error.message);
        auditResults.customerFlow = false;
        auditResults.critical_errors.push(`Customer flow critical error: ${error.message}`);
        return false;
    }
}

/**
 * CRITICAL TEST 4: Queue System Integration
 */
async function testQueueSystem() {
    console.log('\n⏳ CRITICAL TEST 4: Queue System Integration');
    console.log('===========================================');
    
    try {
        // Test queue entry creation
        const queueData = {
            customer_id: `TEST-${Date.now()}`,
            status: 'pending',
            package_type: 'starter',
            directories_allocated: 50,
            directories_processed: 0,
            directories_failed: 0,
            priority_level: 4,
            processing_speed: 'standard',
            estimated_completion: new Date(Date.now() + 7200000).toISOString(), // 2 hours
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: queueEntry, error: queueError } = await supabase
            .from('queue_history')
            .insert([queueData])
            .select()
            .single();
        
        if (queueError) {
            console.error('❌ Queue entry creation FAILED:', queueError.message);
            auditResults.queueSystem = false;
            auditResults.critical_errors.push(`Queue system failed: ${queueError.message}`);
            return false;
        }
        
        console.log('✅ Queue entry creation: OPERATIONAL');
        
        // Test queue retrieval
        const { data: queueItems, error: retrieveError } = await supabase
            .from('queue_history')
            .select('*')
            .eq('customer_id', queueData.customer_id);
        
        if (retrieveError) {
            console.error('❌ Queue retrieval FAILED:', retrieveError.message);
            auditResults.queueSystem = false;
            auditResults.critical_errors.push(`Queue retrieval failed: ${retrieveError.message}`);
            return false;
        }
        
        console.log('✅ Queue retrieval: OPERATIONAL');
        console.log(`📊 Queue items found: ${queueItems.length}`);
        
        // Cleanup test queue entry
        await supabase
            .from('queue_history')
            .delete()
            .eq('customer_id', queueData.customer_id);
        
        console.log('🧹 Test queue entry cleaned up');
        
        auditResults.queueSystem = true;
        return true;
        
    } catch (error) {
        console.error('💥 QUEUE SYSTEM CRITICAL ERROR:', error.message);
        auditResults.queueSystem = false;
        auditResults.critical_errors.push(`Queue system critical error: ${error.message}`);
        return false;
    }
}

/**
 * CRITICAL TEST 5: AutoBolt Integration
 */
async function testAutoBoltIntegration() {
    console.log('\n🤖 CRITICAL TEST 5: AutoBolt Integration');
    console.log('========================================');
    
    try {
        // Test batch operations table (used by AutoBolt)
        const batchData = {
            operation_type: 'process',
            customer_ids: [`TEST-${Date.now()}`],
            status: 'pending',
            total_customers: 1,
            processed_customers: 0,
            successful_operations: 0,
            failed_operations: 0,
            created_by: 'emergency-audit',
            created_at: new Date().toISOString()
        };
        
        const { data: batchOp, error: batchError } = await supabase
            .from('batch_operations')
            .insert([batchData])
            .select()
            .single();
        
        if (batchError) {
            console.error('❌ AutoBolt batch operations FAILED:', batchError.message);
            auditResults.autoBoltIntegration = false;
            auditResults.critical_errors.push(`AutoBolt integration failed: ${batchError.message}`);
            return false;
        }
        
        console.log('✅ AutoBolt batch operations: OPERATIONAL');
        
        // Test batch operation retrieval
        const { data: operations, error: retrieveError } = await supabase
            .from('batch_operations')
            .select('*')
            .eq('created_by', 'emergency-audit');
        
        if (retrieveError) {
            console.error('❌ AutoBolt operation retrieval FAILED:', retrieveError.message);
            auditResults.autoBoltIntegration = false;
            auditResults.critical_errors.push(`AutoBolt retrieval failed: ${retrieveError.message}`);
            return false;
        }
        
        console.log('✅ AutoBolt operation retrieval: OPERATIONAL');
        console.log(`🔄 Batch operations found: ${operations.length}`);
        
        // Cleanup test batch operation
        await supabase
            .from('batch_operations')
            .delete()
            .eq('created_by', 'emergency-audit');
        
        console.log('🧹 Test batch operation cleaned up');
        
        auditResults.autoBoltIntegration = true;
        return true;
        
    } catch (error) {
        console.error('💥 AUTOBOLT INTEGRATION CRITICAL ERROR:', error.message);
        auditResults.autoBoltIntegration = false;
        auditResults.critical_errors.push(`AutoBolt integration critical error: ${error.message}`);
        return false;
    }
}

/**
 * PERFORMANCE MONITORING
 */
async function monitorPerformance() {
    console.log('\n📊 PERFORMANCE MONITORING');
    console.log('=========================');
    
    const performanceTests = [
        {
            name: 'Simple Query',
            test: () => supabase.from('customers').select('count').limit(1)
        },
        {
            name: 'Complex Query',
            test: () => supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(10)
        },
        {
            name: 'Join Query',
            test: () => supabase.from('queue_history').select('*, customers(email)').limit(5)
        }
    ];
    
    for (const testCase of performanceTests) {
        const startTime = Date.now();
        try {
            const { data, error } = await testCase.test();
            const responseTime = Date.now() - startTime;
            
            if (error) {
                console.log(`❌ ${testCase.name}: FAILED (${error.message})`);
                auditResults.warnings.push(`${testCase.name} performance test failed: ${error.message}`);
            } else {
                console.log(`✅ ${testCase.name}: ${responseTime}ms`, responseTime < 500 ? '(EXCELLENT)' : responseTime < 1000 ? '(GOOD)' : '(SLOW)');
                auditResults.performance_metrics[testCase.name.toLowerCase().replace(' ', '_')] = responseTime;
            }
        } catch (error) {
            console.log(`💥 ${testCase.name}: CRITICAL ERROR (${error.message})`);
            auditResults.critical_errors.push(`${testCase.name} critical error: ${error.message}`);
        }
    }
}

/**
 * MAIN AUDIT EXECUTION
 */
async function runEmergencyAudit() {
    console.log('\n🚨 BEGINNING EMERGENCY DATABASE AUDIT');
    console.log('====================================');
    
    const tests = [
        { name: 'Database Connectivity', fn: testConnectivity },
        { name: 'Schema Validation', fn: validateSchema },
        { name: 'Customer Registration Flow', fn: testCustomerFlow },
        { name: 'Queue System Integration', fn: testQueueSystem },
        { name: 'AutoBolt Integration', fn: testAutoBoltIntegration }
    ];
    
    let passedTests = 0;
    let criticalFailures = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
            } else {
                criticalFailures++;
            }
        } catch (error) {
            console.error(`💥 ${test.name} CRITICAL FAILURE:`, error.message);
            criticalFailures++;
            auditResults.critical_errors.push(`${test.name} critical failure: ${error.message}`);
        }
    }
    
    // Performance monitoring
    await monitorPerformance();
    
    // Generate final report
    console.log('\n🚨 EMERGENCY AUDIT RESULTS');
    console.log('==========================');
    console.log(`⏰ Timestamp: ${auditResults.timestamp}`);
    console.log(`✅ Tests Passed: ${passedTests}/${tests.length}`);
    console.log(`❌ Critical Failures: ${criticalFailures}`);
    console.log(`⚠️  Warnings: ${auditResults.warnings.length}`);
    
    if (criticalFailures === 0) {
        console.log('\n🎉 SYSTEM STATUS: OPERATIONAL');
        console.log('✅ All critical database systems functioning normally');
        console.log('✅ Customer registration pipeline: ACTIVE');
        console.log('✅ AutoBolt integration: READY');
        console.log('✅ Queue system: PROCESSING');
    } else {
        console.log('\n🚨 SYSTEM STATUS: DEGRADED');
        console.log('❌ REVENUE-CRITICAL ISSUES DETECTED');
        console.log('\nCRITICAL ERRORS:');
        auditResults.critical_errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
    }
    
    if (auditResults.warnings.length > 0) {
        console.log('\nWARNINGS:');
        auditResults.warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning}`);
        });
    }
    
    // Performance summary
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`🔌 Database Response Time: ${auditResults.responseTime}ms`);
    Object.entries(auditResults.performance_metrics).forEach(([metric, value]) => {
        console.log(`⚡ ${metric.replace('_', ' ')}: ${value}ms`);
    });
    
    console.log('\n🔍 RECOMMENDED ACTIONS:');
    if (criticalFailures > 0) {
        console.log('1. 🚨 ESCALATE IMMEDIATELY - Revenue-critical database failures detected');
        console.log('2. 🔧 Review Supabase dashboard for service alerts');
        console.log('3. 📞 Contact Supabase support if connectivity issues persist');
        console.log('4. 🔄 Implement database failover procedures if available');
    } else if (auditResults.responseTime > 1000) {
        console.log('1. ⚡ Monitor database performance - response times elevated');
        console.log('2. 📊 Review query optimization opportunities');
        console.log('3. 🔍 Check for long-running queries in Supabase dashboard');
    } else {
        console.log('1. ✅ Continue normal operations');
        console.log('2. 📊 Monitor performance metrics');
        console.log('3. 🔄 Schedule next audit in 4 hours');
    }
    
    // Exit with appropriate code
    process.exit(criticalFailures > 0 ? 1 : 0);
}

// Execute emergency audit
runEmergencyAudit().catch(error => {
    console.error('💥 EMERGENCY AUDIT SYSTEM FAILURE:', error);
    console.error('🚨 ESCALATE IMMEDIATELY - Database audit system compromised');
    process.exit(1);
});