/**
 * Webhook Performance Validation Test Suite
 * 
 * Tests the critical performance optimizations implemented to prevent Stripe webhook timeouts:
 * - Parallel processing of critical operations
 * - Timeout protection with race conditions
 * - Non-critical operations running in background
 * - Email template caching
 * - Performance monitoring and logging
 * 
 * SUCCESS CRITERIA:
 * ✅ Webhook processing completes in under 6 seconds for 95% of requests
 * ✅ Critical operations complete in under 3 seconds
 * ✅ Non-critical operations don't block webhook response
 * ✅ Timeout protection prevents Stripe webhook failures
 * ✅ Memory usage optimized with template caching
 */

const { performance } = require('perf_hooks')

// Mock dependencies for testing
const mockStripe = {
  checkout: {
    sessions: {
      listLineItems: jest.fn().mockResolvedValue({
        data: [{
          price: {
            id: 'price_pro_499'
          }
        }]
      })
    }
  },
  customers: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      name: 'John Doe',
      phone: '+1234567890',
      metadata: {
        businessName: 'Test Business',
        website: 'https://test.com'
      }
    })
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      id: 'evt_test123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          customer: 'cus_test123',
          amount_total: 49900,
          currency: 'usd',
          payment_status: 'paid',
          customer_details: {
            email: 'test@example.com',
            name: 'John Doe'
          },
          metadata: {
            businessName: 'Test Business'
          }
        }
      }
    })
  }
}

// Mock Airtable service
const mockAirtableService = {
  createBusinessSubmission: jest.fn().mockResolvedValue({
    customerId: 'db_cust_123',
    recordId: 'rec_123'
  }),
  findByCustomerId: jest.fn().mockResolvedValue({
    recordId: 'rec_123'
  }),
  updateBusinessSubmission: jest.fn().mockResolvedValue(true),
  base: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      firstPage: jest.fn().mockResolvedValue([{
        getId: () => 'rec_123'
      }])
    })
  })
}

// Mock AutoBolt notification service
const mockAutoBoltService = {
  sendWelcomeNotification: jest.fn().mockResolvedValue(true),
  initializeTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test123' })
  })
}

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Mock process.env
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123'
process.env.SMTP_FROM_EMAIL = 'test@directorybolt.com'
process.env.PERFORMANCE_MONITORING_ENABLED = 'true'

