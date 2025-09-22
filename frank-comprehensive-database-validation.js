const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🚨 FRANK - CRITICAL DATABASE CROSS-VALIDATION AUDIT 🚨');
console.log('='.repeat(60));
console.log('DirectoryBolt.com Production System Analysis');
console.log('Revenue-Critical Database Operations Validation');
console.log('Timestamp:', new Date().toISOString());
console.log('='.repeat(60));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('💥 CRITICAL FAILURE: Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

class FrankDatabaseValidator {
  constructor() {
    this.validationResults = {
      timestamp: new Date().toISOString(),
      auditId: `FRANK-DB-AUDIT-${Date.now()}`,
      
      // Core Infrastructure
      coreInfrastructure: {
        databaseConnection: null,
        customerTable: null,
        schemaIntegrity: null
      },
      
      // Revenue-Critical Operations
      revenueCriticalSystems: {
        paymentProcessing: null,
        tierBasedAccess: {},
        customerOnboarding: null,
        directorySubmission: null
      },
      
      // Staff Dashboard Operations
      staffDashboardOps: {
        queueAccess: null,
        manualProcessing: null,
        customerLookup: null,
        analyticsAccess: null
      },
      
      // AutoBolt Integration
      autoboltIntegration: {
        queueCommunication: null,
        extensionHeartbeat: null,
        processingFlow: null
      },
      
      // Real-time Features
      realtimeFeatures: {
        subscriptions: null,
        enterpriseFeatures: null,
        logging: null
      },
      
      // Performance Metrics
      performanceMetrics: {
        queryResponseTime: null,
        connectionPoolStatus: null,
        concurrentUserCapacity: null
      },
      
      // Critical Issues
      criticalIssues: [],
      emergencyActions: [],
      revenueImpact: 'UNKNOWN'
    };
  }

  async validateCoreInfrastructure() {
    console.log('\n🔍 VALIDATING CORE DATABASE INFRASTRUCTURE');
    console.log('-'.repeat(50));
    
    try {
      // Test basic connection
      const startTime = Date.now();
      const { data: connectionTest, error: connectionError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      const connectionTime = Date.now() - startTime;
      
      if (connectionError) {
        console.error('❌ CRITICAL: Database connection failed');
        console.error('Error:', connectionError.message);
        this.validationResults.coreInfrastructure.databaseConnection = {
          status: 'FAILED',
          error: connectionError.message,
          revenueImpact: 'COMPLETE_SYSTEM_FAILURE'
        };
        this.addCriticalIssue('CRITICAL', 'Database connection failure', 'COMPLETE_REVENUE_HALT');
        return false;
      }
      
      console.log(`✅ Database connection: OPERATIONAL (${connectionTime}ms)`);
      this.validationResults.coreInfrastructure.databaseConnection = {
        status: 'OPERATIONAL',
        responseTime: connectionTime,
        revenueImpact: 'NONE'
      };
      
      // Test customer table structure
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .limit(3);
      
      if (customerError) {
        console.error('❌ CRITICAL: Customer table access failed');
        this.validationResults.coreInfrastructure.customerTable = {
          status: 'FAILED',
          error: customerError.message
        };
        this.addCriticalIssue('CRITICAL', 'Customer table inaccessible', 'CUSTOMER_DATA_UNAVAILABLE');
        return false;
      }
      
      console.log(`✅ Customer table: ACCESSIBLE (${customerData.length} records retrieved)`);
      console.log('   Schema columns:', Object.keys(customerData[0] || {}));
      
      this.validationResults.coreInfrastructure.customerTable = {
        status: 'OPERATIONAL',
        recordCount: customerData.length,
        schemaColumns: Object.keys(customerData[0] || {})
      };
      
      // Validate schema integrity
      const requiredColumns = [
        'customer_id', 'email', 'package_type', 'status', 
        'first_name', 'last_name', 'business_name'
      ];
      
      const actualColumns = Object.keys(customerData[0] || {});
      const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.error(`❌ SCHEMA ISSUE: Missing columns: ${missingColumns.join(', ')}`);
        this.validationResults.coreInfrastructure.schemaIntegrity = {
          status: 'DEGRADED',
          missingColumns,
          impact: 'PARTIAL_FUNCTIONALITY_LOSS'
        };
        this.addCriticalIssue('HIGH', 'Schema integrity compromised', 'FEATURE_DEGRADATION');
      } else {
        console.log('✅ Schema integrity: VALIDATED');
        this.validationResults.coreInfrastructure.schemaIntegrity = {
          status: 'VALIDATED',
          allColumnsPresent: true
        };
      }
      
      return true;
      
    } catch (error) {
      console.error('💥 CRITICAL: Core infrastructure validation failed');
      console.error('Error:', error.message);
      this.addCriticalIssue('CRITICAL', 'Infrastructure validation failure', 'SYSTEM_UNSTABLE');
      return false;
    }
  }

  async validateRevenueCriticalSystems() {
    console.log('\n💰 VALIDATING REVENUE-CRITICAL SYSTEMS');
    console.log('-'.repeat(50));
    
    // Test payment processing infrastructure
    console.log('Testing payment processing tables...');
    
    try {
      const { data: stripeData, error: stripeError } = await supabase
        .from('stripe_events')
        .select('*')
        .limit(1);
      
      if (stripeError) {
        console.error('❌ CRITICAL: Stripe events table missing/inaccessible');
        console.error('Error:', stripeError.message);
        this.validationResults.revenueCriticalSystems.paymentProcessing = {
          status: 'FAILED',
          error: stripeError.message,
          revenueImpact: 'PAYMENT_PROCESSING_COMPROMISED'
        };
        this.addCriticalIssue('CRITICAL', 'Payment processing table missing', 'REVENUE_COLLECTION_DISABLED');
      } else {
        console.log('✅ Stripe events table: OPERATIONAL');
        this.validationResults.revenueCriticalSystems.paymentProcessing = {
          status: 'OPERATIONAL',
          tableExists: true
        };
      }
    } catch (error) {
      console.error('❌ Payment processing validation failed:', error.message);
      this.validationResults.revenueCriticalSystems.paymentProcessing = {
        status: 'FAILED',
        error: error.message
      };
    }
    
    // Test tier-based access for all pricing tiers
    console.log('\\nValidating tier-based access control...');
    const tiers = [
      { name: 'starter', price: 149, priority: 'LOW' },
      { name: 'growth', price: 299, priority: 'MEDIUM' },
      { name: 'professional', price: 499, priority: 'HIGH' },
      { name: 'enterprise', price: 799, priority: 'CRITICAL' }
    ];
    
    for (const tier of tiers) {
      try {
        const { data: tierCustomers, error: tierError } = await supabase
          .from('customers')
          .select('customer_id, package_type, status, created_at, directories_submitted')
          .eq('package_type', tier.name)
          .eq('status', 'active')
          .limit(5);
        
        if (tierError) {
          console.error(`❌ ${tier.name.toUpperCase()} tier ($${tier.price}): ACCESS FAILED`);
          console.error('Error:', tierError.message);
          this.validationResults.revenueCriticalSystems.tierBasedAccess[tier.name] = {
            status: 'FAILED',
            error: tierError.message,
            revenueImpact: tier.priority === 'CRITICAL' ? 'HIGH_VALUE_CUSTOMERS_AFFECTED' : 'REVENUE_LOSS'
          };
          
          if (tier.priority === 'CRITICAL') {
            this.addCriticalIssue('CRITICAL', `Enterprise tier access failed`, 'HIGH_VALUE_CUSTOMER_IMPACT');
          }
        } else {
          console.log(`✅ ${tier.name.toUpperCase()} tier ($${tier.price}): ${tierCustomers.length} active customers`);
          this.validationResults.revenueCriticalSystems.tierBasedAccess[tier.name] = {
            status: 'OPERATIONAL',
            activeCustomers: tierCustomers.length,
            revenueValue: tierCustomers.length * tier.price,
            priority: tier.priority
          };
        }
      } catch (error) {
        console.error(`💥 ${tier.name} tier validation failed:`, error.message);
        this.validationResults.revenueCriticalSystems.tierBasedAccess[tier.name] = {
          status: 'ERROR',
          error: error.message
        };
      }
    }
    
    // Test customer onboarding flow
    console.log('\\nTesting customer onboarding flow...');
    try {
      const testCustomerId = `FRANK-VALIDATION-${Date.now()}`;
      
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{
          customer_id: testCustomerId,
          first_name: 'Frank',
          last_name: 'Validation',
          business_name: 'Emergency Database Audit',
          email: `frank-validation-${Date.now()}@directorybolt.com`,
          package_type: 'professional',
          status: 'active'
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Customer onboarding: FAILED');
        console.error('Error:', createError.message);
        this.validationResults.revenueCriticalSystems.customerOnboarding = {
          status: 'FAILED',
          error: createError.message,
          revenueImpact: 'NEW_CUSTOMER_ACQUISITION_BLOCKED'
        };
        this.addCriticalIssue('HIGH', 'Customer onboarding failure', 'NEW_REVENUE_BLOCKED');
      } else {
        console.log('✅ Customer onboarding: OPERATIONAL');
        this.validationResults.revenueCriticalSystems.customerOnboarding = {
          status: 'OPERATIONAL',
          testCustomerCreated: true
        };
        
        // Clean up test customer
        await supabase.from('customers').delete().eq('customer_id', testCustomerId);
        console.log('   Test customer cleaned up');
      }
    } catch (error) {
      console.error('💥 Customer onboarding test failed:', error.message);
      this.validationResults.revenueCriticalSystems.customerOnboarding = {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  async validateStaffDashboardOperations() {
    console.log('\n👥 VALIDATING STAFF DASHBOARD OPERATIONS');
    console.log('-'.repeat(50));
    
    // Test AutoBolt queue access (critical for staff workflow)
    try {
      const { data: queueData, error: queueError } = await supabase
        .from('autobolt_processing_queue')
        .select('*')
        .limit(10);
      
      if (queueError) {
        console.error('❌ AutoBolt queue access: FAILED');
        console.error('Error:', queueError.message);
        this.validationResults.staffDashboardOps.queueAccess = {
          status: 'FAILED',
          error: queueError.message,
          impact: 'STAFF_WORKFLOW_DISRUPTED'
        };
        this.addCriticalIssue('HIGH', 'Staff queue access failure', 'OPERATIONAL_EFFICIENCY_LOSS');
      } else {
        console.log(`✅ AutoBolt queue access: OPERATIONAL (${queueData.length} items)`);
        this.validationResults.staffDashboardOps.queueAccess = {
          status: 'OPERATIONAL',
          queueItemCount: queueData.length,
          queueSchema: Object.keys(queueData[0] || {})
        };
        
        // Analyze queue health
        const queueStats = {
          queued: queueData.filter(item => item.status === 'queued').length,
          processing: queueData.filter(item => item.status === 'processing').length,
          completed: queueData.filter(item => item.status === 'completed').length,
          failed: queueData.filter(item => item.status === 'failed').length
        };
        
        console.log('   Queue statistics:', queueStats);
        
        if (queueStats.failed > 5) {
          this.addCriticalIssue('MEDIUM', 'High queue failure rate', 'CUSTOMER_PROCESSING_DELAYS');
        }
      }
    } catch (error) {
      console.error('💥 Queue access validation failed:', error.message);
      this.validationResults.staffDashboardOps.queueAccess = {
        status: 'ERROR',
        error: error.message
      };
    }
    
    // Test customer lookup functionality
    try {
      const { data: customerLookup, error: lookupError } = await supabase
        .from('customers')
        .select('customer_id, business_name, email, package_type, status, directories_submitted')
        .eq('status', 'active')
        .limit(5);
      
      if (lookupError) {
        console.error('❌ Customer lookup: FAILED');
        this.validationResults.staffDashboardOps.customerLookup = {
          status: 'FAILED',
          error: lookupError.message
        };
      } else {
        console.log(`✅ Customer lookup: OPERATIONAL (${customerLookup.length} results)`);
        this.validationResults.staffDashboardOps.customerLookup = {
          status: 'OPERATIONAL',
          testResults: customerLookup.length
        };
      }
    } catch (error) {
      this.validationResults.staffDashboardOps.customerLookup = {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  async validateAutoBoltIntegration() {
    console.log('\n🤖 VALIDATING AUTOBOLT INTEGRATION');
    console.log('-'.repeat(50));
    
    try {
      // Test AutoBolt queue communication
      const { data: queueComm, error: commError } = await supabase
        .from('autobolt_processing_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (commError) {
        console.error('❌ AutoBolt queue communication: FAILED');
        this.validationResults.autoboltIntegration.queueCommunication = {
          status: 'FAILED',
          error: commError.message,
          impact: 'AUTOMATED_PROCESSING_DISABLED'
        };
        this.addCriticalIssue('CRITICAL', 'AutoBolt communication failure', 'CUSTOMER_PROCESSING_STOPPED');
      } else {
        console.log(`✅ AutoBolt queue communication: OPERATIONAL`);
        this.validationResults.autoboltIntegration.queueCommunication = {
          status: 'OPERATIONAL',
          recentItems: queueComm.length
        };
        
        // Analyze processing flow health
        const recentProcessing = queueComm.filter(item => 
          new Date(item.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        console.log(`   Recent 24h processing: ${recentProcessing.length} items`);
        
        if (recentProcessing.length === 0) {
          this.addCriticalIssue('MEDIUM', 'No recent AutoBolt processing', 'POTENTIAL_SYSTEM_STAGNATION');
        }
      }
      
      // Test extension heartbeat capability (if table exists)
      try {
        const { data: extensionData, error: extensionError } = await supabase
          .from('autobolt_extension_status')
          .select('*')
          .limit(1);
        
        if (extensionError) {
          console.warn('⚠️ Extension heartbeat table: NOT_FOUND');
          this.validationResults.autoboltIntegration.extensionHeartbeat = {
            status: 'NOT_CONFIGURED',
            note: 'Extension monitoring table does not exist'
          };
        } else {
          console.log('✅ Extension heartbeat: CONFIGURED');
          this.validationResults.autoboltIntegration.extensionHeartbeat = {
            status: 'CONFIGURED',
            monitoringActive: true
          };
        }
      } catch (error) {
        this.validationResults.autoboltIntegration.extensionHeartbeat = {
          status: 'ERROR',
          error: error.message
        };
      }
      
    } catch (error) {
      console.error('💥 AutoBolt integration validation failed:', error.message);
      this.validationResults.autoboltIntegration.queueCommunication = {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  async validatePerformanceMetrics() {
    console.log('\n⚡ VALIDATING PERFORMANCE METRICS');
    console.log('-'.repeat(50));
    
    // Test query response time under load
    console.log('Testing query performance...');
    const startTime = Date.now();
    
    try {
      const promises = Array.from({ length: 10 }, () =>
        supabase
          .from('customers')
          .select('customer_id, package_type, status')
          .limit(20)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 10;
      
      console.log(`✅ Concurrent query test: ${totalTime}ms total, ${avgTime}ms average`);
      
      const performanceRating = avgTime < 200 ? 'EXCELLENT' :
                               avgTime < 500 ? 'GOOD' :
                               avgTime < 1000 ? 'ACCEPTABLE' : 'POOR';
      
      this.validationResults.performanceMetrics.queryResponseTime = {
        totalTime,
        averageTime: avgTime,
        rating: performanceRating,
        concurrentQueries: 10
      };
      
      if (performanceRating === 'POOR') {
        this.addCriticalIssue('MEDIUM', 'Poor database performance', 'CUSTOMER_EXPERIENCE_DEGRADED');
      }
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.validationResults.performanceMetrics.queryResponseTime = {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async validateRealtimeFeatures() {
    console.log('\n🔄 VALIDATING REAL-TIME FEATURES');
    console.log('-'.repeat(50));
    
    // Test real-time subscription capability
    try {
      console.log('Testing real-time subscription setup...');
      
      // Test if real-time is enabled by attempting a subscription
      const channel = supabase
        .channel('validation-test')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'customers' 
          }, 
          (payload) => {
            console.log('Real-time event received:', payload);
          }
        );
      
      // Subscribe and then unsubscribe
      const subscribeResult = await channel.subscribe();
      
      if (subscribeResult === 'SUBSCRIBED') {
        console.log('✅ Real-time subscriptions: OPERATIONAL');
        this.validationResults.realtimeFeatures.subscriptions = {
          status: 'OPERATIONAL',
          testSubscriptionSuccess: true
        };
      } else {
        console.log('⚠️ Real-time subscriptions: DEGRADED');
        this.validationResults.realtimeFeatures.subscriptions = {
          status: 'DEGRADED',
          subscriptionStatus: subscribeResult
        };
      }
      
      // Unsubscribe
      supabase.removeChannel(channel);
      
    } catch (error) {
      console.error('❌ Real-time features test failed:', error.message);
      this.validationResults.realtimeFeatures.subscriptions = {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  addCriticalIssue(severity, issue, revenueImpact) {
    this.validationResults.criticalIssues.push({
      severity,
      issue,
      revenueImpact,
      timestamp: new Date().toISOString()
    });
    
    // Add emergency actions for critical issues
    if (severity === 'CRITICAL') {
      this.validationResults.emergencyActions.push({
        action: `IMMEDIATE: Resolve ${issue}`,
        priority: 'EMERGENCY',
        revenueRisk: revenueImpact
      });
    }
  }

  assessRevenueImpact() {
    const criticalCount = this.validationResults.criticalIssues.filter(issue => issue.severity === 'CRITICAL').length;
    const highCount = this.validationResults.criticalIssues.filter(issue => issue.severity === 'HIGH').length;
    
    if (criticalCount > 0) {
      this.validationResults.revenueImpact = 'SEVERE';
    } else if (highCount > 2) {
      this.validationResults.revenueImpact = 'HIGH';
    } else if (highCount > 0) {
      this.validationResults.revenueImpact = 'MODERATE';
    } else {
      this.validationResults.revenueImpact = 'MINIMAL';
    }
  }

  async executeFullValidation() {
    console.log('🚀 EXECUTING COMPREHENSIVE DATABASE VALIDATION');
    console.log('='.repeat(60));
    
    const validationSteps = [
      { name: 'Core Infrastructure', method: this.validateCoreInfrastructure },
      { name: 'Revenue-Critical Systems', method: this.validateRevenueCriticalSystems },
      { name: 'Staff Dashboard Operations', method: this.validateStaffDashboardOperations },
      { name: 'AutoBolt Integration', method: this.validateAutoBoltIntegration },
      { name: 'Performance Metrics', method: this.validatePerformanceMetrics },
      { name: 'Real-time Features', method: this.validateRealtimeFeatures }
    ];
    
    for (const step of validationSteps) {
      try {
        await step.method.call(this);
      } catch (error) {
        console.error(`💥 ${step.name} validation failed:`, error.message);
        this.addCriticalIssue('CRITICAL', `${step.name} validation failure`, 'UNKNOWN_IMPACT');
      }
    }
    
    this.assessRevenueImpact();
    this.generateFinalReport();
  }

  generateFinalReport() {
    console.log('\n📊 FRANK\'S COMPREHENSIVE DATABASE VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const totalIssues = this.validationResults.criticalIssues.length;
    const criticalIssues = this.validationResults.criticalIssues.filter(i => i.severity === 'CRITICAL').length;
    const highIssues = this.validationResults.criticalIssues.filter(i => i.severity === 'HIGH').length;
    
    console.log(`📋 EXECUTIVE SUMMARY:`);
    console.log(`   Revenue Impact: ${this.validationResults.revenueImpact}`);
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   Critical Issues: ${criticalIssues}`);
    console.log(`   High Priority Issues: ${highIssues}`);
    console.log(`   Emergency Actions Required: ${this.validationResults.emergencyActions.length}`);
    
    // Core Infrastructure Status
    console.log('\n🏗️ CORE INFRASTRUCTURE:');
    console.log(`   Database Connection: ${this.validationResults.coreInfrastructure.databaseConnection?.status || 'UNKNOWN'}`);
    console.log(`   Customer Table: ${this.validationResults.coreInfrastructure.customerTable?.status || 'UNKNOWN'}`);
    console.log(`   Schema Integrity: ${this.validationResults.coreInfrastructure.schemaIntegrity?.status || 'UNKNOWN'}`);
    
    // Revenue-Critical Systems
    console.log('\n💰 REVENUE-CRITICAL SYSTEMS:');
    console.log(`   Payment Processing: ${this.validationResults.revenueCriticalSystems.paymentProcessing?.status || 'UNKNOWN'}`);
    console.log(`   Customer Onboarding: ${this.validationResults.revenueCriticalSystems.customerOnboarding?.status || 'UNKNOWN'}`);
    
    // Tier Access Status
    console.log('\n🎯 TIER ACCESS STATUS:');
    Object.entries(this.validationResults.revenueCriticalSystems.tierBasedAccess).forEach(([tier, data]) => {
      const status = data.status || 'UNKNOWN';
      const customers = data.activeCustomers || 0;
      const revenue = data.revenueValue || 0;
      console.log(`   ${tier.toUpperCase()}: ${status} (${customers} customers, $${revenue} value)`);
    });
    
    // Staff Operations
    console.log('\n👥 STAFF OPERATIONS:');
    console.log(`   Queue Access: ${this.validationResults.staffDashboardOps.queueAccess?.status || 'UNKNOWN'}`);
    console.log(`   Customer Lookup: ${this.validationResults.staffDashboardOps.customerLookup?.status || 'UNKNOWN'}`);
    
    // AutoBolt Integration
    console.log('\n🤖 AUTOBOLT INTEGRATION:');
    console.log(`   Queue Communication: ${this.validationResults.autoboltIntegration.queueCommunication?.status || 'UNKNOWN'}`);
    console.log(`   Extension Heartbeat: ${this.validationResults.autoboltIntegration.extensionHeartbeat?.status || 'UNKNOWN'}`);
    
    // Performance
    console.log('\n⚡ PERFORMANCE:');
    const perfStatus = this.validationResults.performanceMetrics.queryResponseTime?.rating || 'UNKNOWN';
    const avgTime = this.validationResults.performanceMetrics.queryResponseTime?.averageTime || 'N/A';
    console.log(`   Query Performance: ${perfStatus} (${avgTime}ms avg)`);
    
    // Critical Issues
    if (this.validationResults.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      this.validationResults.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity}] ${issue.issue}`);
        console.log(`      Revenue Impact: ${issue.revenueImpact}`);
      });
    }
    
    // Emergency Actions
    if (this.validationResults.emergencyActions.length > 0) {
      console.log('\n⚡ EMERGENCY ACTIONS REQUIRED:');
      this.validationResults.emergencyActions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.action}`);
        console.log(`      Priority: ${action.priority}`);
        console.log(`      Revenue Risk: ${action.revenueRisk}`);
      });
    }
    
    // Final Recommendations
    console.log('\n📝 FRANK\'S RECOMMENDATIONS:');
    
    if (criticalIssues > 0) {
      console.log('   🚨 IMMEDIATE ACTION REQUIRED - Critical system failures detected');
      console.log('   🔧 Escalate to infrastructure team immediately');
      console.log('   📞 Consider customer notification for service disruptions');
    } else if (highIssues > 0) {
      console.log('   ⚠️ HIGH PRIORITY ISSUES - Address within 2 hours');
      console.log('   🔍 Monitor system closely for degradation');
    } else {
      console.log('   ✅ System operational - Continue normal monitoring');
      console.log('   📈 Consider performance optimizations');
    }
    
    // Generate Blake-ready summary
    console.log('\n📋 BLAKE READINESS ASSESSMENT:');
    if (this.validationResults.revenueImpact === 'MINIMAL' && criticalIssues === 0) {
      console.log('   ✅ READY FOR BLAKE\'S END-TO-END TESTING');
      console.log('   ✅ Database systems validated and operational');
    } else {
      console.log('   ❌ NOT READY - Resolve critical issues before Blake testing');
      console.log('   🔧 Address database issues first');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FRANK VALIDATION COMPLETE');
    console.log('📧 Report ready for Blake review');
    console.log('='.repeat(60));
    
    // Write detailed report to file
    const fs = require('fs');
    const reportPath = `FRANK_DATABASE_VALIDATION_REPORT_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.validationResults, null, 2));
    console.log(`📄 Detailed report saved: ${reportPath}`);
    
    return this.validationResults;
  }
}

// Execute Frank's comprehensive validation
const frankValidator = new FrankDatabaseValidator();

frankValidator.executeFullValidation().then(results => {
  const exitCode = results.revenueImpact === 'SEVERE' || 
                   results.criticalIssues.some(issue => issue.severity === 'CRITICAL') ? 1 : 0;
  
  console.log(`\\n🎯 Validation completed with exit code: ${exitCode}`);
  process.exit(exitCode);
}).catch(error => {
  console.error('💥 FRANK VALIDATION FAILED:', error);
  process.exit(1);
});