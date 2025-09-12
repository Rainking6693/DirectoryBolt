#!/usr/bin/env node

/**
 * DirectoryBolt Google Sheets Integration Test for Netlify Production
 * 
 * Tests the Google Sheets service with the same environment variables
 * that will be available in Netlify Functions.
 * 
 * Run: node test-google-sheets-netlify.js
 */

const { createGoogleSheetsService } = require('./lib/services/google-sheets')

async function testGoogleSheetsIntegration() {
  console.log('🧪 Testing DirectoryBolt Google Sheets Integration for Netlify')
  console.log('=' .repeat(60))
  
  const startTime = Date.now()
  
  try {
    // Test 1: Environment Variables Check
    console.log('\n📋 1. Checking Environment Variables...')
    
    const envVars = {
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY
    }
    
    console.log('   - GOOGLE_SHEET_ID:', envVars.GOOGLE_SHEET_ID || '❌ MISSING')
    console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL:', envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL || '❌ MISSING')
    console.log('   - GOOGLE_PRIVATE_KEY:', envVars.GOOGLE_PRIVATE_KEY ? '✅ PROVIDED' : '❌ MISSING')
    
    if (!envVars.GOOGLE_SHEET_ID || !envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL || !envVars.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing required environment variables. Check your .env.local file.')
    }
    
    console.log('✅ Environment variables check passed')
    
    // Test 2: Service Initialization
    console.log('\n🔧 2. Initializing Google Sheets Service...')
    
    const googleSheetsService = createGoogleSheetsService()
    await googleSheetsService.initialize()
    
    console.log('✅ Google Sheets service initialized successfully')
    console.log(`   - Sheet Title: ${googleSheetsService.sheet.title}`)
    console.log(`   - Sheet ID: ${googleSheetsService.config.spreadsheetId}`)
    console.log(`   - Row Count: ${googleSheetsService.sheet.rowCount}`)
    
    // Test 3: Health Check
    console.log('\n🏥 3. Running Health Check...')
    
    const healthCheck = await googleSheetsService.healthCheck()
    console.log(`✅ Health check result: ${healthCheck}`)
    
    // Test 4: Test Customer Creation
    console.log('\n👤 4. Testing Customer Creation...')
    
    const testCustomer = {
      customerId: `TEST-${Date.now()}`,
      firstName: 'Test',
      lastName: 'Customer',
      businessName: 'Test Business LLC',
      email: 'test@example.com',
      packageType: 'starter',
      submissionStatus: 'pending'
    }
    
    const createdRecord = await googleSheetsService.createBusinessSubmission(testCustomer)
    console.log('✅ Test customer created successfully')
    console.log(`   - Customer ID: ${createdRecord.customerId}`)
    console.log(`   - Record ID: ${createdRecord.recordId}`)
    
    // Test 5: Test Customer Lookup
    console.log('\n🔍 5. Testing Customer Lookup...')
    
    const foundCustomer = await googleSheetsService.findByCustomerId(testCustomer.customerId)
    if (foundCustomer) {
      console.log('✅ Customer lookup successful')
      console.log(`   - Found Customer: ${foundCustomer.businessName}`)
      console.log(`   - Email: ${foundCustomer.email}`)
    } else {
      throw new Error('Failed to find test customer')
    }
    
    // Test 6: Test Status Update
    console.log('\n🔄 6. Testing Status Update...')
    
    const updatedRecord = await googleSheetsService.updateSubmissionStatus(
      testCustomer.customerId,
      'in-progress',
      5,
      1
    )
    console.log('✅ Status update successful')
    console.log(`   - Status: ${updatedRecord.submissionStatus}`)
    
    // Test 7: Test Status Filtering
    console.log('\n📊 7. Testing Status Filtering...')
    
    const pendingCustomers = await googleSheetsService.findByStatus('pending')
    console.log(`✅ Status filtering successful`)
    console.log(`   - Found ${pendingCustomers.length} pending customers`)
    
    // Final Success
    const totalTime = Date.now() - startTime
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log(`⏱️  Total execution time: ${totalTime}ms`)
    console.log('\n✅ Google Sheets integration is ready for Netlify deployment!')
    console.log('\nNext steps:')
    console.log('1. Set the same environment variables in Netlify dashboard')
    console.log('2. Deploy to Netlify')
    console.log('3. Test the /api/health/google-sheets endpoint')
    
    process.exit(0)
    
  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ TEST FAILED!')
    console.error('\n💥 Error details:')
    console.error('   - Message:', error.message)
    console.error('   - Stack:', error.stack?.substring(0, 500))
    
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check your .env.local file exists and has all variables')
    console.error('2. Verify Google Sheets API is enabled')
    console.error('3. Confirm service account has access to the spreadsheet')
    console.error('4. Ensure private key is properly formatted with newlines')
    
    process.exit(1)
  }
}

// Run the test
testGoogleSheetsIntegration()