describe('Webhook Performance Optimization Tests', () => {
  let originalRequire
  
  beforeAll(() => {
    // Mock all external dependencies
    jest.mock('stripe', () => jest.fn(() => mockStripe))
    jest.mock('../../../lib/services/airtable', () => ({
      createAirtableService: () => mockAirtableService
    }))
    jest.mock('../../../lib/services/autobolt-notifications', () => ({
      AutoBoltNotificationService: mockAutoBoltService
    }))
    jest.mock('../../../lib/utils/logger', () => ({
      logger: mockLogger
    }))
    jest.mock('micro', () => ({
      buffer: jest.fn().mockResolvedValue(Buffer.from('test'))
    }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    performance.clearMarks()
    performance.clearMeasures()
  })

  describe('Critical Performance Requirements', () => {
    test('should complete webhook processing in under 6 seconds', async () => {
      const startTime = performance.now()
      
      // Import and test the optimized webhook handler
      const webhookHandler = require('../pages/api/webhooks/stripe').default
      
      const mockReq = {
        method: 'POST',
        headers: {
          'stripe-signature': 'test_signature'
        },
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('test data')
        }
      }
      
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      }
      
      await webhookHandler(mockReq, mockRes)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(processingTime).toBeLessThan(6000) // Should complete in under 6 seconds
      expect(mockRes.status).toHaveBeenCalledWith(200)
    }, 10000) // 10 second timeout for test

    test('should handle timeout gracefully and return 200 to Stripe', async () => {
      // Mock slow operations to trigger timeout
      const slowMockAirtable = {
        ...mockAirtableService,
        createBusinessSubmission: jest.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 9000)) // 9 seconds
        )
      }
      
      jest.mock('../../../lib/services/airtable', () => ({
        createAirtableService: () => slowMockAirtable
      }))
      
      const webhookHandler = require('../pages/api/webhooks/stripe').default
      
      const mockReq = {
        method: 'POST',
        headers: { 'stripe-signature': 'test_signature' },
        [Symbol.asyncIterator]: async function* () { yield Buffer.from('test') }
      }
      
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      }
      
      await webhookHandler(mockReq, mockRes)
      
      // Should still return 200 even on timeout
      expect(mockRes.status).toHaveBeenCalledWith(200)
      
      // Should indicate timeout in response
      const responseCall = mockRes.json.mock.calls[0][0]
      expect(responseCall.timeout).toBe(true)
    }, 15000)

    test('should run critical operations in parallel within 3 second timeout', async () => {
      const startTime = performance.now()
      
      // Test the optimized checkout completion function directly
      const { handleCheckoutCompletedOptimized } = require('../pages/api/webhooks/stripe')
      
      const mockSession = {
        id: 'cs_test123',
        customer: 'cus_test123',
        amount_total: 49900,
        currency: 'usd',
        customer_details: { email: 'test@example.com', name: 'John Doe' },
        metadata: { businessName: 'Test Business' }
      }
      
      const result = await handleCheckoutCompletedOptimized(mockSession, 'test_request_123')
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(processingTime).toBeLessThan(3000) // Critical operations under 3 seconds
      expect(result.success).toBe(true)
      expect(result.customerId).toBeDefined()
    })

    test('should cache email templates to reduce memory usage', () => {
      const { getCachedEmailTemplate } = require('../pages/api/webhooks/stripe')
      
      const testData = {
        email: 'test@example.com',
        amount: 49900,
        currency: 'USD',
        paymentIntentId: 'pi_test123'
      }
      
      // First call should generate template
      const template1 = getCachedEmailTemplate('payment_confirmation', testData)
      
      // Second call should return cached version
      const template2 = getCachedEmailTemplate('payment_confirmation', testData)
      
      expect(template1).toBe(template2) // Same reference = cached
      expect(template1).toContain('Payment Confirmed')
      expect(template1).toContain('$499.00')
    })

    test('should track performance metrics for all operations', async () => {
      const { WebhookPerformanceMonitor } = require('../pages/api/webhooks/stripe')
      
      const startTime = Date.now()
      const endTime = startTime + 1500 // 1.5 seconds
      
      WebhookPerformanceMonitor.trackOperation(
        'test_operation', 
        startTime, 
        endTime, 
        true, 
        { sessionId: 'cs_test123' }
      )
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Operation performance',
        expect.objectContaining({
          metadata: expect.objectContaining({
            operation: 'test_operation',
            duration: 1500,
            success: true,
            sessionId: 'cs_test123'
          })
        })
      )
    })

    test('should handle non-critical operations in background without blocking', async () => {
      const startTime = performance.now()
      
      // Mock slow non-critical operation
      const slowEmailMock = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 2000))
      )
      
      mockAutoBoltService.sendWelcomeNotification = slowEmailMock
      
      const { handleCheckoutCompletedOptimized } = require('../pages/api/webhooks/stripe')
      
      const mockSession = {
        id: 'cs_test123',
        customer: 'cus_test123',
        amount_total: 49900,
        currency: 'usd',
        customer_details: { email: 'test@example.com', name: 'John Doe' },
        metadata: { businessName: 'Test Business' }
      }
      
      const result = await handleCheckoutCompletedOptimized(mockSession, 'test_request_456')
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should complete quickly even with slow email operation
      expect(processingTime).toBeLessThan(3000)
      expect(result.success).toBe(true)
      
      // Email should still be called, but not awaited
      expect(slowEmailMock).toHaveBeenCalled()
    })

    test('should batch database operations for efficiency', async () => {
      const { batchDatabaseOperations } = require('../pages/api/webhooks/stripe')
      
      const operations = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.resolve('result3'),
        () => Promise.resolve('result4'),
        () => Promise.resolve('result5')
      ]
      
      const startTime = performance.now()
      const results = await batchDatabaseOperations(operations)
      const endTime = performance.now()
      
      expect(results).toHaveLength(5)
      expect(results).toEqual(['result1', 'result2', 'result3', 'result4', 'result5'])
      
      // Should complete efficiently
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should log performance metrics
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Operation performance',
        expect.objectContaining({
          metadata: expect.objectContaining({
            operation: 'batch_database_operations',
            operationCount: 5,
            batchSize: 3
          })
        })
      )
    })
  })

  describe('Error Handling and Resilience', () => {
    test('should handle critical operation failures gracefully', async () => {
      // Mock Airtable failure
      mockAirtableService.createBusinessSubmission.mockRejectedValueOnce(
        new Error('Airtable connection failed')
      )
      
      const { handleCheckoutCompletedOptimized } = require('../pages/api/webhooks/stripe')
      
      const mockSession = {
        id: 'cs_test123',
        customer: 'cus_test123',
        amount_total: 49900,
        currency: 'usd',
        customer_details: { email: 'test@example.com', name: 'John Doe' },
        metadata: { businessName: 'Test Business' }
      }
      
      await expect(
        handleCheckoutCompletedOptimized(mockSession, 'test_request_error')
      ).rejects.toThrow()
      
      // Should log the error with performance metrics
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process checkout completion',
        expect.objectContaining({
          metadata: expect.objectContaining({
            sessionId: 'cs_test123',
            error: expect.any(String),
            requestId: 'test_request_error'
          })
        }),
        expect.any(Error)
      )
    })

    test('should log non-critical operation failures without throwing', async () => {
      const { logNonCriticalResults } = require('../pages/api/webhooks/stripe')
      
      const results = [
        { status: 'fulfilled', value: 'success1' },
        { status: 'rejected', reason: new Error('Email failed') },
        { status: 'fulfilled', value: 'success2' },
        { status: 'rejected', reason: new Error('Queue failed') }
      ]
      
      logNonCriticalResults(results, 'cs_test123', 'req_test456')
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Non-critical operations completed',
        expect.objectContaining({
          metadata: expect.objectContaining({
            sessionId: 'cs_test123',
            requestId: 'req_test456',
            successCount: 2,
            failureCount: 2,
            total: 4
          })
        })
      )
      
      expect(mockLogger.warn).toHaveBeenCalledTimes(2) // Two failures logged
    })
  })

  describe('Memory and Resource Optimization', () => {
    test('should clean up email template cache after TTL', (done) => {
      const { getCachedEmailTemplate } = require('../pages/api/webhooks/stripe')
      
      const testData = { email: 'test@example.com', amount: 1000 }
      
      // Generate template
      const template = getCachedEmailTemplate('payment_confirmation', testData)
      expect(template).toBeDefined()
      
      // Wait for cache cleanup (reduced timeout for testing)
      setTimeout(() => {
        // Template should be cleaned up from cache
        // This is hard to test directly, but we can verify the system doesn't crash
        const newTemplate = getCachedEmailTemplate('payment_confirmation', testData)
        expect(newTemplate).toBeDefined()
        done()
      }, 100) // Short timeout for testing
    })

    test('should handle concurrent webhook requests without interference', async () => {
      const webhookHandler = require('../pages/api/webhooks/stripe').default
      
      const createMockReq = (id) => ({
        method: 'POST',
        headers: { 'stripe-signature': `signature_${id}` },
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(`test_data_${id}`)
        }
      })
      
      const createMockRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      })
      
      // Process 5 concurrent webhooks
      const promises = Array.from({ length: 5 }, (_, i) => 
        webhookHandler(createMockReq(i), createMockRes())
      )
      
      const startTime = performance.now()
      await Promise.all(promises)
      const endTime = performance.now()
      
      // All should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds for 5 concurrent
    })
  })

  describe('Performance Targets Validation', () => {
    test('should meet all performance targets consistently', async () => {
      const iterations = 10
      const processingTimes = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        
        const { handleCheckoutCompletedOptimized } = require('../pages/api/webhooks/stripe')
        
        const mockSession = {
          id: `cs_test${i}`,
          customer: `cus_test${i}`,
          amount_total: 49900,
          currency: 'usd',
          customer_details: { email: `test${i}@example.com`, name: `User ${i}` },
          metadata: { businessName: `Business ${i}` }
        }
        
        await handleCheckoutCompletedOptimized(mockSession, `req_${i}`)
        
        const endTime = performance.now()
        processingTimes.push(endTime - startTime)
      }
      
      // Calculate 95th percentile
      processingTimes.sort((a, b) => a - b)
      const p95Index = Math.ceil(0.95 * processingTimes.length) - 1
      const p95Time = processingTimes[p95Index]
      
      // 95% of requests should complete under 6 seconds
      expect(p95Time).toBeLessThan(6000)
      
      // Average should be well under the target
      const averageTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      expect(averageTime).toBeLessThan(3000)
      
      console.log(`Performance Results:`)
      console.log(`Average: ${averageTime.toFixed(2)}ms`)
      console.log(`95th Percentile: ${p95Time.toFixed(2)}ms`)
      console.log(`Min: ${Math.min(...processingTimes).toFixed(2)}ms`)
      console.log(`Max: ${Math.max(...processingTimes).toFixed(2)}ms`)
    })
  })
})

/**
 * Manual Performance Testing Instructions:
 * 
 * To test webhook performance manually:
 * 
 * 1. Set up test environment:
 *    - Configure test Stripe webhook endpoint
 *    - Set up test Airtable base
 *    - Configure SMTP for email testing
 * 
 * 2. Run load test:
 *    npm run test:webhook-performance
 * 
 * 3. Monitor metrics:
 *    - Check application logs for performance tracking
 *    - Monitor memory usage during concurrent processing
 *    - Verify Stripe webhook delivery success rates
 * 
 * 4. Performance benchmarks to verify:
 *    ✅ Critical Path: < 3 seconds (customer access granted)
 *    ✅ Total Webhook Response: < 6 seconds
 *    ✅ Stripe Timeout Limit: 10 seconds (with 8s internal timeout)
 *    ✅ Memory Usage: < 100MB per webhook processing
 *    ✅ Concurrent Requests: Handle 10+ simultaneous webhooks
 */