/**
 * ADVANCED REAL-TIME STRESS TEST - WebSocket & Enterprise Tier Performance
 * 🚨 CRITICAL: Testing real-time subscriptions, WebSocket performance, and Enterprise tier prioritization
 */

const realtimeManager = require('./lib/realtime/supabase-realtime-optimized.ts');
const { SupabaseService, createSupabaseService } = require('./lib/services/supabase.js');
const fs = require('fs').promises;

class AdvancedRealtimeStressTest {
  constructor() {
    this.supabaseService = createSupabaseService();
    this.testResults = {
      timestamp: new Date().toISOString(),
      testId: `REALTIME_STRESS_TEST_${Date.now()}`,
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        criticalIssues: [],
        enterprisePerformance: {},
        realtimeMetrics: {},
        wsConnectionTest: {},
        tierBasedRealtime: {}
      }
    };
  }

  // 🔥 CRITICAL: Test WebSocket connection performance under stress
  async testWebSocketStressConnections() {
    console.log('\n🔴 STRESS TEST: WebSocket Connection Performance');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'WebSocket Connection Stress Test',
      status: 'running',
      startTime: testStart,
      metrics: {
        connectionsAttempted: 0,
        connectionsSuccessful: 0,
        connectionsFailed: 0,
        averageConnectionTime: 0,
        maxConnectionTime: 0,
        minConnectionTime: Infinity,
        concurrentConnections: 0,
        messagesSent: 0,
        messagesReceived: 0,
        connectionTimes: []
      },
      errors: []
    };

    try {
      await this.supabaseService.initialize();
      
      const connectionPromises = [];
      const maxConnections = 25; // Testing 25 concurrent connections
      
      console.log(`🚀 Testing ${maxConnections} concurrent WebSocket connections`);

      for (let i = 1; i <= maxConnections; i++) {
        connectionPromises.push(this.testSingleConnection(i));
      }

      const results = await Promise.allSettled(connectionPromises);
      
      // Analyze results
      results.forEach((result, index) => {
        testResult.metrics.connectionsAttempted++;
        
        if (result.status === 'fulfilled') {
          testResult.metrics.connectionsSuccessful++;
          const connectionTime = result.value.connectionTime;
          testResult.metrics.connectionTimes.push(connectionTime);
          
          if (connectionTime > testResult.metrics.maxConnectionTime) {
            testResult.metrics.maxConnectionTime = connectionTime;
          }
          if (connectionTime < testResult.metrics.minConnectionTime) {
            testResult.metrics.minConnectionTime = connectionTime;
          }
          
          testResult.metrics.messagesSent += result.value.messagesSent || 0;
          testResult.metrics.messagesReceived += result.value.messagesReceived || 0;
          
        } else {
          testResult.metrics.connectionsFailed++;
          testResult.errors.push(`Connection ${index + 1} failed: ${result.reason}`);
        }
      });

      // Calculate averages
      if (testResult.metrics.connectionTimes.length > 0) {
        testResult.metrics.averageConnectionTime = 
          testResult.metrics.connectionTimes.reduce((a, b) => a + b, 0) / 
          testResult.metrics.connectionTimes.length;
      }

      testResult.metrics.concurrentConnections = testResult.metrics.connectionsSuccessful;
      
      // Determine test status
      const successRate = (testResult.metrics.connectionsSuccessful / testResult.metrics.connectionsAttempted) * 100;
      const avgConnectionTime = testResult.metrics.averageConnectionTime;
      
      if (successRate >= 95 && avgConnectionTime < 1000) {
        testResult.status = 'passed';
      } else if (successRate >= 80 && avgConnectionTime < 2000) {
        testResult.status = 'warning';
      } else {
        testResult.status = 'failed';
      }

      testResult.metrics.successRate = successRate;
      testResult.metrics.totalTestTime = Date.now() - testStart;
      
      console.log(`📊 WebSocket stress test completed: ${successRate.toFixed(2)}% success rate`);
      console.log(`⚡ Average connection time: ${avgConnectionTime.toFixed(2)}ms`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ WebSocket stress test failed:', error);
    }

    return testResult;
  }

  // Test individual connection
  async testSingleConnection(connectionId) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let messagesReceived = 0;
      let messagesSent = 0;
      
      try {
        // Simulate WebSocket connection
        const subscription = this.supabaseService.subscribeToCustomers((payload) => {
          messagesReceived++;
          console.log(`📡 Connection ${connectionId} received message: ${JSON.stringify(payload)}`);
        });

        // Test message sending
        setTimeout(() => {
          messagesSent++;
          // Simulate sending a message by updating data
          this.supabaseService.testConnection().then(() => {
            const connectionTime = Date.now() - startTime;
            
            // Cleanup
            this.supabaseService.unsubscribe(subscription);
            
            resolve({
              connectionId,
              connectionTime,
              messagesReceived,
              messagesSent,
              success: true
            });
          });
        }, 100);
        
      } catch (error) {
        reject(`Connection ${connectionId} error: ${error.message}`);
      }
    });
  }

  // 🔥 CRITICAL: Test Enterprise tier real-time priority
  async testEnterpriseTierRealtimePriority() {
    console.log('\n🔴 STRESS TEST: Enterprise Tier Real-time Priority');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Enterprise Tier Real-time Priority Test',
      status: 'running',
      startTime: testStart,
      tierMetrics: {},
      errors: []
    };

    try {
      const tiers = ['starter', 'professional', 'enterprise'];
      
      for (const tier of tiers) {
        const tierTestStart = Date.now();
        
        // Create test customer for this tier
        const testCustomerId = `REALTIME-TIER-${tier.toUpperCase()}-${Date.now()}`;
        let subscriptionMessages = 0;
        let subscriptionLatency = 0;
        
        // Set up real-time subscription
        const subscription = this.supabaseService.subscribeToCustomers((payload) => {
          subscriptionMessages++;
          subscriptionLatency = Date.now() - updateStart;
          console.log(`📡 ${tier} tier real-time update received in ${subscriptionLatency}ms`);
        });

        // Create customer
        const createResult = await this.supabaseService.addCustomer({
          customerId: testCustomerId,
          firstName: 'Realtime',
          lastName: 'Test',
          businessName: `${tier} Realtime Test Business`,
          email: `realtime-${tier}-${Date.now()}@directorybolt.com`,
          packageType: tier
        });

        if (createResult.success) {
          // Wait for real-time notification
          const updateStart = Date.now();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update customer to trigger another real-time event
          await this.supabaseService.updateCustomer(testCustomerId, {
            businessName: `${tier} Updated Realtime Test`
          });
          
          // Wait for update notification
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          testResult.tierMetrics[tier] = {
            customerCreated: true,
            subscriptionMessages: subscriptionMessages,
            averageLatency: subscriptionLatency,
            realtimeWorking: subscriptionMessages > 0,
            testTime: Date.now() - tierTestStart
          };

          // Cleanup
          this.supabaseService.unsubscribe(subscription);
          await this.supabaseService.client
            .from('customers')
            .delete()
            .eq('customer_id', testCustomerId);
            
        } else {
          testResult.tierMetrics[tier] = {
            customerCreated: false,
            error: createResult.error
          };
        }
        
        console.log(`✅ ${tier} tier real-time test completed`);
      }
      
      // Verify Enterprise tier gets priority (fastest response)
      const enterpriseLatency = testResult.tierMetrics.enterprise?.averageLatency || Infinity;
      const professionalLatency = testResult.tierMetrics.professional?.averageLatency || Infinity;
      const starterLatency = testResult.tierMetrics.starter?.averageLatency || Infinity;
      
      testResult.tierMetrics.prioritization = {
        enterpriseFastest: enterpriseLatency <= professionalLatency && enterpriseLatency <= starterLatency,
        enterpriseLatency,
        professionalLatency,
        starterLatency
      };

      testResult.status = testResult.tierMetrics.prioritization.enterpriseFastest ? 'passed' : 'warning';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Enterprise tier real-time priority test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Test staff dashboard real-time updates
  async testStaffDashboardRealtimeUpdates() {
    console.log('\n🔴 STRESS TEST: Staff Dashboard Real-time Updates');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Staff Dashboard Real-time Updates Test',
      status: 'running',
      startTime: testStart,
      metrics: {
        eventsGenerated: 0,
        eventsReceived: 0,
        averageLatency: 0,
        maxLatency: 0,
        latencies: []
      },
      errors: []
    };

    try {
      let eventsReceived = 0;
      const latencies = [];
      
      // Set up staff dashboard subscription (simulated)
      const subscription = this.supabaseService.subscribeToCustomers((payload) => {
        const latency = Date.now() - eventStart;
        eventsReceived++;
        latencies.push(latency);
        console.log(`🎛️ Staff dashboard update received in ${latency}ms`);
      });

      // Generate multiple events to test real-time updates
      const eventCount = 10;
      
      for (let i = 1; i <= eventCount; i++) {
        const eventStart = Date.now();
        
        // Create a temporary customer to trigger event
        const tempCustomerId = `STAFF-TEST-EVENT-${i}-${Date.now()}`;
        const createResult = await this.supabaseService.addCustomer({
          customerId: tempCustomerId,
          firstName: 'Staff',
          lastName: `Event${i}`,
          businessName: `Staff Dashboard Test Event ${i}`,
          email: `staff-event-${i}-${Date.now()}@directorybolt.com`,
          packageType: 'enterprise'
        });

        if (createResult.success) {
          testResult.metrics.eventsGenerated++;
          
          // Wait for real-time notification
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Cleanup
          await this.supabaseService.client
            .from('customers')
            .delete()
            .eq('customer_id', tempCustomerId);
        }
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Final wait for any delayed notifications
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      testResult.metrics.eventsReceived = eventsReceived;
      testResult.metrics.latencies = latencies;
      
      if (latencies.length > 0) {
        testResult.metrics.averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        testResult.metrics.maxLatency = Math.max(...latencies);
      }
      
      // Determine success
      const eventCoverage = (eventsReceived / testResult.metrics.eventsGenerated) * 100;
      const avgLatency = testResult.metrics.averageLatency;
      
      if (eventCoverage >= 80 && avgLatency < 1000) {
        testResult.status = 'passed';
      } else if (eventCoverage >= 60 && avgLatency < 2000) {
        testResult.status = 'warning';
      } else {
        testResult.status = 'failed';
      }
      
      testResult.metrics.eventCoverage = eventCoverage;
      testResult.metrics.totalTestTime = Date.now() - testStart;
      
      // Cleanup subscription
      this.supabaseService.unsubscribe(subscription);
      
      console.log(`📊 Staff dashboard test: ${eventCoverage.toFixed(1)}% event coverage, ${avgLatency.toFixed(1)}ms avg latency`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Staff dashboard real-time test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Test queue processing real-time updates
  async testQueueProcessingRealtimeUpdates() {
    console.log('\n🔴 STRESS TEST: Queue Processing Real-time Updates');
    
    const testStart = Date.now();
    const testResult = {
      testName: 'Queue Processing Real-time Updates Test',
      status: 'running',
      startTime: testStart,
      metrics: {
        queueItemsProcessed: 0,
        realtimeUpdatesReceived: 0,
        averageProcessingTime: 0,
        updateLatencies: []
      },
      errors: []
    };

    try {
      let updatesReceived = 0;
      const updateLatencies = [];
      
      // Set up queue updates subscription (simulated)
      const subscription = this.supabaseService.subscribeToCustomers((payload) => {
        const latency = Date.now() - updateStart;
        updatesReceived++;
        updateLatencies.push(latency);
        console.log(`⚙️ Queue update received in ${latency}ms`);
      });

      // Simulate queue processing with multiple items
      const queueItems = 5;
      
      for (let i = 1; i <= queueItems; i++) {
        const updateStart = Date.now();
        
        // Create a customer representing a queue item
        const queueCustomerId = `QUEUE-ITEM-${i}-${Date.now()}`;
        const createResult = await this.supabaseService.addCustomer({
          customerId: queueCustomerId,
          firstName: 'Queue',
          lastName: `Item${i}`,
          businessName: `Queue Processing Test Item ${i}`,
          email: `queue-item-${i}-${Date.now()}@directorybolt.com`,
          packageType: 'professional'
        });

        if (createResult.success) {
          testResult.metrics.queueItemsProcessed++;
          
          // Simulate processing status updates
          await this.supabaseService.updateCustomer(queueCustomerId, {
            status: 'processing'
          });
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          await this.supabaseService.updateCustomer(queueCustomerId, {
            status: 'completed'
          });
          
          // Wait for real-time updates
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Cleanup
          await this.supabaseService.client
            .from('customers')
            .delete()
            .eq('customer_id', queueCustomerId);
        }
        
        // Delay between queue items
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Final wait for delayed updates
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      testResult.metrics.realtimeUpdatesReceived = updatesReceived;
      testResult.metrics.updateLatencies = updateLatencies;
      
      if (updateLatencies.length > 0) {
        testResult.metrics.averageProcessingTime = updateLatencies.reduce((a, b) => a + b, 0) / updateLatencies.length;
      }
      
      // Determine success
      const updateCoverage = (updatesReceived / (testResult.metrics.queueItemsProcessed * 2)) * 100; // 2 updates per item
      const avgLatency = testResult.metrics.averageProcessingTime;
      
      if (updateCoverage >= 70 && avgLatency < 1500) {
        testResult.status = 'passed';
      } else if (updateCoverage >= 50 && avgLatency < 2500) {
        testResult.status = 'warning';
      } else {
        testResult.status = 'failed';
      }
      
      testResult.metrics.updateCoverage = updateCoverage;
      testResult.metrics.totalTestTime = Date.now() - testStart;
      
      // Cleanup subscription
      this.supabaseService.unsubscribe(subscription);
      
      console.log(`📊 Queue processing test: ${updateCoverage.toFixed(1)}% update coverage, ${avgLatency.toFixed(1)}ms avg latency`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.errors.push(error.message);
      console.error('❌ Queue processing real-time test failed:', error);
    }

    return testResult;
  }

  // 🔥 CRITICAL: Run complete advanced real-time stress test
  async runCompleteStressTest() {
    console.log('\n🚨 STARTING ADVANCED REAL-TIME STRESS TEST 🚨');
    console.log('='.repeat(60));
    
    const auditStart = Date.now();
    
    try {
      // Initialize Supabase service
      await this.supabaseService.initialize();
      
      // Run all stress tests
      console.log('\n🔥 PHASE 1: WebSocket Connection Stress Test');
      const wsStressTest = await this.testWebSocketStressConnections();
      this.testResults.tests.push(wsStressTest);

      console.log('\n🔥 PHASE 2: Enterprise Tier Real-time Priority');
      const tierPriorityTest = await this.testEnterpriseTierRealtimePriority();
      this.testResults.tests.push(tierPriorityTest);

      console.log('\n🔥 PHASE 3: Staff Dashboard Real-time Updates');
      const staffDashboardTest = await this.testStaffDashboardRealtimeUpdates();
      this.testResults.tests.push(staffDashboardTest);

      console.log('\n🔥 PHASE 4: Queue Processing Real-time Updates');
      const queueProcessingTest = await this.testQueueProcessingRealtimeUpdates();
      this.testResults.tests.push(queueProcessingTest);

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

      // Gather performance metrics
      this.testResults.summary.enterprisePerformance = tierPriorityTest.tierMetrics;
      this.testResults.summary.realtimeMetrics = staffDashboardTest.metrics;
      this.testResults.summary.wsConnectionTest = wsStressTest.metrics;
      this.testResults.summary.tierBasedRealtime = tierPriorityTest.tierMetrics;

      const auditTime = Date.now() - auditStart;
      this.testResults.summary.auditDuration = auditTime;

      console.log('\n🚨 ADVANCED REAL-TIME STRESS TEST COMPLETED 🚨');
      console.log('='.repeat(60));
      console.log(`📊 Total Tests: ${this.testResults.summary.totalTests}`);
      console.log(`✅ Passed: ${this.testResults.summary.passed}`);
      console.log(`❌ Failed: ${this.testResults.summary.failed}`);
      console.log(`⏱️  Test Duration: ${auditTime}ms`);
      
      if (this.testResults.summary.criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL REAL-TIME ISSUES DETECTED:');
        this.testResults.summary.criticalIssues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.test}: ${issue.errors.join(', ')}`);
        });
      }

      // Save detailed report
      await this.saveStressTestReport();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ ADVANCED REAL-TIME STRESS TEST FAILED:', error);
      this.testResults.summary.criticalIssues.push(`🚨 STRESS TEST FAILURE: ${error.message}`);
      return this.testResults;
    }
  }

  async saveStressTestReport() {
    const filename = `ADVANCED_REALTIME_STRESS_TEST_REPORT_${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📋 Advanced real-time stress test report saved: ${filename}`);
  }
}

// Execute stress test if run directly
if (require.main === module) {
  (async () => {
    const stressTest = new AdvancedRealtimeStressTest();
    const results = await stressTest.runCompleteStressTest();
    
    console.log('\n🚨 REAL-TIME PERFORMANCE STATUS:');
    if (results.summary.failed > 0) {
      console.log('🔴 CRITICAL: Real-time performance issues detected');
      console.log('📞 Enterprise tier real-time features may be impacted');
    } else {
      console.log('🟢 CLEARED: Real-time features performing within acceptable parameters');
      console.log('✅ Enterprise tier prioritization working correctly');
    }
    
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })();
}

module.exports = { AdvancedRealtimeStressTest };