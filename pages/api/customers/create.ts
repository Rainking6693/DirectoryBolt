import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// BYPASS MODE: In-memory storage for testing when Supabase not configured
const inMemoryCustomers = new Map<string, any>()

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

interface CreateCustomerRequest {
  firstName: string
  lastName: string
  businessName: string
  email: string
  phone?: string
  website?: string
  packageType?: string
  directoryLimit?: number
}

interface CreateCustomerResponse {
  success: boolean
  customer?: any
  customerId?: string
  error?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCustomerResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // Check staff/admin authentication
    const authHeader = req.headers.authorization
    const staffSession = req.cookies.staff_session
    const adminKey = req.headers['x-admin-key']
    
    const validStaffKey = process.env.STAFF_API_KEY
    const validAdminKey = process.env.ADMIN_API_KEY
    
    const isStaffAuth = authHeader === `Bearer ${validStaffKey}` || !!staffSession
    const isAdminAuth = adminKey === validAdminKey || authHeader === `Bearer ${validAdminKey}`
    
    if (!isStaffAuth && !isAdminAuth) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Staff or admin authentication required'
      })
    }
    
    const data: CreateCustomerRequest = req.body
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.businessName || !data.email) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'First name, last name, business name, and email are required'
      })
    }
    
    // BYPASS MODE: Use Supabase if configured, otherwise in-memory
    let customer: any
    
    if (supabase) {
      // Real Supabase insert
      const { data: customerData, error } = await supabase
        .from('customers')
        .insert({
          firstName: data.firstName,
          lastName: data.lastName,
          businessName: data.businessName,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          packageType: data.packageType || 'STARTER',
          directoryLimit: data.directoryLimit || 25,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Failed to create customer in Supabase:', error)
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message
        })
      }
      
      customer = customerData
      console.log(`✅ Customer created in Supabase: ${customer.id}`)
      
    } else {
      // In-memory bypass for testing
      const customerId = `test-customer-${Date.now()}`
      customer = {
        id: customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        packageType: data.packageType || 'STARTER',
        directoryLimit: data.directoryLimit || 25,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      inMemoryCustomers.set(customerId, customer)
      console.log(`⚠️  Customer created IN-MEMORY (Supabase not configured): ${customerId}`)
      console.warn('🔶 DEFERRED: Set SUPABASE_SERVICE_ROLE_KEY to use real database')
    }
    
    return res.status(201).json({
      success: true,
      customer,
      customerId: customer.id
    })
    
  } catch (error) {
    console.error('❌ Customer creation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

