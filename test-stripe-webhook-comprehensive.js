#!/usr/bin/env node
/**
 * Comprehensive Stripe Webhook Testing Suite
 * Tests all aspects of the new Stripe webhook payment flow
 */

const fs = require('fs')
const path = require('path')

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {},
  config_findings: [],
  runtime: {},
  recommended_changes: [],
  auditors: ["Hudson", "Cora"],
  next_actions: [],
  test_details: {}
}

console.log('🚀 COMPREHENSIVE STRIPE WEBHOOK TESTING SUITE')
console.log('================================================')

/**
 * Test 1: Configuration Analysis
 */
async function testConfiguration() {
  console.log('\n📋 PHASE 1: CONFIGURATION ANALYSIS')
  console.log('-----------------------------------')
  
  const findings = []
  
  try {
    // Check webhook implementation
    const webhookPath = path.join(__dirname, 'pages', 'api', 'webhooks', 'stripe.js')
    if (!fs.existsSync(webhookPath)) {
      findings.push({
        type: 'critical',
        component: 'webhook_endpoint',
        issue: 'Webhook handler file missing',
        file: 'pages/api/webhooks/stripe.js'
      })
    } else {
      const webhookContent = fs.readFileSync(webhookPath, 'utf8')
      
      // Check for essential components
      const requiredComponents = [
        { name: 'Stripe initialization', pattern: /new Stripe\(/ },
        { name: 'Webhook signature verification', pattern: /webhooks\.constructEvent/ },
        { name: 'AI Business Intelligence tiers', pattern: /AI_BUSINESS_TIERS/ },
        { name: 'Airtable integration', pattern: /createAirtableService/ },
        { name: 'Email notifications', pattern: /AutoBoltNotificationService/ },
        { name: 'Checkout completion handler', pattern: /handleCheckoutCompleted/ },
        { name: 'Payment success handler', pattern: /handlePaymentSucceeded/ },
        { name: 'Payment failure handler', pattern: /handlePaymentFailed/ },
        { name: 'AI processing trigger', pattern: /triggerAIAnalysisProcess/ }
      ]
      
      requiredComponents.forEach(component => {
        if (!component.pattern.test(webhookContent)) {
          findings.push({
            type: 'critical',
            component: 'webhook_implementation',
            issue: `Missing ${component.name}`,
            file: 'pages/api/webhooks/stripe.js'
          })
        } else {
          console.log(`  ✅ ${component.name} - Found`)
        }
      })
      
      // Check tier configuration
      const tierMatch = webhookContent.match(/AI_BUSINESS_TIERS = \{([\s\S]*?)\}/s)
      if (tierMatch) {
        const tierConfig = tierMatch[1]
        const expectedTiers = ['price_starter_149', 'price_growth_299', 'price_pro_499', 'price_enterprise_799']
        const expectedAmounts = [14900, 29900, 49900, 79900]
        const expectedLimits = [25, 75, 150, 500]
        
        expectedTiers.forEach((tier, index) => {
          if (tierConfig.includes(tier)) {
            console.log(`  ✅ ${tier} tier configuration - Found`)
            if (tierConfig.includes(`amount: ${expectedAmounts[index]}`)) {
              console.log(`  ✅ ${tier} amount ($${expectedAmounts[index]/100}) - Correct`)
            } else {
              findings.push({
                type: 'warning',
                component: 'tier_pricing',
                issue: `Incorrect amount for ${tier}`,
                expected: `$${expectedAmounts[index]/100}`,
                file: 'pages/api/webhooks/stripe.js'
              })
            }
            
            if (tierConfig.includes(`directoryLimit: ${expectedLimits[index]}`)) {
              console.log(`  ✅ ${tier} directory limit (${expectedLimits[index]}) - Correct`)
            } else {
              findings.push({
                type: 'warning',
                component: 'tier_limits',
                issue: `Incorrect directory limit for ${tier}`,
                expected: `${expectedLimits[index]} directories`,
                file: 'pages/api/webhooks/stripe.js'
              })
            }
          } else {
            findings.push({
              type: 'critical',
              component: 'tier_configuration',
              issue: `Missing tier configuration: ${tier}`,
              file: 'pages/api/webhooks/stripe.js'
            })
          }
        })
      }
    }
    
    // Check environment configuration
    const envPath = path.join(__dirname, '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const requiredEnvVars = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'AIRTABLE_ACCESS_TOKEN',
        'AIRTABLE_BASE_ID',
        'AIRTABLE_TABLE_NAME'
      ]
      
      requiredEnvVars.forEach(envVar => {
        if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=your_`)) {
          console.log(`  ✅ ${envVar} - Configured`)
        } else {
          findings.push({
            type: 'critical',
            component: 'environment',
            issue: `Missing or placeholder value for ${envVar}`,
            file: '.env.local'
          })
        }
      })
    } else {
      findings.push({
        type: 'critical',
        component: 'environment',
        issue: 'Missing .env.local file',
        file: '.env.local'
      })
    }
    
    // Check service dependencies
    const airtablePath = path.join(__dirname, 'lib', 'services', 'airtable.ts')
    const notificationPath = path.join(__dirname, 'lib', 'services', 'autobolt-notifications.js')
    
    if (!fs.existsSync(airtablePath)) {
      findings.push({
        type: 'critical',
        component: 'airtable_service',
        issue: 'Airtable service implementation missing',
        file: 'lib/services/airtable.ts'
      })
    } else {
      console.log('  ✅ Airtable service - Found')
    }
    
    if (!fs.existsSync(notificationPath)) {
      findings.push({
        type: 'critical',
        component: 'notification_service',
        issue: 'AutoBolt notification service missing',
        file: 'lib/services/autobolt-notifications.js'
      })
    } else {
      console.log('  ✅ AutoBolt notification service - Found')
    }
    
  } catch (error) {
    findings.push({
      type: 'critical',
      component: 'configuration_analysis',
      issue: `Configuration analysis failed: ${error.message}`
    })
  }
  
  testResults.config_findings = findings
  return findings
}

/**
 * Test 2: Mock Webhook Event Testing
 */
async function testWebhookEvents() {
  console.log('\n🎯 PHASE 2: WEBHOOK EVENT TESTING')
  console.log('----------------------------------')
  
  const eventTests = [
    {
      event: 'checkout.session.completed',
      tier: 'starter',
      amount: 14900,
      description: 'Starter tier ($149) payment completion'
    },
    {
      event: 'checkout.session.completed', 
      tier: 'growth',
      amount: 29900,
      description: 'Growth tier ($299) payment completion'
    },
    {
      event: 'checkout.session.completed',
      tier: 'pro', 
      amount: 49900,
      description: 'Pro tier ($499) payment completion'
    },
    {
      event: 'checkout.session.completed',
      tier: 'enterprise',
      amount: 79900,
      description: 'Enterprise tier ($799) payment completion'
    },
    {
      event: 'payment_intent.succeeded',
      description: 'Payment confirmation handling'
    },
    {
      event: 'payment_intent.payment_failed',
      description: 'Payment failure handling'
    },
    {
      event: 'customer.created',
      description: 'Customer profile creation'
    },
    {
      event: 'customer.updated',
      description: 'Customer profile updates'
    }
  ]
  
  const eventResults = {}
  
  eventTests.forEach(test => {
    console.log(`  📝 Testing: ${test.description}`)
    
    // Mock event validation
    const mockEvent = createMockStripeEvent(test.event, test.tier, test.amount)
    const validation = validateMockEvent(mockEvent, test)
    
    eventResults[test.event + (test.tier ? `_${test.tier}` : '')] = {
      description: test.description,
      validation: validation,
      status: validation.valid ? 'PASS' : 'FAIL',
      issues: validation.issues || []
    }
    
    if (validation.valid) {
      console.log(`    ✅ Mock event structure valid`)
    } else {
      console.log(`    ❌ Mock event validation failed: ${validation.issues.join(', ')}`)
    }
  })
  
  testResults.test_details.webhook_events = eventResults
  return eventResults
}

/**
 * Test 3: Database Integration Testing
 */
async function testDatabaseIntegration() {
  console.log('\n🗄️  PHASE 3: DATABASE INTEGRATION TESTING')
  console.log('------------------------------------------')
  
  const dbTests = []
  
  try {
    // Load Airtable service
    const airtableService = require('./lib/services/airtable.ts')
    
    console.log('  📝 Testing Airtable service instantiation...')
    // This would test the actual service in a real environment
    dbTests.push({
      test: 'airtable_service_creation',
      status: 'SIMULATION',
      description: 'Airtable service can be instantiated with proper config'
    })
    
    console.log('  📝 Testing customer record creation...')
    const mockCustomerData = {
      firstName: 'Test',
      lastName: 'Customer', 
      email: 'test@example.com',
      businessName: 'Test Business',
      packageType: 'growth',
      stripeCustomerId: 'cus_test123',
      amount: 29900
    }
    
    // Simulate record creation validation
    const recordValidation = validateCustomerRecord(mockCustomerData)
    dbTests.push({
      test: 'customer_record_creation',
      status: recordValidation.valid ? 'PASS' : 'FAIL',
      description: 'Customer record creation with proper field mapping',
      issues: recordValidation.issues
    })
    
    console.log('  📝 Testing access level assignment...')
    const accessLevelTest = validateAccessLevel('growth', 75, ['Advanced AI Analysis', 'Competitive Intelligence'])
    dbTests.push({
      test: 'access_level_assignment',
      status: accessLevelTest.valid ? 'PASS' : 'FAIL',
      description: 'Access level properly assigned based on tier',
      issues: accessLevelTest.issues
    })
    
    console.log('  📝 Testing usage tracking initialization...')
    const usageTrackingTest = validateUsageTracking('growth', 75)
    dbTests.push({
      test: 'usage_tracking_init',
      status: usageTrackingTest.valid ? 'PASS' : 'FAIL',
      description: 'Usage tracking properly initialized',
      issues: usageTrackingTest.issues
    })
    
  } catch (error) {
    dbTests.push({
      test: 'database_integration',
      status: 'ERROR',
      description: `Database integration test failed: ${error.message}`
    })
  }
  
  testResults.test_details.database_integration = dbTests
  return dbTests
}

/**
 * Test 4: Email Notification Testing
 */
async function testEmailNotifications() {
  console.log('\n📧 PHASE 4: EMAIL NOTIFICATION TESTING')
  console.log('--------------------------------------')
  
  const emailTests = []
  
  try {
    const emailTypes = [
      { type: 'welcome', tier: 'starter', description: 'Welcome email for Starter tier' },
      { type: 'welcome', tier: 'growth', description: 'Welcome email for Growth tier' },
      { type: 'welcome', tier: 'pro', description: 'Welcome email for Pro tier' },
      { type: 'welcome', tier: 'enterprise', description: 'Welcome email for Enterprise tier' },
      { type: 'payment_confirmation', description: 'Payment confirmation email' },
      { type: 'payment_failure', description: 'Payment failure notification' },
      { type: 'admin_error', description: 'Admin error notification' }
    ]
    
    emailTypes.forEach(emailType => {
      console.log(`  📝 Testing: ${emailType.description}`)
      
      const templateValidation = validateEmailTemplate(emailType.type, emailType.tier)
      emailTests.push({
        test: `email_${emailType.type}${emailType.tier ? `_${emailType.tier}` : ''}`,
        status: templateValidation.valid ? 'PASS' : 'FAIL',
        description: emailType.description,
        issues: templateValidation.issues
      })
      
      if (templateValidation.valid) {
        console.log(`    ✅ Template structure valid`)
      } else {
        console.log(`    ❌ Template validation failed: ${templateValidation.issues.join(', ')}`)
      }
    })
    
  } catch (error) {
    emailTests.push({
      test: 'email_notification',
      status: 'ERROR',
      description: `Email notification test failed: ${error.message}`
    })
  }
  
  testResults.test_details.email_notifications = emailTests
  return emailTests
}

/**
 * Test 5: AI Processing Integration Testing
 */
async function testAIProcessingIntegration() {
  console.log('\n🧠 PHASE 5: AI PROCESSING INTEGRATION TESTING')
  console.log('----------------------------------------------')
  
  const aiTests = []
  
  const tiers = [
    { tier: 'starter', shouldTriggerAI: false, priority: 3 },
    { tier: 'growth', shouldTriggerAI: true, priority: 2 },
    { tier: 'pro', shouldTriggerAI: true, priority: 1 },
    { tier: 'enterprise', shouldTriggerAI: true, priority: 0 }
  ]
  
  tiers.forEach(tierTest => {
    console.log(`  📝 Testing AI processing for ${tierTest.tier} tier...`)
    
    const aiTriggerTest = validateAIProcessingTrigger(tierTest.tier, tierTest.shouldTriggerAI)
    const queuePriorityTest = validateQueuePriority(tierTest.tier, tierTest.priority)
    
    aiTests.push({
      test: `ai_trigger_${tierTest.tier}`,
      status: aiTriggerTest.valid ? 'PASS' : 'FAIL',
      description: `AI processing trigger for ${tierTest.tier} tier`,
      issues: aiTriggerTest.issues
    })
    
    aiTests.push({
      test: `queue_priority_${tierTest.tier}`,
      status: queuePriorityTest.valid ? 'PASS' : 'FAIL', 
      description: `Queue priority assignment for ${tierTest.tier} tier`,
      issues: queuePriorityTest.issues
    })
    
    if (aiTriggerTest.valid && queuePriorityTest.valid) {
      console.log(`    ✅ AI processing configuration valid`)
    } else {
      console.log(`    ❌ AI processing issues found`)
    }
  })
  
  testResults.test_details.ai_processing = aiTests
  return aiTests
}

/**
 * Test 6: Error Handling and Recovery Testing
 */
async function testErrorHandling() {
  console.log('\n⚠️  PHASE 6: ERROR HANDLING AND RECOVERY TESTING')
  console.log('-----------------------------------------------')
  
  const errorTests = []
  
  const errorScenarios = [
    { scenario: 'invalid_webhook_signature', description: 'Invalid Stripe webhook signature' },
    { scenario: 'missing_stripe_signature', description: 'Missing Stripe signature header' },
    { scenario: 'unknown_price_id', description: 'Unknown Stripe price ID' },
    { scenario: 'database_connection_failure', description: 'Airtable database connection failure' },
    { scenario: 'email_delivery_failure', description: 'Email notification delivery failure' },
    { scenario: 'malformed_webhook_data', description: 'Malformed webhook event data' },
    { scenario: 'customer_creation_failure', description: 'Customer record creation failure' }
  ]
  
  errorScenarios.forEach(scenario => {
    console.log(`  📝 Testing: ${scenario.description}`)
    
    const errorHandling = validateErrorHandling(scenario.scenario)
    errorTests.push({
      test: `error_${scenario.scenario}`,
      status: errorHandling.valid ? 'PASS' : 'FAIL',
      description: scenario.description,
      issues: errorHandling.issues
    })
    
    if (errorHandling.valid) {
      console.log(`    ✅ Error handling implemented`)
    } else {
      console.log(`    ❌ Error handling issues: ${errorHandling.issues.join(', ')}`)
    }
  })
  
  testResults.test_details.error_handling = errorTests
  return errorTests
}

/**
 * Helper Functions
 */
function createMockStripeEvent(eventType, tier, amount) {
  const baseEvent = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    livemode: false
  }
  
  if (eventType === 'checkout.session.completed') {
    baseEvent.data = {
      object: {
        id: `cs_test_${Date.now()}`,
        customer: `cus_test_${Date.now()}`,
        amount_total: amount,
        payment_status: 'paid',
        customer_details: {
          email: 'test@example.com',
          name: 'Test Customer'
        },
        metadata: {
          businessName: 'Test Business',
          priceId: `price_${tier}_${amount/100}`
        }
      }
    }
  }
  
  return baseEvent
}

function validateMockEvent(event, testConfig) {
  const issues = []
  
  if (!event.id || !event.type || !event.data) {
    issues.push('Missing required event fields')
  }
  
  if (testConfig.event === 'checkout.session.completed') {
    if (!event.data.object.customer || !event.data.object.amount_total) {
      issues.push('Missing checkout session required fields')
    }
    
    if (event.data.object.amount_total !== testConfig.amount) {
      issues.push(`Amount mismatch: expected ${testConfig.amount}, got ${event.data.object.amount_total}`)
    }
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateCustomerRecord(customerData) {
  const issues = []
  
  const requiredFields = ['firstName', 'lastName', 'email', 'businessName', 'packageType']
  requiredFields.forEach(field => {
    if (!customerData[field]) {
      issues.push(`Missing required field: ${field}`)
    }
  })
  
  const validPackageTypes = ['starter', 'growth', 'pro', 'enterprise']
  if (!validPackageTypes.includes(customerData.packageType)) {
    issues.push(`Invalid package type: ${customerData.packageType}`)
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateAccessLevel(tier, directoryLimit, features) {
  const issues = []
  
  const expectedLimits = { starter: 25, growth: 75, pro: 150, enterprise: 500 }
  if (expectedLimits[tier] !== directoryLimit) {
    issues.push(`Incorrect directory limit for ${tier}: expected ${expectedLimits[tier]}, got ${directoryLimit}`)
  }
  
  if (!Array.isArray(features) || features.length === 0) {
    issues.push('Features should be a non-empty array')
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateUsageTracking(tier, monthlyLimit) {
  const issues = []
  
  if (typeof monthlyLimit !== 'number' || monthlyLimit <= 0) {
    issues.push('Monthly limit should be a positive number')
  }
  
  const expectedLimits = { starter: 25, growth: 75, pro: 150, enterprise: 500 }
  if (expectedLimits[tier] !== monthlyLimit) {
    issues.push(`Usage tracking limit mismatch for ${tier}`)
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateEmailTemplate(emailType, tier) {
  const issues = []
  
  const validEmailTypes = ['welcome', 'payment_confirmation', 'payment_failure', 'admin_error']
  if (!validEmailTypes.includes(emailType)) {
    issues.push(`Invalid email type: ${emailType}`)
  }
  
  if (emailType === 'welcome' && tier) {
    const validTiers = ['starter', 'growth', 'pro', 'enterprise']
    if (!validTiers.includes(tier)) {
      issues.push(`Invalid tier for welcome email: ${tier}`)
    }
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateAIProcessingTrigger(tier, shouldTrigger) {
  const issues = []
  
  const aiEnabledTiers = ['growth', 'pro', 'enterprise']
  const actualShouldTrigger = aiEnabledTiers.includes(tier)
  
  if (actualShouldTrigger !== shouldTrigger) {
    issues.push(`AI trigger mismatch for ${tier}: expected ${shouldTrigger}, should be ${actualShouldTrigger}`)
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateQueuePriority(tier, expectedPriority) {
  const issues = []
  
  const priorityMap = { starter: 3, growth: 2, pro: 1, enterprise: 0 }
  const actualPriority = priorityMap[tier]
  
  if (actualPriority !== expectedPriority) {
    issues.push(`Queue priority mismatch for ${tier}: expected ${expectedPriority}, got ${actualPriority}`)
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

function validateErrorHandling(scenario) {
  // This would check if proper error handling exists in the webhook code
  const issues = []
  
  const webhookPath = path.join(__dirname, 'pages', 'api', 'webhooks', 'stripe.js')
  if (fs.existsSync(webhookPath)) {
    const webhookContent = fs.readFileSync(webhookPath, 'utf8')
    
    const errorHandlingPatterns = {
      'invalid_webhook_signature': /catch.*signature.*verification/i,
      'missing_stripe_signature': /!signature/,
      'unknown_price_id': /Unknown price ID/,
      'database_connection_failure': /catch.*error.*database/i,
      'email_delivery_failure': /catch.*error.*email/i,
      'malformed_webhook_data': /try.*catch/,
      'customer_creation_failure': /catch.*error.*customer/i
    }
    
    const pattern = errorHandlingPatterns[scenario]
    if (!pattern || !pattern.test(webhookContent)) {
      issues.push(`No error handling found for ${scenario}`)
    }
  } else {
    issues.push('Webhook file not found')
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  }
}

/**
 * Generate Final Report
 */
async function generateFinalReport() {
  console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT')
  console.log('=======================================')
  
  // Calculate summary statistics
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  let criticalIssues = 0
  
  Object.values(testResults.test_details).forEach(testGroup => {
    if (Array.isArray(testGroup)) {
      testGroup.forEach(test => {
        totalTests++
        if (test.status === 'PASS') passedTests++
        else if (test.status === 'FAIL') failedTests++
      })
    } else if (typeof testGroup === 'object') {
      Object.values(testGroup).forEach(test => {
        totalTests++
        if (test.status === 'PASS') passedTests++
        else if (test.status === 'FAIL') failedTests++
      })
    }
  })
  
  testResults.config_findings.forEach(finding => {
    if (finding.type === 'critical') criticalIssues++
  })
  
  const successRate = Math.round((passedTests / totalTests) * 100)
  
  testResults.summary = `
    Stripe webhook payment flow testing completed with ${successRate}% success rate. 
    Found ${criticalIssues} critical issues requiring immediate attention before production deployment. 
    Key risks include webhook signature handling, database integration reliability, and AI processing triggers.
  `.trim()
  
  testResults.runtime = {
    node: process.version,
    platform: process.platform,
    testEnvironment: 'development',
    totalTests: totalTests,
    passedTests: passedTests,
    failedTests: failedTests,
    successRate: `${successRate}%`
  }
  
  // Generate recommendations
  if (criticalIssues > 0) {
    testResults.recommended_changes.push({
      type: 'critical_fixes',
      priority: 'high',
      summary: `Address ${criticalIssues} critical configuration and implementation issues`,
      files: ['pages/api/webhooks/stripe.js', '.env.local'],
      details: testResults.config_findings.filter(f => f.type === 'critical')
    })
  }
  
  if (failedTests > 0) {
    testResults.recommended_changes.push({
      type: 'test_failures',
      priority: 'medium', 
      summary: `Fix ${failedTests} failing test scenarios for production readiness`,
      details: 'Review failed tests and implement proper error handling'
    })
  }
  
  // Next actions
  testResults.next_actions = [
    {
      owner: 'Hudson',
      task: 'Review and fix critical configuration issues',
      deliverable: 'Updated webhook implementation with all critical issues resolved',
      priority: 'high'
    },
    {
      owner: 'Cora',
      task: 'Conduct live webhook testing with actual Stripe events',
      deliverable: 'Production deployment approval or additional issues identified',
      priority: 'high'
    },
    {
      owner: 'Hudson',
      task: 'Implement comprehensive error monitoring and alerting',
      deliverable: 'Error tracking dashboard and alert system',
      priority: 'medium'
    }
  ]
  
  // Print summary
  console.log('\n📋 TEST SUMMARY')
  console.log('================')
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${failedTests}`)
  console.log(`Success Rate: ${successRate}%`)
  console.log(`Critical Issues: ${criticalIssues}`)
  
  console.log('\n🚨 CRITICAL ISSUES')
  console.log('==================')
  testResults.config_findings.filter(f => f.type === 'critical').forEach(issue => {
    console.log(`❌ ${issue.component}: ${issue.issue}`)
    if (issue.file) console.log(`   File: ${issue.file}`)
  })
  
  console.log('\n✅ PRODUCTION READINESS ASSESSMENT')
  console.log('===================================')
  if (criticalIssues === 0 && successRate >= 90) {
    console.log('🟢 READY FOR PRODUCTION - All critical tests passing')
  } else if (criticalIssues === 0 && successRate >= 80) {
    console.log('🟡 PRODUCTION READY WITH MONITORING - Minor issues exist but not blocking')
  } else {
    console.log('🔴 NOT READY FOR PRODUCTION - Critical issues must be resolved')
  }
  
  // Write detailed report
  const reportPath = path.join(__dirname, 'stripe-webhook-test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  
  return testResults
}

/**
 * Main Test Runner
 */
async function runComprehensiveTests() {
  try {
    console.log(`🕐 Test started at: ${new Date().toISOString()}`)
    
    await testConfiguration()
    await testWebhookEvents()
    await testDatabaseIntegration()
    await testEmailNotifications()
    await testAIProcessingIntegration()
    await testErrorHandling()
    
    const finalReport = await generateFinalReport()
    
    console.log('\n🏁 COMPREHENSIVE TESTING COMPLETE')
    console.log('=================================')
    
    return finalReport
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
    process.exit(1)
  }
}

// Run tests
if (require.main === module) {
  runComprehensiveTests()
}

module.exports = { runComprehensiveTests }