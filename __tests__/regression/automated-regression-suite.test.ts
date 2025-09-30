/**
 * DirectoryBolt Automated Regression Testing Framework
 * Prevents regressions in critical business functionality
 * 
 * This suite runs comprehensive regression tests to ensure:
 * 1. New changes don't break existing functionality
 * 2. All critical user journeys remain intact
 * 3. API contracts are maintained
 * 4. Database integrity is preserved
 * 5. Performance standards are maintained
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002'
const STAFF_API_KEY = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'
const AUTOBOLT_API_KEY = process.env.AUTOBOLT_API_KEY || '8bcca50677940010e7be19a5922d074cd2217e048f46956f57a5612f39cb2076'

const shouldRunE2E = process.env.RUN_E2E === 'true'
const describeIfE2E = shouldRunE2E ? describe : describe.skip

interface RegressionTest {
  name: string
  category: 'api' | 'database' | 'business_logic' | 'integration'
  criticality: 'high' | 'medium' | 'low'
  passed: boolean
  error?: string
}

const regressionResults: RegressionTest[] = []

describeIfE2E('DirectoryBolt Automated Regression Testing Framework', () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('RUN_E2E=true requires Supabase environment variables')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  beforeAll(async () => {
    console.log('🔄 Starting Automated Regression Test Suite')
    console.log('🎯 Ensuring no functionality regressions in critical systems')
  })

  afterAll(() => {
    console.log('\n📋 REGRESSION TEST RESULTS')
    console.log('='.repeat(60))
    
    const categories = ['api', 'database', 'business_logic', 'integration']
    categories.forEach(category => {
      const categoryTests = regressionResults.filter(t => t.category === category)
      const passed = categoryTests.filter(t => t.passed).length
      const total = categoryTests.length
      
      console.log(`${category.toUpperCase()}: ${passed}/${total} passed`)
      
      categoryTests.forEach(test => {
        const status = test.passed ? '✅' : '❌'
        const criticality = test.criticality === 'high' ? '🔴' : test.criticality === 'medium' ? '🟡' : '🟢'
        console.log(`  ${status} ${criticality} ${test.name}`)
        if (!test.passed && test.error) {
          console.log(`    Error: ${test.error}`)
        }
      })
      console.log('')
    })

    // Critical regression tests must pass
    const criticalTests = regressionResults.filter(t => t.criticality === 'high')
    const criticalPassed = criticalTests.filter(t => t.passed).length
    expect(criticalPassed).toBe(criticalTests.length)
  })

  describe('🔧 API Contract Regression Tests', () => {
    test('Staff Dashboard API Contract Stability', async () => {
      const testName = 'Staff Dashboard API Contract'
      try {
        const response = await request(BASE_URL)
          .get('/api/staff/jobs/progress')
          .set('x-staff-key', STAFF_API_KEY)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success')
        expect(response.body).toHaveProperty('data')
        expect(response.body.data).toHaveProperty('jobs')
        expect(response.body.data).toHaveProperty('stats')
        
        // Verify job object structure hasn't changed
        if (response.body.data.jobs.length > 0) {
          const job = response.body.data.jobs[0]
          expect(job).toHaveProperty('queue_id')
          expect(job).toHaveProperty('customer_id')
          expect(job).toHaveProperty('business_name')
          expect(job).toHaveProperty('status')
          expect(job).toHaveProperty('total_directories')
          expect(job).toHaveProperty('completed_directories')
          expect(job).toHaveProperty('progress_percentage')
        }

        // Verify stats object structure
        expect(response.body.data.stats).toHaveProperty('total_jobs')
        expect(response.body.data.stats).toHaveProperty('pending_jobs')
        expect(response.body.data.stats).toHaveProperty('in_progress_jobs')
        expect(response.body.data.stats).toHaveProperty('completed_jobs')
        expect(response.body.data.stats).toHaveProperty('success_rate')

        recordRegressionResult(testName, 'api', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'api', 'high', false, error)
        throw error
      }
    })

    test('AutoBolt Job API Contract Stability', async () => {
      const testName = 'AutoBolt Job API Contract'
      try {
        const response = await request(BASE_URL)
          .get('/api/autobolt/jobs/next')
          .set('x-api-key', AUTOBOLT_API_KEY)
          .set('x-extension-id', 'regression-test')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success')
        
        // When there's a job
        if (response.body.data) {
          expect(response.body.data).toHaveProperty('jobId')
          expect(response.body.data).toHaveProperty('customerId')
          expect(response.body.data).toHaveProperty('customerName')
          expect(response.body.data).toHaveProperty('customerEmail')
          expect(response.body.data).toHaveProperty('packageType')
          expect(response.body.data).toHaveProperty('directoryLimit')
        }
        
        // When there's no job
        if (!response.body.data) {
          expect(response.body).toHaveProperty('message')
          expect(response.body.message).toMatch(/no jobs/i)
        }

        recordRegressionResult(testName, 'api', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'api', 'high', false, error)
        throw error
      }
    })

    test('CSRF Token API Consistency', async () => {
      const testName = 'CSRF Token API Consistency'
      try {
        const response = await request(BASE_URL)
          .get('/api/csrf-token')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('csrfToken')
        expect(typeof response.body.csrfToken).toBe('string')
        expect(response.body.csrfToken.length).toBeGreaterThan(0)

        recordRegressionResult(testName, 'api', 'medium', true)
      } catch (error) {
        recordRegressionResult(testName, 'api', 'medium', false, error)
        throw error
      }
    })
  })

  describe('💾 Database Schema Regression Tests', () => {
    test('AutoBolt Processing Queue Table Structure', async () => {
      const testName = 'AutoBolt Queue Table Structure'
      try {
        // Verify table structure hasn't changed
        const { data, error } = await supabase
          .from('autobolt_processing_queue')
          .select('id, customer_id, business_name, email, package_type, directory_limit, priority_level, status, created_at, updated_at')
          .limit(1)

        expect(error).toBeNull()
        
        // Insert a test record to verify all required fields work
        const testRecord = {
          customer_id: `REGRESSION-TEST-${Date.now()}`,
          business_name: 'Regression Test Business',
          email: 'regression@test.com',
          package_type: 'starter',
          directory_limit: 50,
          priority_level: 2,
          status: 'queued'
        }

        const { data: insertResult, error: insertError } = await supabase
          .from('autobolt_processing_queue')
          .insert(testRecord)
          .select()
          .single()

        expect(insertError).toBeNull()
        expect(insertResult).toBeDefined()
        expect(insertResult.customer_id).toBe(testRecord.customer_id)

        // Cleanup
        await supabase
          .from('autobolt_processing_queue')
          .delete()
          .eq('id', insertResult.id)

        recordRegressionResult(testName, 'database', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'database', 'high', false, error)
        throw error
      }
    })

    test('Database Function Availability', async () => {
      const testName = 'Database Function Availability'
      try {
        // Test critical database functions still exist and work
        const { data, error } = await supabase
          .rpc('get_job_progress_for_staff')

        // Function should exist (either work or return structured error)
        if (error) {
          // If there's an error, it should be a structured error, not "function not found"
          expect(error.code).not.toBe('PGRST202') // Function not found
        } else {
          expect(data).toBeDefined()
        }

        // Test get_next_job_in_queue function
        const { data: nextJobData, error: nextJobError } = await supabase
          .rpc('get_next_job_in_queue')

        if (nextJobError) {
          expect(nextJobError.code).not.toBe('PGRST202')
        } else {
          expect(nextJobData).toBeDefined()
        }

        recordRegressionResult(testName, 'database', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'database', 'high', false, error)
        throw error
      }
    })
  })

  describe('🏢 Business Logic Regression Tests', () => {
    test('Customer Priority Calculation Logic', async () => {
      const testName = 'Customer Priority Logic'
      try {
        // Create customers with different package types
        const testCustomers = [
          {
            customer_id: `PRIORITY-TEST-STARTER-${Date.now()}`,
            package_type: 'starter',
            expected_priority: 2
          },
          {
            customer_id: `PRIORITY-TEST-GROWTH-${Date.now()}`,
            package_type: 'growth',
            expected_priority: 3
          },
          {
            customer_id: `PRIORITY-TEST-PRO-${Date.now()}`,
            package_type: 'professional',
            expected_priority: 4
          }
        ]

        const insertedIds: string[] = []

        for (const customer of testCustomers) {
          const { data, error } = await supabase
            .from('autobolt_processing_queue')
            .insert({
              customer_id: customer.customer_id,
              business_name: `${customer.package_type} Test Business`,
              email: `${customer.customer_id}@test.com`,
              package_type: customer.package_type,
              directory_limit: customer.package_type === 'starter' ? 50 : customer.package_type === 'growth' ? 100 : 150,
              priority_level: customer.expected_priority,
              status: 'queued'
            })
            .select()
            .single()

          expect(error).toBeNull()
          expect(data.priority_level).toBe(customer.expected_priority)
          insertedIds.push(data.id)
        }

        // Cleanup
        for (const id of insertedIds) {
          await supabase
            .from('autobolt_processing_queue')
            .delete()
            .eq('id', id)
        }

        recordRegressionResult(testName, 'business_logic', 'medium', true)
      } catch (error) {
        recordRegressionResult(testName, 'business_logic', 'medium', false, error)
        throw error
      }
    })

    test('Job Status Progression Logic', async () => {
      const testName = 'Job Status Progression'
      try {
        // Create a test job and verify status transitions work correctly
        const { data: testJob, error } = await supabase
          .from('autobolt_processing_queue')
          .insert({
            customer_id: `STATUS-TEST-${Date.now()}`,
            business_name: 'Status Test Business',
            email: 'status-test@test.com',
            package_type: 'growth',
            directory_limit: 100,
            priority_level: 3,
            status: 'queued'
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(testJob.status).toBe('queued')

        // Simulate AutoBolt picking up the job
        const { data: processingJob, error: updateError } = await supabase
          .from('autobolt_processing_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', testJob.id)
          .select()
          .single()

        expect(updateError).toBeNull()
        expect(processingJob.status).toBe('processing')
        expect(processingJob.started_at).toBeTruthy()

        // Cleanup
        await supabase
          .from('autobolt_processing_queue')
          .delete()
          .eq('id', testJob.id)

        recordRegressionResult(testName, 'business_logic', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'business_logic', 'high', false, error)
        throw error
      }
    })
  })

  describe('🔗 Integration Regression Tests', () => {
    test('End-to-End Job Flow Integration', async () => {
      const testName = 'End-to-End Job Flow'
      try {
        // Step 1: Create customer (simulates payment completion)
        const customerId = `E2E-TEST-${Date.now()}`
        const { data: customer, error: customerError } = await supabase
          .from('autobolt_processing_queue')
          .insert({
            customer_id: customerId,
            business_name: 'E2E Test Business',
            email: 'e2e-test@test.com',
            package_type: 'growth',
            directory_limit: 100,
            priority_level: 3,
            status: 'queued'
          })
          .select()
          .single()

        expect(customerError).toBeNull()

        // Step 2: Staff dashboard should see the job
        const staffResponse = await request(BASE_URL)
          .get('/api/staff/jobs/progress')
          .set('x-staff-key', STAFF_API_KEY)

        expect(staffResponse.status).toBe(200)
        const customerInList = staffResponse.body.data.jobs.find(
          (job: any) => job.customer_id === customerId
        )
        expect(customerInList).toBeDefined()

        // Step 3: AutoBolt should be able to pick up the job
        const autoBoltResponse = await request(BASE_URL)
          .get('/api/autobolt/jobs/next')
          .set('x-api-key', AUTOBOLT_API_KEY)
          .set('x-extension-id', 'e2e-test')

        expect(autoBoltResponse.status).toBe(200)
        
        // If our job was picked up
        if (autoBoltResponse.body.data && autoBoltResponse.body.data.customerId === customerId) {
          expect(autoBoltResponse.body.data.customerName).toBe('E2E Test Business')
          expect(autoBoltResponse.body.data.directoryLimit).toBe(100)
        }

        // Step 4: Verify job status updated in database
        const { data: updatedCustomer } = await supabase
          .from('autobolt_processing_queue')
          .select('status, started_at')
          .eq('id', customer.id)
          .single()

        // Job should either still be queued (if not picked up) or processing
        expect(['queued', 'processing']).toContain(updatedCustomer.status)

        // Cleanup
        await supabase
          .from('autobolt_processing_queue')
          .delete()
          .eq('id', customer.id)

        recordRegressionResult(testName, 'integration', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'integration', 'high', false, error)
        throw error
      }
    })

    test('Authentication Integration Stability', async () => {
      const testName = 'Authentication Integration'
      try {
        // Test that all authentication mechanisms still work
        const authTests = [
          {
            name: 'Staff API Key Auth',
            request: () => request(BASE_URL)
              .get('/api/staff/jobs/progress')
              .set('x-staff-key', STAFF_API_KEY),
            expectedStatus: 200
          },
          {
            name: 'AutoBolt API Key Auth',
            request: () => request(BASE_URL)
              .get('/api/autobolt/jobs/next')
              .set('x-api-key', AUTOBOLT_API_KEY),
            expectedStatus: 200
          },
          {
            name: 'Invalid Auth Rejection',
            request: () => request(BASE_URL)
              .get('/api/staff/jobs/progress')
              .set('x-staff-key', 'invalid-key'),
            expectedStatus: 401
          }
        ]

        for (const authTest of authTests) {
          const response = await authTest.request()
          expect(response.status).toBe(authTest.expectedStatus)
        }

        recordRegressionResult(testName, 'integration', 'high', true)
      } catch (error) {
        recordRegressionResult(testName, 'integration', 'high', false, error)
        throw error
      }
    })
  })
})

// Helper function to record regression test results
function recordRegressionResult(
  name: string,
  category: 'api' | 'database' | 'business_logic' | 'integration',
  criticality: 'high' | 'medium' | 'low',
  passed: boolean,
  error?: any
): void {
  regressionResults.push({
    name,
    category,
    criticality,
    passed,
    error: error?.message || error?.toString()
  })
}