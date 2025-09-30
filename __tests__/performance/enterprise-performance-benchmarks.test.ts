/**
 * DirectoryBolt Enterprise Performance Benchmarks
 * Ensures DirectoryBolt meets enterprise-grade performance standards
 * 
 * Performance Targets:
 * - API responses: <500ms for business-critical endpoints
 * - Database queries: <200ms 
 * - Page loads: <2000ms for landing, <3000ms for dashboard
 * - Real-time updates: <100ms latency
 * - 99th percentile: All targets met under load
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import { performance } from 'perf_hooks'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002'
const STAFF_API_KEY = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'
const AUTOBOLT_API_KEY = process.env.AUTOBOLT_API_KEY || '8bcca50677940010e7be19a5922d074cd2217e048f46956f57a5612f39cb2076'

const shouldRunE2E = process.env.RUN_E2E === 'true'
const describeIfE2E = shouldRunE2E ? describe : describe.skip

interface PerformanceMetric {
  name: string
  target: number // milliseconds
  measurements: number[]
  passed: boolean
  average: number
  p95: number
  p99: number
}

const performanceResults: PerformanceMetric[] = []

describeIfE2E('DirectoryBolt Enterprise Performance Benchmarks', () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('RUN_E2E=true requires Supabase environment variables')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  beforeAll(async () => {
    console.log('⚡ Starting Enterprise Performance Benchmark Suite')
    console.log('🎯 Targets: API <500ms, DB <200ms, P99 compliance')
    
    // Warm up the system
    await warmUpSystem()
  })

  afterAll(() => {
    console.log('\n📊 PERFORMANCE BENCHMARK RESULTS')
    console.log('='.repeat(60))
    
    performanceResults.forEach(metric => {
      const status = metric.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} ${metric.name}`)
      console.log(`   Target: <${metric.target}ms | Avg: ${metric.average.toFixed(1)}ms`)
      console.log(`   P95: ${metric.p95.toFixed(1)}ms | P99: ${metric.p99.toFixed(1)}ms`)
      console.log('')
    })

    const passedTests = performanceResults.filter(m => m.passed).length
    const totalTests = performanceResults.length
    const passRate = ((passedTests / totalTests) * 100).toFixed(1)
    
    console.log(`Overall Performance Score: ${passedTests}/${totalTests} (${passRate}%)`)
    
    // Enterprise standard: 95% of performance tests must pass
    expect(passedTests / totalTests).toBeGreaterThanOrEqual(0.95)
  })

  describe('🚀 Critical API Performance', () => {
    test('Staff Dashboard Progress API - Business Critical', async () => {
      console.log('📊 Benchmarking Staff Dashboard API...')
      
      const measurements = await measureEndpoint(
        'Staff Progress API',
        () => request(BASE_URL)
          .get('/api/staff/jobs/progress')
          .set('x-staff-key', STAFF_API_KEY),
        500, // 500ms target
        50   // 50 measurements
      )

      recordPerformanceMetric('Staff Progress API', 500, measurements)
    })

    test('AutoBolt Job Retrieval API - Revenue Critical', async () => {
      console.log('🤖 Benchmarking AutoBolt Job API...')
      
      const measurements = await measureEndpoint(
        'AutoBolt Job API',
        () => request(BASE_URL)
          .get('/api/autobolt/jobs/next')
          .set('x-api-key', AUTOBOLT_API_KEY),
        200, // 200ms target - very fast for automation
        100  // 100 measurements
      )

      recordPerformanceMetric('AutoBolt Job API', 200, measurements)
    })

    test('CSRF Token API - User Experience Critical', async () => {
      console.log('🔒 Benchmarking CSRF Token API...')
      
      const measurements = await measureEndpoint(
        'CSRF Token API',
        () => request(BASE_URL).get('/api/csrf-token'),
        100, // 100ms target - should be very fast
        75   // 75 measurements
      )

      recordPerformanceMetric('CSRF Token API', 100, measurements)
    })
  })

  describe('💾 Database Performance Benchmarks', () => {
    test('Direct database query performance', async () => {
      console.log('💾 Benchmarking database queries...')
      
      const measurements: number[] = []
      
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now()
        
        const { data, error } = await supabase
          .from('autobolt_processing_queue')
          .select('id, customer_id, status, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(20)

        const endTime = performance.now()
        const duration = endTime - startTime

        expect(error).toBeNull()
        expect(data).toBeDefined()
        
        measurements.push(duration)
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      recordPerformanceMetric('Database Query', 200, measurements)
    })

    test('Database function performance', async () => {
      console.log('⚙️ Benchmarking database functions...')
      
      const measurements: number[] = []
      
      for (let i = 0; i < 30; i++) {
        const startTime = performance.now()
        
        const { data, error } = await supabase
          .rpc('get_job_progress_for_staff')

        const endTime = performance.now()
        const duration = endTime - startTime

        // Function should work or gracefully fail
        expect([null, undefined]).toContain(error || null)
        
        measurements.push(duration)
        
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      recordPerformanceMetric('Database Function', 300, measurements)
    })
  })

  describe('🔥 Load Testing and Stress Tests', () => {
    test('Concurrent API request handling', async () => {
      console.log('🏃‍♂️ Testing concurrent request performance...')
      
      const concurrencyLevels = [5, 10, 20]
      
      for (const concurrency of concurrencyLevels) {
        console.log(`  Testing ${concurrency} concurrent requests...`)
        
        const startTime = performance.now()
        
        const concurrentRequests = Array.from({ length: concurrency }, () =>
          request(BASE_URL)
            .get('/api/staff/jobs/progress')
            .set('x-staff-key', STAFF_API_KEY)
        )

        const responses = await Promise.all(concurrentRequests)
        const endTime = performance.now()
        const totalTime = endTime - startTime

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200)
        })

        // Average response time should still be reasonable under load
        const avgResponseTime = totalTime / concurrency
        expect(avgResponseTime).toBeLessThan(1000) // 1 second per request max under load
        
        console.log(`    ${concurrency} requests completed in ${totalTime.toFixed(1)}ms (avg: ${avgResponseTime.toFixed(1)}ms/req)`)
      }
    })

    test('Memory efficiency under repeated operations', async () => {
      console.log('🧠 Testing memory efficiency...')
      
      const initialMemory = process.memoryUsage()
      const measurements: number[] = []
      
      // Perform 200 operations to test for memory leaks
      for (let i = 0; i < 200; i++) {
        const startTime = performance.now()
        
        await request(BASE_URL)
          .get('/api/csrf-token')
          .expect(200)
        
        const endTime = performance.now()
        measurements.push(endTime - startTime)
        
        // Check memory every 50 operations
        if (i % 50 === 0) {
          const currentMemory = process.memoryUsage()
          const heapGrowth = currentMemory.heapUsed - initialMemory.heapUsed
          
          // Memory growth should be reasonable (< 50MB for 200 operations)
          expect(heapGrowth).toBeLessThan(50 * 1024 * 1024)
        }
      }

      // Performance should remain consistent (no degradation)
      const firstHalfAvg = measurements.slice(0, 100).reduce((a, b) => a + b, 0) / 100
      const secondHalfAvg = measurements.slice(100).reduce((a, b) => a + b, 0) / 100
      
      // Second half should not be significantly slower (performance degradation check)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5)
      
      console.log(`    Consistent performance: ${firstHalfAvg.toFixed(1)}ms → ${secondHalfAvg.toFixed(1)}ms`)
    })
  })

  describe('📊 Real-time Performance Requirements', () => {
    test('WebSocket-like real-time update simulation', async () => {
      console.log('⚡ Simulating real-time update performance...')
      
      // Simulate rapid polling that would happen in real-time dashboard
      const rapidPollingMeasurements: number[] = []
      
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now()
        
        const response = await request(BASE_URL)
          .get('/api/staff/jobs/progress')
          .set('x-staff-key', STAFF_API_KEY)
        
        const endTime = performance.now()
        const duration = endTime - startTime

        expect(response.status).toBe(200)
        rapidPollingMeasurements.push(duration)
        
        // Simulate real-time polling interval
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      recordPerformanceMetric('Real-time Polling', 150, rapidPollingMeasurements)
    })
  })
})

// Performance measurement helpers
async function measureEndpoint(
  name: string,
  requestFn: () => request.Test,
  targetMs: number,
  iterations: number
): Promise<number[]> {
  const measurements: number[] = []
  
  console.log(`  Running ${iterations} measurements for ${name}...`)
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()
    
    const response = await requestFn()
    
    const endTime = performance.now()
    const duration = endTime - startTime

    // Ensure request succeeded (or failed gracefully)
    expect(response.status).toBeLessThan(500)
    
    measurements.push(duration)
    
    // Small delay between requests to avoid overwhelming the server
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 5))
    }
  }

  return measurements
}

function recordPerformanceMetric(name: string, target: number, measurements: number[]): void {
  measurements.sort((a, b) => a - b)
  
  const average = measurements.reduce((a, b) => a + b, 0) / measurements.length
  const p95Index = Math.floor(measurements.length * 0.95)
  const p99Index = Math.floor(measurements.length * 0.99)
  const p95 = measurements[p95Index]
  const p99 = measurements[p99Index]
  
  // Enterprise standard: P99 must meet target
  const passed = p99 <= target
  
  const metric: PerformanceMetric = {
    name,
    target,
    measurements,
    passed,
    average,
    p95,
    p99
  }
  
  performanceResults.push(metric)
  
  const status = passed ? '✅' : '❌'
  console.log(`  ${status} ${name}: P99 ${p99.toFixed(1)}ms (target: <${target}ms)`)
}

async function warmUpSystem(): Promise<void> {
  console.log('🔥 Warming up system...')
  
  // Make a few requests to warm up the server
  const warmupRequests = [
    request(BASE_URL).get('/api/csrf-token'),
    request(BASE_URL).get('/api/staff/jobs/progress').set('x-staff-key', STAFF_API_KEY),
    request(BASE_URL).get('/api/autobolt/jobs/next').set('x-api-key', AUTOBOLT_API_KEY)
  ]

  await Promise.all(warmupRequests.map(req => 
    req.timeout(5000).catch(() => {}) // Ignore warmup failures
  ))
  
  console.log('✅ System warmed up')
}