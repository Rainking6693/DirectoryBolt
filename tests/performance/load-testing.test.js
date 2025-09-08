/**
 * PERFORMANCE AND LOAD TESTING SUITE
 * Tests system performance under load, API response times,
 * and cost optimization for AI analysis endpoints
 */

const axios = require('axios')
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs').promises
const cliProgress = require('cli-progress')

describe('Performance and Load Testing', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  let performanceResults = []

  describe('API Performance Testing', () => {
    test('analyze endpoint response times', async () => {
      const testCases = [
        { url: 'https://simple-site.com', tier: 'free', expectedMaxTime: 5000 },
        { url: 'https://medium-site.com', tier: 'starter', expectedMaxTime: 30000 },
        { url: 'https://complex-site.com', tier: 'growth', expectedMaxTime: 60000 },
        { url: 'https://enterprise-site.com', tier: 'professional', expectedMaxTime: 90000 }
      ]

      for (const testCase of testCases) {
        const startTime = Date.now()
        
        const response = await axios.post(`${baseUrl}/api/analyze`, {
          url: testCase.url,
          tier: testCase.tier
        }, {
          timeout: testCase.expectedMaxTime + 10000
        })

        const responseTime = Date.now() - startTime
        
        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(testCase.expectedMaxTime)
        
        performanceResults.push({
          endpoint: '/api/analyze',
          tier: testCase.tier,
          responseTime,
          success: true,
          timestamp: new Date().toISOString()
        })

        console.log(`✅ ${testCase.tier} tier: ${responseTime}ms (limit: ${testCase.expectedMaxTime}ms)`)
      }
    }, 300000)

    test('health endpoint performance', async () => {
      const iterations = 10
      const responseTimes = []

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        
        const response = await axios.get(`${baseUrl}/api/health`)
        
        const responseTime = Date.now() - startTime
        responseTimes.push(responseTime)
        
        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(1000) // Health check should be very fast
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxTime = Math.max(...responseTimes)
      const minTime = Math.min(...responseTimes)

      expect(averageTime).toBeLessThan(500)
      expect(maxTime).toBeLessThan(1000)

      console.log(`✅ Health endpoint: avg=${averageTime.toFixed(1)}ms, max=${maxTime}ms, min=${minTime}ms`)
    })

    test('AI analysis cost optimization', async () => {
      // Test caching effectiveness
      const testUrl = 'https://cost-optimization-test.com'
      
      // First request (should be new analysis)
      const startTime1 = Date.now()
      const response1 = await axios.post(`${baseUrl}/api/ai/enhanced-analysis`, {
        customerId: 'test-customer-cost',
        businessData: {
          businessName: 'Cost Test Business',
          website: testUrl,
          description: 'Testing cost optimization',
          city: 'Test City',
          state: 'TS',
          email: 'test@example.com'
        },
        analysisOptions: {
          forceRefresh: true
        }
      }, {
        timeout: 90000
      })
      const time1 = Date.now() - startTime1

      expect(response1.status).toBe(200)
      expect(response1.data.cached).toBe(false)

      // Second request (should use cache)
      const startTime2 = Date.now()
      const response2 = await axios.post(`${baseUrl}/api/ai/enhanced-analysis`, {
        customerId: 'test-customer-cost',
        businessData: {
          businessName: 'Cost Test Business',
          website: testUrl,
          description: 'Testing cost optimization',
          city: 'Test City',
          state: 'TS',
          email: 'test@example.com'
        }
        // No forceRefresh - should use cache
      }, {
        timeout: 30000
      })
      const time2 = Date.now() - startTime2

      expect(response2.status).toBe(200)
      expect(response2.data.cached).toBe(true)
      expect(response2.data.costSavings).toBeDefined()
      expect(time2).toBeLessThan(time1 * 0.5) // Cached request should be much faster

      console.log(`✅ Cost optimization: First=${time1}ms, Cached=${time2}ms, Savings=$${response2.data.costSavings}`)
    }, 180000)
  })

  describe('Load Testing', () => {
    test('concurrent user simulation', async () => {
      const concurrentUsers = 5
      const requestsPerUser = 3
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
      
      console.log(`🚀 Starting load test: ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`)
      progressBar.start(concurrentUsers * requestsPerUser, 0)

      const userPromises = []
      let completedRequests = 0

      for (let user = 0; user < concurrentUsers; user++) {
        const userRequests = []
        
        for (let req = 0; req < requestsPerUser; req++) {
          userRequests.push(
            axios.post(`${baseUrl}/api/analyze`, {
              url: `https://load-test-${user}-${req}.com`,
              tier: 'starter'
            }, {
              timeout: 60000
            }).then(response => {
              completedRequests++
              progressBar.update(completedRequests)
              return { success: true, status: response.status, user, req }
            }).catch(error => {
              completedRequests++
              progressBar.update(completedRequests)
              return { success: false, error: error.response?.status || error.code, user, req }
            })
          )
        }
        
        userPromises.push(...userRequests)
      }

      const results = await Promise.all(userPromises)
      progressBar.stop()

      // Analyze results
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)
      const successRate = (successful.length / results.length) * 100

      // At least 70% should succeed under load
      expect(successRate).toBeGreaterThanOrEqual(70)

      console.log(`✅ Load test results: ${successful.length}/${results.length} successful (${successRate.toFixed(1)}%)`)
      
      if (failed.length > 0) {
        console.log(`⚠️  Failed requests: ${failed.map(f => f.error).join(', ')}`)
      }

      performanceResults.push({
        test: 'concurrent_load',
        concurrentUsers,
        requestsPerUser,
        successRate,
        totalRequests: results.length,
        successfulRequests: successful.length,
        timestamp: new Date().toISOString()
      })
    }, 300000)

    test('rate limiting effectiveness', async () => {
      console.log('🔒 Testing rate limiting protection...')
      
      const requests = []
      const rateLimitRequests = 20 // Should exceed rate limit
      
      // Send many requests quickly to trigger rate limiting
      for (let i = 0; i < rateLimitRequests; i++) {
        requests.push(
          axios.post(`${baseUrl}/api/analyze`, {
            url: `https://rate-limit-test-${i}.com`,
            tier: 'free'
          }, {
            timeout: 30000
          }).catch(error => ({
            status: error.response?.status,
            rateLimited: error.response?.status === 429
          }))
        )
      }

      const results = await Promise.allSettled(requests)
      const rateLimitedCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.rateLimited
      ).length

      // Should have some rate limited requests (protection working)
      expect(rateLimitedCount).toBeGreaterThan(0)
      
      console.log(`✅ Rate limiting: ${rateLimitedCount}/${rateLimitRequests} requests rate limited`)
    }, 120000)
  })

  describe('Frontend Performance Testing', () => {
    test('lighthouse performance audit', async () => {
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
      
      try {
        const options = {
          logLevel: 'info',
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'best-practices'],
          port: chrome.port
        }

        const runnerResult = await lighthouse(`${baseUrl}`, options)
        const scores = runnerResult.lhr.categories

        // Performance benchmarks
        expect(scores.performance.score).toBeGreaterThanOrEqual(0.7) // 70+ performance score
        expect(scores.accessibility.score).toBeGreaterThanOrEqual(0.8) // 80+ accessibility score
        expect(scores['best-practices'].score).toBeGreaterThanOrEqual(0.8) // 80+ best practices

        console.log(`✅ Lighthouse scores:`)
        console.log(`   Performance: ${(scores.performance.score * 100).toFixed(1)}%`)
        console.log(`   Accessibility: ${(scores.accessibility.score * 100).toFixed(1)}%`)
        console.log(`   Best Practices: ${(scores['best-practices'].score * 100).toFixed(1)}%`)

        performanceResults.push({
          test: 'lighthouse_audit',
          performance: scores.performance.score,
          accessibility: scores.accessibility.score,
          bestPractices: scores['best-practices'].score,
          timestamp: new Date().toISOString()
        })

      } finally {
        await chrome.kill()
      }
    }, 60000)

    test('page load time analysis', async () => {
      const pages = [
        { path: '/', name: 'Homepage', maxTime: 3000 },
        { path: '/pricing', name: 'Pricing', maxTime: 2000 },
        { path: '/dashboard', name: 'Dashboard', maxTime: 4000 }
      ]

      for (const page of pages) {
        const startTime = Date.now()
        
        const response = await axios.get(`${baseUrl}${page.path}`, {
          timeout: page.maxTime + 2000
        })
        
        const loadTime = Date.now() - startTime
        
        expect(response.status).toBe(200)
        expect(loadTime).toBeLessThan(page.maxTime)
        
        console.log(`✅ ${page.name}: ${loadTime}ms (limit: ${page.maxTime}ms)`)
      }
    })
  })

  describe('Database Performance', () => {
    test('airtable integration performance', async () => {
      const testData = {
        customerId: 'perf-test-customer',
        businessData: {
          businessName: 'Performance Test Business',
          website: 'https://performance-test.com',
          description: 'Testing database performance',
          city: 'Performance City',
          state: 'PC',
          email: 'perf@test.com'
        }
      }

      // Test submission performance
      const startTime = Date.now()
      
      const response = await axios.post(`${baseUrl}/api/business-info/submit`, testData, {
        timeout: 15000
      })
      
      const dbResponseTime = Date.now() - startTime
      
      expect(response.status).toBe(200)
      expect(dbResponseTime).toBeLessThan(10000) // Database operations should be under 10s
      
      console.log(`✅ Database submission: ${dbResponseTime}ms`)

      performanceResults.push({
        test: 'database_submission',
        responseTime: dbResponseTime,
        success: true,
        timestamp: new Date().toISOString()
      })
    }, 30000)
  })

  describe('Memory and Resource Usage', () => {
    test('memory leak detection', async () => {
      const iterations = 10
      const memoryUsages = []

      for (let i = 0; i < iterations; i++) {
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }

        const memBefore = process.memoryUsage()
        
        // Perform analysis
        await axios.post(`${baseUrl}/api/analyze`, {
          url: `https://memory-test-${i}.com`,
          tier: 'starter'
        }, {
          timeout: 30000
        }).catch(() => {}) // Ignore errors, focus on memory

        const memAfter = process.memoryUsage()
        const memDiff = memAfter.heapUsed - memBefore.heapUsed
        
        memoryUsages.push(memDiff)
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Check for memory growth trend
      const avgGrowth = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      const maxGrowth = Math.max(...memoryUsages)
      
      // Memory growth should be reasonable
      expect(avgGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB average growth
      expect(maxGrowth).toBeLessThan(100 * 1024 * 1024) // Less than 100MB max growth

      console.log(`✅ Memory usage: avg growth=${(avgGrowth / 1024 / 1024).toFixed(1)}MB, max=${(maxGrowth / 1024 / 1024).toFixed(1)}MB`)
    }, 300000)
  })

  // Generate performance report
  afterAll(async () => {
    const reportPath = './test-results/performance-report.json'
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Performance and Load Testing',
      summary: {
        totalTests: performanceResults.length,
        avgResponseTime: performanceResults.reduce((acc, r) => acc + (r.responseTime || 0), 0) / performanceResults.length,
        successRate: performanceResults.filter(r => r.success !== false).length / performanceResults.length * 100
      },
      results: performanceResults,
      recommendations: [
        'Monitor response times during peak usage',
        'Consider CDN implementation for static assets',
        'Implement additional caching layers for frequently accessed data',
        'Set up automated performance monitoring'
      ]
    }

    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(`📊 Performance Report saved to ${reportPath}`)
    } catch (error) {
      console.error('Failed to save performance report:', error)
    }
  })
})