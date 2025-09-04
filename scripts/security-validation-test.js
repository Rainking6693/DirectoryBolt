/**
 * Security Validation Test Suite
 * Tests CSP implementation, security headers, and Trusted Types
 */

const https = require('https')
const http = require('http')

class SecurityValidator {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.results = {
      cspHeaders: {},
      securityHeaders: {},
      trustedTypes: {},
      violations: [],
      passed: 0,
      failed: 0,
      warnings: 0
    }
  }

  async validateSecurityHeaders(path = '/') {
    console.log(`\n🔍 Testing Security Headers for ${path}...`)
    
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl)
      const client = url.protocol === 'https:' ? https : http
      
      const req = client.get(url.toString(), (res) => {
        const headers = res.headers
        
        // Test CSP header
        this.testCSPHeader(headers)
        
        // Test security headers
        this.testSecurityHeaders(headers)
        
        // Test HSTS
        this.testHSTS(headers)
        
        resolve(this.results)
      })
      
      req.on('error', (err) => {
        console.error('❌ Request failed:', err.message)
        this.results.failed++
        resolve(this.results)
      })
      
      req.setTimeout(10000, () => {
        console.error('❌ Request timeout')
        this.results.failed++
        resolve(this.results)
      })
    })
  }

  testCSPHeader(headers) {
    const csp = headers['content-security-policy']
    
    if (!csp) {
      console.log('❌ Content-Security-Policy header missing')
      this.results.failed++
      return
    }
    
    console.log('✅ Content-Security-Policy header present')
    this.results.passed++
    
    // Parse CSP directives
    const directives = {}
    csp.split(';').forEach(directive => {
      const [key, ...values] = directive.trim().split(' ')
      if (key) {
        directives[key] = values
      }
    })
    
    this.results.cspHeaders = directives
    
    // Test critical directives
    const requiredDirectives = [
      'default-src',
      'script-src', 
      'style-src',
      'img-src',
      'connect-src',
      'frame-src',
      'object-src',
      'base-uri'
    ]
    
    requiredDirectives.forEach(directive => {
      if (directives[directive]) {
        console.log(`✅ ${directive}: ${directives[directive].join(' ')}`)
        this.results.passed++
      } else {
        console.log(`❌ Missing required directive: ${directive}`)
        this.results.failed++
      }
    })
    
    // Validate Stripe integration
    this.validateStripeCSP(directives)
    
    // Validate Google Analytics integration  
    this.validateGoogleAnalyticsCSP(directives)
    
    // Check for unsafe directives
    this.checkUnsafeDirectives(directives)
  }

  validateStripeCSP(directives) {
    const scriptSrc = directives['script-src'] || []
    const connectSrc = directives['connect-src'] || []
    const frameSrc = directives['frame-src'] || []
    
    if (scriptSrc.includes('https://js.stripe.com')) {
      console.log('✅ Stripe script-src allowed')
      this.results.passed++
    } else {
      console.log('❌ Stripe script-src not found in CSP')
      this.results.failed++
    }
    
    if (connectSrc.includes('https://api.stripe.com')) {
      console.log('✅ Stripe connect-src allowed')
      this.results.passed++
    } else {
      console.log('❌ Stripe connect-src not found in CSP')
      this.results.failed++
    }
    
    if (frameSrc.includes('https://js.stripe.com') || frameSrc.includes('https://hooks.stripe.com')) {
      console.log('✅ Stripe frame-src allowed')
      this.results.passed++
    } else {
      console.log('❌ Stripe frame-src not found in CSP')
      this.results.failed++
    }
  }

  validateGoogleAnalyticsCSP(directives) {
    const scriptSrc = directives['script-src'] || []
    const connectSrc = directives['connect-src'] || []
    
    const gaScriptDomains = [
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com'
    ]
    
    const hasGAScript = gaScriptDomains.some(domain => scriptSrc.includes(domain))
    if (hasGAScript) {
      console.log('✅ Google Analytics script-src allowed')
      this.results.passed++
    } else {
      console.log('⚠️  Google Analytics script-src not found - may be intentional')
      this.results.warnings++
    }
    
    const gaConnectDomains = [
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com'
    ]
    
    const hasGAConnect = gaConnectDomains.some(domain => connectSrc.includes(domain))
    if (hasGAConnect) {
      console.log('✅ Google Analytics connect-src allowed')
      this.results.passed++
    } else {
      console.log('⚠️  Google Analytics connect-src not found - may be intentional')
      this.results.warnings++
    }
  }

  checkUnsafeDirectives(directives) {
    Object.entries(directives).forEach(([directive, values]) => {
      if (values.includes("'unsafe-eval'")) {
        console.log(`⚠️  Warning: ${directive} allows 'unsafe-eval'`)
        this.results.warnings++
      }
      
      if (values.includes("'unsafe-inline'")) {
        console.log(`⚠️  Info: ${directive} allows 'unsafe-inline' - ensure this is necessary`)
        this.results.warnings++
      }
      
      if (values.includes('*')) {
        console.log(`❌ Security risk: ${directive} allows all sources (*)`)
        this.results.failed++
      }
    })
  }

  testSecurityHeaders(headers) {
    const requiredHeaders = [
      {
        name: 'x-frame-options',
        expected: 'DENY',
        description: 'Clickjacking protection'
      },
      {
        name: 'x-content-type-options', 
        expected: 'nosniff',
        description: 'MIME type sniffing protection'
      },
      {
        name: 'referrer-policy',
        expected: 'strict-origin-when-cross-origin',
        description: 'Referrer information control'
      },
      {
        name: 'x-xss-protection',
        expected: '1; mode=block',
        description: 'XSS filtering'
      },
      {
        name: 'permissions-policy',
        expected: /.+/,
        description: 'Feature policy restrictions'
      },
      {
        name: 'cross-origin-opener-policy',
        expected: 'same-origin',
        description: 'Cross-origin isolation'
      },
      {
        name: 'cross-origin-embedder-policy',
        expected: 'require-corp',
        description: 'Cross-origin embedding control'
      }
    ]
    
    requiredHeaders.forEach(({name, expected, description}) => {
      const headerValue = headers[name.toLowerCase()]
      
      if (!headerValue) {
        console.log(`❌ Missing ${name} header (${description})`)
        this.results.failed++
        return
      }
      
      if (typeof expected === 'string' && headerValue === expected) {
        console.log(`✅ ${name}: ${headerValue}`)
        this.results.passed++
      } else if (expected instanceof RegExp && expected.test(headerValue)) {
        console.log(`✅ ${name}: ${headerValue}`)
        this.results.passed++
      } else if (typeof expected === 'string') {
        console.log(`⚠️  ${name}: ${headerValue} (expected: ${expected})`)
        this.results.warnings++
      } else {
        console.log(`✅ ${name}: ${headerValue}`)
        this.results.passed++
      }
      
      this.results.securityHeaders[name] = headerValue
    })
  }

  testHSTS(headers) {
    const hsts = headers['strict-transport-security']
    
    if (!hsts) {
      console.log('❌ Missing Strict-Transport-Security header')
      this.results.failed++
      return
    }
    
    console.log(`✅ HSTS: ${hsts}`)
    this.results.passed++
    
    // Validate HSTS configuration
    if (hsts.includes('includeSubDomains')) {
      console.log('✅ HSTS includes subdomains')
      this.results.passed++
    } else {
      console.log('⚠️  HSTS should include subdomains')
      this.results.warnings++
    }
    
    if (hsts.includes('preload')) {
      console.log('✅ HSTS preload enabled')
      this.results.passed++
    } else {
      console.log('⚠️  Consider enabling HSTS preload')
      this.results.warnings++
    }
    
    // Check max-age
    const maxAgeMatch = hsts.match(/max-age=(\d+)/)
    if (maxAgeMatch) {
      const maxAge = parseInt(maxAgeMatch[1])
      if (maxAge >= 31536000) { // 1 year
        console.log(`✅ HSTS max-age: ${maxAge} seconds (>= 1 year)`)
        this.results.passed++
      } else {
        console.log(`⚠️  HSTS max-age: ${maxAge} seconds (recommended: >= 31536000)`)
        this.results.warnings++
      }
    }
  }

  async testTrustedTypes() {
    console.log('\n🔍 Testing Trusted Types implementation...')
    
    // This would require browser automation for full testing
    // For now, we'll check the static implementation
    
    const fs = require('fs')
    const path = require('path')
    
    try {
      // Check if Trusted Types utilities exist
      const securityUtilPath = path.join(__dirname, '../lib/utils/security.ts')
      if (fs.existsSync(securityUtilPath)) {
        console.log('✅ Security utilities file exists')
        this.results.passed++
        
        const content = fs.readFileSync(securityUtilPath, 'utf8')
        
        if (content.includes('trustedTypes.createPolicy')) {
          console.log('✅ Trusted Types policy creation implemented')
          this.results.passed++
        } else {
          console.log('❌ Trusted Types policy creation not found')
          this.results.failed++
        }
        
        if (content.includes('safeSetHTML')) {
          console.log('✅ Safe HTML setting function implemented')
          this.results.passed++
        } else {
          console.log('❌ Safe HTML setting function not found')
          this.results.failed++
        }
      } else {
        console.log('❌ Security utilities file not found')
        this.results.failed++
      }
      
      // Check document implementation
      const documentPath = path.join(__dirname, '../pages/_document.tsx')
      if (fs.existsSync(documentPath)) {
        console.log('✅ Custom _document.tsx exists')
        this.results.passed++
        
        const content = fs.readFileSync(documentPath, 'utf8')
        
        if (content.includes('trustedTypes.createPolicy')) {
          console.log('✅ Trusted Types initialization in _document.tsx')
          this.results.passed++
        } else {
          console.log('❌ Trusted Types initialization not found in _document.tsx')
          this.results.failed++
        }
      }
    } catch (error) {
      console.log('❌ Error testing Trusted Types implementation:', error.message)
      this.results.failed++
    }
  }

  generateReport() {
    console.log('\n📊 SECURITY VALIDATION REPORT')
    console.log('==========================================')
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`⚠️  Warnings: ${this.results.warnings}`)
    
    const total = this.results.passed + this.results.failed + this.results.warnings
    const score = total > 0 ? Math.round((this.results.passed / total) * 100) : 0
    
    console.log(`\n🏆 Security Score: ${score}%`)
    
    if (score >= 90) {
      console.log('🟢 Excellent security implementation!')
    } else if (score >= 80) {
      console.log('🟡 Good security implementation with room for improvement')
    } else if (score >= 70) {
      console.log('🟠 Fair security implementation - address failed items')
    } else {
      console.log('🔴 Poor security implementation - requires immediate attention')
    }
    
    // Detailed breakdown
    console.log('\n🔍 DETAILED RESULTS')
    console.log('CSP Directives:', this.results.cspHeaders)
    console.log('Security Headers:', this.results.securityHeaders)
    
    if (this.results.violations.length > 0) {
      console.log('\n⚠️  CSP Violations Found:')
      this.results.violations.forEach(violation => {
        console.log(`- ${violation}`)
      })
    }
    
    return {
      score,
      ...this.results
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const validator = new SecurityValidator()
    
    console.log('🚀 Starting Security Validation Tests...')
    
    // Test main routes
    const testRoutes = ['/', '/pricing', '/onboarding']
    
    for (const route of testRoutes) {
      await validator.validateSecurityHeaders(route)
    }
    
    await validator.testTrustedTypes()
    
    const report = validator.generateReport()
    
    // Save report to file
    const fs = require('fs')
    const reportPath = './security-validation-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Report saved to: ${reportPath}`)
    
    // Exit with appropriate code
    process.exit(report.failed === 0 ? 0 : 1)
  }
  
  runTests().catch(console.error)
}

module.exports = SecurityValidator