// Admin API - Cleanup Test/Fake Customers
// Removes all test customers and creates one real test customer for validation

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧹 Starting cleanup of test/fake customers')

    // First, get all existing customers to identify test data
    const { data: allCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, customer_id, business_name, email')

    if (fetchError) {
      console.error('❌ Failed to fetch customers:', fetchError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch customers for cleanup'
      })
    }

    // Identify test customers (customers with test/fake data patterns)
    const testCustomers = allCustomers?.filter(customer => 
      customer.customer_id?.includes('TEST') ||
      customer.business_name?.toLowerCase().includes('test') ||
      customer.email?.includes('test') ||
      customer.business_name?.toLowerCase().includes('fake') ||
      customer.business_name?.toLowerCase().includes('demo')
    ) || []

    console.log(`🔍 Found ${testCustomers.length} test customers to remove`)

    // Remove test customers from customers table
    if (testCustomers.length > 0) {
      const testCustomerIds = testCustomers.map(c => c.customer_id)
      
      const { error: deleteCustomersError } = await supabase
        .from('customers')
        .delete()
        .in('customer_id', testCustomerIds)

      if (deleteCustomersError) {
        console.error('❌ Failed to delete test customers:', deleteCustomersError)
      } else {
        console.log(`✅ Removed ${testCustomers.length} test customers`)
      }

      // Also cleanup from autobolt_processing_queue
      const { error: deleteQueueError } = await supabase
        .from('autobolt_processing_queue')
        .delete()
        .in('customer_id', testCustomerIds)

      if (deleteQueueError) {
        console.error('❌ Failed to cleanup test customers from queue:', deleteQueueError)
      } else {
        console.log(`✅ Cleaned up test customers from processing queue`)
      }
    }

    // Create ONE real test customer for validation
    const realTestCustomer = {
      customer_id: 'DIR-2025-REAL001',
      business_name: 'DirectoryBolt Validation Business',
      email: 'validation@directorybolt.com',
      package_type: 'growth',
      status: 'pending',
      directories_submitted: 0,
      failed_directories: 0,
      business_data: {
        firstName: 'Validation',
        lastName: 'Customer',
        phone: '+1-555-0100',
        address: '123 Validation Street',
        city: 'Test City',
        state: 'CA',
        zip: '90210',
        website: 'https://validation-business.com',
        description: 'Real validation customer for DirectoryBolt testing',
        facebook: 'https://facebook.com/validationbusiness',
        instagram: 'https://instagram.com/validationbusiness',
        linkedin: 'https://linkedin.com/company/validationbusiness'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Check if validation customer already exists
    const { data: existingValidation } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('customer_id', realTestCustomer.customer_id)
      .single()

    if (!existingValidation) {
      const { data: createdCustomer, error: createError } = await supabase
        .from('customers')
        .insert([realTestCustomer])
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create validation customer:', createError)
      } else {
        console.log('✅ Created real validation customer:', createdCustomer.customer_id)
      }
    } else {
      console.log('✅ Validation customer already exists')
    }

    // Get final customer count
    const { data: finalCustomers, error: finalCountError } = await supabase
      .from('customers')
      .select('id', { count: 'exact' })

    const finalCount = finalCustomers?.length || 0

    console.log('✅ Customer cleanup completed')

    return res.status(200).json({
      success: true,
      message: 'Test customer cleanup completed successfully',
      summary: {
        test_customers_removed: testCustomers.length,
        final_customer_count: finalCount,
        validation_customer_created: !existingValidation,
        validation_customer_id: realTestCustomer.customer_id
      },
      removed_customers: testCustomers.map(c => ({
        customer_id: c.customer_id,
        business_name: c.business_name
      }))
    })

  } catch (error) {
    console.error('❌ Customer cleanup error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cleanup test customers',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Export with staff authentication
export default withStaffAuth(handler)