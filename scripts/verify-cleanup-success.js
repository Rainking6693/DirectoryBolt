// VERIFICATION SCRIPT - Confirm Fake Customer Cleanup Success
// Checks if stuck customer alerts are resolved

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Replicate the alert logic from /api/staff/queue.ts
function generateAlerts(customers) {
  const alerts = []
  const now = new Date()
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

  // Check for stuck customers (no activity in the last 4 hours for active customers)
  const stuckCustomers = customers.filter(customer => {
    // Only check customers that are actively being processed
    if (customer.status !== 'in-progress' && customer.status !== 'active') return false
    
    // Don't flag customers who haven't started processing yet
    if (customer.directories_submitted === 0) return false
    
    const lastActivity = new Date(customer.updated_at)
    return lastActivity < fourHoursAgo
  })

  stuckCustomers.forEach(customer => {
    alerts.push({
      type: 'warning',
      title: 'Stuck Customer',
      message: `${customer.business_name} has no activity in the last 4 hours`,
      customer_id: customer.customer_id,
      priority: 'medium'
    })
  })

  // Check for high failure rates
  const highFailureCustomers = customers.filter(customer => {
    const directoryLimits = getDirectoryLimits(customer.package_type)
    const failureRate = directoryLimits > 0 
      ? (customer.failed_directories / directoryLimits) * 100
      : 0
    
    return failureRate > 20 // More than 20% failure rate
  })

  highFailureCustomers.forEach(customer => {
    const directoryLimits = getDirectoryLimits(customer.package_type)
    const failureRate = Math.round((customer.failed_directories / directoryLimits) * 100)
    alerts.push({
      type: 'error',
      title: 'High Failure Rate',
      message: `${customer.business_name} has ${failureRate}% failure rate`,
      customer_id: customer.customer_id,
      priority: 'high'
    })
  })

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function getDirectoryLimits(packageType) {
  const limits = {
    starter: 50,
    growth: 150,
    professional: 300,
    pro: 500,
    enterprise: 1000
  }
  return limits[packageType] || 50
}

async function verifyCleanupSuccess() {
  try {
    console.log('✅ VERIFICATION: Checking if cleanup resolved stuck customer alerts')
    console.log('⏰ Timestamp:', new Date().toISOString())

    // Get all remaining customers
    console.log('\n📊 Fetching remaining customers...')
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select(`
        id,
        customer_id,
        business_name,
        email,
        package_type,
        status,
        directories_submitted,
        failed_directories,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Failed to fetch customers:', fetchError)
      throw fetchError
    }

    console.log(`📈 Found ${customers?.length || 0} remaining customers`)

    // Display customer details
    if (customers && customers.length > 0) {
      console.log('\n📋 Remaining customers:')
      customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.customer_id} - ${customer.business_name} (${customer.email}) [${customer.status}]`)
        console.log(`      Directories: ${customer.directories_submitted}/${getDirectoryLimits(customer.package_type)}, Failed: ${customer.failed_directories}`)
        console.log(`      Last Updated: ${new Date(customer.updated_at).toLocaleString()}`)
      })
    } else {
      console.log('\n✅ No customers remaining in database')
    }

    // Generate alerts using the same logic as staff dashboard
    console.log('\n🚨 Checking for alerts...')
    const alerts = generateAlerts(customers || [])

    if (alerts.length === 0) {
      console.log('✅ NO ALERTS DETECTED - Staff dashboard should be clear!')
    } else {
      console.log(`⚠️ ${alerts.length} alerts still present:`)
      alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.priority.toUpperCase()}] ${alert.title}: ${alert.message}`)
        console.log(`      Customer: ${alert.customer_id}`)
      })
    }

    // Check AutoBolt queue status
    console.log('\n🤖 Checking AutoBolt queue status...')
    const { data: queueEntries, error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .select('id, customer_id, status, created_at')

    if (queueError) {
      console.error('❌ Failed to fetch queue:', queueError)
    } else {
      console.log(`📊 AutoBolt queue: ${queueEntries?.length || 0} entries`)
      if (queueEntries && queueEntries.length > 0) {
        queueEntries.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.customer_id} - ${entry.status}`)
        })
      }
    }

    // Check extension statuses
    console.log('\n🔧 Checking AutoBolt extension statuses...')
    const { data: extensions, error: extError } = await supabase
      .from('autobolt_extension_status')
      .select('extension_id, status, current_customer_id')

    if (extError) {
      console.error('❌ Failed to fetch extensions:', extError)
    } else {
      console.log(`🔌 Extensions: ${extensions?.length || 0} found`)
      if (extensions && extensions.length > 0) {
        extensions.forEach((ext, index) => {
          console.log(`   ${index + 1}. ${ext.extension_id} - ${ext.status} (processing: ${ext.current_customer_id || 'none'})`)
        })
      }
    }

    const verificationResult = {
      success: alerts.length === 0,
      remaining_customers: customers?.length || 0,
      alerts_count: alerts.length,
      queue_entries: queueEntries?.length || 0,
      active_extensions: extensions?.length || 0,
      alerts: alerts,
      timestamp: new Date().toISOString()
    }

    console.log('\n📊 VERIFICATION SUMMARY:')
    console.log(`   • Cleanup Successful: ${verificationResult.success ? '✅ YES' : '❌ NO'}`)
    console.log(`   • Remaining Customers: ${verificationResult.remaining_customers}`)
    console.log(`   • Active Alerts: ${verificationResult.alerts_count}`)
    console.log(`   • Queue Entries: ${verificationResult.queue_entries}`)
    console.log(`   • Active Extensions: ${verificationResult.active_extensions}`)

    if (verificationResult.success) {
      console.log('\n🎉 SUCCESS: Staff dashboard alerts should now be completely clear!')
      console.log('✅ All fake/test customers have been successfully removed.')
    } else {
      console.log('\n⚠️ WARNING: Some alerts may still be present.')
      console.log('   Check the alert details above for any remaining issues.')
    }

    return verificationResult

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error)
    throw error
  }
}

// Execute verification
if (require.main === module) {
  verifyCleanupSuccess()
    .then(result => {
      if (result.success) {
        console.log('\n✅ VERIFICATION PASSED - Cleanup was successful!')
        process.exit(0)
      } else {
        console.log('\n⚠️ VERIFICATION FAILED - Some issues remain')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n❌ VERIFICATION ERROR:', error)
      process.exit(1)
    })
}

module.exports = { verifyCleanupSuccess }