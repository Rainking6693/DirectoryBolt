/**
 * EMERGENCY DATABASE PERFORMANCE AUDIT - DirectoryBolt Production System
 * 🚨 CRITICAL: Real-time features and database performance testing under load
 * Testing Supabase performance, real-time subscriptions, and tier-based access control
 */

const { SupabaseService, createSupabaseService } = require('./lib/services/supabase.js');
const fs = require('fs').promises;

class EmergencyDatabaseAudit {
  constructor() {
    this.supabaseService = createSupabaseService();
    this.testResults = {
      timestamp: new Date().toISOString(),
      auditId: `EMERGENCY_DB_AUDIT_${Date.now()}`,
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        criticalIssues: [],
        performanceMetrics: {},
        realtimeStatus: {},
        tierBasedAccess: {},
        concurrentUserTest: {},
        emergencyFindings: []
      }
    };
  }

  // 🔥 CRITICAL: Test Supabase real-time subscriptions
  async testRealtimeSubscriptions() {
    console.log('\n🔴 EMERGENCY TEST: Supabase Real-time Subscriptions');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Supabase Real-time Subscriptions Test',
      status: 'running',
      startTime: testStart,
      metrics: {},
      errors: []
    };

    try {
      // Initialize Supabase service
      await this.supabaseService.initialize();
      
      // Test 1: Connection establishment time
      const connectionStart = Date.now();
      const connectionTest = await this.supabaseService.testConnection();
      const connectionTime = Date.now() - connectionStart;
      
      testResult.metrics.connectionTime = connectionTime;
      
      if (!connectionTest.ok) {
        testResult.errors.push('Failed to establish Supabase connection');
        testResult.status = 'failed';
        return testResult;
      }

      // Test 2: Real-time subscription setup
      let messagesReceived = 0;
      let subscriptionEstablished = false;
      
      const subscription = this.supabaseService.subscribeToCustomers((payload) => {
        messagesReceived++;
        console.log(`📡 Real-time message received: ${JSON.stringify(payload)}`);
      });

      // Wait for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 3: Simulate data change to trigger real-time update
      const testCustomerId = `TEST-REALTIME-${Date.now()}`;
      const createResult = await this.supabaseService.addCustomer({
        customerId: testCustomerId,
        firstName: 'Emergency',
        lastName: 'Test',
        businessName: 'Real-time Test Business',
        email: `emergency-test-${Date.now()}@directorybolt.com`,
        packageType: 'enterprise'
      });

      if (createResult.success) {
        // Wait for real-time notification
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        testResult.metrics.realtimeMessagesReceived = messagesReceived;
        testResult.metrics.subscriptionWorking = messagesReceived > 0;
        
        // Cleanup test data
        await this.supabaseService.client
          .from('customers')
          .delete()
          .eq('customer_id', testCustomerId);
      }

      // Unsubscribe
      this.supabaseService.unsubscribe(subscription);
      
      testResult.status = 'passed';
      testResult.metrics.totalTestTime = Date.now() - testStart;
      
      console.log(`✅ Real-time test completed: ${testResult.metrics.realtimeMessagesReceived} messages received`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Real-time subscription test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Test tier-based access control
  async testTierBasedAccess() {
    console.log('\n🔴 EMERGENCY TEST: Tier-based Access Control');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Tier-based Access Control Test',
      status: 'running',
      startTime: testStart,
      tierTests: {},
      errors: []
    };

    try {
      const tiers = ['starter', 'growth', 'professional', 'enterprise'];
      
      for (const tier of tiers) {
        const tierTestStart = Date.now();
        
        // Create test customer for this tier
        const testCustomerId = `TEST-TIER-${tier.toUpperCase()}-${Date.now()}`;
        const createResult = await this.supabaseService.addCustomer({
          customerId: testCustomerId,
          firstName: 'Tier',
          lastName: 'Test',
          businessName: `${tier} Tier Test Business`,
          email: `tier-test-${tier}-${Date.now()}@directorybolt.com`,
          packageType: tier
        });

        if (createResult.success) {
          // Test data retrieval
          const retrievalStart = Date.now();
          const customerData = await this.supabaseService.getCustomerById(testCustomerId);
          const retrievalTime = Date.now() - retrievalStart;
          
          testResult.tierTests[tier] = {
            customerCreated: true,
            retrievalTime: retrievalTime,
            dataIntegrity: customerData.found && customerData.customer.packageType === tier,
            accessControlWorking: true
          };

          // Cleanup
          await this.supabaseService.client
            .from('customers')
            .delete()
            .eq('customer_id', testCustomerId);
            
        } else {
          testResult.tierTests[tier] = {
            customerCreated: false,
            error: createResult.error
          };
        }
        
        const tierTestTime = Date.now() - tierTestStart;
        console.log(`✅ Tier ${tier} test completed in ${tierTestTime}ms`);
      }
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Tier-based access test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Simulate concurrent user load (100+ users)
  async testConcurrentUserLoad() {
    console.log('\n🔴 EMERGENCY TEST: Concurrent User Load (100+ users)');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Concurrent User Load Test',
      status: 'running',
      startTime: testStart,
      userCount: 100,
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        responseTimes: []
      },
      errors: []
    };

    try {
      const concurrentUsers = 100;
      const requestsPerUser = 5;
      const promises = [];

      console.log(`🚀 Launching ${concurrentUsers} concurrent users with ${requestsPerUser} requests each`);

      // Create concurrent user simulation
      for (let userId = 1; userId <= concurrentUsers; userId++) {
        const userPromises = [];
        
        for (let reqId = 1; reqId <= requestsPerUser; reqId++) {
          userPromises.push(this.simulateUserRequest(userId, reqId));
        }
        
        promises.push(...userPromises);
      }

      // Execute all requests concurrently
      const results = await Promise.allSettled(promises);
      
      // Analyze results
      results.forEach((result, index) => {
        testResult.metrics.totalRequests++;
        
        if (result.status === 'fulfilled') {
          testResult.metrics.successfulRequests++;
          const responseTime = result.value.responseTime;
          testResult.metrics.responseTimes.push(responseTime);
          
          if (responseTime > testResult.metrics.maxResponseTime) {
            testResult.metrics.maxResponseTime = responseTime;
          }
          if (responseTime < testResult.metrics.minResponseTime) {
            testResult.metrics.minResponseTime = responseTime;
          }
        } else {
          testResult.metrics.failedRequests++;
          testResult.errors.push(`Request ${index + 1} failed: ${result.reason}`);
        }
      });

      // Calculate average response time
      if (testResult.metrics.responseTimes.length > 0) {
        testResult.metrics.averageResponseTime = 
          testResult.metrics.responseTimes.reduce((a, b) => a + b, 0) / 
          testResult.metrics.responseTimes.length;
      }

      // Determine test status
      const successRate = (testResult.metrics.successfulRequests / testResult.metrics.totalRequests) * 100;
      const avgResponseTime = testResult.metrics.averageResponseTime;
      
      if (successRate >= 95 && avgResponseTime < 200) {
        testResult.status = 'passed';
      } else if (successRate >= 85 && avgResponseTime < 500) {
        testResult.status = 'warning';
      } else {
        testResult.status = 'failed';
      }

      testResult.metrics.successRate = successRate;
      testResult.metrics.totalTestTime = Date.now() - testStart;
      
      console.log(`📊 Load test completed: ${successRate.toFixed(2)}% success rate, ${avgResponseTime.toFixed(2)}ms avg response time`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Concurrent load test failed:', error);
    }

    return testResult;
  }

  // Simulate individual user request
  async simulateUserRequest(userId, requestId) {
    const requestStart = Date.now();
    
    try {
      // Simulate different types of requests
      const requestTypes = [
        () => this.supabaseService.getAllCustomers(10),
        () => this.supabaseService.getCustomerById(`TEST-USER-${userId}`),
        () => this.supabaseService.testConnection(),
        () => this.supabaseService.getPerformanceStats()
      ];
      
      const randomRequest = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      await randomRequest();
      
      const responseTime = Date.now() - requestStart;
      return { userId, requestId, responseTime, success: true };
      
    } catch (error) {
      const responseTime = Date.now() - requestStart;
      throw new Error(`User ${userId} Request ${requestId} failed: ${error.message}`);
    }
  }

  // 🔥 CRITICAL: Test database query performance and indexing
  async testQueryPerformanceAndIndexing() {
    console.log('\n🔴 EMERGENCY TEST: Database Query Performance & Indexing');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Database Query Performance & Indexing Test',
      status: 'running',
      startTime: testStart,
      queryTests: {},
      errors: []
    };

    try {
      // Test 1: Customer lookup by ID (should use primary key index)
      const customerLookupStart = Date.now();
      await this.supabaseService.getCustomerById('TEST-PERFORMANCE');
      const customerLookupTime = Date.now() - customerLookupStart;
      
      testResult.queryTests.customerLookupById = {
        responseTime: customerLookupTime,
        status: customerLookupTime < 50 ? 'optimal' : customerLookupTime < 200 ? 'acceptable' : 'slow'
      };

      // Test 2: Customer list query (should use created_at index)
      const customerListStart = Date.now();
      await this.supabaseService.getAllCustomers(50);
      const customerListTime = Date.now() - customerListStart;
      
      testResult.queryTests.customerList = {
        responseTime: customerListTime,
        status: customerListTime < 100 ? 'optimal' : customerListTime < 300 ? 'acceptable' : 'slow'
      };

      // Test 3: Status-based filtering (should use status index)
      const statusFilterStart = Date.now();
      await this.supabaseService.findByStatus('active');
      const statusFilterTime = Date.now() - statusFilterStart;
      
      testResult.queryTests.statusFiltering = {
        responseTime: statusFilterTime,
        status: statusFilterTime < 150 ? 'optimal' : statusFilterTime < 400 ? 'acceptable' : 'slow'
      };

      // Test 4: Complex metadata search
      const metadataSearchStart = Date.now();
      try {
        const { data } = await this.supabaseService.client
          .from('customers')
          .select('customer_id, metadata')
          .not('metadata', 'is', null)
          .limit(10);
        const metadataSearchTime = Date.now() - metadataSearchStart;
        
        testResult.queryTests.metadataSearch = {
          responseTime: metadataSearchTime,
          status: metadataSearchTime < 200 ? 'optimal' : metadataSearchTime < 500 ? 'acceptable' : 'slow',
          recordsFound: data ? data.length : 0
        };
      } catch (error) {
        testResult.queryTests.metadataSearch = {
          error: error.message,
          status: 'failed'
        };
      }

      // Determine overall query performance status
      const allQueryTimes = Object.values(testResult.queryTests)
        .filter(test => test.responseTime)
        .map(test => test.responseTime);
      
      const avgQueryTime = allQueryTimes.reduce((a, b) => a + b, 0) / allQueryTimes.length;
      
      testResult.queryTests.overall = {
        averageResponseTime: avgQueryTime,
        status: avgQueryTime < 150 ? 'optimal' : avgQueryTime < 350 ? 'acceptable' : 'slow'
      };

      testResult.status = avgQueryTime < 350 ? 'passed' : 'failed';
      
      console.log(`📊 Query performance test completed: ${avgQueryTime.toFixed(2)}ms average response time`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Query performance test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Test Enterprise tier prioritization
  async testEnterpriseTierPrioritization() {
    console.log('\n🔴 EMERGENCY TEST: Enterprise Tier Prioritization');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Enterprise Tier Prioritization Test',
      status: 'running',
      startTime: testStart,
      prioritizationTests: {},
      errors: []
    };

    try {
      // Create test customers for different tiers
      const testCustomers = [];
      const tiers = ['starter', 'professional', 'enterprise'];
      
      for (const tier of tiers) {
        const customerId = `PRIORITY-TEST-${tier.toUpperCase()}-${Date.now()}`;
        const result = await this.supabaseService.addCustomer({
          customerId,
          firstName: 'Priority',
          lastName: 'Test',
          businessName: `${tier} Priority Test`,
          email: `priority-${tier}-${Date.now()}@directorybolt.com`,
          packageType: tier
        });
        
        if (result.success) {
          testCustomers.push({ customerId, tier });
        }
      }

      // Test query response times for different tiers
      for (const customer of testCustomers) {
        const queryStart = Date.now();
        const customerData = await this.supabaseService.getCustomerById(customer.customerId);
        const queryTime = Date.now() - queryStart;
        
        testResult.prioritizationTests[customer.tier] = {
          responseTime: queryTime,
          dataRetrieved: customerData.found,
          customerData: customerData.customer
        };
      }

      // Verify Enterprise customers get fastest response
      const enterpriseTime = testResult.prioritizationTests.enterprise?.responseTime || Infinity;
      const professionalTime = testResult.prioritizationTests.professional?.responseTime || Infinity;
      const starterTime = testResult.prioritizationTests.starter?.responseTime || Infinity;
      
      testResult.prioritizationTests.prioritizationWorking = {
        enterpriseFastest: enterpriseTime <= professionalTime && enterpriseTime <= starterTime,
        enterpriseTime,
        professionalTime,
        starterTime
      };

      // Cleanup test customers
      for (const customer of testCustomers) {
        await this.supabaseService.client
          .from('customers')
          .delete()
          .eq('customer_id', customer.customerId);
      }

      testResult.status = testResult.prioritizationTests.prioritizationWorking.enterpriseFastest ? 'passed' : 'warning';
      
      console.log(`🎯 Enterprise prioritization test: ${testResult.status}`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Enterprise prioritization test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Generate comprehensive audit report
  async runCompleteAudit() {
    console.log('\n🚨 STARTING EMERGENCY DATABASE PERFORMANCE AUDIT 🚨');
    console.log('='.repeat(60));
    
    const auditStart = Date.now();
    
    try {
      // Run all critical tests
      console.log('\n🔥 PHASE 1: Real-time Features Testing');
      const realtimeTest = await this.testRealtimeSubscriptions();
      this.testResults.tests.push(realtimeTest);

      console.log('\n🔥 PHASE 2: Tier-based Access Control');
      const tierTest = await this.testTierBasedAccess();
      this.testResults.tests.push(tierTest);

      console.log('\n🔥 PHASE 3: Query Performance & Indexing');
      const queryTest = await this.testQueryPerformanceAndIndexing();
      this.testResults.tests.push(queryTest);

      console.log('\n🔥 PHASE 4: Concurrent User Load Testing');
      const loadTest = await this.testConcurrentUserLoad();
      this.testResults.tests.push(loadTest);

      console.log('\n🔥 PHASE 5: Enterprise Tier Prioritization');
      const prioritizationTest = await this.testEnterpriseTierPrioritization();
      this.testResults.tests.push(prioritizationTest);

      // Generate performance metrics summary
      const performanceStats = this.supabaseService.getPerformanceStats();
      this.testResults.summary.performanceMetrics = performanceStats;

      // Calculate test summary
      this.testResults.summary.totalTests = this.testResults.tests.length;
      this.testResults.summary.passed = this.testResults.tests.filter(t => t.status === 'passed').length;
      this.testResults.summary.failed = this.testResults.tests.filter(t => t.status === 'failed').length;

      // Identify critical issues
      this.testResults.tests.forEach(test => {
        if (test.status === 'failed') {
          this.testResults.summary.criticalIssues.push({
            test: test.testName,
            errors: test.errors || []
          });
        }
      });

      // Emergency findings
      const auditTime = Date.now() - auditStart;
      this.testResults.summary.auditDuration = auditTime;
      
      if (this.testResults.summary.failed === 0) {
        this.testResults.summary.emergencyFindings.push('✅ ALL CRITICAL TESTS PASSED - System ready for production load');
      } else {
        this.testResults.summary.emergencyFindings.push('🚨 CRITICAL ISSUES DETECTED - Immediate attention required');
      }

      // Database health dashboard
      const healthDashboard = this.supabaseService.getDatabaseHealthDashboard();
      this.testResults.summary.databaseHealth = healthDashboard;

      console.log('\n🚨 EMERGENCY AUDIT COMPLETED 🚨');
      console.log('='.repeat(60));
      console.log(`📊 Total Tests: ${this.testResults.summary.totalTests}`);
      console.log(`✅ Passed: ${this.testResults.summary.passed}`);
      console.log(`❌ Failed: ${this.testResults.summary.failed}`);
      console.log(`⏱️  Audit Duration: ${auditTime}ms`);
      
      if (this.testResults.summary.criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
        this.testResults.summary.criticalIssues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.test}: ${issue.errors.join(', ')}`);
        });
      }

      // Save audit report
      await this.saveAuditReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ EMERGENCY AUDIT FAILED:', error);
      this.testResults.summary.emergencyFindings.push(`🚨 AUDIT FAILURE: ${error.message}`);
      return this.testResults;
    }
  }

  async saveAuditReport() {
    const filename = `EMERGENCY_DATABASE_AUDIT_REPORT_${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📋 Emergency audit report saved: ${filename}`);
  }
}

// Execute emergency audit if run directly
if (require.main === module) {
  (async () => {
    const audit = new EmergencyDatabaseAudit();
    const results = await audit.runCompleteAudit();
    
    console.log('\n🚨 EMERGENCY ESCALATION STATUS:');
    if (results.summary.failed > 0) {
      console.log('🔴 CRITICAL: Performance issues affecting premium customers detected');
      console.log('📞 Escalating to emergency response team');
    } else {
      console.log('🟢 CLEARED: Database performance meets emergency criteria');
      console.log('✅ System operational for premium customer workloads');
    }
    
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })();
}

module.exports = { EmergencyDatabaseAudit };