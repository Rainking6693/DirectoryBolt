#!/usr/bin/env node

/**
 * Production API Test Suite for Website Analysis Feature
 * Validates the /api/analyze endpoint is working correctly in production
 */

const https = require('https')
const http = require('http')

class ProductionAPITester {
  constructor(baseUrl = 'https://directorybolt.com') {
    this.baseUrl = baseUrl
    this.testResults = []
    this.startTime = Date.now()
    
    console.log('🧪 DirectoryBolt Production API Test Suite')
    console.log(`🌐 Testing: ${this.baseUrl}`)
    console.log(`⏰ Started: ${new Date().toISOString()}\n`)
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl)
      const isHttps = url.protocol === 'https:'
      const client = isHttps ? https : http

      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DirectoryBolt-Production-Test/1.0',
          ...options.headers
        },
        timeout: options.timeout || 30000
      }

      const req = client.request(requestOptions, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {}
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData,
              rawData: data
            })
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: null,
              rawData: data,
              parseError: error.message
            })
          }
        })
      })

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      }

      req.end()
    })
  }

  logTest(name, result, details = '') {
    const status = result ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${name}${details ? ` - ${details}` : ''}`)
    
    this.testResults.push({
      name,
      passed: result,
      details,
      timestamp: new Date().toISOString()
    })
  }

  async testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoints...')
    
    try {
      // Test if website is accessible
      const response = await this.makeRequest('/')
      this.logTest('Homepage accessible', response.status === 200, `Status: ${response.status}`)
      
      // Test if analyze page exists
      const analyzePageResponse = await this.makeRequest('/analyze')
      this.logTest('Analyze page accessible', analyzePageResponse.status === 200, `Status: ${analyzePageResponse.status}`)
      
    } catch (error) {
      this.logTest('Health check', false, `Error: ${error.message}`)
    }
  }

  async testAnalyzeAPIValidation() {
    console.log('\n🔍 Testing Website Analysis API Validation...')
    
    // Test 1: GET request should return 405 Method Not Allowed
    try {
      const response = await this.makeRequest('/api/analyze', { method: 'GET' })
      this.logTest('GET request properly rejected', response.status === 405, `Status: ${response.status}`)
    } catch (error) {
      this.logTest('GET request test', false, `Error: ${error.message}`)
    }

    // Test 2: POST without body should return 400 Bad Request
    try {
      const response = await this.makeRequest('/api/analyze', { method: 'POST' })
      this.logTest('Empty POST request validation', response.status === 400, `Status: ${response.status}`)
    } catch (error) {
      this.logTest('Empty POST validation test', false, `Error: ${error.message}`)
    }

    // Test 3: POST with invalid URL should return 400
    try {
      const response = await this.makeRequest('/api/analyze', {
        method: 'POST',
        body: { url: 'invalid-url' }
      })
      this.logTest('Invalid URL validation', response.status === 400, `Status: ${response.status}`)
    } catch (error) {
      this.logTest('Invalid URL test', false, `Error: ${error.message}`)
    }

    // Test 4: POST with private IP should be blocked in production
    try {
      const response = await this.makeRequest('/api/analyze', {
        method: 'POST',
        body: { url: 'http://localhost:3000' }
      })
      this.logTest('Private IP blocking', response.status === 400, `Status: ${response.status}`)
    } catch (error) {
      this.logTest('Private IP blocking test', false, `Error: ${error.message}`)
    }
  }

  async testAnalyzeAPIFunctionality() {
    console.log('\n🚀 Testing Website Analysis API Functionality...')
    
    const testUrls = [
      'https://example.com',
      'https://google.com',
      'https://github.com'
    ]

    for (const testUrl of testUrls) {
      try {
        console.log(`  Testing analysis of: ${testUrl}`)
        const startTime = Date.now()
        
        const response = await this.makeRequest('/api/analyze', {
          method: 'POST',
          body: { 
            url: testUrl,
            options: { deep: false, includeCompetitors: false, checkDirectories: true }
          },
          timeout: 30000
        })

        const endTime = Date.now()
        const responseTime = endTime - startTime

        if (response.status === 200 && response.data?.success) {
          const analysisData = response.data.data
          const hasRequiredFields = analysisData.url && 
                                   typeof analysisData.seoScore === 'number' && 
                                   Array.isArray(analysisData.directoryOpportunities)

          this.logTest(`Analysis of ${testUrl}`, hasRequiredFields, 
            `${responseTime}ms, SEO Score: ${analysisData.seoScore}, Directories: ${analysisData.directoryOpportunities?.length}`)
        } else {
          this.logTest(`Analysis of ${testUrl}`, false, 
            `Status: ${response.status}, Response time: ${responseTime}ms`)
        }

        // Rate limiting test - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        this.logTest(`Analysis of ${testUrl}`, false, `Error: ${error.message}`)
      }
    }
  }

  async testRateLimiting() {
    console.log('\n🚦 Testing Rate Limiting...')
    
    try {
      const requests = []
      const maxRequests = 25 // Should trigger rate limit
      
      console.log(`  Sending ${maxRequests} rapid requests to test rate limiting...`)
      
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          this.makeRequest('/api/analyze', {
            method: 'POST',
            body: { url: 'https://example.com' },
            timeout: 5000
          }).catch(error => ({ error: error.message }))
        )
      }

      const responses = await Promise.all(requests)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      this.logTest('Rate limiting active', rateLimitedResponses.length > 0, 
        `${rateLimitedResponses.length}/${maxRequests} requests rate limited`)

    } catch (error) {
      this.logTest('Rate limiting test', false, `Error: ${error.message}`)
    }
  }

  async testMonitoringEndpoint() {
    console.log('\n📊 Testing Monitoring Endpoint...')
    
    try {
      const response = await this.makeRequest('/api/monitor?type=health')
      const hasHealthData = response.status === 200 || response.status === 401
      
      this.logTest('Monitoring endpoint accessible', hasHealthData, `Status: ${response.status}`)
      
      if (response.status === 200 && response.data) {
        const hasMetrics = response.data.metrics && typeof response.data.status === 'string'
        this.logTest('Health metrics available', hasMetrics, `Status: ${response.data.status}`)
      }
    } catch (error) {
      this.logTest('Monitoring endpoint test', false, `Error: ${error.message}`)
    }
  }

  async testCORS() {
    console.log('\n🌐 Testing CORS Configuration...')
    
    try {
      const response = await this.makeRequest('/api/analyze', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://directorybolt.com',
          'Access-Control-Request-Method': 'POST'
        }
      })
      
      const hasCORSHeaders = response.headers['access-control-allow-origin'] !== undefined
      this.logTest('CORS headers present', hasCORSHeaders, `Status: ${response.status}`)
      
    } catch (error) {
      this.logTest('CORS test', false, `Error: ${error.message}`)
    }
  }

  generateReport() {
    const endTime = Date.now()
    const duration = Math.round((endTime - this.startTime) / 1000)
    
    const passedTests = this.testResults.filter(t => t.passed).length
    const totalTests = this.testResults.length
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 PRODUCTION API TEST REPORT')
    console.log('='.repeat(60))
    console.log(`🌐 Target: ${this.baseUrl}`)
    console.log(`⏰ Duration: ${duration} seconds`)
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`)
    console.log(`🎯 Status: ${successRate >= 80 ? '✅ PASSED' : '❌ FAILED'}`)
    
    if (this.testResults.some(t => !t.passed)) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(t => !t.passed)
        .forEach(t => console.log(`   • ${t.name}: ${t.details}`))
    }
    
    console.log('\n🎉 Website Analysis API is', successRate >= 80 ? 'READY for production use!' : 'NOT READY - please fix failing tests')
    
    return {
      success: successRate >= 80,
      passedTests,
      totalTests,
      successRate,
      duration,
      failedTests: this.testResults.filter(t => !t.passed)
    }
  }

  async runAllTests() {
    try {
      await this.testHealthEndpoint()
      await this.testAnalyzeAPIValidation()
      await this.testAnalyzeAPIFunctionality()
      await this.testRateLimiting()
      await this.testMonitoringEndpoint()
      await this.testCORS()
      
      return this.generateReport()
    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
      return { success: false, error: error.message }
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'https://directorybolt.com'
  const tester = new ProductionAPITester(baseUrl)
  
  tester.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Test suite error:', error)
      process.exit(1)
    })
}

module.exports = ProductionAPITester