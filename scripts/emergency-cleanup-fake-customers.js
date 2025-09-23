// EMERGENCY SCRIPT - Remove ALL Fake/Test Customers Immediately
// Run this to resolve stuck customer alerts on staff dashboard

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Comprehensive patterns to identify fake/test data
const FAKE_DATA_PATTERNS = {
  customer_ids: ['TEST', 'FAKE', 'DEMO', 'SAMPLE', 'DIR-2025-000', 'REAL001'],
  emails: ['test@', 'fake@', 'demo@', 'sample@', 'noreply@', 'example@', 'temp@', '.test', 'validation@'],
  business_names: ['test', 'fake', 'demo', 'sample', 'example', 'temp', 'default', 'placeholder', 'validation', 'directorybolt'],
  domains: ['test.com', 'fake.com', 'demo.com', 'example.com', 'placeholder.com', 'temp.com']
}

async function emergencyCleanup() {
  try {
    console.log('🚨 EMERGENCY CLEANUP: Starting comprehensive removal of ALL fake/test customers')
    console.log('⏰ Timestamp:', new Date().toISOString())

    // Step 1: Get ALL customers to identify test patterns
    console.log('\n📊 Fetching all customers...')
    const { data: allCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, customer_id, business_name, email, status, package_type, directories_submitted, failed_directories, created_at, updated_at')

    if (fetchError) {
      console.error('❌ Failed to fetch customers:', fetchError)
      throw fetchError
    }

    console.log(`📈 Found ${allCustomers?.length || 0} total customers to analyze`)

    // Step 2: Identify ALL fake/test customers using comprehensive patterns
    const testCustomers = allCustomers?.filter(customer => {
      const businessName = customer.business_name?.toLowerCase() || ''
      const email = customer.email?.toLowerCase() || ''
      const customerId = customer.customer_id?.toUpperCase() || ''
      
      return (
        // Customer ID patterns
        FAKE_DATA_PATTERNS.customer_ids.some(pattern => customerId.includes(pattern)) ||
        
        // Email patterns
        FAKE_DATA_PATTERNS.emails.some(pattern => email.includes(pattern)) ||
        
        // Business name patterns
        FAKE_DATA_PATTERNS.business_names.some(pattern => businessName.includes(pattern)) ||
        
        // Additional suspicious patterns
        businessName.includes('company') && businessName.length < 10 ||
        email.includes('test') ||
        
        // Stuck processing patterns (likely test data)
        (customer.status === 'in-progress' && customer.directories_submitted === 0) ||
        (customer.status === 'active' && customer.directories_submitted === 0 && 
         new Date(customer.updated_at) < new Date(Date.now() - 4 * 60 * 60 * 1000)) // No activity for 4+ hours
      )
    }) || []

    console.log(`\n🔍 IDENTIFIED ${testCustomers.length} fake/test customers for removal:`)
    testCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.customer_id} - ${customer.business_name} (${customer.email}) [${customer.status}]`)
    })

    let cleanupResults = {
      customers_removed: 0,
      queue_entries_removed: 0,
      directory_submissions_removed: 0,
      notifications_removed: 0,
      history_entries_removed: 0,
      analytics_removed: 0,
      extensions_reset: 0,
      errors: []
    }

    if (testCustomers.length === 0) {
      console.log('\n✅ No fake/test customers found - database is clean!')
      return cleanupResults
    }

    const testCustomerIds = testCustomers.map(c => c.customer_id)
    
    // Step 3: Remove from customers table (primary cleanup)
    console.log('\n🗑️ Removing fake customers from main customers table...')
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('customer_id', testCustomerIds)

    if (deleteCustomersError) {
      console.error('❌ Failed to delete test customers:', deleteCustomersError)
      cleanupResults.errors.push(`Customers table: ${deleteCustomersError.message}`)
    } else {
      cleanupResults.customers_removed = testCustomers.length
      console.log(`✅ Removed ${testCustomers.length} fake customers from customers table`)
    }

    // Step 4: Remove from autobolt_processing_queue
    console.log('\n🤖 Cleaning autobolt processing queue...')
    const { error: deleteQueueError } = await supabase
      .from('autobolt_processing_queue')
      .delete()
      .in('customer_id', testCustomerIds)

    if (deleteQueueError) {
      console.error('❌ Failed to cleanup autobolt queue:', deleteQueueError)
      cleanupResults.errors.push(`AutoBolt queue: ${deleteQueueError.message}`)
    } else {
      console.log(`✅ Cleaned autobolt processing queue`)
    }

    // Step 5: Remove from directory_submissions
    console.log('\n📁 Cleaning directory submissions...')
    const { error: deleteSubmissionsError } = await supabase
      .from('directory_submissions')
      .delete()
      .in('customer_id', testCustomerIds)

    if (deleteSubmissionsError) {
      console.error('❌ Failed to cleanup directory submissions:', deleteSubmissionsError)
      cleanupResults.errors.push(`Directory submissions: ${deleteSubmissionsError.message}`)
    } else {
      console.log(`✅ Cleaned directory submissions`)
    }

    // Step 6: Remove from customer_notifications
    console.log('\n🔔 Cleaning customer notifications...')
    const { error: deleteNotificationsError } = await supabase
      .from('customer_notifications')
      .delete()
      .in('customer_id', testCustomerIds)

    if (deleteNotificationsError) {
      console.error('❌ Failed to cleanup notifications:', deleteNotificationsError)
      cleanupResults.errors.push(`Notifications: ${deleteNotificationsError.message}`)
    } else {
      console.log(`✅ Cleaned customer notifications`)
    }

    // Step 7: Remove from queue_history
    console.log('\n📜 Cleaning queue history...')
    const { error: deleteHistoryError } = await supabase
      .from('queue_history')
      .delete()
      .in('customer_id', testCustomerIds)

    if (deleteHistoryError) {
      console.error('❌ Failed to cleanup queue history:', deleteHistoryError)
      cleanupResults.errors.push(`Queue history: ${deleteHistoryError.message}`)
    } else {
      console.log(`✅ Cleaned queue history`)
    }

    // Step 8: Remove from analytics_events
    console.log('\n📊 Cleaning analytics events...')
    const { error: deleteAnalyticsError } = await supabase
      .from('analytics_events')
      .delete()
      .in('customer_id', testCustomerIds)

    if (deleteAnalyticsError) {
      console.error('❌ Failed to cleanup analytics:', deleteAnalyticsError)
      cleanupResults.errors.push(`Analytics events: ${deleteAnalyticsError.message}`)
    } else {
      console.log(`✅ Cleaned analytics events`)
    }

    // Step 9: Reset any stuck AutoBolt extension statuses
    console.log('\n🔄 Resetting stuck AutoBolt extension statuses...')
    const { error: resetExtensionError } = await supabase
      .from('autobolt_extension_status')
      .update({ 
        status: 'offline',
        current_customer_id: null,
        current_queue_id: null,
        processing_started_at: null,
        error_message: 'Reset during emergency cleanup',
        updated_at: new Date().toISOString()
      })
      .neq('status', 'offline')

    if (resetExtensionError) {
      console.error('❌ Failed to reset extension statuses:', resetExtensionError)
      cleanupResults.errors.push(`Extension reset: ${resetExtensionError.message}`)
    } else {
      console.log(`✅ Reset stuck AutoBolt extension statuses`)
    }

    // Step 10: Get final statistics
    console.log('\n📊 Getting final statistics...')
    const { data: finalCustomers, error: finalCountError } = await supabase
      .from('customers')
      .select('id, status', { count: 'exact' })

    const finalCount = finalCustomers?.length || 0
    const activeCount = finalCustomers?.filter(c => c.status === 'active')?.length || 0
    const inProgressCount = finalCustomers?.filter(c => c.status === 'in-progress')?.length || 0
    
    // Step 11: Final queue status check
    const { data: queueCount } = await supabase
      .from('autobolt_processing_queue')
      .select('id', { count: 'exact' })

    console.log('\n🎉 EMERGENCY CLEANUP COMPLETED SUCCESSFULLY!')
    console.log(`📊 Final Stats: ${finalCount} customers remaining, ${activeCount} active, ${inProgressCount} in-progress`)
    console.log(`🔗 AutoBolt queue: ${queueCount?.length || 0} entries remaining`)

    if (cleanupResults.errors.length > 0) {
      console.log('\n⚠️ Cleanup completed with errors:')
      cleanupResults.errors.forEach(error => console.log(`   • ${error}`))
    }

    console.log('\n✅ Staff dashboard alerts should now be cleared!')
    
    return {
      success: true,
      cleanup_results: cleanupResults,
      final_statistics: {
        total_customers_remaining: finalCount,
        active_customers: activeCount,
        in_progress_customers: inProgressCount,
        autobolt_queue_entries: queueCount?.length || 0
      },
      removed_customers: testCustomers.map(c => ({
        customer_id: c.customer_id,
        business_name: c.business_name,
        email: c.email,
        status: c.status
      })),
      patterns_used: FAKE_DATA_PATTERNS,
      cleanup_timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('\n🚨 EMERGENCY CLEANUP FAILED:', error)
    throw error
  }
}

// Execute the cleanup
if (require.main === module) {
  emergencyCleanup()
    .then(result => {
      console.log('\n✅ EMERGENCY CLEANUP COMPLETED SUCCESSFULLY')
      console.log('📊 Results:', JSON.stringify(result.final_statistics, null, 2))
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ EMERGENCY CLEANUP FAILED:', error)
      process.exit(1)
    })
}

module.exports = { emergencyCleanup, FAKE_DATA_PATTERNS }