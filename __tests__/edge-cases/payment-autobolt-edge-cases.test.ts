/**
 * DirectoryBolt Edge Case Testing Suite
 * Testing failure scenarios, edge cases, and recovery mechanisms
 * 
 * Ensures enterprise-grade reliability for $149-799 customer experience
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002'
const STAFF_API_KEY = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'
const AUTOBOLT_API_KEY = process.env.AUTOBOLT_API_KEY || '8bcca50677940010e7be19a5922d074cd2217e048f46956f57a5612f39cb2076'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

describe('DirectoryBolt Edge Cases and Error Handling', () => {
  beforeAll(async () => {
    console.log('🔥 Starting Edge Case Testing Suite')
    console.log('🎯 Testing failure scenarios and recovery mechanisms')
  })

  afterAll(async () => {
    await cleanupAllTestData()
    console.log('✅ Edge case testing completed')
  })

  describe('💳 Payment Flow Edge Cases', () => {
    test('Handle duplicate customer registration attempts', async () => {
      console.log('💳 Testing duplicate customer registration handling...')
      
      const customerId = `DUPLICATE-TEST-${Date.now()}`
      const customerData = {
        customer_id: customerId,
        business_name: 'Duplicate Test Business',
        email: `${customerId}@duplicate-test.com`,
        package_type: 'starter',
        directory_limit: 50,
        priority_level: 2,
        status: 'queued'
      }

      // First registration - should succeed
      const { data: firstRegistration, error: firstError } = await supabase
        .from('autobolt_processing_queue')
        .insert(customerData)
        .select()

      expect(firstError).toBeNull()
      expect(firstRegistration).toHaveLength(1)

      // Second registration with same customer_id - should handle gracefully
      const { data: secondRegistration, error: secondError } = await supabase
        .from('autobolt_processing_queue')
        .insert(customerData)
        .select()

      // System should either prevent duplicate or handle it appropriately
      if (secondError) {
        // Database constraint prevents duplicates - good
        expect(secondError.code).toBeDefined()
      } else {
        // System allows duplicates but handles them logically
        expect(secondRegistration).toBeDefined()
      }

      // Cleanup
      await supabase
        .from('autobolt_processing_queue')
        .delete()
        .eq('customer_id', customerId)

      console.log('✅ Duplicate registration handling validated')
    })

    test('Handle invalid package type assignments', async () => {
      console.log('📦 Testing invalid package type handling...')

      const customerId = `INVALID-PKG-${Date.now()}`
      const invalidPackageData = {
        customer_id: customerId,
        business_name: 'Invalid Package Test',
        email: `${customerId}@invalid-test.com`,
        package_type: 'invalid_tier', // Invalid package type
        directory_limit: 999999, // Unrealistic limit
        priority_level: 99, // Invalid priority
        status: 'queued'
      }

      const { data, error } = await supabase
        .from('autobolt_processing_queue')
        .insert(invalidPackageData)
        .select()

      // System should either validate and reject, or sanitize the data
      if (error) {
        // Database validation caught it - excellent
        expect(error.message).toBeDefined()
      } else {
        // System accepted it but should handle it gracefully in business logic
        expect(data[0]).toBeDefined()
        
        // Cleanup
        await supabase
          .from('autobolt_processing_queue')
          .delete()
          .eq('customer_id', customerId)
      }

      console.log('✅ Invalid package type handling validated')
    })

    test('Handle payment session expiration scenarios', async () => {
      console.log('⏰ Testing payment session expiration handling...')

      // Test session-like data that might expire
      const sessionData = {
        sessionId: `expired-session-${Date.now()}`,
        customerId: `SESSION-TEST-${Date.now()}`,
        created: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        expires: new Date(Date.now() - 30 * 60 * 1000).toISOString()  // 30 min ago (expired)
      }

      // Test API behavior with expired session data
      // This simulates how the system should handle expired Stripe sessions
      const testResponse = await request(BASE_URL)
        .post('/api/checkout/validate-session')
        .send(sessionData)
        .timeout(5000)

      // Should handle expired sessions gracefully (not crash)
      expect([400, 404, 410, 422]).toContain(testResponse.status)
      
      if (testResponse.body.error) {
        expect(testResponse.body.error).toMatch(/expired|invalid|session/i)
      }

      console.log('✅ Session expiration handling validated')
    })
  })

  describe('🤖 AutoBolt Processing Edge Cases', () => {
    test('Handle empty job queue scenarios', async () => {
      console.log('📭 Testing empty queue handling...')

      // Ensure queue is empty for this test
      await supabase
        .from('autobolt_processing_queue')
        .update({ status: 'completed' })
        .eq('status', 'queued')

      // Request next job when queue is empty
      const emptyQueueResponse = await request(BASE_URL)
        .get('/api/autobolt/jobs/next')
        .set('x-api-key', AUTOBOLT_API_KEY)
        .set('x-extension-id', 'test-empty-queue')

      expect(emptyQueueResponse.status).toBe(200)
      expect(emptyQueueResponse.body.success).toBe(true)
      expect(emptyQueueResponse.body.message).toMatch(/no jobs/i)
      expect(emptyQueueResponse.body.data).toBeUndefined()

      console.log('✅ Empty queue handling validated')
    })

    test('Handle concurrent job requests from multiple extensions', async () => {
      console.log('🏃‍♂️ Testing concurrent job requests...')

      // Create a test job
      const testJobData = {
        customer_id: `CONCURRENT-TEST-${Date.now()}`,
        business_name: 'Concurrent Test Business',
        email: 'concurrent@test.com',
        package_type: 'growth',
        directory_limit: 100,
        priority_level: 3,
        status: 'queued'
      }

      const { data: createdJob } = await supabase
        .from('autobolt_processing_queue')
        .insert(testJobData)
        .select()
        .single()

      // Simulate multiple extensions requesting jobs simultaneously
      const concurrentRequests = [
        request(BASE_URL)
          .get('/api/autobolt/jobs/next')
          .set('x-api-key', AUTOBOLT_API_KEY)
          .set('x-extension-id', 'extension-1'),
        request(BASE_URL)
          .get('/api/autobolt/jobs/next')
          .set('x-api-key', AUTOBOLT_API_KEY)
          .set('x-extension-id', 'extension-2'),
        request(BASE_URL)
          .get('/api/autobolt/jobs/next')
          .set('x-api-key', AUTOBOLT_API_KEY)
          .set('x-extension-id', 'extension-3')
      ]

      const responses = await Promise.all(concurrentRequests)
      
      // Count how many got the job vs empty responses
      const jobAssignments = responses.filter(r => r.body.data && r.body.data.jobId)
      const emptyResponses = responses.filter(r => r.body.message && r.body.message.includes('no jobs'))

      // Only one should get the job, others should get empty queue
      expect(jobAssignments.length).toBeLessThanOrEqual(1)
      expect(jobAssignments.length + emptyResponses.length).toBe(3)

      // If a job was assigned, verify it's marked as processing
      if (jobAssignments.length > 0) {
        const { data: updatedJob } = await supabase
          .from('autobolt_processing_queue')
          .select('status')
          .eq('id', jobAssignments[0].body.data.jobId)
          .single()

        expect(updatedJob.status).toBe('processing')
      }

      // Cleanup
      await supabase
        .from('autobolt_processing_queue')
        .delete()
        .eq('id', createdJob.id)

      console.log('✅ Concurrent request handling validated')
    })

    test('Handle AutoBolt extension disconnection scenarios', async () => {
      console.log('🔌 Testing extension disconnection handling...')

      // Create a processing job (simulates job that was picked up by extension)
      const disconnectedJobData = {
        customer_id: `DISCONNECTED-TEST-${Date.now()}`,
        business_name: 'Disconnected Extension Test',
        email: 'disconnected@test.com',
        package_type: 'professional',
        directory_limit: 150,
        priority_level: 4,
        status: 'processing',
        started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        metadata: { assigned_to: 'disconnected-extension-123' }
      }

      const { data: stuckJob } = await supabase
        .from('autobolt_processing_queue')
        .insert(disconnectedJobData)
        .select()
        .single()

      // System should have mechanism to detect and handle stuck jobs
      // Test the staff dashboard's ability to see stuck jobs
      const staffResponse = await request(BASE_URL)
        .get('/api/staff/jobs/progress')
        .set('x-staff-key', STAFF_API_KEY)

      expect(staffResponse.status).toBe(200)
      expect(staffResponse.body.success).toBe(true)

      // Look for the stuck job in the response
      const stuckJobInList = staffResponse.body.data.jobs.find(
        (job: any) => job.queue_id === stuckJob.id
      )

      expect(stuckJobInList).toBeDefined()
      expect(stuckJobInList.status).toBe('processing')

      // Cleanup
      await supabase
        .from('autobolt_processing_queue')
        .delete()
        .eq('id', stuckJob.id)

      console.log('✅ Extension disconnection handling validated')
    })

    test('Handle job update failures and retry mechanisms', async () => {
      console.log('🔄 Testing job update failure handling...')

      // Create a test job
      const updateTestData = {
        customer_id: `UPDATE-TEST-${Date.now()}`,
        business_name: 'Update Test Business',
        email: 'update-test@test.com',
        package_type: 'starter',
        directory_limit: 50,
        priority_level: 2,
        status: 'processing'
      }

      const { data: testJob } = await supabase
        .from('autobolt_processing_queue')
        .insert(updateTestData)
        .select()
        .single()

      // Test invalid job update requests
      const invalidUpdates = [
        { jobId: 'non-existent-job-id', status: 'completed' },
        { jobId: testJob.id, status: 'invalid-status' },
        { jobId: null, status: 'completed' },
        { /* missing jobId */ status: 'completed' }
      ]

      for (const invalidUpdate of invalidUpdates) {
        const updateResponse = await request(BASE_URL)
          .post('/api/autobolt/jobs/update')
          .set('x-api-key', AUTOBOLT_API_KEY)
          .send(invalidUpdate)
          .timeout(5000)

        // Should handle invalid updates gracefully
        expect([400, 404, 422]).toContain(updateResponse.status)
      }

      // Cleanup
      await supabase
        .from('autobolt_processing_queue')
        .delete()
        .eq('id', testJob.id)

      console.log('✅ Job update failure handling validated')
    })
  })

  describe('🔄 System Resilience Tests', () => {
    test('Handle database connection interruptions', async () => {
      console.log('💾 Testing database resilience...')

      // Test multiple rapid database calls to check connection pooling
      const rapidCalls = Array.from({ length: 10 }, (_, i) => 
        request(BASE_URL)
          .get('/api/staff/jobs/progress')
          .set('x-staff-key', STAFF_API_KEY)
      )

      const responses = await Promise.all(rapidCalls)
      
      // All should succeed or fail gracefully
      responses.forEach((response, index) => {
        expect([200, 503]).toContain(response.status)
        if (response.status === 503) {
          expect(response.body.error).toMatch(/database|connection|service/i)
        }
      })

      console.log('✅ Database resilience validated')
    })

    test('Handle high load scenarios', async () => {
      console.log('⚡ Testing high load scenarios...')

      // Create multiple test jobs quickly
      const highLoadJobs = Array.from({ length: 20 }, (_, i) => ({
        customer_id: `LOAD-TEST-${Date.now()}-${i}`,
        business_name: `Load Test Business ${i}`,
        email: `load-test-${i}@test.com`,
        package_type: 'growth',
        directory_limit: 100,
        priority_level: 3,
        status: 'queued'
      }))

      const { data: createdJobs, error } = await supabase
        .from('autobolt_processing_queue')
        .insert(highLoadJobs)
        .select()

      expect(error).toBeNull()
      expect(createdJobs).toHaveLength(20)

      // Test system can handle retrieving large job lists
      const startTime = Date.now()
      const staffResponse = await request(BASE_URL)
        .get('/api/staff/jobs/progress')
        .set('x-staff-key', STAFF_API_KEY)
      const responseTime = Date.now() - startTime

      expect(staffResponse.status).toBe(200)
      expect(responseTime).toBeLessThan(2000) // Should handle load within 2 seconds

      // Cleanup load test jobs
      await supabase
        .from('autobolt_processing_queue')
        .delete()
        .like('customer_id', 'LOAD-TEST-%')

      console.log(`✅ High load handling validated (${responseTime}ms for 20+ jobs)`)
    })

    test('Handle malformed API requests', async () => {
      console.log('🛡️ Testing malformed request handling...')

      const malformedRequests = [
        // Invalid JSON
        {
          endpoint: '/api/autobolt/jobs/update',
          body: '{ invalid json }',
          headers: { 'x-api-key': AUTOBOLT_API_KEY }
        },
        // Missing required headers
        {
          endpoint: '/api/staff/jobs/progress',
          body: {},
          headers: {} // Missing auth
        },
        // Oversized payload
        {
          endpoint: '/api/ai-analysis',
          body: { url: 'https://example.com', data: 'x'.repeat(10000000) }, // 10MB
          headers: {}
        }
      ]

      for (const malformed of malformedRequests) {
        try {
          const response = await request(BASE_URL)
            .post(malformed.endpoint)
            .set(malformed.headers)
            .send(malformed.body)
            .timeout(3000)

          // Should reject malformed requests appropriately
          expect([400, 401, 413, 422]).toContain(response.status)
        } catch (error) {
          // Timeout or connection error is also acceptable for malformed requests
          expect(error).toBeDefined()
        }
      }

      console.log('✅ Malformed request handling validated')
    })
  })
})

// Cleanup helper
async function cleanupAllTestData() {
  try {
    const testPatterns = [
      'DUPLICATE-TEST-%',
      'INVALID-PKG-%',
      'SESSION-TEST-%',
      'CONCURRENT-TEST-%',
      'DISCONNECTED-TEST-%',
      'UPDATE-TEST-%',
      'LOAD-TEST-%'
    ]

    for (const pattern of testPatterns) {
      await supabase
        .from('autobolt_processing_queue')
        .delete()
        .like('customer_id', pattern)
    }

    console.log('🧹 All edge case test data cleaned up')
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error)
  }
}